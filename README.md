# KiteMCP Portfolio Intelligence System

> AI-powered automated stock portfolio management with daily reports, GTT protection, and intrinsic value analysis for Indian markets (NSE/BSE).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KiteMCP Portfolio Intelligence                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐ │
│  │  Opportunity │    │    News      │    │  Portfolio   │    │ Intrinsic│ │
│  │   Scanner    │───▶│   Scanner    │───▶│   Scanner    │───▶│  Value   │ │
│  │  (Agent 0)   │    │  (Agent 0.5) │    │  (Agent 1)   │    │ (Agent 2)│ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────┘ │
│         │                   │                   │                   │       │
│         ▼                   ▼                   ▼                   ▼       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Data Layer (JSON Files)                        │   │
│  │  opportunities.json | news_opportunities.json | portfolio_snapshot │   │
│  │  value_screen.json | gtt_audit.json | immediate_actions.json       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                │
│  │  GTT Manager │───▶│    Report    │───▶│    Order     │                │
│  │  (Agent 3)    │    │  Generator   │    │  Executor    │                │
│  │              │    │  (Agent 4)    │    │  (Agent 5)   │                │
│  └──────────────┘    └──────────────┘    └──────────────┘                │
│                                    │                                        │
│                                    ▼                                        │
│                        ┌─────────────────────┐                            │
│                        │  Daily Report (.docx) │                           │
│                        └─────────────────────┘                            │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           EXTERNAL INTEGRATIONS                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Zerodha    │  │ Screener.in │  │   Web       │  │   India News   │  │
│  │   Kite      │  │  (Fundamen- │  │   Search    │  │    Tracker     │  │
│  │    MCP      │  │    tals)    │  │             │  │     Skill      │  │
│  └─────────────┘  └─────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
kitemcp/
├── AGENTS.md                    # Agent definitions and workflows
├── opencode.json                # OpenCode configuration (agents + MCP)
├── prompts/
│   ├── stock.yaml               # Analyst guidelines & output format
│   ├── opportunity_scanner.md   # Web search for investment opportunities
│   ├── commodity_scanner.md     # MCX commodity prices & opportunities
│   ├── news_scanner.md          # Financial news analysis
│   ├── portfolio_scan.md        # Kite holdings, P&L, tax, dividends
│   ├── intrinsic_value.md       # IV calculations (Graham/DCF)
│   ├── gtt_manager.md           # GTT order management
│   ├── report_generator.md      # Daily report generation
│   ├── excel_export.md          # Excel export with tax & dividend
│   └── order_executor.md        # Order placement (after all gates)
├── create_daily_report.js       # Main report generator (.docx)
├── create_portfolio_export.js   # Daily Excel export (.xlsx)
├── create_weekly_export.js      # Weekly Excel export (.xlsx)
├── create_deep_discount_report.js
├── holdings_detail.json          # Static holdings reference
├── reports/                     # Generated reports (auto-dated)
│   ├── YYYY-MM-DD_daily_report.docx
│   ├── YYYY-MM-DD_portfolio_snapshot.json
│   ├── YYYY-MM-DD_value_screen.json
│   ├── YYYY-MM-DD_gtt_audit.json
│   ├── YYYY-MM-DD_opportunities.json
│   ├── YYYY-MM-DD_news_opportunities.json
│   ├── YYYY-MM-DD_commodity_opportunities.json
│   ├── Portfolio_YYYY-MM-DD.xlsx
│   └── Weekly_Portfolio_YYYY-MM-DD.xlsx
└── .opencode/
    └── (OpenCode internal files)
```

---

## Agent Workflow (Daily)

### Master Gate System

| Gate | Agent | Action | Time (IST) |
|------|-------|--------|------------|
| 0 | opportunity-scanner | Search web for investment opportunities | 08:30 |
| 0.3 | commodity-scanner | Search MCX commodity prices | 08:30 |
| 0.5 | news-scanner | Scan financial news for opportunities | 08:40 |
| 1 | portfolio-scanner | Fetch holdings, P&L, margins, tax | 08:50 |
| 2 | intrinsic-value-scanner | Calculate IV & margin of safety | 09:00 |
| 3 | gtt-manager | Audit GTT orders, flag unprotected | 09:05 |
| 4 | report-generator | Generate daily .docx report | 09:10 |
| 4.5 | excel-export | Generate .xlsx with tax & dividend | 09:15 |
| 5 | order-executor | Place orders (AFTER export saved) | 09:20 |

### Pre-Order Checklist (MANDATORY)
- [ ] Daily report exists for today
- [ ] Excel export completed for today
- [ ] Commodity scan completed
- [ ] Opportunity scan completed
- [ ] News scan completed  
- [ ] Portfolio scan completed
- [ ] Intrinsic value screen completed
- [ ] GTT audit completed
- [ ] Stock on approved action list
- [ ] Available margin sufficient
- [ ] Position size ≤ 10% portfolio
- [ ] For BUY: Margin of Safety > 25%
- [ ] GTT stop-loss will be placed after order

---

## Agent Definitions

### Agent 0: opportunity-scanner
- **File**: `prompts/opportunity_scanner.md`
- **Role**: Search internet for investment opportunities across 3 horizons
- **Output**: `reports/YYYY-MM-DD_opportunities.json`
- **Horizons**:
  - Short-term (1-4 weeks): Momentum/swing
  - Medium-term (3-12 months): Value + growth
  - Long-term (1-3+ years): Deep value/compounding

### Agent 0.3: commodity-scanner
- **File**: `prompts/commodity_scanner.md`
- **Role**: Search MCX commodity prices (Gold, Silver, Crude, Natural Gas)
- **Output**: `reports/YYYY-MM-DD_commodity_opportunities.json`
- **Commodities**: Gold, Silver, Crude Oil, Natural Gas
- **Features**: Trend analysis, support/resistance, recommendations

### Agent 0.5: news-scanner  
- **File**: `prompts/news_scanner.md`
- **Role**: Scan financial news for investment opportunities
- **Output**: `reports/YYYY-MM-DD_news_opportunities.json`
- **News Types**: Earnings, Corporate Actions, M&A, Regulatory, Bulk Deals

### Agent 1: portfolio-scanner
- **File**: `prompts/portfolio_scan.md`
- **Role**: Fetch live portfolio from Kite MCP
- **Output**: `reports/YYYY-MM-DD_portfolio_snapshot.json`
- **Data**: Holdings, quantity, avg price, last price, P&L, margins

### Agent 2: intrinsic-value-scanner
- **File**: `prompts/intrinsic_value.md`
- **Role**: Calculate intrinsic value & margin of safety
- **Output**: `reports/YYYY-MM-DD_value_screen.json`
- **Methods by Stock Type**:
  - Holding Companies: Book Value (P/B = 1.0x)
  - Growth Companies: PE-based (Fair PE × EPS)
  - Banks/NBFCs: Adjusted P/B (1.5-2.5x)
  - REITs: Dividend Discount Model
  - ETFs: Index-linked

### Agent 3: gtt-manager
- **File**: `prompts/gtt_manager.md`
- **Role**: Review, create, modify GTT orders
- **Output**: `reports/YYYY-MM-DD_gtt_audit.json`
- **Rules**: Stop-loss at 12% below cost, target at 90% of IV

### Agent 4: report-generator
- **File**: `prompts/report_generator.md`
- **Role**: Compile all data into daily Word report
- **Output**: `reports/YYYY-MM-DD_daily_report.docx`
- **Sections**:
  1. IMMEDIATE ACTIONS REQUIRED ⚠️
  2. Portfolio Summary
  3. Holdings Breakdown
  4. Deep Discount Stocks (MoS > 25%)
  5. Overvalued Stocks
  6. GTT Protection Status
  7. Web Investment Opportunities
  8. News-Driven Opportunities
  9. Commodities Overview
  10. Action Items
  11. Market Status

### Agent 4.5: excel-export
- **File**: `prompts/excel_export.md`
- **Role**: Generate Excel exports with tax & dividend tracking
- **Output**: `reports/Portfolio_YYYY-MM-DD.xlsx`
- **Sheets**:
  - Holdings: Symbol, Qty, Avg Price, Current, P&L, MoS, Action
  - Tax Summary: Unrealized gains, tax-loss harvesting candidates
  - Dividend Tracker: Dividend yield, ex-dates, expected income
  - Commodities: Gold, Silver, Crude, Natural Gas prices
  - Weekly Summary: Week-over-week performance

### Agent 5: order-executor
- **File**: `prompts/order_executor.md`
- **Role**: Execute trades (ONLY after all gates pass)
- **Constraint**: Cannot place orders until daily report saved

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        DAILY WORKFLOW                           │
└─────────────────────────────────────────────────────────────────┘

  1. opportunity-scanner
        │
        ▼  (saves opportunities.json)
  2. news-scanner
        │
        ▼  (saves news_opportunities.json)
  3. portfolio-scanner ──▶ Kite MCP
        │
        ▼  (saves portfolio_snapshot.json)
  4. intrinsic-value-scanner ──▶ Screener.in (web)
        │
        ▼  (saves value_screen.json)
  5. gtt-manager ──▶ Kite MCP (GTT orders)
        │
        ▼  (saves gtt_audit.json)
  6. report-generator
        │
        ▼  (generates daily_report.docx)
  7. order-executor ──▶ Kite MCP (trades)
```

---

## Key Features

### 1. Margin of Safety Calculation
```
MoS % = ((Intrinsic Value - Current Price) / Intrinsic Value) × 100
```

| Classification | MoS | Action |
|---------------|-----|--------|
| DEEP DISCOUNT | > 40% | 🔴 STRONG ACCUMULATE |
| MODERATE DISCOUNT | 25-40% | 🟡 ACCUMULATE ON DIPS |
| FAIRLY VALUED | 10-25% | 🟢 HOLD |
| OVERVALUED | < 10% | 🔴 REVIEW - TRIM/EXIT |

### 2. GTT Protection Rules
- Stop-Loss GTT: Trigger at `avg_price × 0.88` (12% below cost)
- Target GTT: Trigger at `intrinsic_value × 0.90` (10% below IV)
- Every holding MUST have a GTT stop-loss

### 3. Stock-Type Specific Valuation
Per `prompts/stock.yaml`:
- **Holding Companies**: Use Book Value (P/B = 1.0x baseline)
- **Growth Companies**: PE-based (Fair PE × EPS)
- **Banks/NBFCs**: Adjusted P/B (1.5-2.5x book value)
- **REITs**: Dividend Discount Model
- **ETFs**: Index-linked

---

## Running the System

### Prerequisites
- Node.js installed
- Zerodha Kite account with API access
- Kite API key and access token configured in MCP

### Generate Daily Report
```bash
node create_daily_report.js
```

Output: `reports/YYYY-MM-DD_daily_report.docx`

### Dependencies
- `docx` - Word document generation
- Kite MCP - Broker connectivity (configured in opencode.json)

---

## Report Output Format

The daily report includes:

1. **Immediate Actions Required** - HIGH/MEDIUM priority items
2. **Portfolio Summary** - Total value, P&L, margin
3. **Holdings Breakdown** - Table with all positions
4. **Deep Discount Stocks** - MoS > 25%
5. **Overvalued Stocks** - Price > IV
6. **GTT Protection Status** - Protected vs unprotected
7. **Web-Scanned Opportunities** - From opportunity-scanner
8. **News-Driven Opportunities** - From news-scanner
9. **Action Items** - Buy/Hold/Trim recommendations
10. **Market Status** - Trading hours

---

## Configuration Files

### opencode.json
```json
{
  "agents": {
    "opportunity-scanner": { "file": "prompts/opportunity_scanner.md" },
    "news-scanner": { "file": "prompts/news_scanner.md" },
    "portfolio-scanner": { "file": "prompts/portfolio_scan.md" },
    "intrinsic-value-scanner": { "file": "prompts/intrinsic_value.md" },
    "gtt-manager": { "file": "prompts/gtt_manager.md" },
    "report-generator": { "file": "prompts/report_generator.md" },
    "order-executor": { "file": "prompts/order_executor.md" }
  },
  "mcp": {
    "kite": { "type": "remote", "url": "https://mcp.kite.trade/mcp" }
  },
  "daily_workflow": [
    "opportunity-scanner", "news-scanner", "portfolio-scanner",
    "intrinsic-value-scanner", "gtt-manager", "report-generator"
  ]
}
```

---

## Analyst Guidelines (from stock.yaml)

All agents must follow:
- **Role**: 15+ years expertise in Indian equity markets
- **Tone**: Professional, analytical, actionable
- **Mandates**:
  - ALWAYS fetch Screener.in data before analysis
  - ALWAYS calculate intrinsic value and show CMP vs Fair Value
  - Use stock-type specific valuation methods
  - Prioritize capital protection along with growth

---

## Limitations & Constraints

### System Limitations

| Limitation | Description | Impact |
|------------|-------------|--------|
| **No Real-Time Fundamentals** | Screener.in data fetched via web search, not live API | May have outdated P/E, Book Value, ROE |
| **No Technical Charts** | System doesn't analyze price charts | Cannot detect patterns, trends |
| **Manual GTT Placement** | GTT orders must be placed manually by user | Delay between signal and execution |
| **Single Broker** | Only supports Zerodha Kite | Cannot work with other brokers |
| **No Options/F&O** | Only equity delivery/MTF supported | Cannot execute options strategies |
| **No Mutual Funds** | MF holdings not integrated | Cannot recommend/switch funds |
| **No IPO Tracking** | No IPO calendar or analysis | Missing new listing opportunities |

### Data Limitations

| Issue | Description |
|-------|-------------|
| **Stale Prices** | LTP may be delayed by few minutes |
| **Fundamental Lag** | Screener.in data updates quarterly |
| **News Latency** | News search may miss breaking news |
| **No Bulk Deal Alerts** | Bulk/block deal data requires manual check |
| **Earnings Calendar** | Not integrated - must check manually |

### Process Limitations

| Constraint | Description |
|------------|-------------|
| **No Auto-Execution** | Orders must be placed manually after report |
| **GTT Review Frequency** | Stale GTTs (>30 days) flagged but not auto-updated |
| **Position Size** | Hard cap of 10% per stock - not enforced automatically |
| **Margin Check** | Available margin fetched but not validated against order size |

### Risk Considerations

| Risk | Mitigation |
|------|------------|
| **Overreliance on IV** | Always verify with Screener.in before acting |
| **News Signal Lag** | Confirm price reaction before entry |
| **GTT Failure** | Manual verification recommended |
| **Market Hours** | Some features only work during market hours |

### What System Does NOT Do

- ❌ Execute trades automatically
- ❌ Provide tax optimization advice
- ❌ Calculate capital gains for tax planning
- ❌ Track dividend income
- ❌ Analyze sector correlations
- ❌ Backtest strategies
- ❌ Provide margin trading leverage calculations
- ❌ Monitor global markets (US, Asia)
- ❌ Send notifications/alerts
- ❌ Integrate with Excel/Google Sheets

---

## Disclaimer

This system is for informational purposes only. Not investment advice. 
Consult a financial advisor before making trading decisions.

---

## Future Enhancements

- [ ] Add technical analysis via charts
- [ ] FII/DII flow tracking integration
- [ ] Earnings calendar integration
- [ ] Sector rotation signals
- [ ] Automated GTT placement on buy signals
