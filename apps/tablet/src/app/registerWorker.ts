function register() {
  const workerUrl = new URL('sw.js', document.baseURI);
  navigator.serviceWorker.register(workerUrl.href).catch(() => {
    // The dashboard still works when offline storage is unavailable (e.g. HTTP LAN).
  });
}

export function registerWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }
  // SystemJS can finish loading after the window load event.
  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}
