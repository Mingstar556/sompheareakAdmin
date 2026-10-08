/* ================================================================
   Somphea Reak Admin – Configuration
   Connects this Admin Dashboard to the Centralized Python API Server
   and SQLite Database (sompheareak.db).
   ================================================================ */
window.SR_CONFIG = (() => {
  // Default to local backend server or override with localStorage
  const savedApi = localStorage.getItem('sr_api_base');
  const savedStore = localStorage.getItem('sr_storefront_url');

  // If running directly on the backend server port (5000), relative path works.
  // Otherwise default to http://127.0.0.1:5000
  const isSameHostBackend = window.location.port === '5000';
  const defaultApi = isSameHostBackend ? '' : 'http://127.0.0.1:5000';
  const defaultStore = isSameHostBackend ? '/' : 'http://127.0.0.1:5000';

  return {
    API_BASE: savedApi !== null ? savedApi : defaultApi,
    STOREFRONT_URL: savedStore !== null ? savedStore : defaultStore,
    setApiBase(url) {
      localStorage.setItem('sr_api_base', url.trim().replace(/\/+$/, ''));
      window.location.reload();
    },
    setStorefrontUrl(url) {
      localStorage.setItem('sr_storefront_url', url.trim());
    }
  };
})();
