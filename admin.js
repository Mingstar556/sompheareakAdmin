/* Somphea Reak – Admin panel connected to Python Backend & SQLite DB */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const money = n => '$' + (+n).toFixed(2);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CATS = { minifigure: 'Minifigure', 'toy-universe': 'Toy', bracelet: 'Bracelet' };
const DEFAULT_PT = { minifigure: 1, 'toy-universe': 1, bracelet: 3 };

const PRESET_IMAGES = [
  { label: 'Astronaut Mini', cat: 'minifigure', url: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=600&auto=format&fit=crop&q=80' },
  { label: 'Ninja Figurine', cat: 'minifigure', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80' },
  { label: 'Mecha Robot', cat: 'minifigure', url: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=600&auto=format&fit=crop&q=80' },
  { label: 'Wizard Figurine', cat: 'minifigure', url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&auto=format&fit=crop&q=80' },
  { label: 'Vintage Racer', cat: 'toy-universe', url: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=80' },
  { label: 'Plush Bear', cat: 'toy-universe', url: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=600&auto=format&fit=crop&q=80' },
  { label: 'Space Shuttle', cat: 'toy-universe', url: 'https://images.unsplash.com/photo-1517976487502-53644f128e08?w=600&auto=format&fit=crop&q=80' },
  { label: '18K Gold Cuban Chain', cat: 'bracelet', url: 'https://images.unsplash.com/photo-1611591475155-42647548d617?w=600&auto=format&fit=crop&q=80' },
  { label: 'Sterling Silver Link', cat: 'bracelet', url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&auto=format&fit=crop&q=80' },
  { label: 'Matte Black Onyx Beads', cat: 'bracelet', url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80' },
  { label: 'Rose Gold Duo Bracelet', cat: 'bracelet', url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&auto=format&fit=crop&q=80' },
];

function toast(m) {
  const t = $('#toast');
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2600);
}

function modal(h) {
  $('#modalBody').innerHTML = h;
  $('#modal').classList.remove('hidden');
}

function closeModal() {
  $('#modal').classList.add('hidden');
}

$('#modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});

let _sharedAudioCtx = null;
function getSharedAudioContext() {
  if (!_sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      _sharedAudioCtx = new AudioContextClass();
    }
  }
  if (_sharedAudioCtx && _sharedAudioCtx.state === 'suspended') {
    _sharedAudioCtx.resume().catch(() => {});
  }
  return _sharedAudioCtx;
}

['click', 'keydown', 'touchstart'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (_sharedAudioCtx && _sharedAudioCtx.state === 'suspended') {
      _sharedAudioCtx.resume().catch(() => {});
    }
  }, { once: true, passive: true });
});

function playNotificationSound() {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.12);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {}
}

/* Theme sync with circular reveal transition */
const sess = JSON.parse(localStorage.getItem('sr_session') || '{}');
let theme = sess.theme || 'dark';
const applyTheme = () => {
  document.documentElement.dataset.theme = theme;
};
let adminThemeTransitioning = false;
const toggleTheme = (e) => {
  if (adminThemeTransitioning) return;
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  const btn = $('#themeSwitch');
  let x = window.innerWidth / 2;
  let y = 40;
  if (btn) {
    const rect = btn.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  } else if (e && e.clientX) {
    x = e.clientX;
    y = e.clientY;
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const applyNewTheme = () => {
    theme = nextTheme;
    sess.theme = theme;
    localStorage.setItem('sr_session', JSON.stringify(sess));
    applyTheme();
  };

  if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    adminThemeTransitioning = true;
    const transition = document.startViewTransition(() => {
      applyNewTheme();
    });
    transition.ready.then(() => {
      const anim = document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 560,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );
      anim.onfinish = () => {
        adminThemeTransitioning = false;
      };
    }).catch(() => {
      adminThemeTransitioning = false;
    });
  } else {
    adminThemeTransitioning = true;
    let overlay = document.getElementById('themeWaveOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'themeWaveOverlay';
      overlay.className = 'theme-wave-circle';
      document.body.appendChild(overlay);
    }
    overlay.style.backgroundColor = nextTheme === 'light' ? '#eaedf2' : '#0c0e17';
    overlay.style.display = 'block';
    overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;

    const anim = overlay.animate(
      [
        { clipPath: `circle(0px at ${x}px ${y}px)` },
        { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` }
      ],
      {
        duration: 500,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    );
    anim.onfinish = () => {
      applyNewTheme();
      overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).onfinish = () => {
        overlay.style.display = 'none';
        overlay.style.opacity = '1';
        adminThemeTransitioning = false;
      };
    };
  }
};
const themeSwitchEl = $('#themeSwitch') || $('#themeBtn');
if (themeSwitchEl) themeSwitchEl.onclick = toggleTheme;
applyTheme();

/* PIN Gate & Quick Login */
const pinInput = $('#pin');
$('#togglePinVis').onclick = () => {
  pinInput.type = pinInput.type === 'password' ? 'text' : 'password';
};

// Display active API Server address and allow quick reconfiguration
const apiDisplayEl = $('#apiEndpointDisplay');
if (apiDisplayEl && window.SR_CONFIG) {
  apiDisplayEl.textContent = window.SR_CONFIG.API_BASE || '(Same Origin)';
}
const changeApiBtn = $('#changeApiBtn');
if (changeApiBtn && window.SR_CONFIG) {
  changeApiBtn.onclick = () => {
    const current = window.SR_CONFIG.API_BASE || '';
    const updated = prompt('Enter Backend API Server URL (e.g. http://192.168.1.11:5000 or https://sompheareak.com):', current);
    if (updated !== null) {
      window.SR_CONFIG.setApiBase(updated);
    }
  };
}

const adminRememberEl = $('#adminRememberCheckbox');
if (adminRememberEl) {
  const isRemember = localStorage.getItem('sr_admin_remember') !== 'false';
  adminRememberEl.checked = isRemember;
  adminRememberEl.onchange = () => {
    localStorage.setItem('sr_admin_remember', adminRememberEl.checked ? 'true' : 'false');
  };
}

$('#pinBtn').onclick = async () => {
  const val = pinInput.value.trim();
  if (!val) {
    $('#pinErr').textContent = 'Please enter PIN code';
    $('#pinErr').classList.remove('hidden');
    return;
  }
  $('#pinBtn').disabled = true;
  $('#pinBtn').textContent = 'Verifying...';

  try {
    const res = await SRDB.login(val);
    if (res && res.ok) {
      $('#pinErr').classList.add('hidden');
      const isRemember = adminRememberEl ? adminRememberEl.checked : (localStorage.getItem('sr_admin_remember') !== 'false');
      if (isRemember && res.data && res.data.token) {
        localStorage.setItem('sr_admin_token', res.data.token);
        localStorage.setItem('sr_admin', '1');
        localStorage.setItem('sr_admin_remember', 'true');
      } else {
        localStorage.removeItem('sr_admin_token');
        localStorage.removeItem('sr_admin');
        localStorage.setItem('sr_admin_remember', 'false');
      }
      enter();
    } else {
      $('#pinErr').textContent = (res && res.error) || 'Invalid Admin PIN';
      $('#pinErr').classList.remove('hidden');
      pinInput.select();
    }
  } catch (err) {
    $('#pinErr').textContent = 'Login failed. Please check backend connection.';
    $('#pinErr').classList.remove('hidden');
  } finally {
    $('#pinBtn').disabled = false;
    $('#pinBtn').textContent = 'Login to Dashboard';
  }
};

pinInput.onkeydown = e => {
  if (e.key === 'Enter') $('#pinBtn').click();
};

$('#logoutBtn').onclick = () => {
  logoutAdmin();
};

function enter() {
  $('#adminGate').classList.add('hidden');
  $('#admin').classList.remove('hidden');
  render();
}

/* Navigation Tabs */
let tab = 'dashboard', orderFilter = 'Pending', orderSearchQuery = '';

function onOrderSearchChange(q) {
  orderSearchQuery = (q || '').trim();
  render();
}

function clearOrderSearch() {
  orderSearchQuery = '';
  render();
}

const TABS = [
  ['dashboard', '📊 Dashboard'],
  ['storefront', '👑 Customer Shop (Live Edit)'],
  ['orders', '🧾 Orders & Receipts'],
  ['products', '🛍️ Products & Prices'],
  ['categories', '🏷️ Categories'],
  ['charms', '🔗 Italy Charms & Studio'],
  ['customers', '👥 Customers & Pt'],
  ['settings', '⚙️ Site Settings'],
  ['database', '🗄️ Database (SQLite)']
];

function applyLogo() {
  const isDark = (document.documentElement.dataset.theme || 'dark') !== 'light';
  const logoSrc = isDark ? 'logo-dark.jpg' : 'logo-light.png';
  $$('.site-logo-img').forEach(img => {
    if (img.getAttribute('src') !== logoSrc) img.src = logoSrc;
  });
  const fav = $('#faviconEl');
  if (fav && fav.getAttribute('href') !== logoSrc) fav.href = logoSrc;
}

function render() {
  applyLogo();
  const pend = SRDB.orders().filter(o => o.status === 'Pending').length;
  
  // Topbar notification bell badge
  const bellBadge = $('#adminPendingCount');
  if (bellBadge) {
    if (pend > 0) {
      bellBadge.textContent = pend;
      bellBadge.classList.remove('hidden');
    } else {
      bellBadge.classList.add('hidden');
    }
  }

  // Browser tab title notification
  if (pend > 0) {
    document.title = `(${pend}) New Orders! • Somphea Reak Admin`;
  } else {
    document.title = 'Admin Panel | Somphea Reak';
  }

  $('#side').innerHTML = TABS.map(([k, l]) => `
    <button class="${tab === k ? 'active' : ''}" onclick="tab='${k}';render()">
      <span>${l}</span>
      ${k === 'orders' && pend ? `<span class="badge pending-pulse" style="position:static">${pend} PENDING</span>` : ''}
    </button>`).join('');

  // Mobile Bottom Dock Synchronization
  const ambMap = {
    dashboard: '#ambTabDashboard',
    orders: '#ambTabOrders',
    products: '#ambTabProducts',
    categories: '#ambTabCategories'
  };
  ['dashboard', 'orders', 'products', 'categories'].forEach(k => {
    const el = $(ambMap[k]);
    if (el) el.classList.toggle('active', tab === k);
  });
  const ambMore = $('#ambTabMore');
  if (ambMore) {
    ambMore.classList.toggle('active', ['storefront', 'charms', 'customers', 'settings', 'database'].includes(tab));
  }
  const ambOrdersBadge = $('#ambOrdersBadge');
  if (ambOrdersBadge) {
    if (pend > 0) {
      ambOrdersBadge.textContent = pend;
      ambOrdersBadge.classList.remove('hidden');
    } else {
      ambOrdersBadge.classList.add('hidden');
    }
  }

  ({ dashboard, storefront, orders, products, categories, charms, customers, settings, database })[tab]();
}

function switchAdminTab(tName) {
  tab = tName;
  render();
}

function openAdminMoreSheet() {
  modal(`
  <div style="text-align:left">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 style="margin:0">⚙️ More Admin Features</h3>
      <span class="badge ok">Mobile Quick Desk</span>
    </div>
    <p class="muted small" style="margin-bottom:16px">Access customer points, site branding, database, and front editor</p>
    
    <div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn ghost" style="justify-content:flex-start;padding:12px 14px;border-radius:10px;font-size:0.95rem" onclick="closeModal();switchAdminTab('charms')">
        🔗 <b>Italy Charm Bracelet Studio & Parts</b>
      </button>
      <button class="btn ghost" style="justify-content:flex-start;padding:12px 14px;border-radius:10px;font-size:0.95rem" onclick="closeModal();switchAdminTab('customers')">
        👥 <b>Customer Accounts & Loyalty Points</b>
      </button>
      <button class="btn ghost" style="justify-content:flex-start;padding:12px 14px;border-radius:10px;font-size:0.95rem" onclick="closeModal();switchAdminTab('settings')">
        ⚙️ <b>Website Settings & Studio Logo</b>
      </button>
      <button class="btn ghost" style="justify-content:flex-start;padding:12px 14px;border-radius:10px;font-size:0.95rem" onclick="closeModal();switchAdminTab('database')">
        🗄️ <b>Python SQLite Database (Live DB)</b>
      </button>
      <button class="btn ghost" style="justify-content:flex-start;padding:12px 14px;border-radius:10px;font-size:0.95rem" onclick="playNotificationSound();toast('🔔 Chime sound played! Audio enabled.')">
        🔊 <b>Test Order Notification Alert Sound</b>
      </button>
      <button class="btn primary" style="justify-content:flex-start;padding:12px 14px;border-radius:10px;font-size:0.95rem" onclick="closeModal();switchAdminTab('storefront')">
        👑 <b>Customer Shop (Live Visual Editor)</b>
      </button>
      <a href="#" onclick="closeModal();window.open(window.SR_CONFIG ? window.SR_CONFIG.STOREFRONT_URL : 'http://127.0.0.1:5000', '_blank');return false;" class="btn ghost" style="justify-content:flex-start;padding:12px 14px;border-radius:10px;font-size:0.95rem;text-decoration:none">
        🛒 <b>View Customer Storefront (Normal) ↗</b>
      </a>
      <button class="btn danger sm" style="margin-top:10px;justify-content:center" onclick="closeModal();logoutAdmin()">
        ⏻ Log out from Admin Panel
      </button>
    </div>
  </div>`);
}

function logoutAdmin() {
  if (confirm('Are you sure you want to log out from Admin Desk?')) {
    sessionStorage.removeItem('sr_admin');
    sessionStorage.removeItem('sr_admin_token');
    localStorage.removeItem('sr_admin');
    localStorage.removeItem('sr_admin_token');
    localStorage.removeItem('sr_admin_mode');
    sessionStorage.removeItem('sr_front_edit_authorized');
    localStorage.removeItem('sr_front_edit_authorized');
    location.reload();
  }
}

function showPendingOrders() {
  tab = 'orders';
  orderFilter = 'Pending';
  render();
}

// Fast in-place badge and document title updater without full DOM rebuild
function updatePendingBadges(curPending) {
  const bellBadge = $('#adminPendingCount');
  if (bellBadge) {
    if (curPending > 0) {
      bellBadge.textContent = curPending;
      bellBadge.classList.remove('hidden');
    } else {
      bellBadge.classList.add('hidden');
    }
  }
  if (curPending > 0) {
    document.title = `(${curPending}) New Orders! • Somphea Reak Admin`;
  } else {
    document.title = 'Admin Panel | Somphea Reak';
  }
  // Fast update for sidebar order badge
  const sideOrderBtn = document.querySelector('#side button:nth-child(2)');
  if (sideOrderBtn && tab !== 'orders') {
    let badgeSpan = sideOrderBtn.querySelector('.pending-pulse');
    if (curPending > 0) {
      if (!badgeSpan) {
        badgeSpan = document.createElement('span');
        badgeSpan.className = 'badge pending-pulse';
        badgeSpan.style.position = 'static';
        sideOrderBtn.appendChild(badgeSpan);
      }
      badgeSpan.textContent = `${curPending} PENDING`;
    } else if (badgeSpan) {
      badgeSpan.remove();
    }
  }
}

// Background sync from Python server with audio & visual alert
let lastPendingCount = SRDB.orders().filter(o => o.status === 'Pending').length;
let lastUnread = SRDB.unread();

SRDB.onChange((detail = {}) => {
  const changed = detail.changed || {};
  const meta = detail.meta || {};

  const curPending = (meta.pending_orders !== undefined)
    ? meta.pending_orders
    : SRDB.orders().filter(o => o.status === 'Pending').length;

  const curUnread = (meta.unread_notifs !== undefined)
    ? meta.unread_notifs
    : SRDB.unread();

  if (curPending > lastPendingCount) {
    playNotificationSound();
    toast(`🔔 New customer order received! (${curPending} pending confirmation)`);
  } else if (curUnread > lastUnread) {
    playNotificationSound();
    toast('🔔 New order receipt notification!');
  }
  lastPendingCount = curPending;
  lastUnread = curUnread;

  // Always keep badges updated instantly with zero DOM lag
  updatePendingBadges(curPending);

  if (changed.settings) {
    applyLogo();
  }

  // Never disrupt active input editing or open modal
  const isEditing = Boolean(document.activeElement && document.activeElement.matches('input,select,textarea'));
  const isModalOpen = !$('#modal').classList.contains('hidden');
  if (isEditing || isModalOpen || tab === 'settings') {
    return;
  }

  // Only re-render if the currently displayed tab is affected by the changed data
  const shouldRerender =
    detail.initial ||
    !detail.changed ||
    (tab === 'dashboard' && (changed.orders || changed.products || changed.notifications)) ||
    (tab === 'orders' && changed.orders) ||
    (tab === 'products' && changed.products) ||
    (tab === 'charms' && changed.charms) ||
    (tab === 'categories' && changed.categories) ||
    (tab === 'users' && changed.users) ||
    (tab === 'vouchers' && changed.users) ||
    (tab === 'notifications' && changed.notifications);

  if (shouldRerender) {
    render();
  }
});

function launchFrontAdminMode() {
  const isAuth = sessionStorage.getItem('sr_admin') || localStorage.getItem('sr_admin');
  if (!isAuth) {
    toast('🔒 Please enter Admin PIN to log in before accessing Customer Shop Edit Mode.');
    const pinInput = $('#pin');
    if (pinInput) pinInput.focus();
    return;
  }
  sfEditMode = true;
  switchAdminTab('storefront');
  toast('👑 Switched to Customer Shop Live Edit Mode');
}

/* ================================================================
   1. Dashboard
   ================================================================ */
function dashboard() {
  const O = SRDB.orders(), P = SRDB.products(true);
  const pend = O.filter(o => o.status === 'Pending').length;
  const rev = O.filter(o => ['Approved', 'Shipped', 'Delivered'].includes(o.status)).reduce((a, o) => a + (o.total || 0), 0);
  const low = P.filter(p => (p.stock || 0) <= 3);
  const N = SRDB.notifications().slice(0, 10);

  const pendingBannerHtml = pend > 0 ? `
  <div class="pending-alert-banner">
    <div class="pending-alert-icon">🔔</div>
    <div class="pending-alert-content">
      <b>${pend} New Order${pend > 1 ? 's' : ''} Awaiting Your Confirmation!</b>
      <p class="small muted">Customer receipts submitted via Telegram. Confirm to deduct inventory and award loyalty points, or disapprove with reason message.</p>
    </div>
    <button class="btn ok sm" onclick="showPendingOrders()">Review Orders (${pend}) →</button>
  </div>` : '';

  $('#view').innerHTML = `
  ${pendingBannerHtml}
  <div class="glass panel" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;background:linear-gradient(135deg,rgba(16,185,129,0.14),rgba(6,182,212,0.09));border:1px solid rgba(16,185,129,0.35);margin-bottom:18px">
    <div>
      <h3 style="color:#10b981;display:flex;align-items:center;gap:8px">👑 Storefront Admin Live Editor</h3>
      <p class="muted small" style="margin-top:2px">Manage products, stock, categories, charms, announcement, and site branding directly on the live customer shop layout.</p>
    </div>
    <button class="btn primary" onclick="launchFrontAdminMode()">🚀 Open Customer Shop in Admin Edit Mode</button>
  </div>
  <div class="stats">
    <div class="glass stat" style="${pend ? 'border:1px solid #eab308;box-shadow:0 0 16px rgba(234,179,8,0.25)' : ''};cursor:pointer" onclick="showPendingOrders()">
      <span class="muted">Pending Orders</span>
      <b style="color:#eab308">${pend} ${pend ? '🔔' : ''}</b>
    </div>
    <div class="glass stat">
      <span class="muted">Total Revenue</span>
      <b>${money(rev)}</b>
    </div>
    <div class="glass stat">
      <span class="muted">Total Products</span>
      <b>${P.length}</b>
    </div>
    <div class="glass stat">
      <span class="muted">Registered Customers</span>
      <b>${SRDB.users().length}</b>
    </div>
  </div>
  <div class="two">
    <div class="glass panel">
      <div class="section-title" style="margin:0 0 12px">
        <h3>🔔 Receipts & Order Notifications</h3>
        ${SRDB.unread() ? `<button class="btn ghost sm" onclick="SRDB.markAllRead();render()">Mark all read</button>` : ''}
      </div>
      ${N.length ? N.map(n => `
        <div class="line small" style="cursor:pointer" onclick="viewOrder('${n.order_id || n.orderId}')">
          <div>
            ${n.read ? '' : '<span style="color:#eab308">● </span>'}
            <b>${esc(n.text)}</b>
          </div>
          <span class="muted">${new Date(n.created_at || n.createdAt).toLocaleTimeString()}</span>
        </div>`).join('')
      : '<p class="muted" style="padding:16px 0">No notifications yet. Customer orders will appear here automatically.</p>'}
    </div>
    <div class="glass panel">
      <div class="section-title" style="margin:0 0 12px">
        <h3>⚠️ Low Stock Alerts (≤3 left)</h3>
        <button class="btn ghost sm" onclick="tab='products';render()">Manage Stock</button>
      </div>
      ${low.length ? low.map(p => `
        <div class="line small">
          <div style="display:flex;gap:8px;align-items:center">
            ${p.image ? `<img src="${p.image}" style="width:30px;height:30px;border-radius:6px;object-fit:cover">` : '🛍️'}
            <span>${esc(p.name)}</span>
          </div>
          <div class="stock-ctrl">
            <button onclick="inlineAdjustStock('${p.id}',-1)">−</button>
            <input type="number" class="table-input sm" value="${p.stock}" onchange="updateProductField('${p.id}','stock',this.value)">
            <button onclick="inlineAdjustStock('${p.id}',1)">+</button>
          </div>
        </div>`).join('')
      : '<p class="muted" style="padding:16px 0">All inventory levels are healthy! 👍</p>'}
    </div>
  </div>`;
}

/* ================================================================
   1.5 Customer Storefront (Live Visual Editor)
   ================================================================ */
let sfDevice = 'mobile';
let sfEditMode = true;
let sfCategory = 'all';
let sfSearch = '';

function setSfDevice(dev) {
  sfDevice = dev;
  render();
}

function toggleSfEditMode(enabled) {
  sfEditMode = enabled;
  render();
}

function setSfCategory(catId) {
  sfCategory = catId;
  render();
}

function onSfSearchChange(q) {
  sfSearch = (q || '').trim();
  const grid = $('#sfProdGrid');
  if (grid) {
    const P = SRDB.products(true);
    let displayProds = P;
    if (sfCategory !== 'all') {
      displayProds = displayProds.filter(p => (p.cat || '').toLowerCase() === sfCategory.toLowerCase());
    }
    if (sfSearch) {
      const query = sfSearch.toLowerCase();
      displayProds = displayProds.filter(p => (p.name || '').toLowerCase().includes(query));
    }
    const countEl = $('#sfProdCount');
    if (countEl) countEl.textContent = `${displayProds.length} products found`;
    grid.innerHTML = displayProds.length === 0 ? `
      <div style="grid-column:1/-1;text-align:center;padding:30px 10px;color:var(--muted)">
        <p>No products match "${esc(sfSearch)}".</p>
        ${sfEditMode ? `<button class="btn primary sm" onclick="editProduct()">+ Add Product</button>` : ''}
      </div>` : displayProds.map(p => renderSfProductCard(p, sfEditMode)).join('');
  }
}

function renderSfProductCard(p, isEdit) {
  const finalPrice = SRDB.finalPrice ? SRDB.finalPrice(p) : +(p.price * (1 - (p.discount || 0)/100)).toFixed(2);
  const isOut = (p.stock || 0) <= 0;
  return `
  <div class="sf-prod-card ${isOut ? 'out-of-stock' : ''}" data-id="${esc(p.id)}">
    <div class="sf-card-media" onclick="${isEdit ? `editProduct('${esc(p.id)}')` : ''}">
      ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.src='logo.jpg'" loading="lazy">` : `<div class="sf-card-placeholder">🛍️</div>`}
      ${p.discount > 0 ? `<span class="sf-disc-badge">-${p.discount}%</span>` : ''}
      ${isOut ? `<span class="sf-out-badge">OUT OF STOCK</span>` : ''}
    </div>
    <div class="sf-card-body" onclick="${isEdit ? `editProduct('${esc(p.id)}')` : ''}">
      <div class="sf-card-cat">${esc(p.cat || 'General')}</div>
      <div class="sf-card-title">${esc(p.name)}</div>
      <div class="sf-card-price-row">
        <span class="sf-card-price">${money(finalPrice)}</span>
        ${p.discount > 0 ? `<span class="sf-card-old-price">${money(p.price)}</span>` : ''}
      </div>
      <div class="sf-card-stock-line">
        Stock: <b style="color:${isOut ? '#ef4444' : '#10b981'}">${p.stock || 0} left</b>
      </div>
    </div>
    ${isEdit ? `
    <div class="sf-card-admin-bar">
      <div class="sf-stock-stepper" title="Quick Adjust Stock">
        <button type="button" onclick="inlineAdjustStock('${esc(p.id)}', -1);render()">−</button>
        <span>${p.stock || 0}</span>
        <button type="button" onclick="inlineAdjustStock('${esc(p.id)}', 1);render()">+</button>
      </div>
      <div class="sf-card-btns">
        <button type="button" class="sf-btn-edit" onclick="editProduct('${esc(p.id)}')" title="Edit details">✏️ Edit</button>
        <button type="button" class="sf-btn-del" onclick="deleteProd('${esc(p.id)}', '${esc(p.name).replace(/'/g, '')}')" title="Delete">🗑️</button>
      </div>
    </div>` : `
    <div class="sf-card-customer-action">
      <button class="sf-card-add-cart-btn" disabled>Add to Cart 🛒</button>
    </div>`}
  </div>`;
}

function renderSfCharmCard(ch, isEdit) {
  const isOut = (ch.stock || 0) <= 0;
  return `
  <div class="sf-charm-card ${isOut ? 'out-of-stock' : ''}">
    <div class="sf-charm-media">
      <img src="${esc(ch.image || 'charm_clean.png')}" alt="${esc(ch.name)}" onerror="this.src='charm_clean.png'" loading="lazy">
      ${isOut ? `<span class="sf-out-badge">OUT</span>` : ''}
    </div>
    <div class="sf-charm-body">
      <div class="sf-charm-code">${esc(ch.model_no || ch.id)}</div>
      <div class="sf-charm-name" title="${esc(ch.name)}">${esc(ch.name)}</div>
      <div class="sf-charm-price">${money(ch.price || 0.75)} / ៛${ch.price_khr || 3000}</div>
    </div>
    ${isEdit ? `
    <div class="sf-charm-admin-bar">
      <div class="sf-stock-stepper">
        <button type="button" onclick="quickAdjustCharmStock('${esc(ch.id)}', -1)">−</button>
        <span>${ch.stock || 0}</span>
        <button type="button" onclick="quickAdjustCharmStock('${esc(ch.id)}', 1)">+</button>
      </div>
      <div class="sf-card-btns">
        <button type="button" class="sf-btn-edit" onclick="editCharm('${esc(ch.id)}')">✏️</button>
        <button type="button" class="sf-btn-del" onclick="deleteCharm('${esc(ch.id)}', '${esc(ch.name).replace(/'/g, '')}')">🗑️</button>
      </div>
    </div>` : `
    <div class="sf-charm-stock-badge">
      ${ch.stock > 0 ? `${ch.stock} in stock` : '<span style="color:#ef4444">Out of stock</span>'}
    </div>`}
  </div>`;
}

function editStorefrontAnnouncement() {
  const s = SRDB.settings();
  const currentText = s.announcementText || '🚚 Free delivery on orders over $25 | 🎁 New Charms in stock!';
  const currentEnabled = s.announcementEnabled !== false;
  
  modal(`
  <div style="text-align:left">
    <div class="section-title" style="margin-top:0">
      <div>
        <h3>📢 Edit Storefront Announcement Bar</h3>
        <p class="muted small">Shown at the top of the customer shop</p>
      </div>
    </div>
    <div style="margin-top:12px">
      <label>Announcement Message</label>
      <input type="text" id="sfAnnText" value="${esc(currentText)}" style="width:100%;margin-top:4px">
    </div>
    <div style="margin-top:14px;display:flex;align-items:center;gap:10px">
      <input type="checkbox" id="sfAnnEnabled" ${currentEnabled ? 'checked' : ''} style="width:18px;height:18px">
      <label for="sfAnnEnabled" style="margin:0;cursor:pointer">Show Announcement Bar on Customer Front</label>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="saveStorefrontAnnouncement()">Save Announcement 💾</button>
    </div>
  </div>`);
}

async function saveStorefrontAnnouncement() {
  const text = $('#sfAnnText')?.value?.trim() || '';
  const enabled = $('#sfAnnEnabled')?.checked ?? true;
  await SRDB.saveSettings({
    announcementText: text,
    announcementEnabled: enabled
  });
  closeModal();
  toast('Announcement bar updated!');
  render();
}

function editStorefrontBrand() {
  const s = SRDB.settings();
  modal(`
  <div style="text-align:left">
    <div class="section-title" style="margin-top:0">
      <div>
        <h3>🎨 Edit Store Brand & Logo</h3>
        <p class="muted small">Customize store title and customer front presentation</p>
      </div>
    </div>
    <div style="margin-top:12px">
      <label>Store Name / Title</label>
      <input type="text" id="sfBrandTitle" value="${esc(s.siteTitle || 'Somphea Reak')}" style="width:100%;margin-top:4px">
    </div>
    <div style="margin-top:12px">
      <label>Store Logo Image URL</label>
      <input type="text" id="sfBrandLogo" value="${esc(s.siteLogo || 'logo.jpg')}" style="width:100%;margin-top:4px">
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="saveStorefrontBrand()">Save Brand 💾</button>
    </div>
  </div>`);
}

async function saveStorefrontBrand() {
  const siteTitle = $('#sfBrandTitle')?.value?.trim() || 'Somphea Reak';
  const siteLogo = $('#sfBrandLogo')?.value?.trim() || 'logo.jpg';
  await SRDB.saveSettings({ siteTitle, siteLogo });
  closeModal();
  toast('Store branding updated!');
  render();
}

function editStorefrontDeliveryRules() {
  const s = SRDB.settings();
  modal(`
  <div style="text-align:left">
    <div class="section-title" style="margin-top:0">
      <div>
        <h3>🚚 Edit Delivery & Payment Rules</h3>
        <p class="muted small">Customer checkout settings</p>
      </div>
    </div>
    <div style="margin-top:12px">
      <label>Standard Delivery Fee ($)</label>
      <input type="number" step="0.25" id="sfDeliveryFee" value="${s.deliveryFee !== undefined ? s.deliveryFee : 1.5}" style="width:100%;margin-top:4px">
    </div>
    <div style="margin-top:12px">
      <label>Free Delivery Threshold ($) (0 to disable)</label>
      <input type="number" step="1" id="sfFreeDelivery" value="${s.freeDeliveryThreshold !== undefined ? s.freeDeliveryThreshold : 25}" style="width:100%;margin-top:4px">
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="saveStorefrontDeliveryRules()">Save Rules 💾</button>
    </div>
  </div>`);
}

async function saveStorefrontDeliveryRules() {
  const deliveryFee = parseFloat($('#sfDeliveryFee')?.value) || 0;
  const freeDeliveryThreshold = parseFloat($('#sfFreeDelivery')?.value) || 0;
  await SRDB.saveSettings({ deliveryFee, freeDeliveryThreshold });
  closeModal();
  toast('Checkout rules updated!');
  render();
}

function storefront() {
  const P = SRDB.products(true);
  const C = SRDB.categories();
  const Ch = SRDB.charms(true);
  const S = SRDB.settings();

  let displayProds = P;
  if (sfCategory !== 'all') {
    displayProds = displayProds.filter(p => (p.cat || '').toLowerCase() === sfCategory.toLowerCase());
  }
  if (sfSearch) {
    const q = sfSearch.toLowerCase();
    displayProds = displayProds.filter(p => (p.name || '').toLowerCase().includes(q));
  }

  const announcementText = S.announcementText || '🚚 Free delivery on orders over $25 | 🎁 New Italy Charms in stock!';
  const announcementEnabled = S.announcementEnabled !== false;
  const brandTitle = S.siteTitle || 'Somphea Reak';
  const brandLogo = S.siteLogo || 'logo.jpg';
  const rawStoreUrl = (window.SR_CONFIG && window.SR_CONFIG.STOREFRONT_URL) ? window.SR_CONFIG.STOREFRONT_URL : 'http://127.0.0.1:5000';

  const innerStorefrontHtml = `
    <!-- Top Announcement Bar -->
    ${announcementEnabled ? `
      <div class="sf-announcement-bar">
        <span>${esc(announcementText)}</span>
        ${sfEditMode ? `
          <button class="sf-mini-edit-btn" onclick="editStorefrontAnnouncement()" title="Edit announcement text">
            ✏️ Edit
          </button>` : ''}
      </div>` : ''}

    <!-- Storefront Header -->
    <header class="sf-store-header">
      <div class="sf-header-brand">
        <img src="${esc(brandLogo)}" alt="Logo" class="sf-store-logo" onerror="this.src='logo.jpg'">
        <div>
          <h1 class="sf-store-name">${esc(brandTitle)}</h1>
          <span class="sf-store-tag">Official Store</span>
        </div>
        ${sfEditMode ? `
          <button class="sf-mini-edit-btn" onclick="editStorefrontBrand()" title="Edit store branding">
            ✏️ Brand
          </button>` : ''}
      </div>
      <div class="sf-header-search">
        <input type="text" placeholder="🔍 Search products..." value="${esc(sfSearch)}" oninput="onSfSearchChange(this.value)">
      </div>
    </header>

    <!-- Hero Promotional Banner -->
    <div class="sf-hero-banner">
      <span class="badge" style="background:#10b981;color:#fff;font-weight:700">HANDCRAFTED & LUXURY</span>
      <h2>Minifigures, Toys & Italy Charm Bracelets</h2>
      <p class="small muted" style="margin:4px 0 0">Build your modular stainless steel bracelet or explore collectible figures</p>
    </div>

    <!-- Category Strip -->
    <div class="sf-cat-section">
      <div class="sf-cat-header">
        <h3 style="margin:0;font-size:1.05rem">Shop by Category</h3>
        ${sfEditMode ? `
          <button class="btn sm ghost" onclick="editCategory()" style="padding:3px 10px;font-size:0.75rem">
            ➕ Add Category
          </button>` : ''}
      </div>
      <div class="sf-cat-row">
        <div class="sf-cat-chip-wrap">
          <button class="sf-cat-chip ${sfCategory === 'all' ? 'active' : ''}" onclick="setSfCategory('all')">
            ✨ All Items (${P.length})
          </button>
        </div>
        ${C.map(c => {
          const count = P.filter(p => (p.cat || '').toLowerCase() === (c.id || c.name || '').toLowerCase()).length;
          return `
          <div class="sf-cat-chip-wrap">
            <button class="sf-cat-chip ${sfCategory === (c.id || c.name) ? 'active' : ''}" onclick="setSfCategory('${esc(c.id || c.name)}')">
              <span>${esc(c.icon || '🏷️')}</span>
              <span>${esc(c.name)}</span>
              <span class="small muted">(${count})</span>
            </button>
            ${sfEditMode && c.id !== 'custom-bracelet' ? `
              <div class="sf-cat-hover-ctrls">
                <button onclick="editCategory('${esc(c.id)}')" title="Edit Category">✏️</button>
                <button onclick="deleteCategory('${esc(c.id)}', '${esc(c.name).replace(/'/g, '')}')" title="Delete Category" style="color:#ef4444">🗑️</button>
              </div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Live Product Catalog Grid -->
    <div class="sf-prod-section">
      <div class="sf-prod-header">
        <div>
          <h3 style="margin:0;font-size:1.05rem">${sfCategory === 'all' ? 'Featured Catalog' : esc(sfCategory)}</h3>
          <span class="muted small" id="sfProdCount">${displayProds.length} products found</span>
        </div>
        ${sfEditMode ? `
          <button class="btn sm primary" onclick="editProduct()" style="padding:4px 12px;font-size:0.8rem">
            ➕ Add Product
          </button>` : ''}
      </div>

      <div class="sf-prod-grid" id="sfProdGrid">
        ${displayProds.length === 0 ? `
          <div style="grid-column:1/-1;text-align:center;padding:30px 10px;color:var(--muted)">
            <p>No products found in this category.</p>
            ${sfEditMode ? `<button class="btn primary sm" onclick="editProduct()">+ Add Product</button>` : ''}
          </div>` : displayProds.map(p => renderSfProductCard(p, sfEditMode)).join('')}
      </div>
    </div>

    <!-- Italy Charm Modular Studio Section -->
    <div class="sf-studio-section">
      <div class="sf-studio-header">
        <div>
          <h3 style="margin:0;font-size:1.05rem">🔗 Italy Charm Modular Bracelet Studio</h3>
          <p class="muted small" style="margin:2px 0 0">Interactive bracelet preview & live charm link inventory</p>
        </div>
        ${sfEditMode ? `
          <button class="btn sm primary" onclick="editCharm()" style="padding:4px 12px;font-size:0.8rem">
            ➕ Add Charm Link
          </button>` : ''}
      </div>

      <!-- Live Ribbon Preview -->
      <div class="sf-studio-ribbon">
        <div class="sf-bracelet-band">
          ${Array.from({ length: 16 }).map((_, i) => {
            const chItem = Ch[i % Ch.length];
            return `
            <div class="sf-band-slot">
              ${chItem ? `<img src="${esc(chItem.image || 'charm_clean.png')}" alt="Slot" onerror="this.src='charm_clean.png'">` : `<span style="font-size:0.8rem">⚙️</span>`}
            </div>`;
          }).join('')}
        </div>
        <div class="sf-band-info">
          <span>16 Modular Stainless Steel Links</span>
          <span class="sf-band-tag">Live Studio Preview</span>
        </div>
      </div>

      <!-- Charms Inventory Grid -->
      <div class="sf-charm-grid">
        ${Ch.map(ch => renderSfCharmCard(ch, sfEditMode)).join('')}
      </div>
    </div>

    <!-- Footer & Delivery Rules -->
    <div class="sf-footer-rules glass">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <div>
          <h4 style="margin:0">🚚 Store Checkout & Delivery Info</h4>
          <p class="muted small" style="margin:2px 0 0">
            Standard Delivery: <b>${money(S.deliveryFee !== undefined ? S.deliveryFee : 1.5)}</b> • Free on orders over: <b>${money(S.freeDeliveryThreshold !== undefined ? S.freeDeliveryThreshold : 25)}</b> • ABA PayWay KHQR
          </p>
        </div>
        ${sfEditMode ? `
          <button class="btn sm ghost" onclick="editStorefrontDeliveryRules()">
            ✏️ Edit Delivery Rules
          </button>` : ''}
      </div>
    </div>
  `;

  $('#view').innerHTML = `
  <div class="sf-control-bar glass">
    <div class="sf-control-left">
      <div class="sf-title-group">
        <span class="sf-badge">👑 ADMIN DESK</span>
        <h2 style="margin:0;font-size:1.25rem">Customer Shop — Live Visual Editor</h2>
      </div>
      <p class="muted small" style="margin:2px 0 0">
        Directly preview and edit products, stock, categories, charms, announcement, and branding on the live customer shop layout.
      </p>
    </div>
    <div class="sf-control-actions">
      <!-- Device Selector -->
      <div class="sf-btn-group">
        <button class="btn sm ${sfDevice === 'mobile' ? 'primary' : 'ghost'}" onclick="setSfDevice('mobile')">
          📱 Mobile View (390px)
        </button>
        <button class="btn sm ${sfDevice === 'desktop' ? 'primary' : 'ghost'}" onclick="setSfDevice('desktop')">
          💻 Desktop View (100%)
        </button>
      </div>

      <!-- Mode Selector -->
      <div class="sf-btn-group">
        <button class="btn sm ${sfEditMode ? 'ok' : 'ghost'}" onclick="toggleSfEditMode(true)" title="Show Admin Controls on cards and categories">
          ✏️ Edit Mode ${sfEditMode ? '●' : ''}
        </button>
        <button class="btn sm ${!sfEditMode ? 'primary' : 'ghost'}" onclick="toggleSfEditMode(false)" title="Preview as regular customer without admin controls">
          👁️ Customer View ${!sfEditMode ? '●' : ''}
        </button>
      </div>

      <!-- Quick Add Actions -->
      <button class="btn sm primary" onclick="editProduct()">➕ Add Product</button>
      <button class="btn sm ghost" onclick="editCategory()">🏷️ Add Category</button>
      <button class="btn sm ghost" onclick="editCharm()">🔗 Add Charm</button>
      <button class="btn sm ghost" onclick="editStorefrontAnnouncement()">📢 Announcement</button>
      <button class="btn sm ghost" onclick="editStorefrontBrand()">🎨 Brand</button>
      <button class="btn sm ghost" onclick="window.open('${rawStoreUrl}', '_blank')" title="Open raw customer storefront in new browser tab">
        🌐 Customer Store ↗
      </button>
    </div>
  </div>

  <div class="sf-canvas-wrapper">
    ${sfDevice === 'mobile' ? `
      <div class="sf-phone-frame">
        <div class="sf-phone-notch"></div>
        <div class="sf-phone-status">
          <span>9:41</span>
          <span>5G  🔋 100%</span>
        </div>
        <div class="sf-phone-viewport">
          ${innerStorefrontHtml}
        </div>
      </div>` : `
      <div class="sf-desktop-frame">
        <div class="sf-desktop-viewport">
          ${innerStorefrontHtml}
        </div>
      </div>`}
  </div>`;
}

/* ================================================================
   2. Orders & Receipts
   ================================================================ */
function orders() {
  const allOrders = SRDB.orders();
  const pend = allOrders.filter(o => o.status === 'Pending').length;
  const F = ['Pending', 'Approved', 'Shipped', 'Delivered', 'Rejected', 'All'];
  let list = allOrders.filter(o => orderFilter === 'All' || o.status === orderFilter);

  if (orderSearchQuery) {
    const q = orderSearchQuery.toLowerCase();
    list = list.filter(o => {
      const u = SRDB.user(o.user_id || o.userId);
      const contact = o.contact || {};
      const itemsStr = (o.items || []).map(i => i.name).join(' ').toLowerCase();
      return (o.id && o.id.toLowerCase().includes(q)) ||
             (u && u.username && u.username.toLowerCase().includes(q)) ||
             (contact.phone && contact.phone.includes(q)) ||
             (contact.name && contact.name.toLowerCase().includes(q)) ||
             itemsStr.includes(q);
    });
  }

  const pendingBannerHtml = pend > 0 ? `
  <div class="pending-alert-banner">
    <div class="pending-alert-icon">🔔</div>
    <div class="pending-alert-content">
      <b>${pend} Customer Order${pend > 1 ? 's' : ''} Awaiting Confirmation!</b>
      <p class="small muted">Review customer receipts to approve and deduct inventory, or disapprove with custom message explaining why.</p>
    </div>
    ${orderFilter !== 'Pending' ? `<button class="btn ok sm" onclick="orderFilter='Pending';render()">Filter Pending (${pend}) →</button>` : ''}
  </div>` : '';

  $('#view').innerHTML = `
  ${pendingBannerHtml}
  <div class="glass panel">
    <div class="section-title" style="margin-top:0">
      <div>
        <h2>Order Confirmation & Receipts</h2>
        <p class="muted">Review customer receipts, approve orders, and track stock deductions</p>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${F.map(f => {
          let badge = '';
          if (f === 'Pending' && pend > 0) badge = ` <span class="badge pending-pulse sm-pulse">${pend}</span>`;
          return `<button class="btn sm ${orderFilter === f ? 'primary' : 'ghost'}" onclick="orderFilter='${f}';render()">${f}${badge}</button>`;
        }).join('')}
      </div>
    </div>

    <!-- Live Order Search for Admin Desk -->
    <div class="order-search-box">
      <div class="search-input-wrap" style="position:relative;flex:1">
        <span class="search-icon">🔍</span>
        <input type="text" id="orderSearchInput" placeholder="Search Order ID (#...), @customer, phone, or items..." value="${esc(orderSearchQuery)}" oninput="onOrderSearchChange(this.value)" autocomplete="off">
        ${orderSearchQuery ? `<button type="button" class="search-clear-btn" onclick="clearOrderSearch()" title="Clear search">✕</button>` : ''}
      </div>
    </div>
    ${list.length ? `
    <!-- Desktop Table View (Hidden on mobile) -->
    <div class="table-responsive admin-desktop-table">
      <table>
        <thead>
          <tr>
            <th>Order Ref</th>
            <th>Customer Info</th>
            <th>Items Ordered</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(o => {
            const u = SRDB.user(o.user_id || o.userId);
            const contact = (typeof o.contact === 'string' ? JSON.parse(o.contact) : (o.contact || {})) || {};
            const payStr = contact.payment || o.payment || '';
            const isCod = payStr.includes('COD') || contact.payment_type === 'COD';
            return `
            <tr style="${o.status === 'Pending' ? 'background:rgba(234,179,8,0.04)' : ''}">
              <td>
                <b>#${o.id}</b>
                <div class="muted small">${new Date(o.created_at || o.createdAt).toLocaleString()}</div>
                ${o.status === 'Pending' ? '<span class="badge pending-pulse sm-pulse" style="margin-top:4px">Needs Confirmation</span>' : ''}
              </td>
              <td>
                <b>@${esc(u?.username || 'user')}</b> <span class="badge ok">TG ✔</span>
                <div class="muted small">📞 ${esc(contact.phone || u?.phone || '')}</div>
                <div class="muted small">📍 ${esc(contact.address || '')}</div>
                <div style="margin-top:4px"><span class="badge ${isCod ? 'warn' : 'ok'}" style="font-size:0.75rem">${isCod ? '💵 COD' : '📲 ABA KHQR'}</span></div>
              </td>
              <td class="small">
                ${(o.items || []).map(i => `• ${esc(i.name)} ×<b>${i.qty}</b>`).join('<br>')}
              </td>
              <td>
                <b class="price">${money(o.total)}</b>
                <div class="small muted">+${o.earned} pt</div>
              </td>
              <td>
                <span class="status ${(o.status || '').toLowerCase()}">${o.status}</span>
                ${o.note ? `<div class="small err" style="margin-top:4px;padding:3px 6px;background:rgba(239,68,68,0.12);border-radius:4px;max-width:180px"><b>Reason:</b> ${esc(o.note)}</div>` : ''}
              </td>
              <td style="white-space:nowrap">
                <button class="btn ghost sm" onclick="viewOrder('${o.id}')" title="View Official Receipt">Receipt 🧾</button>
                ${o.status === 'Pending' ? `
                  <button class="btn ok sm" onclick="approveOrder('${o.id}')" title="Approve & Deduct Stock">✔ Approve</button>
                  <button class="btn danger sm" onclick="openRejectModal('${o.id}')" title="Disapprove with reason message">✖ Disapprove</button>
                ` : ''}
                ${o.status === 'Approved' ? `
                  <button class="btn ghost sm" onclick="setOrderStatus('${o.id}','Shipped')">🚚 Ship</button>
                  <button class="btn danger sm" onclick="cancelOrder('${o.id}')" title="Cancel & restore stock">Cancel</button>
                ` : ''}
                ${o.status === 'Shipped' ? `
                  <button class="btn ghost sm" onclick="setOrderStatus('${o.id}','Delivered')">📦 Delivered</button>
                ` : ''}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Mobile Order Cards View (Optimized for smartphones) -->
    <div class="admin-mobile-cards">
      ${list.map(o => {
        const u = SRDB.user(o.user_id || o.userId);
        const contact = (typeof o.contact === 'string' ? JSON.parse(o.contact) : (o.contact || {})) || {};
        const payStr = contact.payment || o.payment || '';
        const isCod = payStr.includes('COD') || contact.payment_type === 'COD';
        return `
        <div class="admin-order-card" style="${o.status === 'Pending' ? 'border-color:rgba(234,179,8,0.5);background:rgba(234,179,8,0.06)' : ''}">
          <div class="aoc-header">
            <div>
              <b class="aoc-id">#${o.id}</b>
              <div class="muted small">${new Date(o.created_at || o.createdAt).toLocaleString()}</div>
            </div>
            <span class="status ${(o.status || '').toLowerCase()}">${o.status}</span>
          </div>

          ${o.status === 'Pending' ? `
            <div class="badge pending-pulse" style="align-self:flex-start">
              🔔 Needs Confirmation
            </div>` : ''}

          <div class="aoc-customer">
            <div class="aoc-user" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
              <div>
                <b>@${esc(u?.username || 'user')}</b> <span class="badge ok">TG ✔</span>
              </div>
              <div style="display:flex;gap:6px">
                <a href="https://t.me/${esc(u?.username || '').replace('@','')}" target="_blank" rel="noopener noreferrer" class="btn sm tg" style="padding:4px 8px;font-size:0.75rem;display:inline-flex;align-items:center;gap:4px">💬 Telegram</a>
                ${(contact.phone || u?.phone) ? `<a href="tel:${esc(contact.phone || u?.phone)}" class="btn sm ghost" style="padding:4px 8px;font-size:0.75rem;display:inline-flex;align-items:center;gap:4px">📞 Call</a>` : ''}
              </div>
            </div>
            <div class="aoc-contact small muted">
              ${contact.name ? `<div>👤 ${esc(contact.name)}</div>` : ''}
              ${contact.phone || u?.phone ? `<div>📞 <a href="tel:${esc(contact.phone || u?.phone)}">${esc(contact.phone || u?.phone)}</a></div>` : ''}
              ${contact.address ? `<div>📍 ${esc(contact.address)}</div>` : ''}
              ${payStr ? `<div>💳 ${esc(payStr)} <span class="badge ${isCod ? 'warn' : 'ok'}" style="font-size:0.75rem">${isCod ? '💵 COD' : '📲 ABA KHQR'}</span></div>` : ''}
            </div>
          </div>

          <div class="aoc-items">
            ${(o.items || []).map(i => `
              <div class="aoc-item-row small">
                <span>• ${esc(i.name)} ×<b>${i.qty}</b></span>
                <span>${money(i.price * i.qty)}</span>
              </div>`).join('')}
          </div>

          <div class="aoc-total-row">
            <div>
              <span class="muted small">Total: </span>
              <b class="price" style="font-size:1.15rem">${money(o.total)}</b>
            </div>
            <span class="small muted">+${o.earned} pt</span>
          </div>

          ${o.note ? `<div class="small err" style="padding:4px 8px;background:rgba(239,68,68,0.12);border-radius:6px"><b>Reason:</b> ${esc(o.note)}</div>` : ''}

          <div class="aoc-actions">
            <button class="btn ghost sm" onclick="viewOrder('${o.id}')" title="Receipt">Receipt 🧾</button>
            ${o.status === 'Pending' ? `
              <button class="btn ok sm" onclick="approveOrder('${o.id}')" title="Approve & Deduct Stock">✔ Approve</button>
              <button class="btn danger sm" onclick="openRejectModal('${o.id}')" title="Disapprove">✖ Disapprove</button>
            ` : ''}
            ${o.status === 'Approved' ? `
              <button class="btn ghost sm" onclick="setOrderStatus('${o.id}','Shipped')">🚚 Ship</button>
              <button class="btn danger sm" onclick="cancelOrder('${o.id}')" title="Cancel">Cancel</button>
            ` : ''}
            ${o.status === 'Shipped' ? `
              <button class="btn ghost sm" onclick="setOrderStatus('${o.id}','Delivered')">📦 Delivered</button>
            ` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`
    : '<p class="muted" style="padding:24px 0;text-align:center">No orders match this filter.</p>'}
  </div>`;
}

function viewOrder(id) {
  const o = SRDB.order(id);
  if (!o) return;
  const u = SRDB.user(o.user_id || o.userId);
  const contact = (typeof o.contact === 'string' ? JSON.parse(o.contact) : (o.contact || {})) || {};
  const paymentStr = contact.payment || o.payment || (contact.payment_type === 'COD' ? 'Cash on Delivery (COD)' : 'ABA KHQR (Scan to Pay)');
  const isCod = paymentStr.includes('COD') || contact.payment_type === 'COD';

  SRDB.markAllRead();

  const steps = ['Pending', 'Approved', 'Shipped', 'Delivered'];
  const curIdx = steps.indexOf(o.status);
  const trackerHtml = (o.status === 'Rejected' || o.status === 'Cancelled') ? `
    <div class="tracker">
      <div class="tracker-step done"><span class="dot-icon">1</span>Placed</div>
      <div class="tracker-step rejected"><span class="dot-icon">✖</span>${o.status}</div>
    </div>` : `
    <div class="tracker">
      ${steps.map((st, i) => `
        <div class="tracker-step ${curIdx >= i ? 'done' : ''} ${curIdx === i ? 'current' : ''}">
          <span class="dot-icon">${curIdx >= i ? '✔' : i + 1}</span>
          ${st}
        </div>`).join('')}
    </div>`;

  const logoSrc = SRDB.settings().siteLogo || SRDB.settings().site_logo || 'logo.jpg';
  modal(`
  <div style="display:flex;justify-content:center;margin-bottom:8px">
    <span class="logo-mark sm"><img src="${esc(logoSrc)}" alt="Logo" class="site-logo-img"></span>
  </div>
  <h2>Order Receipt #${o.id}</h2>
  ${trackerHtml}
  <div class="receipt">
    ========================================<br>
    <b>SOMPHEA REAK STUDIO - OFFICIAL RECEIPT</b><br>
    Date: ${new Date(o.created_at || o.createdAt).toLocaleString()}<br>
    ========================================<br>
    Telegram Account: @${esc(u?.username)} [Verified]<br>
    Recipient Name: ${esc(contact.name)}<br>
    Phone Number: ${esc(contact.phone)}<br>
    Delivery Address: ${esc(contact.address)}<br>
    Payment Method: <b>${esc(paymentStr)}</b> <span class="badge ${isCod ? 'warn' : 'ok'}">${isCod ? '💵 COD' : '📲 ABA KHQR'}</span><br>
    Order Status: <b>${o.status}</b><br>
    ${isCod ? `
    ----------------------------------------<br>
    💵 <b>COLLECT CASH ON DELIVERY (COD):</b><br>
    <span style="color:var(--gold,#eab308);font-size:0.82rem">Courier must collect ${money(o.total)} in cash upon handing package to customer.</span><br>
    ` : `
    ----------------------------------------<br>
    📲 <b>PREPAID VIA ABA KHQR:</b><br>
    <span style="color:var(--ok,#10b981);font-size:0.82rem">Customer paid via ABA KHQR. Verify transaction before confirming.</span><br>
    `}
    ----------------------------------------<br>
    <b>PURCHASED ITEMS:</b><br>
    ${(o.items || []).map(i => {
      const p = i.productId && SRDB.product(i.productId);
      let stockNote = '';
      if (p) {
        if (p.stock >= i.qty) stockNote = `<span style="color:var(--ok)"> (Stock: ${p.stock} available ✔)</span>`;
        else stockNote = `<span class="err"> (INSUFFICIENT STOCK: ${p.stock} left ❌)</span>`;
      }
      return `• ${esc(i.name)} ${i.desc ? `[${esc(i.desc)}]` : ''} ×${i.qty} = ${money(i.price * i.qty)}${stockNote}`;
    }).join('<br>')}<br>
    ----------------------------------------<br>
    Subtotal: ${money(o.subtotal)}<br>
    ${o.voucher ? `Voucher Code (${o.voucher}): -${money(o.discount)}<br>` : ''}
    Delivery Fee: ${money(o.delivery)}<br>
    <b>TOTAL AMOUNT: ${money(o.total)}</b><br>
    Reward Points: +${o.earned} pt<br>
    ${o.note ? `<br><span class="err">Reason Note: ${esc(o.note)}</span><br>` : ''}
    ========================================
  </div>
  <br>
  <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
    ${o.status === 'Pending' ? `
      <button class="btn ok" onclick="approveOrder('${o.id}')">✔ Confirm & Approve (Deduct Stock)</button>
      <button class="btn danger" onclick="openRejectModal('${o.id}')">✖ Disapprove / Reject Order</button>
    ` : ''}
    ${o.status === 'Approved' ? `
      <button class="btn ghost" onclick="setOrderStatus('${o.id}','Shipped');closeModal()">Mark Shipped 🚚</button>
      <button class="btn danger sm" onclick="cancelOrder('${o.id}')">Cancel & Restore Stock</button>
    ` : ''}
    <a href="https://t.me/${esc(u?.username || '').replace('@','')}" target="_blank" rel="noopener noreferrer" class="btn sm tg" style="display:inline-flex;align-items:center;gap:4px">💬 Chat Telegram</a>
    ${(contact.phone || u?.phone) ? `<a href="tel:${esc(contact.phone || u?.phone)}" class="btn sm ghost" style="display:inline-flex;align-items:center;gap:4px">📞 Call Customer</a>` : ''}
    <button class="btn ghost" onclick="window.print()">🖨️ Print Receipt</button>
    <button class="btn ghost" onclick="closeModal()">Close</button>
  </div>`);
}

async function approveOrder(id) {
  const err = await SRDB.approveOrder(id);
  if (err) return alert('⚠️ Cannot approve order:\n\n' + err);
  playNotificationSound();
  closeModal();
  toast('✔ Order approved! Stock deducted, points credited, customer notified.');
  render();
}

function openRejectModal(id) {
  const o = SRDB.order(id);
  if (!o) return;
  const u = SRDB.user(o.user_id || o.userId);
  const contact = o.contact || {};
  const presetReasons = [
    '📦 Item temporarily out of stock',
    '📍 Incomplete or unverified delivery address',
    '💳 Payment receipt or transaction not verified',
    '⚠️ Selected color/charm currently unavailable',
    '❌ Duplicate order or customer requested cancellation'
  ];

  modal(`
    <div style="font-size:2.8rem;margin-bottom:6px">⚠️</div>
    <h2>Disapprove / Reject Order #${o.id}</h2>
    <p class="muted small">Customer: <b>@${esc(u?.username || 'user')}</b> · Phone: <b>${esc(contact.phone || u?.phone || '')}</b> · Total: <b>${money(o.total)}</b></p>
    <br>
    <div style="text-align:left">
      <label>Quick Preset Reasons (tap to insert into message):</label>
      <div class="reason-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
        ${presetReasons.map(r => `
          <button type="button" class="btn ghost sm chip-btn" onclick="document.getElementById('rejectReasonText').value='${esc(r)}'">${esc(r)}</button>
        `).join('')}
      </div>
      <label for="rejectReasonText"><b>Message to Customer (Reason for Disapproval):</b></label>
      <textarea id="rejectReasonText" rows="3" style="width:100%;resize:vertical;padding:10px 12px;border-radius:10px" placeholder="Write a clear explanation why this order could not be approved (this will be sent to the customer)...">Item temporarily out of stock</textarea>
      ${o.voucher ? `<p class="small" style="color:var(--ok);margin-top:8px">🎟️ <b>Voucher Refund:</b> Voucher <code>${o.voucher}</code> will be refunded back to customer's account automatically.</p>` : ''}
    </div>
    <br>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
      <button class="btn danger" onclick="confirmRejectOrder('${o.id}')">✖ Confirm Disapproval & Send Reason</button>
      <button class="btn ghost" onclick="closeModal()">Back / Keep Pending</button>
    </div>
  `);
}

async function confirmRejectOrder(id) {
  const noteEl = document.getElementById('rejectReasonText');
  const note = (noteEl ? noteEl.value.trim() : '') || 'Item temporarily out of stock';
  await SRDB.rejectOrder(id, note);
  closeModal();
  toast('❌ Order disapproved. Customer has been notified with your reason, and voucher was refunded.');
  render();
}

async function cancelOrder(id) {
  if (!confirm('Cancel this approved order? Stock will be restored and customer points reverted.')) return;
  await SRDB.cancelOrder(id, 'Cancelled by admin');
  closeModal();
  toast('Order cancelled & stock restored');
  render();
}

async function setOrderStatus(id, status) {
  await SRDB.setStatus(id, status);
  toast(`Order status updated to ${status}`);
  render();
}

/* ================================================================
   3. Products & Inline Price/Stock Editing
   ================================================================ */
function products() {
  const P = SRDB.products(true);

  $('#view').innerHTML = `
  <div class="glass panel">
    <div class="section-title" style="margin-top:0">
      <div>
        <h2>Product Catalog & Quick Price Editor</h2>
        <p class="muted">Edit prices, discounts, and stock directly in the table, or upload new products</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary" onclick="editProduct()">＋ Upload New Product</button>
        
        <button class="btn danger sm" onclick="clearAllProducts()">🗑️ Clear All</button>
      </div>
    </div>

    <!-- Filter & Live DOM Search without losing input focus -->
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
      <input type="text" id="filterInput" placeholder="🔍 Search product name..." style="max-width:260px" onkeyup="filterProductRows(this.value)">
      <select id="catSelect" onchange="filterProductCategory(this.value)" style="max-width:180px">
        <option value="all">All Categories</option>
        ${SRDB.categories().map(c => `<option value="${c.id}">${esc(c.name || c.kh)}</option>`).join('')}
      </select>
      <span class="muted small">💡 Tip: You can type directly in the Price, Discount, and Stock boxes below!</span>
    </div>

    ${P.length ? `
    <!-- Desktop Table (Hidden on mobile phones) -->
    <div class="table-responsive admin-desktop-table">
      <table id="productsTable">
        <thead>
          <tr>
            <th>Picture</th>
            <th>Name</th>
            <th>Category</th>
            <th style="text-align:right">Price ($)</th>
            <th style="text-align:right">Discount (%)</th>
            <th style="text-align:right">Final Price</th>
            <th style="text-align:center">Stock Qty</th>
            <th style="text-align:center">Points</th>
            <th style="text-align:center">Visible</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${P.map(p => {
            const catObj = SRDB.category(p.cat);
            return `
          <tr data-id="${p.id}" data-name="${esc(p.name).toLowerCase()}" data-cat="${p.cat}">
            <td>
              ${p.image ? `<img src="${p.image}" class="thumb">` : '<span class="thumb">🛍️</span>'}
            </td>
            <td><b>${esc(p.name)}</b></td>
            <td><span class="badge">${esc(catObj ? (catObj.name || catObj.kh) : p.cat)}</span></td>
            <td style="text-align:right">
              <input type="number" step="0.01" min="0" class="table-input" value="${p.price}" onchange="updateProductField('${p.id}', 'price', this.value)" title="Change regular price">
            </td>
            <td style="text-align:right">
              <input type="number" min="0" max="100" class="table-input" value="${p.discount || 0}" onchange="updateProductField('${p.id}', 'discount', this.value)" title="Change discount %">
            </td>
            <td style="text-align:right">
              <b class="price" id="finalPrice-${p.id}">${money(SRDB.finalPrice(p))}</b>
            </td>
            <td style="text-align:center">
              <div class="stock-ctrl">
                <button onclick="inlineAdjustStock('${p.id}',-1)">−</button>
                <input type="number" min="0" class="table-input sm" value="${p.stock}" onchange="updateProductField('${p.id}', 'stock', this.value)" title="Change stock quantity">
                <button onclick="inlineAdjustStock('${p.id}',1)">+</button>
              </div>
            </td>
            <td style="text-align:center">
              <input type="number" min="0" class="table-input sm" value="${p.pt}" onchange="updateProductField('${p.id}', 'pt', this.value)" title="Change points reward">
            </td>
            <td style="text-align:center">
              <input type="checkbox" ${p.active ? 'checked' : ''} onchange="updateProductField('${p.id}', 'active', this.checked)" style="width:auto;cursor:pointer">
            </td>
            <td style="white-space:nowrap">
              <button class="btn ghost sm" onclick="editProduct('${p.id}')">Edit Full</button>
              <button class="btn danger sm" onclick="deleteProd('${p.id}', '${esc(p.name).replace(/'/g, '')}')">🗑</button>
            </td>
          </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Mobile Product Cards (Optimized for smartphones with touch stock adjusters) -->
    <div class="admin-mobile-cards" id="mobileProductsList">
      ${P.map(p => {
        const catObj = SRDB.category(p.cat);
        return `
        <div class="admin-prod-card" data-id="${p.id}" data-name="${esc(p.name).toLowerCase()}" data-cat="${p.cat}">
          <div class="apc-thumb" style="${p.image ? `background-image:url('${p.image}')` : 'display:grid;place-items:center;font-size:2rem'}">
            ${p.image ? '' : '🛍️'}
          </div>
          <div class="apc-content">
            <div class="apc-header">
              <div>
                <div class="apc-title">${esc(p.name)}</div>
                <span class="badge" style="font-size:0.7rem;margin-top:2px;display:inline-block">${esc(catObj ? (catObj.name || catObj.kh) : p.cat)}</span>
              </div>
              <label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;cursor:pointer">
                <input type="checkbox" ${p.active ? 'checked' : ''} onchange="updateProductField('${p.id}', 'active', this.checked)">
                Live
              </label>
            </div>

            <div class="apc-prices">
              <b class="price" id="mobileFinalPrice-${p.id}">${money(SRDB.finalPrice(p))}</b>
              ${p.discount ? `<s class="muted small">${money(p.price)}</s> <span class="badge sale sm">-${p.discount}%</span>` : ''}
              <span class="muted small">+${p.pt} pt</span>
            </div>

            <div class="apc-stock-row">
              <span class="small muted">Stock:</span>
              <div class="apc-stock-stepper">
                <button type="button" onclick="inlineAdjustStock('${p.id}',-1)">−</button>
                <input type="number" min="0" value="${p.stock}" onchange="updateProductField('${p.id}', 'stock', this.value)">
                <button type="button" onclick="inlineAdjustStock('${p.id}',1)">+</button>
              </div>
            </div>

            <div class="apc-actions">
              <button class="btn ghost sm" onclick="editProduct('${p.id}')">✏️ Edit Full</button>
              <button class="btn danger sm" onclick="deleteProd('${p.id}', '${esc(p.name).replace(/'/g, '')}')">🗑 Delete</button>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`
    : `<div style="text-align:center;padding:36px 0">
        <p class="muted">No products currently in the database.</p>
        <p class="small muted" style="margin-top:6px">Click “Upload New Product” to add your first item, or “Seed Sample Catalog” to test immediately!</p>
       </div>`}
  </div>`;
}

// DOM search without re-rendering: NEVER lose focus!
function filterProductRows(val) {
  const q = val.toLowerCase().trim();
  const selectedCat = $('#catSelect')?.value || 'all';

  // Filter desktop table rows
  $$('#productsTable tbody tr').forEach(row => {
    const nameMatch = !q || row.dataset.name.includes(q);
    const catMatch = selectedCat === 'all' || row.dataset.cat === selectedCat;
    row.style.display = (nameMatch && catMatch) ? '' : 'none';
  });

  // Filter mobile cards
  $$('#mobileProductsList .admin-prod-card').forEach(card => {
    const nameMatch = !q || card.dataset.name.includes(q);
    const catMatch = selectedCat === 'all' || card.dataset.cat === selectedCat;
    card.style.display = (nameMatch && catMatch) ? '' : 'none';
  });
}

function filterProductCategory(cat) {
  const q = $('#filterInput')?.value || '';
  filterProductRows(q);
}

// Inline live updating directly from table cells & mobile cards!
async function updateProductField(id, field, value) {
  const p = SRDB.product(id);
  if (!p) return;

  if (field === 'price') {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) p.price = num;
  } else if (field === 'discount') {
    const num = parseFloat(value);
    if (!isNaN(num)) p.discount = Math.min(100, Math.max(0, num));
  } else if (field === 'stock') {
    const num = parseInt(value);
    if (!isNaN(num)) p.stock = Math.max(0, num);
  } else if (field === 'pt') {
    const num = parseInt(value);
    if (!isNaN(num)) p.pt = Math.max(0, num);
  } else if (field === 'active') {
    p.active = Boolean(value);
  }

  // Update final price element in DOM immediately (both table and mobile card)
  const fp = SRDB.finalPrice(p);
  const fpEl = $(`#finalPrice-${id}`);
  if (fpEl) fpEl.textContent = money(fp);
  const mfpEl = $(`#mobileFinalPrice-${id}`);
  if (mfpEl) mfpEl.textContent = money(fp);

  await SRDB.upsertProduct(p);
  toast(`Updated ${field} for "${p.name}"`);
}

async function inlineAdjustStock(id, delta) {
  await SRDB.adjustStock(id, delta);
  const p = SRDB.product(id);
  // Update desktop table row
  const tr = $(`tr[data-id="${id}"]`);
  if (tr && p) {
    const stockInp = tr.querySelector('.stock-ctrl input');
    if (stockInp) stockInp.value = p.stock;
  }
  // Update mobile card
  const card = $(`.admin-prod-card[data-id="${id}"]`);
  if (card && p) {
    const stockInp = card.querySelector('.apc-stock-stepper input');
    if (stockInp) stockInp.value = p.stock;
  }
}

async function seedSampleProducts() {
  if (confirm('Load pre-configured sample products (minifigures, toys, luxury bracelets)?')) {
    await SRDB.seedSampleProducts();
    toast('✨ Sample luxury products saved to SQLite database!');
    render();
  }
}

async function clearAllProducts() {
  if (confirm('Delete ALL products from the store? The shop will become completely empty.')) {
    await SRDB.clearProducts();
    toast('All products removed from database');
    render();
  }
}

async function deleteProd(id, name) {
  if (confirm(`Delete product "${name}"?`)) {
    await SRDB.deleteProduct(id);
    toast('Product deleted');
    render();
  }
}

/* Modal for Uploading / Full Editing */
let draftImg = null;
let imgTab = 'file';

function editProduct(id) {
  const p = id ? SRDB.product(id) : { name: '', cat: 'minifigure', price: '', discount: 0, stock: 12, pt: 1, image: null };
  draftImg = p.image;
  imgTab = 'file';

  modal(`
  <h2>${id ? 'Edit' : 'Upload New'} Product</h2>
  <p class="muted small">Configure picture, price, discounts, and points reward</p>
  <br>
  <div class="form-grid" style="text-align:left">
    <div class="full">
      <label>Product Image</label>
      <div class="img-tabs" style="margin-top:6px">
        <button type="button" class="active" id="tabFileBtn" onclick="switchImgTab('file')">📁 Upload File</button>
        <button type="button" id="tabUrlBtn" onclick="switchImgTab('url')">🔗 Image URL</button>
        <button type="button" id="tabPresetBtn" onclick="switchImgTab('preset')">🎨 Quick Presets</button>
      </div>

      <div id="boxFile">
        <div id="drop" class="drop" onclick="$('#fileInput').click()" style="${p.image ? `background-image:url('${p.image}')` : ''}">
          ${p.image ? '' : '<span class="muted">📷 Click to upload image file (auto-optimized)</span>'}
        </div>
      </div>

      <div id="boxUrl" class="hidden">
        <div style="display:flex;gap:8px">
          <input id="imgUrlInput" placeholder="https://example.com/photo.jpg" value="${p.image && p.image.startsWith('http') ? p.image : ''}">
          <button type="button" class="btn ghost sm" onclick="applyImgUrl()">Apply</button>
        </div>
        <div id="urlPreview" style="margin-top:8px;height:100px;border-radius:12px;background:center/cover;${p.image ? `background-image:url('${p.image}')` : 'display:none'}"></div>
      </div>

      <div id="boxPreset" class="hidden">
        <div class="preset-grid">
          ${PRESET_IMAGES.map(pr => `
            <div class="preset-thumb" style="background-image:url('${pr.url}')" onclick="selectPresetImg('${pr.url}')" title="${pr.label}"></div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="full">
      <label for="fName">Product Name</label>
      <input id="fName" value="${esc(p.name)}" placeholder="e.g. 18K Gold Link Bracelet" autofocus>
    </div>

    <div>
      <label for="fCat">Category</label>
      <select id="fCat">
        ${SRDB.categories().map(c => `<option value="${c.id}" ${p.cat === c.id ? 'selected' : ''}>${esc(c.name || c.kh)}</option>`).join('')}
      </select>
    </div>

    <div>
      <label for="fPt">Points Reward (pt)</label>
      <input id="fPt" type="number" min="0" value="${p.pt}">
    </div>

    <div>
      <label for="fPrice">Regular Price ($)</label>
      <input id="fPrice" type="number" min="0" step="0.01" value="${p.price}" placeholder="0.00" oninput="prevModalPrice()">
    </div>

    <div>
      <label for="fDisc">Discount Rate (%)</label>
      <input id="fDisc" type="number" min="0" max="100" value="${p.discount}" placeholder="0" oninput="prevModalPrice()">
    </div>

    <div>
      <label for="fStock">Stock Inventory</label>
      <input id="fStock" type="number" min="0" value="${p.stock}">
    </div>

    <div>
      <label>Calculated Final Price</label>
      <div id="fFinal" class="price" style="padding:12px 0;font-size:1.2rem"></div>
    </div>
  </div>
  <br>
  <div style="display:flex;gap:10px;justify-content:center">
    <button class="btn primary" id="saveProdBtn" onclick="saveProduct('${id || ''}')">Save Product</button>
    <button class="btn ghost" onclick="closeModal()">Cancel</button>
  </div>`);

  prevModalPrice();
  setTimeout(() => $('#fName')?.focus(), 100);
}

function switchImgTab(which) {
  imgTab = which;
  $('#tabFileBtn').classList.toggle('active', which === 'file');
  $('#tabUrlBtn').classList.toggle('active', which === 'url');
  $('#tabPresetBtn').classList.toggle('active', which === 'preset');
  $('#boxFile').classList.toggle('hidden', which !== 'file');
  $('#boxUrl').classList.toggle('hidden', which !== 'url');
  $('#boxPreset').classList.toggle('hidden', which !== 'preset');
}

function applyImgUrl() {
  const u = $('#imgUrlInput').value.trim();
  if (u) {
    draftImg = u;
    const up = $('#urlPreview');
    up.style.display = 'block';
    up.style.backgroundImage = `url('${u}')`;
    const d = $('#drop');
    if (d) { d.style.backgroundImage = `url('${u}')`; d.innerHTML = ''; }
    toast('Image URL applied');
  }
}

function selectPresetImg(url) {
  draftImg = url;
  const d = $('#drop');
  if (d) { d.style.backgroundImage = `url('${url}')`; d.innerHTML = ''; }
  const up = $('#urlPreview');
  if (up) { up.style.display = 'block'; up.style.backgroundImage = `url('${url}')`; }
  toast('Preset picture selected');
}

function prevModalPrice() {
  const pr = parseFloat($('#fPrice')?.value) || 0;
  const d = parseFloat($('#fDisc')?.value) || 0;
  const fp = +(pr * (1 - d / 100)).toFixed(2);
  const el = $('#fFinal');
  if (el) el.textContent = money(fp);
}

// File drop & compression
$('#fileInput').onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  const img = new Image(), r = new FileReader();
  r.onload = () => { img.src = r.result; };
  img.onload = () => {
    const s = Math.min(1, 600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = img.width * s;
    c.height = img.height * s;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    draftImg = c.toDataURL('image/jpeg', 0.82);
    const d = $('#drop');
    if (d) { d.style.backgroundImage = `url('${draftImg}')`; d.innerHTML = ''; }
  };
  r.readAsDataURL(f);
  e.target.value = '';
};

async function saveProduct(id) {
  const name = $('#fName').value.trim();
  const price = parseFloat($('#fPrice').value);
  if (!name || isNaN(price) || price <= 0) return alert('Product name and valid price are required');

  const btn = $('#saveProdBtn');
  btn.disabled = true;
  btn.textContent = 'Saving to Python DB...';

  await SRDB.upsertProduct({
    ...(id && { id }),
    name,
    price,
    cat: $('#fCat').value,
    discount: Math.min(100, Math.max(0, parseFloat($('#fDisc').value) || 0)),
    stock: Math.max(0, parseInt($('#fStock').value) || 0),
    pt: Math.max(0, parseInt($('#fPt').value) || 0),
    image: draftImg,
  });

  closeModal();
  toast('Product saved successfully');
  render();
}

/* ================================================================
   4. Categories Manager
   ================================================================ */
function categories() {
  const C = SRDB.categories();
  const P = SRDB.products(true);

  $('#view').innerHTML = `
  <div class="glass panel">
    <div class="section-title" style="margin-top:0">
      <div>
        <h2>Store Categories Manager</h2>
        <p class="muted">Add, customize, and manage shop categories displayed across the storefront</p>
      </div>
      <button class="btn primary" onclick="editCategory()">＋ Add New Category</button>
    </div>

    <!-- Desktop Table View -->
    <div class="table-responsive admin-desktop-table">
      <table>
        <thead>
          <tr>
            <th style="width:60px">Icon</th>
            <th>Category Name</th>
            <th>Khmer Title</th>
            <th>Subtitle / Description</th>
            <th>Gradient Theme</th>
            <th style="text-align:center">Products</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${C.map(cat => {
            const count = P.filter(p => p.cat === cat.id).length;
            return `
            <tr>
              <td>
                <div style="width:42px;height:42px;border-radius:10px;background:${cat.grad || 'var(--card)'};display:grid;place-items:center;font-size:1.6rem">
                  ${cat.icon || '🛍️'}
                </div>
              </td>
              <td><b>${esc(cat.name || cat.kh)}</b> <div class="muted small">ID: <code>${esc(cat.id)}</code></div></td>
              <td><b>${esc(cat.kh)}</b></td>
              <td class="muted small">${esc(cat.en || '—')}</td>
              <td>
                <div style="height:22px;width:100px;border-radius:6px;background:${cat.grad || 'var(--card)'};border:1px solid var(--border)" title="${cat.grad}"></div>
              </td>
              <td style="text-align:center"><span class="badge gold">${count} items</span></td>
              <td style="white-space:nowrap">
                <button class="btn ghost sm" onclick="editCategory('${cat.id}')">Edit</button>
                ${cat.id !== 'custom-bracelet' ? `<button class="btn danger sm" onclick="deleteCategory('${cat.id}', '${esc(cat.name || cat.kh).replace(/'/g, '')}')">🗑</button>` : '<span class="muted small">Customizer</span>'}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Mobile Category Cards (Optimized for smartphones) -->
    <div class="admin-mobile-cards">
      ${C.map(cat => {
        const count = P.filter(p => p.cat === cat.id).length;
        return `
        <div class="glass" style="padding:12px;display:flex;gap:12px;align-items:center;border-radius:12px;text-align:left">
          <div style="width:48px;height:48px;border-radius:10px;background:${cat.grad || 'var(--card)'};display:grid;place-items:center;font-size:1.8rem;flex-shrink:0">
            ${cat.icon || '🛍️'}
          </div>
          <div style="flex:1;min-width:0">
            <b>${esc(cat.name || cat.kh)}</b> <span class="badge gold sm" style="margin-left:4px">${count} items</span>
            <div class="muted small">${esc(cat.kh || '')}</div>
            <div class="muted small">${esc(cat.en || '')}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="btn ghost sm" onclick="editCategory('${cat.id}')">Edit</button>
            ${cat.id !== 'custom-bracelet' ? `<button class="btn danger sm" onclick="deleteCategory('${cat.id}', '${esc(cat.name || cat.kh).replace(/'/g, '')}')">🗑</button>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function editCategory(id) {
  const c = id ? SRDB.category(id) : { id: '', name: '', kh: '', en: '', icon: '✨', grad: 'linear-gradient(135deg,#d4af37,#8b5cf6)' };
  const gradPresets = [
    'linear-gradient(135deg,#d4af37,#8b5cf6)',
    'linear-gradient(135deg,#06b6d4,#3b82f6)',
    'linear-gradient(135deg,#f97316,#ec4899)',
    'linear-gradient(135deg,#22c55e,#14b8a6)',
    'linear-gradient(135deg,#e11d48,#fb923c)',
    'linear-gradient(135deg,#6366f1,#a855f7)',
  ];

  modal(`
  <h2>${id ? 'Edit' : 'Add New'} Category</h2>
  <p class="muted small">Categories appear automatically on the storefront and product filters</p><br>
  <div class="form-grid" style="text-align:left">
    <div>
      <label for="cName">Category Name (English)</label>
      <input id="cName" value="${esc(c.name)}" placeholder="e.g. Luxury Necklaces">
    </div>
    <div>
      <label for="cKh">Khmer Label / Display Title</label>
      <input id="cKh" value="${esc(c.kh)}" placeholder="e.g. ខ្សែករ & កងដៃ">
    </div>
    <div class="full">
      <label for="cEn">Short Description / Subtitle</label>
      <input id="cEn" value="${esc(c.en)}" placeholder="e.g. Handcrafted premium gold & silver pieces">
    </div>
    <div>
      <label for="cIcon">Icon / Emoji</label>
      <input id="cIcon" value="${esc(c.icon || '🛍️')}" placeholder="e.g. 💎 or 📿" style="font-size:1.4rem" oninput="updateCatPreview()">
    </div>
    <div>
      <label for="cGrad">Color Gradient CSS</label>
      <input id="cGrad" value="${esc(c.grad)}" placeholder="linear-gradient(...)" oninput="updateCatPreview()">
    </div>
    <div class="full">
      <label>Quick Gradient Presets</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${gradPresets.map(g => `
          <div onclick="$('#cGrad').value='${g}';updateCatPreview()" style="width:36px;height:36px;border-radius:8px;background:${g};cursor:pointer;border:2px solid rgba(255,255,255,.2)"></div>
        `).join('')}
      </div>
    </div>
    <div class="full">
      <label>Live Card Banner Preview</label>
      <div id="cPreviewGrad" style="height:64px;border-radius:12px;background:${c.grad};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1.2rem;gap:10px;box-shadow:var(--shadow)">
        <span id="cPreviewIcon">${c.icon || '✨'}</span>
        <span id="cPreviewText">${esc(c.kh || c.name || 'Category Preview')}</span>
      </div>
    </div>
  </div>
  <br>
  <div style="display:flex;gap:10px;justify-content:center">
    <button class="btn primary" onclick="saveCategory('${id || ''}')">Save Category 💾</button>
    <button class="btn ghost" onclick="closeModal()">Cancel</button>
  </div>`);

  setTimeout(() => $('#cName')?.focus(), 80);
}

function updateCatPreview() {
  const g = $('#cGrad')?.value || 'linear-gradient(135deg,#d4af37,#8b5cf6)';
  const i = $('#cIcon')?.value || '🛍️';
  const t = $('#cKh')?.value || $('#cName')?.value || 'Preview';
  const prev = $('#cPreviewGrad');
  if (prev) {
    prev.style.background = g;
    $('#cPreviewIcon').textContent = i;
    $('#cPreviewText').textContent = t;
  }
}

async function saveCategory(id) {
  const name = $('#cName').value.trim();
  const kh = $('#cKh').value.trim();
  if (!name && !kh) return alert('Category name is required');
  const catData = {
    ...(id && { id }),
    name: name || kh,
    kh: kh || name,
    en: $('#cEn').value.trim(),
    icon: $('#cIcon').value.trim() || '🛍️',
    grad: $('#cGrad').value.trim() || 'linear-gradient(135deg,#d4af37,#8b5cf6)',
  };
  await SRDB.upsertCategory(catData);
  closeModal();
  toast('Category saved successfully! Live on store.');
  render();
}

async function deleteCategory(id, name) {
  if (confirm(`Delete category "${name}"? Products in this category will remain, but the category card will be removed.`)) {
    await SRDB.deleteCategory(id);
    toast('Category deleted');
    render();
  }
}

/* ================================================================
   4b. Italy Charms & Custom Bracelet Studio Management
   ================================================================ */
const CHARM_ADMIN_COLORS = [
  { id: 'silver', label: 'Silver', dot: '#cbd5e1' },
  { id: 'black',  label: 'Black',  dot: '#1e293b' },
  { id: 'orange', label: 'Orange', dot: '#ea580c' },
  { id: 'red',    label: 'Red',    dot: '#dc2626' },
  { id: 'gold',   label: 'Gold',   dot: '#eab308' },
  { id: 'blue',   label: 'Blue',   dot: '#2563eb' }
];

let charmSearchQuery = '';
let charmCatFilter = 'all';
let charmStockFilter = 'all';
let adminCharmModalColor = 'silver';

function renderAdminCharmModel(img, color = 'silver', size = 'admin') {
  const src = img || 'logo.jpg';
  return `
    <div class="charm-png-wrap size-${size}">
      <img src="${src}" alt="Charm PNG" class="charm-png-img" onerror="this.src='logo.jpg'">
    </div>
  `;
}

function charms() {
  const allCharms = SRDB.charms(true);
  const categories = SRDB.charmCategories();
  const c = SRDB.settings();

  // Filter charms
  let filtered = allCharms;
  if (charmSearchQuery) {
    const q = charmSearchQuery.toLowerCase();
    filtered = filtered.filter(ch => (ch.name || '').toLowerCase().includes(q) || (ch.model_no || '').toLowerCase().includes(q) || (ch.id || '').toLowerCase().includes(q) || (ch.category || '').toLowerCase().includes(q));
  }
  if (charmCatFilter !== 'all') {
    filtered = filtered.filter(ch => (ch.category || '').toLowerCase() === charmCatFilter.toLowerCase());
  }
  if (charmStockFilter === 'instock') {
    filtered = filtered.filter(ch => (ch.stock || 0) > 0);
  } else if (charmStockFilter === 'out') {
    filtered = filtered.filter(ch => (ch.stock || 0) <= 0);
  }

  const inStockCount = allCharms.filter(ch => (ch.stock || 0) > 0).length;
  const outCount = allCharms.length - inStockCount;

  $('#view').innerHTML = `
  <div class="glass panel">
    <div class="section-title" style="margin-top:0">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <span style="font-size:1.6rem">🔗</span>
          <h2 style="margin:0">Italy Bracelet Studio & Charms</h2>
          <span class="model-count-badge">✨ ${allCharms.length} Models in Shop</span>
        </div>
        <p class="muted">Manage customizable charm links, center pictures, model numbers, 6 metal finishes (Silver, Black, Orange, Red, Gold, Blue), prices in KHR/USD, and stock</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary" onclick="editCharm()">＋ Add New Charm Model</button>
        <button class="btn ghost" onclick="openStudioPricingModal()">⚙️ Studio Pricing</button>
        <a href="custom-bracelet" target="_blank" class="btn ghost" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px">👁️ Test Studio ↗</a>
        <button class="btn ghost sm" onclick="reseedCharmsCatalog()" title="Restore default authentic 448 charms">✨ Reseed Catalog</button>
      </div>
    </div>

    <!-- Quick Stats Cards (Highlighting Total Models in Shop) -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:10px;margin-bottom:16px">
      <div class="glass" style="padding:10px 14px;border-radius:12px;background:rgba(255,255,255,0.03);border-left:3px solid #ea580c">
        <span class="muted small">Total Models in Shop</span>
        <h3 style="margin:2px 0 0;font-size:1.4rem;color:#ea580c">${allCharms.length}</h3>
      </div>
      <div class="glass" style="padding:10px 14px;border-radius:12px;background:rgba(255,255,255,0.03);border-left:3px solid #22c55e">
        <span class="muted small">In Stock</span>
        <h3 style="margin:2px 0 0;font-size:1.4rem;color:#22c55e">${inStockCount}</h3>
      </div>
      <div class="glass" style="padding:10px 14px;border-radius:12px;background:rgba(255,255,255,0.03);border-left:3px solid #ef4444">
        <span class="muted small">Out of Stock</span>
        <h3 style="margin:2px 0 0;font-size:1.4rem;color:#ef4444">${outCount}</h3>
      </div>
      <div class="glass" style="padding:10px 14px;border-radius:12px;background:rgba(255,255,255,0.03);border-left:3px solid #3b82f6">
        <span class="muted small">Categories</span>
        <h3 style="margin:2px 0 0;font-size:1.4rem;color:#3b82f6">${categories.length}</h3>
      </div>
    </div>

    <!-- Filters Bar -->
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
      <input type="text" id="charmSearchInput" placeholder="🔍 Search Model #, Name, Category..." value="${esc(charmSearchQuery)}" style="max-width:280px" oninput="onCharmSearch(this.value)">
      <select id="charmCatSelect" onchange="onCharmCatFilter(this.value)" style="max-width:200px">
        <option value="all" ${charmCatFilter === 'all' ? 'selected' : ''}>All Categories (${allCharms.length})</option>
        ${categories.map(c => `<option value="${esc(c.category)}" ${charmCatFilter.toLowerCase() === c.category.toLowerCase() ? 'selected' : ''}>${esc(c.category)} (${c.count})</option>`).join('')}
      </select>
      <select id="charmStockSelect" onchange="onCharmStockFilter(this.value)" style="max-width:160px">
        <option value="all" ${charmStockFilter === 'all' ? 'selected' : ''}>All Status</option>
        <option value="instock" ${charmStockFilter === 'instock' ? 'selected' : ''}>In Stock</option>
        <option value="out" ${charmStockFilter === 'out' ? 'selected' : ''}>Out of Stock</option>
      </select>
      <span class="muted small">Showing <b>${filtered.length}</b> / ${allCharms.length} shop models</span>
    </div>

    ${filtered.length ? `
    <!-- Charms Grid View with Authentic Charm Model Frame & Pic in the Middle -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));gap:12px" id="charmsGrid">
      ${filtered.map(ch => {
        const isOut = (ch.stock || 0) <= 0;
        const priceKHR = ch.price_khr || Math.round((ch.price || 0.75) * 4000);
        const mColor = (ch.color || 'silver').toLowerCase();
        return `
        <div class="glass admin-charm-card" style="padding:10px;border-radius:14px;display:flex;flex-direction:column;position:relative;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02)">
          <!-- Top Row: Model # Tag & Status -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span class="charm-model-tag">${esc(ch.model_no || 'MD-001')}</span>
            <span class="badge" style="font-size:0.6rem;padding:1px 6px;text-transform:capitalize">${esc(ch.color || 'Silver')}</span>
          </div>

          <!-- Center: Authentic Small Charm Model Frame with Pic in the Middle -->
          <div style="position:relative;width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;padding:4px;margin-bottom:8px">
            ${renderAdminCharmModel(ch.image, mColor, 'grid')}
            ${isOut ? `<span style="position:absolute;top:4px;right:4px;background:#ef4444;color:#fff;font-size:0.6rem;font-weight:900;padding:2px 6px;border-radius:4px;letter-spacing:0.05em;z-index:5">OUT</span>` : ''}
            ${!ch.active ? `<span style="position:absolute;top:4px;left:4px;background:#64748b;color:#fff;font-size:0.6rem;font-weight:700;padding:2px 6px;border-radius:4px;z-index:5">HIDDEN</span>` : ''}
          </div>

          <div style="flex:1;min-width:0;display:flex;flex-direction:column">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px">
              <b style="font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(ch.name)}">${esc(ch.name)}</b>
              <span class="badge" style="font-size:0.65rem;padding:2px 6px;white-space:nowrap">${esc(ch.category || 'Classic')}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 8px">
              <span style="font-size:0.95rem;font-weight:800;color:#ea580c">${priceKHR.toLocaleString()}៛ <span style="font-size:0.75rem;font-weight:500;color:var(--muted)">($${Number(ch.price || 0.75).toFixed(2)})</span></span>
            </div>
            
            <!-- Quick Stock Control -->
            <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.2);padding:4px 6px;border-radius:8px;margin-bottom:8px">
              <span class="muted small" style="font-size:0.7rem">Stock:</span>
              <div style="display:flex;align-items:center;gap:4px">
                <button class="btn sm ghost" style="padding:1px 7px;min-height:22px;line-height:1" onclick="quickAdjustCharmStock('${ch.id}', -1)" title="Reduce stock">−</button>
                <b style="font-size:0.8rem;min-width:24px;text-align:center;color:${isOut ? '#ef4444' : '#22c55e'}">${ch.stock || 0}</b>
                <button class="btn sm ghost" style="padding:1px 7px;min-height:22px;line-height:1" onclick="quickAdjustCharmStock('${ch.id}', 1)" title="Increase stock">+</button>
              </div>
            </div>

            <!-- Card Action Buttons -->
            <div style="display:flex;gap:6px;margin-top:auto">
              <button class="btn sm ghost" style="flex:1;padding:4px 8px;font-size:0.75rem" onclick="editCharm('${ch.id}')">✏️ Edit</button>
              <button class="btn sm danger" style="padding:4px 8px;font-size:0.75rem" onclick="deleteCharm('${ch.id}', '${esc(ch.name).replace(/'/g, '')}')" title="Delete charm">🗑️</button>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>` : `
    <div style="text-align:center;padding:40px 20px;opacity:0.6">
      <div style="font-size:3rem;margin-bottom:10px">🔗</div>
      <h3>No charms found</h3>
      <p class="muted">Try adjusting your search or category filter, or click "Add New Charm Model" above.</p>
    </div>`}
  </div>`;
}

function onCharmSearch(v) {
  charmSearchQuery = v;
  charms();
}

function onCharmCatFilter(v) {
  charmCatFilter = v;
  charms();
}

function onCharmStockFilter(v) {
  charmStockFilter = v;
  charms();
}

async function quickAdjustCharmStock(id, delta) {
  await SRDB.adjustCharmStock(id, delta);
  toast(`Stock ${delta > 0 ? '+1' : '-1'}`);
  render();
}

async function deleteCharm(id, name) {
  if (confirm(`Are you sure you want to delete charm "${name}"? It will be removed from the customizer studio.`)) {
    await SRDB.deleteCharm(id);
    toast('Charm deleted');
    render();
  }
}

function setAdminCharmPreviewColor(color) {
  adminCharmModalColor = color.toLowerCase();
  const select = $('#chColor');
  if (select) select.value = adminCharmModalColor;
  document.querySelectorAll('.admin-color-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === adminCharmModalColor);
  });
  const img = $('#chImage')?.value || '';
  const box = $('#adminCharmModelBox');
  if (box) box.innerHTML = renderAdminCharmModel(img, adminCharmModalColor, 'admin');
}

function updateAdminCharmPreview(url) {
  const box = $('#adminCharmModelBox');
  if (box) box.innerHTML = renderAdminCharmModel(url || '', adminCharmModalColor, 'admin');
}

function editCharm(id) {
  const ch = id ? SRDB.charm(id) : null;
  const isEdit = !!ch;
  const cats = SRDB.charmCategories();
  const allList = SRDB.charms(true);
  const priceUSD = ch ? Number(ch.price || 0.75).toFixed(2) : '0.75';
  const priceKHR = ch ? (ch.price_khr || Math.round(Number(ch.price || 0.75) * 4000)) : 3000;
  const stock = ch ? (ch.stock !== undefined ? ch.stock : 99) : 99;
  const active = ch ? (ch.active !== undefined ? ch.active : 1) : 1;
  const img = ch?.image || '';
  const modelNo = ch?.model_no || `MD-${(allList.length + 1).toString().padStart(3, '0')}`;
  adminCharmModalColor = (ch?.color || 'silver').toLowerCase();

  modal(`
  <h2>${isEdit ? '✏️ Edit Italy Charm Model' : '✨ Add New Italy Charm Model'}</h2>
  <p class="muted small">Configure model number, middle picture (upload or URL), metal color, pricing, and stock inventory</p><br>

  <!-- Live Charm PNG Preview -->
  <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:16px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px">
    <span class="muted small" style="font-weight:700">🔍 Live Charm PNG Preview</span>
    <div id="adminCharmModelBox">
      ${renderAdminCharmModel(img, adminCharmModalColor, 'admin')}
    </div>
  </div>

  <div class="form-grid" style="text-align:left">
    <div>
      <label for="chModelNo">Model Number / Code</label>
      <input id="chModelNo" value="${esc(modelNo)}" placeholder="e.g. MD-001, MD-042">
    </div>
    <div>
      <label for="chColor">Metal Color Category</label>
      <select id="chColor">
        ${CHARM_ADMIN_COLORS.map(c => `
          <option value="${c.id}" ${adminCharmModalColor === c.id ? 'selected' : ''}>${c.label}</option>
        `).join('')}
      </select>
    </div>
    <div class="full">
      <label for="chName">Charm Model Name / Title</label>
      <input id="chName" value="${esc(ch?.name || '')}" placeholder="e.g. Silver Star Charm, Pink Butterfly, Gold Heart">
    </div>
    <div>
      <label for="chCat">Category</label>
      <input id="chCat" list="charmCatDatalist" value="${esc(ch?.category || 'Plain')}" placeholder="e.g. Plain, Cartoon, Animal">
      <datalist id="charmCatDatalist">
        ${cats.map(c => `<option value="${esc(c.category)}"></option>`).join('')}
      </datalist>
    </div>
    <div>
      <label for="chStock">Stock Quantity</label>
      <input type="number" id="chStock" min="0" value="${stock}" placeholder="e.g. 50">
    </div>
    <div>
      <label for="chPriceUSD">Price USD ($)</label>
      <input type="number" id="chPriceUSD" step="0.01" min="0" value="${priceUSD}" oninput="syncCharmPrices('usd')">
    </div>
    <div>
      <label for="chPriceKHR">Price KHR (៛ Riel)</label>
      <input type="number" id="chPriceKHR" step="100" min="0" value="${priceKHR}" oninput="syncCharmPrices('khr')">
    </div>

    <!-- Charm PNG Upload or URL -->
    <div class="full">
      <label style="display:flex;align-items:center;justify-content:space-between">
        <span>🖼️ Charm PNG Image (Transparent Background)</span>
        <span class="muted small">Direct PNG upload or enter image URL</span>
      </label>
      <div class="admin-pic-zone" onclick="$('#charmFileInput').click()">
        <span style="font-size:2rem">📤</span>
        <b style="font-size:0.9rem">Click to Upload Charm PNG</b>
        <span class="muted small">Select transparent PNG of the charm • Displays directly in shop studio</span>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <input id="chImage" value="${esc(img)}" placeholder="Paste image URL (PNG/WebP) or upload above" oninput="updateAdminCharmPreview(this.value)">
        <button type="button" class="btn ghost sm" onclick="pickSampleCharmImage()">🎨 Presets</button>
      </div>
    </div>

    <div class="full" style="display:flex;align-items:center;gap:10px;margin-top:6px">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
        <input type="checkbox" id="chActive" ${active ? 'checked' : ''} style="width:auto">
        <b>Active / Visible in Customizer Studio</b>
      </label>
    </div>
  </div>
  <br>
  <div style="display:flex;gap:10px;justify-content:flex-end">
    <button class="btn ghost" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="saveCharm('${ch?.id || ''}')">Save Charm Model</button>
  </div>`);
}

function syncCharmPrices(source) {
  const RATE = 4000;
  if (source === 'usd') {
    const usd = parseFloat($('#chPriceUSD')?.value || 0);
    const khrEl = $('#chPriceKHR');
    if (khrEl) khrEl.value = Math.round(usd * RATE);
  } else {
    const khr = parseFloat($('#chPriceKHR')?.value || 0);
    const usdEl = $('#chPriceUSD');
    if (usdEl) usdEl.value = (khr / RATE).toFixed(2);
  }
}

function pickSampleCharmImage() {
  const samples = [
    { name: 'Plain Stainless Link', url: 'https://res.cloudinary.com/dwwearehy/image/upload/v1775063355/x1dfa5orfmizgkgd6tgp.webp' },
    { name: 'Pinky Star', url: 'https://res.cloudinary.com/dwwearehy/image/upload/v1786697945/jz4g20ihytvdkvnidyzb.webp' },
    { name: 'Pink Butterfly', url: 'https://res.cloudinary.com/dwwearehy/image/upload/v1786705153/b7k5g3s78n3t04m84y32.webp' },
    { name: 'Cute Stitch', url: 'https://res.cloudinary.com/dwwearehy/image/upload/v1786705154/zcphh5tu0k4inhyiwmpd.webp' },
    { name: 'Sweet Cherry', url: 'https://res.cloudinary.com/dwwearehy/image/upload/v1786705155/mqpyrp7rsxylqxlgpxji.webp' },
    { name: 'Cat Lover', url: 'https://res.cloudinary.com/dwwearehy/image/upload/v1786705156/oxfavg7scahcaoudnjer.webp' },
    { name: 'Black Letter', url: 'https://res.cloudinary.com/dwwearehy/image/upload/v1786705158/pekqxpfceaz1ntbcnmh0.webp' },
    { name: 'Gold Heart', url: 'https://res.cloudinary.com/dwwearehy/image/upload/v1786705159/lwe72dinmgddqh1covqf.webp' },
  ];
  const choice = prompt("Select sample image index (1-8):\n" + samples.map((s, i) => `${i+1}. ${s.name}`).join("\n"));
  if (choice) {
    const idx = parseInt(choice) - 1;
    if (samples[idx]) {
      const urlInput = $('#chImage');
      if (urlInput) {
        urlInput.value = samples[idx].url;
        updateAdminCharmPreview(samples[idx].url);
      }
    }
  }
}

async function saveCharm(id) {
  const name = $('#chName')?.value.trim();
  const model_no = $('#chModelNo')?.value.trim();
  const color = $('#chColor')?.value || adminCharmModalColor || 'silver';
  const category = $('#chCat')?.value.trim() || 'Plain';
  const priceUSD = parseFloat($('#chPriceUSD')?.value || 0.75);
  const priceKHR = parseInt($('#chPriceKHR')?.value || Math.round(priceUSD * 4000));
  const stock = parseInt($('#chStock')?.value || 0);
  const image = $('#chImage')?.value.trim();
  const active = $('#chActive')?.checked ? 1 : 0;

  if (!name) return alert('Charm model name is required');
  if (!image) return alert('Picture in the middle is required');

  const charmData = {
    ...(id && { id }),
    name,
    model_no: model_no || `MD-${Date.now().toString().slice(-3)}`,
    color: color.charAt(0).toUpperCase() + color.slice(1).toLowerCase(),
    category,
    price: priceUSD,
    price_khr: priceKHR,
    stock,
    image,
    active
  };

  await SRDB.upsertCharm(charmData);
  closeModal();
  toast(id ? 'Charm model updated successfully!' : 'New charm model created!');
  render();
}

function openStudioPricingModal() {
  const c = SRDB.settings();
  const basePrice = c.customBasePrice !== undefined ? c.customBasePrice : (c.custom_base_price || 8.0);
  const pkgPrice = c.customPremiumPkg !== undefined ? c.customPremiumPkg : (c.custom_premium_pkg || 0.5);
  const customPt = c.customPt !== undefined ? c.customPt : (c.custom_pt || 5);

  modal(`
  <h2>⚙️ Italy Bracelet Studio Pricing & Rules</h2>
  <p class="muted small">Set base stainless steel band pricing, gift packaging box fee, and loyalty point rewards</p><br>
  <div class="form-grid" style="text-align:left">
    <div>
      <label for="stBasePrice">Base Bracelet Band ($ USD)</label>
      <input type="number" id="stBasePrice" step="0.5" min="0" value="${basePrice}">
      <span class="muted small">~${Math.round(basePrice * 4000).toLocaleString()}៛ (Starter chain)</span>
    </div>
    <div>
      <label for="stPkgPrice">Premium Box Packaging Fee ($ USD)</label>
      <input type="number" id="stPkgPrice" step="0.1" min="0" value="${pkgPrice}">
      <span class="muted small">~${Math.round(pkgPrice * 4000).toLocaleString()}៛ (Default 2,000៛)</span>
    </div>
    <div class="full">
      <label for="stCustomPt">Loyalty Points Rewarded per Custom Bracelet</label>
      <input type="number" id="stCustomPt" min="0" value="${customPt}">
      <span class="muted small">Awarded to customers upon order approval</span>
    </div>
  </div>
  <br>
  <div style="display:flex;gap:10px;justify-content:flex-end">
    <button class="btn ghost" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="saveStudioPricing()">Save Studio Pricing</button>
  </div>`);
}

async function saveStudioPricing() {
  const basePrice = parseFloat($('#stBasePrice')?.value || 8.0);
  const pkgPrice = parseFloat($('#stPkgPrice')?.value || 0.5);
  const customPt = parseInt($('#stCustomPt')?.value || 5);

  await SRDB.saveSettings({
    custom_base_price: basePrice,
    customBasePrice: basePrice,
    custom_premium_pkg: pkgPrice,
    customPremiumPkg: pkgPrice,
    custom_pt: customPt,
    customPt: customPt
  });

  closeModal();
  toast('Studio pricing updated!');
  render();
}

async function reseedCharmsCatalog() {
  if (confirm("Reset and reseed all 448 authentic Italian bracelet charms from the official live catalog?")) {
    const count = await SRDB.seedCharms();
    toast(`Successfully reseeded ${count} authentic charms!`);
    render();
  }
}

/* ================================================================
   5. Customers & Loyalty Points
   ================================================================ */
function customers() {
  const U = SRDB.users();
  $('#view').innerHTML = `
  <div class="glass panel">
    <div class="section-title" style="margin-top:0">
      <div>
        <h2>Customer Accounts & Loyalty Points</h2>
        <p class="muted">All customers verified through Telegram with Cambodian phone number</p>
      </div>
    </div>
    ${U.length ? `
    <!-- Desktop Table View -->
    <div class="table-responsive admin-desktop-table">
      <table>
        <thead>
          <tr>
            <th>Telegram Account</th>
            <th>Contact Phone</th>
            <th>Total Orders</th>
            <th>Points Balance</th>
            <th>Active Vouchers</th>
            <th>Joined</th>
            <th>Adjust Points</th>
          </tr>
        </thead>
        <tbody>
          ${U.map(u => `
          <tr>
            <td><b>@${esc(u.username)}</b> <span class="badge ok">TG ✔</span></td>
            <td>${esc(u.phone)}</td>
            <td>${SRDB.ordersOf(u.id).length}</td>
            <td><b class="price">${u.points} pt</b></td>
            <td>${(u.vouchers || []).filter(v => !v.used).length} vouchers</td>
            <td class="small muted">${new Date(u.created_at || u.createdAt).toLocaleDateString()}</td>
            <td>
              <button class="btn ghost sm" onclick="adjustUserPt('${u.id}')">± Adjust pt</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- Mobile Customer Cards (Optimized for smartphones) -->
    <div class="admin-mobile-cards">
      ${U.map(u => `
      <div class="glass" style="padding:14px;border-radius:12px;text-align:left;display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <b>@${esc(u.username)}</b> <span class="badge ok">TG ✔</span>
          </div>
          <b class="price" style="font-size:1.15rem">${u.points} pt</b>
        </div>
        <div class="small muted">📞 ${esc(u.phone || '—')}</div>
        <div class="small muted">📦 Orders: <b>${SRDB.ordersOf(u.id).length}</b> · 🎟️ Active Vouchers: <b>${(u.vouchers || []).filter(v => !v.used).length}</b></div>
        <div class="small muted">📅 Joined: ${new Date(u.created_at || u.createdAt).toLocaleDateString()}</div>
        <div style="margin-top:4px">
          <button class="btn ghost sm" style="width:100%" onclick="adjustUserPt('${u.id}')">± Adjust Points Balance</button>
        </div>
      </div>`).join('')}
    </div>`
    : '<p class="muted" style="padding:24px 0;text-align:center">No customers registered yet. When a user logs in via Telegram, they will appear here.</p>'}
  </div>`;
}

async function adjustUserPt(id) {
  const u = SRDB.user(id);
  const val = prompt(`Adjust points for @${u.username} (current: ${u.points} pt):\nEnter positive number to add (e.g. 25) or negative to subtract (e.g. -10):`, '25');
  const d = parseInt(val);
  if (!isNaN(d) && d !== 0) {
    await SRDB.addPoints(id, d, 'Admin manual adjustment');
    toast(`Adjusted points for @${u.username} by ${d > 0 ? '+' : ''}${d} pt`);
    render();
  }
}

/* ================================================================
   5. Site Settings (Modify the Web)
   ================================================================ */
function settings() {
  const s = SRDB.settings();
  const logoSrc = s.siteLogo || s.site_logo || 'logo.jpg';
  const f = (k, l, t = 'text', help = '') => `
    <div>
      <label for="set-${k}">${l}</label>
      <input id="set-${k}" data-k="${k}" type="${t}" ${t === 'number' ? 'step="0.01"' : ''} value="${esc(s[k])}">
      ${help ? `<p class="muted small" style="margin-top:3px">${help}</p>` : ''}
    </div>`;

  $('#view').innerHTML = `
  <div class="glass panel">
    <div class="section-title" style="margin-top:0">
      <div>
        <h2>Website Customization & Studio Rules</h2>
        <p class="muted">Live store changes apply immediately and persist in Python SQLite DB</p>
      </div>
      <button class="btn primary" onclick="saveSettings()">Save Changes 💾</button>
    </div>

    <h3>Studio Logo & Branding</h3>
    <p class="muted small" style="margin-top:2px">Official store logo displayed across the website and customer storefront. (Editable in Admin Panel only)</p>
    <br>
    <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;background:rgba(255,255,255,0.03);padding:18px;border-radius:var(--radius-md);border:1px solid var(--border);box-shadow:inset 0 1px 3px rgba(0,0,0,0.2);margin-bottom:24px">
      <div class="logo-mark lg" id="settingsLogoPreview" style="border:2px solid rgba(16,185,129,0.5)">
        <img id="settingsLogoImg" src="${esc(logoSrc)}" alt="Logo Preview" style="width:100%;height:100%;object-fit:cover">
      </div>
      <div style="flex:1;min-width:260px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button type="button" class="btn primary sm" onclick="$('#logoFileInput').click()">📁 Upload New Logo File</button>
          <button type="button" class="btn ghost sm" onclick="resetDefaultLogo()">🔄 Reset to Original Logo</button>
        </div>
        <div>
          <label for="set-siteLogo">Logo Image URL or Local Path</label>
          <div style="display:flex;gap:8px">
            <input id="set-siteLogo" data-k="siteLogo" value="${esc(logoSrc)}" placeholder="logo.jpg or https://..." oninput="previewSettingsLogo(this.value)">
            <button type="button" class="btn ghost sm" onclick="previewSettingsLogo($('#set-siteLogo').value)">Preview</button>
          </div>
        </div>
        <p class="muted small">Supports JPG, PNG, WEBP, or SVG. When you upload, it is automatically optimized.</p>
      </div>
    </div>

    <h3>Studio Titles & Text</h3>
    <br>
    <div class="form-grid">
      ${f('siteTitle', 'Store Header Title', 'text', 'e.g. សម្ភារៈ - Somphea Reak')}
      ${f('subtitle', 'Studio Subtitle', 'text', 'e.g. Premium Studio')}
      <div class="full">
        ${f('tagline', 'Tagline Slogan', 'text', 'e.g. Cambodia Kingdom of Wonder')}
      </div>
      <div class="full">
        ${f('announcement', 'Announcement Bar Message (Top of Site)', 'text', 'Displayed at the top of the store')}
      </div>
      <div class="full">
        ${f('sellerTelegram', 'Seller Telegram Username / Link', 'text', 'Telegram username or link for Customer Service button (e.g. sompheareak)')}
      </div>
    </div>

    <br><h3>Pricing & Loyalty Economics</h3>
    <br>
    <div class="form-grid">
      ${f('deliveryFee', 'Flat Delivery Fee ($)', 'number', 'Added at checkout')}
      ${f('customBasePrice', 'Custom Bracelet Base Price ($)', 'number', 'Base price for empty link bracelet')}
      ${f('charmPrice', 'Price per Charm Link ($)', 'number', 'Price for each added charm')}
      ${f('customPt', 'Custom Bracelet Points Reward (pt)', 'number', 'Points awarded per custom bracelet')}
      ${f('voucherCost', 'Voucher Cost in Points (pt)', 'number', 'Points needed to redeem a voucher')}
      ${f('voucherPct', 'Voucher Discount Percentage (%)', 'number', 'Discount rate per voucher')}
    </div>

    <br><h3>Italy Charms Collection</h3>
    <div style="margin-top:8px">
      <label for="fCharms">Charms Emoji / Icon List (comma-separated)</label>
      <input id="fCharms" value="${esc((s.charms || []).join(','))}">
      <p class="muted small" style="margin-top:4px">These icons will appear in the customer bracelet designer.</p>
    </div>

    <br><h3>Admin Authentication</h3>
    <br>
    <div class="form-grid">
      ${f('adminPin', 'Admin Access PIN', 'password', 'PIN required to log into this panel')}
    </div>
    <br>
    <button class="btn primary" onclick="saveSettings()">Save Changes 💾</button>
  </div>`;
}

function resetDefaultLogo() {
  const inp = $('#set-siteLogo');
  if (inp) inp.value = 'logo.jpg';
  previewSettingsLogo('logo.jpg');
  toast('Logo reset to default logo.jpg. Click "Save Changes" to save to SQLite database.');
}

function previewSettingsLogo(src) {
  const img = $('#settingsLogoImg');
  if (img) img.src = src;
}

// Logo file picker & client-side compression
const logoFileInputEl = $('#logoFileInput');
if (logoFileInputEl) {
  logoFileInputEl.onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 320;
        let w = img.width, h = img.height;
        if (w > h) { if (w > max) { h = Math.round(h * max / w); w = max; } }
        else { if (h > max) { w = Math.round(w * max / h); h = max; } }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const inp = $('#set-siteLogo');
        if (inp) inp.value = dataUrl;
        previewSettingsLogo(dataUrl);
        toast('New logo loaded! Click "Save Changes" to apply.');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };
}

// Charm PNG file picker with pure alpha transparency preservation
const charmFileInputEl = $('#charmFileInput');
if (charmFileInputEl) {
  charmFileInputEl.onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 800;
        let w = img.width, h = img.height;
        if (w > h) { if (w > max) { h = Math.round(h * max / w); w = max; } }
        else { if (h > max) { w = Math.round(w * max / h); h = max; } }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/png');
        const inp = $('#chImage');
        if (inp) inp.value = dataUrl;
        updateAdminCharmPreview(dataUrl);
        toast('Charm PNG uploaded successfully! ✨');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };
}

async function saveSettings() {
  const patch = {};
  document.querySelectorAll('[data-k]').forEach(i => {
    patch[i.dataset.k] = i.type === 'number' ? parseFloat(i.value) || 0 : i.value;
  });

  const charmsInput = $('#fCharms');
  if (charmsInput) {
    const list = charmsInput.value.split(',').map(x => x.trim()).filter(Boolean);
    if (list.length) patch.charms = list;
  }

  // Also map snake_case for Python backend
  if (patch.siteLogo) {
    patch.site_logo = patch.siteLogo;
  }
  if (patch.siteTitle) patch.site_title = patch.siteTitle;
  if (patch.adminPin) patch.admin_pin = patch.adminPin;
  if (patch.deliveryFee !== undefined) patch.delivery_fee = patch.deliveryFee;
  if (patch.voucherCost !== undefined) patch.voucher_cost = patch.voucherCost;
  if (patch.voucherPct !== undefined) patch.voucher_pct = patch.voucherPct;
  if (patch.customBasePrice !== undefined) patch.custom_base_price = patch.customBasePrice;
  if (patch.charmPrice !== undefined) patch.charm_price = patch.charmPrice;
  if (patch.customPt !== undefined) patch.custom_pt = patch.customPt;
  if (patch.sellerTelegram) patch.seller_telegram = patch.sellerTelegram;

  await SRDB.saveSettings(patch);
  applyLogo();
  toast('Settings saved successfully to Python database');
}

/* ================================================================
   6. Database Tools
   ================================================================ */
function database() {
  $('#view').innerHTML = `
  <div class="glass panel">
    <div class="section-title" style="margin-top:0">
      <div>
        <h2>Python SQLite Database (sompheareak.db)</h2>
        <p class="muted">All tables (settings, products, orders, users, notifications) stored in SQLite on server</p>
      </div>
      <button class="btn ghost sm" onclick="SRDB.sync();render();toast('Synced with SQLite')">🔄 Sync from Python</button>
    </div>
    <div class="glass" style="padding:16px;margin-bottom:16px;font-size:0.85rem">
      <b>Database Engine:</b> SQLite 3 with Python Flask API<br>
      <b>Database File:</b> <code>sompheareak.db</code><br>
      <b>Status:</b> 🟢 Connected & Persistent
    </div>
    <label>Live Database Inspection (JSON Cache)</label>
    <textarea id="dbView" readonly style="width:100%;height:380px;background:transparent;color:var(--fg);border:1px solid var(--border);border-radius:12px;padding:12px;font-family:monospace;font-size:.75rem;margin-top:8px">
${esc(JSON.stringify({
  settings: SRDB.settings(),
  productsCount: SRDB.products(true).length,
  ordersCount: SRDB.orders().length,
  usersCount: SRDB.users().length,
  notificationsCount: SRDB.notifications().length,
  products: SRDB.products(true),
  orders: SRDB.orders()
}, null, 2).replace(/"data:image[^"]+"/g, '"<base64_image_data>"'))}
    </textarea>
  </div>`;
}

// Apply logo on initial load
applyLogo();

// Auto enter if already authenticated or remembered on this device
const rememberedToken = sessionStorage.getItem('sr_admin_token') || (
  localStorage.getItem('sr_admin_remember') !== 'false' ? localStorage.getItem('sr_admin_token') : null
);

if (rememberedToken) {
  sessionStorage.setItem('sr_admin_token', rememberedToken);
  sessionStorage.setItem('sr_admin', '1');
  enter();
} else if (sessionStorage.getItem('sr_admin') === '1') {
  enter();
}
