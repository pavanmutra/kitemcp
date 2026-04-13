# Screener Prompts — Indian Deep Value Stocks

---

## 1. Screener.in Custom Query (Best)

Go to → **https://www.screener.in/explore/**
Click **"Create a query"** and paste:

### Query A — Core Deep Value (Strict)
```
P/E Ratio < 15 AND
Price to book value < 1.5 AND
Debt to equity < 0.5 AND
Return on equity > 12 AND
Return on capital employed > 15 AND
Promoter holding > 40 AND
Promoter holding change 3Years > -5 AND
Sales growth 5Years > 8 AND
Profit growth 5Years > 8 AND
Free cash flow > 0 AND
Piotroski score > 5
```

### Query B — Deep Value + Low Pledge (Safest)
```
P/E Ratio < 15 AND
Price to book value < 1.5 AND
Debt to equity < 0.3 AND
Current ratio > 1.5 AND
Return on equity > 12 AND
Return on capital employed > 15 AND
Promoter holding > 50 AND
Pledged percentage < 5 AND
Sales growth 5Years > 8 AND
Profit growth 5Years > 5 AND
Market Capitalization > 500
```

### Query C — PSU Value Picks
```
P/E Ratio < 12 AND
Price to book value < 1.5 AND
Debt to equity < 0.5 AND
Dividend yield > 2 AND
Return on equity > 10 AND
Promoter holding > 50 AND
Sales growth 5Years > 5 AND
Market Capitalization > 5000
```

### Query D — Mid & Small Cap Hidden Gems
```
P/E Ratio < 12 AND
Price to book value < 1.2 AND
Debt to equity < 0.3 AND
Return on capital employed > 18 AND
Promoter holding > 55 AND
Pledged percentage < 3 AND
Sales growth 5Years > 12 AND
Profit growth 5Years > 12 AND
Market Capitalization < 20000 AND
Market Capitalization > 500
```

### Query E — Banking & NBFC Value
```
P/E Ratio < 10 AND
Price to book value < 1.2 AND
Return on equity > 12 AND
Net NPA < 2 AND
Promoter holding > 35 AND
Dividend yield > 1
```

### Query F — Graham Number Screen
```
P/E Ratio < 15 AND
Price to book value < 1.2 AND
Debt to equity < 0.5 AND
Current ratio > 1.5 AND
Sales growth 5Years > 5 AND
Profit growth 5Years > 5 AND
EPS growth 5Years > 5 AND
Dividend yield > 0
```

---

## 2. Trendlyne Screener Query

Go to → **https://trendlyne.com/stock-screener/**
Use these filter settings:

```
P/E Ratio        → Less than → 15
P/B Ratio        → Less than → 1.5
Debt/Equity      → Less than → 0.5
ROE (%)          → Greater than → 12
ROCE (%)         → Greater than → 15
Promoter Holding → Greater than → 40
Pledged %        → Less than → 10
5Y Revenue CAGR  → Greater than → 8
```

---

## 3. Tickertape Screener Filters

Go to → **https://www.tickertape.in/screener**

```
P/E              → Max 15
P/B              → Max 1.5
D/E Ratio        → Max 0.5
ROE              → Min 12%
Market Cap       → Min ₹500 Cr
Promoter Stake   → Min 40%
5Y Sales Growth  → Min 8%
```

---

## 4. Moneycontrol Screener

Go to → **https://www.moneycontrol.com/stocks/marketstats/stock_screener/**

```
P/E Ratio        : 0 to 15
Price/Book       : 0 to 1.5
Debt/Equity      : 0 to 0.5
ROE (%)          : 12 to 100
Sales Growth 5Y  : 8 to 100
Promoter Holding : 40 to 100
```

---

## 5. ChatGPT / AI Prompt (for research)

Use this prompt in ChatGPT or any AI to get a curated list:

```
List 30 deeply undervalued Indian stocks listed on NSE/BSE that meet all 
of these criteria:
- P/E ratio below 15
- P/B ratio below 1.5
- Debt-to-equity below 0.5
- ROE above 12%
- ROCE above 15%
- Promoter holding above 40%
- Pledged shares below 10%
- 5-year revenue CAGR above 8%
- Positive free cash flow
- Piotroski F-score above 5

For each stock provide: company name, NSE ticker, sector, P/E, P/B, ROE, 
ROCE, D/E, promoter holding, pledged %, 5yr sales CAGR, market cap (Cr), 
```

---

## 6. Claude Prompt (use in this chat)

```
Give me a fresh list of 40 deeply undervalued Indian stocks on NSE/BSE 
with P/E < 15, P/B < 1.5, Debt/Equity < 0.5, ROE > 12%, ROCE > 15%, 
ROE, D/E, promoter%, pledge%, 5Y sales growth, market cap in Cr, a 
composite value score out of 10, and risk rating (Low/Moderate/High). 
Sort by value score. Present as a markdown table.
```

---

## 7. NSE Advanced Search

Go to → **https://www.nseindia.com/market-data/securities-available-for-trading**

Filter by:
```
Index          : NIFTY 500 or All Securities
P/E            : 0 – 15
Face Value     : Any
Sort by        : P/E Ascending
```

Then cross-reference with Screener.in for D/E and promoter data.

---

## 8. Tijori Finance Screen

Go to → **https://tijorifinance.com/screener**

```
P/E Ratio        < 15
P/B Ratio        < 1.5
Debt/Equity      < 0.5
ROCE             > 15%
Promoter Holding > 40%
Piotroski Score  ≥ 6
```

---

## Quick Reference — Key Filter Values

| Metric              | Strict | Moderate | Why                          |
|---------------------|--------|----------|------------------------------|
| P/E Ratio           | < 12   | < 15     | Nifty avg ~22, so <15 = cheap |
| P/B Ratio           | < 1.0  | < 1.5    | Below book = margin of safety |
| Debt/Equity         | < 0.3  | < 0.5    | Financial safety              |
| ROE                 | > 15%  | > 12%    | Capital efficiency            |
| ROCE                | > 18%  | > 15%    | Better than ROE for Indian cos|
| Promoter Holding    | > 55%  | > 40%    | Skin in the game              |
| Pledged %           | < 3%   | < 10%    | High pledge = red flag        |
| 5Y Sales CAGR       | > 12%  | > 8%     | Beats inflation               |
| Piotroski Score     | ≥ 7    | ≥ 5      | Financial health composite    |
| Free Cash Flow      | > 0    | > 0      | Real earnings quality         |

---

## Red Flags to Exclude

Add these negative filters to any query above:

```
Pledged percentage < 20          (avoid heavily pledged)
Debt to equity < 0.5             (avoid high leverage)
Promoter holding change 3Years > -10   (avoid promoter selling)
Net profit > 0                   (avoid loss-making)
Sales growth 3Years > 0          (avoid revenue decline)
```

---

*Use Query A or B on Screener.in for best results — it has the most accurate and up-to-date Indian fundamental data.*
