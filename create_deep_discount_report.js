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

const stocks = [
    { rank: 1, symbol: "COAL INDIA", name: "Coal India Ltd", price: 468, pe: 9.7, pb: 1.3, roe: 48, div: 5.7, graham: 650, sector: "Mining/PSU", mcap: 288508, note: "Highest dividend yield, stable earnings" },
    { rank: 2, symbol: "ASHOKA BUILD", name: "Ashoka Buildcon Ltd", price: 114, pe: 3.05, pb: 0.5, roe: 40, div: 0, graham: 500, sector: "Infrastructure", mcap: 3193, note: "Deepest discount, high ROCE" },
    { rank: 3, symbol: "CENTRAL BK", name: "Central Bank of India", price: 38, pe: 7.0, pb: 0.6, roe: 5.5, div: 1.6, graham: 73, sector: "PSU Bank", mcap: 34024, note: "Below book value, reform play" },
    { rank: 4, symbol: "POWERGRID", name: "Powergrid Infrastructure", price: 93, pe: 6.2, pb: 1.4, roe: 16, div: 9.7, graham: 168, sector: "Power", mcap: 8434, note: "Highest 9.7% dividend yield" },
    { rank: 5, symbol: "ONGC", name: "Oil & Natural Gas Corp", price: 280, pe: 9.3, pb: 1.1, roe: 12, div: 4.4, graham: 445, sector: "Oil & Gas", mcap: 351870, note: "PSU energy major" },
    { rank: 6, symbol: "CANARA BK", name: "Canara Bank", price: 154, pe: 6.9, pb: 0.7, roe: 7, div: 2.6, graham: 243, sector: "PSU Bank", mcap: 139218, note: "Below book, improving metrics" },
    { rank: 7, symbol: "RUCHIRA", name: "Ruchira Papers Ltd", price: 109, pe: 6.1, pb: 0.7, roe: 19, div: 4.6, graham: 258, sector: "Paper", mcap: 324, note: "Small cap deep value" },
    { rank: 8, symbol: "VHL", name: "Vardhman Holdings", price: 3249, pe: 4.46, pb: 0.28, roe: 7.5, div: 0.16, graham: 13840, sector: "Holdings/Finance", mcap: 1036, note: "Investment co trading below assets" }
];

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
                children: [new TextRun({ text: "DEEP DISCOUNT STOCKS REPORT", bold: true, color: "1F4E79", font: "Arial" })],
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
            new Paragraph({ children: [new TextRun({ text: "Deep Discount Value Investing Report", bold: true, size: 48, font: "Arial", color: "1F4E79" })] }),
            new Paragraph({ children: [new TextRun({ text: "Generated: March 25, 2026", font: "Arial", size: 22, color: "666666" })] }),
            new Paragraph({ children: [] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("EXECUTIVE SUMMARY")]}),
            new Paragraph({ children: [new TextRun({ text: "This report identifies stocks trading at significant discounts to their Graham Number (intrinsic value). These deep value stocks offer high Margin of Safety for patient investors.", font: "Arial", size: 22 })] }),
            new Paragraph({ children: [] }),
            new Paragraph({ children: [new TextRun({ text: "Key Metrics Used:", bold: true, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Graham Number = \u221A(22.5 x EPS x Book Value)", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Margin of Safety = (Graham Number - Current Price) / Graham Number x 100", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Entry Price = Current Price (for immediate action) or 5% below for limit orders", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Stop Loss = 12% below entry (Graham Number x 0.88)", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Target = 90% of Graham Number", font: "Arial" })] }),
            new Paragraph({ children: [] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("RECOMMENDED STOCKS")]}),
            
            ...stocks.flatMap((stock, idx) => {
                const mos = ((stock.graham - stock.price) / stock.graham * 100).toFixed(1);
                const entryPrice = stock.price;
                const stopLoss = (stock.price * 0.88).toFixed(0);
                const target = (stock.graham * 0.90).toFixed(0);
                const upside = ((stock.graham * 0.90 - stock.price) / stock.price * 100).toFixed(0);
                
                return [
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`${stock.rank}. ${stock.symbol} - ${stock.name}`)] }),
                    new Table({
                        width: { size: 9360, type: WidthType.DXA },
                        columnWidths: [2340, 2340, 2340, 2340],
                        rows: [
                            new TableRow({ children: [
                                createCell("Current Price", 2340, { bold: true }),
                                createCell("\u20B9" + stock.price, 2340),
                                createCell("P/E Ratio", 2340, { bold: true }),
                                createCell(stock.pe.toString(), 2340)
                            ]}),
                            new TableRow({ children: [
                                createCell("Graham Number", 2340, { bold: true }),
                                createCell("\u20B9" + stock.graham, 2340, { color: "00B050" }),
                                createCell("P/B Ratio", 2340, { bold: true }),
                                createCell(stock.pb.toString(), 2340)
                            ]}),
                            new TableRow({ children: [
                                createCell("Margin of Safety", 2340, { bold: true }),
                                createCell(mos + "%", 2340, { color: "00B050", bold: true }),
                                createCell("ROE", 2340, { bold: true }),
                                createCell(stock.roe + "%", 2340)
                            ]}),
                            new TableRow({ children: [
                                createCell("Dividend Yield", 2340, { bold: true }),
                                createCell(stock.div + "%", 2340),
                                createCell("Market Cap", 2340, { bold: true }),
                                createCell(stock.mcap.toLocaleString('en-IN') + " Cr", 2340)
                            ]}),
                            new TableRow({ children: [
                                createCell("Sector", 2340, { bold: true }),
                                createCell(stock.sector, 2340),
                                createCell("Note", 2340, { bold: true }),
                                createCell(stock.note, 2340)
                            ]})
                        ]
                    }),
                    new Paragraph({ children: [] }),
                    new Table({
                        width: { size: 9360, type: WidthType.DXA },
                        columnWidths: [2340, 2340, 2340, 2340],
                        rows: [
                            new TableRow({ children: [
                                createHeaderCell("Entry Price", 2340),
                                createHeaderCell("Stop Loss", 2340),
                                createHeaderCell("Target (90% Graham)", 2340),
                                createHeaderCell("Upside", 2340)
                            ]}),
                            new TableRow({ children: [
                                createCell("\u20B9" + entryPrice, 2340, { fill: "C6EFCE", bold: true }),
                                createCell("\u20B9" + stopLoss, 2340, { fill: "FFC7CE", color: "C00000" }),
                                createCell("\u20B9" + target, 2340, { color: "00B050" }),
                                createCell(upside + "%", 2340, { color: "00B050", bold: true })
                            ]})
                        ]
                    }),
                    new Paragraph({ children: [] })
                ];
            }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("INVESTMENT CHECKLIST")]}),
            new Paragraph({ children: [new TextRun({ text: "Before buying any stock from this list, verify:", bold: true, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Debt/Equity ratio < 1.5 (acceptable) or < 1.0 (good)", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "EPS not declining for 2+ consecutive quarters", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Promoter pledge < 20% (red flag if above)", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Sector not in prolonged downtrend", font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Position size \u2264 10% of total portfolio", font: "Arial" })] }),
            new Paragraph({ children: [] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("RULES FROM LEARNINGS.MD")]}),
            new Paragraph({ children: [new TextRun({ text: "1. Never buy without Margin of Safety > 25% (prefer > 40%)", font: "Arial" })] }),
            new Paragraph({ children: [new TextRun({ text: "2. Place GTT stop-loss same session as BUY fill", font: "Arial" })] }),
            new Paragraph({ children: [new TextRun({ text: "3. Never average down if EPS declining 2Q+ or D/E > 2", font: "Arial" })] }),
            new Paragraph({ children: [new TextRun({ text: "4. Check sector sentiment before any new buy", font: "Arial" })] }),
            new Paragraph({ children: [new TextRun({ text: "5. Review all GTTs every 30 days, trail with price", font: "Arial" })] }),
            new Paragraph({ children: [new TextRun({ text: "6. Fetch live fundamentals from screener.in before IV calculation", font: "Arial" })] }),
            new Paragraph({ children: [] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("DISCLAIMER")]}),
            new Paragraph({ children: [new TextRun({ text: "This report is for educational and informational purposes only. It does not constitute investment advice. Stock market investments carry significant risk. Please consult a qualified financial advisor before making any investment decisions. Past performance does not guarantee future results.", font: "Arial", size: 20, color: "666666", italics: true })] }),
            new Paragraph({ children: [] }),
            new Paragraph({ children: [new TextRun({ text: "Data Source: screener.in | Analysis Date: March 25, 2026", font: "Arial", size: 18, color: "666666" })] }),
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync("C:/Users/pc/Desktop/kitemcp/reports/2026-03-25_deep_discount_stocks.docx", buffer);
    console.log("Deep discount stocks report saved!");
});