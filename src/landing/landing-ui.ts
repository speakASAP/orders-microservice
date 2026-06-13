export const LANDING_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Orders Hub</title>
  <style>
    :root {
      --bg: #ffffff;
      --ink: #101828;
      --muted: #667085;
      --line: #d8dee8;
      --soft: #f6f8fb;
      --soft-2: #eef6f5;
      --teal: #0f766e;
      --teal-dark: #0b4f4a;
      --amber: #b7791f;
      --danger: #b42318;
      --shadow: 0 20px 50px rgba(16, 24, 40, .08);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }
    a { color: inherit; }
    .wrap { width: min(1160px, calc(100% - 40px)); margin: 0 auto; }
    .top {
      position: sticky;
      top: 0;
      z-index: 5;
      background: rgba(255,255,255,.92);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(216,222,232,.86);
    }
    .nav {
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; text-decoration: none; }
    .mark {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: var(--teal);
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 900;
    }
    .links { display: flex; align-items: center; gap: 22px; color: #344054; font-size: 14px; font-weight: 650; }
    .links a { text-decoration: none; }
    .actions { display: flex; align-items: center; gap: 10px; }
    .btn {
      min-height: 40px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 0 15px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 760;
      background: #fff;
      color: var(--ink);
    }
    .btn.primary { background: var(--teal); border-color: var(--teal); color: #fff; }
    .hero {
      min-height: calc(100vh - 72px);
      display: grid;
      align-items: center;
      padding: 56px 0 42px;
      border-bottom: 1px solid var(--line);
    }
    .hero-grid {
      display: grid;
      grid-template-columns: minmax(0, .92fr) minmax(460px, 1.08fr);
      gap: 44px;
      align-items: center;
    }
    h1 {
      margin: 0;
      max-width: 760px;
      font-size: clamp(44px, 6.2vw, 78px);
      line-height: .94;
      letter-spacing: 0;
    }
    .lead {
      margin: 26px 0 0;
      color: #475467;
      font-size: 19px;
      line-height: 1.55;
      max-width: 650px;
    }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
    .trust {
      margin-top: 30px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      max-width: 680px;
    }
    .trust-item { border-left: 3px solid var(--teal); padding-left: 12px; }
    .trust-item strong { display: block; font-size: 15px; }
    .trust-item span { display: block; margin-top: 4px; color: var(--muted); font-size: 13px; line-height: 1.42; }
    .system-map {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .map-head {
      height: 54px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      border-bottom: 1px solid var(--line);
      background: #fbfcfe;
    }
    .map-head strong { font-size: 14px; }
    .status { color: var(--teal-dark); font-size: 12px; font-weight: 800; }
    .map-body { padding: 18px; display: grid; gap: 15px; }
    .lane { display: grid; grid-template-columns: 1fr 58px 1fr 58px 1fr; align-items: center; gap: 8px; }
    .node {
      min-height: 78px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      background: var(--soft);
      display: grid;
      gap: 7px;
    }
    .node.core { background: var(--soft-2); border-color: #9dd5ce; }
    .node strong { font-size: 14px; }
    .node span { color: var(--muted); font-size: 12px; line-height: 1.35; }
    .arrow { height: 1px; background: #9aa4b2; position: relative; }
    .arrow:after {
      content: "";
      position: absolute;
      right: -1px;
      top: -4px;
      border-left: 8px solid #9aa4b2;
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
    }
    .mini-table { border-top: 1px solid var(--line); }
    .row { display: grid; grid-template-columns: 1.1fr .9fr .9fr; gap: 10px; padding: 11px 0; border-bottom: 1px solid #edf1f6; font-size: 13px; }
    .row span { color: var(--muted); }
    section.band { padding: 70px 0; border-bottom: 1px solid var(--line); }
    .section-head { display: grid; grid-template-columns: .86fr 1.14fr; gap: 40px; align-items: end; margin-bottom: 30px; }
    h2 { margin: 0; font-size: clamp(30px, 4vw, 48px); line-height: 1.05; }
    .section-head p { margin: 0; color: var(--muted); font-size: 17px; line-height: 1.55; }
    .benefits { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .benefit { border-top: 2px solid var(--teal); padding: 18px 2px 0; }
    .benefit h3 { margin: 0; font-size: 18px; }
    .benefit p { margin: 9px 0 0; color: var(--muted); line-height: 1.55; }
    .ecosystem {
      display: grid;
      grid-template-columns: .85fr 1.15fr;
      gap: 24px;
      align-items: start;
    }
    .rail { display: grid; gap: 10px; }
    .rail div, .contract div {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      background: #fff;
    }
    .rail strong, .contract strong { display: block; font-size: 14px; }
    .rail span, .contract span { display: block; margin-top: 5px; color: var(--muted); font-size: 13px; line-height: 1.45; }
    .contract {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      background: var(--soft);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
    }
    .footer { padding: 34px 0; color: var(--muted); font-size: 13px; }
    @media (max-width: 980px) {
      .links { display: none; }
      .hero { min-height: auto; }
      .hero-grid, .section-head, .ecosystem { grid-template-columns: 1fr; }
      .hero-grid { gap: 30px; }
      .trust, .benefits, .contract { grid-template-columns: 1fr; }
      .system-map { min-width: 0; }
    }
    @media (max-width: 660px) {
      .wrap { width: min(100% - 28px, 1160px); }
      .nav { height: auto; min-height: 66px; }
      .actions .btn { padding: 0 11px; font-size: 13px; }
      h1 { font-size: 43px; }
      .lead { font-size: 17px; }
      .lane { grid-template-columns: 1fr; }
      .arrow { height: 24px; width: 1px; margin-left: 18px; }
      .arrow:after { right: -4px; top: 18px; transform: rotate(90deg); }
      .row { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header class="top">
    <nav class="wrap nav" aria-label="Main navigation">
      <a class="brand" href="/"><span class="mark">O</span><span>Orders Hub</span></a>
      <div class="links">
        <a href="#benefits">Benefits</a>
        <a href="#ecosystem">Ecosystem</a>
        <a href="#reliability">Reliability</a>
        <a href="/admin/orders">Admin</a>
      </div>
      <div class="actions">
        <a class="btn" href="/admin/orders">Go to admin</a>
        <a class="btn primary" href="mailto:sales@alfares.cz?subject=Orders%20Hub%20registration">Register</a>
      </div>
    </nav>
  </header>
  <main>
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <h1>One order hub for every sales channel</h1>
          <p class="lead">Orders Hub gives every selling application one canonical order lifecycle: safe status transitions, fulfillment visibility, payment handoffs, stock coordination, and event signals for the rest of the ecosystem.</p>
          <div class="hero-actions">
            <a class="btn primary" href="mailto:sales@alfares.cz?subject=Orders%20Hub%20registration">Register</a>
            <a class="btn" href="/admin/orders">Go to admin</a>
          </div>
          <div class="trust">
            <div class="trust-item"><strong>Single order truth</strong><span>Channels create orders here instead of maintaining competing lifecycle records.</span></div>
            <div class="trust-item"><strong>Controlled changes</strong><span>Cancellations, refunds, and destructive corrections stay approval-aware.</span></div>
            <div class="trust-item"><strong>Service boundaries</strong><span>Catalog, Warehouse, Payments, Auth, Leads, and Notifications keep their ownership.</span></div>
          </div>
        </div>
        <div class="system-map" aria-label="Orders ecosystem workflow preview">
          <div class="map-head"><strong>Live ecosystem model</strong><span class="status">Auth-protected admin data</span></div>
          <div class="map-body">
            <div class="lane">
              <div class="node"><strong>Channels</strong><span>FlipFlop, marketplaces, Speak ASAP, Rentabox, Marathon, School Committee candidates</span></div>
              <div class="arrow"></div>
              <div class="node core"><strong>Orders Hub</strong><span>Contract version, external order id, lifecycle state, events, shipment links</span></div>
              <div class="arrow"></div>
              <div class="node"><strong>Operations</strong><span>Warehouse reservations, payment references, catalog product snapshots</span></div>
            </div>
            <div class="mini-table">
              <div class="row"><strong>Auth</strong><span>JWT roles</span><span>Admin visibility and API protection</span></div>
              <div class="row"><strong>Payments</strong><span>Provider identity</span><span>Orders stores references and status metadata</span></div>
              <div class="row"><strong>Leads & Marketing</strong><span>Read-only signals</span><span>Segmentation without owning order truth</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="band" id="benefits">
      <div class="wrap">
        <div class="section-head">
          <h2>What customers get from one order control plane</h2>
          <p>Teams can add channels and applications without rebuilding order handling every time. Orders Hub keeps the operational view consistent while letting specialized services do their own work.</p>
        </div>
        <div class="benefits">
          <div class="benefit"><h3>Fewer manual reconciliations</h3><p>External order IDs, source channels, items, totals, payments, and shipment records are visible in one operational surface.</p></div>
          <div class="benefit"><h3>Safer lifecycle operations</h3><p>Status transitions are bounded by the order state machine, with sensitive actions separated for explicit approval.</p></div>
          <div class="benefit"><h3>Faster ecosystem onboarding</h3><p>New services integrate through contracts, events, and role-scoped APIs instead of copying order logic.</p></div>
        </div>
      </div>
    </section>
    <section class="band" id="ecosystem">
      <div class="wrap ecosystem">
        <div>
          <h2>Designed for the full commerce ecosystem</h2>
          <p class="lead">Orders Hub coordinates with adjacent services without taking ownership away from them.</p>
        </div>
        <div class="contract">
          <div><strong>Catalog</strong><span>Product truth, SKUs, media, and channel readiness remain Catalog-owned.</span></div>
          <div><strong>Warehouse</strong><span>Stock, reservations, release, fulfillment, returns, and availability remain Warehouse-owned.</span></div>
          <div><strong>Payments</strong><span>Provider sessions, variable symbols, reconciliation, and refunds remain Payments-owned.</span></div>
          <div><strong>Auth</strong><span>Identity, login, JWT issuance, and role assignment remain Auth-owned.</span></div>
          <div><strong>Notifications</strong><span>Delivery infrastructure stays in Notifications; Orders emits or requests lifecycle messages.</span></div>
          <div><strong>Leads & Marketing</strong><span>CRM and campaigns consume safe order signals without becoming order truth.</span></div>
        </div>
      </div>
    </section>
    <section class="band" id="reliability">
      <div class="wrap">
        <div class="section-head">
          <h2>Built for traceable operations</h2>
          <p>Every future integration goal is planned with intent preservation, contract checks, sensitive-data review, role verification, build checks, and deployment evidence.</p>
        </div>
      </div>
    </section>
  </main>
  <footer class="wrap footer">Orders Hub is the public product surface for orders-microservice. Admin data requires Auth-issued roles for this application.</footer>
</body>
</html>`;
