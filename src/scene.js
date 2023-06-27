import * as THREE from 'three';
import * as dat from 'lil-gui';

const gui = new dat.GUI();

class AxisGridHelper {
  constructor(node, unit = 10) {
    const axes = new THREE.AxesHelper();
    axes.material.depthTest = false;
    axes.renderOrder = 2;
    node.add(axes);

    // new THREE.GridHelper(整個grid要多大, 要被分成幾分)
    const grid = new THREE.GridHelper(unit, unit);
    grid.material.depthTest = false;
    grid.renderOrder = 1;
    node.add(grid);

    this.axes = axes;
    this.grid = grid;
    this.visible = false;
  }
  get visible() {
    return this._visible;
  }
  set visible(v) {
    this._visible = v;
    this.axes.visible = v;
    this.grid.visible = v;
  }
}
const makeHelper = (node, label, unit) => {
  const helper = new AxisGridHelper(node, unit);
  gui.add(helper, 'visible').name(label);
}

const scene = new THREE.Scene();
const canvas = document.querySelector('canvas.webgl');
const sizes = { width: window.innerWidth, height: window.innerHeight };
const renderer = new THREE.WebGLRenderer({ anitalias: true, canvas });
const camera = new THREE.PerspectiveCamera(40, sizes.width / sizes.height, 0.1, 1000)

camera.position.set(0, 50, 0);
camera.up.set(0, 0, 1);
camera.lookAt(0, 0, 0);

// light
{
  const color = 0xffffff;
  const intensity = 3;
  const light = new THREE.PointLight(color, intensity);
  scene.add(light);
}

// an array of objects whose rotation to update
const objects = [];

// use just one sphere for everything
const radius = 1;
const widthSegments = 6;
const heightSegments = 6;
const sphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

// solar system
const solarSystem = new THREE.Object3D();
scene.add(solarSystem);
objects.push(solarSystem); // 星系公轉

// sun
const sunMaterial = new THREE.MeshPhongMaterial({ emissive: 0xFFFF00 });
const sunMesh = new THREE.Mesh(sphereGeometry, sunMaterial);
sunMesh.scale.set(5, 5, 5);
solarSystem.add(sunMesh);
objects.push(sunMesh); // 太陽自轉


// earth
const earthOrbit = new THREE.Object3D();
earthOrbit.position.x = 10;
solarSystem.add(earthOrbit)
objects.push(earthOrbit); // 月球公轉

const earthMaterial = new THREE.MeshPhongMaterial({ color: 0x2233ff, emissive: 0x112244 });
const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
earthOrbit.add(earthMesh);
objects.push(earthMesh); // 地球自轉

// moon
const moonOrbit = new THREE.Object3D();
moonOrbit.position.x = 2;
earthOrbit.add(moonOrbit);

const moonMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x222222 });
const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
moonMesh.scale.set(0.5, .5, .5);
moonOrbit.add(moonMesh);
objects.push(moonMesh); // 月球自轉

// axes helper
makeHelper(solarSystem, 'solarSystem', 25);
makeHelper(sunMesh, 'sunMesh');
makeHelper(earthOrbit, 'earthOrbit');
makeHelper(earthMesh, 'earthMesh');
makeHelper(moonOrbit, 'moonOrbit');
makeHelper(moonMesh, 'moonMesh');


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

function render(time) {
  time *= 0.001;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  // objects.forEach((obj) => {
  //   obj.rotation.y = time;
  // });

  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);