import { init } from './shared-cubes';

const mouseEventHandler = makeSendPropertiesHandler([
  'ctrlKey',
  'metaKey',
  'shiftKey',
  'button',
  'pointerType',
  'clientX',
  'clientY',
  'pageX',
  'pageY',
]);
const wheelEventHandlerImpl = makeSendPropertiesHandler([
  'deltaX',
  'deltaY',
]);
const keydownEventHandler = makeSendPropertiesHandler([
  'ctrlKey',
  'metaKey',
  'shiftKey',
  'keyCode',
]);

function wheelEventHandler(event, sendFn) {
  event.preventDefault();
  wheelEventHandlerImpl(event, sendFn);
}

function preventDefaultHandler(event) {
  event.preventDefault();
}

function copyProperties(src, properties, dst) {
  for (const name of properties) {
    dst[name] = src[name];
  }
}

function makeSendPropertiesHandler(properties) {
  return function sendProperties(event, sendFn) {
    const data = { type: event.type };
    copyProperties(event, properties, data);
    sendFn(data);
  };
}

function touchEventHandler(event, sendFn) {
  const touches = [];
  const data = {type: event.type, touches};
  for (let i = 0; i < event.touches.length; ++i) {
    const touch = event.touches[i];
    touches.push({
      pageX: touch.pageX,
      pageY: touch.pageY,
    });
  }
  sendFn(data);
}

// The four arrow keys
const orbitKeys = {
  '37': true,  // left
  '38': true,  // up
  '39': true,  // right
  '40': true,  // down
};
function filteredKeydownEventHandler(event, sendFn) {
  const {keyCode} = event;
  if (orbitKeys[keyCode]) {
    event.preventDefault();
    keydownEventHandler(event, sendFn);
  }
}

let nextProxyId = 0;
class ElementProxy {
  constructor(element, worker, eventHanlders) {
    this.id = nextProxyId++;
    this.worker = worker;
    const sendEvent = (data) => {
      worker.postMessage({
        type: 'event',
        id: this.id,
        data,
      })
    }

    // register an id
    worker.postMessage({
      type: 'makeProxy',
      id: this.id,
    })

    sendSize()

    for (const [eventName, handler] of Object.entries(eventHanlders)) {
      element.addEventListener(eventName, (event) => {
        handler(event, sendEvent)
      })
    }

    function sendSize() {
      const rect = element.getBoundingClientRect();
      sendEvent({
        type: 'size',
        left: rect.left,
        top: rect.top,
        width: element.clientWidth,
        height: element.clientHeight
      })
    }
    window.addEventListener('resize', sendSize);
  }
}


function startWorker(canvas) {
  const worker = new Worker('./offscreencanvas-cube.js', { type: 'module' });
  const offscreen = canvas.transferControlToOffscreen();
  const eventHandlers = {
    contextmenu: preventDefaultHandler,
    mousedown: mouseEventHandler,
    mousemove: mouseEventHandler,
    mouseup: mouseEventHandler,
    pointerdown: mouseEventHandler,
    pointermove: mouseEventHandler,
    pointerup: mouseEventHandler,
    touchstart: touchEventHandler,
    touchmove: touchEventHandler,
    touchend: touchEventHandler,
    wheel: wheelEventHandler,
    keydown: filteredKeydownEventHandler,
  };
  const proxy = new ElementProxy(canvas, worker, eventHandlers);
  worker.postMessage({
    type: 'start',
    canvas: offscreen,
    canvasId: proxy.id,
  }, [offscreen])

  console.log('using worker')
}

function startMainPage(canvas) {
  init({ canvas, inputElement: canvas });
  console.log('using normal canvas')
}

function main() {
  const canvas = document.querySelector('.webgl');

  if (!canvas.transferControlToOffscreen) {
    // 不支援 offsetcanvas
    startMainPage(canvas);
  } else {
    startWorker(canvas);
  }
}

main();

// let sendMouse;

// sendMouse = (x, y) => {
//   worker.postMessage({
//     type: 'mouse',
//     x,
//     y
//   })
// }

// sendMouse = (x, y) => {
//   pickPosition.x = x;
//   pickPosition.y = y;
// }

// function setPickPosition(event) {
//   // 取得在 canvas 內的座標
//   const pos = getCanvasRelativePosition(event)
//   // 將座標(px)，轉換為相機的尺度（中間是0，上下個推 1）
//   const cameraPos = {
//     x: (pos.x / canvas.width) * 2 - 1,
//     y: (pos.y / canvas.height) * -2 + 1,  // flip Y
//   }
//   sendMouse(cameraPos.x, cameraPos.y);
// }

// function clearPosition() {
//   sendMouse(-5000, -5000);
// }

// window.addEventListener('mousemove', setPickPosition);
// window.addEventListener('mouseout', clearPosition);
// window.addEventListener('mouseleave', clearPosition);

// window.addEventListener('touchstart', (event) => {
//   event.preventDefault();
//   setPickPosition(event.touches[0]);
// }, { passive: false })

// window.addEventListener('touchmove', (event) => {
//   event.preventDefault();
//   setPickPosition(event.touches[0]);
// }, { passive: false })

// window.addEventListener('touchend', (event) => {
//   event.preventDefault();
//   clearPosition();
// }, { passive: false })

