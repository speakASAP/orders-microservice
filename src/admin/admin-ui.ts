export const ADMIN_ORDERS_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Orders Admin</title>
  <style>
    :root {
      --bg: #f4f6f8;
      --surface: #ffffff;
      --surface-2: #f8fafc;
      --ink: #101828;
      --muted: #667085;
      --line: #d8dee8;
      --teal: #0f766e;
      --teal-soft: #e6f5f2;
      --amber: #b7791f;
      --amber-soft: #fff7e6;
      --red: #b42318;
      --green: #047857;
      --shadow: 0 18px 45px rgba(16, 24, 40, .08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background: var(--bg);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }
    button, input, select { font: inherit; }
    .shell { display: grid; grid-template-columns: 238px minmax(0, 1fr); min-height: 100vh; }
    .sidebar {
      background: #111827;
      color: #dbe5f2;
      padding: 18px 12px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .brand { display: flex; align-items: center; gap: 10px; padding: 0 8px; color: #fff; font-weight: 850; }
    .brand-mark { width: 32px; height: 32px; border-radius: 8px; background: var(--teal); display: grid; place-items: center; color: #fff; font-weight: 900; }
    .nav { display: grid; gap: 5px; }
    .nav a {
      color: #b8c4d6;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 650;
    }
    .nav a.active { background: rgba(15,118,110,.22); color: #fff; }
    .nav svg { width: 17px; height: 17px; flex: 0 0 auto; }
    .side-note { margin-top: auto; padding: 10px; border-top: 1px solid rgba(255,255,255,.12); color: #aab8ca; font-size: 12px; line-height: 1.45; }
    .main { min-width: 0; display: flex; flex-direction: column; }
    .topbar {
      min-height: 72px;
      background: var(--surface);
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      gap: 18px;
    }
    .title h1 { margin: 0; font-size: 21px; line-height: 1.2; }
    .title p { margin: 5px 0 0; color: var(--muted); font-size: 13px; }
    .session {
      display: grid;
      grid-template-columns: auto auto;
      align-items: center;
      gap: 8px;
    }
    .btn {
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 8px;
      height: 38px;
      padding: 0 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      color: var(--ink);
      font-weight: 760;
      font-size: 13px;
      white-space: nowrap;
    }
    .btn.primary { border-color: var(--teal); background: var(--teal); color: #fff; }
    .content { padding: 18px 24px 24px; display: grid; gap: 14px; }
    .notice {
      border: 1px solid #f2d08a;
      background: var(--amber-soft);
      color: #713f12;
      border-radius: 8px;
      padding: 11px 13px;
      font-size: 13px;
      line-height: 1.45;
      display: none;
    }
    .notice.visible { display: block; }
    .error {
      color: var(--red);
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 10px 12px;
      border-radius: 8px;
      display: none;
      font-size: 13px;
    }
    .error.visible { display: block; }
    .ecosystem-strip {
      display: grid;
      grid-template-columns: repeat(6, minmax(120px, 1fr));
      gap: 8px;
    }
    .ops-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr);
      gap: 14px;
      align-items: stretch;
    }
    .ops-body { padding: 14px; display: grid; gap: 12px; }
    .integration-list, .diag-result { display: grid; gap: 8px; }
    .system {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 11px;
      min-height: 62px;
    }
    .system strong { display: block; font-size: 12px; }
    .system span { display: block; margin-top: 5px; color: var(--muted); font-size: 11px; line-height: 1.35; }
    .system-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .system-row .pill { flex: 0 0 auto; }
    .diag-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; align-items: end; }
    .diag-form .wide { grid-column: 1 / -1; }
    .action-panel { display: grid; gap: 10px; }
    .checks { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
    .check { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 12px; }
    .check input { width: 14px; height: 14px; }
    .metrics { display: grid; grid-template-columns: repeat(5, minmax(130px, 1fr)); gap: 10px; }
    .metric { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 13px 14px; }
    .metric span { color: var(--muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 7px; font-size: 23px; line-height: 1.05; }
    .toolbar {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      display: grid;
      grid-template-columns: 1.35fr repeat(5, minmax(122px, 1fr)) auto auto;
      gap: 9px;
      align-items: end;
    }
    .field { display: grid; gap: 5px; min-width: 0; }
    label { color: var(--muted); font-size: 11px; font-weight: 820; text-transform: uppercase; }
    input, select {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 9px 10px;
      min-width: 0;
      background: #fff;
      color: var(--ink);
      font-size: 13px;
    }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 430px; gap: 14px; align-items: start; }
    .panel { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; box-shadow: var(--shadow); min-width: 0; overflow: hidden; }
    .panel-head { height: 48px; padding: 0 14px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .panel-head h2 { font-size: 14px; margin: 0; }
    .count { color: var(--muted); font-size: 12px; }
    .table-wrap { overflow: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 990px; }
    th { text-align: left; color: var(--muted); font-size: 11px; text-transform: uppercase; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid var(--line); white-space: nowrap; }
    td { padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 13px; vertical-align: middle; }
    tr { cursor: pointer; }
    tr:hover, tr.selected { background: #f0fdfa; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; }
    .muted { color: var(--muted); }
    .stack { display: grid; gap: 3px; }
    .pill { display: inline-flex; width: fit-content; align-items: center; border-radius: 999px; padding: 3px 8px; font-size: 12px; font-weight: 800; border: 1px solid var(--line); color: #334155; background: #f8fafc; }
    .pill.pending, .pill.confirmed, .pill.processing { color: var(--amber); background: #fffbeb; border-color: #fde68a; }
    .pill.shipped { color: #3538cd; background: #eef2ff; border-color: #c7d2fe; }
    .pill.delivered { color: var(--green); background: #ecfdf5; border-color: #a7f3d0; }
    .pill.cancelled { color: var(--red); background: #fef2f2; border-color: #fecaca; }
    .detail { position: sticky; top: 16px; max-height: calc(100vh - 104px); overflow: auto; }
    .detail-body { padding: 14px; display: grid; gap: 16px; }
    .empty, .locked { min-height: 320px; display: grid; place-items: center; color: var(--muted); text-align: center; padding: 30px; line-height: 1.5; }
    .locked strong { color: var(--ink); display: block; margin-bottom: 6px; }
    .section { display: grid; gap: 9px; }
    .section h3 { margin: 0; font-size: 13px; }
    .kv { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 8px; font-size: 13px; }
    .kv span:first-child { color: var(--muted); }
    .timeline, .logs, .items { display: grid; gap: 8px; }
    .event, .log, .item { border: 1px solid var(--line); background: var(--surface-2); border-radius: 8px; padding: 10px; display: grid; gap: 4px; font-size: 13px; }
    .event strong, .log strong, .item strong { font-size: 13px; }
    @media (max-width: 1180px) {
      .shell { grid-template-columns: 72px minmax(0, 1fr); }
      .brand span, .nav span, .side-note { display: none; }
      .metrics, .ecosystem-strip, .ops-grid { grid-template-columns: repeat(2, 1fr); }
      .toolbar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .layout { grid-template-columns: 1fr; }
      .detail { position: static; max-height: none; }
      .session { grid-template-columns: minmax(180px, 1fr) auto auto; }
    }
    @media (max-width: 720px) {
      .topbar { align-items: stretch; flex-direction: column; padding: 14px; }
      .content { padding: 14px; }
      .metrics, .toolbar, .ecosystem-strip, .ops-grid, .diag-form, .checks, .session { grid-template-columns: 1fr; }
      .diag-form .wide { grid-column: auto; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">O</div><span>Orders Admin</span></div>
      <nav class="nav" aria-label="Admin navigation">
        <a class="active" href="/admin/orders"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span>Orders</span></a>
        <a href="/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg><span>Landing</span></a>
        <a href="#" aria-disabled="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5M4 19h16M8 16V9M13 16V7M18 16v-5"/></svg><span>Analytics</span></a>
        <a href="#" aria-disabled="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg><span>Lifecycle</span></a>
      </nav>
      <div class="side-note">Admin data is loaded only from Auth-protected JSON endpoints. This shell does not embed order records.</div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div class="title"><h1>Orders operations</h1><p>Canonical lifecycle visibility across channels, payments, fulfillment, and ecosystem signals.</p></div>
        <div class="session">
          <button class="btn primary" id="signInAuth">Sign in with Auth</button>
          <button class="btn" id="clearToken">Sign out</button>
        </div>
      </header>
      <section class="content">
        <div id="locked" class="notice visible">Admin visibility requires an Auth session with <strong>global:superadmin</strong> or <strong>internal:orders-microservice:admin</strong>. The public shell is visible, but order data remains protected.</div>
        <div id="error" class="error"></div>
        <div class="ops-grid">
          <section class="panel">
            <div class="panel-head"><h2>Integration health</h2><span class="count" id="opsMode">Locked</span></div>
            <div class="ops-body">
              <div class="integration-list" id="integrations">
                <div class="locked"><div><strong>Protected operations data</strong>Load with an authorized token to inspect read-only integration health.</div></div>
              </div>
              <div class="metrics">
                <div class="metric"><span>Open</span><strong id="oOpen">-</strong></div>
                <div class="metric"><span>Stale</span><strong id="oStale">-</strong></div>
                <div class="metric"><span>Paid</span><strong id="oPaid">-</strong></div>
                <div class="metric"><span>Shipments</span><strong id="oShipments">-</strong></div>
                <div class="metric"><span>Handoffs</span><strong id="oHandoffs">-</strong></div>
              </div>
            </div>
          </section>
          <section class="panel">
            <div class="panel-head"><h2>Idempotency diagnostics</h2><span class="count" id="diagState">Locked</span></div>
            <div class="ops-body">
              <form class="diag-form" id="diagForm">
                <div class="field"><label for="diagChannel">Channel</label><input id="diagChannel" name="channel" placeholder="flipflop" /></div>
                <div class="field"><label for="diagAccount">Account</label><input id="diagAccount" name="channelAccountId" placeholder="store or integration id" /></div>
                <div class="field wide"><label for="diagExternal">External order ID</label><input id="diagExternal" name="externalOrderId" placeholder="upstream order id" /></div>
                <button class="btn primary" type="submit">Check key</button>
              </form>
              <div class="diag-result" id="diagResult"><div class="muted">Query a channel and external order ID after loading admin data.</div></div>
            </div>
          </section>
        </div>
        <section class="panel">
          <div class="panel-head"><h2>Approved actions</h2><span class="count" id="actionMode">Locked</span></div>
          <div class="ops-body action-panel">
            <form class="diag-form" id="actionForm">
              <div class="field"><label for="actionOrderId">Order ID</label><input id="actionOrderId" name="orderId" placeholder="canonical order uuid" /></div>
              <div class="field"><label for="actionStatus">Status</label><select id="actionStatus" name="status"><option value="confirmed">confirmed</option><option value="processing">processing</option><option value="shipped">shipped</option><option value="delivered">delivered</option><option value="cancelled">cancelled</option></select></div>
              <div class="field"><label for="actionReason">Reason code</label><input id="actionReason" name="reasonCode" placeholder="CUSTOMER_REQUEST" /></div>
              <div class="field"><label for="actionApprovedBy">Approved by</label><input id="actionApprovedBy" name="approvedBy" placeholder="Auth actor or approver" /></div>
              <div class="checks wide" aria-label="Side-effect acknowledgements">
                <label class="check"><input type="checkbox" name="payment" />Payment</label>
                <label class="check"><input type="checkbox" name="warehouse" />Warehouse</label>
                <label class="check"><input type="checkbox" name="notification" />Notify</label>
                <label class="check"><input type="checkbox" name="crm" />CRM</label>
                <label class="check"><input type="checkbox" name="channel" />Channel</label>
              </div>
              <button class="btn primary" type="submit" id="runAction" disabled>Read-only mode</button>
            </form>
            <div class="diag-result" id="actionResult"><div class="muted">Default admin mode is read-only. Action-capable roles can run approved lifecycle workflows.</div></div>
          </div>
        </section>
        <div class="metrics">
          <div class="metric"><span>Total</span><strong id="mTotal">-</strong></div>
          <div class="metric"><span>Matching</span><strong id="mMatching">-</strong></div>
          <div class="metric"><span>Open</span><strong id="mOpen">-</strong></div>
          <div class="metric"><span>Shipped</span><strong id="mShipped">-</strong></div>
          <div class="metric"><span>Visible value</span><strong id="mValue">-</strong></div>
        </div>
        <form class="toolbar" id="filters">
          <div class="field"><label for="search">Search</label><input id="search" name="search" placeholder="Order, external id, channel, account" /></div>
          <div class="field"><label for="application">Application</label><select id="application" name="application"><option value="">All</option></select></div>
          <div class="field"><label for="service">Service</label><select id="service" name="service"><option value="">All</option></select></div>
          <div class="field"><label for="state">State</label><select id="state" name="state"><option value="">All</option></select></div>
          <div class="field"><label for="from">From</label><input id="from" name="from" type="date" /></div>
          <div class="field"><label for="to">To</label><input id="to" name="to" type="date" /></div>
          <button class="btn primary" type="submit">Apply</button>
          <button class="btn" type="button" id="reset">Reset</button>
        </form>
        <div class="layout">
          <section class="panel">
            <div class="panel-head"><h2>Orders</h2><span class="count" id="resultCount">Locked</span></div>
            <div class="table-wrap"><table><thead><tr><th>Order</th><th>Source</th><th>Customer</th><th>Total</th><th>State</th><th>Updated</th><th>Signals</th></tr></thead><tbody id="orders"></tbody></table></div>
          </section>
          <aside class="panel detail">
            <div class="panel-head"><h2>Order details</h2><span class="count" id="detailState">Locked</span></div>
            <div class="detail-body" id="detail"><div class="locked"><div><strong>Protected admin data</strong>Load with an authorized token to inspect details, source metadata, items, shipments, timelines, and safe lifecycle logs.</div></div></div>
          </aside>
        </div>
      </section>
    </main>
  </div>
  <script>
    const state = { orders: [], selectedId: null };
    const AUTH_BASE = 'https://auth.alfares.cz';
    const AUTH_CLIENT_ID = 'orders-microservice';
    const AUTH_STATE_KEY = 'orders_admin_auth_state';
    const ADMIN_TOKEN_KEY = 'ordersAdminToken';
    const money = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });
    const dateFmt = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' });
    const el = (id) => document.getElementById(id);

    el('signInAuth').addEventListener('click', () => { window.location.href = hostedAuthUrl('/login'); });
    el('clearToken').addEventListener('click', () => {
      clearSession();
      state.orders = [];
      state.selectedId = null;
      renderMetrics({});
      renderOrders();
      setError('');
      setLocked(true);
      renderOperations(null);
      renderDiagnostics(null);
      renderActionCatalog(null);
      renderActionResult(null);
      el('detailState').textContent = 'Locked';
      el('detail').innerHTML = '<div class="locked"><div><strong>Protected admin data</strong>Load with an authorized token to inspect details, source metadata, items, shipments, timelines, and safe lifecycle logs.</div></div>';
    });
    el('filters').addEventListener('submit', (event) => { event.preventDefault(); loadDashboard(); });
    el('reset').addEventListener('click', () => { el('filters').reset(); loadDashboard(); });
    el('diagForm').addEventListener('submit', (event) => { event.preventDefault(); loadDiagnostics(); });
    el('actionForm').addEventListener('submit', (event) => { event.preventDefault(); runApprovedAction(); });

    function randomState() {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
      return 'orders-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    }

    function hostedAuthUrl(path) {
      const nonce = randomState();
      sessionStorage.setItem(AUTH_STATE_KEY, nonce);
      const returnUrl = new URL('/admin/orders', window.location.origin);
      const url = new URL(path, AUTH_BASE);
      url.searchParams.set('client_id', AUTH_CLIENT_ID);
      url.searchParams.set('return_url', returnUrl.toString());
      url.searchParams.set('state', nonce);
      url.searchParams.set('lang', 'cs');
      return url.toString();
    }

    function consumeHostedAuthFragment() {
      if (!window.location.hash || !window.location.hash.includes('access_token=')) return 'none';
      const params = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = params.get('access_token') || '';
      const returnedState = params.get('state') || '';
      const expectedState = sessionStorage.getItem(AUTH_STATE_KEY) || '';
      const cleanUrl = window.location.pathname + window.location.search;

      if (!accessToken || !expectedState || returnedState !== expectedState) {
        sessionStorage.removeItem(AUTH_STATE_KEY);
        window.history.replaceState(null, document.title, cleanUrl);
        return 'rejected';
      }

      sessionStorage.setItem(ADMIN_TOKEN_KEY, accessToken);
      sessionStorage.removeItem(AUTH_STATE_KEY);
      window.history.replaceState(null, document.title, cleanUrl);
      return 'accepted';
    }

    function clearSession() {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_STATE_KEY);
    }

    function authHeaders() {
      const token = sessionStorage.getItem(ADMIN_TOKEN_KEY) || '';
      return token ? { Authorization: 'Bearer ' + token } : {};
    }

    async function api(path, options = {}) {
      const response = await fetch(path, {
        ...options,
        headers: {
          ...authHeaders(),
          ...(options.headers || {}),
        },
      });
      if (!response.ok) {
        throw new Error(response.status === 401 || response.status === 403 ? 'Admin token is missing, expired, or lacks the Orders admin role.' : 'Request failed with status ' + response.status);
      }
      return response.json();
    }

    async function loadDashboard() {
      setError('');
      const token = sessionStorage.getItem(ADMIN_TOKEN_KEY) || '';
      if (!token) {
        setLocked(true);
        setError('Sign in with an authorized Auth account before loading order data.');
        return;
      }
      const params = new URLSearchParams(new FormData(el('filters')));
      params.set('limit', '150');
      try {
        const data = await api('/api/admin/orders/dashboard?' + params.toString());
        setLocked(false);
        state.orders = data.orders || [];
        renderMetrics(data.metrics || {});
        renderFilterOptions(data.filters || {});
        renderOrders();
        loadOperations();
        loadActionCatalog();
      } catch (error) {
        setLocked(true);
        setError(error.message);
      }
    }

    async function loadOperations() {
      try {
        const data = await api('/api/admin/operations/overview');
        renderOperations(data);
      } catch (error) {
        setError(error.message);
        renderOperations(null);
      }
    }

    async function loadDiagnostics() {
      setError('');
      const params = new URLSearchParams(new FormData(el('diagForm')));
      params.set('contractVersion', 'orders.create.v1');
      try {
        const data = await api('/api/admin/operations/idempotency?' + params.toString());
        renderDiagnostics(data);
      } catch (error) {
        setError(error.message);
        renderDiagnostics(null);
      }
    }

    async function loadActionCatalog() {
      try {
        const data = await api('/api/admin/operations/actions');
        renderActionCatalog(data);
      } catch (error) {
        renderActionCatalog(null);
      }
    }

    async function runApprovedAction() {
      setError('');
      const form = new FormData(el('actionForm'));
      const body = {
        orderId: String(form.get('orderId') || '').trim(),
        status: String(form.get('status') || '').trim(),
        approval: {
          approved: true,
          approvalType: 'human',
          approvedBy: String(form.get('approvedBy') || '').trim(),
          reasonCode: String(form.get('reasonCode') || '').trim(),
          sideEffectsHandled: {
            payment: form.get('payment') === 'on',
            warehouse: form.get('warehouse') === 'on',
            notification: form.get('notification') === 'on',
            crm: form.get('crm') === 'on',
            channel: form.get('channel') === 'on',
          },
        },
      };
      try {
        const data = await api('/api/admin/operations/actions/order-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        renderActionResult(data);
        loadDashboard();
      } catch (error) {
        setError(error.message);
      }
    }

    function renderMetrics(metrics) {
      el('mTotal').textContent = metrics.totalOrders ?? '-';
      el('mMatching').textContent = metrics.matchingOrders ?? '-';
      el('mOpen').textContent = metrics.openOrders ?? '-';
      el('mShipped').textContent = metrics.shippedOrders ?? '-';
      el('mValue').textContent = metrics.totalVisibleValue === undefined ? '-' : money.format(metrics.totalVisibleValue || 0);
    }

    function renderFilterOptions(filters) {
      fillSelect('application', filters.applications || []);
      fillSelect('service', filters.services || []);
      fillSelect('state', filters.states || []);
    }

    function renderOperations(data) {
      el('opsMode').textContent = data ? (data.mode.readOnly ? 'Read-only' : 'Actions enabled') : 'Locked';
      const lifecycle = data?.lifecycle || {};
      el('oOpen').textContent = lifecycle.openOrders ?? '-';
      el('oStale').textContent = lifecycle.staleOpenOrders ?? '-';
      el('oPaid').textContent = lifecycle.paidOrders ?? '-';
      el('oShipments').textContent = lifecycle.shipmentRecords ?? '-';
      el('oHandoffs').textContent = lifecycle.warehouseHandoffs ?? '-';
      el('integrations').innerHTML = data ? (data.integrations || []).map((item) => '<div class="system"><div class="system-row"><strong>' + escapeHtml(item.name) + '</strong><span class="pill">' + escapeHtml(item.status) + '</span></div><span>' + escapeHtml(item.owner) + '</span><span>' + escapeHtml(item.signal) + '</span><span>' + escapeHtml(item.evidence) + '</span></div>').join('') : '<div class="locked"><div><strong>Protected operations data</strong>Load with an authorized token to inspect read-only integration health.</div></div>';
    }

    function renderDiagnostics(data) {
      el('diagState').textContent = data ? data.outcome : 'Locked';
      if (!data) {
        el('diagResult').innerHTML = '<div class="muted">Query a channel and external order ID after loading admin data.</div>';
        return;
      }
      el('diagResult').innerHTML = '<div class="event"><strong>' + escapeHtml(data.outcome) + '</strong><span class="muted">' + escapeHtml(data.contractVersion) + '</span><span>' + escapeHtml(data.guidance) + '</span></div>' +
        (data.matches || []).map((order) => '<div class="item"><strong class="mono">' + shortId(order.id) + '</strong><span class="muted">' + escapeHtml(order.source.channel) + ' / ' + escapeHtml(order.source.accountId || 'default') + '</span><span>' + escapeHtml(order.state) + ' - ' + formatDate(order.updatedAt || order.createdAt) + '</span></div>').join('');
    }

    function renderActionCatalog(data) {
      const canRun = Boolean(data?.mode?.canRunActions);
      el('actionMode').textContent = data ? data.mode.name : 'Locked';
      el('runAction').disabled = !canRun;
      el('runAction').textContent = canRun ? 'Run approved action' : 'Read-only mode';
      el('actionResult').innerHTML = data ? '<div class="event"><strong>' + escapeHtml(data.mode.name) + '</strong><span>' + escapeHtml(data.mode.actionPolicy) + '</span></div>' : '<div class="muted">Default admin mode is read-only. Action-capable roles can run approved lifecycle workflows.</div>';
    }

    function renderActionResult(data) {
      if (!data) return;
      el('actionResult').innerHTML = '<div class="event"><strong>' + escapeHtml(data.action.workflow) + '</strong><span class="muted">' + escapeHtml(data.action.resourceId) + '</span><span>' + escapeHtml(data.action.requestedStatus) + ' -> ' + escapeHtml(data.action.resultingStatus) + '</span></div>';
    }

    function fillSelect(id, values) {
      const select = el(id);
      const current = select.value;
      select.innerHTML = '<option value="">All</option>' + values.map((value) => '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>').join('');
      select.value = values.includes(current) ? current : '';
    }

    function renderOrders() {
      const tbody = el('orders');
      el('resultCount').textContent = state.orders.length ? state.orders.length + ' visible' : 'No loaded data';
      tbody.innerHTML = state.orders.map((order) => '<tr class="' + (order.id === state.selectedId ? 'selected' : '') + '" data-id="' + order.id + '">' +
        '<td><div class="stack"><strong class="mono">' + shortId(order.id) + '</strong><span class="muted mono">' + escapeHtml(order.externalOrderId || 'no external id') + '</span></div></td>' +
        '<td><div class="stack"><strong>' + escapeHtml(order.source.application) + '</strong><span class="muted">' + escapeHtml(order.source.service) + '</span></div></td>' +
        '<td>' + escapeHtml(order.customerLabel) + '</td>' +
        '<td><strong>' + money.format(order.total || 0) + '</strong><div class="muted">' + escapeHtml(order.currency || 'CZK') + '</div></td>' +
        '<td><span class="pill ' + escapeHtml(order.state) + '">' + escapeHtml(order.state) + '</span></td>' +
        '<td>' + formatDate(order.updatedAt || order.createdAt) + '</td>' +
        '<td>' + (order.logIndicators || []).map((signal) => '<span class="pill">' + escapeHtml(signal) + '</span>').join(' ') + '</td>' +
      '</tr>').join('');
      tbody.querySelectorAll('tr').forEach((row) => row.addEventListener('click', () => loadDetail(row.dataset.id)));
    }

    async function loadDetail(id) {
      state.selectedId = id;
      renderOrders();
      el('detailState').textContent = 'Loading';
      try {
        const data = await api('/api/admin/orders/' + id);
        renderDetail(data);
      } catch (error) {
        setError(error.message);
        el('detailState').textContent = 'Unavailable';
      }
    }

    function renderDetail(data) {
      el('detailState').textContent = data.summary.state;
      el('detail').innerHTML = section('Summary', kv([
        ['Order', shortId(data.summary.id)],
        ['External', data.summary.externalOrderId || 'None'],
        ['Application', data.source.application],
        ['Service', data.source.service],
        ['Channel', data.source.channel],
        ['Account', data.source.accountId || 'None'],
        ['Customer', data.customer.name],
        ['Email', data.customer.email || 'None'],
        ['Total', money.format(data.totals.total || 0)],
        ['Payment', data.payment.status + ' / ' + data.payment.method],
      ])) +
      section('Items', '<div class="items">' + (data.items || []).map((item) => '<div class="item"><strong>' + escapeHtml(item.title) + '</strong><span class="muted">SKU ' + escapeHtml(item.sku || 'n/a') + ' - Qty ' + item.quantity + ' - ' + escapeHtml(item.fulfillmentStatus) + '</span><span>' + money.format(item.totalPrice || 0) + '</span></div>').join('') + '</div>') +
      section('Shipments', '<div class="items">' + ((data.shipping.shipments || []).length ? data.shipping.shipments.map((shipment) => '<div class="item"><strong>' + escapeHtml(shipment.carrier) + '</strong><span class="muted">' + escapeHtml(shipment.status) + (shipment.trackingNumber ? ' - ' + escapeHtml(shipment.trackingNumber) : '') + '</span></div>').join('') : '<div class="muted">No shipment records linked.</div>') + '</div>') +
      section('Timeline', '<div class="timeline">' + (data.timeline || []).map((event) => '<div class="event"><strong>' + escapeHtml(event.label) + '</strong><span class="muted">' + formatDate(event.at) + '</span><span>' + escapeHtml(event.detail || '') + '</span></div>').join('') + '</div>') +
      section('Safe logs', '<div class="logs">' + (data.logs || []).map((log) => '<div class="log"><strong>' + escapeHtml(log.message) + '</strong><span class="muted">' + formatDate(log.at) + ' - ' + escapeHtml(log.source) + ' - ' + escapeHtml(log.level) + '</span><span>' + escapeHtml(log.context || '') + '</span></div>').join('') + '</div>');
    }

    function section(title, body) { return '<section class="section"><h3>' + title + '</h3>' + body + '</section>'; }
    function kv(rows) { return rows.map((row) => '<div class="kv"><span>' + escapeHtml(row[0]) + '</span><strong>' + escapeHtml(row[1]) + '</strong></div>').join(''); }
    function setError(message) { el('error').textContent = message; el('error').classList.toggle('visible', Boolean(message)); }
    function setLocked(isLocked) { el('locked').classList.toggle('visible', isLocked); }
    function shortId(id) { return String(id || '').slice(0, 8); }
    function formatDate(value) { if (!value) return '-'; const date = new Date(value); return Number.isNaN(date.valueOf()) ? '-' : dateFmt.format(date); }
    function escapeHtml(value) { return String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char])); }

    renderMetrics({});
    renderOrders();
    const authFragmentState = consumeHostedAuthFragment();
    if (authFragmentState === 'rejected') {
      setLocked(true);
      setError('Auth sign-in could not be verified. Please start sign-in again.');
    } else if (authFragmentState === 'accepted' || sessionStorage.getItem(ADMIN_TOKEN_KEY)) {
      loadDashboard();
    }
  </script>
</body>
</html>`;
