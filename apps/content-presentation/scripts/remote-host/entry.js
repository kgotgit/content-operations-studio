// Bundle entry for the self-contained remote-components HTML host.
// Order matters: the payload hook must register its `beforeload` listener
// before the `<remote-component>` custom element is defined and upgraded.
import { registerPayload, getStats } from './payload-hook.js';
import { registerSharedModules } from 'remote-components/host/html';

const api = {
  version: __HOST_VERSION__,
  libraryVersion: __LIBRARY_VERSION__,
  registerPayload,
  registerSharedModules,
  getStats,
};

window.RemoteComponentsHost = api;

export { registerPayload, registerSharedModules, getStats };
export default api;
