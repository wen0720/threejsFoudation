import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'lil-gui';

function main() {
  const gui = new dat.GUI();
  const canvas = document.querySelector('.webgl');
  const renderer = new THREE.WebGLRenderer({ antiAlias: true, canvas });

  // camera
  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 10, 20);

  // controls
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.update();

  // texture
  const planeSize = 40;

  const loader = new THREE.TextureLoader();
  const texture = loader.load('./img/checker.png');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.repeat.set(planeSize / 2, planeSize / 2);

  // scene
  const scene = new THREE.Scene();

  // plane
  const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
  const material = new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide });
  const plane = new THREE.Mesh(planeGeometry, material);
  plane.rotation.x = -0.5 * Math.PI;
  scene.add(plane)

  // other
  {
    const cubeSize = 4;
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' });
    const mesh = new THREE.Mesh(cubeGeo, cubeMat);
    mesh.position.set(cubeSize + 1, cubeSize / 2, 0);
    scene.add(mesh);
  }
  {
    const sphereRadius = 3;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
    const sphereMat = new THREE.MeshPhongMaterial({ color: '#CA8' });
    const mesh = new THREE.Mesh(sphereGeo, sphereMat);
    mesh.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
    scene.add(mesh);
  }
  /**
   * ambientLight
   */
  const color = 0xFFFFFF;
  const intensity = 1;
  const light = new THREE.AmbientLight(color, intensity);
  // scene.add(light);

  class colorGUIHelper {
    constructor(object, prop) {
      this.object = object;
      this.prop = prop;
    }
    get value() {
      return `#${this.object[this.prop].getHexString()}`
    }
    set value(hexString) {
      this.object[this.prop].set(hexString);
    }
  }

  gui.addColor(new colorGUIHelper(light, 'color'), 'value').name('color')
  gui.add(light, 'intensity').min(0).max(2).step(0.01);

  /**
   *  hemisphereLight
   */
  const skyColor = 0xB1E1EF;
  const groundColor = 0xB97A20;
  const hemisphereLightIntensity = 1;
  const HemisphereLight = new THREE.HemisphereLight(skyColor, groundColor, hemisphereLightIntensity);
  // scene.add(HemisphereLight);

  /**
   * DirectionalLight
  */
  const directionalColor = 0xFFFFFF;
  const directionalIntensity = 1;
  const directionalLight = new THREE.DirectionalLight(directionalColor, directionalIntensity);
  directionalLight.position.set(0, 10, 0);
  directionalLight.target.position.set(-5, 0, 0);

  const updateDirectionalLight = () => {
    directionalLight.target.updateMatrixWorld();
    directionalHelper.update();
  }

  const makeXYZGui = (vector3, folderName, onChange) => {
    const folder = gui.addFolder(folderName);
    folder.add(vector3, 'x').min(-10).max(10).step(0.01).name('x').onChange(onChange);
    folder.add(vector3, 'y').min(-10).max(10).step(0.01).name('y').onChange(onChange);
    folder.add(vector3, 'z').min(-10).max(10).step(0.01).name('z').onChange(onChange);
    folder.open();
  }

  makeXYZGui(directionalLight.position, 'directionalLightPosition', updateDirectionalLight);
  makeXYZGui(directionalLight.target.position, 'directionalLightTargetPosition', updateDirectionalLight);
  // scene.add(directionalLight);

  const directionalHelper = new THREE.DirectionalLightHelper(directionalLight);
  // scene.add(directionalHelper);

  /**
   * PointLight
  */
  const pointColor = 0xFFFFFF;
  const pointIntensity = 1;
  /**
   * PointLight(color, 強度, 距離, 衰變)
   * 距離 -> 是光作用到最遠的地方，如果設定 10，那超過 10 個單元之後，就會是暗的
   * 衰變 -> 衰變的強度
   */
  const pointLight = new THREE.PointLight(pointColor, pointIntensity, 100, 5);
  pointLight.position.set(0, 10, 0);
  const pointLightHelper = new THREE.PointLightHelper(pointLight);
  // scene.add(pointLight);
  // scene.add(pointLightHelper);

  gui.add(pointLight, 'distance').min(0).max(300).step(0.01).name('pointLight.distance');


  /**
   * SpotLight
   */
  class DegRadHelper {
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

  const spotColor = 0xFFFFFF;
  const spotIntensity = 1;
  const spotLight = new THREE.SpotLight(spotColor, spotIntensity);
  spotLight.position.set(0, 10, 0);
  scene.add(spotLight);
  scene.add(spotLight.target);
  const spotLightHelper = new THREE.SpotLightHelper(spotLight);
  scene.add(spotLightHelper);

  makeXYZGui(spotLight.position, 'spotLightPos', () => {
    spotLightHelper.update();
  });
  makeXYZGui(spotLight.target.position, 'spotLightTargetPos', () => {
    spotLight.target.updateMatrixWorld();
    spotLightHelper.update();
  });
  gui.add(new DegRadHelper(spotLight, 'angle'), 'value').min(0).max(100).step(0.01).name('spotLightAngle')
  gui.add(spotLight, 'distance').min(0).max(40).name('spotLightDistance').onChange(() => {
    spotLightHelper.update();
  });

  /**
   * RectAreaLight
   */



  function resizeRendererToDisplaySize() {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needsUpdate = width !== canvas.width || height !== canvas.height;
    if (needsUpdate) {
      renderer.setSize(width, height, false);
    }
    return needsUpdate;
  }

  function render(time) {
    time *= 0.001;

    if (resizeRendererToDisplaySize()) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
  }

  window.requestAnimationFrame(render);
}

main();