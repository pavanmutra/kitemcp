# KiteMCP Architecture Diagram (Mermaid)

## System Architecture

```mermaid
flowchart TB
    subgraph External["External Integrations"]
        Kite["Zerodha Kite MCP<br/>(Trading API)"]
        Screener["Screener.in<br/>(Fundamentals)"]
        Web["Web Search<br/>(Investment Ops)"]
        News["India News Tracker<br/>(Financial News)"]
        MCX["MCX Commodities<br/>(Gold, Silver, Crude, NG)"]
    end

    subgraph Agents["Agent Layer"]
        A0["opportunity-scanner<br/>Agent 0"]
        A03["commodity-scanner<br/>Agent 0.3"]
        A05["news-scanner<br/>Agent 0.5"]
        A1["portfolio-scanner<br/>Agent 1"]
        A2["intrinsic-value-scanner<br/>Agent 2"]
        A3["gtt-manager<br/>Agent 3"]
        A4["report-generator<br/>Agent 4"]
        A45["excel-export<br/>Agent 4.5"]
        A5["order-executor<br/>Agent 5"]
    end

    subgraph Data["Data Layer (JSON)"]
        D1["opportunities.json<br/>Web Opportunities"]
        D2["commodity_opportunities.json<br/>Commodities"]
        D3["news_opportunities.json<br/>News Opportunities"]
        D4["portfolio_snapshot.json<br/>Holdings & P&L"]
        D5["value_screen.json<br/>IV & MoS"]
        D6["gtt_audit.json<br/>GTT Status"]
    end

    subgraph Output["Output"]
        Docx["daily_report.docx"]
        Xlsx["Portfolio_YYYY-MM-DD.xlsx"]
    end

    %% Flow connections
    Kite --> A1
    Kite --> A3
    Kite --> A5
    Screener --> A2
    Web --> A0
    Web --> A03
    News --> A05

    A0 --> D1
    A03 --> D2
    A05 --> D3
    A1 --> D4
    A2 --> D5
    A3 --> D6

    D1 --> A4
    D2 --> A4
    D3 --> A4
    D4 --> A4
    D5 --> A4
    D6 --> A4

    A4 --> Docx
    A4 --> A45
    A45 --> Xlsx
    A5 -.-> Kite

    style Agents fill:#e1f5fe,stroke:#01579b
    style Data fill:#e8f5e8,stroke:#2e7d32
    style Output fill:#fff3e0,stroke:#e65100
    style External fill:#fce4ec,stroke:#c2185b
```

---

## Daily Workflow Sequence

```mermaid
sequenceDiagram
    participant User
    participant A0 as opportunity-scanner
    participant A03 as commodity-scanner
    participant A05 as news-scanner
    participant A1 as portfolio-scanner
    participant A2 as intrinsic-value-scanner
    participant A3 as gtt-manager
    participant A4 as report-generator
    participant A45 as excel-export
    participant A5 as order-executor
    participant Kite as Kite MCP
    participant MCX as MCX Commodities

    Note over User,A0: GATE 0: Opportunity & Commodity Scan
    User->>A0: Run opportunity scanner
    A0->>Web: Search investment opportunities
    Web-->>A0: Opportunity data
    A0->>A0: Save to opportunities.json
    
    User->>A03: Run commodity scanner (PARALLEL)
    A03->>MCX: Search MCX commodity prices
    MCX-->>A03: Commodity data
    A03->>A03: Save to commodity_opportunities.json

    Note over A03,A05: GATE 0.5: News Scan
    A03->>A05: Run news scanner
    A05->>News: Fetch financial news
    News-->>A05: News data
    A05->>A05: Save to news_opportunities.json

    Note over A05,A1: GATE 1: Portfolio Scan
    A05->>A1: Run portfolio scanner
    A1->>Kite: getHoldings(), getMargins()
    Kite-->>A1: Holdings data with tax/dividend info
    A1->>A1: Save to portfolio_snapshot.json

    Note over A1,A2: GATE 2: Intrinsic Value
    A1->>A2: Run value screen
    A2->>Screener: Fetch fundamentals
    Screener-->>A2: EPS, BV, ROE, etc.
    A2->>A2: Calculate IV & MoS
    A2->>A2: Save to value_screen.json

    Note over A2,A3: GATE 3: GTT Audit
    A2->>A3: Run GTT manager
    A3->>Kite: getGTTs()
    Kite-->>A3: GTT data
    A3->>A3: Audit & flag issues
    A3->>A3: Save to gtt_audit.json

    Note over A3,A4: GATE 4: Report Generation
    A3->>A4: Run report generator
    A4->>A4: Load all JSON files
    A4->>A4: Generate daily_report.docx

    Note over A4,A45: GATE 4.5: Excel Export
    A4->>A45: Run excel export
    A45->>A45: Load JSON data, generate Portfolio.xlsx
    A45->>A45: Save to Portfolio_YYYY-MM-DD.xlsx

    Note over A45,A5: GATE 5: Order Execution
    A45->>A5: Report & Excel saved - proceed to trade
    A5->>Kite: placeOrder(), placeGTT()
    
    Note over A5,User: Daily workflow complete
    A5-->>User: Orders placed
```

---

## Data Flow Architecture

```mermaid
flowchart LR
    subgraph Input["Inputs"]
        Web["Web Search"]
        News["Financial News"]
        Kite["Kite Holdings"]
        Screener["Screener Data"]
    end

    subgraph Processing["Processing"]
        Agents["7 Agents<br/>Execute in Sequence"]
    end

    subgraph Storage["Storage Layer"]
        JSON1["opportunities.json"]
        JSON2["news_opportunities.json"]
        JSON3["portfolio_snapshot.json"]
        JSON4["value_screen.json"]
        JSON5["gtt_audit.json"]
    end

    subgraph Output["Output"]
        DOCX["daily_report.docx"]
    end

    Input --> Agents
    Agents --> Storage
    Storage --> DOCX
```

---

## Agent Responsibility Matrix

```mermaid
gantt
    title Daily Agent Schedule (08:30 - 09:30 IST)
    dateFormat HH:mm
    
    section GROUP 1: External Data
    opportunity-scanner      :a1, 08:30, 10m
    commodity-scanner       :a2, 08:30, 10m
    news-scanner            :a3, 08:40, 10m
    
    section GROUP 2: Portfolio & Analysis
    portfolio-scanner       :a4, 08:50, 10m
    intrinsic-value-scanner :a5, 09:00, 5m
    gtt-manager            :a6, 09:05, 5m
    
    section GROUP 3: Output & Execution
    report-generator        :a7, 09:10, 5m
    excel-export           :a8, 09:15, 5m
    order-executor         :a9, 09:20, 10m
```

---

## Valuation Methods by Stock Type

```mermaid
flowchart TD
    Start["Identify Stock Type"] --> Holding{Is Holding Co?}
    -->|Yes| BV["Use Book Value<br/>P/B = 1.0x"]
    --> IV1["Intrinsic Value =<br/>Book Value × 1.0"]
    
    Holding -->|No| Growth{Is Growth Co?}
    -->|Yes| PE["Use PE-based<br/>Fair PE × EPS"]
    --> IV2["Intrinsic Value =<br/>Fair PE × EPS"]
    
    Growth -->|No| Bank{Is Bank/NBFC?}
    -->|Yes| APB["Use Adjusted P/B<br/>1.5-2.5x Book"]
    --> IV3["Intrinsic Value =<br/>Book Value × 2.0"]
    
    Bank -->|No| REIT{Is REIT?}
    -->|Yes| DDM["Use Dividend Discount<br/>Yield-based"]
    --> IV4["Intrinsic Value =<br/>Dividend / Yield"]
    
    REIT -->|No| ETF{Is ETF?}
    -->|Yes| Index["Use Index-linked<br/>Track Index"]
    --> IV5["Intrinsic Value =<br/>Index Valuation"]
    
    ETF -->|No| General["Use Graham Number<br/>√(22.5 × EPS × BVPS)"]
    --> IV6["Intrinsic Value =<br/>Graham Number"]
    
    IV1 --> CalcMoS
    IV2 --> CalcMoS
    IV3 --> CalcMoS
    IV4 --> CalcMoS
    IV5 --> CalcMoS
    IV6 --> CalcMoS
    
    CalcMoS["Calculate MoS %"] --> Classify["Classify Valuation"]
    
    Classify --> Deep{"MoS > 40%?"}
    -->|Yes| Action1["DEEP DISCOUNT<br/>STRONG ACCUMULATE"]
    
    Classify --> Mod{"MoS > 25%?"}
    -->|Yes| Action2["MODERATE DISCOUNT<br/>ACCUMULATE ON DIPS"]
    
    Classify --> Fair{"MoS > 10%?"}
    -->|Yes| Action3["FAIRLY VALUED<br/>HOLD"]
    
    Classify --> Over{"MoS <= 10%?"}
    -->|Yes| Action4["OVERVALUED<br/>TRIM/EXIT"]
```

---

## GTT Protection Workflow

```mermaid
flowchart LR
    subgraph Input["Portfolio Data"]
        Holdings["Holdings List"]
        AvgPrice["Avg Buy Price"]
    end

    subgraph Calculation["GTT Calculation"]
        StopLoss["Stop-Loss<br/>avg_price × 0.88"]
        Target["Target<br/>IV × 0.90"]
    end

    subgraph Kite["Kite MCP"]
        GetGTT["getGTTs()"]
        PlaceGTT["placeGTT()"]
    end

    subgraph Audit["GTT Audit"]
        Compare["Compare GTT vs Holdings"]
        Flag["Flag Unprotected"]
    end

    Holdings --> StopLoss
    AvgPrice --> StopLoss
    StopLoss --> PlaceGTT
    GetGTT --> Compare
    Compare --> Flag
    
    style Input fill:#e3f2fd
    style Calculation fill:#fff3e0
    style Kite fill:#e8f5e9
    style Audit fill:#fce4ec
```

---

## Report Generation Pipeline

```mermaid
flowchart TB
    subgraph Sources["JSON Data Sources"]
        S1["portfolio_snapshot.json<br/>Holdings & P&L"]
        S2["value_screen.json<br/>IV & MoS"]
        S3["gtt_audit.json<br/>GTT Status"]
        S4["opportunities.json<br/>Web Opportunities"]
        S5["news_opportunities.json<br/>News Opportunities"]
        S6["commodity_opportunities.json<br/>Commodities"]
    end

    subgraph Logic["Generate Actions"]
        L1["Extract Unprotected<br/>Holdings"]
        L2["Extract Deep Discount<br/>Stocks (MoS>40%)"]
        L3["Extract Overvalued<br/>Stocks"]
        L4["Extract Tax-Loss<br/>Candidates (>10%)"]
    end

    subgraph Report["Report Sections"]
        R1["Section 1: Immediate Actions"]
        R2["Section 2: Portfolio Summary"]
        R3["Section 3: Holdings Table"]
        R4["Section 4: Deep Discount"]
        R5["Section 5: Overvalued"]
        R6["Section 6: GTT Status"]
        R7["Section 7: Web Opportunities"]
        R8["Section 8: News Opportunities"]
        R9["Section 9: Commodities"]
        R10["Section 10: Action Items"]
    end

    subgraph Excel["Excel Export Sheets"]
        E1["Holdings - P&L, MoS, Action"]
        E2["Tax Summary - Gains, Tax-Loss Harvest"]
        E3["Dividend Tracker - Yield, Ex-Dates"]
        E4["Commodities - Gold, Silver, Crude, NG"]
        E5["Weekly Summary - WoW Performance"]
    end

    S1 --> L1
    S2 --> L2
    S2 --> L3
    S1 --> L4
    
    L1 --> R1
    L2 --> R4
    L3 --> R5
    
    S1 --> R2
    S1 --> R3
    S3 --> R6
    S4 --> R7
    S5 --> R8
    S6 --> R9
    
    R1 & R2 & R3 & R4 & R5 & R6 & R7 & R8 & R9 & R10 --> Docx["daily_report.docx"]
    
    S1 --> E1
    S1 --> E2
    S1 --> E3
    S6 --> E4
    S1 --> E5
    
    E1 & E2 & E3 & E4 & E5 --> Xlsx["Portfolio_YYYY-MM-DD.xlsx"]

    style Sources fill:#e1f5fe
    style Logic fill:#fff3e0
    style Report fill:#e8f5e8
    style Excel fill:#fce4ec
```

---

## Error Handling & Gate System

```mermaid
flowchart TD
    Start["Start Daily Workflow"] --> Gate0{GATE 0<br/>Opportunity Scan<br/>Complete?}
    Gate0 -->|FAIL| Stop0["STOP - Fix GATE 0"]
    Gate0 -->|PASS| Gate05{GATE 0.5<br/>News Scan<br/>Complete?}
    
    Gate05 -->|FAIL| Stop05["STOP - Fix GATE 0.5"]
    Gate05 -->|PASS| Gate1{GATE 1<br/>Portfolio Scan<br/>Complete?}
    
    Gate1 -->|FAIL| Stop1["STOP - Fix GATE 1"]
    Gate1 -->|PASS| Gate2{GATE 2<br/>IV Screen<br/>Complete?}
    
    Gate2 -->|FAIL| Stop2["STOP - Fix GATE 2"]
    Gate2 -->|PASS| Gate3{GATE 3<br/>GTT Audit<br/>Complete?}
    
    Gate3 -->|FAIL| Stop3["STOP - Fix GATE 3"]
    Gate3 -->|PASS| Gate4{GATE 4<br/>Report Saved?}
    
    Gate4 -->|FAIL| Stop4["STOP - Fix GATE 4"]
    Gate4 -->|PASS| Order["Execute Orders"]
    
    Stop0 & Stop05 & Stop1 & Stop2 & Stop3 & Stop4 --> Fix["Fix Failed Gate"]
    Fix --> Start
    
    style Start fill:#4caf50
    style Order fill:#2196f3
    style Stop0 fill:#f44336
    style Stop05 fill:#f44336
    style Stop1 fill:#f44336
    style Stop2 fill:#f44336
    style Stop3 fill:#f44336
    style Stop4 fill:#f44336
```

---

## System Limitations Matrix

```mermaid
flowchart TB
    subgraph Constraints["Limitations & Constraints"]
        direction TB
        
        subgraph Tech["Technical Limitations"]
            T1["No Real-Time Fundamentals"]
            T2["No Technical Charts"]
            T3["Single Broker (Kite)"]
            T4["Manual GTT Placement"]
        end
        
        subgraph Data["Data Limitations"]
            D1["Stale Prices"]
            D2["Fundamental Lag (Quarterly)"]
            D3["News Latency"]
            D4["No Bulk Deal Alerts"]
        end
        
        subgraph Process["Process Limitations"]
            P1["No Auto-Execution"]
            P2["GTT Not Auto-Updated"]
            P3["10% Cap Not Enforced"]
            P4["Margin Not Validated"]
        end
        
        subgraph Excluded["Features NOT Supported"]
            E1["No Options/F&O"]
            E2["No Mutual Funds"]
            E3["No IPO Tracking"]
            E4["No Tax Planning"]
        end
    end
    
    style Constraints fill:#ffebee,stroke:#c62828
    style Tech fill:#fff3e0,stroke:#e65100
    style Data fill:#e8f5e9,stroke:#2e7d32
    style Process fill:#e3f2fd,stroke:#01579b
    style Excluded fill:#fce4ec,stroke:#c2185b
```

### Limitation Details

| Category | Limitation | Workaround |
|----------|------------|------------|
| **Fundamentals** | Screener.in data via web search, not API | Manually verify before acting |
| **Charts** | No technical analysis | Use external charting tools |
| **Execution** | Manual order placement | Place orders after report review |
| **GTT** | Not auto-updated | Review GTTs weekly |
| **Broker** | Zerodha only | None - platform limitation |
| **Data** | Quarterly fundamental updates | Use latest annual reports |

### NEW Features Implemented (v1.1)

| Feature | Status | Implementation |
|---------|--------|----------------|
| **Tax-Loss Harvesting** | ✅ ADDED | Flag stocks with >10% loss, calculate potential savings |
| **Capital Gains Calculation** | ✅ ADDED | Unrealized gains in portfolio_snapshot.json |
| **Dividend Tracking** | ✅ ADDED | Dividend tracker sheet with expected income |
| **Excel Export** | ✅ ADDED | create_portfolio_export.js with 5 sheets |
| **Commodity Scanner** | ✅ ADDED | commodity-scanner agent for MCX |
| **Weekly Export** | ✅ ADDED | create_weekly_export.js for weekly summary |

---

*Document Version: v1.1 | Last Updated: March 2026*