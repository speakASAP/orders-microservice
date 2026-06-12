export const ADMIN_ORDERS_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Orders Admin</title>
  <style>
    :root {
      --bg: #f5f7fb;
      --surface: #ffffff;
      --surface-2: #f8fafc;
      --text: #111827;
      --muted: #64748b;
      --line: #d9e1ec;
      --accent: #0f766e;
      --accent-2: #3730a3;
      --danger: #b42318;
      --warn: #b45309;
      --ok: #047857;
      --shadow: 0 18px 45px rgba(15, 23, 42, .08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background: var(--bg);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }
    button, input, select { font: inherit; }
    .shell { display: grid; grid-template-columns: 232px minmax(0, 1fr); min-height: 100vh; }
    .sidebar { background: #0f172a; color: #dbeafe; padding: 20px 14px; display: flex; flex-direction: column; gap: 22px; }
    .brand { display: flex; align-items: center; gap: 10px; padding: 0 8px; font-weight: 800; color: #fff; }
    .brand-mark { width: 32px; height: 32px; border-radius: 8px; background: #14b8a6; display: grid; place-items: center; color: #052e2b; font-weight: 900; }
    .nav { display: grid; gap: 6px; }
    .nav a { color: #b6c4d8; text-decoration: none; display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; font-size: 14px; }
    .nav a.active { background: rgba(20,184,166,.16); color: #fff; }
    .nav svg { width: 17px; height: 17px; }
    .main { min-width: 0; display: flex; flex-direction: column; }
    .topbar { height: 66px; background: var(--surface); border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; padding: 0 24px; gap: 16px; }
    .title h1 { margin: 0; font-size: 20px; line-height: 1.2; }
    .title p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
    .token-box { display: flex; align-items: center; gap: 8px; min-width: 360px; }
    .token-box input { width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 9px 11px; background: var(--surface-2); font-size: 13px; }
    .content { padding: 20px 24px 24px; display: grid; gap: 16px; }
    .metrics { display: grid; grid-template-columns: repeat(5, minmax(130px, 1fr)); gap: 12px; }
    .metric { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 13px 14px; }
    .metric span { color: var(--muted); font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 7px; font-size: 22px; }
    .toolbar { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 12px; display: grid; grid-template-columns: 1.3fr repeat(5, minmax(130px, 1fr)) auto auto; gap: 10px; align-items: end; }
    .field { display: grid; gap: 5px; min-width: 0; }
    label { color: var(--muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    input, select { border: 1px solid var(--line); border-radius: 8px; padding: 9px 10px; min-width: 0; background: #fff; color: var(--text); font-size: 13px; }
    .btn { border: 1px solid var(--line); background: #fff; border-radius: 8px; height: 37px; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; color: var(--text); font-weight: 700; font-size: 13px; }
    .btn.primary { border-color: var(--accent); background: var(--accent); color: white; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 16px; align-items: start; }
    .panel { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; box-shadow: var(--shadow); min-width: 0; overflow: hidden; }
    .panel-head { height: 48px; padding: 0 14px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; }
    .panel-head h2 { font-size: 14px; margin: 0; }
    .count { color: var(--muted); font-size: 12px; }
    .table-wrap { overflow: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 980px; }
    th { text-align: left; color: var(--muted); font-size: 11px; text-transform: uppercase; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid var(--line); white-space: nowrap; }
    td { padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 13px; vertical-align: middle; }
    tr { cursor: pointer; }
    tr:hover, tr.selected { background: #f0fdfa; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; }
    .muted { color: var(--muted); }
    .stack { display: grid; gap: 3px; }
    .pill { display: inline-flex; width: fit-content; align-items: center; border-radius: 999px; padding: 3px 8px; font-size: 12px; font-weight: 800; border: 1px solid var(--line); color: #334155; background: #f8fafc; }
    .pill.pending, .pill.confirmed, .pill.processing { color: var(--warn); background: #fffbeb; border-color: #fde68a; }
    .pill.shipped { color: var(--accent-2); background: #eef2ff; border-color: #c7d2fe; }
    .pill.delivered { color: var(--ok); background: #ecfdf5; border-color: #a7f3d0; }
    .pill.cancelled { color: var(--danger); background: #fef2f2; border-color: #fecaca; }
    .detail { position: sticky; top: 16px; max-height: calc(100vh - 106px); overflow: auto; }
    .detail-body { padding: 14px; display: grid; gap: 16px; }
    .empty { min-height: 360px; display: grid; place-items: center; color: var(--muted); text-align: center; padding: 30px; }
    .section { display: grid; gap: 9px; }
    .section h3 { margin: 0; font-size: 13px; }
    .kv { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 8px; font-size: 13px; }
    .kv span:first-child { color: var(--muted); }
    .timeline, .logs, .items { display: grid; gap: 8px; }
    .event, .log, .item { border: 1px solid var(--line); background: var(--surface-2); border-radius: 8px; padding: 10px; display: grid; gap: 4px; font-size: 13px; }
    .event strong, .log strong, .item strong { font-size: 13px; }
    .error { color: var(--danger); background: #fef2f2; border: 1px solid #fecaca; padding: 10px 12px; border-radius: 8px; display: none; }
    .error.visible { display: block; }
    @media (max-width: 1180px) { .shell { grid-template-columns: 72px minmax(0, 1fr); } .brand span, .nav span { display: none; } .metrics { grid-template-columns: repeat(2, 1fr); } .toolbar { grid-template-columns: repeat(2, minmax(0, 1fr)); } .layout { grid-template-columns: 1fr; } .detail { position: static; max-height: none; } .token-box { min-width: 260px; } }
    @media (max-width: 720px) { .topbar { height: auto; padding: 14px; align-items: stretch; flex-direction: column; } .content { padding: 14px; } .metrics, .toolbar { grid-template-columns: 1fr; } .token-box { min-width: 0; } }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">O</div><span>Orders Admin</span></div>
      <nav class="nav" aria-label="Admin navigation">
        <a class="active" href="/admin/orders"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span>Orders</span></a>
        <a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5M4 19h16M8 16V9M13 16V7M18 16v-5"/></svg><span>Analytics</span></a>
        <a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg><span>Lifecycle</span></a>
      </nav>
    </aside>
    <main class="main">
      <header class="topbar">
        <div class="title"><h1>Orders dashboard</h1><p>Canonical order visibility across source applications and services.</p></div>
        <div class="token-box"><input id="token" type="password" placeholder="Admin bearer token for API data" autocomplete="off" /><button class="btn primary" id="saveToken">Use token</button></div>
      </header>
      <section class="content">
        <div id="error" class="error"></div>
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
            <div class="panel-head"><h2>Orders</h2><span class="count" id="resultCount">No data</span></div>
            <div class="table-wrap"><table><thead><tr><th>Order</th><th>Source</th><th>Customer</th><th>Total</th><th>State</th><th>Updated</th><th>Signals</th></tr></thead><tbody id="orders"></tbody></table></div>
          </section>
          <aside class="panel detail">
            <div class="panel-head"><h2>Order details</h2><span class="count" id="detailState">Select an order</span></div>
            <div class="detail-body" id="detail"><div class="empty">Choose an order row to inspect details, source metadata, items, shipments, timeline, and safe lifecycle logs.</div></div>
          </aside>
        </div>
      </section>
    </main>
  </div>
  <script>
    const state = { orders: [], selectedId: null };
    const money = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });
    const dateFmt = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' });
    const el = (id) => document.getElementById(id);
    const tokenInput = el('token');
    tokenInput.value = sessionStorage.getItem('ordersAdminToken') || '';

    el('saveToken').addEventListener('click', () => {
      sessionStorage.setItem('ordersAdminToken', tokenInput.value.trim());
      loadDashboard();
    });
    el('filters').addEventListener('submit', (event) => { event.preventDefault(); loadDashboard(); });
    el('reset').addEventListener('click', () => { el('filters').reset(); loadDashboard(); });

    function authHeaders() {
      const token = tokenInput.value.trim() || sessionStorage.getItem('ordersAdminToken') || '';
      return token ? { Authorization: 'Bearer ' + token } : {};
    }

    async function api(path) {
      const response = await fetch(path, { headers: authHeaders() });
      if (!response.ok) throw new Error(response.status === 401 ? 'Admin token is missing or invalid.' : 'Request failed with status ' + response.status);
      return response.json();
    }

    async function loadDashboard() {
      setError('');
      const params = new URLSearchParams(new FormData(el('filters')));
      params.set('limit', '150');
      try {
        const data = await api('/api/admin/orders/dashboard?' + params.toString());
        state.orders = data.orders || [];
        renderMetrics(data.metrics || {});
        renderFilterOptions(data.filters || {});
        renderOrders();
      } catch (error) {
        setError(error.message);
      }
    }

    function renderMetrics(metrics) {
      el('mTotal').textContent = metrics.totalOrders ?? '-';
      el('mMatching').textContent = metrics.matchingOrders ?? '-';
      el('mOpen').textContent = metrics.openOrders ?? '-';
      el('mShipped').textContent = metrics.shippedOrders ?? '-';
      el('mValue').textContent = money.format(metrics.totalVisibleValue || 0);
    }

    function renderFilterOptions(filters) {
      fillSelect('application', filters.applications || []);
      fillSelect('service', filters.services || []);
      fillSelect('state', filters.states || []);
    }

    function fillSelect(id, values) {
      const select = el(id);
      const current = select.value;
      select.innerHTML = '<option value="">All</option>' + values.map((value) => '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>').join('');
      select.value = values.includes(current) ? current : '';
    }

    function renderOrders() {
      const tbody = el('orders');
      el('resultCount').textContent = state.orders.length + ' visible';
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
      section('Items', '<div class="items">' + (data.items || []).map((item) => '<div class="item"><strong>' + escapeHtml(item.title) + '</strong><span class="muted">SKU ' + escapeHtml(item.sku || 'n/a') + ' · Qty ' + item.quantity + ' · ' + escapeHtml(item.fulfillmentStatus) + '</span><span>' + money.format(item.totalPrice || 0) + '</span></div>').join('') + '</div>') +
      section('Shipments', '<div class="items">' + ((data.shipping.shipments || []).length ? data.shipping.shipments.map((shipment) => '<div class="item"><strong>' + escapeHtml(shipment.carrier) + '</strong><span class="muted">' + escapeHtml(shipment.status) + (shipment.trackingNumber ? ' · ' + escapeHtml(shipment.trackingNumber) : '') + '</span></div>').join('') : '<div class="muted">No shipment records linked.</div>') + '</div>') +
      section('Timeline', '<div class="timeline">' + (data.timeline || []).map((event) => '<div class="event"><strong>' + escapeHtml(event.label) + '</strong><span class="muted">' + formatDate(event.at) + '</span><span>' + escapeHtml(event.detail || '') + '</span></div>').join('') + '</div>') +
      section('Safe logs', '<div class="logs">' + (data.logs || []).map((log) => '<div class="log"><strong>' + escapeHtml(log.message) + '</strong><span class="muted">' + formatDate(log.at) + ' · ' + escapeHtml(log.source) + ' · ' + escapeHtml(log.level) + '</span><span>' + escapeHtml(log.context || '') + '</span></div>').join('') + '</div>');
    }

    function section(title, body) { return '<section class="section"><h3>' + title + '</h3>' + body + '</section>'; }
    function kv(rows) { return rows.map((row) => '<div class="kv"><span>' + escapeHtml(row[0]) + '</span><strong>' + escapeHtml(row[1]) + '</strong></div>').join(''); }
    function setError(message) { el('error').textContent = message; el('error').classList.toggle('visible', Boolean(message)); }
    function shortId(id) { return String(id || '').slice(0, 8); }
    function formatDate(value) { if (!value) return '-'; const date = new Date(value); return Number.isNaN(date.valueOf()) ? '-' : dateFmt.format(date); }
    function escapeHtml(value) { return String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char])); }

    loadDashboard();
  </script>
</body>
</html>`;
