// GLB loading: every model is normalized to a target height with its feet at y = 0, so props can be
// placed on the planet by one helper. Missing files fall back to simple procedural shapes.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { surfacePoint } from './planet';

export type ModelName =
  | 'tzila'
  | 'polar_bear'
  | 'tripod'
  | 'sleep_pod'
  | 'locomotive'
  | 'lapland_cabin'
  | 'city_gate'
  | 'stone_wall'
  | 'lighthouse'
  | 'palm'
  | 'fuji'
  | 'ticket_booth'
  | 'stone_circle'
  | 'weather_mast';

export const MODEL_NAMES: ModelName[] = ['tzila', 'polar_bear', 'tripod', 'sleep_pod', 'locomotive', 'lapland_cabin', 'city_gate', 'stone_wall', 'lighthouse', 'palm', 'fuji', 'ticket_booth', 'stone_circle', 'weather_mast'];

export interface LoadedModel {
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
}

const cache = new Map<ModelName, LoadedModel>();

export async function loadModels(base: string, onProgress?: (done: number, total: number) => void): Promise<void> {
  const loader = new GLTFLoader();
  let done = 0;
  await Promise.all(
    MODEL_NAMES.map(async (name) => {
      try {
        const gltf = await loader.loadAsync(`${base}models/${name}.glb`);
        gltf.scene.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
            m.castShadow = false;
            m.receiveShadow = false;
            m.frustumCulled = !(m as unknown as THREE.SkinnedMesh).isSkinnedMesh;
          }
        });
        cache.set(name, { scene: gltf.scene, animations: gltf.animations });
      } catch (e) {
        console.warn('model missing', name, e);
      } finally {
        onProgress?.(++done, MODEL_NAMES.length);
      }
    }),
  );
}

/** A fresh copy of a model scaled so that its height is `height` world units, feet at the origin. */
export function instance(name: ModelName, height: number): { obj: THREE.Group; animations: THREE.AnimationClip[] } {
  const src = cache.get(name);
  const holder = new THREE.Group();
  holder.name = name;
  if (!src) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(height * 0.3, height, 8), new THREE.MeshStandardMaterial({ color: 0xffaa66 }));
    m.position.y = height / 2;
    holder.add(m);
    return { obj: holder, animations: [] };
  }
  const copy = cloneSkinned(src.scene);
  const box = new THREE.Box3().setFromObject(copy);
  const size = box.getSize(new THREE.Vector3());
  const s = height / Math.max(size.y, 1e-6);
  copy.scale.setScalar(s);
  const c = box.getCenter(new THREE.Vector3());
  copy.position.set(-c.x * s, -box.min.y * s, -c.z * s);
  holder.add(copy);
  return { obj: holder, animations: src.animations };
}

const tmpUp = new THREE.Vector3();
const tmpF = new THREE.Vector3();
const tmpX = new THREE.Vector3();
const tmpM = new THREE.Matrix4();

/** Unit tangent toward azimuth `az` (degrees clockwise from north) at a lat/lon, in planet space. */
export function tangent(lat: number, lon: number, az: number, out = new THREE.Vector3()): THREE.Vector3 {
  const p = THREE.MathUtils.degToRad(lat);
  const l = THREE.MathUtils.degToRad(lon);
  const a = THREE.MathUtils.degToRad(az);
  const ex = Math.cos(l);
  const ez = -Math.sin(l);
  const nx = -Math.sin(p) * Math.sin(l);
  const ny = Math.cos(p);
  const nz = -Math.sin(p) * Math.cos(l);
  return out.set(nx * Math.cos(a) + ex * Math.sin(a), ny * Math.cos(a), nz * Math.cos(a) + ez * Math.sin(a)).normalize();
}

/** Stand an object on the planet at lat/lon, its +Z facing azimuth `az`, raised by h. */
export function placeOnPlanet(obj: THREE.Object3D, lat: number, lon: number, az = 0, h = 0) {
  surfacePoint(lat, lon, h, obj.position);
  tmpUp.copy(obj.position).normalize();
  tangent(lat, lon, az, tmpF);
  orientUpForward(obj, tmpUp, tmpF);
}

export function orientUpForward(obj: THREE.Object3D, up: THREE.Vector3, forward: THREE.Vector3) {
  tmpX.crossVectors(up, forward).normalize();
  tmpF.crossVectors(tmpX, up).normalize();
  tmpM.makeBasis(tmpX, up, tmpF);
  obj.quaternion.setFromRotationMatrix(tmpM);
}
