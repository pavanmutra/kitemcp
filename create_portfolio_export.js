const { Workbook } = require('exceljs');
const { readJsonFile, isFileAccessible, ensureDir } = require('./lib/jsonUtils');
const config = require('./lib/config');
const fs   = require('fs');
const path = require('path');

const today      = new Date().toISOString().split('T')[0];
const reportDate = today;

const portfolioData  = readJsonFile(`reports/${reportDate}_portfolio_snapshot.json`);
const valueData      = readJsonFile(`reports/${reportDate}_value_screen.json`);
const commodityData  = readJsonFile(`reports/${reportDate}_commodity_opportunities.json`);
const oppData        = readJsonFile(`reports/${reportDate}_opportunities.json`);
const newsOppData    = readJsonFile(`reports/${reportDate}_news_opportunities.json`) || {};

// Support both 'news' and 'opportunities' keys in news_opportunities.json
const newsData = newsOppData?.news || newsOppData?.opportunities || [];

// Build IV lookup map: symbol → { margin_of_safety, action, graham_number }
const ivMap = {};
(valueData?.stocks || []).forEach(s => { ivMap[s.symbol] = s; });

/**
 * Derive action from IV screen (MoS-based) — preferred over P&L-based.
 * Falls back to P&L heuristic if IV data not available for the symbol.
 */
function getExportAction(symbol, pnl_percent) {
    const r = config.risk;
    const iv = ivMap[symbol];
    if (iv) {
        if (iv.margin_of_safety > r.deepDiscountMos)  return 'STRONG ACCUMULATE';
        if (iv.margin_of_safety > r.moderateDiscountMos)  return 'ACCUMULATE ON DIPS';
        if (iv.margin_of_safety < r.overvaluedMos) return 'TRIM / EXIT';
        return 'HOLD';
    }
    // Fallback: use P&L with tax-loss harvest flag
    if (pnl_percent < r.largeLossThreshold) return 'TAX LOSS HARVEST';
    if (pnl_percent < r.taxLossHarvestThreshold) return 'REVIEW';
    return 'HOLD';
}

/**
 * Classify tax category from holding period.
 * LTCG: >= 365 days, STCG: < 365 days.
 * Uses purchase_date field from JSON if present; otherwise uses holding_period_days.
 */
function getTaxCategory(h) {
    let days = h.holding_period_days || 0;
    if (h.purchase_date) {
        const purchased = new Date(h.purchase_date);
        const now = new Date();
        days = Math.floor((now - purchased) / (1000 * 60 * 60 * 24));
    }
    return days >= 365 ? 'LONG-TERM (LTCG 10%)' : 'SHORT-TERM (STCG 15%)';
}

const rawHoldings = portfolioData?.holdings || config.export.defaultHoldings;

const holdings = rawHoldings.map(h => {
    const qty      = h.quantity     || h.qty;
    const avgPrice = h.average_price || h.avg_price;
    const curPrice = h.current_price  || h.last_price;
    const invested = qty * avgPrice;
    const curValue = qty * curPrice;
    const pnlVal   = h.pnl != null ? h.pnl : (curValue - invested);
    const pnlPct   = h.pnl_percent || h.pnl_pct
        || (invested > 0 ? ((pnlVal / invested) * 100) : 0);
    return {
        symbol:        h.symbol,
        quantity:      qty,
        avg_price:     avgPrice,
        current_price: curPrice,
        invested,
        current_value: curValue,
        pnl:           pnlVal,
        pnl_percent:   pnlPct,
        dividend_yield:h.dividend_yield || 0,
        tax_category:  getTaxCategory(h),
        holding_period_days: h.holding_period_days || 0,
        margin_of_safety: ivMap[h.symbol]?.margin_of_safety ?? null,
        intrinsic_value:  ivMap[h.symbol]?.graham_number ?? null,
    };
});

const rawCommodities = commodityData?.commodities || config.export.commodityDefaults;
const commodities = Array.isArray(rawCommodities)
    ? rawCommodities
    : Object.entries(rawCommodities).map(([symbol, c]) => ({ symbol: symbol.toUpperCase(), ...c }));

const wb = new Workbook();
wb.creator = 'KiteMCP Portfolio Intelligence';
wb.created = new Date();

const holdingsSheet = wb.addWorksheet('Holdings', {
    properties: { tabColor: { argb: '1F4E79' } }
});

holdingsSheet.columns = [
    { header: 'Symbol',            key: 'symbol',           width: 12 },
    { header: 'Qty',               key: 'quantity',         width: 8  },
    { header: 'Avg Price (₹)',     key: 'avg_price',        width: 14 },
    { header: 'Current (₹)',       key: 'current_price',    width: 12 },
    { header: 'Invested (₹)',      key: 'invested',         width: 14 },
    { header: 'Current Value (₹)', key: 'current_value',    width: 16 },
    { header: 'P&L (₹)',           key: 'pnl',              width: 12 },
    { header: 'P&L %',             key: 'pnl_percent',      width: 10 },
    { header: 'IV / Graham (₹)',   key: 'intrinsic_value',  width: 14 },
    { header: 'MoS %',             key: 'margin_of_safety', width: 10 },
    { header: 'Div Yield %',       key: 'dividend_yield',   width: 12 },
    { header: 'Tax Category',      key: 'tax_category',     width: 22 },
    { header: 'Action',            key: 'action',           width: 20 }
];

holdingsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
holdingsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } };
holdingsSheet.getRow(1).alignment = { horizontal: 'center' };

holdings.forEach(h => {
    const action = getExportAction(h.symbol, h.pnl_percent);
    const ivValue = h.intrinsic_value != null && !isNaN(h.intrinsic_value) ? Math.round(h.intrinsic_value) : null;
    const mosValue = h.margin_of_safety != null && !isNaN(h.margin_of_safety) ? parseFloat(h.margin_of_safety.toFixed(1)) : null;
    const pnlPct = (h.pnl_percent != null && !isNaN(h.pnl_percent)) ? parseFloat(h.pnl_percent.toFixed(1)) : null;
    const divYield = (h.dividend_yield != null && !isNaN(h.dividend_yield)) ? parseFloat(h.dividend_yield.toFixed(1)) : null;
    
    const row = holdingsSheet.addRow({
        symbol:           h.symbol,
        quantity:         h.quantity,
        avg_price:        h.avg_price != null ? parseFloat(h.avg_price.toFixed(2)) : null,
        current_price:    h.current_price != null ? parseFloat(h.current_price.toFixed(2)) : null,
        invested:         h.invested != null ? Math.round(h.invested) : null,
        current_value:    h.current_value != null ? Math.round(h.current_value) : null,
        pnl:              h.pnl != null ? Math.round(h.pnl) : null,
        pnl_percent:      pnlPct,
        intrinsic_value:  ivValue !== null ? ivValue : 'N/A',
        margin_of_safety: mosValue !== null ? mosValue : 'N/A',
        dividend_yield:   divYield !== null ? divYield : 'N/A',
        tax_category:     h.tax_category,
        action:           action
    });
    // Colour-code P&L cell
    const pnlCell = row.getCell('pnl');
    pnlCell.font = { color: { argb: h.pnl >= 0 ? 'FF00B050' : 'FFC00000' } };
    // Colour-code Action cell
    const actionCell = row.getCell('action');
    const actionFill = action.includes('ACCUMULATE') ? 'FFC6EFCE'
                     : action.includes('TRIM')       ? 'FFFFC7CE'
                     : action.includes('HARVEST')    ? 'FFFFEB9C'
                     : 'FFFFFFFF';
    actionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: actionFill } };
    actionCell.font = { bold: true };
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
        change_percent: (c.change_percent != null && !isNaN(c.change_percent)) ? parseFloat(c.change_percent.toFixed(2)) : null,
        trend: c.trend,
        recommendation: c.recommendation
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// MARKET INTELLIGENCE SHEET
// ─────────────────────────────────────────────────────────────────────────────
const marketSheet = wb.addWorksheet('Market Intelligence', {
    properties: { tabColor: { argb: 'FFD600' } }
});

// COMMODITIES SUB-SECTION
marketSheet.addRow(['COMMODITY MARKET STATUS']).font = { bold: true, size: 14 };
marketSheet.addRow(['Name', 'Price', 'Trend', 'Action']);
commodities.forEach(c => {
    marketSheet.addRow([c.symbol || c.name, c.price ?? 'N/A', c.trend, c.recommendation || c.action]);
});
marketSheet.addRow([]);

// OPPORTUNITIES SUB-SECTION
marketSheet.addRow(['SCANNED OPPORTUNITIES']).font = { bold: true, size: 14 };
marketSheet.addRow(['Symbol', 'Horizon', 'Target', 'Upside %', 'Catalyst', 'Recommendation']);
(oppData?.opportunities || []).forEach(o => {
    marketSheet.addRow([o.symbol, o.horizon, o.target_3m || '-', o.upside_3m || '-', o.catalyst, o.recommendation]);
});
marketSheet.addRow([]);

// NEWS SUB-SECTION
marketSheet.addRow(['FINANCIAL NEWS SCANNER']).font = { bold: true, size: 14 };
marketSheet.addRow(['Source', 'Headline', 'Impact Score', 'Type', 'Action']);
newsData.forEach(n => {
    marketSheet.addRow([n.source, n.headline, n.impact, n.type, n.action]);
});

marketSheet.addRow([]);
marketSheet.addRow(['END OF REPORT']);

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

const excelOutputPath = `reports/Portfolio_${reportDate}_v2.xlsx`;

// Check if Excel file is open - if so, use timestamp variant
let finalPath = excelOutputPath;
if (!isFileAccessible(excelOutputPath)) {
    const timestamp = Date.now();
    finalPath = `reports/Portfolio_${reportDate}_${timestamp}.xlsx`;
    console.log(`\n⚠️  Original file open - using: ${finalPath}`);
}

async function saveExcel() {
    try {
        await wb.xlsx.writeFile(finalPath);
        return finalPath;
    } catch (err) {
        if (err.code === 'EBUSY') {
            const timestamp = Date.now();
            finalPath = `reports/Portfolio_${reportDate}_${timestamp}.xlsx`;
            console.log(`\n⚠️  File busy - saving as: ${finalPath}`);
            await wb.xlsx.writeFile(finalPath);
            return finalPath;
        }
        throw err;
    }
}

saveExcel()
    .then((savedPath) => {
        console.log(`\nPortfolio Excel saved to: ${path.resolve(savedPath)}`);
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
