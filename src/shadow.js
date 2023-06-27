import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'lil-gui';

function main() {
  const gui = new dat.GUI();
  const canvas = document.querySelector('.webgl');
  const renderer = new THREE.WebGLRenderer({antialias: true, canvas});

  const fov = 45;
  const aspect = 2;  // the canvas default
  const near = 5;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 10, 20);

  class MinMaxGUIHelper {
    constructor(obj, minProp, maxProp, minDif) {
      this.obj = obj;
      this.minProp = minProp;
      this.maxProp = maxProp;
      this.minDif = minDif;
    }
    get min() {
      return this.obj[this.minProp];
    }
    set min(v) {
      this.obj[this.minProp] = v;
      this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
    }
    get max() {
      return this.obj[this.maxProp];
    }
    set max(v) {
      this.obj[this.maxProp] = v;
      this.min = this.min;  // this will call the min setter
    }
  }

  function updateCamera() {
    camera.updateProjectionMatrix();
  }

  gui.add(camera, 'fov', 1, 180).onChange(updateCamera);
  const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
  gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
  gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(updateCamera);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.update();


  const scene = new THREE.Scene();
  scene.background = new THREE.Color('white');

  const loader = new THREE.TextureLoader();

  {
    const planeSize = 40;

    const texture = loader.load('https://threejs.org/manual/examples/resources/images/checker.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);

    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    planeMat.color.setRGB(1.5, 1.5, 1.5);
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -.5;
    scene.add(mesh);
  }


  // shadow texture
  const shadowTexture = loader.load('img/roundshadow.png');

  // spheres
  const sphereShadowBases = [];
  const sphereRadius = 1;
  const widthSegments = 32;
  const heightSegments = 16;
  const sphereGeo = new THREE.SphereGeometry(sphereRadius, widthSegments, heightSegments);

  const fakeShadowPlaneSize = 1;
  const fakeShadowPlaneGeo = new THREE.PlaneGeometry(fakeShadowPlaneSize, fakeShadowPlaneSize);

  const numSpheres = 15;
  for (let i=0; i<numSpheres; ++i) {
    const base = new THREE.Object3D();
    scene.add(base);
    // 陰影
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true, // so we see the ground
      depthWrite: false, // so we don't have to sort
    })
    const shadowMesh = new THREE.Mesh(fakeShadowPlaneGeo, shadowMat);
    shadowMesh.position.y = 0.001;
    shadowMesh.rotation.x = Math.PI * -0.5;
    const shadowSize = sphereRadius * 4;
    shadowMesh.scale.set(shadowSize, shadowSize, shadowSize);
    base.add(shadowMesh);

    // 球球
    const u = i / numSpheres; // 設定顏色
    const sphereMat = new THREE.MeshPhongMaterial();
    sphereMat.color.setHSL(u, 1, .75);
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.position.set(0, sphereRadius + 2, 0);
    base.add(sphereMesh);

    sphereShadowBases.push({
      base,
      sphereMesh,
      shadowMesh,
      y: shadowMesh.position.y
    })
  }

  // HemisphereLight
  const hemisphereLight = new THREE.HemisphereLight(0xB1E1FF, 0xB97A20, 2);
  scene.add(hemisphereLight);

  // DirectionalLight
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
  directionalLight.position.set(0, 10, 5);
  directionalLight.target.position.set(-5, 0, 0);
  scene.add(directionalLight);
  scene.add(directionalLight.target);


  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }


  function render() {

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);


    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();