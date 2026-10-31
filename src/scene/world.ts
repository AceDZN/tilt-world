// The 3D world: planet, sky, Sun, Moon, Tzila, landmarks and level props. It only reads the sim.
import * as THREE from 'three';
import {
  angularDistance,
  latLonToVec,
  moonDirection,
  solarEclipseCenter,
  sunDirection,
  sunPosition,
  monthlyTemperature,
  TOTALITY_RADIUS,
} from '../astro/astro';
import type { LevelDef, Place } from '../game/types';
import { causewayTide, latLon, moonAgeAt, orbitL, type SimState } from '../game/sim';
import { createPlanet, PLANET_R, surfacePoint, type Planet } from './planet';
import { instance, orientUpForward, placeOnPlanet, tangent, type ModelName } from './models';

const TZILA_H = 0.62;
const MOON_DIST = 46;
const SUN_DIST = 260;

function glowTexture(inner: string, outer: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.18, inner);
  grad.addColorStop(0.35, outer);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function moonTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#bdbdb8';
  g.fillRect(0, 0, 256, 128);
  let seed = 3;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 90; i++) {
    const x = r() * 256;
    const y = r() * 128;
    const rad = 2 + r() * (i < 8 ? 22 : 7);
    g.fillStyle = `rgba(${90 + r() * 40},${90 + r() * 40},${95 + r() * 40},${0.25 + r() * 0.35})`;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function labelSprite(text: string, color = '#ffffff', bg = 'rgba(14,20,48,0.78)'): THREE.Sprite {
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  const font = '600 44px Rubik, Arial, sans-serif';
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + 48;
  c.width = w;
  c.height = 72;
  g.font = font;
  g.fillStyle = bg;
  const r = 34;
  g.beginPath();
  g.roundRect(2, 2, w - 4, 68, r);
  g.fill();
  g.direction = 'rtl';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(text, w / 2, 38);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true }));
  const hgt = 0.26;
  s.scale.set((hgt * w) / 72, hgt, 1);
  s.renderOrder = 10;
  return s;
}

/** A ring on the planet surface around (lat, lon) with angular radius rad (degrees). */
function surfaceRing(lat: number, lon: number, rad: number, color: number, width = 0.035): THREE.Mesh {
  const pts: THREE.Vector3[] = [];
  const center = latLonToVec(lat, lon);
  const c = new THREE.Vector3(center.x, center.y, center.z);
  const t1 = tangent(lat, lon, 0);
  const t2 = new THREE.Vector3().crossVectors(t1, c).normalize();
  const a = THREE.MathUtils.degToRad(rad);
  for (let i = 0; i <= 64; i++) {
    const th = (i / 64) * Math.PI * 2;
    const dir = new THREE.Vector3()
      .copy(c)
      .multiplyScalar(Math.cos(a))
      .addScaledVector(t1, Math.sin(a) * Math.cos(th))
      .addScaledVector(t2, Math.sin(a) * Math.sin(th))
      .normalize()
      .multiplyScalar(PLANET_R + 0.012);
    pts.push(dir);
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, 96, width, 6, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false }),
  );
}

function latitudeRing(lat: number, color: number, radius = 0.05, h = 0.03): THREE.Mesh {
  const r = (PLANET_R + h) * Math.cos(THREE.MathUtils.degToRad(lat));
  const y = (PLANET_R + h) * Math.sin(THREE.MathUtils.degToRad(lat));
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, radius, 8, 256), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3 }));
  m.rotation.x = Math.PI / 2;
  m.position.y = y;
  return m;
}

/** A spherical cap centred on a planet point (for tidal water and sand). */
function cap(lat: number, lon: number, radDeg: number, r: number, mat: THREE.Material): THREE.Mesh {
  const g = new THREE.SphereGeometry(r, 64, 16, 0, Math.PI * 2, 0, THREE.MathUtils.degToRad(radDeg));
  const m = new THREE.Mesh(g, mat);
  const up = latLonToVec(lat, lon);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(up.x, up.y, up.z));
  return m;
}

const PLACE_MODELS: Partial<Record<Place['kind'], { model: ModelName; h: number }>> = {
  city: { model: 'city_gate', h: 0.7 },
  walls: { model: 'city_gate', h: 0.7 },
  cabin: { model: 'lapland_cabin', h: 0.65 },
  island: { model: 'palm', h: 0.75 },
  beach: { model: 'palm', h: 0.7 },
  station: { model: 'locomotive', h: 0.55 },
  'causeway-end': { model: 'lighthouse', h: 0.9 },
  snow: { model: 'fuji', h: 0.9 },
  hill: { model: 'stone_wall', h: 0.3 },
  stones: { model: 'stone_circle', h: 0.32 },
  roof: { model: 'stone_wall', h: 0.35 },
};

export interface ViewState {
  utc: number;
  cameraMode: 'chase' | 'space';
  reducedMotion: boolean;
  sleeping: number; // 0..1 sleep pod animation
  running: boolean;
}

export class World {
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  planet: Planet;
  private sunLight = new THREE.DirectionalLight(0xfff1dc, 2.6);
  private fill = new THREE.HemisphereLight(0x8fb6ff, 0x1a1030, 0.35);
  private headlamp = new THREE.PointLight(0xffd7a8, 1.6, 6, 1.5);
  private sunSprite: THREE.Sprite;
  private corona: THREE.Sprite;
  private moon: THREE.Mesh;
  private stars: THREE.Points;
  player = new THREE.Group();
  private tzila: THREE.Group;
  private mixer: THREE.AnimationMixer | null = null;
  private actions = new Map<string, THREE.AnimationAction>();
  private current = '';
  private props = new THREE.Group();
  private tokenObjs: THREE.Object3D[] = [];
  private tripod: THREE.Group;
  private pod: THREE.Group;
  private bear: { obj: THREE.Group; mixer: THREE.AnimationMixer | null } | null = null;
  private water: THREE.Mesh | null = null;
  private camPos = new THREE.Vector3(0, 0, 40);
  private camLook = new THREE.Vector3();
  private camUp = new THREE.Vector3(0, 1, 0);
  private level: LevelDef | null = null;
  private lastAnimT = 0;
  oneShot: string | null = null;

  constructor(tex: { day: THREE.Texture; night: THREE.Texture; clouds: THREE.Texture }, aspect: number) {
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.05, 2000);
    this.scene.background = new THREE.Color(0x02030a);
    this.planet = createPlanet(tex);
    this.scene.add(this.planet.group);
    this.scene.add(this.sunLight, this.sunLight.target, this.fill);
    this.camera.add(this.headlamp);
    this.headlamp.position.set(0, 0.6, 0.4);
    this.scene.add(this.camera);

    // stars
    const n = 2600;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    let seed = 11;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const u = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pos.set([s * Math.cos(th) * 900, u * 900, s * Math.sin(th) * 900], i * 3);
      const w = 0.6 + r() * 0.4;
      const tint = r();
      col.set([w * (tint > 0.8 ? 1 : 0.85), w * 0.9, w * (tint < 0.2 ? 0.75 : 1)], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.8, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
    this.scene.add(this.stars);

    this.sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,252,235,1)', 'rgba(255,190,90,0.35)'), blending: THREE.AdditiveBlending, depthWrite: false }));
    this.sunSprite.scale.setScalar(70);
    this.scene.add(this.sunSprite);
    this.corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(10,10,14,1)', 'rgba(220,235,255,0.7)'), depthWrite: false, transparent: true }));
    this.corona.scale.setScalar(40);
    this.corona.visible = false;
    this.scene.add(this.corona);

    this.moon = new THREE.Mesh(new THREE.SphereGeometry(2.0, 48, 32), new THREE.MeshStandardMaterial({ map: moonTexture(), roughness: 1, metalness: 0 }));
    this.scene.add(this.moon);

    const t = instance('tzila', TZILA_H);
    this.tzila = t.obj;
    // The rig's lens faces −Z; turn it so +Z (the sim heading) is her front.
    this.tzila.children[0].rotation.y = Math.PI;
    this.player.add(this.tzila);
    if (t.animations.length) {
      this.mixer = new THREE.AnimationMixer(this.tzila);
      for (const clip of t.animations) this.actions.set(clip.name, this.mixer.clipAction(clip));
    }
    this.scene.add(this.player);
    this.scene.add(this.props);

    this.tripod = instance('tripod', 0.45).obj;
    this.tripod.visible = false;
    this.scene.add(this.tripod);
    this.pod = instance('sleep_pod', 0.55).obj;
    this.pod.visible = false;
    this.scene.add(this.pod);
    this.play('idle');
  }

  resize(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  private play(name: string, once = false) {
    if (!this.mixer || this.current === name) return;
    const next = this.actions.get(name);
    if (!next) return;
    const prev = this.actions.get(this.current);
    next.reset();
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = once;
    next.fadeIn(0.18).play();
    prev?.fadeOut(0.18);
    this.current = name;
  }

  /** Build the props for a level. */
  setLevel(level: LevelDef) {
    this.level = level;
    this.props.clear();
    this.tokenObjs = [];
    this.water = null;
    this.bear = null;
    const u = this.planet.uniforms;
    u.gridOn.value = 0;
    u.hintMeridian.value = -999;
    u.hintLat.value = -999;
    u.hintTerminator.value = 0;
    (u.subsolar.value as THREE.Vector3).set(0, 0, 0);
    u.eclipseRadius.value = 0;
    u.dateLine.value = level.id === 5 ? 1 : 0;
    u.railLat.value = -999;
    u.fogged.value = level.fogged ? 1 : 0;

    for (const p of level.places) {
      const spec = PLACE_MODELS[p.kind];
      const ringColor = p.kind === 'station' ? 0xffc04a : 0x7fe3ff;
      if (p.radius < 4) this.props.add(surfaceRing(p.lat, p.lon, Math.min(p.radius, 3), ringColor));
      let topH = 0.25;
      if (spec) {
        const m = instance(spec.model, spec.h).obj;
        const off = Math.min(p.radius * 0.45, 0.6);
        placeOnPlanet(m, p.lat + (p.kind === 'station' || p.kind === 'roof' || p.kind === 'hill' ? off : 0), p.lon, 200);
        this.props.add(m);
        topH = spec.h;
        if (p.kind === 'station') {
          const booth = instance('ticket_booth', 0.42).obj;
          placeOnPlanet(booth, p.lat - off * 0.4, p.lon + off, 200);
          this.props.add(booth);
        }
        if (p.kind === 'stones') {
          m.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (mesh.isMesh) mesh.material = new THREE.MeshStandardMaterial({ color: 0x9a9187, roughness: 0.95 });
          });
        }
      } else {
        this.props.add(this.procProp(p));
      }
      const label = labelSprite(p.name);
      surfacePoint(p.lat, p.lon, topH + 0.35, label.position);
      this.props.add(label);
    }

    for (const lat of level.rails ?? []) this.props.add(latitudeRing(lat, 0xffb84a));

    const sp = level.special;
    if (sp?.kind === 'tokens') {
      for (const lon of sp.lons) {
        const tok = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 24), new THREE.MeshStandardMaterial({ color: 0xffd36a, emissive: 0xff9a3a, emissiveIntensity: 0.9, metalness: 0.8, roughness: 0.25 }));
        placeOnPlanet(tok, sp.lat, lon, 90, 0.45);
        this.tokenObjs.push(tok);
        this.props.add(tok);
      }
    }
    if (sp?.kind === 'causeway') {
      const ab = angularDistance(sp.from.lat, sp.from.lon, sp.to.lat, sp.to.lon);
      this.props.add(cap(sp.to.lat, sp.to.lon, ab, PLANET_R + 0.006, new THREE.MeshStandardMaterial({ color: 0xc9b486, roughness: 1 })));
      // the stone causeway
      const steps = 24;
      for (let i = 0; i <= steps; i++) {
        const lat = sp.from.lat + ((sp.to.lat - sp.from.lat) * i) / steps;
        const lon = sp.from.lon + ((sp.to.lon - sp.from.lon) * i) / steps;
        const stone = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.1), new THREE.MeshStandardMaterial({ color: 0x8c8277, roughness: 0.9 }));
        placeOnPlanet(stone, lat, lon, 0, 0.012);
        this.props.add(stone);
      }
      this.water = cap(sp.to.lat, sp.to.lon, ab, PLANET_R + 0.02, new THREE.MeshStandardMaterial({ color: 0x2f8fd0, transparent: true, opacity: 0.82, roughness: 0.15, metalness: 0.1 }));
      this.props.add(this.water);
    }
    if (sp?.kind === 'bear') {
      const cabin = level.places.find((p) => p.id === sp.place);
      if (cabin) {
        const b = instance('polar_bear', 0.5);
        placeOnPlanet(b.obj, cabin.lat - 0.9, cabin.lon + 1.4, 300);
        let mixer: THREE.AnimationMixer | null = null;
        if (b.animations.length) {
          mixer = new THREE.AnimationMixer(b.obj);
          const clip = b.animations.find((c) => c.name === 'look_around') ?? b.animations[0];
          mixer.clipAction(clip).play();
        }
        this.bear = { obj: b.obj, mixer };
        this.props.add(b.obj);
      }
    }
    if (level.id === 12) {
      // thermal targets: city blocks, fields, forest and lava get simple procedural dressing
    }
  }

  private procProp(p: Place): THREE.Object3D {
    const g = new THREE.Group();
    const mat = (c: number, e = 0) => new THREE.MeshStandardMaterial({ color: c, emissive: e ? c : 0, emissiveIntensity: e, roughness: 0.8 });
    const add = (m: THREE.Mesh, dlat: number, dlon: number, az = 0) => {
      placeOnPlanet(m, p.lat + dlat, p.lon + dlon, az);
      g.add(m);
    };
    if (p.kind === 'gate') {
      // an ice arch that melts only under a vertical Sun
      const ice = mat(0xbfefff, 0.25);
      (ice as THREE.MeshStandardMaterial).transparent = true;
      (ice as THREE.MeshStandardMaterial).opacity = 0.85;
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 10, 24, Math.PI), ice);
      arch.position.y = 0;
      const holder = new THREE.Group();
      holder.add(arch);
      arch.position.set(0, 0, 0);
      add(holder as unknown as THREE.Mesh, 0, 0, 90);
    } else if (p.kind === 'stones') {
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.05), mat(0x9a9187));
        s.geometry.translate(0, 0.12, 0);
        add(s, Math.cos(a) * 0.9, (Math.sin(a) * 0.9) / Math.cos(THREE.MathUtils.degToRad(p.lat)), (a * 180) / Math.PI);
      }
    } else if (p.kind === 'forest') {
      for (let i = 0; i < 9; i++) {
        const t = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 7), mat(0x2f7a3a));
        t.geometry.translate(0, 0.12, 0);
        add(t, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9, 0);
      }
    } else if (p.kind === 'lava') {
      for (let i = 0; i < 6; i++) {
        const t = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + Math.random() * 0.08), mat(0x1c1714));
        add(t, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3, 0);
      }
    } else if (p.kind === 'field') {
      for (let i = 0; i < 4; i++) {
        const t = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.01, 0.18), mat(i % 2 ? 0x8fbf4a : 0xc9b24a));
        add(t, (i % 2) * 0.2 - 0.1, Math.floor(i / 2) * 0.2 - 0.1, 0);
      }
    } else {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), mat(0xffc04a, 0.5));
      t.geometry.translate(0, 0.2, 0);
      add(t, 0, 0, 0);
    }
    return g;
  }

  /** Per-frame update from the sim. dt = real seconds. */
  update(st: SimState, view: ViewState, dt: number, t: number) {
    const lvl = st.level;
    const utc = view.utc;
    const L = orbitL(lvl, utc);
    const age = moonAgeAt(lvl, utc);
    const sd = sunDirection(utc, L, st.spin);
    const sun = new THREE.Vector3(sd.x, sd.y, sd.z);
    this.planet.setSun(sun);
    this.planet.uniforms.time.value = t;
    this.planet.cloudUniforms.spin.value = t * (view.reducedMotion ? 0 : 0.3);
    this.sunLight.position.copy(sun).multiplyScalar(60);
    this.sunSprite.position.copy(sun).multiplyScalar(SUN_DIST);
    const md = moonDirection(utc, L, age);
    this.moon.position.set(md.x, md.y, md.z).multiplyScalar(MOON_DIST);

    // eclipse
    const ecl = solarEclipseCenter(utc, L, age);
    const u = this.planet.uniforms;
    if (ecl) {
      const v = latLonToVec(ecl.lat, ecl.lon);
      (u.eclipseCenter.value as THREE.Vector3).set(v.x, v.y, v.z);
      u.eclipseRadius.value = THREE.MathUtils.degToRad(TOTALITY_RADIUS);
    } else u.eclipseRadius.value = 0;
    const here = latLon(st);
    const inShadow = ecl && angularDistance(here.lat, here.lon, ecl.lat, ecl.lon) < TOTALITY_RADIUS;
    this.corona.visible = !!inShadow;
    if (inShadow) this.corona.position.copy(this.sunSprite.position).multiplyScalar(0.99);
    (this.sunSprite.material as THREE.SpriteMaterial).opacity = inShadow ? 0.25 : 1;
    this.sunLight.intensity = inShadow ? 0.25 : 2.6;

    // hints
    u.gridOn.value = st.hintOn || lvl.id === 3 || lvl.id === 13 ? 1 : 0;
    const ho = st.hintOn ? lvl.hintOverlay : undefined;
    u.hintTerminator.value = ho?.kind === 'terminator' ? 1 : 0;
    u.hintMeridian.value = ho?.kind === 'meridian' ? ho.lon : -999;
    u.hintLat.value = ho?.kind === 'latitude' ? ho.lat : -999;
    const sub = u.subsolar.value as THREE.Vector3;
    if (ho?.kind === 'subsolar') sub.copy(sun);
    else sub.set(0, 0, 0);

    // seasonal snow lines from the climate model (where the month is below freezing)
    u.snowN.value = snowLine(L, 1);
    u.snowS.value = snowLine(L, -1);

    // tokens
    this.tokenObjs.forEach((o, i) => {
      o.visible = !st.tokens[i];
      o.rotateY(dt * 2);
    });
    // tidal water
    if (this.water && lvl.special?.kind === 'causeway') {
      const tide = causewayTide(st);
      this.water.scale.setScalar(1 + (tide - lvl.special.openBelow) * 0.0009);
      const open = tide <= lvl.special.openBelow;
      (this.water.material as THREE.MeshStandardMaterial).opacity = open ? 0.0 : 0.82;
    }
    // bear: shows up when it is dark at the cabin
    if (this.bear) {
      const bp = new THREE.Vector3().copy(this.bear.obj.position).normalize();
      this.bear.obj.visible = bp.dot(sun) < 0.05;
      this.bear.mixer?.update(dt);
    }

    // player
    const pos = new THREE.Vector3(st.pos.x, st.pos.y, st.pos.z);
    const fwd = new THREE.Vector3(st.heading.x, st.heading.y, st.heading.z);
    const bob = 0;
    this.player.position.copy(pos).multiplyScalar(PLANET_R + st.height * 0.12 + bob);
    orientUpForward(this.player, pos, fwd);
    this.player.visible = !(view.sleeping > 0.2 && view.sleeping < 0.95);

    // animation choice
    const ev = st.events.at(-1);
    if (ev && ev.t > this.lastAnimT) {
      this.lastAnimT = ev.t;
      if (ev.kind === 'shot-ok' || ev.kind === 'win' || ev.kind === 'gear-ok' || ev.kind === 'token') this.oneShot = 'cheer';
      if (ev.kind === 'fail') this.oneShot = st.fail?.kind === 'battery' ? 'fall' : 'defeat_02';
      if (ev.kind === 'shot-miss') this.oneShot = 'look_around';
    }
    let anim = 'idle';
    if (st.mode === 'failed') anim = st.fail?.kind === 'battery' ? 'fall' : 'defeat_02';
    else if (st.mode === 'won') anim = 'cheer';
    else if (st.height > 0) anim = 'jump';
    else if (view.running) anim = st.grinding !== null ? 'idle' : 'run';
    else if (this.oneShot) anim = this.oneShot;
    this.play(anim, anim === 'fall' || anim === 'defeat_02' || anim === 'jump');
    if (this.oneShot && this.current === this.oneShot) {
      const a = this.actions.get(this.oneShot);
      if (a && a.time > a.getClip().duration * 0.95) this.oneShot = null;
    }
    if (view.running) this.oneShot = null;
    this.mixer?.update(dt);
    // lean into a grind
    this.tzila.rotation.z = st.grinding !== null && view.running ? 0.25 : 0;

    // tripod and sleep pod
    if (st.tripod) {
      placeOnPlanet(this.tripod, st.tripod.lat, st.tripod.lon, st.tripod.facing);
      this.tripod.visible = true;
    } else this.tripod.visible = false;
    this.pod.visible = view.sleeping > 0;
    if (this.pod.visible) {
      this.pod.position.copy(this.player.position);
      this.pod.quaternion.copy(this.player.quaternion);
      const s = Math.min(1, view.sleeping * 4) * Math.min(1, (1 - view.sleeping) * 6 + 0.001);
      this.pod.scale.setScalar(Math.max(0.001, s));
    }

    this.updateCamera(pos, fwd, view, dt);
  }

  private updateCamera(pos: THREE.Vector3, fwd: THREE.Vector3, view: ViewState, dt: number) {
    const up = pos.clone().normalize();
    let want: THREE.Vector3;
    let look: THREE.Vector3;
    if (view.cameraMode === 'space') {
      want = up.clone().multiplyScalar(PLANET_R * 2.6).addScaledVector(fwd, -PLANET_R * 0.6);
      look = new THREE.Vector3();
    } else {
      const base = up.clone().multiplyScalar(PLANET_R);
      want = base.clone().addScaledVector(up, 1.9).addScaledVector(fwd, -2.6);
      look = base.clone().addScaledVector(up, 0.2).addScaledVector(fwd, 2.4);
    }
    const k = view.reducedMotion ? 1 : 1 - Math.exp(-dt * 6);
    this.camPos.lerp(want, k);
    this.camLook.lerp(look, k);
    this.camUp.lerp(view.cameraMode === 'space' ? fwd : up, k).normalize();
    this.camera.position.copy(this.camPos);
    this.camera.up.copy(this.camUp);
    this.camera.lookAt(this.camLook);
  }

  /** Menu camera: a slow orbit around the planet (the camera moves, the Earth does not). */
  menuCamera(t: number, utc: number, L: number, reduced: boolean) {
    const sd = sunDirection(utc, L, 1);
    const sun = new THREE.Vector3(sd.x, sd.y, sd.z);
    this.planet.setSun(sun);
    this.sunLight.position.copy(sun).multiplyScalar(60);
    this.sunSprite.position.copy(sun).multiplyScalar(SUN_DIST);
    this.planet.uniforms.time.value = t;
    const a = reduced ? 0.6 : t * 0.05;
    this.camera.position.set(Math.sin(a) * 34, 9, Math.cos(a) * 34);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);
    this.player.visible = false;
    this.props.visible = false;
  }

  showGame() {
    this.player.visible = true;
    this.props.visible = true;
  }

  /** Snap the chase camera behind the player (level start). */
  snapCamera(st: SimState) {
    const pos = new THREE.Vector3(st.pos.x, st.pos.y, st.pos.z);
    const fwd = new THREE.Vector3(st.heading.x, st.heading.y, st.heading.z);
    this.updateCamera(pos, fwd, { utc: st.utc, cameraMode: 'chase', reducedMotion: true, sleeping: 0, running: false }, 1);
  }

  sunElevationHere(st: SimState): number {
    const { lat, lon } = latLon(st);
    return sunPosition(lat, lon, st.utc, st.L, st.spin).elevation;
  }
}

const snowCache = new Map<number, number>();
/** Latitude where the month is below about −2 °C (snow on the ground), by hemisphere. */
function snowLine(L: number, hemi: 1 | -1): number {
  const key = Math.round(L) + (hemi > 0 ? 0 : 1000);
  const hit = snowCache.get(key);
  if (hit !== undefined) return hit;
  let out = 90;
  for (let lat = 30; lat <= 90; lat += 2)
    if (monthlyTemperature(hemi * lat, L) < -2) {
      out = lat;
      break;
    }
  snowCache.set(key, out);
  return out;
}
