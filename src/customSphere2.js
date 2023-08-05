import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// pick

class PickHelper {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.pickObjectSavedColor = 0;
  }
  pick(normalPosition, scene, camera, time) {
    if (this.pickedObject) {
      if (this.pickedObject.material.emissive) {
        this.pickedObject.material.emissive.setHex(this.pickObjectSavedColor);
      }
      this.pickedObject = undefined;
    }
    this.raycaster.setFromCamera(normalPosition, camera);
    const intersectedObjects = this.raycaster.intersectObjects(scene.children);
    if (intersectedObjects.length) {
      this.pickedObject = intersectedObjects[0].object;
      // console.log(this.pickedObject);
      if (this.pickedObject.material.emissive) {
        this.pickObjectSavedColor = this.pickedObject.material.emissive.getHex();
        // this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
        this.pickedObject.material.emissive.setHex(0xFF0000);
      }
    }
  }
}
const pickPosition = { x: 0, y: 0};
function getCanvasRelativePosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width  / rect.width,
    y: (event.clientY - rect.top ) * canvas.height / rect.height,
  };
}

function setPickPosition(event) {
  const { x, y } = getCanvasRelativePosition(event);
  pickPosition.x = (x / canvas.width ) * 2 - 1;
  pickPosition.y = (y / canvas.height) * -2 + 1;
}

function clearPickPosition() {
  pickPosition.x = -100000;
  pickPosition.y = -100000;
}

const pickHelper = new PickHelper();

window.addEventListener('mousemove', setPickPosition);
window.addEventListener('mouseleave', clearPickPosition);
window.addEventListener('mouseout', clearPickPosition);

// pick end

const negative = -1; // 因為想把幾何的正面朝向圓的內部

const ww = window.innerWidth;
const wh = window.innerHeight;

const canvas = document.querySelector('.webgl');

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, ww / wh, 0.1, 100);
// camera.position.z = 1
camera.position.z = 0.5;

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.update();

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(ww, wh, false);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

{
  const light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(2, -2, 3);
  scene.add(light);

  const light2 = new THREE.DirectionalLight(0xffffff, 0.6);
  light2.position.set(-2, 2, -3);
  scene.add(light2);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight)
}

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('./img/3.png');

const widthSegment = 12;
const heightSegment = 8;
const positionUnit = 3;
const uvUnit = 2;

const longHelper = new THREE.Group();
const latHelper = new THREE.Group();
const posZHelper = new THREE.Group();
longHelper.add(latHelper)
latHelper.add(posZHelper);
posZHelper.position.z = 1 * negative;

const temp = new THREE.Vector3();

function getPoint(lat, lon) {
  latHelper.rotation.x = lat;
  longHelper.rotation.y = lon;
  longHelper.updateMatrixWorld(true);
  return posZHelper.getWorldPosition(temp).toArray();
}

const geometries = [];

for (let i = 0; i < heightSegment; i++) {
  const v0 = i / heightSegment;
  const v1 = (i + 1) / heightSegment;
  const lat0 = (v0 - 0.5) * Math.PI * negative;
  const lat1 = (v1 - 0.5) * Math.PI * negative;
  for (let y = 0; y < widthSegment; y++) {
    const u0 = y / widthSegment;
    const u1 = (y + 1) / widthSegment;
    const lon0 = u0 * Math.PI * 2 * negative;
    const lon1 = u1 * Math.PI * 2 * negative;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(4 * positionUnit);
    const uvs = new Float32Array(4 * uvUnit)

    positions.set(getPoint(lat0, lon0), 0 * positionUnit);
    uvs.set([u0, 1 - v0], 0 * uvUnit);
    positions.set(getPoint(lat1, lon0), 1 * positionUnit);
    uvs.set([u0, 1 - v1], 1 * uvUnit);
    positions.set(getPoint(lat0, lon1), 2 * positionUnit);
    uvs.set([u1, 1 - v0], 2 * uvUnit);
    positions.set(getPoint(lat1, lon1), 3 * positionUnit);
    uvs.set([u1, 1 - v1], 3 * uvUnit);

    const normals = positions.slice();

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, positionUnit));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, uvUnit));
    geometry.setIndex([0, 1, 2, 2, 1, 3]);

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({
        // color: 0xff00ff,
        side: THREE.DoubleSide,
        // wireframe: true,
        transparent: true,
        map: texture
      })
    );

    scene.add(mesh);

    if (!Array.isArray(geometries[i])) {
      geometries[i] = [mesh]
    } else {
      geometries[i].push(mesh)
    }
  }
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const nowWidth = canvas.clientWidth;
  const nowHeight = canvas.clientHeight;
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  let needResize = nowWidth !== canvasWidth || nowHeight !== canvasHeight;
  if (needResize) {
    renderer.setSize(nowWidth, nowHeight, false);
  }
  return needResize;
}


const tempAnimate = new THREE.Vector3();

function tick(time) {
  time *= 0.001;

  if (resizeRendererToDisplaySize(renderer)) {
    const nowWidth = renderer.domElement.clientWidth;
    const nowHeight = renderer.domElement.clientHeight;
    camera.aspect = nowWidth / nowHeight;
    camera.updateProjectionMatrix();
  }

  controls.update();

  // for (let row=0; row < geometries.length; row++) {
  //   for (let col=0; col<geometries[row].length; col++) {
  //     const positionAttribute = geometries[row][col].geometry.getAttribute('position');
  //     const positions = positionAttribute.array;
  //     const normalAttribute = geometries[row][col].geometry.getAttribute('normal');
  //     const normals = normalAttribute.array;
  //     for (let xyz=0; xyz < normals.length; xyz += 3) {
  //       const ring = row % geometries.length;
  //       const angle = (col / geometries[row].length) * Math.PI * 2;
  //       tempAnimate.fromArray(normals, xyz);
  //       tempAnimate.multiplyScalar(THREE.MathUtils.lerp(1, 1.8, Math.sin(time + angle + ring) * .5 + .5));
  //       tempAnimate.toArray(positions, xyz);
  //     }
  //     positionAttribute.needsUpdate = true;
  //   }
  // }

  pickHelper.pick(pickPosition, scene, camera, time)

  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
}

for (let row=0; row < geometries.length; row++) {
  for (let col=0; col<geometries[row].length; col++) {
    const positionAttribute = geometries[row][col].geometry.getAttribute('position');
    const positions = positionAttribute.array;
    const normalAttribute = geometries[row][col].geometry.getAttribute('normal');
    const normals = normalAttribute.array;
    for (let xyz=0; xyz < normals.length; xyz += 3) {
      const ring = row % geometries.length;
      const angle = (col / geometries[row].length) * Math.PI * 2;
      tempAnimate.fromArray(normals, xyz);
      tempAnimate.multiplyScalar(THREE.MathUtils.lerp(1, 1.8, Math.sin(angle + ring) * .5 + .5));
      tempAnimate.toArray(positions, xyz);
    }
    positionAttribute.needsUpdate = true;
  }
}

window.requestAnimationFrame(tick);

document.addEventListener('click', () => {
  if (pickHelper.pickedObject) {
    const pickedGeometry = pickHelper.pickedObject.geometry;
    /**
     * center 是目前要關注的幾何的中心
     */
    const center = pickedGeometry.boundingSphere.center;
    pickHelper.pickedObject.localToWorld(center)
    // set control
    const originControlTarget = {
      x: controls.target.x,
      y: controls.target.y,
      z: controls.target.z
    };
    gsap.to(originControlTarget, {
      duration: 1,
      x: center.x,
      y: center.y,
      z: center.z,
      onUpdate() {
        controls.target.set(originControlTarget.x, originControlTarget.y, originControlTarget.z);
        controls.update()
      },
      onComplete() {
        const geometryNormal = center.clone()
        const cameraDest = center.multiplyScalar(0.6)

        const curve = new THREE.CatmullRomCurve3([
          camera.position,
          cameraDest
        ]);
        const movePoint = curve.getPoints(100)
        const progress = { value: 0 };
        gsap.to(progress, {
          value: 100,
          duration: 2,
          onUpdate() {
            const nowPos = movePoint[Math.round(progress.value)];
            camera.position.set(nowPos.x, nowPos.y, nowPos.z);
          },
          onComplete() {
            // camera.lookAt(center.x, center.y, center.z);
            // controls.target.set(center.x, center.y, center.z);
            // controls.update()
          }
        })
      }
    })
  }
})

// helper
// const axesHelper = new THREE.AxesHelper(3);
// scene.add(axesHelper);
