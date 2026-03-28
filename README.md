# KiteMCP Portfolio Intelligence (NSE/BSE)

An AI-powered institutional-grade portfolio management and market intelligence system for the Indian equity markets. This system automates the daily morning scan, calculates intrinsic value using verified data, and generates professional analytical reports to ensure data-driven investment decisions.

---

## 🚀 DAILY WORKFLOW GUIDE

To run the master intelligence scan, follow these steps:

1.  **Synchronize Workspace**: Open your Kite/Broker terminal to ensure your session is active.
2.  **Trigger AI Analysis**: Tell the AI Assistant: **"Run daily workflow"**.
3.  **Wait for Intelligence Scan**: The AI will execute 7 "Gates" in sequence:
    *   **Gate 0**: Internet-wide Opportunity Scan.
    *   **Gate 0.3**: MCX Commodity Price Analysis.
    *   **Gate 0.5**: Financial News & Headline Scanner.
    *   **Gate 1**: Live Portfolio & Snapshot Fetch.
    *   **Gate 2**: Intrinsic Value Calculation (via Screener.in fundamentals).
    *   **Gate 3**: GTT (Good Till Triggered) Safety Audit.
4.  **Generate Reports**: Once the AI saves the intelligence data, run the following command in your terminal:
    ```bash
    npm start
    ```
    This will automatically process the raw data and generate your daily Word and Excel reports.

---

## 📄 REPORTING ENGINE

Every session produces three layers of reporting:

### 1. Daily Report (.docx)
*   **Location**: `reports/YYYY-MM-DD_daily_report.docx`
*   **Content**: A professional executive summary.
*   **Key Sections**: Immediate Priority Actions, Portfolio Snapshot, Deep Discount Alerts, Commodity Review, and Scanned Opportunities.

### 2. Portfolio Intelligence (.xlsx)
*   **Location**: `reports/Portfolio_YYYY-MM-DD.xlsx`
*   **Content**: Detailed spreadsheet with formulas for deep-diving.
*   **Sheets**:
    *   **Holdings**: P&L tracking vs Intrinsic Value.
    *   **Market Intelligence**: Full breakdown of News, Commodities, and Scanned Stocks.
    *   **Tax Summary**: Identifies candidates for tax-loss harvesting.
    *   **Dividend Tracker**: Expected annual income analysis.

### 3. Raw Intelligence (.json)
*   **Location**: `reports/YYYY-MM-DD_[gate].json`
*   **Content**: High-granularity data used by the reporting engine.

---

## 🛡️ CORE RULES & GUARDRAILS (Learnings)

This system operates under strict financial guardrails derived from `learnings.md`:

*   **Rule #1**: Never buy a stock without a **Margin of Safety (MoS) > 25%**.
*   **Rule #2**: Every position **MUST** have a GTT stop-loss trigger below current price.
*   **Rule #3**: No "Averaging Down" if EPS is declining for 2 consecutive quarters.
*   **Rule #4**: Sector headwinds are checked daily before news recommendations.
*   **Rule #5**: All company names must be verified via Screener.in before calculation.

---

## ⚙️ SYSTEM ARCHITECTURE

*   **`run_daily.js`**: Master orchestrator for automated reporting.
*   **`create_daily_report.js`**: Word document generator (using `docx`).
*   **`create_portfolio_export.js`**: Excel workbook builder (using `exceljs`).
*   **`AGENTS.md`**: Definitive rulebook for the AI Analyst.
*   **`learnings.md`**: Historical mistake log and prevention rules.

---

## 🔧 TROUBLESHOOTING

*   **Tool Access Failed**: If the KiteMCP remote server is offline, the AI will prompt for manual data input. Provide a snapshot of your holdings to continue.
*   **Excel File Locked**: Ensure all reports are closed before running the `npm start` command to avoid write errors.
*   **JSON Schema Mismatch**: If report generation fails, verify that fields like `quantity` and `last_price` are correctly mapped in the snapshot JSON.

---

> **Analyst Note**: This system is a decision-support tool. It does not execute trades automatically. All trade executions must be reviewed manually against the generated reports.
