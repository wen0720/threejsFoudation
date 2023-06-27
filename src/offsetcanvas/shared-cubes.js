import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class PickHelper {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.pickedObjectSavedColor = 0;
  }
  pick(normalizedPosition, scene, camera, time) {
    // restore color if there is a picked object
    if (this.pickedObject) {
      this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
      this.pickedObject = undefined;
    }
    // cast a ray through the frustum
    this.raycaster.setFromCamera(normalizedPosition,  camera);
    // get the list of the object that raycaster inersected
    const intersectedObjects = this.raycaster.intersectObjects(scene.children);
    if (intersectedObjects.length) {
      // 第一個也是最接近相機的那個物體
      this.pickedObject = intersectedObjects[0].object;
      // save its color
      this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
      // set its emissive color to flashing red/yellow
      this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
    }
  }
}

export const pickPosition = { x: 0, y: 0 }

export function init(data) {
  const { canvas, inputElement } = data;
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;

  const controls = new OrbitControls(camera, inputElement);
  controls.target.set(0, 0, 0);
  controls.update();

  const scene = new THREE.Scene();

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({color});

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;

    return cube;
  }

  const cubes = [
    makeInstance(geometry, 0x44aa88,  0),
    makeInstance(geometry, 0x8844aa, -2),
    makeInstance(geometry, 0xaa8844,  2),
  ];

  const pickHelper = new PickHelper();
  const getCanvasRelativePosition = (event) => {
    const rect = inputElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }
  function setPickPosition(event) {
    // 取得在 canvas 內的座標
    const pos = getCanvasRelativePosition(event)
    // 將座標(px)，轉換為相機的尺度（中間是0，上下個推 1）
    const cameraPos = {
      x: (pos.x / inputElement.width) * 2 - 1,
      y: (pos.y / inputElement.height) * -2 + 1,  // flip Y
    }
    pickPosition.x = cameraPos.x;
    pickPosition.y = cameraPos.y;
  }
  function clearPosition() {
    pickPosition.x = -10000;
    pickPosition.y = -10000;
  }
  inputElement.addEventListener('mousemove', setPickPosition);
  inputElement.addEventListener('mouseout', clearPosition);
  inputElement.addEventListener('mouseleave', clearPosition);

  inputElement.addEventListener('touchstart', (event) => {
    event.preventDefault();
    setPickPosition(event.touches[0]);
  }, { passive: false })

  inputElement.addEventListener('touchmove', (event) => {
    event.preventDefault();
    setPickPosition(event.touches[0]);
  }, { passive: false })

  inputElement.addEventListener('touchend', (event) => {
    event.preventDefault();
    clearPosition();
  }, { passive: false })


  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width  = inputElement.clientWidth;
    const height = inputElement.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render(time) {
    time *= 0.001;
    if (resizeRendererToDisplaySize(renderer)) {
      camera.aspect = inputElement.width / inputElement.height;
      camera.updateProjectionMatrix();
    }

    cubes.forEach((cube, ndx) => {
      const speed = 1 + ndx * .1;
      const rot = time * speed;
      cube.rotation.x = rot;
      cube.rotation.y = rot;
    });

    pickHelper.pick(pickPosition, scene, camera, time)

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}