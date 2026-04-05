# KiteMCP Portfolio Intelligence (NSE/BSE)

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Windows-blue.svg)](https://github.com/pavanmutra/KiteMCPPortfolioIntelligence)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![API](https://img.shields.io/badge/API-Kite%20by-Zerodha-orange.svg)](https://kite.zerodha.com)

*An AI-powered institutional-grade portfolio management and market intelligence system for Indian equity markets (NSE/BSE)*

</div>

---

## 📊 Overview

**KiteMCP Portfolio Intelligence** automates your daily morning scan for Indian stock markets. It fetches live market data, calculates intrinsic value using Graham Number/DCF/P-E models, identifies deep discount opportunities, manages GTT orders, and generates professional analytical reports.

Whether you're a retail investor or managing a portfolio of ₹1Cr+, this system ensures data-driven investment decisions with built-in risk guardrails.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI-Powered Scanning** | Automated agents scan opportunities, commodities, and news |
| 📈 **Intrinsic Value Calculator** | Graham Number, DCF, and P/E based fair value estimation |
| 💎 **Deep Value Screener** | Identifies stocks trading at 40%+ discount to fair value |
| 🛡️ **GTT Risk Management** | Automated stop-loss and target order placement |
| 📊 **Multi-Format Reports** | Markdown dashboards + Excel with tax/dividend tracking |
| 🌐 **Web Dashboard** | Real-time local web UI with dark theme |
| ⚡ **Commodity Tracking** | Live MCX prices for Gold, Silver, Crude Oil, Natural Gas |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Zerodha Kite** account (for live data)
- **OpenCode/Claude** or similar AI assistant

### Installation

```bash
# Clone the repository
git clone https://github.com/pavanmutra/KiteMCPPortfolioIntelligence.git
cd KiteMCP

# Install dependencies
npm install
```

### Two-Phase Workflow

#### Phase 1: AI Data Gathering (in your AI Chat)

```
"Run the KiteMCP daily workflow for today"
```

The AI will execute all agents in sequence and save JSON files to `reports/`.

#### Phase 2: Generate Reports (in Terminal)

```bash
# Full daily workflow (runs all scripts)
npm start

# Or individual commands
npm run report    # Generate Markdown report
npm run export    # Generate Excel file
npm run web       # Start web dashboard
npm run check     # Check gate status
```

---

## 📁 Project Structure

```
kitemcp/
├── src/
│   ├── server.js           # Web dashboard server
│   ├── run_daily.js        # Master orchestrator
│   ├── fetch_commodities.js # Live MCX price fetcher
│   ├── convert_deep_value.js # Markdown to JSON converter
│   ├── routes/api.js      # REST API endpoints
│   └── public/             # Web UI (HTML/CSS/JS)
├── prompts/                # AI agent prompts
├── reports/                # Generated reports
├── indian_deep_value_stocks.md # Static screener data
├── AGENTS.md              # AI workflow rules
├── learnings.md           # Mistake prevention
└── package.json
```

---

## 🖥️ Web Dashboard

Start the dashboard:

```bash
npm run web
```

Then open **http://localhost:3000** in your browser.

### Features

| Section | Description |
|---------|-------------|
| 📅 **Date Picker** | Navigate to any historical date |
| 👁️ **Privacy Mask** | Hide P&L values with one click |
| 💼 **Holdings** | Full portfolio with P&L, MoS, recommendations |
| 💎 **Deep Value** | 80+ stocks with sector filters & search |
| 📊 **Discounts** | Deep discount alerts (>40% MoS) |
| 📈 **GTT Status** | Protected/unprotected holdings + recommendations |
| 📰 **Opportunities** | Short/Medium/Long term picks |
| 🪙 **Commodities** | Live MCX prices (Gold, Silver, Crude, Natural Gas) |

### Screenshots

> 💡 Pro tip: Use the **eye icon** (👁️) in the top-right corner to mask sensitive P&L data before taking screenshots!

| Dashboard Overview |
|--------------------|
| ![Dashboard](docs/screenshots/dashboard.png) |

| Deep Value Screener |
|---------------------|
| ![Deep Value](docs/screenshots/deep-value.png) |

| Investment Oppurtunities |
|--------------------|
| ![Holdings](docs/screenshots/holdings.png) |

*Add your own screenshots to `docs/screenshots/` folder*

---

## 📖 Documentation

- **[AGENTS.md](AGENTS.md)** - Complete workflow rules and gates
- **[learnings.md](learnings.md)** - Historical mistakes and prevention
- **[prompts/](prompts/)** - AI agent definitions

---

## 🛡️ Core Rules & Guardrails

| Rule | Description |
|------|-------------|
| **MoS > 25%** | Never buy without Margin of Safety |
| **GTT Required** | Every position needs stop-loss trigger |
| **No Averaging** | Skip if EPS declining 2+ quarters |
| **Sector Check** | Verify sector sentiment before buy |

---

## 📖 Glossary

| Term | Definition |
|------|------------|
| **MoS** | Margin of Safety - % discount to intrinsic value |
| **IV** | Intrinsic Value - Fair value via fundamentals |
| **Graham Number** | √(22.5 × EPS × Book Value) |
| **GTT** | Good Till Triggered - Automated orders |
| **MCX** | Multi Commodity Exchange |

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Empty reports | Run AI workflow first (Phase 1) |
| Excel locked | Close Excel, run again |
| Kite MCP offline | Use manual fallback mode |
| Missing JSON | Check AI saved files to `reports/` |

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting PRs.

---

## 📜 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) for details.

---

## 📧 Contact

- **Author**: Mutra PavanKumarReddy
- **GitHub**: [github.com/pavanmutra/KiteMCPPortfolioIntelligence](https://github.com/pavanmutra/KiteMCPPortfolioIntelligence)

---

> ⚠️ **Disclaimer**: This system is a decision-support tool. It does not execute trades automatically. All trades must be reviewed manually against generated reports. Past performance does not guarantee future results.

<div align="center">

*Built with ❤️ for the Indian trading community*

</div>
