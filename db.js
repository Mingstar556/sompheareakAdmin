/* ================================================================
   SRDB – Python Backend Client & Local Cache
   Connects to Python Flask backend (/api/...) and SQLite database.
   Provides instant synchronous access with background async sync.
   ================================================================ */
const SRDB = (() => {
  const STORAGE_KEY = 'srdb_cache_v5';
  const DEFAULT = {
    settings: {
      site_title: 'សម្ភារៈ - Somphea Reak',
      siteTitle: 'សម្ភារៈ - Somphea Reak',
      subtitle: 'Premium Studio',
      tagline: 'Cambodia Kingdom of Wonder',
      site_logo: 'logo.jpg',
      siteLogo: 'logo.jpg',
      admin_pin: 'Sompheareak.com04/10/2026-Ming',
      adminPin: 'Sompheareak.com04/10/2026-Ming',
      delivery_fee: 1.5,
      deliveryFee: 1.5,
      voucher_cost: 25,
      voucherCost: 25,
      voucher_pct: 10,
      voucherPct: 10,
      custom_base_price: 8.0,
      customBasePrice: 8.0,
      charm_price: 0.75,
      charmPrice: 0.75,
      custom_pt: 5,
      customPt: 5,
      charms: ['ch_plain_001'],
      announcement: '✨ Welcome to Somphea Reak Studio • Verified Telegram Orders • Earn Points on Every Item!',
      seller_telegram: 'sompheareak',
      sellerTelegram: 'sompheareak',
    },
    categories: [
      { id: 'custom-bracelet', name: 'Custom Italy Charm', kh: 'CUSTOMIZE ITALY CHARM', en: 'Build your own charm bracelet', icon: '🔗', grad: 'linear-gradient(135deg,#d4af37,#8b5cf6)', sort_order: 0 },
      { id: 'minifigure', name: 'Minifigure', kh: 'MINIFIGURE', en: 'Collectible mini figures', icon: '🧸', grad: 'linear-gradient(135deg,#06b6d4,#3b82f6)', sort_order: 1 },
      { id: 'toy-universe', name: 'Toy Universe', kh: 'TOY', en: 'Toy universe', icon: '🪀', grad: 'linear-gradient(135deg,#f97316,#ec4899)', sort_order: 2 },
      { id: 'bracelet', name: 'Ready-Made Bracelet', kh: 'Bracelet for Female&Male', en: 'Ready-made bracelets', icon: '📿', grad: 'linear-gradient(135deg,#22c55e,#14b8a6)', sort_order: 3 },
    ],
    products: [],
    charms: [
      {
        id: 'ch_plain_001',
        name: 'Classic Plain Stainless Link',
        category: 'Plain',
        price: 0.75,
        price_khr: 3000,
        stock: 999,
        image: 'charm_clean.png',
        active: 1,
        sort_order: 0,
        model_no: 'MD-001',
        color: 'Silver'
      }
    ],
    orders: [],
    users: [],
    notifications: [],
  };

  let data = readCache();
  function readCache() {
    try {
      const c = JSON.parse(localStorage.getItem(STORAGE_KEY)) || JSON.parse(localStorage.getItem('srdb_cache_v3'));
      if (c && c.settings) {
        const targetPin = DEFAULT.settings.admin_pin;
        if (c.settings.admin_pin !== targetPin || c.settings.adminPin !== targetPin) {
          c.settings.admin_pin = targetPin;
          c.settings.adminPin = targetPin;
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch (err) {}
        }
        return {
          ...DEFAULT,
          ...c,
          settings: {
            ...DEFAULT.settings,
            ...c.settings,
            admin_pin: targetPin,
            adminPin: targetPin
          },
          categories: (Array.isArray(c.categories) && c.categories.length) ? c.categories : structuredClone(DEFAULT.categories),
          charms: Array.isArray(c.charms) ? c.charms : [],
        };
      }
    } catch (e) {}
    return structuredClone(DEFAULT);
  }

  // Real-time zero-delay BroadcastChannel for instant cross-tab live sync
  const liveChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('sr_live_sync_bus') : null;

  // Version registry to detect real changes without refetching unchanged tables
  const VERSION_STORAGE_KEY = 'srdb_sync_versions_v1';
  let localVersions = (() => {
    try {
      return JSON.parse(localStorage.getItem(VERSION_STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  })();

  function saveVersions() {
    try {
      localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(localVersions));
    } catch (e) {}
  }

  function writeCache(broadcast = true, detail = {}) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
    notifyListeners(detail);
    if (broadcast && liveChannel) {
      try { liveChannel.postMessage({ type: 'SYNC', at: Date.now(), detail }); } catch (err) {}
    }
  }

  const listeners = [];
  function notifyListeners(detail = {}) {
    listeners.forEach(fn => {
      try { fn(detail); } catch (err) { console.error('Listener error:', err); }
    });
  }

  // Cross-tab broadcast listener
  if (liveChannel) {
    liveChannel.onmessage = e => {
      const msg = e.data || {};
      data = readCache();
      try { localVersions = JSON.parse(localStorage.getItem(VERSION_STORAGE_KEY)) || localVersions; } catch (err) {}
      notifyListeners(msg.detail || {});
    };
  }

  // Cross-tab storage fallback sync
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) {
      data = readCache();
      try { localVersions = JSON.parse(localStorage.getItem(VERSION_STORAGE_KEY)) || localVersions; } catch (err) {}
      notifyListeners({ storageEvent: true });
    }
  });

  // Base API caller connecting to Python Flask backend
  const API_BASE = (window.SR_CONFIG && window.SR_CONFIG.API_BASE !== undefined)
    ? window.SR_CONFIG.API_BASE
    : (localStorage.getItem('sr_api_base') || (window.location.port === '5000' ? '' : 'http://127.0.0.1:5000'));

  async function api(path, opts = {}) {
    try {
      const token = sessionStorage.getItem('sr_admin_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(opts.headers || {})
      };
      const res = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers,
      });
      if (!res.ok) {
        if (res.status === 401 && sessionStorage.getItem('sr_admin') === '1') {
          // Token expired or invalid - clear session and re-gate
          sessionStorage.removeItem('sr_admin_token');
          sessionStorage.removeItem('sr_admin');
          localStorage.removeItem('sr_admin_mode');
          location.reload();
        }
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // Token exchange authentication against /api/auth/exchange
  async function login(pin) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: String(pin).trim() })
      });
      const data = await res.json();
      if (res.ok && data.ok && data.token) {
        sessionStorage.setItem('sr_admin_token', data.token);
        sessionStorage.setItem('sr_admin', '1');
        localStorage.setItem('sr_admin_mode', '1');
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Invalid credentials' };
    } catch (err) {
      return { ok: false, error: err.message || 'Connection error' };
    }
  }

  let isSyncing = false;
  let initialSynced = false;

  // Smart Delta Sync from Python backend:
  // Pings lightweight /api/sync/status (<1ms) and only fetches updated resources!
  async function syncFromPython(forceAll = false) {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const statusRes = await api('/api/sync/status');
      if (!statusRes || !statusRes.ok || !statusRes.versions) {
        if (!initialSynced || forceAll) {
          await fullSyncFromPython();
          initialSynced = true;
        }
        return;
      }

      const serverV = statusRes.versions;
      const meta = statusRes.meta || {};

      if (!initialSynced || forceAll) {
        await fullSyncFromPython(serverV, meta);
        initialSynced = true;
        return;
      }

      const needSettings = serverV.settings !== localVersions.settings;
      const needCategories = serverV.categories !== localVersions.categories;
      const needProducts = serverV.products !== localVersions.products;
      const needCharms = serverV.charms !== localVersions.charms;
      const needOrders = serverV.orders !== localVersions.orders;
      const needUsers = serverV.users !== localVersions.users;
      const needNotifs = serverV.notifications !== localVersions.notifications;

      const anyNeeded = needSettings || needCategories || needProducts || needCharms || needOrders || needUsers || needNotifs;
      if (!anyNeeded) {
        // Zero server payload, zero re-renders!
        return;
      }

      const fetches = [];
      if (needSettings) fetches.push(api('/api/settings').then(res => ({ type: 'settings', res })));
      if (needCategories) fetches.push(api('/api/categories').then(res => ({ type: 'categories', res })));
      if (needProducts) fetches.push(api('/api/products?all=1').then(res => ({ type: 'products', res })));
      if (needCharms) fetches.push(api('/api/charms?all=1').then(res => ({ type: 'charms', res })));
      if (needOrders) fetches.push(api('/api/orders').then(res => ({ type: 'orders', res })));
      if (needUsers) fetches.push(api('/api/users').then(res => ({ type: 'users', res })));
      if (needNotifs) fetches.push(api('/api/notifications').then(res => ({ type: 'notifications', res })));

      const results = await Promise.all(fetches);
      let changedMap = {};

      results.forEach(({ type, res }) => {
        if (!res) return;
        if (type === 'settings') {
          data.settings = {
            ...data.settings,
            ...res,
            siteTitle: res.site_title || res.siteTitle || data.settings.siteTitle,
            siteLogo: res.site_logo || res.siteLogo || data.settings.siteLogo || 'logo.jpg',
            adminPin: res.admin_pin || res.adminPin || data.settings.adminPin,
            deliveryFee: res.delivery_fee !== undefined ? res.delivery_fee : data.settings.deliveryFee,
            voucherCost: res.voucher_cost !== undefined ? res.voucher_cost : data.settings.voucherCost,
            voucherPct: res.voucher_pct !== undefined ? res.voucher_pct : data.settings.voucherPct,
            customBasePrice: res.custom_base_price !== undefined ? res.custom_base_price : data.settings.customBasePrice,
            charmPrice: res.charm_price !== undefined ? res.charm_price : data.settings.charmPrice,
            customPremiumPkg: res.custom_premium_pkg !== undefined ? res.custom_premium_pkg : (data.settings.customPremiumPkg || 0.5),
            customPt: res.custom_pt !== undefined ? res.custom_pt : data.settings.customPt,
          };
          changedMap.settings = true;
        } else if (type === 'categories' && Array.isArray(res) && res.length) {
          data.categories = res;
          changedMap.categories = true;
        } else if (type === 'products' && Array.isArray(res)) {
          data.products = res;
          changedMap.products = true;
        } else if (type === 'charms' && Array.isArray(res)) {
          data.charms = res;
          changedMap.charms = true;
        } else if (type === 'orders' && Array.isArray(res)) {
          data.orders = res;
          changedMap.orders = true;
        } else if (type === 'users' && Array.isArray(res)) {
          data.users = res;
          changedMap.users = true;
        } else if (type === 'notifications' && Array.isArray(res)) {
          data.notifications = res;
          changedMap.notifications = true;
        }
      });

      if (Object.keys(changedMap).length > 0) {
        localVersions = { ...localVersions, ...serverV };
        saveVersions();
        writeCache(true, { changed: changedMap, meta });
      }
    } catch (e) {
      console.warn('Sync check error:', e);
    } finally {
      isSyncing = false;
    }
  }

  async function fullSyncFromPython(serverV = null, meta = {}) {
    const [st, cats, pr, ch, ord, usr, notif] = await Promise.all([
      api('/api/settings'),
      api('/api/categories'),
      api('/api/products?all=1'),
      api('/api/charms?all=1'),
      api('/api/orders'),
      api('/api/users'),
      api('/api/notifications')
    ]);

    let changed = false;
    if (st) {
      data.settings = {
        ...data.settings,
        ...st,
        siteTitle: st.site_title || st.siteTitle || data.settings.siteTitle,
        siteLogo: st.site_logo || st.siteLogo || data.settings.siteLogo || 'logo.jpg',
        adminPin: st.admin_pin || st.adminPin || data.settings.adminPin,
        deliveryFee: st.delivery_fee !== undefined ? st.delivery_fee : data.settings.deliveryFee,
        voucherCost: st.voucher_cost !== undefined ? st.voucher_cost : data.settings.voucherCost,
        voucherPct: st.voucher_pct !== undefined ? st.voucher_pct : data.settings.voucherPct,
        customBasePrice: st.custom_base_price !== undefined ? st.custom_base_price : data.settings.customBasePrice,
        charmPrice: st.charm_price !== undefined ? st.charm_price : data.settings.charmPrice,
        customPremiumPkg: st.custom_premium_pkg !== undefined ? st.custom_premium_pkg : (data.settings.customPremiumPkg || 0.5),
        customPt: st.custom_pt !== undefined ? st.custom_pt : data.settings.customPt,
      };
      changed = true;
    }
    if (Array.isArray(cats) && cats.length) { data.categories = cats; changed = true; }
    if (Array.isArray(pr)) { data.products = pr; changed = true; }
    if (Array.isArray(ch)) { data.charms = ch; changed = true; }
    if (Array.isArray(ord)) { data.orders = ord; changed = true; }
    if (Array.isArray(usr)) { data.users = usr; changed = true; }
    if (Array.isArray(notif)) { data.notifications = notif; changed = true; }

    if (serverV) {
      localVersions = { ...localVersions, ...serverV };
      saveVersions();
    }
    if (changed) {
      writeCache(false, { initial: true, meta });
    }
  }

  // Adaptive polling interval: 3 seconds when active, 12 seconds when hidden in background
  let pollTimer = null;
  function scheduleNextPoll() {
    clearTimeout(pollTimer);
    const delay = document.hidden ? 12000 : 3000;
    pollTimer = setTimeout(async () => {
      await syncFromPython();
      scheduleNextPoll();
    }, delay);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      syncFromPython();
      scheduleNextPoll();
    }
  });

  setTimeout(() => {
    syncFromPython(true);
    scheduleNextPoll();
  }, 40);

  return {
    login,
    logout() {
      sessionStorage.removeItem('sr_admin_token');
      sessionStorage.removeItem('sr_admin');
      localStorage.removeItem('sr_admin_mode');
    },
    isAuthenticated() {
      return Boolean(sessionStorage.getItem('sr_admin_token'));
    },
    onChange: fn => listeners.push(fn),
    sync: syncFromPython,
    reload() { data = readCache(); },

    /* --- Categories --- */
    categories: () => (Array.isArray(data.categories) && data.categories.length) ? data.categories : DEFAULT.categories,
    category: id => (data.categories || DEFAULT.categories).find(c => c.id === id),
    async upsertCategory(cat) {
      if (!Array.isArray(data.categories)) data.categories = structuredClone(DEFAULT.categories);
      if (cat.id) {
        const idx = data.categories.findIndex(c => c.id === cat.id);
        if (idx !== -1) data.categories[idx] = { ...data.categories[idx], ...cat };
        else data.categories.push(cat);
      } else {
        const slug = (cat.name || cat.kh || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('cat-' + Date.now().toString(36));
        cat.id = slug;
        data.categories.push(cat);
      }
      writeCache();
      const res = await api('/api/categories', {
        method: 'POST',
        body: JSON.stringify(cat)
      });
      if (res) syncFromPython();
      return cat;
    },
    async deleteCategory(id) {
      data.categories = (data.categories || DEFAULT.categories).filter(c => c.id !== id);
      writeCache();
      await api(`/api/categories/${id}`, { method: 'DELETE' });
      syncFromPython();
    },

    /* --- Settings --- */
    settings: () => data.settings,
    async saveSettings(patch) {
      Object.assign(data.settings, patch);
      writeCache();
      const res = await api('/api/settings', {
        method: 'POST',
        body: JSON.stringify(patch)
      });
      if (res) syncFromPython();
      return data.settings;
    },

    /* --- Products --- */
    products: (all = false) => data.products.filter(p => all || p.active),
    product: id => data.products.find(p => p.id === id),
    finalPrice: p => +(p.price * (1 - (p.discount || 0) / 100)).toFixed(2),

    async upsertProduct(p) {
      // Optimistic local update
      if (p.id) {
        const ex = this.product(p.id);
        if (ex) Object.assign(ex, p);
      } else {
        const tempId = 'P' + Date.now().toString(36);
        data.products.unshift({
          ...p,
          id: tempId,
          active: p.active !== undefined ? p.active : true,
          stock: Math.max(0, parseInt(p.stock) || 0),
          discount: Math.min(100, Math.max(0, parseFloat(p.discount) || 0)),
          createdAt: new Date().toISOString(),
        });
      }
      writeCache();

      // Post to Python API
      const saved = await api('/api/products', {
        method: 'POST',
        body: JSON.stringify(p)
      });
      if (saved) {
        syncFromPython();
        return saved;
      }
      return p;
    },

    async adjustStock(id, delta) {
      const p = this.product(id);
      if (p) {
        p.stock = Math.max(0, p.stock + delta);
        writeCache();
      }
      await api(`/api/products/${id}/stock`, {
        method: 'POST',
        body: JSON.stringify({ delta })
      });
      syncFromPython();
    },

    async deleteProduct(id) {
      data.products = data.products.filter(p => p.id !== id);
      writeCache();
      await api(`/api/products/${id}`, { method: 'DELETE' });
      syncFromPython();
    },

    async clearProducts() {
      data.products = [];
      writeCache();
      await api('/api/products/clear', { method: 'POST' });
      syncFromPython();
    },

    async seedSampleProducts() {
      const res = await api('/api/products/seed', { method: 'POST' });
      if (res) {
        await syncFromPython();
        return data.products.length;
      }
      return 0;
    },

    /* --- Charms (Italy Charm Bracelet Links & Customizer Studio) --- */
    charms: (all = false) => {
      const list = (data.charms || []).filter(c => all || c.active);
      return list.map((c, idx) => ({
        ...c,
        model_no: c.model_no || `MD-${(idx + 1).toString().padStart(3, '0')}`,
        color: c.color || 'Silver'
      }));
    },
    charm: id => {
      const c = (data.charms || []).find(ch => ch.id === id);
      if (!c) return null;
      return {
        ...c,
        model_no: c.model_no || 'MD-001',
        color: c.color || 'Silver'
      };
    },
    charmCategories() {
      const all = this.charms(true);
      const map = {};
      all.forEach(c => {
        const cat = c.category || 'Other';
        if (!map[cat]) map[cat] = { category: cat, count: 0, thumb: c.image };
        map[cat].count++;
      });
      return Object.values(map);
    },
    async upsertCharm(ch) {
      if (!Array.isArray(data.charms)) data.charms = [];
      const chData = {
        ...ch,
        model_no: ch.model_no || `MD-${(data.charms.length + 1).toString().padStart(3, '0')}`,
        color: ch.color || 'Silver',
        price: parseFloat(ch.price) || 0.75,
        price_khr: parseInt(ch.price_khr) || Math.round((parseFloat(ch.price) || 0.75) * 4000),
        stock: Math.max(0, parseInt(ch.stock) || 0),
        active: ch.active !== undefined ? (ch.active ? 1 : 0) : 1
      };
      if (ch.id) {
        const ex = (data.charms || []).find(c => c.id === ch.id);
        if (ex) Object.assign(ex, chData);
        else data.charms.unshift(chData);
      } else {
        const tempId = 'ch_' + Date.now().toString(36);
        chData.id = tempId;
        data.charms.unshift(chData);
      }
      writeCache();

      const saved = await api('/api/charms', {
        method: 'POST',
        body: JSON.stringify(chData)
      });
      if (saved) {
        syncFromPython();
        return saved;
      }
      return chData;
    },
    async adjustCharmStock(id, delta, newStock) {
      const ch = this.charm(id);
      if (ch) {
        if (newStock !== undefined) ch.stock = Math.max(0, parseInt(newStock) || 0);
        else if (delta !== undefined) ch.stock = Math.max(0, ch.stock + delta);
        writeCache();
      }
      await api(`/api/charms/${id}/stock`, {
        method: 'POST',
        body: JSON.stringify({ delta, stock: newStock })
      });
      syncFromPython();
    },
    async deleteCharm(id) {
      data.charms = (data.charms || []).filter(c => c.id !== id);
      writeCache();
      await api(`/api/charms/${id}`, { method: 'DELETE' });
      syncFromPython();
    },
    async seedCharms() {
      const res = await api('/api/charms/seed', { method: 'POST' });
      if (res) {
        await syncFromPython();
        return (data.charms || []).length;
      }
      return 0;
    },
    async clearCharms() {
      data.charms = [];
      writeCache();
      await api('/api/charms/clear', { method: 'POST' });
      syncFromPython();
    },

    /* --- Users --- */
    users: () => data.users,
    user: id => data.users.find(u => u.id === id),

    async upsertUser({ username, phone }) {
      const uname = username.trim().replace(/^@/, '');
      let u = data.users.find(x => x.username.toLowerCase() === uname.toLowerCase());
      if (u) {
        u.phone = phone;
      } else {
        u = {
          id: 'U' + Date.now().toString(36),
          username: uname,
          phone,
          name: '',
          points: 0,
          vouchers: [],
          point_log: [],
          createdAt: new Date().toISOString()
        };
        data.users.push(u);
      }
      writeCache();

      const serverUser = await api('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ username: uname, phone })
      });
      if (serverUser) {
        Object.assign(u, serverUser);
        writeCache();
      }
      return u;
    },

    async updateUser(id, patch) {
      const u = this.user(id);
      if (u) {
        Object.assign(u, patch);
        writeCache();
      }
      await api(`/api/users/${id}`, {
        method: 'POST',
        body: JSON.stringify(patch)
      });
      syncFromPython();
    },

    async redeemVoucher(userId) {
      const res = await api(`/api/users/${userId}/redeem-voucher`, {
        method: 'POST'
      });
      if (res && res.voucher) {
        const u = this.user(userId);
        if (u && res.user) {
          Object.assign(u, res.user);
          writeCache();
        }
        syncFromPython();
        return res;
      }
      // Offline fallback
      const u = this.user(userId);
      if (!u) return { error: 'User not found' };
      const st = this.settings();
      const vc = st.voucherCost || 25;
      const vp = st.voucherPct || 10;
      if ((u.points || 0) < vc) return { error: `Insufficient points (need ${vc} pt)` };
      const code = 'SR' + vp + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      const vObj = { code, pct: vp, used: false, created_at: new Date().toISOString() };
      if (!u.vouchers) u.vouchers = [];
      u.vouchers.unshift(vObj);
      u.points -= vc;
      if (!u.point_log) u.point_log = [];
      u.point_log.unshift({ t: 'Redeemed voucher ' + code, d: -vc, at: new Date().toISOString() });
      writeCache();
      return { voucher: vObj, user: u };
    },

    async resetDatabase() {
      const res = await api('/api/database/reset', { method: 'POST' });
      await syncFromPython();
      return res;
    },

    async addPoints(id, delta, reason) {
      const u = this.user(id);
      if (u) {
        u.points = Math.max(0, u.points + delta);
        if (!u.point_log) u.point_log = [];
        u.point_log.unshift({ t: reason, d: delta, at: new Date().toISOString() });
        writeCache();
      }
      await api(`/api/users/${id}/points`, {
        method: 'POST',
        body: JSON.stringify({ delta, reason })
      });
      syncFromPython();
    },

    /* --- Orders --- */
    orders: () => data.orders,
    ordersOf: userId => data.orders.filter(o => o.user_id === userId || o.userId === userId),
    order: id => data.orders.find(o => o.id === id),

    async placeOrder(orderData) {
      const payload = {
        user_id: orderData.userId || orderData.user_id,
        items: orderData.items,
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        delivery: orderData.delivery,
        total: orderData.total,
        earned: orderData.earned,
        voucher: orderData.voucher,
        contact: orderData.contact,
      };

      const tempId = 'SR' + Date.now().toString().slice(-6);
      const localOrder = { ...payload, id: tempId, status: 'Pending', createdAt: new Date().toISOString() };
      data.orders.unshift(localOrder);

      if (payload.voucher) {
        const u = this.user(payload.user_id);
        if (u && Array.isArray(u.vouchers)) {
          const v = u.vouchers.find(x => x.code === payload.voucher);
          if (v) {
            v.used = true;
            v.used_at = new Date().toISOString();
            v.order_id = tempId;
          }
        }
      }
      writeCache();

      const saved = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (saved) {
        Object.assign(localOrder, saved);
        if (payload.voucher) {
          const u = this.user(payload.user_id);
          const v = u?.vouchers?.find(x => x.code === payload.voucher);
          if (v) v.order_id = saved.id;
        }
        writeCache();
        syncFromPython();
        return saved;
      }
      return localOrder;
    },

    async approveOrder(id) {
      const o = this.order(id);
      if (!o || o.status !== 'Pending') return 'Order is not in pending status';

      // Check stock locally
      for (const it of o.items || []) {
        if (it.productId) {
          const p = this.product(it.productId);
          if (p && p.stock < (it.qty || 1)) {
            return `Insufficient stock for "${p.name}" (only ${p.stock} remaining)`;
          }
        }
      }

      const res = await api(`/api/orders/${id}/approve`, { method: 'POST' });
      if (res && res.error) return res.error;

      // Local update
      o.status = 'Approved';
      (o.items || []).forEach(it => {
        if (it.productId) {
          const p = this.product(it.productId);
          if (p) p.stock = Math.max(0, p.stock - (it.qty || 1));
        }
      });
      writeCache();
      syncFromPython();
      return null;
    },

    async rejectOrder(id, note = 'Out of stock') {
      const o = this.order(id);
      if (o) { o.status = 'Rejected'; o.note = note; writeCache(); }
      await api(`/api/orders/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note })
      });
      syncFromPython();
    },

    async cancelOrder(id, reason = 'Cancelled by admin') {
      const o = this.order(id);
      if (o) { o.status = 'Cancelled'; o.note = reason; writeCache(); }
      await api(`/api/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      syncFromPython();
    },

    async setStatus(id, status) {
      const o = this.order(id);
      if (o) { o.status = status; writeCache(); }
      await api(`/api/orders/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
      syncFromPython();
    },

    /* --- Notifications --- */
    notifications: () => data.notifications,
    unread: () => data.notifications.filter(n => !n.read && n.type === 'receipt').length,
    async markAllRead() {
      data.notifications.forEach(n => { n.read = true; });
      writeCache();
      await api('/api/notifications/read', { method: 'POST' });
    },
  };
})();
