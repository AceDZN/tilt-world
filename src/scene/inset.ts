// Read-only picture-in-picture view from space: the Sun, Earth's orbit with its fixed tilted axis,
// and in World 4 the Moon's orbit tilted 5° with the node line. Nothing here can be dragged.
import * as THREE from 'three';
import { MOON_NODE_L, moonElongation, TILT } from '../astro/astro';

const D2R = Math.PI / 180;

export class OrbitInset {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1.6, 0.1, 200);
  private earth: THREE.Group;
  private moonGroup = new THREE.Group();
  private moon: THREE.Mesh;
  private nodeLine: THREE.Line;
  private sunLight = new THREE.PointLight(0xffffff, 900, 0, 2);
  showMoon = false;

  constructor(dayTex: THREE.Texture) {
    this.scene.add(new THREE.AmbientLight(0x334466, 0.6));
    this.scene.add(this.sunLight);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffd060 }));
    this.scene.add(sun);
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,200,90,0.9)');
    grad.addColorStop(1, 'rgba(255,140,40,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    glow.scale.setScalar(6);
    this.scene.add(glow);

    const orbit = new THREE.Mesh(new THREE.TorusGeometry(10, 0.04, 6, 128), new THREE.MeshBasicMaterial({ color: 0x8fb8ff, transparent: true, opacity: 0.6 }));
    orbit.rotation.x = Math.PI / 2;
    this.scene.add(orbit);

    this.earth = new THREE.Group();
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 24), new THREE.MeshStandardMaterial({ map: dayTex, roughness: 0.9 }));
    // Axis tilted toward +X in space (the Sun's direction at the June solstice, L = 90).
    const axisHolder = new THREE.Group();
    axisHolder.rotation.z = -TILT * D2R;
    axisHolder.add(globe);
    const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    axisHolder.add(axis);
    const north = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 8), new THREE.MeshBasicMaterial({ color: 0xff7070 }));
    north.position.y = 2.2;
    axisHolder.add(north);
    this.earth.add(axisHolder);
    this.scene.add(this.earth);

    const mo = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.025, 6, 96), new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.7 }));
    mo.rotation.x = Math.PI / 2;
    this.moonGroup.add(mo);
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 12), new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 1 }));
    this.scene.add(this.moon);
    const ng = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.4, 0, 0), new THREE.Vector3(3.4, 0, 0)]);
    this.nodeLine = new THREE.Line(ng, new THREE.LineDashedMaterial({ color: 0xffe070, dashSize: 0.25, gapSize: 0.15 }));
    this.nodeLine.computeLineDistances();
    this.scene.add(this.nodeLine);
    this.scene.add(this.moonGroup);

    this.camera.position.set(0, 15, 19);
    this.camera.lookAt(0, -1, 0);
  }

  /**
   * L = the Sun's ecliptic longitude. Angles in the inset: x = cos θ, z = −sin θ (counter-clockwise
   * seen from the north). Earth sits at θ = L − 90° + 180°, so in June (L = 90) it is on −X and its
   * north pole, which always leans toward +X, leans toward the Sun.
   */
  update(L: number, moonAge: number, dt: number) {
    const th = (L - 90) * D2R + Math.PI;
    const ex = Math.cos(th) * 10;
    const ez = -Math.sin(th) * 10;
    this.earth.position.set(ex, 0, ez);
    this.earth.children[0].children[0].rotation.y += dt * 0.6;
    this.moonGroup.visible = this.showMoon;
    this.nodeLine.visible = this.showMoon;
    this.moon.visible = this.showMoon;
    if (!this.showMoon) return;
    // A geocentric ecliptic longitude λ points along angle λ − L + θ + 180°.
    const dirOf = (lam: number) => (lam - L) * D2R + th + Math.PI;
    const node = dirOf(MOON_NODE_L);
    const axis = new THREE.Vector3(Math.cos(node), 0, -Math.sin(node));
    const tilt = 5 * 3 * D2R; // exaggerated ×3 so the tilt is visible
    this.moonGroup.position.copy(this.earth.position);
    this.moonGroup.quaternion.setFromAxisAngle(axis, tilt);
    this.nodeLine.position.copy(this.earth.position);
    this.nodeLine.rotation.set(0, node, 0);
    const lamMoon = L + moonElongation(moonAge);
    const m = dirOf(lamMoon);
    const flat = new THREE.Vector3(Math.cos(m), 0, -Math.sin(m)).multiplyScalar(2.6);
    flat.applyAxisAngle(axis, tilt);
    this.moon.position.copy(this.earth.position).add(flat);
  }

  render(renderer: THREE.WebGLRenderer, x: number, y: number, w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    renderer.setScissorTest(true);
    renderer.setScissor(x, y, w, h);
    renderer.setViewport(x, y, w, h);
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(this.scene, this.camera);
    renderer.setScissorTest(false);
    renderer.autoClear = true;
  }
}
