export function installConnectivityStatus(selector = '#connection-status') {
  const status = document.querySelector(selector);
  if (!status) return;
  const update = () => {
    const online = navigator.onLine;
    status.classList.toggle('offline', !online);
    status.querySelector('span').textContent = online ? 'En línea' : 'Sin conexión';
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}
