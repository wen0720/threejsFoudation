import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'lil-gui';

const scene = new THREE.Scene();
const canvas = document.querySelector('canvas.webgl');
const sizes = { width: window.innerWidth, height: innerHeight };
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
const camera = new THREE.PerspectiveCamera(40, sizes.width / sizes.height, 0.1, 1000);

camera.position.set(5, 50, 5);
camera.lookAt(0, 0, 0)

/**
 * Models
 */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// gltfLoader.load(
//   '/models/untitled/untitled.gltf',
//   (gltf) =>
//   {
//       console.log('untitled.gltf', gltf.scene);
//       // gltf.scene.children[0].position.set(0, 0, 0);
//       // gltf.scene.position.set(-50, 0, -50);
//       scene.add(gltf.scene)
//   }
// )

gltfLoader.load(
  '/models/duck/Duck.gltf',
  (gltf) => {
    console.log('duck', gltf)
    scene.add(gltf.scene)
  }
)

{
  const light = new THREE.AmbientLight(0x404040);
  scene.add(light);
}

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

  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);