#!/usr/bin/env python3
import json
from pathlib import Path
root=Path.cwd()
decision="[RESOLVED/NARROWED: W5 Aukro/Heureka current gate is service-scoped API/DOM proven for central Orders lifecycle rendering; natural human-session or natural real customer-bound proof remains optional/product-gated if product requires proof beyond approved service-scoped/bounded evidence]"
def read(p):
    q=root/p
    assert q.exists(), f"missing {p}"
    return q.read_text()
def j(p):
    return json.loads(read(p))
def inc(text, marker):
    assert marker in text, marker
report=read(Path("reports/validation/VAL-W5-aukro-heureka-current-gate-2026-07-06.md"))
for m in ["Vision ->","Goal Impact ->","System ->","Feature ->","Task ->","Execution Plan ->","Coding Prompt ->","Code ->","Validation ->",decision,"natural real customer-bound Aukro order proof","direct Heureka human-session proof","external Heureka shop registration details"]:
    inc(report,m)
contract=read(Path("docs/orchestrator/2026-07-05-runtime-gate-packet-contracts.md"))
inc(contract,decision)
inc(contract,"W5 Aukro/Heureka Runtime Packet Reconciliation")
verifier=read(Path("scripts/verify-channel-lifecycle-runtime-evidence.js"))
for m in ["protected_customer_admin_lifecycle_api_proven_dom_optional","live_create_replay_reservation_cleanup_proven_orders_list_non_stale_lifecycle_proven","Heureka visible DOM lifecycle proof is service-scoped and proven","Aukro customer and admin visible DOM lifecycle proof is service-scoped and proven"]:
    inc(verifier,m)
ha=j(Path("reports/validation/orders-browser-render-proof/heureka-rendered-proof-live-proven.json"))
assert ha["channel"]=="heureka" and ha["httpStatus"]==200 and ha["dashboardOrdersList"]["nonStaleSample"][0]["lifecycleStage"]=="cancelled"
assert ha["policy"]["tokenValuesPrinted"] is False and ha["policy"]["rawOrderRowsPrinted"] is False and ha["policy"]["customerPiiPrinted"] is False and ha["policy"]["providerCall"] is False
hd=j(Path("reports/validation/orders-browser-render-proof/heureka-dashboard-dom-runtime-proven-artifact.json"))
assert hd["channel"]=="heureka" and hd["documentStatus"]==200 and hd["renderedLifecycleStage"]=="cancelled" and hd["rawDomCaptured"] is False
ak=j(Path("reports/validation/orders-browser-render-proof/aukro-protected-lifecycle-live-proven.json"))
assert ak["channel"]=="aukro" and ak["runtime"]["customerDashboardHttpStatus"]==200 and ak["customerCabinetEvidence"]["nonStaleSample"]["statusSource"]=="orders"
assert ak["evidencePolicy"]["tokenPrinted"] is False and ak["evidencePolicy"]["rawOrdersPrinted"] is False and ak["evidencePolicy"]["customerPrinted"] is False
ad=j(Path("reports/validation/orders-browser-render-proof/aukro-dashboard-customer-admin-dom-proven-artifact.json"))
assert ad["channel"]=="aukro" and ad["visibleLifecycleCancelled"] is True and ad["adminLifecycleVisible"] is True
assert ad["boundedFixture"]["ordersMutation"] is False and ad["boundedFixture"]["warehouseMutation"] is False and ad["boundedFixture"]["providerCall"] is False and ad["boundedFixture"]["localAukroRowDeleted"] is True
sup=j(Path("reports/validation/orders-browser-render-proof/aukro-approved-auth-bearer-zero-orders-supplement.json"))
assert sup["channel"]=="aukro" and sup["canonicalAukroDomProofSupersedesThisForVisibleLabels"] is True and sup["tokenValuesPrinted"] is False
for forbidden in ["natural_human_session_proven","real_customer_bound_proven","provider-backed proof complete","rawOrderId=","Bearer "]:
    assert forbidden not in report
print(json.dumps({"ok":True,"verifier":"orders-w5-aukro-heureka-current-gate.v1","aukro":"service_scoped_api_dom_proven_natural_real_customer_optional","heureka":"service_scoped_api_dom_proven_direct_human_session_optional","mutation":False,"providerCall":False,"deploy":False,"sensitiveOutput":"redacted-source-only"}, indent=2))
