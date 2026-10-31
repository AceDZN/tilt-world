// The jewel-box Earth: day/night from the Sun direction, twilight band, city lights, ocean glints,
// seasonal snow, clouds, atmosphere rim and procedural lat/long overlays that match the astronomy
// module exactly (the overlays are computed from the same lat/lon formulas).
import * as THREE from 'three';

export const PLANET_R = 12;

const vert = /* glsl */ `
varying vec3 vPos;
varying vec3 vWorld;
void main() {
  vPos = normalize(position);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const frag = /* glsl */ `
precision highp float;
uniform sampler2D dayTex;
uniform sampler2D nightTex;
uniform vec3 sunDir;
uniform float gridOn;
uniform float hintMeridian; // degrees, or -999
uniform float hintLat;      // degrees, or -999
uniform float hintTerminator;
uniform vec3 subsolar;      // unit vector, length 0 = off
uniform float snowN;        // snow line latitude in the north (degrees)
uniform float snowS;        // snow line latitude in the south (positive degrees)
uniform vec3 eclipseCenter;
uniform float eclipseRadius; // radians, 0 = off
uniform float dateLine;
uniform float railLat;      // grind rail latitude or -999
uniform float time;
uniform float fogged;
varying vec3 vPos;
varying vec3 vWorld;

const float PI = 3.14159265359;

float lineAA(float coordDeg, float stepDeg, float widthPx) {
  float f = coordDeg / stepDeg;
  float d = abs(fract(f - 0.5) - 0.5) * stepDeg;
  float w = fwidth(coordDeg) * widthPx;
  return 1.0 - smoothstep(0.0, w, d);
}
float bandAA(float coordDeg, float target, float widthPx) {
  float d = abs(coordDeg - target);
  float w = fwidth(coordDeg) * widthPx;
  return 1.0 - smoothstep(0.0, w, d);
}

void main() {
  vec3 n = normalize(vPos);
  float lat = degrees(asin(clamp(n.y, -1.0, 1.0)));
  float lon = degrees(atan(n.x, n.z));
  vec2 uv = vec2((lon + 180.0) / 360.0, (lat + 90.0) / 180.0);
  vec3 day = texture2D(dayTex, uv).rgb;
  vec3 night = texture2D(nightTex, uv).rgb;

  float ndl = dot(n, normalize(sunDir));
  float dayAmt = smoothstep(-0.06, 0.08, ndl);
  float ocean = smoothstep(0.02, 0.10, day.b - max(day.r, day.g) + 0.04) * (1.0 - smoothstep(0.35, 0.6, day.r));

  // seasonal snow on land
  float land = 1.0 - ocean;
  float snow = land * (smoothstep(snowN - 3.0, snowN + 3.0, lat) + smoothstep(snowS - 3.0, snowS + 3.0, -lat));
  day = mix(day, vec3(0.93, 0.96, 1.0), clamp(snow, 0.0, 1.0) * 0.85);

  // stylize: richer saturation
  float l = dot(day, vec3(0.299, 0.587, 0.114));
  day = mix(vec3(l), day, 1.25) * 1.12;

  vec3 viewDir = normalize(cameraPosition - vWorld);
  vec3 h = normalize(normalize(sunDir) + viewDir);
  float spec = pow(max(dot(n, h), 0.0), 60.0) * ocean * dayAmt;

  float lambert = clamp(ndl * 0.85 + 0.25, 0.0, 1.0);
  vec3 lit = day * (0.35 + 0.9 * lambert) + spec * vec3(1.0, 0.92, 0.75) * 1.4;
  vec3 dark = day * vec3(0.05, 0.07, 0.14) + night * vec3(1.35, 1.05, 0.65) * (1.0 - snow * 0.6);
  vec3 col = mix(dark, lit, dayAmt);

  // twilight band
  float tw = 1.0 - smoothstep(0.0, 0.11, abs(ndl));
  col += vec3(1.0, 0.42, 0.12) * tw * 0.55;
  col += vec3(1.0, 0.75, 0.4) * (1.0 - smoothstep(0.0, 0.02, abs(ndl))) * 0.35;

  // Where am I?: a cloud deck hides the continents
  if (fogged > 0.5) {
    float swirl = 0.5 + 0.5 * sin(lon * 0.21 + sin(lat * 0.17) * 3.0) * sin(lat * 0.13 + lon * 0.05);
    vec3 deck = mix(vec3(0.82, 0.86, 0.92), vec3(0.97), swirl);
    vec3 deckLit = deck * (0.12 + 0.95 * dayAmt) + vec3(1.0, 0.45, 0.2) * tw * 0.4;
    col = mix(col, deckLit, 0.94);
  }

  // eclipse shadow
  if (eclipseRadius > 0.0) {
    float d = acos(clamp(dot(n, normalize(eclipseCenter)), -1.0, 1.0));
    float umbra = 1.0 - smoothstep(eclipseRadius * 0.55, eclipseRadius, d);
    float pen = 1.0 - smoothstep(eclipseRadius, eclipseRadius * 2.4, d);
    col *= 1.0 - 0.82 * umbra - 0.25 * pen;
  }

  // overlays
  vec3 gridCol = vec3(0.55, 0.85, 1.0);
  float g = 0.0;
  if (gridOn > 0.5) {
    g = max(lineAA(lon, 15.0, 1.0), lineAA(lat, 15.0, 1.0)) * 0.22;
    float special = max(bandAA(lat, 0.0, 1.6), max(bandAA(abs(lat), 23.5, 1.4), bandAA(abs(lat), 66.5, 1.4)));
    col = mix(col, vec3(1.0, 0.85, 0.35), special * 0.6);
    float meridian0 = bandAA(lon, 0.0, 1.4);
    col = mix(col, gridCol, meridian0 * 0.5);
  }
  col = mix(col, gridCol, g);
  if (dateLine > 0.5) {
    float dl = bandAA(abs(lon), 180.0, 2.0) * step(0.5, fract(lat / 3.0));
    col = mix(col, vec3(1.0, 0.35, 0.55), dl * 0.9);
  }
  if (hintMeridian > -900.0) {
    float dlon = abs(mod(lon - hintMeridian + 540.0, 360.0) - 180.0);
    float m = 1.0 - smoothstep(0.0, fwidth(lon) * 2.5, dlon);
    col = mix(col, vec3(0.3, 1.0, 0.7), m * (0.7 + 0.3 * sin(time * 4.0)));
  }
  if (hintLat > -900.0) {
    float m = bandAA(lat, hintLat, 2.5);
    col = mix(col, vec3(0.3, 1.0, 0.7), m * (0.7 + 0.3 * sin(time * 4.0)));
  }
  if (railLat > -900.0) {
    float m = bandAA(lat, railLat, 2.0);
    col = mix(col, vec3(1.0, 0.8, 0.4), m * 0.8);
  }
  if (hintTerminator > 0.5) {
    float m = 1.0 - smoothstep(0.0, fwidth(ndl) * 3.0, abs(ndl));
    col = mix(col, vec3(1.0, 0.95, 0.4), m * (0.7 + 0.3 * sin(time * 4.0)));
  }
  if (length(subsolar) > 0.5) {
    float d = degrees(acos(clamp(dot(n, subsolar), -1.0, 1.0)));
    float ring = bandAA(d, 2.2, 2.0) + (1.0 - smoothstep(0.0, 0.8, d));
    col = mix(col, vec3(1.0, 0.95, 0.3), clamp(ring, 0.0, 1.0) * (0.75 + 0.25 * sin(time * 5.0)));
  }

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

const cloudFrag = /* glsl */ `
precision highp float;
uniform sampler2D cloudTex;
uniform vec3 sunDir;
uniform float spin;
varying vec3 vPos;
void main() {
  vec3 n = normalize(vPos);
  float lat = degrees(asin(clamp(n.y, -1.0, 1.0)));
  float lon = degrees(atan(n.x, n.z)) + spin;
  vec2 uv = vec2(fract((lon + 180.0) / 360.0), (lat + 90.0) / 180.0);
  float c = texture2D(cloudTex, uv).r;
  c = smoothstep(0.25, 0.85, c) * 0.85;
  float ndl = dot(n, normalize(sunDir));
  float dayAmt = smoothstep(-0.12, 0.15, ndl);
  vec3 col = mix(vec3(0.05, 0.06, 0.12), vec3(1.0), dayAmt);
  col = mix(col, vec3(1.0, 0.55, 0.3), (1.0 - smoothstep(0.0, 0.12, abs(ndl))) * 0.6);
  gl_FragColor = vec4(col, c * (0.25 + 0.75 * dayAmt));
  #include <colorspace_fragment>
}
`;

const atmoVert = /* glsl */ `
varying vec3 vN;
varying vec3 vWorld;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
const atmoFrag = /* glsl */ `
precision highp float;
uniform vec3 sunDir;
varying vec3 vN;
varying vec3 vWorld;
void main() {
  vec3 v = normalize(cameraPosition - vWorld);
  float rim = pow(1.0 - abs(dot(normalize(vN), v)), 2.2);
  float ndl = dot(normalize(vWorld), normalize(sunDir));
  vec3 dayC = vec3(0.35, 0.65, 1.0);
  vec3 twC = vec3(1.0, 0.5, 0.25);
  vec3 col = mix(twC, dayC, smoothstep(-0.05, 0.35, ndl));
  float a = rim * smoothstep(-0.35, 0.1, ndl) * 1.1;
  gl_FragColor = vec4(col * a, a);
  #include <colorspace_fragment>
}
`;

export interface Planet {
  group: THREE.Group;
  uniforms: Record<string, THREE.IUniform>;
  cloudUniforms: Record<string, THREE.IUniform>;
  atmoUniforms: Record<string, THREE.IUniform>;
  setSun(dir: THREE.Vector3): void;
}

export function createPlanet(tex: { day: THREE.Texture; night: THREE.Texture; clouds: THREE.Texture }): Planet {
  const group = new THREE.Group();
  for (const t of [tex.day, tex.night, tex.clouds]) {
    t.wrapS = THREE.RepeatWrapping;
    t.anisotropy = 8;
  }
  tex.day.colorSpace = THREE.SRGBColorSpace;
  tex.night.colorSpace = THREE.SRGBColorSpace;
  const uniforms: Record<string, THREE.IUniform> = {
    dayTex: { value: tex.day },
    nightTex: { value: tex.night },
    sunDir: { value: new THREE.Vector3(1, 0, 0) },
    gridOn: { value: 0 },
    hintMeridian: { value: -999 },
    hintLat: { value: -999 },
    hintTerminator: { value: 0 },
    subsolar: { value: new THREE.Vector3() },
    snowN: { value: 70 },
    snowS: { value: 70 },
    eclipseCenter: { value: new THREE.Vector3(0, 0, 1) },
    eclipseRadius: { value: 0 },
    dateLine: { value: 0 },
    railLat: { value: -999 },
    time: { value: 0 },
    fogged: { value: 0 },
  };
  const geo = new THREE.SphereGeometry(PLANET_R, 192, 128);
  const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms });
  const earth = new THREE.Mesh(geo, mat);
  group.add(earth);

  const cloudUniforms: Record<string, THREE.IUniform> = {
    cloudTex: { value: tex.clouds },
    sunDir: uniforms.sunDir,
    spin: { value: 0 },
  };
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(PLANET_R * 1.035, 128, 96),
    new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: cloudFrag, uniforms: cloudUniforms, transparent: true, depthWrite: false }),
  );
  clouds.renderOrder = 2;
  group.add(clouds);

  const atmoUniforms: Record<string, THREE.IUniform> = { sunDir: uniforms.sunDir };
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(PLANET_R * 1.055, 96, 64),
    new THREE.ShaderMaterial({
      vertexShader: atmoVert,
      fragmentShader: atmoFrag,
      uniforms: atmoUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  atmo.renderOrder = 3;
  group.add(atmo);

  return {
    group,
    uniforms,
    cloudUniforms,
    atmoUniforms,
    setSun(dir) {
      (uniforms.sunDir.value as THREE.Vector3).copy(dir).normalize();
    },
  };
}

/** Planet-frame position (lat/lon degrees) to world coordinates at height h above the surface. */
export function surfacePoint(lat: number, lon: number, h = 0, out = new THREE.Vector3()): THREE.Vector3 {
  const p = THREE.MathUtils.degToRad(lat);
  const l = THREE.MathUtils.degToRad(lon);
  const r = PLANET_R + h;
  return out.set(r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l));
}
