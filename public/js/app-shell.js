import { installConnectivityStatus } from './core/connectivity.js';
import { installFormClosures } from './core/dialogs.js';

installConnectivityStatus();
installFormClosures();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.warn('Service Worker no disponible:', error);
    });
  });
}
