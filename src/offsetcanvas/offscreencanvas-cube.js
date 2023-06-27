import { init } from './shared-cubes';
import { ProxyManager } from './events';

const proxyManager = new ProxyManager();

function start(data) {
  const proxy = proxyManager.getProxy(data.canvasId)
  init({
    canvas: data.canvas,
    inputElement: proxy,
  });
}

function makeProxy(data) {
  proxyManager.makeProxy(data);
}

const handlers = {
  start,
  makeProxy,
  event: proxyManager.handleEvent,
}

self.onmessage = function (e) {
  const fn = handlers[e.data.type];
  if (typeof fn !== 'function') {
    throw Error('no handler for type');
  }
  fn(e.data);
}
