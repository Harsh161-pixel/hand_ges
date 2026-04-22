import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

export class Modeller {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#0b1222");

    this.camera = new THREE.PerspectiveCamera(65, 1, 0.1, 1000);
    this.camera.position.set(6, 5, 8);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.orbit = new OrbitControls(this.camera, this.canvas);
    this.orbit.enableDamping = true;

    this.transform = new TransformControls(this.camera, this.canvas);
    this.transform.addEventListener("dragging-changed", (e) => {
      this.orbit.enabled = !e.value;
    });
    this.scene.add(this.transform);

    this.mode = "translate";
    this.axis = "all";
    this.selected = null;

    this.setupLights();
    this.setupHelpers();
    this.addPrimitive("box");
    this.resize();
    this.animate();
  }

  setupLights() {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x1a2334, 1.1);
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(5, 8, 3);
    this.scene.add(hemi, key);
  }

  setupHelpers() {
    const grid = new THREE.GridHelper(20, 20, 0x4ade80, 0x334155);
    grid.position.y = -0.01;
    this.scene.add(grid);

    const axis = new THREE.AxesHelper(2.5);
    this.scene.add(axis);
  }

  setMode(mode) {
    this.mode = mode;
    this.transform.setMode(mode);
  }

  setAxis(axis) {
    this.axis = axis;
    this.transform.showX = axis === "all" || axis === "x";
    this.transform.showY = axis === "all" || axis === "y";
    this.transform.showZ = axis === "all" || axis === "z";
  }

  addPrimitive(type = "box") {
    let geometry;
    if (type === "plane") geometry = new THREE.BoxGeometry(2, 0.15, 2);
    else if (type === "cylinder") geometry = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 10);
    else geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);

    const hue = 28 + Math.random() * 42;
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(`hsl(${hue}, 65%, 56%)`),
      roughness: 0.7,
      metalness: 0.08,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((Math.random() - 0.5) * 2.4, 0.6, (Math.random() - 0.5) * 2.4);
    mesh.userData.editable = true;
    this.root.add(mesh);
    this.select(mesh);
    return mesh;
  }

  select(mesh) {
    if (this.selected?.material?.emissive) this.selected.material.emissive.setHex(0x000000);
    this.selected = mesh || null;

    if (this.selected) {
      if (this.selected.material?.emissive) this.selected.material.emissive.setHex(0x1f2937);
      this.transform.attach(this.selected);
    } else {
      this.transform.detach();
    }
  }

  removeSelected() {
    if (!this.selected) return;
    this.root.remove(this.selected);
    this.select(null);
  }

  duplicateSelected() {
    if (!this.selected) return;
    const clone = this.selected.clone();
    clone.geometry = this.selected.geometry.clone();
    clone.material = this.selected.material.clone();
    clone.position.add(new THREE.Vector3(0.5, 0.2, 0.5));
    this.root.add(clone);
    this.select(clone);
  }

  extrudeSelected() {
    if (!this.selected) return;
    const dir = new THREE.Vector3(
      this.axis === "x" ? 1 : 0,
      this.axis === "y" ? 1 : 0,
      this.axis === "z" ? 1 : 0
    );
    if (this.axis === "all") dir.set(0, 1, 0);

    const chunk = this.selected.clone();
    chunk.geometry = this.selected.geometry.clone();
    chunk.material = this.selected.material.clone();
    chunk.position.copy(this.selected.position).add(dir.multiplyScalar(0.9));
    chunk.scale.copy(this.selected.scale).multiplyScalar(0.92);
    this.root.add(chunk);
    this.select(chunk);
  }

  applyStepTransform() {
    if (!this.selected) return;

    const axisVec = new THREE.Vector3(
      this.axis === "x" ? 1 : 0,
      this.axis === "y" ? 1 : 0,
      this.axis === "z" ? 1 : 0
    );
    if (this.axis === "all") axisVec.set(1, 1, 1).normalize();

    if (this.mode === "translate") {
      this.selected.position.add(axisVec.multiplyScalar(0.22));
    } else if (this.mode === "rotate") {
      if (this.axis === "x") this.selected.rotation.x += 0.2;
      else if (this.axis === "y") this.selected.rotation.y += 0.2;
      else this.selected.rotation.z += 0.2;
    } else if (this.mode === "scale") {
      if (this.axis === "x") this.selected.scale.x += 0.07;
      else if (this.axis === "y") this.selected.scale.y += 0.07;
      else if (this.axis === "z") this.selected.scale.z += 0.07;
      else this.selected.scale.multiplyScalar(1.08);
    }
  }

  pickFromNdc(ndcX, ndcY) {
    this.pointer.set(ndcX, ndcY);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.root.children, false);
    this.select(hits[0]?.object || null);
  }

  bindPointerPicking() {
    this.canvas.addEventListener("pointerdown", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.pickFromNdc(x, y);
    });
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  animate() {
    this.orbit.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }
}

