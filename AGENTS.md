# OpenCode Agents — KiteMCP Portfolio Intelligence

> Place this file as `agents.md` in your project root alongside `opencode.json`.
> OpenCode reads this file to understand agent roles, checklists, and workflows.

---

## 🚀 QUICK START — Daily Workflow

```bash
# Step 1: Open Antigravity / OpenCode in this project folder
# Step 2: Tell the AI: "Run daily workflow" (it reads this file automatically)
# Step 3: Once AI has saved JSON files, run:

npm run report     # → reports/YYYY-MM-DD/YYYY-MM-DD_daily_report.md
npm run export     # → reports/Portfolio_YYYY-MM-DD.xlsx
npm run check      # → Gate status (PASS = safe to trade | FAIL = do NOT trade)

# Or use the master orchestrator:
npm start          # Prints AI prompt + waits for JSON + auto-runs report+export

# Step 4: Refresh live prices (before opening dashboard):
npm run refresh    # → Shows AI agent prompt for live prices
# Paste the prompt into OpenCode, let AI fetch live prices

# Step 5: Start web server and open in browser:
npm run web        # → Starts server + auto-opens http://localhost:3000
# OR manually:
npm run dev        # → Same as npm run web (alias)

# Dashboard shows "Live: HH:MM" indicator when prices are current
# Dashboard shows "⚠️" warning when data is stale (historical date or >5 min old)
# Click "🔄 Refresh with AI" button for live price refresh anytime
```

> [!IMPORTANT]
> The AI (Antigravity/OpenCode) generates the JSON data files.
> Node.js scripts generate the Word report and Excel file from that data.

---

## 🔁 SESSION START (MANDATORY - READ learnings.md FIRST)

```
BEFORE ANY OPERATION:
[ ] 1. Read learnings.md — Check all ⛔ NEVER DO patterns
[ ] 2. Verify KiteMCP token is valid (kite.getProfile() ping)
[ ] 3. Check MCP tools availability (test kite_get_ltp)
[ ] 4. Confirm reports/ folder exists and is accessible
[ ] 5. Check Excel file is NOT open (if modifying xlsx)
[ ] 6. For ANY new stock discussed: Verify name via kite_search_instruments()
[ ] 7. Verify symbol via web search (screener.in or exchange site) before adding to reports
        Example (TMCV): https://www.screener.in/company/TMCV/ or https://www.nseindia.com/get-quotes/equity?symbol=TMCV
        Example (ENERGY): https://www.screener.in/company/ENERGY/ or https://www.nseindia.com/get-quotes/equity?symbol=ENERGY
[ ] 8. For any REIT/ETF/Index units with special symbols (e.g., NXST-RR), verify the screener symbol alias (e.g., NXST) before analysis
        Example (NXST): https://www.screener.in/company/NXST/ and https://www.nseindia.com/get-quotes/equity?symbol=NXST
```

**If MCP fails → Use manual execution fallback. Document in learnings.**

**⚠️ IMPORTANT: Always verify stock name before analysis (Rule P-009)**
**⚠️ NOTE: Tata Motors is split into TMCV and TMPV — use those symbols (not TATAMOTORS)**

---

## 🔁 MASTER DAILY WORKFLOW (Run Before ANY Operation)

Every session MUST begin with this sequence. No stock action, report generation,
or GTT modification is allowed before all gates pass.

```
[ ] GATE 0 — Opportunity Scan          → Search internet for short/medium/long-term opportunities
[ ] GATE 0.3 — Commodity Scan           → Search MCX commodity prices (Gold, Silver, Crude, Natural Gas)
[ ] GATE 0.5 — News Scanner            → Scan financial news for news-driven opportunities
[ ] GATE 1 — Market Status Check       → Is market open / pre-open / closed?
[ ] GATE 2 — Portfolio Morning Scan     → Fetch all holdings via KiteMCP
[ ] GATE 3 — Intrinsic Value Screen     → Flag deeply discounted stocks
[ ] GATE 3.5 — GTT Placement Execution → Place approved GTT orders (buy accumulation, stop-loss, targets)
[ ] GATE 3.7 — Deep Value Screener Converter → Convert static deep value markdown to JSON
[ ] GATE 4 — Daily Report Generated    → Save to reports/YYYY-MM-DD/YYYY-MM-DD_daily_report.md
                                          before any buy/sell/GTT action
[ ] GATE 5 — Excel Export              → Generate Portfolio_YYYY-MM-DD.xlsx with tax & dividend
[ ] GATE 6 — Individual Reports       → Generate agent-specific reports (portfolio, value, opportunities, GTT, news, commodities)
[ ] GATE 7 — Weekly Export            → Generate Weekly_Portfolio_YYYY-MM-DD.xlsx with P&L analysis
```

**If any gate fails → STOP. Fix the gate. Do not proceed.**

**Documentation Sync Rule (Always-On):**
- Any workflow or rule change must be reflected immediately in:
  - AGENTS.md (checklists/gates)
  - learnings.md (rule registry + master rules)
  - Any affected prompt/gate definitions
- Any successful new data source or fallback path must be recorded in:
  - AGENTS.md (fallback steps/examples)
  - learnings.md (rule registry)

**Web Search Fallback Rule (Gates 0/0.3/0.5):**
- For each web source: retry 5 times with 5s delay.
- If web search returns non-200 or tool error after retries, use alternate sources (MoneyControl, Economic Times, LiveMint, BSE/NSE).
- If alternates fail, retry web sources again (5×, 5s delay). If still failing, reuse previous-day JSON and mark outputs as `STALE` with a `fallback_reason`.
 - If Google search tool fails, use DuckDuckGo or Bing via `webfetch` to locate sources, then fetch the source URLs directly.
 - If a primary source returns partial/blank fundamentals, use alternate sources to complete required fields before proceeding.

---

## ⚠️ MASTER RULES FROM LEARNINGS (Non-Negotiable)

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
15  Web search retry 5x/5s → alternates → retry 5x/5s → prev-day JSON    T-006
16  Verify GTT trigger direction matches price flow    P-008
17  ALWAYS verify stock name before analysis           P-009
18  Use flexible field mapping for JSON schema changes  P-010
19  JSON output schema must match consumer scripts      P-011
20  Guard negative EPS — skip Graham if EPS ≤ 0        P-012
21  GTT stop-loss transaction_type = "SELL" (not BUY)   P-012
22  Every prompt imports _base.md first (no duplication) P-012
23  Never hardcode dates in examples (use YYYY-MM-DD)    P-012
24  Every agent prompt must have error recovery block    P-012
25  Validate JSON schema before saving to reports/       P-012
26  Update agents/learnings/gates after every change    P-013
27  Verify symbol via web search before adding          P-014
28  For REIT/ETF/Index units, confirm screener alias     P-015
 ─────────────────────────────────────────────────────────────────────
```

**Reference: See `learnings.md` for full mistake details and prevention rules.**

---

### MANDATORY ANALYST CONTEXT
All agents MUST import `prompts/_base.md` first (shared analyst persona, rules, scoring, error recovery). For stock-type-specific valuation methods, see `prompts/stock_framework.md`.

**Key requirements (defined in _base.md):**
- ALWAYS fetch Screener.in data for each stock before analysis
- ALWAYS calculate intrinsic value and show CMP vs Fair Value comparison
- Use stock-type specific valuation methods:
  - Holding Companies: Book Value (P/B = 1.0x baseline)
  - Growth Companies: PE-based (fair PE × EPS)
  - Banks/NBFCs: Adjusted P/B (1.5-2.5x book value)
  - REITs: Dividend Discount Model
  - ETFs: Index-linked
- Prioritize capital protection along with growth

---

### Prompt Review & Improvement
After completing daily workflow, review and improve prompts in `prompts/` directory based on:
- Issues encountered during today's execution
- Reports quality and data accuracy
- Previously sold stock patterns
---

## AGENT 0 — `opportunity-scanner`

### Role
Search the internet for investment opportunities across short-term, medium-term, and long-term horizons. This runs BEFORE portfolio scan to identify new opportunities.

### Opportunity Horizons

| Horizon | Timeframe | Strategy | Search Focus |
|---------|-----------|----------|--------------|
| **Short-Term** | 1-4 weeks | Momentum / Swing Trading | Breaking out stocks, weekly charts, FII/DII flows, sector rotation |
| **Medium-Term** | 3-12 months | Value + Growth | Quarterly results, new orders, capacity expansion, sector trends |
| **Long-Term** | 1-3+ years | Deep Value / Compounding | Blue chips, high ROE, low debt, dividend growers |

### Checklist — Run Daily Before Portfolio Scan

```
OPPORTUNITY SCAN CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] 1. Search for short-term opportunities:
        [ ] "NSE stocks breaking out this week"
        [ ] "FII DII activity today India"
        [ ] "Nifty sector performance today"
        [ ] "Stocks with high volume today NSE"
[ ] 2. Search for medium-term opportunities:
        [ ] "best stocks to buy 2026 India"
        [ ] "NSE stocks with strong quarterly results"
        [ ] "sector outlook India 2026"
[ ] 3. Search for long-term opportunities:
        [ ] "best dividend stocks India NSE"
        [ ] "high ROE stocks India fundamentals"
        [ ] "blue chip stocks India 2026"
[ ] 4. Use india-stock-analysis skill for deeper analysis on promising candidates
[ ] 5. Filter by:
        [ ] Market cap > Rs. 500 Cr (avoid illiquid)
        [ ] P/E < 30 (medium-term), < 20 (long-term)
        [ ] Debt/Equity < 1.5
        [ ] Promoter holding > 50%
[ ] 6. Cross-check against existing holdings (avoid duplicates)
[ ] 7. Save opportunities to reports/YYYY-MM-DD_opportunities.json
[ ] 8. Flag as: SHORT-TERM / MEDIUM-TERM / LONG-TERM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Output Format
```
OPPORTUNITY: TMCV
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Horizon         : MEDIUM-TERM
Current Price   : ₹780
Target (3M)     : ₹950 (22% upside)
Target (12M)    : ₹1,200 (54% upside)
Catalyst        : CV recovery, JLR profit growth
Sector          : Auto
Market Cap      : ₹2,80,000 Cr
P/E             : 18.5
ROE             : 22%
Recommendation  : BUY ON DIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Web Search Queries (Daily)

**Short-Term:**
- "NSE stocks breaking out today"
- "India market today FII DII buying selling"
- "Nifty 50 today momentum stocks"
- "best intraday stocks tomorrow India"

**Medium-Term:**
- "best stocks to buy April 2026 India"
- "quarterly results today India stocks"
- "NSE midcap stocks 2026"
- "sector rotation India market"

**Long-Term:**
- "best stocks for long term India 2026"
- "dividend paying stocks NSE"
- "Warren Buffett style stocks India"
- "best bluechip stocks India"

---

## AGENT 0.3 — `commodity-scanner`

### Role
Search and track MCX (Multi Commodity Exchange) commodity prices and identify investment opportunities in Gold, Silver, Crude Oil, and Natural Gas. Runs in parallel with opportunity-scanner.

### Commodity Scope

| Commodity | Exchange | Instrument |
|-----------|----------|------------|
| Gold | MCX | GOLD |
| Silver | MCX | SILVER |
| Crude Oil | MCX | CRUDEOIL |
| Natural Gas | MCX | NATURALGAS |

### Checklist — Run Daily

```
COMMODITY SCAN CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] 1. Search for Gold prices:
        [ ] "MCX gold price today India"
        [ ] "Gold futures April 2026 MCX"
[ ] 2. Search for Silver prices:
        [ ] "MCX silver price today India"
[ ] 3. Search for Crude Oil:
        [ ] "Crude oil futures India MCX"
        [ ] "MCX crude oil price today"
[ ] 4. Search for Natural Gas:
        [ ] "Natural gas price MCX India"
[ ] 5. Analyze trends and generate recommendations
[ ] 6. Save to reports/YYYY-MM-DD_commodity_opportunities.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Output Format
```
COMMODITY: GOLD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Price   : ₹74,500 per 10g
Change          : +0.52%
Trend           : BULLISH
Support         : ₹73,500
Resistance      : ₹76,000
Recommendation  : HOLD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## AGENT 0.5 — `news-scanner`

### Role
Scan financial news daily to identify investment opportunities based on recent events, corporate announcements, sector developments, and market-moving headlines. Uses the india-news-tracker skill for structured news analysis.

### Checklist — Run Daily After Opportunity Scanner

```
NEWS SCAN CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] 1. Fetch today's market news using india-news-tracker skill:
        [ ] Major headlines from MoneyControl, Economic Times, LiveMint
        [ ] BSE/NSE corporate announcements
        [ ] Regulatory updates (SEBI, RBI)
        [ ] Bulk/block deals
[ ] 2. Categorize news by impact (1-10 scale):
        [ ] Critical (9-10): Market-wide impact
        [ ] High (7-8): Sector or large-cap stock
        [ ] Medium (5-6): Specific stock significant
        [ ] Low (3-4): FYI only
[ ] 3. Identify opportunity types from news:
        [ ] EARNINGS - Results beat/miss expectations
        [ ] CORPORATE_ACTION - Dividend, bonus, split announced
        [ ] M&A - Merger, acquisition, stake sale
        [ ] REGULATORY - SEBI circular, RBI policy
        [ ] BULK_DEAL - Large institutional transaction
        [ ] NEW_ORDERS - Major order win, contracts
        [ ] MANAGEMENT - CEO appointment, board change
        [ ] SECTOR_ROTATION - Policy affecting entire sector
[ ] 4. For each news-driven opportunity:
        [ ] Check current price via KiteMCP
        [ ] Verify fundamentals (P/E, D/E, ROE)
        [ ] Assess market reaction (gap, volume)
        [ ] Determine if already priced in
[ ] 5. Cross-check against existing holdings
[ ] 6. Save to reports/YYYY-MM-DD_news_opportunities.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Opportunity Types & Actions

| Type | Signal | Action |
|------|--------|--------|
| EARNINGS | Results beat/miss | Check price reaction, look for continuation |
| CORPORATE_ACTION | Dividend/bonus/split | Calculate yield, check ex-date |
| M&A | Deal announced | Identify beneficiary, check valuation gap |
| REGULATORY | SEBI/RBI change | Assess sector impact |
| BULK_DEAL | Large transaction | Follow smart money |
| NEW_ORDERS | Order win | Calculate revenue impact |
| MANAGEMENT | Leadership change | Assess quality |
| SECTOR_ROTATION | Policy shift | Rotate accordingly |

### News Sources (Priority)

| Source | Type |
|--------|------|
| MoneyControl | Primary market news |
| Economic Times | Primary market news |
| LiveMint | Premium analysis |
| BSE/NSE | Official announcements |
| SEBI/RBI | Regulatory updates |

### Output Format
```
OPPORTUNITY: HDFCBANK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Source          : MoneyControl - Corporate Action
News Date       : 2026-03-27
Headline        : HDFC Bank announces 1:1 bonus
Impact Score    : 6/10
Sentiment       : 🟢 Bullish
Type            : CORPORATE_ACTION
Current Price   : ₹1,680
Catalyst        : Bonus issue signals confidence
Sector          : Banking
Recommendation  : ACCUMULATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Tools
- websearch: Search news sources
- skill:india-news-tracker: Daily news briefing
- kite_get_ltp: Verify price reaction

---

## AGENT 1 — `portfolio-scanner`

### Role
Fetch live portfolio, compute P&L, flag movers, and produce the morning snapshot.

### Checklist — Run at Market Open (09:15 IST)

```
PORTFOLIO SCAN CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] 1. Connect to Kite via MCP (verify token is valid)
[ ] 2. Fetch all holdings (quantity, avg_price, last_price)
[ ] 3. Fetch all positions (day trading positions)
[ ] 4. Calculate for each holding:
        [ ] Current Market Value = qty × last_price
        [ ] Unrealised P&L = (last_price − avg_price) × qty
        [ ] P&L % = ((last_price − avg_price) / avg_price) × 100
[ ] 5. Flag holdings with day change > ±3%
[ ] 6. Flag holdings with total P&L < −15% (stop-loss review)
[ ] 7. Check margin / available cash balance
[ ] 8. Verify no pending failed orders from previous session
[ ] 9. Save snapshot → reports/YYYY-MM-DD_portfolio_snapshot.json
[ ] 10. Confirm snapshot saved before proceeding
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### KiteMCP Calls
```javascript
// Via opencode.json MCP tools
kite.getHoldings()
kite.getPositions()
kite.getMargins()
kite.getOrders()
```

---

## AGENT 2 — `intrinsic-value-scanner`

### Role
Identify stocks trading at a **huge discount to intrinsic value** — the core
value investing signal. Runs daily after portfolio scan check good stocks in screener for 

### Intrinsic Value Methods (use all three, take average)

| Method | Formula |
|--------|---------|
| **Graham Number** | `√(22.5 × EPS × Book Value Per Share)` |
| **DCF (simplified)** | `FCF × (1 + g)^n / (r − g)` where g=growth, r=discount rate |
| **P/E Mean Reversion** | `EPS × Sector Average P/E` |

### Deep Discount Definition
```
Margin of Safety > 40%  →  🔴 DEEP DISCOUNT (HIGH PRIORITY)
Margin of Safety > 25%  →  🟡 MODERATE DISCOUNT
Margin of Safety < 15%  →  🟢 FAIRLY VALUED / OVERVALUED
```

```
Margin of Safety % = ((Intrinsic Value − Current Price) / Intrinsic Value) × 100
```

### Checklist — Daily Intrinsic Value Screen

```
INTRINSIC VALUE SCAN CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] 1. Pull current price for each holding from Kite
[ ] 2. Load fundamentals from Excel (Portfolio_Analysis_Report.xlsx):
        [ ] EPS (TTM)
        [ ] Book Value Per Share
        [ ] Free Cash Flow
        [ ] Revenue Growth (3Y CAGR)
        [ ] Debt-to-Equity Ratio
[ ] 3. Compute Graham Number for each stock
[ ] 4. Compute DCF Value (use 12% discount rate, 5Y horizon)
[ ] 5. Compute P/E fair value
[ ] 6. Average the three → Intrinsic Value estimate
[ ] 7. Calculate Margin of Safety = (IV − Price) / IV × 100
[ ] 8. Sort by Margin of Safety descending
[ ] 9. Flag top 5 deepest discounts with 🔴 label
[ ] 10. Flag stocks where IV < Current Price as OVERVALUED ⚠️
[ ] 11. Cross-check: Is the discount driven by fundamentals or fear?
          [ ] Check debt levels (D/E < 1.5 = acceptable)
          [ ] Check earnings trend (not consecutive declining quarters)
[ ] 12. Save output → reports/YYYY-MM-DD_value_screen.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Output Format (per stock)
```
STOCK: TATAMOTORS
─────────────────────────────────────
Current Price    :  ₹780
Graham Number    :  ₹1,240
DCF Value        :  ₹1,180
P/E Fair Value   :  ₹1,050
━━ Intrinsic Value (avg): ₹1,157
Margin of Safety :  32.6%  🟡
Action Signal    :  ACCUMULATE ON DIPS
─────────────────────────────────────
```

---

## AGENT 3 — `gtt-manager`

### Role
Review, create, modify, and audit all GTT (Good Till Triggered) orders.
GTTs are your automated safety net — treat them as critical infrastructure.

### Checklist — Daily GTT Audit

```
GTT DAILY AUDIT CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] 1. Fetch all active GTTs via KiteMCP: kite.getGTTs()
[ ] 2. For each GTT verify:
        [ ] Trigger price is still valid (not stale from months ago)
        [ ] Quantity matches current holding quantity
        [ ] GTT type correct: single (stop-loss) or OCO (target + stop)
[ ] 3. Check GTTs against current price:
        [ ] Stop-loss GTT: Is trigger price within 8−12% below CMP?
        [ ] Target GTT: Is target still realistic vs intrinsic value?
[ ] 4. Flag GTTs where trigger price is >20% away from CMP (may need update)
[ ] 5. Flag holdings WITHOUT any stop-loss GTT → HIGH RISK ⚠️
[ ] 6. Flag GTTs that triggered overnight → review fills
[ ] 7. Update stale GTTs (older than 30 days without review)
[ ] 8. Log all changes to reports/YYYY-MM-DD_gtt_audit.json
[ ] 9. Confirm no duplicate GTTs on same instrument
[ ] 10. Final count: Active GTTs == Holdings count (every stock protected)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### GTT Placement Rules
```
BUY Position Stop-Loss: Trigger BELOW current price (avg_price × 0.88 = 12% below cost)
SELL Position Target: Trigger ABOVE current price (target price reached)
OCO GTT         : Use for high-conviction deep discount stocks only

🔥 NEW RULE (R-25): SKIP STOP-LOSS GTT IF MoS ≥ 50%
   Rationale: Deep discount stocks should be held through volatility
   Do NOT exit a 50%+ MoS stock on a 12% dip
   Instead: Set trailing target GTT when MoS approaches 30%
```

**CRITICAL: Verify trigger price is correctly positioned relative to current price**
- For BUY holds: Stop-loss trigger < current price
- For new SELL triggers: Target trigger > current price

**MoS-BASED GTT LOGIC:**
```
IF MoS ≥ 50%:
  → SKIP stop-loss GTT (hold through volatility)
  → Set target GTT instead (sell when IV reached)
  → Rationale: Deep value deserves patience
  
IF 25% ≤ MoS < 50%:
  → PLACE stop-loss GTT (moderate protection)
  → Set at avg_price × 0.88 (12% below cost)
  → Rationale: Moderate discount needs downside protection
  
IF MoS < 25%:
  → DO NOT BUY (Rule C-001)
  → If already holding: Review for exit
  → Rationale: Fair/overvalued stocks need protection
```

### KiteMCP Calls
```javascript
kite.getGTTs()
kite.placeGTT({ type, symbol, trigger_price, quantity, order_params })
kite.modifyGTT({ gtt_id, trigger_price, quantity })
kite.deleteGTT({ gtt_id })
```

---

## GATE 3.5 — `gtt-placement-executor`

### Role
Execute approved GTT orders immediately after GATE 3 (intrinsic value screen) completes.
This is a **critical execution gate** that bridges analysis (GATE 3) and reporting (GATE 4).

### Execution Checklist

```
GTT PLACEMENT EXECUTION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] 1. Confirm GATE 3 (intrinsic value screen) is complete
[ ] 2. Confirm user has approved GTT placement decisions:
        [ ] Which GTTs to place (symbol, qty, trigger price)
        [ ] Which GTTs to skip (MoS > 50% threshold or user preference)
        [ ] Accumulation vs stop-loss GTT logic clarified
[ ] 3. For each approved GTT:
        [ ] Validate trigger price direction (BUY = below CMP, SELL = above CMP)
        [ ] Verify quantity is within available margin
        [ ] Confirm no duplicate GTTs on same symbol/direction
        [ ] Log order details: symbol, qty, trigger, type, timestamp
[ ] 4. Execute GTT placements via KiteMCP:
        [ ] Call kite_place_gtt() for each approved GTT
        [ ] Capture GTT ID from response
        [ ] Verify execution success (status = ACTIVE or pending)
[ ] 5. Document all placements:
        [ ] Save to reports/YYYY-MM-DD_gtt_placement.json
        [ ] Include: GTT ID, symbol, qty, trigger, transaction_type, timestamp, status
        [ ] Create audit trail for compliance
[ ] 6. Flag any execution failures:
        [ ] Insufficient margin → pause and report
        [ ] Duplicate GTT error → skip or modify
        [ ] MCP timeout → fallback to manual execution documentation
[ ] 7. Confirm all approved GTTs have been processed
[ ] 8. Update GATE 3.5 status: PASS or FAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### GTT Placement Decision Framework

**BUY GTTs (Accumulation on Dips):**
```
Use when: Stock is in deep discount (MoS 25-50%) and you want to add on further falls
Trigger: BELOW current price (e.g., CMP - 5-10%)
Type: BUY order
Qty: Tranche sizing (avoid 1:1 with existing holding to limit concentration)
Example: CAMS at ₹625.90 CMP → Place BUY GTT at ₹580 (7% below)
```

**SELL GTTs (Downside Protection):**
```
Use when: Stock is moderate discount (MoS < 25%) and needs protection
Trigger: BELOW cost basis (e.g., avg_price × 0.88 = 12% below cost)
Type: SELL order (stop-loss)
Qty: Match current holding quantity
Example: CAMS at avg ₹713.99 → Place SELL STOP at ₹622 (13% below cost)
```

**SKIP GTT (Deep Value Protection):**
```
Use when: Stock is in exceptional discount (MoS ≥ 50%) 
Decision: Skip stop-loss GTT entirely; hold through volatility
Rationale: Fundamental thesis is strong enough; dips are buying opportunities
Instead: Place target GTT when MoS reaches 30% (trailing exit)
Example: ASHOKA (MoS 56.51%) → SKIP stop-loss, hold through 30% dips
```

### Output Format — GTT Placement Log

```json
{
  "execution_date": "2026-03-31",
  "execution_time": "09:30 IST",
  "session_id": "GATE_3.5_20260331_1",
  "placements": [
    {
      "gtt_id": "GTT_20260331_001",
      "symbol": "CAMS",
      "transaction_type": "BUY",
      "trigger_price": 580.00,
      "quantity": 130,
      "current_price": 625.90,
      "trigger_offset_pct": -7.3,
      "rationale": "Accumulation GTT; stock in deep discount MoS 4.5%",
      "status": "ACTIVE",
      "execution_timestamp": "2026-03-31T09:30:15Z",
      "notes": "User approved accumulation strategy for long-term hold"
    },
    {
      "gtt_id": "GTT_20260331_002",
      "symbol": "ENERGY",
      "transaction_type": "BUY",
      "trigger_price": 33.25,
      "quantity": 2000,
      "current_price": 35.00,
      "trigger_offset_pct": -5.0,
      "rationale": "Average down GTT; commodity hedge at NAV",
      "status": "ACTIVE",
      "execution_timestamp": "2026-03-31T09:31:02Z",
      "notes": "User approved 5% dip accumulation strategy"
    }
  ],
  "skipped_gtts": [
    {
      "symbol": "ASHOKA",
      "reason": "MoS 56.51% >= 50% threshold — skip stop-loss per Rule R-25",
      "decision": "Hold through volatility; no GTT"
    },
    {
      "symbol": "VHL",
      "reason": "MoS 74.8% >= 50% threshold — skip stop-loss per Rule R-25",
      "decision": "Hold through volatility; no GTT"
    },
    {
      "symbol": "JINDALPHOT",
      "reason": "User decision: HOLD without GTT action",
      "decision": "Watch for recovery; no GTT placed"
    }
  ],
  "summary": {
    "total_approved": 2,
    "total_executed": 2,
    "total_skipped": 3,
    "total_margin_used": 75250,
    "available_margin_remaining": 1924412,
    "status": "PASS"
  }
}
```

### KiteMCP Execution Template

```javascript
// BUY GTT - Accumulation on dips
await kite.placeGTT({
  exchange: "NSE",
  tradingsymbol: "CAMS",
  transaction_type: "BUY",
  quantity: 130,
  trigger_price: 580.00,
  limit_price: 580.00,  // Limit order on trigger
  product: "CNC",       // CNC = cash and carry (long-term)
  trigger_type: "single"
});

// SELL GTT - Stop-loss protection (if needed)
await kite.placeGTT({
  exchange: "NSE",
  tradingsymbol: "CAMS",
  transaction_type: "SELL",
  quantity: 228,
  trigger_price: 622.00,
  limit_price: 622.00,
  product: "CNC",
  trigger_type: "single"
});
```

### Error Recovery

```
IF margin insufficient:
  → Log error to reports/YYYY-MM-DD_gtt_errors.json
  → Suggest reducing qty or using BOD/MTF instead of CNC
  → Ask user for qty adjustment approval
  → Retry with approved qty

IF duplicate GTT detected:
  → Check if existing GTT matches trigger/qty
  → If YES: Skip placement, mark as "duplicate avoided"
  → If NO: Modify existing GTT via kite.modifyGTT()

IF MCP timeout:
  → Fallback to MANUAL execution
  → Log GTT details to reports/YYYY-MM-DD_manual_gtts.md
  → User executes via Kite web/app
  → Document completion in session log

IF trigger price validation fails:
  → Check direction: BUY GTT must have trigger < CMP
  → Check direction: SELL GTT must have trigger > cost basis
  → Correct and retry with user approval
```

### Rules (Non-Negotiable)

1. **GTTs must execute in SAME SESSION as approval.** No overnight delays.
2. **Every GTT execution logs to JSON** for audit trail and tax reporting.
3. **Stop-loss GTTs skip if MoS ≥ 50%.** Deep value deserves patience.
4. **BUY GTTs use tranche sizing.** Never 1:1 with existing to avoid over-concentration.
5. **Verify KiteMCP margin before executing.** No hard stops due to margin limits.
6. **All GTT IDs captured and stored** for future modification/deletion.

---

## AGENT 4 — `report-generator`

### Role
Compile all scan results into a single daily Word report before market open.
This is the **mandatory daily briefing** — no trades without it.

### Checklist — Daily Report Generation

```
DAILY REPORT CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] 1. Confirm portfolio snapshot exists (Agent 1 output)
[ ] 2. Confirm intrinsic value screen exists (Agent 2 output)
[ ] 3. Confirm GTT audit exists (Agent 3 output)
[ ] 4. Generate report sections:
         [ ] Section 1: ⚠️ IMMEDIATE ACTIONS REQUIRED
                   - Stop-loss triggered
                   - Unprotected holdings
                   - Deep discount alerts (>40% MoS)
                   - Overvalued stocks
                   - Earnings today
         [ ] Section 2: Portfolio Summary (total value, day P&L, total P&L)
         [ ] Section 3: Top Gainers / Losers (day)
         [ ] Section 4: 🔴 Deep Discount Stocks (MoS > 40%)
         [ ] Section 5: Overvalued Holdings (consider trimming)
         [ ] Section 6: GTT Status (protected / unprotected holdings)
          [ ] Section 7: Action Items for Today (buy/hold/trim/exit)
         [ ] Section 8: Market Sentiment Note (Nifty trend, FII/DII data)
         [ ] Section 9: Investment Opportunities (from web search)
                   - Short-term momentum plays
                   - Medium-term value plays
                   - Long-term compounding candidates
         [ ] Section 10: News-Driven Opportunities (from financial news)
                   - Earnings surprises
                   - Corporate actions (dividend, bonus, split)
                   - M&A activity
                   - Regulatory updates
                   - Bulk/block deals
[ ] 5. Save as reports/YYYY-MM-DD/YYYY-MM-DD_daily_report.md
[ ] 6. Update Portfolio_Analysis_Report.xlsx with latest prices
[ ] 7. Confirm file saved with today's date in filename
[ ] 8. Report must exist BEFORE any order is placed today
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Report Filename Convention
```
reports/
├── 2026-03-25_daily_report.md          ← Main briefing
├── 2026-03-25_portfolio_snapshot.json    ← Raw data
├── 2026-03-25_value_screen.json          ← IV calculations
├── 2026-03-25_gtt_audit.json             ← GTT status
├── 2026-03-25_opportunities.json          ← Investment opportunities from web search
├── 2026-03-25_news_opportunities.json    ← News-driven opportunities
└── 2026-03-25_commodity_opportunities.json ← Commodity opportunities
```

---

## AGENT 4.5 — `excel-export`

### Role
Generate comprehensive Excel exports with multiple sheets including holdings, tax summary, dividend tracker, commodities, and weekly summary. Runs after report-generator to provide detailed data in spreadsheet format.

### Excel Sheets

| Sheet | Purpose |
|-------|---------|
| Holdings | Full portfolio with P&L, MoS, actions |
| Tax Summary | Unrealized gains, tax-loss harvesting candidates |
| Dividend Tracker | Dividend yield, ex-dates, expected income |
| Commodities | Gold, Silver, Crude, Natural Gas prices |
| Weekly Summary | Week-over-week performance |

### Checklist — Run After Report Generator

```
EXCEL EXPORT CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] 1. Load all JSON data from reports folder
[ ] 2. Generate Holdings sheet with formulas
[ ] 3. Generate Tax Summary (unrealized gains, tax-loss candidates)
[ ] 4. Generate Dividend Tracker
[ ] 5. Generate Commodities sheet
[ ] 6. Generate Weekly Summary
[ ] 7. Save as reports/Portfolio_YYYY-MM-DD.xlsx
[ ] 8. Verify zero formula errors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Output Files
- Daily: `reports/Portfolio_YYYY-MM-DD.xlsx`
- Weekly: `reports/Weekly_Portfolio_YYYY-MM-DD.xlsx`

---

## AGENT 5 — `order-executor`

### Role
The ONLY agent allowed to place, modify, or cancel orders. Acts only after
Agents 1–4 have completed their checklists and daily report and excel export are confirmed saved.

### Pre-Order Checklist (MANDATORY — Every Single Order)

```
PRE-ORDER CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] 1. Daily report exists for today? (Check reports/ folder)
[ ] 2. Opportunity scan completed today? (Check for new opportunities)
[ ] 3. News scan completed today? (Check for news-driven opportunities)
[ ] 4. Portfolio scan completed today?
[ ] 5. Intrinsic value screen completed today?
[ ] 6. GTT audit completed today?
[ ] 7. Stock is on approved action list in today's report?
[ ] 8. Available margin is sufficient?
[ ] 9. Position size ≤ 10% of total portfolio value?
[ ] 10. For BUY: Margin of Safety > 25%?
[ ] 11. For SELL: Target reached OR stop-loss triggered OR IV < Price?
[ ] 12. GTT stop-loss will be placed immediately after BUY order fills?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If ANY item is unchecked → DO NOT PLACE ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Exit Rules (Only 3 Valid Conditions)

| Condition | Action | When |
|-----------|--------|------|
| `Current Price ≥ IV × 0.95` | SELL | Target reached |
| `GTT stop triggered` | SELL | Stop-loss hit |
| `Fundamentals deteriorated` | SELL | 2Q declining EPS + D/E > 2 |

**NEVER sell based on emotion.**

---

## DAILY SCHEDULE (Option B - Logical Grouping)

```
TIME (IST)   AGENT                 ACTION
──────────────────────────────────────────────────────
GROUP 1: EXTERNAL DATA (08:30-08:50)
08:30        opportunity-scanner   Search internet for investment opportunities
08:30        commodity-scanner    Search MCX commodity prices (PARALLEL)
08:40        news-scanner         Scan financial news for news-driven opportunities
08:50        portfolio-scanner    Fetch holdings, positions, margins

GROUP 2: ANALYSIS (09:00-09:10)
09:00        intrinsic-value      Run value screen on all holdings
09:05        gtt-manager          Audit all GTTs, flag unprotected stocks
09:08        deep-value-screener  Convert deep value markdown to JSON

GROUP 3: OUTPUT & EXECUTION (09:10-09:30)
09:10        report-generator     Compile and save daily report
09:15        excel-export         Generate Portfolio_YYYY-MM-DD.xlsx with tax & dividend
09:20        order-executor       Market opens — execute approved actions only

MID-DAY & EOD
13:00        portfolio-scanner    Mid-day P&L check
15:20        gtt-manager          Pre-close GTT review
15:30        report-generator     EOD summary appended to daily report
```

---

## DEEP DISCOUNT ALERT TEMPLATE

When a stock triggers MoS > 40%, output this alert in the daily report:

```
╔══════════════════════════════════════════════════╗
║           🔴 DEEP DISCOUNT ALERT                 ║
╠══════════════════════════════════════════════════╣
║  Stock         : {SYMBOL}                        ║
║  Current Price : ₹{CMP}                          ║
║  Intrinsic Val : ₹{IV}                           ║
║  Discount      : {MOS}% below fair value         ║
║  Graham Number : ₹{GRAHAM}                       ║
║  DCF Value     : ₹{DCF}                          ║
║  Debt/Equity   : {DE_RATIO}                      ║
║  EPS Trend     : {EPS_TREND}                     ║
╠══════════════════════════════════════════════════╣
║  SIGNAL: STRONG ACCUMULATE                       ║
║  Risk   : Set GTT stop at ₹{STOP}                ║
║  Target : ₹{TARGET} ({UPSIDE}% upside to IV)     ║
╚══════════════════════════════════════════════════╝
```

---

## opencode.json Reference

```json
{
  "agents": {
    "opportunity-scanner":   { "file": "prompts/opportunity_scanner.md" },
    "portfolio-scanner":      { "file": "prompts/portfolio_scan.md" },
    "intrinsic-value-scanner":{ "file": "prompts/intrinsic_value.md" },
    "gtt-manager":            { "file": "prompts/gtt_manager.md" },
    "report-generator":       { "file": "prompts/report_generator.md" },
    "order-executor":         { "file": "prompts/order_executor.md" }
  },
  "mcp": {
    "kite": {
      "command": "node",
      "args": ["kite-mcp-server/index.js"],
      "env": {
        "KITE_API_KEY": "${KITE_API_KEY}",
        "KITE_ACCESS_TOKEN": "${KITE_ACCESS_TOKEN}"
      }
    }
  },
  "daily_workflow": [
    "opportunity-scanner",
    "portfolio-scanner",
    "intrinsic-value-scanner",
    "gtt-manager",
    "report-generator"
  ]
}
```

---

## Rules (Non-Negotiable)

1. **No order without today's report.** The report filename date must match today.
2. **Every holding must have a GTT stop-loss.** No naked positions.
3. **Only buy stocks with MoS > 25%.** Prefer > 40% for new positions.
4. **No single stock > 10% of portfolio.** Hard cap.
5. **Deep discount ≠ buy signal alone.** Verify fundamentals first (debt, earnings trend).
6. **GTT triggers must be reviewed every 30 days.** Prices drift — triggers go stale.
7. **All agent outputs saved to `reports/` before next agent runs.**

---

## India Stock Analysis Skill

Use this skill when analyzing Indian stocks on NSE/BSE. Load via: `/skill india-stock-analysis`

### Available Analysis Types

1. **Basic Stock Information** — Quick overview, current price, key metrics
2. **Fundamental Analysis** — Business quality, financials, valuation, investment merit
3. **Technical Analysis** — Chart patterns, entry/exit levels, trading signals
4. **Comprehensive Investment Report** — Full report with all of the above (default)

### KiteMCP Tools for Stock Analysis
```
kite_get_ltp(instruments)           # Current price
kite_get_quotes(instruments)        # Market quotes with depth
kite_get_ohlc(instruments)          # OHLC data
kite_get_historical_data(...)       # Historical candles
kite_search_instruments(query)      # Find trading symbols
```

### Fundamental Data Source: screener.in
**KiteMCP does NOT provide fundamentals (EPS, Book Value, P/E, D/E, etc.).**

For intrinsic value calculations, ALWAYS fetch live data from screener.in:
```
Web Search: "screener.in {SYMBOL} fundamental analysis"
```
Required metrics for Graham Number / DCF:
- EPS (TTM)
- Book Value Per Share
- P/E Ratio
- P/B Ratio
- Debt/Equity Ratio
- ROE
- Dividend Yield

### Analysis Output Format

When generating stock analysis reports, include:
- Executive Summary with recommendation (Buy/Hold/Sell)
- Business overview and sector classification
- Fundamental metrics table (PE, PB, ROE, D/E, etc.)
- Technical levels table (support/resistance)
- Recent news summary
- Peer comparison when applicable
- Standard disclaimer

### India-Specific Considerations
- All prices in INR (Rs.)
- Use Cr (Crore) and L (Lakh) for large numbers
- FY April-March convention
- Market hours: 9:15 AM - 3:30 PM IST
- Promoter holding >50% positive, <30% caution
- Promoter pledge >20% red flag
- NSE preferred over BSE for liquidity

---

- **pandoc**: Text extraction
- **LibreOffice**: PDF conversion

---

## Build & Test Commands

### Install Dependencies
```bash
```

### Run Portfolio Report Generator
```bash
node src/create_master_markdown.js
```
Output saved to `reports/YYYY-MM-DD/YYYY-MM-DD_daily_report.md`

### Testing
No formal tests in this project. To add:
- Jest: `npm install --save-dev jest`
- Run single test: `npx jest --testPathPattern=<pattern>`

### Linting
No linter configured. To add ESLint: `npm init @eslint`

---

## Code Style Guidelines

### General Principles
- Write clear, readable code over clever one-liners
- Use meaningful variable and function names
- Keep functions focused on single responsibility

### JavaScript Conventions
- Use `const` by default, `let` when reassignment needed, avoid `var`
- Use ES6+ features: arrow functions, template literals, destructuring, async/await
- Use `require()` for Node.js modules
- Use `camelCase` for variables/functions, `PascalCase` for classes


### Error Handling
```javascript
try {
    const data = fs.readFileSync('file.txt', 'utf8');
} catch (err) {
    console.error('Failed to read file:', err.message);
    throw err;
}
```

---

## MCP Resilience (KiteMCP Fallback)

### Known Issues (per learnings.md)
- **T-004**: OAuth session_id error on remote MCP server
- **T-005**: MCP tools not available in build mode despite config

### Fallback Protocol
```
1. Test MCP availability at session start: kite.getProfile()
2. If failed → Try kite_login() to refresh session
3. If still failed → Use MANUAL EXECUTION mode:
   [ ] Generate order details (symbol, qty, price, type)
   [ ] Save to reports/YYYY-MM-DD_manual_orders.md
   [ ] User executes orders via Kite web/mobile app
   [ ] Document completion in learnings.md
4. Continue workflow with available data
```

### Manual Order Documentation
When MCP fails, document orders in this format:
```markdown
## MANUAL ORDER: 2026-03-27
- Order #1: BUY 435 ASHOKA @ 114.9 (CNC, Qty: 435)
- Status: PENDING_USER_EXECUTION
- Placed by: User via Kite App
```

---

## Current Portfolio Status (2026-03-26)

### Holdings Summary
| Symbol | Company Name | Qty | Avg Price | CMP | P&L % | Status |
|--------|-------------|-----|-----------|-----|-------|--------|
| CAMS | Computer Age Mgmt Services | 228 | 713.99 | 644.2 | -9.77% | HOLD |
| ENERGY | Nifty Energy Index | 2571 | 36.08 | 35.71 | -1.03% | HOLD |
| JINDALPHOT | Jindal Photo Ltd | 85 | 1320.71 | 1096.3 | -16.99% | TRIM |
| NXST-RR | Nexus Select Trust REIT | 650 | 135.19 | 155.52 | +15.08% | HOLD |
| TMCV | Tata Motors (CV) | 110 | 355.37 | 431.85 | +21.53% | ACCUMULATE |
| VHL | **Vardhaman Holdings Ltd** | 35 | 3608.39 | 3143.4 | -12.88% | HOLD |

### Total Portfolio
- **Market Value**: ₹5,90,491
- **Total P&L**: -₹40,588 (-6.43%)
- **Available Margin**: ₹19,99,662

### Deep Discount Opportunities (MoS > 40%)
- **TMCV**: CMP ₹432 vs IV ₹707 (38.9% discount) → ACCUMULATE
- **VHL**: CMP ₹3,143 vs IV ₹5,200 (39.5% discount) → ACCUMULATE

### Overvalued Holdings (Consider Trimming)
- CAMS, JINDALPHOT, NXST-RR, ENERGY
