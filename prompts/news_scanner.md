# Prompt: News Scanner Agent

> → import `_base.md` first (shared analyst context, rules, scoring, error recovery)

## Role
Scan financial news daily to identify investment opportunities based on recent events, corporate announcements, sector developments, and market-moving headlines. Runs alongside opportunity scanner to provide news-driven insights.

## Execution Steps

### Step 1: Fetch Today's Market News
Run these web searches (max 5 searches):

```
1. "India stock market news today site:moneycontrol.com"
2. "India market today site:economictimes.indiatimes.com"
3. "NSE BSE announcements today bulk deals"
4. "SEBI circular 2026" OR "RBI policy update 2026"
5. "India quarterly results today"
```

**Also use**: `skill:india-news-tracker` for structured daily news briefing.

### Step 2: Filter by Recency
```
ONLY include news from the past 24 hours.
If news is > 24 hours old → SKIP (likely already priced in)
Exception: Corporate actions with future ex-dates (include regardless of age)
```

### Step 3: Deduplicate
```
Same event reported by multiple sources → keep the HIGHEST IMPACT version
Group by stock symbol:
  If MoneyControl + Economic Times both cover HDFCBANK bonus → keep MoneyControl (primary source)
```

### Step 4: Categorize by Impact (1-10 Scale)

| Score | Level | What It Means | Example |
|-------|-------|---------------|---------|
| 9-10 | **CRITICAL** | Market-wide impact | RBI rate decision, SEBI major circular |
| 7-8 | **HIGH** | Sector or large-cap | Reliance results, banking policy |
| 5-6 | **MEDIUM** | Single stock significant | Mid-cap order win, bonus announcement |
| 3-4 | **LOW** | FYI only | Analyst target change, minor news |
| 1-2 | **NOISE** | Skip entirely | Rumor, unverified tip |

### Step 5: Classify Opportunity Type

| Type | Signal | Action Template |
|------|--------|-----------------|
| **EARNINGS** | Results beat/miss expectations | Check price reaction, look for continuation if beat |
| **CORPORATE_ACTION** | Dividend/bonus/split/buyback | Calculate yield, check ex-date proximity |
| **M&A** | Merger, acquisition, stake sale | Identify beneficiary, check valuation gap |
| **REGULATORY** | SEBI circular, RBI policy | Assess sector impact, identify winners/losers |
| **BULK_DEAL** | Large institutional transaction | Follow smart money, check promoter buying/selling |
| **NEW_ORDERS** | Major order win, contract | Calculate revenue impact as % of current revenue |
| **MANAGEMENT** | CEO appointment, board change | Assess leadership quality vs predecessor |
| **SECTOR_ROTATION** | Policy change affecting sector | Rotate into beneficiaries, exit impacted |

### Step 6: Check if Already Priced In
```
Decision tree for each news item:
  1. When did news break? 
     - Pre-market today → NOT priced in (opportunity exists)
     - During yesterday's trading → PARTIALLY priced in
     - > 24 hours ago → FULLY priced in (skip)
  
  2. What's the price reaction?
     - Price moved > 2% from prev close → Market is reacting
     - Volume > 2x 20-day average → Strong institutional reaction
     - No movement → Market doesn't care OR hasn't opened yet
  
  3. Is there a continuation opportunity?
     - Earnings beat + price up only 2% → More upside likely
     - M&A announced + target still below offer → Arbitrage exists
     - Corporate action announced + ex-date > 1 week → Window open
```

### Step 7: Verify with KiteMCP
For promising news-driven opportunities:
```
Call: kite_get_ltp(instruments: ["NSE:SYMBOL"]) → verify current price
Call: kite_get_quotes(instruments: ["NSE:SYMBOL"]) → check volume
```

### Step 8: Cross-Check Against Holdings
```
Load portfolio from reports/YYYY-MM-DD_portfolio_snapshot.json
If news affects a CURRENT HOLDING → flag as "PORTFOLIO ALERT" (higher priority)
If news is about a NEW stock → flag as "NEW OPPORTUNITY"
```

### Step 9: Validate & Save
Apply **Output Validation Contract** from `_base.md` before saving.

## Output Format (JSON — matches create_daily_report.js expectations)
```json
{
  "date": "YYYY-MM-DD",
  "scan_time": "09:00 IST",
  "news": [
    {
      "source": "MoneyControl",
      "headline": "Reliance Q3 PAT beats estimates by 15%",
      "news_date": "YYYY-MM-DD",
      "impact": 7,
      "type": "EARNINGS",
      "symbol": "RELIANCE",
      "sentiment": "BULLISH",
      "price_reaction": "+2% gap up, high volume",
      "priced_in": false,
      "affects_holding": false,
      "action": "WATCH — verify continuation",
      "confidence_score": 75
    },
    {
      "source": "BSE Corporate Filing",
      "headline": "HDFC Bank announces 1:1 bonus",
      "news_date": "YYYY-MM-DD",
      "impact": 6,
      "type": "CORPORATE_ACTION",
      "symbol": "HDFCBANK",
      "sentiment": "BULLISH",
      "price_reaction": "Not yet — pre-market news",
      "priced_in": false,
      "affects_holding": false,
      "action": "ACCUMULATE before ex-date",
      "confidence_score": 82,
      "ex_date": "YYYY-MM-DD"
    }
  ],
  "portfolio_alerts": [
    {
      "symbol": "TMCV",
      "headline": "Auto sector gets export incentive boost",
      "impact": 5,
      "action": "POSITIVE for holding — HOLD"
    }
  ],
  "market_mood": {
    "overall_sentiment": "BULLISH",
    "fii_dii": "FII buying ₹1,200 Cr, DII buying ₹800 Cr",
    "nifty_trend": "Above 22,500 — bullish"
  }
}
```

## Filtering Criteria

| Criterion | Threshold | Rationale |
|-----------|-----------|-----------|
| Market Cap | > ₹500 Cr | Avoid illiquid |
| Price Reaction | Moved > 2% from prev close | Confirm news impact |
| Volume | > 2x 20-day average | Institutional interest signal |
| P/E (if fundamentals needed) | < 30 | Valuation check |
| D/E | < 1.5 | Debt safety |

## Save Output
Save to: `reports/YYYY-MM-DD_news_opportunities.json`

## Limits
- Max 5 web searches for news
- Max 10 news items in output (rank by impact, keep top 10)
- Max 5 portfolio alerts

## Error Recovery
- If web search fails → try alternative source (MoneyControl → ET → LiveMint)
- If all news sources fail → save `news: []` with `"scan_status": "FAILED"`
- If KiteMCP fails for price check → skip verification, note `"price_verified": false`

## Tools
- `websearch`: Search news sources
- `skill:india-news-tracker`: Structured daily news briefing
- `kite_get_ltp`: Verify price reaction
- `kite_get_quotes`: Check volume and depth

## Downstream Consumers
This JSON is consumed by:
- `create_daily_report.js` → News-Driven Opportunities section
- `report_generator.md` → Immediate Actions (if critical news)