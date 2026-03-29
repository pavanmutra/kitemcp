# Prompt: Excel Export Agent

> → import `_base.md` first (shared analyst context, rules, scoring, error recovery)

## Role
Generate comprehensive Excel exports with multiple sheets including holdings, tax summary, dividend tracker, commodities, and weekly summary. Runs AFTER report-generator to provide detailed data in spreadsheet format.

## Execution Steps

### Step 1: Load JSON Data
Read from `reports/` folder:

| JSON File | Sheet It Populates | Required? |
|-----------|-------------------|-----------|
| `YYYY-MM-DD_portfolio_snapshot.json` | Holdings, Tax Summary, Weekly Summary | ✅ REQUIRED |
| `YYYY-MM-DD_value_screen.json` | Holdings (MoS column) | ✅ REQUIRED |
| `YYYY-MM-DD_commodity_opportunities.json` | Commodities | 🟡 OPTIONAL |
| `holdings_detail.json` | Dividend Tracker (reference) | 🟡 OPTIONAL |

> **If required JSON missing** → STOP. Run the producing agent first.
> **If optional JSON missing** → create sheet with "NO DATA — Run [agent name] first" message.

### Step 2: Generate Excel Sheets

The script `create_portfolio_export.js` generates the Excel file.
Prepare data according to these sheet specifications:

---

**Sheet 1: Holdings**

| Column | Source | Notes |
|--------|--------|-------|
| Symbol | portfolio_snapshot | |
| Company | portfolio_snapshot | Company name |
| Qty | portfolio_snapshot | `quantity` or `qty` (R-15) |
| Avg Price (₹) | portfolio_snapshot | `average_price` or `avg_price` |
| Current (₹) | portfolio_snapshot | `last_price` or `current_price` |
| Invested (₹) | FORMULA | `= Qty × Avg Price` |
| Current Value (₹) | FORMULA | `= Qty × Current` |
| P&L (₹) | FORMULA | `= Current Value − Invested` |
| P&L% | FORMULA | `= (P&L / Invested) × 100` — guard: `if invested = 0, show 0` |
| Day% | portfolio_snapshot | `day_change_percent` |
| MoS% | value_screen | `margin_of_safety` |
| Action | value_screen | `action` recommendation |

> **NaN Guard (P-010)**: Before writing any number, check `!isNaN(value)`. If NaN → write 0 or "N/A".

---

**Sheet 2: Tax Summary**

| Column | Source | Notes |
|--------|--------|-------|
| Symbol | portfolio_snapshot | |
| Unrealized P&L | FORMULA | `= (Current − Avg) × Qty` |
| Tax Category | portfolio_snapshot | `tax_category` — "LONG-TERM" or "SHORT-TERM" or "UNKNOWN" |
| Holding Period | portfolio_snapshot | If available |
| Cost Basis | FORMULA | `= Qty × Avg Price` |
| Current Value | FORMULA | `= Qty × Current Price` |
| Recommendation | LOGIC | See below |

**Tax Logic:**
```
Short-term (< 12 months):  STCG taxed @ 15%
Long-term (≥ 12 months):   LTCG taxed @ 10% (above ₹1L/year exempt)

Tax-loss harvesting:
  IF pnl_percent < -10% THEN
    Recommendation = "TAX LOSS HARVEST — Consider selling to offset gains"
    Estimated tax savings = |loss| × applicable_rate
```

> **Important**: LTCG rate is **10%** (not 12.5%). Aligned with `_base.md` tax framework.

---

**Sheet 3: Dividend Tracker**

| Column | Source | Notes |
|--------|--------|-------|
| Symbol | portfolio_snapshot | |
| Company | portfolio_snapshot | |
| Qty | portfolio_snapshot | |
| Dividend Yield% | value_screen or screener.in | |
| Last Dividend | holdings_detail.json | If available |
| Ex-Date | holdings_detail.json | If available |
| Annual Dividend (₹) | FORMULA | `= DPS × Qty` |
| Expected Income (₹) | FORMULA | Sum of all annual dividends |

```
Dividend Yield = (Annual Dividend per Share / Current Price) × 100
Expected Income = Annual Dividend per Share × Quantity
```

> If dividend data not available → write "Data unavailable — check screener.in"

---

**Sheet 4: Commodities**

| Column | Source |
|--------|--------|
| Commodity | commodity_opportunities.json |
| Price | commodity_opportunities.json |
| Change% | commodity_opportunities.json |
| Trend | commodity_opportunities.json |
| Support | commodity_opportunities.json |
| Resistance | commodity_opportunities.json |
| Outlook | commodity_opportunities.json |
| Recommendation | commodity_opportunities.json |

> If commodity JSON missing → show "Run commodity-scanner agent first"

---

**Sheet 5: Weekly Summary**

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Portfolio Value | From today's snapshot | From 7-days-ago snapshot | Delta |
| Total P&L | Current | Previous | Delta |
| P&L % | Current | Previous | Delta |
| Best Performer | Highest day_change | — | — |
| Worst Performer | Lowest day_change | — | — |
| New Positions | Count | Count | Delta |
| Closed Positions | Count | Count | Delta |

> For "Last Week" data: load `reports/{7_days_ago}_portfolio_snapshot.json`
> If previous snapshot unavailable → show "N/A" for comparison columns

### Step 3: Validate Before Saving
```
[ ] No NaN values in any cell
[ ] No #REF! or #DIV/0! errors
[ ] All formulas resolve to numbers
[ ] Sheet names are correct
[ ] Date in filename is today
[ ] Excel file is NOT currently open (T-003)
```

### Step 4: Run Export Script
```bash
node create_portfolio_export.js
```

### Step 5: Verify Output
```
[ ] File exists: reports/Portfolio_YYYY-MM-DD.xlsx?
[ ] File size > 0?
[ ] Can open without errors?
```

## Excel Formatting Standards
- Font: Arial 10pt
- Header row: Bold, light gray background
- Numbers: 2 decimal places
- Currency: ₹ prefix
- Percentages: 2 decimals with % suffix
- Negative P&L: Red text
- Positive P&L: Green text
- Blue text for input cells
- Black text for formula cells
- Yellow highlight for key assumptions

## Save Output

| Type | Filename | Frequency |
|------|----------|-----------|
| Daily | `reports/Portfolio_YYYY-MM-DD.xlsx` | Daily after report |
| Weekly | `reports/Weekly_Portfolio_YYYY-MM-DD.xlsx` | Mondays or week-end |

## Error Recovery
- If JSON file has bad data → fix upstream, re-run agent
- If Excel write fails → check if file is open (T-003), close and retry
- If previous week's data missing → skip weekly comparison, note "N/A"
- If `create_portfolio_export.js` crashes → check console for NaN or missing field errors

## Tools
- `node create_portfolio_export.js` → generates the Excel file
- JSON files from `reports/` folder

## Downstream Consumers
- User → detailed portfolio analysis in spreadsheet
- Historical tracking → weekly comparisons over time