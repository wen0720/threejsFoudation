import * as THREE from 'three';
import * as dat from 'lil-gui';

function main() {
  const gui = new dat.GUI();

  const canvas = document.querySelector('.webgl');
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;

  const scene = new THREE.Scene();

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  const cubes = []; // use to rotate cube;
  const loader = new THREE.TextureLoader();
  const texture = loader.load('https://threejs.org/manual/examples/resources/images/wall.jpg');

  const material = new THREE.MeshBasicMaterial({
    map: texture,
  })
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  cubes.push(cube);

  class DegToRadHelper {
    constructor(obj, prop) {
      this.obj = obj;
      this.prop = prop;
    }
    get value() {
      return THREE.MathUtils.radToDeg(this.obj[this.prop]);
    }
    set value(v) {
      this.obj[this.prop] = THREE.MathUtils.degToRad(v);
    }
  }

  class StringToNumberHelper {
    constructor(obj, prop) {
      this.obj = obj;
      this.prop = prop;
    }
    get value() {
      return this.obj[this.prop];
    }
    set value(v) {
      this.obj[this.prop] = parseFloat(v);
    }
  }

  function updateTexture() {
    texture.needsUpdate = true;
  }

  const wrapModes = {
    'ClampToEdgeWrapping': THREE.ClampToEdgeWrapping,
    'RepeatWrapping': THREE.RepeatWrapping,
    'MirroredRepeatWrapping': THREE.MirroredRepeatWrapping
  }

  gui.add(new StringToNumberHelper(texture, 'wrapS'), 'value', wrapModes).name('texture.wrapS')
    .onChange(updateTexture)
  gui.add(new StringToNumberHelper(texture, 'wrapT'), 'value', wrapModes).name('texture.wrapT')
    .onChange(updateTexture)
  gui.add(texture.repeat, 'x').min(0).max(5).step(0.01).name('texture.repeat.x');
  gui.add(texture.repeat, 'y').min(0).max(5).step(0.01).name('texture.repeat.y');
  // offset 的 range 在 0-1 之間
  gui.add(texture.offset, 'x').min(0).max(1).step(0.01).name('texture.offset.x');
  gui.add(texture.offset, 'y').min(0).max(1).step(0.01).name('texture.offset.y');
  gui.add(texture.center, 'x').min(0).max(1).step(0.01).name('texture.center.x');
  gui.add(texture.center, 'y').min(0).max(1).step(0.01).name('texture.center.y');
  gui.add(new DegToRadHelper(texture, 'rotation'), 'value').min(-360).max(360).step(1).name('texture.rotation');


  function resizeRendererToDisplaySize() {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = width !== canvas.width || height !== canvas.height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render(time) {
    time *= 0.001;

    if (resizeRendererToDisplaySize()) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    cubes.forEach((cube, index) => {
      const speed = 0.2 + index * 0.1;
      const rot = time * speed;
      cube.rotation.x = rot;
      cube.rotation.y = rot;
    })

    renderer.render(scene, camera);

    requestAnimationFrame(render)
  }

  requestAnimationFrame(render);
}

main();