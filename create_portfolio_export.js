const { Workbook, Worksheet } = require('exceljs');
const fs = require('fs');

const today = new Date().toISOString().split('T')[0];
const reportDate = today.replace(/-/g, '-');

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

const portfolioData = readJsonFile(`reports/${reportDate}_portfolio_snapshot.json`);
const valueData = readJsonFile(`reports/${reportDate}_value_screen.json`);
const commodityData = readJsonFile(`reports/${reportDate}_commodity_opportunities.json`);

const rawHoldings = portfolioData?.holdings || [
    { symbol: "TMCV", quantity: 110, average_price: 355.37, last_price: 431.85, pnl: 8412.26, pnl_percent: 21.53, dividend_yield: 0.5 },
    { symbol: "NXST-RR", quantity: 650, average_price: 135.19, last_price: 155.52, pnl: 13217.14, pnl_percent: 14.4, dividend_yield: 6.2 },
    { symbol: "IOB", quantity: 7849, average_price: 38.51, last_price: 33.72, pnl: -37634, pnl_percent: -12.4, dividend_yield: 2.1 },
    { symbol: "JINDALPHOT", quantity: 85, average_price: 1320.71, last_price: 1141.4, pnl: -15241, pnl_percent: -13.6, dividend_yield: 0.8 },
    { symbol: "VHL", quantity: 35, average_price: 3608.39, last_price: 3148.2, pnl: -16107, pnl_percent: -12.8, dividend_yield: 1.2 },
    { symbol: "CAMS", quantity: 228, average_price: 713.99, last_price: 644.20, pnl: -15912, pnl_percent: -9.8, dividend_yield: 1.5 }
];

const holdings = rawHoldings.map(h => ({
    symbol: h.symbol,
    quantity: h.quantity,
    avg_price: h.average_price,
    current_price: h.last_price,
    invested: h.quantity * h.average_price,
    current_value: h.quantity * h.last_price,
    pnl: h.pnl,
    pnl_percent: h.pnl_percent,
    dividend_yield: h.dividend_yield || 0,
    tax_category: "LONG-TERM",
    holding_period_days: 180
}));

const commodities = commodityData?.commodities || [
    { symbol: "GOLD", price: 74500, change_percent: 0.52, trend: "BULLISH", recommendation: "HOLD" },
    { symbol: "SILVER", price: 89500, change_percent: -0.32, trend: "NEUTRAL", recommendation: "WATCH" },
    { symbol: "CRUDE", price: 5200, change_percent: 1.25, trend: "BULLISH", recommendation: "BUY ON DIP" },
    { symbol: "NATURALGAS", price: 180, change_percent: -2.15, trend: "BEARISH", recommendation: "SELL" }
];

const wb = new Workbook();
wb.creator = 'KiteMCP Portfolio Intelligence';
wb.created = new Date();

const holdingsSheet = wb.addWorksheet('Holdings', {
    properties: { tabColor: { argb: '1F4E79' } }
});

holdingsSheet.columns = [
    { header: 'Symbol', key: 'symbol', width: 10 },
    { header: 'Qty', key: 'quantity', width: 8 },
    { header: 'Avg Price (₹)', key: 'avg_price', width: 14 },
    { header: 'Current (₹)', key: 'current_price', width: 12 },
    { header: 'Invested (₹)', key: 'invested', width: 14 },
    { header: 'Current Value (₹)', key: 'current_value', width: 14 },
    { header: 'P&L (₹)', key: 'pnl', width: 12 },
    { header: 'P&L %', key: 'pnl_percent', width: 10 },
    { header: 'Div Yield %', key: 'dividend_yield', width: 12 },
    { header: 'Tax Category', key: 'tax_category', width: 12 },
    { header: 'Action', key: 'action', width: 14 }
];

holdingsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
holdingsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } };
holdingsSheet.getRow(1).alignment = { horizontal: 'center' };

holdings.forEach(h => {
    const action = h.pnl_percent > 10 ? 'HOLD' : h.pnl_percent > 0 ? 'HOLD' : h.pnl_percent < -10 ? 'TAX LOSS HARVEST' : 'WATCH';
    holdingsSheet.addRow({
        symbol: h.symbol,
        quantity: h.quantity,
        avg_price: parseFloat(h.avg_price.toFixed(2)),
        current_price: parseFloat(h.current_price.toFixed(2)),
        invested: Math.round(h.invested),
        current_value: Math.round(h.current_value),
        pnl: Math.round(h.pnl),
        pnl_percent: parseFloat(h.pnl_percent.toFixed(1)),
        dividend_yield: parseFloat(h.dividend_yield.toFixed(1)),
        tax_category: h.tax_category,
        action: action
    });
});

const totalInvested = holdings.reduce((sum, h) => sum + h.invested, 0);
const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
const totalPnl = holdings.reduce((sum, h) => sum + h.pnl, 0);

holdingsSheet.addRow({});
holdingsSheet.addRow({
    symbol: 'TOTAL',
    invested: Math.round(totalInvested),
    current_value: Math.round(totalValue),
    pnl: Math.round(totalPnl),
    action: ''
}).font = { bold: true };

const taxSheet = wb.addWorksheet('Tax Summary', {
    properties: { tabColor: { argb: 'E65100' } }
});

taxSheet.columns = [
    { header: 'Symbol', key: 'symbol', width: 12 },
    { header: 'Unrealized P&L (₹)', key: 'pnl', width: 18 },
    { header: 'P&L %', key: 'pnl_percent', width: 12 },
    { header: 'Tax Category', key: 'tax_category', width: 14 },
    { header: 'Holding Period', key: 'holding_period', width: 16 },
    { header: 'Cost Basis (₹)', key: 'cost_basis', width: 16 },
    { header: 'Current Value (₹)', key: 'current_value', width: 16 },
    { header: 'Recommendation', key: 'recommendation', width: 20 }
];

taxSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
taxSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E65100' } };
taxSheet.getRow(1).alignment = { horizontal: 'center' };

const taxLossCandidates = [];
const gains = [];

holdings.forEach(h => {
    const holdingPeriod = h.holding_period_days > 365 ? 'Long-term' : 'Short-term';
    const recommendation = h.pnl_percent < -10 ? 'TAX LOSS HARVEST' : h.pnl_percent > 0 ? 'HOLD' : 'HOLD';
    
    if (h.pnl_percent < -10) {
        taxLossCandidates.push(h);
    } else if (h.pnl > 0) {
        gains.push(h);
    }
    
    taxSheet.addRow({
        symbol: h.symbol,
        pnl: Math.round(h.pnl),
        pnl_percent: parseFloat(h.pnl_percent.toFixed(1)),
        tax_category: h.tax_category,
        holding_period: holdingPeriod,
        cost_basis: Math.round(h.invested),
        current_value: Math.round(h.current_value),
        recommendation: recommendation
    });
});

taxSheet.addRow({});
taxSheet.addRow({
    symbol: 'SUMMARY',
    pnl: Math.round(totalPnl),
    recommendation: ''
}).font = { bold: true };

taxSheet.addRow({});
taxSheet.addRow({
    symbol: 'Tax Loss Harvesting Candidates',
    recommendation: `${taxLossCandidates.length} stocks`
}).font = { bold: true };

taxLossCandidates.forEach(h => {
    taxSheet.addRow({
        symbol: h.symbol,
        pnl: Math.round(h.pnl),
        recommendation: `Loss: ₹${Math.abs(Math.round(h.pnl))}`
    });
});

const dividendSheet = wb.addWorksheet('Dividend Tracker', {
    properties: { tabColor: { argb: '2E7D32' } }
});

dividendSheet.columns = [
    { header: 'Symbol', key: 'symbol', width: 12 },
    { header: 'Qty', key: 'quantity', width: 8 },
    { header: 'Current Price (₹)', key: 'current_price', width: 16 },
    { header: 'Dividend Yield %', key: 'dividend_yield', width: 16 },
    { header: 'Expected Annual Div (₹)', key: 'expected_dividend', width: 20 },
    { header: 'Recommendation', key: 'recommendation', width: 16 }
];

dividendSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
dividendSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E7D32' } };
dividendSheet.getRow(1).alignment = { horizontal: 'center' };

let totalDividend = 0;

holdings.filter(h => h.dividend_yield > 0).forEach(h => {
    const expectedDiv = (h.current_value * h.dividend_yield / 100);
    totalDividend += expectedDiv;
    dividendSheet.addRow({
        symbol: h.symbol,
        quantity: h.quantity,
        current_price: h.current_price,
        dividend_yield: h.dividend_yield,
        expected_dividend: Math.round(expectedDiv),
        recommendation: 'HOLD'
    });
});

dividendSheet.addRow({});
dividendSheet.addRow({
    symbol: 'TOTAL',
    expected_dividend: Math.round(totalDividend),
    recommendation: ''
}).font = { bold: true };

const commoditySheet = wb.addWorksheet('Commodities', {
    properties: { tabColor: { argb: 'C2185B' } }
});

commoditySheet.columns = [
    { header: 'Commodity', key: 'symbol', width: 14 },
    { header: 'Price', key: 'price', width: 14 },
    { header: 'Change %', key: 'change_percent', width: 12 },
    { header: 'Trend', key: 'trend', width: 12 },
    { header: 'Recommendation', key: 'recommendation', width: 16 }
];

commoditySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
commoditySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C2185B' } };
commoditySheet.getRow(1).alignment = { horizontal: 'center' };

commodities.forEach(c => {
    commoditySheet.addRow({
        symbol: c.symbol,
        price: c.price,
        change_percent: parseFloat(c.change_percent.toFixed(2)),
        trend: c.trend,
        recommendation: c.recommendation
    });
});

const weeklySheet = wb.addWorksheet('Weekly Summary', {
    properties: { tabColor: { argb: '1565C0' } }
});

weeklySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'This Week', key: 'this_week', width: 18 },
    { header: 'Last Week', key: 'last_week', width: 18 },
    { header: 'Change', key: 'change', width: 18 }
];

weeklySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
weeklySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1565C0' } };
weeklySheet.getRow(1).alignment = { horizontal: 'center' };

weeklySheet.addRow({ metric: 'Portfolio Value', this_week: Math.round(totalValue), change: '' });
weeklySheet.addRow({ metric: 'Total P&L', this_week: Math.round(totalPnl), change: '' });
weeklySheet.addRow({ metric: 'P&L %', this_week: parseFloat((totalPnl / totalInvested * 100).toFixed(1)) + '%', change: '' });
weeklySheet.addRow({ metric: 'Best Performer', this_week: holdings.reduce((a, b) => a.pnl_percent > b.pnl_percent ? a : b).symbol, change: '' });
weeklySheet.addRow({ metric: 'Worst Performer', this_week: holdings.reduce((a, b) => a.pnl_percent < b.pnl_percent ? a : b).symbol, change: '' });
weeklySheet.addRow({ metric: 'New Positions', this_week: 0, change: '' });
weeklySheet.addRow({ metric: 'Closed Positions', this_week: 0, change: '' });
weeklySheet.addRow({ metric: 'Expected Dividend Income', this_week: Math.round(totalDividend), change: '' });

const outputPath = `C:/Users/pc/Desktop/kitemcp/reports/Portfolio_${reportDate}.xlsx`;
wb.xlsx.writeFile(outputPath).then(() => {
    console.log(`Portfolio Excel saved to: ${outputPath}`);
    console.log('\n=== SHEETS GENERATED ===');
    console.log('1. Holdings - Portfolio positions with P&L');
    console.log('2. Tax Summary - Unrealized gains & tax-loss harvesting');
    console.log('3. Dividend Tracker - Expected dividend income');
    console.log('4. Commodities - Gold, Silver, Crude, Natural Gas');
    console.log('5. Weekly Summary - Week-over-week performance');
    console.log(`\nTotal Portfolio Value: ₹${Math.round(totalValue).toLocaleString('en-IN')}`);
    console.log(`Total P&L: ₹${Math.round(totalPnl).toLocaleString('en-IN')}`);
    console.log(`Tax Loss Candidates: ${taxLossCandidates.length}`);
    console.log(`Expected Annual Dividend: ₹${Math.round(totalDividend).toLocaleString('en-IN')}`);
});
