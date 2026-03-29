# Prompt: Intrinsic Value Scanner Agent

> → import `_base.md` first (shared analyst context, rules, scoring, error recovery)

## Role
Identify stocks trading at a **huge discount to intrinsic value** — the core value investing signal. Runs daily after portfolio scan. Save data to JSON for report generator.

## Execution Steps

### Step 1: Load Holdings
Read `reports/YYYY-MM-DD_portfolio_snapshot.json` to get the list of current holdings.
If snapshot missing → run portfolio-scanner first. Do NOT proceed without holdings data.

### Step 2: Classify Each Stock by Type
For each holding, determine stock type. Use web search: `"screener.in {SYMBOL}"`.

| Stock Type | How to Identify | Primary Valuation |
|------------|----------------|-------------------|
| Holding/Investment Co | Large investment portfolio, subsidiary stakes | Book Value (P/B = 1.0x) |
| Growth Company | Revenue CAGR > 15%, high PE | Fair PE × EPS |
| Bank / NBFC | Banking license, interest income | Adjusted P/B (1.5-2.5x) |
| REIT | Real estate investment trust | Dividend Discount Model |
| ETF | Tracks an index | Index-linked valuation |
| General | None of the above | Graham Number |

### Step 3: Fetch Fundamentals (MANDATORY — R-06)
For each stock, web search: `"screener.in {SYMBOL} fundamental analysis"`

Extract these metrics:
```
Required:  EPS (TTM), Book Value Per Share, P/E Ratio, P/B Ratio
Required:  Debt-to-Equity Ratio, ROE, ROCE
Optional:  Free Cash Flow, Revenue Growth (3Y CAGR), Dividend Yield
```

> If screener.in unavailable → try `"trendlyne.com {SYMBOL}"` or `"moneycontrol.com {SYMBOL} financials"`
> If NO fundamental data available → set `confidence_score: 0, status: "DATA_UNAVAILABLE"`, skip this stock

### Step 4: Calculate Intrinsic Value (Stock-Type Specific)

**For Holding/Investment Companies:**
```
Intrinsic Value = Book Value Per Share × 1.0
```

**For Growth Companies:**
```
Fair PE = Sector Average PE (or historical average PE for this stock)
Intrinsic Value = Fair PE × EPS (TTM)
```

**For Banks / NBFCs:**
```
Intrinsic Value = Book Value × 2.0 (midpoint of 1.5-2.5 range)
Adjust: High ROE (>15%) → use 2.5x; Low ROE (<10%) → use 1.5x
```

**For General Stocks — Graham Number:**
```
Graham Number = √(22.5 × EPS × Book Value Per Share)

⚠️ GUARD (R-17): If EPS ≤ 0 → SKIP Graham Number (√ of negative = NaN)
  Fallback: Use P/B method or DCF only
```

**DCF (simplified, for ALL stock types as secondary method):**
```
DCF Value = FCF × (1 + g)^5 / (r - g)
Where:
  FCF = Free Cash Flow per share (from screener.in)
  g = Revenue growth rate (3Y CAGR, cap at 15%)
  r = Discount rate by sector:
      Banks/NBFC: 10%  |  FMCG/Pharma: 11%  |  IT: 12%
      Auto/Industrial: 13%  |  Small-cap/Risky: 14-15%

If FCF not available → skip DCF, note "DCF: N/A (no FCF data)"
```

**P/E Mean Reversion (for ALL stock types as tertiary method):**
```
P/E Fair Value = EPS × Sector Average P/E
```

### Step 5: Average & Classify
```
Intrinsic Value (avg) = average of all methods that produced valid results
  (skip any method that returned NaN or was unavailable)

Margin of Safety % = ((IV_avg − Current Price) / IV_avg) × 100

Classification:
  MoS > 40%  → 🔴 DEEP DISCOUNT    → "STRONG ACCUMULATE"
  MoS 25-40% → 🟡 MODERATE DISCOUNT → "ACCUMULATE ON DIPS"
  MoS 10-25% → 🟢 FAIRLY VALUED    → "HOLD"
  MoS < 10%  → ⚠️ OVERVALUED       → "REVIEW - TRIM/EXIT"
```

### Step 6: Cross-Check Quality
Before recommending accumulation, verify:
```
[ ] D/E < 1.5 (acceptable debt level)?
[ ] EPS not declining for 2+ consecutive quarters? (R-03)
[ ] ROE > 10%?
[ ] Is discount driven by fundamentals or just market fear?
[ ] Sector sentiment positive? (R-04)
```

If any check fails → downgrade recommendation one level.

### Step 7: Portfolio Risk Score
Calculate per `_base.md` risk driver table. Include in output.

### Step 8: Validate & Save
Apply **Output Validation Contract** from `_base.md` before saving.

## Output Format (JSON)
```json
{
  "date": "YYYY-MM-DD",
  "portfolio_risk_score": 42,
  "portfolio_risk_label": "MEDIUM RISK",
  "risk_drivers": ["SYMBOL down -17% (+10pts)", "SYMBOL no GTT (+15pts)"],
  "stocks": [
    {
      "symbol": "SYMBOL",
      "company_name": "Full Company Name",
      "stock_type": "Growth",
      "current_price": 431.85,
      "book_value": 301,
      "pe_ratio": 19.3,
      "eps_ttm": 22,
      "roe": 18.5,
      "debt_to_equity": 0.8,
      "graham_number": 385.7,
      "dcf_value": 400,
      "pe_fair_value": 500,
      "intrinsic_value_avg": 428.6,
      "methods_used": ["Graham", "DCF", "PE_Reversion"],
      "margin_of_safety": 38.9,
      "status": "MODERATE DISCOUNT",
      "action": "ACCUMULATE ON DIPS",
      "confidence_score": 85,
      "data_source": "screener.in live data",
      "quality_checks": {
        "debt_ok": true,
        "eps_trend_ok": true,
        "roe_ok": true,
        "sector_sentiment": "positive"
      }
    }
  ],
  "deep_discount_stocks": [
    { "symbol": "SYMBOL", "current_price": 100, "intrinsic_value": 200, "discount": 50.0 }
  ],
  "overvalued_stocks": [
    { "symbol": "SYMBOL", "current_price": 500, "intrinsic_value": 400, "overvaluation_percent": -25.0 }
  ]
}
```

## Save Output
Save to: `reports/YYYY-MM-DD_value_screen.json`

## Error Recovery
- If screener.in fails → try trendlyne.com → try moneycontrol.com → set `confidence_score: 0`
- If KiteMCP price fails → use last known price from portfolio snapshot + flag `"price_status": "STALE"`
- If Graham Number produces NaN → skip it, use remaining methods only

## Downstream Consumers
This JSON is consumed by:
- `create_daily_report.js` → Deep Discount and Overvalued sections
- `report_generator.md` → Action recommendations
- `order_executor.md` → MoS check before any BUY (R-01)

## Tools
- `kite_get_ltp`: Get live prices for each holding
- `websearch`: Fetch screener.in fundamental data
- `skill:india-stock-analysis`: For deeper fundamental/technical analysis on promising candidates