# Stock Analysis Framework — Reference Document

> → import `_base.md` first (shared analyst context, rules, and scoring)

> This file defines the **structured analysis workflow** and **output format** for comprehensive
> stock portfolio analysis. It serves as the master reference for the analysis methodology.
> Valuation methods and rules live in `_base.md` — this file defines the *workflow*.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v2.0 | 2026-03-29 | Converted from YAML to markdown, aligned with `_base.md` v2.0, removed duplicate content |
| v1.2 | 2026-03-28 | Added `_base.md` reference, version tracking, clarified CAMS as payment infra |
| v1.1 | 2026-03-27 | Added P-009 stock name verification rule |
| v1.0 | 2026-03-25 | Initial version |

---

## Objective

Analyze the stock portfolio from Zerodha Kite MCP, evaluate performance,
identify risks, incorporate latest market/news insights, and generate
timestamped reports with a clear, actionable investment strategy.

---

## Metadata (include in every report)

```
Report Timestamp  : {{current_timestamp}}  (ISO 8601, e.g. 2026-03-29T07:30:00+05:30)
Report Version    : v2.0
Analyst           : AI Portfolio Advisor
Market            : India (NSE/BSE)
Currency          : INR (₹)
```

---

## Inputs Required

### 1. Portfolio Data (from KiteMCP)
- Holdings: stock name, quantity, average price, current price, P&L
- Sector classification (from screener.in or BSE)
- Allocation percentage (computed)

### 2. Screener Data (from Screener.in — MANDATORY per R-06)
For each stock, fetch from `https://www.screener.in/company/{SYMBOL}/`:
- Market Cap, Current Price, 52-week High/Low
- Stock P/E, Book Value, Dividend Yield
- ROCE, ROE, Face Value
- Pros/Cons listed on screener page

### 3. User Profile
- Risk appetite: `moderate` | `aggressive` | `conservative`
- Investment horizon: `short_term` | `medium_term` | `long_term`
- Available cash: optional

### 4. Market Context
- Latest news affecting holdings
- Macro trends (interest rates, inflation, FII/DII flows)

---

## Analysis Steps (Execute in Order)

### Step 1: Portfolio Overview
- Calculate total portfolio value
- Sector-wise allocation
- Top gainers and losers
- Concentration risks (R-10, R-11)

### Step 2: Screener Fundamentals
- Fetch data from Screener.in for each stock
- Extract: P/E, P/B, Book Value, ROE, ROCE, Dividend Yield
- Include Market Cap and 52-week High/Low
- Note Pros and Cons from screener page
- Compare fundamentals across portfolio

### Step 3: Intrinsic Value Assessment
- **Use stock-type specific method** (see `_base.md` Method by Stock Type table)
- If EPS < 0 → skip Graham Number (R-17), use P/B or DCF only
- Compare CMP vs Intrinsic/Fair Value
- Calculate Margin of Safety
- Classify: DEEP DISCOUNT / MODERATE DISCOUNT / FAIRLY VALUED / OVERVALUED

### Step 4: Stock-Level Analysis (per holding)
- Fundamental strength (growth, profitability, debt)
- Technical trend (support/resistance, direction)
- Valuation assessment based on screener data
- Recent news impact

### Step 5: Risk Assessment
- Overexposure to sectors or single stocks (R-10, R-11)
- High volatility or weak fundamentals (low ROE, high P/E)
- Macro risks (interest rates, inflation, global markets)
- Holding company discount risk

### Step 6: Market & News Integration
- Latest relevant news affecting holdings
- Sectoral trends (IT, Banking, Energy, Pharma, etc.)
- Policy or global triggers

### Step 7: Opportunity Identification
Search for opportunities across three horizons:
- **Short-Term** (1-4 weeks): Momentum/swing, breakouts, FII/DII flows
- **Medium-Term** (3-12 months): Value + growth, quarterly results, sector trends
- **Long-Term** (1-3+ years): Deep value, blue chips, dividend growers

Filter: Market cap > 500 Cr, P/E < 30 (medium) / < 20 (long), D/E < 1.5, Promoter > 50%

### Step 8: Action Plan
- Stocks to **HOLD** with reasoning
- Stocks to **BUY MORE** with entry range
- Stocks to **SELL / EXIT** with justification (only 3 valid exit conditions — see `_base.md`)
- Suggested allocation of available cash

---

## Output Format

### Report Header
- Report Timestamp, Version, Market Status (Pre-market / Live / Post-market)
- Analyst Note: "Auto-generated AI portfolio analysis"

### Executive Summary
- Overall portfolio health: Good / Moderate / Risky
- Key strengths
- Key risks
- Immediate actions required

### Holdings with Fundamentals Table
| Symbol | Company | Exchange | Qty | Avg Price | CMP | P/E | P/B | Book Value | ROE% | ROCE% | Div Yield% | Market Cap (Cr) |
|--------|---------|----------|-----|-----------|-----|-----|-----|------------|------|-------|------------|-----------------|

### Intrinsic Value Table
| Symbol | CMP | Book Value | IV (Method) | Fair Value Range | Valuation | MoS% |
|--------|-----|------------|-------------|------------------|-----------|------|

### P&L Summary Table
| Stock | Investment (₹) | Current Value (₹) | P&L (₹) | P&L% |
|-------|----------------|-------------------|---------|------|

### Portfolio Action Table
| Stock | Sector | Action | Reason | Target Price | Stop Loss | Confidence |
|-------|--------|--------|--------|-------------|-----------|------------|

### Opportunities
| Stock/ETF | Rationale | Entry Range | Time Horizon | Risk Level |
|-----------|-----------|-------------|--------------|------------|

### Strategy
- **Short-term (0-3M)**: Tactical moves based on market trend
- **Medium-term (3-12M)**: Portfolio rebalancing strategy
- **Long-term**: Compounding strategy and asset allocation

### Risk Management
- Diversification suggestions
- Capital protection strategy
- Hedging (if applicable)
- Rebalancing triggers

### Audit Trail
- Decision log with timestamps
- Change tracking from previous version

### Next Review
- Recommended review date: {{current_date + 7 days}}
- Triggers: Market correction >5%, major news, quarterly results

---

## Guidelines (from `_base.md`)
- Avoid generic advice — be specific and data-driven
- Base suggestions on Indian market conditions
- Prioritize capital protection along with growth
- Clearly separate facts vs assumptions
- Do NOT hallucinate stock data (R-09)
- ALWAYS fetch Screener.in data (R-06)
- ALWAYS calculate intrinsic value per stock type
- ALWAYS verify stock name before analysis (R-08)

---

*This file replaces the legacy `stock.yaml`. All valuation rules live in `_base.md`.*
