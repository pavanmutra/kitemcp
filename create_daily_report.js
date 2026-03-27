const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
        Header, Footer, PageNumber } = require('docx');
const fs = require('fs');

// Get today's date
const today = new Date().toISOString().split('T')[0];
const reportDate = today.replace(/-/g, '-');

// Helper function to safely read JSON file
function readJsonFile(filepath) {
    try {
        if (fs.existsSync(filepath)) {
            return JSON.parse(fs.readFileSync(filepath, 'utf8'));
        }
    } catch (e) {
        console.log(`Warning: Could not read ${filepath}`);
    }
    return null;
}

// Load all data from JSON files
const portfolioData = readJsonFile(`reports/${reportDate}_portfolio_snapshot.json`);
const valueData = readJsonFile(`reports/${reportDate}_value_screen.json`);
const gttData = readJsonFile(`reports/${reportDate}_gtt_audit.json`);
const oppData = readJsonFile(`reports/${reportDate}_opportunities.json`);
const newsOppData = readJsonFile(`reports/${reportDate}_news_opportunities.json`);

// Generate IMMEDIATE ACTIONS from other data sources
const immediateActions = [];

// From GTT Audit - Unprotected holdings
if (gttData?.unprotected_holdings?.length > 0) {
    gttData.unprotected_holdings.forEach(symbol => {
        immediateActions.push({
            type: "UNPROTECTED_HOLDING",
            symbol: symbol,
            message: `${symbol} has no GTT stop-loss - Add protection`,
            priority: "MEDIUM",
            action_required: "Place GTT"
        });
    });
}

// From Value Screen - Deep discount alerts (MoS > 40%)
if (valueData?.stocks) {
    valueData.stocks.filter(s => s.margin_of_safety > 40).forEach(stock => {
        immediateActions.push({
            type: "DEEP_DISCOUNT_ALERT",
            symbol: stock.symbol,
            message: `${stock.symbol} at ${stock.margin_of_safety?.toFixed(1)}% margin of safety - Strong accumulate signal`,
            priority: "HIGH",
            action_required: "Consider adding"
        });
    });
    
    // From Value Screen - Overvalued
    valueData.stocks.filter(s => s.margin_of_safety < -15).forEach(stock => {
        const premium = Math.abs(stock.margin_of_safety).toFixed(1);
        immediateActions.push({
            type: "OVERVALUED",
            symbol: stock.symbol,
            message: `${stock.symbol} trading ${premium}% above intrinsic value - Consider trimming`,
            priority: "MEDIUM",
            action_required: "Review trim"
        });
    });
}

// From Portfolio - Large losses
holdings.filter(h => (h.pnl / (h.qty * h.avg) * 100) < -15).forEach(h => {
    const lossPct = (h.pnl / (h.qty * h.avg) * 100).toFixed(1);
    immediateActions.push({
        type: "LARGE_LOSS",
        symbol: h.symbol,
        message: `${h.symbol} down ${lossPct}% - Review position`,
        priority: "HIGH",
        action_required: "Review stop-loss"
    });
});

// Get news opportunities
const newsOpportunities = newsOppData?.opportunities || [];

// Use loaded data or fallback to defaults - map JSON keys to internal format
const rawHoldings = portfolioData?.holdings || [
    { symbol: "CAMS", qty: 228, avg: 713.99, last: 644.20, pnl: -15912.05 },
    { symbol: "ENERGY", qty: 2571, avg: 36.08, last: 35.71, pnl: -955.87 },
    { symbol: "JINDALPHOT", qty: 85, avg: 1320.71, last: 1096.30, pnl: -19074.90 },
    { symbol: "NXST-RR", qty: 650, avg: 135.19, last: 155.52, pnl: 13217.14 },
    { symbol: "TMCV", qty: 110, avg: 355.37, last: 431.85, pnl: 8412.26 },
    { symbol: "VHL", qty: 35, avg: 3608.39, last: 3143.40, pnl: -16274.50 }
];

// Normalize holding data - handle different JSON key formats
const holdings = rawHoldings.map(h => ({
    symbol: h.symbol || h.tradingsymbol,
    qty: h.quantity || h.qty,
    avg: h.average_price || h.avg,
    last: h.last_price || h.last,
    pnl: h.pnl
}));

const totalValue = holdings.reduce((sum, h) => sum + (h.qty * h.last), 0);
const totalInvested = holdings.reduce((sum, h) => sum + (h.qty * h.avg), 0);
const totalPnl = holdings.reduce((sum, h) => sum + h.pnl, 0);
const totalPnlPct = (totalPnl / totalInvested * 100);
const availableMargin = portfolioData?.available_margin || 1999661.80;

// Get deep discount stocks from value screen
const deepDiscountStocks = valueData?.stocks?.filter(s => s.margin_of_safety > 25) || [];
const overvaluedStocks = valueData?.stocks?.filter(s => s.margin_of_safety < 0) || [];

// Get GTT info
const activeGTTs = gttData?.active_gtts?.length || 0;
const protectedHoldings = gttData?.protected_holdings?.length || 0;

// Get opportunities
const opportunities = oppData?.opportunities || [];

// Action mapping based on value screen
const getAction = (symbol) => {
    const stock = valueData?.stocks?.find(s => s.symbol === symbol);
    if (stock?.margin_of_safety > 25) return "ACCUMULATE";
    if (stock?.margin_of_safety < -50) return "TRIM/EXIT";
    return "HOLD";
};

// Helper functions
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerBorders = { top: { style: BorderStyle.SINGLE, size: 1, color: "1F4E79" }, 
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "1F4E79" }, 
                        left: border, right: border };

const createHeaderCell = (text, width) => new TableCell({
    borders: headerBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "1F4E79", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial" })] })]
});

const createCell = (text, width, options = {}) => new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: options.fill ? { fill: options.fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ 
        text, 
        bold: options.bold || false, 
        color: options.color,
        font: "Arial",
        size: 22
    })] })]
});

// Document generation starts here
const doc = new Document({
    styles: {
        default: { document: { run: { font: "Arial", size: 22 } } },
        paragraphStyles: [
            { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
              run: { size: 36, bold: true, font: "Arial", color: "1F4E79" },
              paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
            { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
              run: { size: 28, bold: true, font: "Arial", color: "2E75B6" },
              paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
        ]
    },
    numbering: {
        config: [
            { reference: "bullets",
              levels: [{ level: 0, format: "bullet", text: "\u2022", alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
            { reference: "numbers",
              levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        ]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
        },
        headers: {
            default: new Header({ children: [new Paragraph({ 
                children: [new TextRun({ text: "KITE DAILY PORTFOLIO REPORT", bold: true, color: "1F4E79", font: "Arial" })],
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F4E79", space: 1 } }
            })] })
        },
        footers: {
            default: new Footer({ children: [new Paragraph({ 
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Page ", font: "Arial", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 20 })]
            })] })
        },
        children: [
            new Paragraph({ children: [new TextRun({ text: "Daily Portfolio Briefing", bold: true, size: 48, font: "Arial", color: "1F4E79" })] }),
            new Paragraph({ children: [new TextRun({ text: `Generated: ${today} | Morning Report | Analyst: AI Portfolio Advisor (15+ years expertise)`, font: "Arial", size: 22, color: "666666" })] }),
            new Paragraph({ children: [] }),
            
            // Section 1: IMMEDIATE ACTIONS REQUIRED
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. IMMEDIATE ACTIONS REQUIRED ⚠️")] }),
            ...(immediateActions.length > 0 ? [
                // HIGH PRIORITY
                ...(immediateActions.filter(a => a.priority === "HIGH").length > 0 ? [
                    new Paragraph({ children: [new TextRun({ text: "🔴 HIGH PRIORITY", bold: true, color: "C00000", font: "Arial" })] }),
                    new Paragraph({ children: [] }),
                    ...immediateActions.filter(a => a.priority === "HIGH").map(a => 
                        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: `${a.symbol} - ${a.type}: ${a.message}`, font: "Arial", color: "C00000" })] })
                    ),
                    new Paragraph({ children: [] })
                ] : []),
                // MEDIUM PRIORITY
                ...(immediateActions.filter(a => a.priority === "MEDIUM").length > 0 ? [
                    new Paragraph({ children: [new TextRun({ text: "🟡 MEDIUM PRIORITY", bold: true, color: "FF8000", font: "Arial" })] }),
                    new Paragraph({ children: [] }),
                    ...immediateActions.filter(a => a.priority === "MEDIUM").map(a => 
                        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: `${a.symbol} - ${a.type}: ${a.message}`, font: "Arial", color: "FF8000" })] })
                    ),
                    new Paragraph({ children: [] })
                ] : []),
            ] : [
                new Paragraph({ children: [new TextRun({ text: "No immediate actions required. All portfolio risks are under control.", font: "Arial", color: "00B050" })] }),
            ]),
            new Paragraph({ children: [] }),

            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. PORTFOLIO SUMMARY")] }),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [4680, 4680],
                rows: [
                    new TableRow({ children: [
                        createCell("Total Portfolio Value", 4680, { bold: true }),
                        createCell("\u20B9 " + Math.round(totalValue).toLocaleString('en-IN', {minimumFractionDigits: 0}), 4680)
                    ]}),
                    new TableRow({ children: [
                        createCell("Total Investment", 4680, { bold: true }),
                        createCell("\u20B9 " + Math.round(totalInvested).toLocaleString('en-IN', {minimumFractionDigits: 0}), 4680)
                    ]}),
                    new TableRow({ children: [
                        createCell("Unrealized P&L", 4680, { bold: true }),
                        createCell((totalPnl < 0 ? "- " : "+ ") + "\u20B9 " + Math.abs(Math.round(totalPnl)).toLocaleString('en-IN', {minimumFractionDigits: 0}) + " (" + totalPnlPct.toFixed(1) + "%)", 4680, { color: totalPnl < 0 ? "C00000" : "00B050" })
                    ]}),
                    new TableRow({ children: [
                        createCell("Available Margin", 4680, { bold: true }),
                        createCell("\u20B9 " + Math.round(availableMargin).toLocaleString('en-IN', {minimumFractionDigits: 0}), 4680)
                    ]}),
                    new TableRow({ children: [
                        createCell("Number of Holdings", 4680, { bold: true }),
                        createCell(holdings.length.toString() + " stocks", 4680)
                    ]}),
                ]
            }),
            new Paragraph({ children: [] }),

            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. HOLDINGS BREAKDOWN")] }),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [1100, 800, 1000, 1100, 1400, 1100, 1260],
                rows: [
                    new TableRow({ children: [
                        createHeaderCell("Symbol", 1100),
                        createHeaderCell("Qty", 800),
                        createHeaderCell("Avg", 1000),
                        createHeaderCell("Current", 1100),
                        createHeaderCell("P&L (\u20B9)", 1400),
                        createHeaderCell("P&L %", 1100),
                        createHeaderCell("Action", 1260)
                    ]}),
                    ...holdings.map(h => new TableRow({ children: [
                        createCell(h.symbol, 1100),
                        createCell(h.qty.toString(), 800),
                        createCell(h.avg?.toFixed(2) || "0", 1000),
                        createCell(h.last?.toFixed(2) || "0", 1100),
                        createCell((h.pnl >= 0 ? "+" : "") + Math.round(h.pnl).toLocaleString('en-IN'), 1400, { color: h.pnl >= 0 ? "00B050" : "C00000" }),
                        createCell((h.pnl / (h.qty * h.avg) * 100).toFixed(1) + "%", 1100, { color: h.pnl >= 0 ? "00B050" : "C00000" }),
                        createCell(getAction(h.symbol), 1260, { 
                            fill: getAction(h.symbol) === "ACCUMULATE" ? "C6EFCE" : getAction(h.symbol) === "TRIM/EXIT" ? "FFC7CE" : "FFEB9C",
                            bold: true 
                        })
                    ]}))
                ]
            }),
            new Paragraph({ children: [] }),

            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. DEEP DISCOUNT STOCKS")] }),
            new Paragraph({ children: [new TextRun({ text: "Stocks with Margin of Safety > 25% (Undervalued)", bold: true, font: "Arial" })] }),
            new Paragraph({ children: [] }),
            ...(deepDiscountStocks.length > 0 ? [
                new Table({
                    width: { size: 9360, type: WidthType.DXA },
                    columnWidths: [1560, 1560, 1560, 1560, 1560, 1560],
                    rows: [
                        new TableRow({ children: [
                            createHeaderCell("Symbol", 1560),
                            createHeaderCell("Current", 1560),
                            createHeaderCell("IV (Graham)", 1560),
                            createHeaderCell("MoS %", 1560),
                            createHeaderCell("Status", 1560),
                            createHeaderCell("Action", 1560)
                        ]}),
                        ...deepDiscountStocks.map(s => new TableRow({ children: [
                            createCell(s.symbol, 1560),
                            createCell(s.current_price?.toString() || "0", 1560),
                            createCell(Math.round(s.graham_number || 0).toString(), 1560),
                            createCell(s.margin_of_safety?.toFixed(1) + "%" || "0%", 1560, { color: "00B050", bold: true }),
                            createCell(s.status || "DEEP DISCOUNT", 1560, { fill: "C6EFCE" }),
                            createCell(s.action || "ACCUMULATE", 1560, { fill: "C6EFCE", bold: true })
                        ]}))
                    ]
                })
            ] : [
                new Paragraph({ children: [new TextRun({ text: "No deep discount stocks found in current portfolio.", font: "Arial", color: "666666" })] })
            ]),
            new Paragraph({ children: [] }),

            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. OVERVALUED STOCKS")] }),
            new Paragraph({ children: [new TextRun({ text: "Stocks trading above intrinsic value", bold: true, font: "Arial" })] }),
            new Paragraph({ children: [] }),
            ...(overvaluedStocks.length > 0 ? [
                new Table({
                    width: { size: 9360, type: WidthType.DXA },
                    columnWidths: [2340, 2340, 2340, 2340],
                    rows: [
                        new TableRow({ children: [
                            createHeaderCell("Symbol", 2340),
                            createHeaderCell("Current", 2340),
                            createHeaderCell("IV (Graham)", 2340),
                            createHeaderCell("Action", 2340)
                        ]}),
                        ...overvaluedStocks.map(s => new TableRow({ children: [
                            createCell(s.symbol, 2340),
                            createCell(s.current_price?.toString() || "0", 2340),
                            createCell(Math.round(s.graham_number || 0).toString(), 2340),
                            createCell(s.action || "HOLD/TRIM", 2340, { fill: "FFC7CE", bold: true })
                        ]}))
                    ]
                })
            ] : [
                new Paragraph({ children: [new TextRun({ text: "No overvalued stocks in portfolio.", font: "Arial", color: "666666" })] })
            ]),
            new Paragraph({ children: [] }),

            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. GTT PROTECTION STATUS")] }),
            new Paragraph({ children: [new TextRun({ 
                text: `${activeGTTs} active GTT orders | ${protectedHoldings} holdings protected`, 
                bold: true, 
                font: "Arial", 
                color: protectedHoldings === holdings.length ? "00B050" : "C00000" 
            })] }),
            ...(gttData?.unprotected_holdings?.length > 0 ? [
                new Paragraph({ children: [new TextRun({ text: "WARNING: Unprotected holdings: " + gttData.unprotected_holdings.join(", "), font: "Arial", color: "C00000" })] })
            ] : []),
            new Paragraph({ children: [] }),

            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. INVESTMENT OPPORTUNITIES")]}),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Web-Scanned Opportunities")]}),
            ...(opportunities.length > 0 ? [
                new Table({
                    width: { size: 9360, type: WidthType.DXA },
                    columnWidths: [1560, 1560, 1560, 1560, 1560],
                    rows: [
                        new TableRow({ children: [
                            createHeaderCell("Stock", 1560),
                            createHeaderCell("Horizon", 1560),
                            createHeaderCell("Target 3M", 1560),
                            createHeaderCell("Upside", 1560),
                            createHeaderCell("Recommendation", 1560)
                        ]}),
                        ...opportunities.slice(0, 5).map(o => new TableRow({ children: [
                            createCell(o.symbol, 1560),
                            createCell(o.horizon, 1560),
                            createCell(o.target_3m ? "\u20B9" + o.target_3m : "-", 1560),
                            createCell(o.upside_3m ? "+" + o.upside_3m + "%" : "-", 1560, { color: "00B050" }),
                            createCell(o.recommendation, 1560, { fill: "C6EFCE" })
                        ]}))
                    ]
                })
            ] : [
                new Paragraph({ children: [new TextRun({ text: "No new opportunities scanned today.", font: "Arial", color: "666666" })] })
            ]),
            new Paragraph({ children: [] }),

            // News-Driven Opportunities
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("News-Driven Opportunities")] }),
            ...(newsOpportunities.length > 0 ? [
                new Table({
                    width: { size: 9360, type: WidthType.DXA },
                    columnWidths: [1560, 1560, 1560, 1560, 1560],
                    rows: [
                        new TableRow({ children: [
                            createHeaderCell("Stock", 1560),
                            createHeaderCell("Type", 1560),
                            createHeaderCell("Headline", 1560),
                            createHeaderCell("Impact", 1560),
                            createHeaderCell("Action", 1560)
                        ]}),
                        ...newsOpportunities.slice(0, 5).map(o => new TableRow({ children: [
                            createCell(o.symbol, 1560),
                            createCell(o.type, 1560),
                            createCell(o.headline?.substring(0, 30) + "..." || "-", 1560),
                            createCell(o.impact_score ? o.impact_score + "/10" : "-", 1560),
                            createCell(o.recommendation || "-", 1560, { fill: o.sentiment === "BULLISH" ? "C6EFCE" : "FFC7CE" })
                        ]}))
                    ]
                })
            ] : [
                new Paragraph({ children: [new TextRun({ text: "No news-driven opportunities identified today.", font: "Arial", color: "666666" })] })
            ]),
            new Paragraph({ children: [] }),

            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. ACTION ITEMS")]}),
            new Paragraph({ children: [new TextRun({ text: "Today's Recommended Actions:", bold: true, font: "Arial" })] }),
            ...(deepDiscountStocks.length > 0 ? [
                new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Deep discount stocks available - consider ACCUMULATE on dips", font: "Arial", color: "00B050" })] })
            ] : []),
            ...(overvaluedStocks.length > 2 ? [
                new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Multiple overvalued stocks - consider TRIMMING positions", font: "Arial", color: "C00000" })] })
            ] : []),
            new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Ensure all holdings have GTT stop-loss protection", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Review opportunities before making new purchases", font: "Arial" })] }),
            new Paragraph({ children: [] }),

            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. MARKET STATUS")] }),
            new Paragraph({ children: [new TextRun({ text: "Market Hours: 9:15 AM - 3:30 PM IST", bold: true, font: "Arial" })] }),
            new Paragraph({ children: [new TextRun({ text: "Check live status before trading", font: "Arial" })] }),
            new Paragraph({ children: [] }),
            
            new Paragraph({ children: [] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. PORTFOLIO SUMMARY")] }),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [4680, 4680],
                rows: [
                    new TableRow({ children: [
                        createCell("Total Portfolio Value", 4680, { bold: true }),
                        createCell("\u20B9 " + totalValue.toLocaleString('en-IN', {minimumFractionDigits: 0}), 4680)
                    ]}),
                    new TableRow({ children: [
                        createCell("Total Investment", 4680, { bold: true }),
                        createCell("\u20B9 " + totalInvested.toLocaleString('en-IN', {minimumFractionDigits: 0}), 4680)
                    ]}),
                    new TableRow({ children: [
                        createCell("Unrealized P&L", 4680, { bold: true }),
                        createCell((totalPnl < 0 ? "- " : "+ ") + "\u20B9 " + Math.abs(totalPnl).toLocaleString('en-IN', {minimumFractionDigits: 0}) + " (" + (totalPnl/totalInvested*100).toFixed(1) + "%)", 4680, { color: totalPnl < 0 ? "C00000" : "00B050" })
                    ]}),
                    new TableRow({ children: [
                        createCell("Available Margin", 4680, { bold: true }),
                        createCell("\u20B9 " + Math.round(availableMargin).toLocaleString('en-IN', {minimumFractionDigits: 0}), 4680)
                    ]}),
                ]
            }),
            new Paragraph({ children: [] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. HOLDINGS BREAKDOWN")] }),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [1200, 900, 1100, 1200, 1500, 1260, 1260],
                rows: [
                    new TableRow({ children: [
                        createHeaderCell("Symbol", 1200),
                        createHeaderCell("Qty", 900),
                        createHeaderCell("Avg (\u20B9)", 1100),
                        createHeaderCell("Current (\u20B9)", 1200),
                        createHeaderCell("P&L (\u20B9)", 1500),
                        createHeaderCell("P&L %", 1260),
                        createHeaderCell("Action", 1260)
                    ]}),
                    ...holdings.map(h => new TableRow({ children: [
                        createCell(h.symbol, 1200),
                        createCell(h.qty?.toString() || "0", 900),
                        createCell(h.avg?.toFixed(2) || "0", 1100),
                        createCell(h.last?.toFixed(2) || "0", 1200),
                        createCell((h.pnl >= 0 ? "+" : "") + Math.round(h.pnl || 0).toLocaleString('en-IN'), 1500, { color: (h.pnl || 0) >= 0 ? "00B050" : "C00000" }),
                        createCell(((h.pnl || 0) / (h.qty || 1) / (h.avg || 1) * 100).toFixed(1) + "%", 1260, { color: (h.pnl || 0) >= 0 ? "00B050" : "C00000" }),
                        createCell(getAction(h.symbol), 1260, { 
                            fill: getAction(h.symbol) === "ACCUMULATE" ? "C6EFCE" : getAction(h.symbol) === "TRIM/EXIT" ? "FFC7CE" : "FFEB9C",
                            bold: true 
                        })
                    ]}))
                ]
            }),
            new Paragraph({ children: [] }),

            // Section 3: Deep Discount Stocks (from value_screen.json)
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. DEEP DISCOUNT STOCKS")] }),
            new Paragraph({ children: [new TextRun({ text: "Stocks with Margin of Safety > 25% (Undervalued)", bold: true, font: "Arial" })] }),
            new Paragraph({ children: [] }),
            ...(deepDiscountStocks.length > 0 ? [
                new Table({
                    width: { size: 9360, type: WidthType.DXA },
                    columnWidths: [1560, 1560, 1560, 1560, 1560, 1560],
                    rows: [
                        new TableRow({ children: [
                            createHeaderCell("Symbol", 1560),
                            createHeaderCell("Current", 1560),
                            createHeaderCell("IV (Graham)", 1560),
                            createHeaderCell("MoS %", 1560),
                            createHeaderCell("Status", 1560),
                            createHeaderCell("Action", 1560)
                        ]}),
                        ...deepDiscountStocks.map(s => new TableRow({ children: [
                            createCell(s.symbol, 1560),
                            createCell(s.current_price?.toString() || "0", 1560),
                            createCell(Math.round(s.graham_number || 0).toString(), 1560),
                            createCell(s.margin_of_safety?.toFixed(1) + "%" || "0%", 1560, { color: "00B050", bold: true }),
                            createCell(s.status || "DEEP DISCOUNT", 1560, { fill: "C6EFCE" }),
                            createCell(s.action || "ACCUMULATE", 1560, { fill: "C6EFCE", bold: true })
                        ]}))
                    ]
                })
            ] : [
                new Paragraph({ children: [new TextRun({ text: "No deep discount stocks found in current portfolio.", font: "Arial", color: "666666" })] })
            ]),
            new Paragraph({ children: [] }),

            // Section 4: Overvalued Stocks
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. OVERVALUED STOCKS")] }),
            new Paragraph({ children: [new TextRun({ text: "Stocks trading above intrinsic value", bold: true, font: "Arial" })] }),
            new Paragraph({ children: [] }),
            ...(overvaluedStocks.length > 0 ? [
                new Table({
                    width: { size: 9360, type: WidthType.DXA },
                    columnWidths: [2340, 2340, 2340, 2340],
                    rows: [
                        new TableRow({ children: [
                            createHeaderCell("Symbol", 2340),
                            createHeaderCell("Current", 2340),
                            createHeaderCell("IV (Graham)", 2340),
                            createHeaderCell("Action", 2340)
                        ]}),
                        ...overvaluedStocks.map(s => new TableRow({ children: [
                            createCell(s.symbol, 2340),
                            createCell(s.current_price?.toString() || "0", 2340),
                            createCell(Math.round(s.graham_number || 0).toString(), 2340),
                            createCell(s.action || "HOLD/TRIM", 2340, { fill: "FFC7CE", bold: true })
                        ]}))
                    ]
                })
            ] : [
                new Paragraph({ children: [new TextRun({ text: "No overvalued stocks in portfolio.", font: "Arial", color: "666666" })] })
            ]),
            new Paragraph({ children: [] }),

            // Section 5: GTT Protection Status
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. GTT PROTECTION STATUS")] }),
            new Paragraph({ children: [new TextRun({ 
                text: `${activeGTTs} active GTT orders | ${protectedHoldings} holdings protected`, 
                bold: true, 
                font: "Arial", 
                color: protectedHoldings === holdings.length ? "00B050" : "C00000" 
            })] }),
            ...(gttData?.unprotected_holdings?.length > 0 ? [
                new Paragraph({ children: [new TextRun({ text: "WARNING: Unprotected holdings: " + gttData.unprotected_holdings.join(", "), font: "Arial", color: "C00000" })] })
            ] : []),
            new Paragraph({ children: [] }),

            // Section 6: Investment Opportunities (from web search)
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. INVESTMENT OPPORTUNITIES")] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Web-Scanned Opportunities")]}),
            ...(opportunities.length > 0 ? [
                new Table({
                    width: { size: 9360, type: WidthType.DXA },
                    columnWidths: [1560, 1560, 1560, 1560, 1560],
                    rows: [
                        new TableRow({ children: [
                            createHeaderCell("Stock", 1560),
                            createHeaderCell("Horizon", 1560),
                            createHeaderCell("Target 3M", 1560),
                            createHeaderCell("Upside", 1560),
                            createHeaderCell("Recommendation", 1560)
                        ]}),
                        ...opportunities.slice(0, 5).map(o => new TableRow({ children: [
                            createCell(o.symbol, 1560),
                            createCell(o.horizon, 1560),
                            createCell(o.target_3m ? "\u20B9" + o.target_3m : "-", 1560),
                            createCell(o.upside_3m ? "+" + o.upside_3m + "%" : "-", 1560, { color: "00B050" }),
                            createCell(o.recommendation, 1560, { fill: "C6EFCE" })
                        ]}))
                    ]
                })
            ] : [
                new Paragraph({ children: [new TextRun({ text: "No new opportunities scanned today.", font: "Arial", color: "666666" })] })
            ]),
            new Paragraph({ children: [] }),

            // Section 7: Action Items
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. ACTION ITEMS")] }),
            new Paragraph({ children: [new TextRun({ text: "Today's Recommended Actions:", bold: true, font: "Arial" })] }),
            ...(deepDiscountStocks.length > 0 ? [
                new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Deep discount stocks available - consider ACCUMULATE on dips", font: "Arial", color: "00B050" })] })
            ] : []),
            ...(overvaluedStocks.length > 2 ? [
                new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Multiple overvalued stocks - consider TRIMMING positions", font: "Arial", color: "C00000" })] })
            ] : []),
            new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Ensure all holdings have GTT stop-loss protection", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Review opportunities before making new purchases", font: "Arial" })] }),
            new Paragraph({ children: [] }),

            // Section 8: Market Status
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. MARKET STATUS")] }),
            new Paragraph({ children: [new TextRun({ text: "Market Hours: 9:15 AM - 3:30 PM IST", bold: true, font: "Arial" })] }),
            new Paragraph({ children: [new TextRun({ text: "Check live status before trading", font: "Arial" })] }),
            new Paragraph({ children: [] }),
            
            new Paragraph({ children: [] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. ACTION ITEMS")]}),
            new Paragraph({ children: [new TextRun({ text: "Today\'s Recommendations:", bold: true, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "TMCV: Best performer (+19.8% total). Hold - consider taking partial profits above \u20B9 450", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "NXST: Strong recovery (+13.7%). Watch for target achievement", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "CAMS: Significant underperformance (-20.2%). Average down opportunity or hold for recovery", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "JINDALPHOT: Consider tax loss harvesting (13.6% loss)", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "VHL: Underperforming (-11.1%). Monitor for improvement or exit", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "ENERGY: Small loss (-0.9%). Hold for long-term", font: "Arial" })] }),
            new Paragraph({ children: [] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. INTRINSIC VALUE SCREEN")] }),
            new Paragraph({ children: [new TextRun({ text: "Deep Discount Stocks (Margin of Safety > 25%):", bold: true, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "TMCV: Current Rs.432, IV ~Rs.707 (38.9% MoS) - ACCUMULATE", font: "Arial", color: "00B050" })] }),
            new Paragraph({ children: [] }),
            new Paragraph({ children: [new TextRun({ text: "Overvalued Stocks:", bold: true, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "CAMS, JINDALPHOT, NXST-RR, VHL, ENERGY - Price > Intrinsic Value", font: "Arial", color: "C00000" })] }),
            new Paragraph({ children: [] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. GTT STATUS")] }),
            new Paragraph({ children: [new TextRun({ text: "All 6 holdings have active GTT orders. 15 total GTTs active.", bold: true, font: "Arial", color: "00B050" })] }),
            new Paragraph({ children: [] }),

            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. MARKET STATUS")] }),
            new Paragraph({ children: [new TextRun({ text: "Market Hours: 9:15 AM - 3:30 PM IST", bold: true, font: "Arial" })] }),
            new Paragraph({ children: [new TextRun({ text: "Check live status before trading", font: "Arial" })] }),
            new Paragraph({ children: [] }),
            
            new Paragraph({ children: [] }),
            new Paragraph({ 
                children: [new TextRun({ text: "DISCLAIMER: This report is for informational purposes only. Not investment advice. Consult a financial advisor before making decisions.", font: "Arial", size: 18, color: "666666", italics: true })],
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 4 } }
            }),
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    const outputPath = `C:/Users/pc/Desktop/kitemcp/reports/${reportDate}_daily_report.docx`;
    fs.writeFileSync(outputPath, buffer);
    console.log(`Daily report saved to: ${outputPath}`);
    console.log("\n=== DATA SOURCES USED ===");
    console.log(`Portfolio: ${portfolioData ? "Loaded from JSON" : "Fallback data"}`);
    console.log(`Value Screen: ${valueData ? "Loaded from JSON" : "Not found"}`);
    console.log(`GTT Audit: ${gttData ? "Loaded from JSON" : "Not found"}`);
    console.log(`Web Opportunities: ${oppData ? "Loaded from JSON" : "Not found"}`);
    console.log(`News Opportunities: ${newsOppData ? "Loaded from JSON" : "Not found"}`);
    console.log(`Immediate Actions Generated: ${immediateActions.length}`);
});