/* ================================================================
   Somphea Reak Admin – Configuration
   Connects this Admin Dashboard to the Centralized Python API Server
   and SQLite Database (sompheareak.db).
   ================================================================ */
window.SR_CONFIG = (() => {
  const savedApi = localStorage.getItem('sr_api_base');
  const savedStore = localStorage.getItem('sr_storefront_url');

  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  const protocol = window.location.protocol;

  // Smart dynamic host resolution:
  // 1. If running on backend port 5000, relative '' works seamlessly.
  // 2. If running on mobile / LAN IP (e.g. 192.168.1.11:5500), API is http://192.168.1.11:5000
  // 3. If running on localhost or 127.0.0.1 (PC desktop), API is http://127.0.0.1:5000
  // 4. If hosted on cloud/domain (e.g. admin.sompheareak.com), default to production API
  let defaultApi = 'http://127.0.0.1:5000';
  if (currentPort === '5000') {
    defaultApi = '';
  } else if (currentHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    if (currentHost.includes('github.io') || currentHost.includes('sompheareak.com')) {
      defaultApi = 'https://sompheareak.com';
    } else {
      // Local LAN Wi-Fi (e.g. 192.168.x.x or custom dev domain)
      defaultApi = `${protocol}//${currentHost}:5000`;
    }
  }

  const defaultStore = currentPort === '5000' ? '/' : (defaultApi || 'http://127.0.0.1:5000');

  return {
    API_BASE: (savedApi !== null && savedApi !== '') ? savedApi : defaultApi,
    STOREFRONT_URL: savedStore !== null ? savedStore : defaultStore,
    setApiBase(url) {
      if (!url) {
        localStorage.removeItem('sr_api_base');
      } else {
        localStorage.setItem('sr_api_base', url.trim().replace(/\/+$/, ''));
      }
      window.location.reload();
    },
    setStorefrontUrl(url) {
      localStorage.setItem('sr_storefront_url', url.trim());
    }
  };
})();
