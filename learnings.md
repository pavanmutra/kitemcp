# Learnings — Mistakes Log & Prevention Rules

> This file is READ at the start of EVERY session by all agents.
> When a new mistake is made → ADD IT HERE immediately.
> The goal: make each mistake exactly once.

---

## HOW TO USE THIS FILE

```
BEFORE any operation:
  1. Agent reads this entire file
  2. Checks if current action matches any ⛔ NEVER DO pattern
  3. If match found → STOP and follow the FIX instead
  4. After a new mistake → add entry at top of relevant section
```

---

## 🔴 CRITICAL MISTAKES (Caused Real Money Loss)

---

### ❌ MISTAKE C-001 — Buying Without Checking Intrinsic Value First
```
DATE     : [add date when it happened]
STOCK    : [add symbol]
WHAT HAPPENED:
  Saw a stock drop 10% intraday. Bought thinking it was a dip.
  It was not a dip — it was a deteriorating business.
  No intrinsic value check was done before entry.

LOSS     : [₹ amount]

ROOT CAUSE:
  Acted on price movement, not value.
  Emotion (FOMO on dip) overrode process.

⛔ NEVER DO:
  Buy any stock without running intrinsic-value-scanner first.
  A falling price is NOT the same as a discounted stock.

✅ FIX / RULE ADDED:
  Pre-order checklist item #8: MoS > 25% mandatory before any BUY.
  Graham Number + DCF must both be computed. Price alone means nothing.
```

---

### ❌ MISTAKE C-002 — No Stop-Loss GTT After Buying
```
DATE     : [add date]
STOCK    : [add symbol]
WHAT HAPPENED:
  Bought stock. Forgot to place GTT stop-loss immediately after fill.
  Stock fell 18% over next week. No automatic protection.
  Had to manually exit at a much bigger loss than planned.

LOSS     : [₹ amount]

ROOT CAUSE:
  Assumed "I'll place GTT later." Later never came.

⛔ NEVER DO:
  Leave any position open overnight without a GTT stop-loss.
  "I'll do it tomorrow" is how losses compound.

✅ FIX / RULE ADDED:
  order-executor checklist item #10:
  GTT stop-loss MUST be placed in same session as BUY fill.
  gtt-manager flags any holding without GTT as HIGH RISK ⚠️.
```

---

### ❌ MISTAKE C-003 — Averaging Down on a Fundamentally Broken Stock
```
DATE     : [add date]
STOCK    : [add symbol]
WHAT HAPPENED:
  Stock fell 20%. Averaged down thinking it was cheap.
  Earnings were declining for 3 consecutive quarters.
  Debt/Equity had risen above 2.5.
  Averaged down again. Stock fell another 30%.

LOSS     : [₹ amount]

ROOT CAUSE:
  Confused "lower price" with "better value."
  Did not check if fundamentals had deteriorated.

⛔ NEVER DO:
  Average down without re-running full intrinsic value analysis.
  If EPS is declining QoQ for 2+ quarters → DO NOT average down.
  If D/E > 2.0 → DO NOT average down.

✅ FIX / RULE ADDED:
  intrinsic-value-scanner now checks:
    [ ] EPS trend (flag if declining 2+ consecutive quarters)
    [ ] D/E ratio (block average-down if > 2.0)
  Averaging down requires same MoS > 25% check as fresh buy.
```

---

### ❌ MISTAKE C-004 — Ignoring Sector Headwinds, Buying on Discount Alone
```
DATE     : [add date]
STOCK    : [add symbol]
WHAT HAPPENED:
  Stock showed MoS of 45%. Looked like a screaming buy.
  Did not check: entire sector was under regulatory pressure.
  Multiple stocks in sector fell together. "Cheap" got cheaper.

LOSS     : [₹ amount]

ROOT CAUSE:
  Treated intrinsic value as the only signal.
  Did not layer in macro/sector context.

⛔ NEVER DO:
  Buy solely on MoS without checking sector sentiment.
  A 45% discount in a collapsing sector is a value trap.

✅ FIX / RULE ADDED:
  Daily report Section 7 now includes sector headwind check.
  Before any buy, note: Is the sector in a downtrend? (Y/N)
  If Y → reduce position size by 50% even if MoS > 40%.
```

---

## 🟡 PROCESS MISTAKES (Caused Confusion / Near Misses)

---

### ❌ MISTAKE P-013 — Skipped Updating Agents/Learnings/Gates After Changes
```
DATE     : 2026-04-01
WHAT HAPPENED:
  Made process changes during a session but did not update AGENTS.md,
  learnings.md, and gate/checklist rules in the same session.
  This caused drift between actual workflow and documented workflow.

ROOT CAUSE:
  Treated documentation updates as optional instead of mandatory.

⛔ NEVER DO:
  Apply workflow or rule changes without updating AGENTS.md,
  learnings.md, and gate/checklist references immediately.

✅ FIX / RULE ADDED:
  Every session change must update:
   - AGENTS.md (checklists/gates)
   - learnings.md (rule registry + master rules)
   - Any affected prompt/gate definitions
  If new source/fallback works, record it in AGENTS.md and learnings.md.
```

### ❌ MISTAKE P-001 — GTT Trigger Price Gone Stale
```
DATE     : [add date]
WHAT HAPPENED:
  Placed GTT stop-loss when stock was at ₹500. Trigger set at ₹440.
  Over 3 months, stock rose to ₹800.
  Stop-loss was still at ₹440 — effectively useless protection.
  Stock corrected to ₹600. GTT never triggered. Rode it back down.

ROOT CAUSE:
  GTTs were placed and never reviewed again.

⛔ NEVER DO:
  Set GTT and forget it. Prices move. Triggers must move with them.

✅ FIX / RULE ADDED:
  gtt-manager checklist: flag any GTT not reviewed in > 30 days.
  Trailing stop rule: GTT stop = highest_close × 0.88 (not cost price).
  Monthly GTT reset is now a scheduled task.
```

---

### ✅ RULE R-25 — Skip Stop-Loss GTT If MoS ≥ 50%
```
DATE ADDED : 2026-03-31
RATIONALE:
  Deep discount stocks (MoS ≥ 50%) deserve patience and should not be exited
  on routine volatility (12% dips). Stop-loss GTTs are too tight for these.
  Example: ASHOKA has MoS 56.51% — a 12% stop would trigger on normal swings
  and lock in losses on a generational opportunity.

RULE LOGIC:
  IF Margin of Safety ≥ 50%:
    → SKIP stop-loss GTT (do not place protective stop)
    → HOLD through volatility (deep value requires patience)
    → Consider target GTT instead (sell when IV reached, 50%+ upside)
    → Review quarterly: if MoS drops below 50% → add stop then
  
  IF 25% ≤ MoS < 50%:
    → PLACE stop-loss GTT at avg_price × 0.88
    → Moderate discount needs downside protection
    → Balance between value and risk
  
  IF MoS < 25%:
    → DO NOT BUY (Rule C-001)
    → If holding: review for exit
    → Fair/overvalued = needs protection

AFFECTED HOLDINGS (2026-03-31):
  Skip GTT:  ASHOKA (MoS 56.51%), VHL (MoS 74.8%)
  Place GTT: CAMS (MoS 4.5%), ENERGY (MoS 0.9%), JINDALPHOT (MoS 4.7%)

EXCEPTION:
  If stock shows signs of fundamental deterioration (EPS decline 2Q+, D/E>2),
  then place stop-loss even if MoS > 50%. Fundamentals trump valuation.

✅ IMPLEMENTATION:
  gtt-manager checks MoS before placing stop-loss GTT.
  If MoS ≥ 50%: Skip with note "Deep discount, hold through volatility"
```

---

### ❌ MISTAKE P-002 — Report Not Saved Before Trading
```
DATE     : [add date]
WHAT HAPPENED:
  Ran scans mentally / in chat. Did not save report to reports/ folder.
  Made 2 trades. One was a duplicate of an existing position
  (did not check current holdings properly).
  Ended up overweight in one stock without realising.

ROOT CAUSE:
  Skipped the report generation step. "I remember the data."

⛔ NEVER DO:
  Trade based on memory of scan results.
  The report file MUST exist on disk before any order.

✅ FIX / RULE ADDED:
  order-executor gate #1: check reports/YYYY-MM-DD_daily_report.docx exists.
  If file not found → HARD STOP. No order allowed.
```

---

### ❌ MISTAKE P-003 — Wrong Quantity in Order (Decimal Error)
```
DATE     : [add date]
STOCK    : [add symbol]
WHAT HAPPENED:
  Intended to buy 50 shares. Entered 500.
  Order filled. 10× intended capital deployed in one stock.
  Breached 10% portfolio limit immediately.

ROOT CAUSE:
  No quantity double-check before confirming order.

⛔ NEVER DO:
  Place order without reading back: Symbol + Qty + Price out loud (or in log).

✅ FIX / RULE ADDED:
  order-executor always logs intended order details BEFORE placing:
    "Placing: BUY {QTY} × {SYMBOL} @ ~₹{PRICE} = ₹{TOTAL_VALUE}"
  Position size check: Total value ≤ 10% of portfolio enforced programmatically.
```

---

### ❌ MISTAKE P-004 — Sold Winner Too Early, Held Loser Too Long
```
DATE     : [add date]
WHAT HAPPENED:
  Stock A: Was up 18%, sold to "book profits." It went up 60% more.
  Stock B: Was down 22%, held hoping for recovery. It fell another 30%.
  Classic mistake: cutting flowers, watering weeds.

ROOT CAUSE:
  No objective exit criteria. Decisions made on emotion.

⛔ NEVER DO:
  Sell a stock just because it is up.
  Hold a stock just because selling feels like "admitting a mistake."

✅ FIX / RULE ADDED:
  Exit rules now codified:
    SELL when: Current Price ≥ Intrinsic Value × 0.95  (target reached)
    SELL when: GTT stop triggered  (stop-loss hit, no debate)
    SELL when: Fundamentals deteriorate (2Q declining EPS + D/E > 2)
    HOLD when: Price still below IV and fundamentals intact
  Emotion is not a valid sell reason. Only these 3 conditions trigger exits.
```

---

### ❌ MISTAKE P-005 — Placed Limit Order Too Far From CMP, Missed Fill
```
DATE     : [add date]
WHAT HAPPENED:
  Set limit buy order ₹15 below CMP to "get a better price."
  Stock moved up immediately. Order never filled.
  Chased it with a market order ₹25 above original limit.
  Net result: paid more than if original market order was placed.

ROOT CAUSE:
  Over-optimising entry price on high-conviction idea.

⛔ NEVER DO:
  Place limit order > 1.5% below CMP on high-conviction buys.
  Do not chase with market order if limit misses.

✅ FIX / RULE ADDED:
  For MoS > 40% stocks (high conviction): use market order or limit ≤ 1% from CMP.
  For MoS 25–40% (moderate conviction): limit order acceptable, max 2% below CMP.
  If limit misses → wait for next scan. Do not chase same day.
```

---

### ❌ MISTAKE T-004 — KiteMCP OAuth Session ID Error
```
DATE     : 2026-03-26
WHAT HAPPENED:
  KiteMCP remote server at https://mcp.kite.trade/mcp returned 500 error
  on OAuth callback with "missing session_id or request_token" error.
  Cannot execute orders - tools not available in session.

ROOT CAUSE:
  KiteMCP remote server has known bugs (GitHub issues #31, #41, #14).
  The OAuth callback fails to process request_token properly.

⛔ NEVER DO:
  Assume remote MCP will work reliably.
  
✅ FIX / RULE ADDED:
  [ ] Try local kite-mcp server instead of remote
  [ ] Use manual execution via broker terminal when MCP fails
  [ ] Document workaround: execute orders manually, track in this system
  [ ] Local setup: pip install kite-mcp or npx mcp-remote with local server
```

---

### ❌ MISTAKE T-005 — MCP Tools Not Available in Build Mode
```
DATE     : 2026-03-26
WHAT HAPPENED:
  Despite being in build mode (not read-only), KiteMCP tools still showed
  as "invalid" - not available. Could not execute kite_place_order etc.

ROOT CAUSE:
  opencode.json configured remote MCP but connection not established.
  Even with OAuth config in opencode.json, tools not loading in session.

⛔ NEVER DO:
  Trust that MCP tools will be available in build mode.
  
✅ FIX / RULE ADDED:
  Check tool availability at session start with test call.
  If tools unavailable → fall back to manual execution.
  Continue trading process: create order details, user executes manually.
```

---

---

### ❌ MISTAKE T-007 — JSON Schema Mismatch Between AI Output and Consumer Scripts
```
DATE     : 2026-04-06
WHAT HAPPENED:
  Ran full daily workflow (GATE 0-4). AI saved JSON files to reports/.
  create_master_markdown.js crashed when trying to read opportunities JSON:
  - Script expected: opportunities: [] (flat array)
  - AI saved: horizons: { short_term: [], medium_term: [], long_term: [] }
  - Script expected: commodities: [{symbol, price}] 
  - AI saved: GOLD: {price}, SILVER: {price}, etc.
  Multiple script crashes across opportunities, commodities, news data.
  Had to manually fix and re-save all 3 JSON files.

ROOT CAUSE:
  AI generated JSON with nested/labeled structure for human readability.
  Node.js scripts expected flat arrays with specific field names.
  No schema contract between AI output and script consumers.

⛔ NEVER DO:
  Save JSON to reports/ without verifying it matches the schema expected
  by the consuming Node.js script.
  Generate nested/labeled structures when flat arrays are required.

✅ FIX / RULE ADDED:
  CHECKLIST: Before saving ANY JSON to reports/:
    [ ] Read create_master_markdown.js or create_portfolio_export.js
        to find what schema they expect
    [ ] Verify top-level structure matches (array vs object)
    [ ] Verify field names match (symbol vs name, price vs current_price)
    [ ] Verify array items have required fields
    [ ] Test-run the consumer script after saving JSON
    [ ] If script crashes → fix JSON schema, re-save, re-test
  
  SCRIPT SCHEMA REQUIREMENTS (as of 2026-04-06):
  - opportunities.json: { opportunities: [{symbol, horizon, current_price, ...}] }
  - commodities.json: { commodities: [{symbol, price, change_pct, trend, ...}] }
  - news_opportunities.json: { news: [{headline, source, impact_score, ...}] }
  - value_screen.json: { stocks: [{symbol, current_price, intrinsic_value_avg, ...}] }
  - portfolio_snapshot.json: { holdings: [{symbol, qty, avg_price, last_price, ...}] }
  
  Rule P-011 and P-018 added to master rules.
```

---

---

### ❌ MISTAKE T-009 — Script Array-to-String Bug Shows [object Object] in Report
```
DATE     : 2026-04-06
WHAT HAPPENED:
  GTT audit section of daily report showed "Protected Holdings: [object Object],[object Object],..."
  instead of a count. Script used array in string concatenation: `${array || 0}`.

ROOT CAUSE:
  gttData.protected_holdings is an array. When used in template string without .length,
  JavaScript calls .toString() which outputs "[object Object]" for each item.

⛔ NEVER DO:
  Use an array directly in string interpolation without checking if it's array first.

✅ FIX / RULE ADDED:
  create_master_markdown.js line 133 now uses:
    ${gttData.total_protected_holdings || (gttData.protected_holdings?.length || 0)}
  Always use .length for arrays, or a dedicated count field.
```

---

### ❌ MISTAKE T-011 — Dashboard API Path Bug (Double Date Prefix)
```
DATE     : 2026-04-06
WHAT HAPPENED:
  Dashboard showed "Current Value: empty" for all holdings.
  API returned portfolio: null even though JSON files existed.
  Root cause: API searched for wrong file paths.

ROOT CAUSE:
  Files are named "YYYY-MM-DD_portfolio_snapshot.json" (with date prefix).
  API called readReportJSON(date, 'portfolio_snapshot.json').
  readReportJSON constructed path: reports/2026-04-06/raw_data/portfolio_snapshot.json
  Actual path: reports/2026-04-06/raw_data/2026-04-06_portfolio_snapshot.json
  
  All 7 API endpoints used wrong path construction.

⛔ NEVER DO:
  Assume filename parameter doesn't need date prefix when files include date in name.

✅ FIX / RULE ADDED:
  Changed all API endpoints to prepend date to filename:
    readReportJSON(date, `${date}_portfolio_snapshot.json`)
  Fixed readReportJSON locations array to search correct paths first.
  Fixed 7 endpoints: /dashboard, /portfolio, /valuescreen, /gtt,
    /opportunities, /news, /commodities, /data-status
```

---

### ❌ MISTAKE T-012 — Holdings Missing current_value Field (Value Column Empty)
```
DATE     : 2026-04-06
WHAT HAPPENED:
  Dashboard holdings table showed empty/nan in the "Value" column.
  Portfolio API returned data correctly but Value column was blank.

ROOT CAUSE:
  Portfolio snapshot JSON stores holdings without a `current_value` field.
  The frontend table expected `h.current_value` which was always undefined.
  `current_value` = qty × current_price must be computed client-side.

⛔ NEVER DO:
  Assume consumer scripts add missing computed fields automatically.

✅ FIX / RULE ADDED:
  Fixed app.js renderHoldingsTable() to compute current_value:
    const qty = h.quantity || h.qty || h.t1_quantity || 0;
    const price = h.current_price || h.last_price || 0;
    const currentValue = qty * price;
  Also fixed sort by value to use computed values.
  T+1 pending stocks show "qty (T+1)" format.
```

---

### ❌ MISTAKE T-013 — Jest Test Setup Issues
```
DATE     : 2026-04-06
WHAT HAPPENED:
  Three Jest testing issues encountered while setting up unit tests:
  1. check_gates.js calls process.exit() at top-level on require → crashes Jest
  2. normalizeHoldings crashes on null input (default [] bypassed)
  3. formatters boundary test used wrong expected values (1Cr threshold)

⛔ NEVER DO:
  Call process.exit() at module top-level — guard with require.main === module
  Pass null to functions with default params ([] doesn't protect against null)
  Hardcode boundary expectations without verifying function logic

✅ FIX / RULE ADDED:
  Added if (require.main === module) guard to check_gates.js main block
  Added module.exports = { fileAgeMinutes, findGateFile, GATES } for testability
  Fixed normalizeHoldings tests to expect TypeError on null input
  Fixed formatCurrency boundary test — 9999999 is Lakh (100L), not plain
  Created src/__tests__/ with 116 unit tests (all passing)
  Created src/test_runner.js with 53 integration tests (all passing)
```

---

### ❌ MISTAKE T-010 — Dashboard Shows Stale Data Without Warning
```
DATE     : 2026-04-06
WHAT HAPPENED:
  Dashboard showed yesterday's portfolio prices as if they were current.
  No warning indicated the data was stale.
  User made decisions based on outdated information.

ROOT CAUSE:
  Dashboard reads static JSON files. No live price connection.
  No stale data detection or warning mechanism.
  KiteMCP uses OAuth sessions that can't be called from Node.js directly.

⛔ NEVER DO:
  Trust dashboard prices as live without confirming data freshness.
  Open dashboard without running AI agent refresh first.
  Assume the data is current just because the dashboard loads.

✅ FIX / RULE ADDED:
  Added stale data warning banner when viewing historical dates or old data.
  Added "🔄 Refresh with AI" button to trigger AI agent price update.
  Added lastRefreshed timestamp and live indicator to dashboard.
  Added /api/data-status endpoint for freshness checking.
  Rule: Always run "npm run refresh" → complete AI prompt → open "npm run web"
  
  WORKFLOW:
  1. npm run refresh → Copy prompt → Paste into OpenCode
  2. AI fetches live prices → Updates JSON files
  3. npm run web → Dashboard loads with LIVE data
  4. During market hours: Click "Refresh with AI" for live prices anytime
```

---

### ❌ MISTAKE T-008 — Server Doesn't Auto-Open Browser on Startup
```
DATE     : 2026-04-06
WHAT HAPPENED:
  Updated AGENTS.md to say "npm run web opens http://localhost:3000".
  Ran npm run web. Server started but no browser opened.
  User had to manually navigate to the URL.
  Frustrating for workflow - defeats the purpose of the shortcut.

ROOT CAUSE:
  server.js used console.log to announce the URL but didn't actually
  open the browser. The npm run web command didn't include a browser open step.

⛔ NEVER DO:
  Document a command as "opens browser" without actually opening it.
  Assume users will always manually navigate.

✅ FIX / RULE ADDED:
  server.js now uses child_process.exec() to auto-open browser:
    - Windows: start <url>
    - macOS: open <url>
    - Linux: xg-open <url>
  package.json has both "web" and "dev" scripts pointing to server.js
  AGENTS.md now correctly documents: npm run web → starts + opens browser
```
```
DATE     : 2026-03-31
WHAT HAPPENED:
  Attempted google_search for opportunity/news/commodity scans.
  API returned 404: "Resource projects/unknown could not be found"
  This indicates GCP project credentials not configured in environment.

ROOT CAUSE:
  google_search tool requires valid GCP project with Search API enabled.
  Environment does not have GOOGLE_CLOUD_PROJECT or valid credentials.
  Tool initialization fails silently → returns 404 on any query.

⛔ NEVER DO:
  Assume google_search will work without verifying GCP setup.
  Attempt websearch-dependent gates without fallback sources.

✅ FIX / RULE ADDED:
  GATE 0 / 0.3 / 0.5 (opportunity/commodity/news scans):
    [ ] For each web source: retry 5 times with 5s delay
    [ ] If non-200 or tool error after retries → use alternate sources (MoneyControl, ET, LiveMint, BSE/NSE)
    [ ] If alternates fail → retry web sources again (5×, 5s delay)
    [ ] If still failing → fallback to previous day's JSON data
    [ ] Add note to daily report: "Using previous-day scan results (today's websearch unavailable)"
    [ ] Continue workflow without blocking
  
  GATE PROGRESSION: Not a hard stop. Reuse cached scan data and continue.
```

---

### ❌ MISTAKE T-001 — Kite Access Token Expired Mid-Session
```
DATE     : [add date]
WHAT HAPPENED:
  Started portfolio scan. Token expired halfway through.
  Partial data was written to snapshot file.
  Did not notice. Report was generated on incomplete data.
  Intrinsic value screen ran on stale prices.

ROOT CAUSE:
  No token validity check at session start.

⛔ NEVER DO:
  Assume token is valid. Kite tokens expire daily.

✅ FIX / RULE ADDED:
  portfolio-scanner step 1: kite.getProfile() as token ping before any data fetch.
  If ping fails → STOP. Re-authenticate. Do not proceed with stale token.
```

---

### ❌ MISTAKE T-002 — Report Overwrote Previous Day's File
```
DATE     : [add date]
WHAT HAPPENED:
  Report generator used hardcoded filename "daily_report.docx".
  New report overwrote previous day's report.
  Lost historical record. Could not compare day-over-day.

ROOT CAUSE:
  Filename did not include date.

⛔ NEVER DO:
  Save any report without YYYY-MM-DD in filename.

✅ FIX / RULE ADDED:
  All report filenames: reports/YYYY-MM-DD_[type].docx/json
  report-generator validates date in filename before saving.
```

---

### ❌ MISTAKE T-003 — Excel File Locked, Agent Wrote to Wrong Row
```
DATE     : [add date]
WHAT HAPPENED:
  Portfolio_Analysis_Report.xlsx was open in Excel.
  Agent tried to update it. File was locked.
  Agent wrote to a temp file instead without warning.
  Next day's scan read stale data from original file.

ROOT CAUSE:
  No file-lock check before writing to Excel.

⛔ NEVER DO:
  Run report-generator while xlsx is open in Excel/LibreOffice.

✅ FIX / RULE ADDED:
  report-generator checks if xlsx is locked before writing.
  If locked → alert user: "Close Excel first" and pause.
```

---

### ❌ MISTAKE T-007 — JSON Schema Mismatch Between AI Output and Script Consumers
```
DATE     : 2026-04-06
WHAT HAPPENED:
  create_master_markdown.js crashed with TypeError on 4 different fields:
  1. oppData.opportunities.forEach — AI saved as nested {horizons:{short_term:[]}} 
     but script expected flat {opportunities:[]}
  2. commodityData.commodities.forEach — AI saved as {GOLD:{}, SILVER:{}}
     but script expected [{symbol:.., price:..}]
  3. oppData.opportunities[0].upside_pct — script used wrong field name
  4. valueData.stocks — AI saved as {holdings_analysis:[]} not {stocks:[]}

  Root cause: AI generates JSON with human-readable structure; Node scripts expect 
  machine-readable array format. Mismatch causes silent failures (data not rendered)
  or hard crashes (forEach on non-array).

ROOT CAUSE:
  No schema enforcement. AI is creative with JSON structure.
  Scripts fail silently or crash. No validation before saving.

⛔ NEVER DO:
  Save AI-generated JSON to reports/ without validating the schema
  against what the consuming script expects.
  Do not assume AI will use the same structure the script expects.

✅ FIX / RULE ADDED:
  After every AI-generated JSON save to reports/:
    [ ] Check schema BEFORE saving: Does it match what the consumer script expects?
    [ ] If script expects array [{}] — ensure AI outputs array, not object {items:[]}
    [ ] If script expects field "stocks" — don't save as "holdings_analysis"
    [ ] If script expects field "current_price" — don't use "last_price" interchangeably
    [ ] Run the consumer script immediately to verify it doesn't crash
    [ ] If crash occurs — FIX the JSON schema, re-save, re-run
  Rule P-011 + Rule P-024 added to master rules.
  Rule P-017: Every new JSON field must be validated against consumer script
  before saving to reports/.
```

---

### ❌ MISTAKE P-014 — GTT Duplicates Across Exchanges (NSE/BSE) Causing Qty Mismatch
```
DATE     : 2026-04-06
WHAT HAPPENED:
  Found 4 existing GTTs conflicting with new placements:
  - TMCV had GTT on BSE @₹320 (qty 110) AND on NSE @₹450 (qty 110)
    while holding was 160 shares on BSE only
  - NXST had 3 GTTs across exchanges with overlapping triggers
  Had to delete 4 GTTs, costing time and risking order confusion

ROOT CAUSE:
  Never checked existing GTTs before placing new ones.
  Each placement was treated as independent — no cross-check.
  Same stock listed on both BSE and NSE created confusion.

⛔ NEVER DO:
  Place a GTT without first checking kite.getGTTs() for existing GTTs
  on the SAME symbol, ANY exchange.
  Assume no duplicates exist from previous sessions.

✅ FIX / RULE ADDED:
  Pre-GTT checklist (add to GTT manager workflow):
    [ ] Fetch kite.getGTTs() BEFORE any placement
    [ ] Check ALL exchanges (NSE + BSE) for same symbol
    [ ] Verify qty in GTT matches current holding qty
    [ ] If duplicate found: DELETE old GTT first, then place new
    [ ] If partial qty overlap: DELETE old, PLACE new with full qty
  Rule P-016 added to master rules.
```

---

### ❌ MISTAKE P-006 — Using Stale/Incomplete Data for Intrinsic Value
```
DATE     : 2026-03-25
WHAT HAPPENED:
  Ran intrinsic value screen using outdated Excel data.
  Portfolio_Analysis_Report.xlsx had old EPS, Book Value, and fundamentals.
  Made buy decision based on incorrect Graham Number calculations.

ROOT CAUSE:
  Did not fetch fresh fundamentals from screener.in before IV calculation.
  KiteMCP doesn't provide fundamentals — only price data.

⛔ NEVER DO:
  Calculate intrinsic value without current fundamental data.
  Assume Excel data is fresh. Always verify with live source.

✅ FIX / RULE ADDED:
  intrinsic-value-scanner now MUST:
    [ ] Fetch live fundamentals from screener.in for each stock
    [ ] Required metrics: EPS (TTM), Book Value, P/E, P/B, D/E, ROE
    [ ] Web search: "screener.in {SYMBOL} fundamental analysis"
    [ ] If Screener fields are blank or partial → use alternate sources (Moneycontrol/Trendlyne) to fill required metrics
  No IV calculation allowed without current screener.in data.
```

---

### ❌ MISTAKE P-007 — Duplicate Content in AGENTS.md
```
DATE     : 2026-03-27
WHAT HAPPENED:
  AGENTS.md had duplicate pre-order checklists and schedule sections
  from previous edits. Confusing to read, risked following wrong version.

ROOT CAUSE:
  Edits were appended instead of replacing duplicate sections.

⛔ NEVER DO:
  Leave duplicate content blocks when editing markdown files.

✅ FIX / RULE ADDED:
  AGENTS.md cleaned up - removed duplicate checklists.
  All sections now have single authoritative version.
```

---

### ❌ MISTAKE P-008 — GTT Trigger Price vs Current Price Mismatch
```
DATE     : 2026-03-26
WHAT HAPPENED:
  GTT stop-loss trigger at ₹1200 for JINDALPHOT, but current price is ₹1096.
  The trigger is 10% ABOVE current price - not below!
  This means if price rises to ₹1200 and falls, it triggers a sell.
  However the stock is already down - wrong GTT logic.

ROOT CAUSE:
  Stop-loss GTTs should be BELOW current price, not above.
  For existing holdings, stop-loss = avg_price × 0.88 (12% below cost).
  Was incorrectly placing sell triggers above current price.

⛔ NEVER DO:
  Place sell GTTs above current price as "stop-loss" - that's a target.
  Stop-loss must be below current price to protect against further decline.

✅ FIX / RULE ADDED:
  GTT stop-loss placement:
    BUY positions: Trigger BELOW current price (at avg_price × 0.88)
    SELL positions: Trigger ABOVE current price (at target price)
  Verify trigger direction matches transaction type.
```

---

### ❌ MISTAKE P-009 — Stock Name Hallucination
```
DATE     : 2026-03-27
WHAT HAPPENED:
  Called VHL as "Varun Healthcare" - it is actually "Vardhaman Holdings Limited".
  Vardhaman Holdings is an NBFC/Investment holding company with massive investments
  (₹3,728 Cr), NOT a healthcare company.

ROOT CAUSE:
  Assumed stock symbol based on common patterns without verification.
  Did not search/verify actual company name before analysis.

⛔ NEVER DO:
  Assume company name from stock symbol. 
  "VHL" could be anything - must verify before analysis.

✅ FIX / RULE ADDED:
  ALWAYS verify stock name via search before analysis:
  - kite_search_instruments(symbol) to get official name
  - Web search "screener.in {SYMBOL}" for fundamentals
  - NEVER use symbol alone to infer business
  - Tata Motors is split into TMCV and TMPV — do not use legacy TATAMOTORS
  - Verify symbol via web search (screener.in or exchange site) before adding to reports
    Example (TMCV): https://www.screener.in/company/TMCV/ or https://www.nseindia.com/get-quotes/equity?symbol=TMCV
    Example (ENERGY): https://www.screener.in/company/ENERGY/ or https://www.nseindia.com/get-quotes/equity?symbol=ENERGY
  - For REIT/ETF/Index units with special symbols (e.g., NXST-RR), confirm screener alias (e.g., NXST)
    Example (NXST): https://www.screener.in/company/NXST/ and https://www.nseindia.com/get-quotes/equity?symbol=NXST
```

---

### ❌ MISTAKE P-010 — Excel/Word Reports Showing NaN for P&L %
```
DATE     : 2026-03-29
WHAT HAPPENED:
  Portfolio export showed P&L % as NaN for all holdings.
  Daily report also showed NaN P&L % in the portfolio table.
  Root cause: JSON used qty/avg_price/last_price but script expected
  quantity/average_price/current_price.

LOSS / IMPACT : Reports were unusable. User lost confidence in data.

ROOT CAUSE:
  KiteMCP returns fields as qty, average_price, last_price.
  create_portfolio_export.js expected quantity, avg_price, current_price.
  create_daily_report.js used qty, avg, last (which matched but pnl computation failed).
  No standardized field names across scripts.

⛔ NEVER DO:
  Hardcode field names assuming a specific JSON schema.
  Generate reports without verifying field names match between JSON and script.

✅ FIX / RULE ADDED:
  create_portfolio_export.js now has flexible field mapping:
    const qty      = h.quantity     || h.qty;
    const avgPrice = h.average_price || h.avg_price;
    const curPrice = h.current_price  || h.last_price;
  All NaN checks also added: !isNaN() guards before toFixed().
  STACK all scripts on same field name convention from portfolio_snapshot.json.
```

---

### ❌ MISTAKE P-011 — Report Generator Missing Immediate Actions
```
DATE     : 2026-03-29
WHAT HAPPENED:
  Daily report showed "Immediate Actions: 0" even though ASHOKA
  had no GTT stop-loss (high priority).
  gtt_audit.json had action_items but no unprotected_holdings array.

ROOT CAUSE:
  create_daily_report.js reads gtt_audit.json and checks
  gttData.unprotected_holdings, but this field was never added to the JSON.

⛔ NEVER DO:
  Output JSON files that don't match the expected schema of downstream consumers.

✅ FIX / RULE ADDED:
  All agent JSON outputs must match the schema expected by report-generator.
  gtt_audit.json now has: protected_holdings[] and unprotected_holdings[].
  Report generator validates: if JSON field missing, log warning.
```

---

### ❌ MISTAKE P-012 — Prompt Architecture Bugs Causing Agent Failures
```
DATE     : 2026-03-29
WHAT HAPPENED:
  Full audit of all 11 prompt files in prompts/ revealed 7 cross-cutting
  architectural problems degrading agent performance across models:
  
  1. REDUNDANT PERSONA: Every prompt copy-pasted a 2-line analyst persona
     (~50 tokens × 10 files = 500 wasted tokens per session)
  2. NO IMPORT DIRECTIVE: No prompt told models to read _base.md first,
     so core rules (R-01 through R-13) could be silently ignored
  3. HARDCODED DATES: Example JSONs used "2026-03-26" — free/weak models
     copied these literally instead of using today's date
  4. NO ERROR RECOVERY: If KiteMCP or web search failed, agents halted
     with no fallback path. No retry, no alternative source, no graceful degradation
  5. WRONG GTT TRANSACTION TYPE: order_executor.md had GTT stop-loss example
     with transaction_type: "BUY" — should be "SELL" for protective stop on
     long positions. A BUY stop would ADD shares on price drop!
  6. WRONG TAX RATE: excel_export.md said LTCG = 12.5% but _base.md said 10%.
     Inconsistency between prompt files
  7. NEGATIVE EPS NaN: intrinsic_value.md used Graham Number √(22.5 × EPS × BV)
     without checking for negative EPS. √(negative) = NaN → broke calculations
  8. gtt_manager.md was 69 lines — severely under-specified, missing trailing
     stop formula, OCO examples, P-008 direction validation
  9. opportunity_scanner.md had no JSON output format — only text blocks,
     breaking create_daily_report.js which expects JSON
  10. stock.yaml was legacy YAML — no agent imported it, _base.md had all
      the same content. Dead file wasting context if loaded

LOSS / IMPACT : Agents produced invalid JSON, wrong calculations, missed rules,
  and wasted tokens. Free-tier models especially degraded.

ROOT CAUSE:
  Prompts grew organically without architectural review.
  No single source of truth enforcement.
  No import/dependency management between prompt files.

⛔ NEVER DO:
  - Copy-paste analyst persona into each prompt (use _base.md import)
  - Use hardcoded dates in example JSON (use YYYY-MM-DD placeholder)
  - Skip error recovery instructions in any agent prompt
  - Use transaction_type "BUY" for stop-loss GTTs
  - Calculate √(negative) without EPS guard
  - Leave tax rates inconsistent between files

✅ FIX / RULE ADDED:
  All 10 agent prompts rewritten with:
    [x] _base.md import directive at top
    [x] Removed redundant analyst persona
    [x] Dynamic date rule (never hardcode)
    [x] Error recovery protocol per agent
    [x] Output validation contract before saving JSON
    [x] R-17: Negative EPS guard (skip Graham if EPS ≤ 0)
    [x] R-18: GTT stop-loss transaction_type = "SELL"
    [x] Fixed LTCG rate to 10% (aligned with _base.md)
    [x] gtt_manager.md expanded from 69 → 190 lines
    [x] opportunity_scanner.md now has proper JSON schema
    [x] stock.yaml → stock_framework.md (markdown format)
    [x] Model compatibility hints for free-tier models
    [x] Data freshness rules (max age for each data type)
    [x] Tool call reference table with exact MCP function signatures
```

---

## 📋 MASTER RULES DERIVED FROM ALL MISTAKES

These rules are auto-checked by agents. Any violation = hard stop.

```
#  RULE                                              SOURCE    
 ─────────────────────────────────────────────────────────────────────
 1  Never buy without MoS > 25% (prefer > 40%)        C-001     
 2  Place GTT stop-loss same session as BUY fill       C-002     
 3  Never average down if EPS declining 2Q+ or D/E>2  C-003     
 4  Check sector sentiment before any new buy          C-004     
 5  Review all GTTs every 30 days, trail with price    P-001     
 6  Daily report file must exist before any order      P-002     
 7  Log order details before placing (Symbol+Qty+₹)    P-003     
 8  Only 3 valid exit conditions — no emotional sells  P-004     
 9  Limit orders max 1.5% below CMP (high conviction)  P-005     
10  Fetch live fundamentals from screener.in before IV P-006     
11  Ping Kite token before every data fetch            T-001     
12  All report filenames must include YYYY-MM-DD        T-002     
13  Close Excel before running report-generator        T-003     
14  MCP tools may be unavailable — fallback ready     T-004/T-005
15  Verify GTT trigger direction matches price flow    P-008
16  ALWAYS verify stock name before analysis           P-009
17  Use flexible field mapping for JSON schema changes  P-010
18  JSON output schema must match consumer scripts      P-011
19  Guard negative EPS — skip Graham if EPS ≤ 0        P-012
20  GTT stop-loss transaction_type = "SELL" (not BUY)   P-012
21  Every prompt imports _base.md first (no duplication) P-012
22  Never hardcode dates in examples (use YYYY-MM-DD)    P-012
23  Every agent prompt must have error recovery block    P-012
24  Validate JSON schema before saving to reports/       P-012
25  SKIP stop-loss GTT if MoS ≥ 50% (deep value)         R-025
26  Web search retry 5x/5s → alternates → retry 5x/5s → prev-day JSON    T-006
    If Google search tool fails, use DuckDuckGo or Bing via webfetch.
27  Tata Motors uses TMCV/TMPV symbols only              P-009
28  Update agents/learnings/gates after every change    P-013
 29  Verify symbol via web search before adding          P-014
 30  For REIT/ETF/Index units, confirm screener alias     P-015
 31  Check existing GTTs before placing new ones          P-016
 32  Validate JSON schema before saving to reports/       T-007
 33  Read consumer script schema before saving JSON        T-007
 34  Server auto-opens browser on npm run web            T-008
 35  Use .length for arrays in string interpolation       T-009
 36  Always refresh via AI agent before dashboard        T-010
 37  Dashboard data is stale until AI refresh completes  T-010
 38  Compute missing fields client-side (qty×price)      T-012
 39  Use flexible field mapping for T+1 pending stocks   T-012
 40  Mock process.exit before require() in Jest tests    T-013
 41  Test files with guard if require.main===module      T-013
 42  Use typeof check not Array.isArray for null guard   T-013
 ─────────────────────────────────────────────────────────────────────
```

---

## HOW TO ADD A NEW MISTAKE

Copy this template and paste at top of the relevant section:

```
### ❌ MISTAKE [C/P/T]-[next number] — [Short title]
DATE     : YYYY-MM-DD
STOCK    : [symbol or N/A]
WHAT HAPPENED:
  [2-4 sentences. Be brutally honest.]

LOSS / IMPACT : [₹ amount or description]

ROOT CAUSE:
  [The real reason, not the surface reason]

⛔ NEVER DO:
  [Exact pattern to avoid]

✅ FIX / RULE ADDED:
  [What changed in agents/checklists to prevent recurrence]
```

---

> "The market is a very efficient machine for transferring money
>  from the impatient to the patient — and from those who don't
>  write down their mistakes to those who do."
