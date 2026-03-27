const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
        Header, Footer, PageNumber } = require('docx');
const fs = require('fs');

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
                children: [new TextRun({ text: "KITE PORTFOLIO ANALYSIS REPORT", bold: true, color: "1F4E79", font: "Arial" })],
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
            // Title
            new Paragraph({ children: [new TextRun({ text: "Portfolio Analysis & Recommendations Report", bold: true, size: 48, font: "Arial", color: "1F4E79" })] }),
            new Paragraph({ children: [new TextRun({ text: "Generated: March 20, 2026", font: "Arial", size: 22, color: "666666" })] }),
            new Paragraph({ children: [] }),
            
            // Executive Summary
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. EXECUTIVE SUMMARY")] }),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [4680, 4680],
                rows: [
                    new TableRow({ children: [
                        createCell("Total Portfolio Value", 4680, { bold: true }),
                        createCell("\u20B9 7,64,000", 4680)
                    ]}),
                    new TableRow({ children: [
                        createCell("Total Investment", 4680, { bold: true }),
                        createCell("\u20B9 9,14,000", 4680)
                    ]}),
                    new TableRow({ children: [
                        createCell("Unrealized P&L", 4680, { bold: true }),
                        createCell("- \u20B9 1,50,000 (-16.4%)", 4680, { color: "C00000" })
                    ]}),
                    new TableRow({ children: [
                        createCell("Day's Change", 4680, { bold: true }),
                        createCell("+ \u20B9 11,500 (+1.5%)", 4680, { color: "00B050" })
                    ]}),
                ]
            }),
            new Paragraph({ children: [] }),
            new Paragraph({ children: [new TextRun({ text: "Key Recommendations:", bold: true, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Harvest tax losses from 4 stocks: DVL, BFINVEST, JINDALPHOT, VHL", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Reduce FMCGIETF overexposure by 50%", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Average down IOB (strong fundamentals, weak price)", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Hold TMCV (best performer, target \u20B9 481)", font: "Arial" })] }),
            
            // Holdings Analysis
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. HOLDINGS ANALYSIS")] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Top Performers")] }),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [1800, 1560, 1560, 1560, 1560, 1320],
                rows: [
                    new TableRow({ children: [
                        createHeaderCell("Symbol", 1800),
                        createHeaderCell("Current", 1560),
                        createHeaderCell("P&L (\u20B9)", 1560),
                        createHeaderCell("P&L %", 1560),
                        createHeaderCell("Day %", 1560),
                        createHeaderCell("Action", 1320)
                    ]}),
                    new TableRow({ children: [
                        createCell("TMCV", 1800),
                        createCell("419.60", 1560),
                        createCell("+37,656", 1560, { color: "00B050" }),
                        createCell("+52.7%", 1560, { color: "00B050" }),
                        createCell("+0.52%", 1560, { color: "00B050" }),
                        createCell("HOLD", 1320, { fill: "FFEB9C" })
                    ]}),
                    new TableRow({ children: [
                        createCell("NXST-RR", 1800),
                        createCell("154.68", 1560),
                        createCell("+12,671", 1560, { color: "00B050" }),
                        createCell("+14.4%", 1560, { color: "00B050" }),
                        createCell("-0.62%", 1560, { color: "C00000" }),
                        createCell("WATCH", 1320, { fill: "FFEB9C" })
                    ]}),
                ]
            }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 Underperformers (Tax Harvesting Candidates)")] }),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [1800, 1560, 1560, 1560, 1320, 1560],
                rows: [
                    new TableRow({ children: [
                        createHeaderCell("Symbol", 1800),
                        createHeaderCell("Current", 1560),
                        createHeaderCell("Loss (\u20B9)", 1560),
                        createHeaderCell("Loss %", 1560),
                        createHeaderCell("Action", 1320),
                        createHeaderCell("Tax Saving", 1560)
                    ]}),
                    new TableRow({ children: [
                        createCell("DVL", 1800),
                        createCell("209.71", 1560),
                        createCell("-9,958", 1560, { color: "C00000" }),
                        createCell("-23.6%", 1560, { color: "C00000" }),
                        createCell("SELL", 1320, { fill: "FFC7CE" }),
                        createCell("\u20B9 1,992", 1560, { color: "00B050" })
                    ]}),
                    new TableRow({ children: [
                        createCell("BFINVEST", 1800),
                        createCell("370.90", 1560),
                        createCell("-12,345", 1560, { color: "C00000" }),
                        createCell("-21.2%", 1560, { color: "C00000" }),
                        createCell("SELL", 1320, { fill: "FFC7CE" }),
                        createCell("\u20B9 2,469", 1560, { color: "00B050" })
                    ]}),
                    new TableRow({ children: [
                        createCell("JINDALPHOT", 1800),
                        createCell("1,141.40", 1560),
                        createCell("-15,241", 1560, { color: "C00000" }),
                        createCell("-13.6%", 1560, { color: "C00000" }),
                        createCell("SELL", 1320, { fill: "FFC7CE" }),
                        createCell("\u20B9 3,048", 1560, { color: "00B050" })
                    ]}),
                    new TableRow({ children: [
                        createCell("VHL", 1800),
                        createCell("3,148.20", 1560),
                        createCell("-16,107", 1560, { color: "C00000" }),
                        createCell("-12.8%", 1560, { color: "C00000" }),
                        createCell("SELL", 1320, { fill: "FFC7CE" }),
                        createCell("\u20B9 3,221", 1560, { color: "00B050" })
                    ]}),
                ]
            }),
            
            // Tax Harvesting Section
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. TAX LOSS HARVESTING STRATEGY")] }),
            new Paragraph({ children: [new TextRun({ text: "Indian Tax Rules for Equity:", bold: true, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Short-Term Capital Loss (STCL): Can offset Short-Term or Long-Term Capital Gains", font: "Arial", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Long-Term Capital Loss (LTCL): Can offset Long-Term Capital Gains only", font: "Arial", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "STCG from equity: 20% (with indexation) or 15% (without indexation)", font: "Arial", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "LTCG > \u20B9 1 lakh: 12.5% (without indexation)", font: "Arial", size: 22 })] }),
            new Paragraph({ children: [] }),
            
            new Paragraph({ children: [new TextRun({ text: "Recommended Actions:", bold: true, font: "Arial" })] }),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [2340, 2340, 2340, 2340],
                rows: [
                    new TableRow({ children: [
                        createHeaderCell("Stock", 2340),
                        createHeaderCell("Loss to Harvest", 2340),
                        createHeaderCell("Tax Saving @ 20%", 2340),
                        createHeaderCell("Wash Sale Period", 2340)
                    ]}),
                    new TableRow({ children: [
                        createCell("DVL", 2340),
                        createCell("\u20B9 9,958", 2340, { color: "C00000" }),
                        createCell("\u20B9 1,992", 2340, { color: "00B050" }),
                        createCell("31 days", 2340)
                    ]}),
                    new TableRow({ children: [
                        createCell("BFINVEST", 2340),
                        createCell("\u20B9 12,345", 2340, { color: "C00000" }),
                        createCell("\u20B9 2,469", 2340, { color: "00B050" }),
                        createCell("31 days", 2340)
                    ]}),
                    new TableRow({ children: [
                        createCell("JINDALPHOT", 2340),
                        createCell("\u20B9 15,241", 2340, { color: "C00000" }),
                        createCell("\u20B9 3,048", 2340, { color: "00B050" }),
                        createCell("31 days", 2340)
                    ]}),
                    new TableRow({ children: [
                        createCell("VHL", 2340),
                        createCell("\u20B9 16,107", 2340, { color: "C00000" }),
                        createCell("\u20B9 3,221", 2340, { color: "00B050" }),
                        createCell("31 days", 2340)
                    ]}),
                    new TableRow({ children: [
                        createCell("TOTAL", 2340, { bold: true }),
                        createCell("\u20B9 53,651", 2340, { bold: true, color: "C00000" }),
                        createCell("\u20B9 10,730", 2340, { bold: true, color: "00B050" }),
                        createCell("", 2340)
                    ]}),
                ]
            }),
            new Paragraph({ children: [] }),
            new Paragraph({ children: [new TextRun({ text: "Important Notes:", bold: true, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Sell stocks and wait 31 days before repurchasing (avoid wash sale)", font: "Arial", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Repurchase similar sector ETFs or different stocks after the cooling period", font: "Arial", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Use harvested losses to offset any capital gains from other investments", font: "Arial", size: 22 })] }),
            
            // Rebalancing Section
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. PORTFOLIO REBALANCING")] }),
            new Paragraph({ children: [new TextRun({ text: "Current Issues:", bold: true, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Concentration Risk: Top 2 holdings (IOB + FMCGIETF) = 55% of portfolio", font: "Arial", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Sector Overweight: FMCG ETF significantly over-allocated", font: "Arial", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Too Many Smallcap/Low Liquidity Stocks: 5 stocks with limited trading", font: "Arial", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Loss-Making Positions: 7 of 10 holdings in loss", font: "Arial", size: 22 })] }),
            new Paragraph({ children: [] }),
            
            new Paragraph({ children: [new TextRun({ text: "Rebalancing Actions:", bold: true, font: "Arial" })] }),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [1560, 1560, 1560, 1560, 1560, 1560],
                rows: [
                    new TableRow({ children: [
                        createHeaderCell("Action", 1560),
                        createHeaderCell("Symbol", 1560),
                        createHeaderCell("Qty", 1560),
                        createHeaderCell("Value (\u20B9)", 1560),
                        createHeaderCell("Allocate To", 1560),
                        createHeaderCell("Amount", 1560)
                    ]}),
                    new TableRow({ children: [
                        createCell("SELL", 1560, { fill: "FFC7CE" }),
                        createCell("DVL", 1560),
                        createCell("154", 1560),
                        createCell("32,295", 1560),
                        createCell("Nifty ETF", 1560),
                        createCell("32,295", 1560)
                    ]}),
                    new TableRow({ children: [
                        createCell("SELL", 1560, { fill: "FFC7CE" }),
                        createCell("BFINVEST", 1560),
                        createCell("124", 1560),
                        createCell("45,992", 1560),
                        createCell("Nifty ETF", 1560),
                        createCell("45,992", 1560)
                    ]}),
                    new TableRow({ children: [
                        createCell("SELL", 1560, { fill: "FFC7CE" }),
                        createCell("JINDALPHOT", 1560),
                        createCell("85", 1560),
                        createCell("97,019", 1560),
                        createCell("Nifty ETF", 1560),
                        createCell("97,019", 1560)
                    ]}),
                    new TableRow({ children: [
                        createCell("SELL", 1560, { fill: "FFC7CE" }),
                        createCell("VHL", 1560),
                        createCell("35", 1560),
                        createCell("110,187", 1560),
                        createCell("Nifty ETF", 1560),
                        createCell("110,187", 1560)
                    ]}),
                    new TableRow({ children: [
                        createCell("SELL", 1560, { fill: "FFC7CE" }),
                        createCell("FMCGIETF (50%)", 1560),
                        createCell("14,070", 1560),
                        createCell("7,09,530", 1560),
                        createCell("Nifty ETF", 1560),
                        createCell("5,00,000", 1560)
                    ]}),
                    new TableRow({ children: [
                        createCell("BUY", 1560, { fill: "C6EFCE" }),
                        createCell("IOB", 1560),
                        createCell("+5,000", 1560),
                        createCell("1,68,600", 1560),
                        createCell("", 1560),
                        createCell("", 1560)
                    ]}),
                ]
            }),
            
            // Target Allocation
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Target Allocation After Rebalancing")] }),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [3120, 2080, 2080, 2080],
                rows: [
                    new TableRow({ children: [
                        createHeaderCell("Asset Class", 3120),
                        createHeaderCell("Current %", 2080),
                        createHeaderCell("Target %", 2080),
                        createHeaderCell("Change", 2080)
                    ]}),
                    new TableRow({ children: [
                        createCell("Large Cap Equity (TMCV, IOB)", 3120),
                        createCell("49%", 2080),
                        createCell("45%", 2080),
                        createCell("-4%", 2080)
                    ]}),
                    new TableRow({ children: [
                        createCell("Index ETF (Nifty)", 3120),
                        createCell("0%", 2080),
                        createCell("25%", 2080),
                        createCell("+25%", 2080, { color: "00B050" })
                    ]}),
                    new TableRow({ children: [
                        createCell("Sector ETF (FMCG)", 3120),
                        createCell("47%", 2080),
                        createCell("20%", 2080),
                        createCell("-27%", 2080, { color: "C00000" })
                    ]}),
                    new TableRow({ children: [
                        createCell("Small Cap (CAMS)", 3120),
                        createCell("5%", 2080),
                        createCell("10%", 2080),
                        createCell("+5%", 2080, { color: "00B050" })
                    ]}),
                ]
            }),
            
            // Action Plan
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. IMPLEMENTATION ACTION PLAN")] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Immediate (This Week)")] }),
            new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Sell DVL, BFINVEST, JINDALPHOT, VHL to harvest tax losses", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Set stop-loss orders on TMCV at \u20B9 380", font: "Arial" })] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Short-Term (1-3 Months)")] }),
            new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "After 31 days, repurchase diversified ETFs with proceeds", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Average down IOB by adding 5,000 shares at current levels", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Reduce FMCGIETF by 50%", font: "Arial" })] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Watch List & Targets")] }),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [2340, 1560, 1560, 1560, 2340],
                rows: [
                    new TableRow({ children: [
                        createHeaderCell("Symbol", 2340),
                        createHeaderCell("Current", 1560),
                        createHeaderCell("Target", 1560),
                        createHeaderCell("Stop Loss", 1560),
                        createHeaderCell("Action", 2340)
                    ]}),
                    new TableRow({ children: [
                        createCell("TMCV", 2340),
                        createCell("419.60", 1560),
                        createCell("481.00", 1560),
                        createCell("380.00", 1560),
                        createCell("Take partial profits at \u20B9 480", 2340)
                    ]}),
                    new TableRow({ children: [
                        createCell("IOB", 2340),
                        createCell("33.72", 1560),
                        createCell("45.00", 1560),
                        createCell("30.00", 1560),
                        createCell("Add more if falls to \u20B9 30", 2340)
                    ]}),
                    new TableRow({ children: [
                        createCell("FMCGIETF", 2340),
                        createCell("50.41", 1560),
                        createCell("62.00", 1560),
                        createCell("45.00", 1560),
                        createCell("Hold, wait for FMCG recovery", 2340)
                    ]}),
                ]
            }),
            
            // Disclaimer
            new Paragraph({ children: [] }),
            new Paragraph({ 
                children: [new TextRun({ text: "DISCLAIMER: This analysis is for educational purposes only and does not constitute investment advice. Stock market investments carry risk. Please consult a qualified financial advisor before making investment decisions.", font: "Arial", size: 18, color: "666666", italics: true })],
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 4 } }
            }),
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync("C:/Users/pc/Desktop/kitemcp/Portfolio_Report.docx", buffer);
    console.log("Word report saved to: C:/Users/pc/Desktop/kitemcp/Portfolio_Report.docx");
});
