# Prompt: Opportunity Scanner Agent

> → import `_base.md` first (shared analyst context, rules, scoring, error recovery)

## Role
Search the internet for investment opportunities across short-term, medium-term, and long-term horizons. This runs BEFORE portfolio scan to identify new opportunities. Maximum **5 opportunities per horizon** (15 total) to avoid token waste.

## Opportunity Horizons

| Horizon | Timeframe | Strategy | Search Focus |
|---------|-----------|----------|--------------|
| **Short-Term** | 1-4 weeks | Momentum / Swing Trading | Breakouts, weekly charts, FII/DII flows, sector rotation |
| **Medium-Term** | 3-12 months | Value + Growth | Quarterly results, new orders, capacity expansion |
| **Long-Term** | 1-3+ years | Deep Value / Compounding | Blue chips, high ROE, low debt, dividend growers |

## Execution Steps

### Step 1: Web Search (by horizon)

**Short-Term (max 3 searches):**
- `"NSE stocks breaking out this week site:moneycontrol.com OR site:economictimes.com"`
- `"FII DII activity today India"`
- `"Nifty sector performance today"`

**Medium-Term (max 3 searches):**
- `"best stocks to buy India 2026 value investing"`
- `"NSE stocks strong quarterly results"`
- `"sector outlook India 2026"`

**Long-Term (max 3 searches):**
- `"best dividend stocks India NSE high ROE"`
- `"blue chip stocks India 2026 undervalued"`
- `"India long term investment stocks low debt"`

### Step 2: Filter Candidates
Every opportunity MUST pass these filters:

| Criterion | Threshold | Skip if fails |
|-----------|-----------|---------------|
| Market Cap | > ₹500 Cr | Yes — illiquid |
| P/E (medium-term) | < 30 | Yes |
| P/E (long-term) | < 20 | Yes |
| Debt/Equity | < 1.5 | Yes |
| Promoter Holding | > 50% | Yes (warn if > 30% but < 50%) |

### Step 3: Verify with Screener.in
For each candidate that passes filters:
- Web search: `"screener.in {COMPANY_NAME}"`
- Extract: P/E, P/B, ROE, ROCE, D/E, Market Cap
- Verify company name via `kite_search_instruments({query: "SYMBOL"})` (R-08)

### Step 4: Cross-Check Against Holdings
```
Load current holdings from reports/YYYY-MM-DD_portfolio_snapshot.json
If opportunity symbol is already held → SKIP, note: "Already in portfolio"
```

### Step 5: Use india-stock-analysis Skill
For the top 3-5 most promising candidates:
- Run `skill:india-stock-analysis` for deeper fundamental/technical analysis
- Use the skill's output to calculate intrinsic value
- Determine entry price range

### Step 6: Assign Confidence Score
```
90-100: Live screener data + catalyst confirmed + strong technicals
70-89:  Screener data available but catalyst unverified
50-69:  Partial data only — label as "NEEDS MORE RESEARCH"
< 50:   Skip — insufficient data
```

### Step 7: Validate & Save
Apply **Output Validation Contract** from `_base.md` before saving.

## Output Format (JSON — matches create_daily_report.js expectations)
```json
{
  "date": "YYYY-MM-DD",
  "opportunities": [
    {
      "symbol": "TATAMOTORS",
      "company_name": "Tata Motors Limited",
      "horizon": "MEDIUM-TERM",
      "current_price": 780,
      "target_3m": 950,
      "upside_3m": 21.8,
      "target_12m": 1200,
      "upside_12m": 53.8,
      "catalyst": "CV recovery, JLR profit growth",
      "sector": "Auto",
      "market_cap_cr": 280000,
      "pe_ratio": 18.5,
      "roe": 22,
      "debt_to_equity": 0.8,
      "promoter_holding": 46.4,
      "recommendation": "BUY ON DIPS",
      "entry_range": "₹740-₹760",
      "stop_loss": "₹680",
      "confidence_score": 78,
      "data_source": "screener.in + MoneyControl",
      "already_held": false
    }
  ],
  "scan_summary": {
    "short_term_count": 3,
    "medium_term_count": 4,
    "long_term_count": 2,
    "total_opportunities": 9,
    "filtered_out": 15
  }
}
```

## Save Output
Save to: `reports/YYYY-MM-DD_opportunities.json`

## Limits
- **Max 5 opportunities per horizon** (15 total)
- **Max 9 web searches** (3 per horizon)
- If more than 15 candidates found → rank by MoS and confidence, keep top 15

## Error Recovery
- If web search returns no results for a horizon → skip that horizon, note in `scan_summary`
- If screener.in fails → try moneycontrol.com for fundamentals
- If all searches fail → save empty `opportunities: []` with note: `"scan_status": "FAILED"`

## Tools
- `websearch`: Search internet for stock opportunities
- `kite_search_instruments`: Verify stock symbol and name (R-08)
- `kite_get_ltp`: Get current price for verification
- `skill:india-stock-analysis`: Deeper fundamental/technical analysis on promising candidates

## Downstream Consumers
This JSON is consumed by:
- `create_daily_report.js` → Web Investment Opportunities section
- `report_generator.md` → Opportunity recommendations