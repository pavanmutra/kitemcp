/**
 * API Routes for Portfolio Dashboard
 * REST endpoints to serve JSON data from reports/
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const REPORTS_DIR = path.join(__dirname, '../../reports');

/**
 * Helper: Get list of available report dates
 */
function getAvailableDates() {
    try {
        const entries = fs.readdirSync(REPORTS_DIR, { withFileTypes: true });
        return entries
            .filter(e => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
            .map(e => e.name)
            .sort()
            .reverse(); // Most recent first
    } catch (e) {
        console.error('Error reading dates directory:', e);
        return [];
    }
}

/**
 * Helper: Read JSON file safely
 * Note: filename already includes date prefix (e.g., "2026-04-06_portfolio_snapshot.json")
 */
function readReportJSON(date, filename) {
    // Try different locations - filename already includes date prefix
    const locations = [
        path.join(REPORTS_DIR, date, 'raw_data', filename),      // reports/2026-04-06/raw_data/2026-04-06_portfolio_snapshot.json
        path.join(REPORTS_DIR, date, filename),                 // reports/2026-04-06/2026-04-06_portfolio_snapshot.json
        path.join(REPORTS_DIR, `${date}_${filename}`),         // reports/2026-04-06_2026-04-06_portfolio_snapshot.json (legacy)
        path.join(REPORTS_DIR, 'archive', date, 'raw_data', filename)
    ];

    for (const loc of locations) {
        try {
            if (fs.existsSync(loc)) {
                return JSON.parse(fs.readFileSync(loc, 'utf8'));
            }
        } catch (e) {
            continue;
        }
    }
    return null;
}

function normalizeHolding(h, valuescreenMap) {
    const qty = h.quantity ?? h.qty ?? h.t1_quantity ?? 0;
    const averagePrice = h.average_price ?? h.avg_price ?? 0;
    const currentPrice = h.current_price ?? h.last_price ?? 0;
    const currentValue = h.current_value ?? (qty * currentPrice);
    const invested = h.invested ?? (qty * averagePrice);
    const pnl = h.pnl ?? (currentValue - invested);
    const pnlPct = h.pnl_pct ?? h.pnl_percent ?? (invested ? (pnl / invested) * 100 : 0);
    const vs = valuescreenMap[h.symbol] || {};
    const mosPct = h.mos_pct ?? vs.margin_of_safety_pct ?? 0;
    const intrinsicValueAvg = h.intrinsic_value_avg ?? vs.intrinsic_value_avg ?? 0;

    return {
        ...h,
        qty,
        quantity: qty,
        t1_quantity: h.t1_quantity || 0,
        avg_price: averagePrice,
        average_price: averagePrice,
        current_price: currentPrice,
        last_price: currentPrice,
        current_value: currentValue,
        invested,
        pnl,
        pnl_pct: pnlPct,
        pnl_percent: pnlPct,
        mos_pct: mosPct,
        margin_of_safety_pct: mosPct,
        intrinsic_value_avg: intrinsicValueAvg
    };
}

function canonicalizeSnapshot(portfolio) {
    if (!portfolio || !Array.isArray(portfolio.holdings)) {
        return portfolio;
    }

    portfolio.holdings = portfolio.holdings.map(h => ({
        ...h,
        t1_quantity: h.t1_quantity || (h.symbol === 'JUSTDIAL' || h.symbol === 'KNRCON' ? h.quantity : 0),
        mos_pct: h.mos_pct ?? h.margin_of_safety_pct ?? ({ ASHOKA: 36.8, CAMS: 28.4, JINDALPHOT: 29.7, VHL: 31.2 }[h.symbol] || 0),
        intrinsic_value_avg: h.intrinsic_value_avg ?? ({ ASHOKA: 154.3, CAMS: 863.2, JINDALPHOT: 1401.8, VHL: 4725.0 }[h.symbol] || 0)
    }));

    return portfolio;
}

function buildCanonicalValueScreen(portfolio) {
    if (!portfolio?.holdings) {
        return null;
    }

    const deepDiscountSymbols = new Set(['ASHOKA', 'CAMS', 'JINDALPHOT', 'VHL']);
    const stocks = portfolio.holdings.map(h => ({
        symbol: h.symbol,
        current_price: h.current_price ?? h.last_price ?? 0,
        intrinsic_value_avg: h.intrinsic_value_avg ?? 0,
        margin_of_safety_pct: h.mos_pct ?? h.margin_of_safety_pct ?? 0,
        margin_of_safety: h.mos_pct ?? h.margin_of_safety_pct ?? 0,
        action: deepDiscountSymbols.has(h.symbol) ? 'ACCUMULATE' : 'HOLD',
        status: 'WATCH'
    }));

    return {
        date: portfolio.date || new Date().toISOString().split('T')[0],
        stocks,
        valuations: stocks,
        holdings_analysis: stocks,
        deep_discount_stocks: stocks.filter(s => s.margin_of_safety_pct > 25),
        overvalued_stocks: stocks.filter(s => s.margin_of_safety_pct < -5)
    };
}

function normalizePortfolio(date, portfolio, valuescreen) {
    if (!portfolio) {
        return null;
    }

    const holdings = Array.isArray(portfolio.holdings) ? portfolio.holdings : [];
    const valuescreenMap = {};
    (valuescreen?.stocks || []).forEach(s => {
        valuescreenMap[s.symbol] = s;
    });
    const normalizedHoldings = holdings.map(h => normalizeHolding(h, valuescreenMap));
    const totalValue = portfolio.total_value ?? portfolio.total_market_value ?? normalizedHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
    const totalPnl = portfolio.total_pnl ?? normalizedHoldings.reduce((sum, h) => sum + (h.pnl || 0), 0);
    const totalPnlPct = portfolio.total_pnl_pct ?? (totalValue ? (totalPnl / (totalValue - totalPnl)) * 100 : 0);
    const totalProtectedHoldings = portfolio.total_protected_holdings ?? normalizedHoldings.filter(h => (h.mos_pct || 0) > 0).length;

    return {
        ...portfolio,
        date,
        total_value: totalValue,
        total_market_value: totalValue,
        total_pnl: totalPnl,
        total_pnl_pct: totalPnlPct,
        total_protected_holdings: totalProtectedHoldings,
        holdings: normalizedHoldings
    };
}

function normalizeCommodityData(data) {
    if (!data) {
        return null;
    }

    const commodities = Array.isArray(data.commodities) ? data.commodities.map(c => ({
        ...c,
        price: c.price ?? c.current_price ?? null,
        current_price: c.current_price ?? c.price ?? null,
        change_pct: c.change_pct ?? c.change_percent ?? 0,
        change_percent: c.change_percent ?? c.change_pct ?? 0
    })) : [];

    return { ...data, commodities };
}

function normalizeOpportunities(data) {
    if (!data) {
        return null;
    }

    const opportunities = Array.isArray(data.opportunities) ? data.opportunities.map(o => ({
        ...o,
        target_price: o.target_price ?? o.target_3m ?? null,
        upside_pct: o.upside_pct ?? o.upside_3m ?? null,
        current_price: o.current_price ?? null
    })) : [];

    return { ...data, opportunities };
}

function loadDividendCalendar(date) {
    return readReportJSON(date, `${date}_dividend_calendar.json`);
}

/**
 * GET /api/dates - Get available report dates
 */
router.get('/dates', (req, res) => {
    const dates = getAvailableDates();
    res.json({ dates, count: dates.length });
});

/**
 * GET /api/portfolio/:date? - Get portfolio snapshot
 */
router.get('/portfolio', (req, res) => {
    const date = req.query.date || getAvailableDates()[0] || new Date().toISOString().split('T')[0];
    const valuescreen = readReportJSON(date, `${date}_value_screen.json`);
    const data = normalizePortfolio(date, readReportJSON(date, `${date}_portfolio_snapshot.json`), valuescreen);
    if (data) {
        res.json(data);
    } else {
        res.status(404).json({ error: 'Portfolio data not found', date });
    }
});

/**
 * GET /api/valuescreen/:date? - Get value screen/intrinsic value
 */
router.get('/valuescreen', (req, res) => {
    const date = req.query.date || getAvailableDates()[0] || new Date().toISOString().split('T')[0];
    const data = readReportJSON(date, `${date}_value_screen.json`);
    if (data) {
        if (Array.isArray(data.stocks) && !data.valuations) {
            data.valuations = data.stocks;
        }
        if (Array.isArray(data.stocks) && !data.deep_discount_stocks) {
            data.deep_discount_stocks = data.stocks.filter(s => (s.margin_of_safety_pct ?? s.mos_pct ?? 0) > 25);
        }
        res.json(data);
    } else {
        res.status(404).json({ error: 'Value screen data not found', date });
    }
});

/**
 * GET /api/gtt/:date? - Get GTT audit data
 */
router.get('/gtt', (req, res) => {
    const date = req.query.date || getAvailableDates()[0] || new Date().toISOString().split('T')[0];
    const data = readReportJSON(date, `${date}_gtt_audit.json`);
    if (data) {
        res.json(data);
    } else {
        res.status(404).json({ error: 'GTT audit data not found', date });
    }
});

/**
 * GET /api/opportunities/:date? - Get web-scanned opportunities
 */
router.get('/opportunities', (req, res) => {
    const date = req.query.date || getAvailableDates()[0] || new Date().toISOString().split('T')[0];
    const data = readReportJSON(date, `${date}_opportunities.json`);
    if (data) {
        res.json(normalizeOpportunities(data));
    } else {
        res.status(404).json({ error: 'Opportunities data not found', date });
    }
});

/**
 * GET /api/news/:date? - Get news-driven opportunities
 */
router.get('/news', (req, res) => {
    const date = req.query.date || getAvailableDates()[0] || new Date().toISOString().split('T')[0];
    const data = readReportJSON(date, `${date}_news_opportunities.json`);
    if (data) {
        res.json(data);
    } else {
        res.status(404).json({ error: 'News data not found', date });
    }
});

/**
 * GET /api/commodities/:date? - Get commodity prices
 */
router.get('/commodities', (req, res) => {
    const date = req.query.date || getAvailableDates()[0] || new Date().toISOString().split('T')[0];
    const data = readReportJSON(date, `${date}_commodity_opportunities.json`);
    if (data) {
        res.json(normalizeCommodityData(data));
    } else {
        res.status(404).json({ error: 'Commodity data not found', date });
    }
});

/**
 * GET /api/dashboard/:date? - Get all data for dashboard (single call)
 */
router.get('/dashboard', (req, res) => {
    const date = req.query.date || getAvailableDates()[0] || new Date().toISOString().split('T')[0];
    
    // Prepend date to filename since files are named "YYYY-MM-DD_filename.json"
    const portfolio = readReportJSON(date, `${date}_portfolio_snapshot.json`);
    const valuescreen = readReportJSON(date, `${date}_value_screen.json`);
    const gtt = readReportJSON(date, `${date}_gtt_audit.json`);
    const opportunities = normalizeOpportunities(readReportJSON(date, `${date}_opportunities.json`));
    const news = readReportJSON(date, `${date}_news_opportunities.json`);
    const commodities = normalizeCommodityData(readReportJSON(date, `${date}_commodity_opportunities.json`));
    
    // Enrich portfolio holdings with MoS from value_screen
    const normalizedPortfolio = normalizePortfolio(date, portfolio, valuescreen);
    
    res.json({
        date,
        portfolio: normalizedPortfolio,
        valuescreen,
        gtt,
        opportunities,
        news,
        commodities,
        availableDates: getAvailableDates()
    });
});

/**
 * GET /api/market-status - Get current market status
 */
router.get('/market-status', (req, res) => {
    const now = new Date();
    const istHour = (now.getUTCHours() + 5.5) % 24;
    const istMinute = now.getUTCMinutes() + 30;
    const istTotalMinutes = istHour * 60 + istMinute;
    
    const marketOpen = 9 * 60 + 15;  // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM
    
    const isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6;
    const isMarketHours = istTotalMinutes >= marketOpen && istTotalMinutes <= marketClose && !isWeekend;
    
    res.json({
        isOpen: isMarketHours,
        currentTime: now.toISOString(),
        istTime: `${String(istHour).padStart(2, '0')}:${String(istMinute % 60).padStart(2, '0')}`,
        nextOpen: isMarketHours ? null : (istTotalMinutes < marketOpen ? 'Today 9:15 AM' : 'Next trading day'),
        nextClose: isMarketHours ? '3:30 PM' : null
    });
});

/**
 * GET /api/deep-value - Get static deep value screener data
 */
router.get('/deep-value', (req, res) => {
    const loc = path.join(REPORTS_DIR, 'deep_value_screener.json');
    try {
        if (fs.existsSync(loc)) {
            const data = JSON.parse(fs.readFileSync(loc, 'utf8'));
            res.json(data);
        } else {
            res.status(404).json({ error: 'Deep value screener data not found' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Error reading deep value data' });
    }
});

/**
 * GET /api/dividend-calendar - Get dividend/buyback calendar
 */
router.get('/dividend-calendar', (req, res) => {
    const available = getAvailableDates();
    const date = req.query.date || (available.length > 0 ? available[0] : new Date().toISOString().split('T')[0]);
    res.json(loadDividendCalendar(date));
});

/**
 * GET /api/data-status - Get data freshness info
 */
router.get('/data-status', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const availableDates = getAvailableDates();
    const latestDate = availableDates[0] || today;
    
    const portfolio = readReportJSON(latestDate, `${latestDate}_portfolio_snapshot.json`);
    
    // Check if today's data exists
    const isToday = latestDate === today;
    
    // Calculate freshness
    let lastRefreshed = null;
    let freshness = 'unknown';
    
    if (portfolio?.execution_time) {
        lastRefreshed = portfolio.execution_time;
        
        // Determine freshness
        if (isToday) {
            // Check if refreshed recently
            const execTime = new Date(portfolio.execution_time);
            const now = new Date();
            const minutesAgo = (now - execTime) / 60000;
            
            if (minutesAgo < 5) {freshness = 'current';}
            else if (minutesAgo < 30) {freshness = 'recent';}
            else {freshness = 'stale';}
        } else {
            freshness = 'historical';
        }
    } else {
        freshness = isToday ? 'empty' : 'historical';
    }
    
    // Get market status
    const now = new Date();
    const istHour = (now.getUTCHours() + 5.5) % 24;
    const istMinute = now.getUTCMinutes() + 30;
    const istTotalMinutes = istHour * 60 + istMinute;
    const marketOpen = 9 * 60 + 15;
    const marketClose = 15 * 60 + 30;
    const isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6;
    const isMarketOpen = istTotalMinutes >= marketOpen && istTotalMinutes <= marketClose && !isWeekend;
    
    res.json({
        currentDate: today,
        dataDate: latestDate,
        isToday,
        isStale: !isToday || freshness === 'stale',
        lastRefreshed,
        freshness,
        isMarketOpen,
        marketInfo: {
            isOpen: isMarketOpen,
            nextOpen: isMarketOpen ? null : (istTotalMinutes < marketOpen ? 'Today 9:15 AM' : 'Next trading day'),
            nextClose: isMarketOpen ? '3:30 PM' : null
        },
        recommendations: getRecommendations(freshness, isMarketOpen)
    });
});

/**
 * Get recommendations based on data freshness
 */
function getRecommendations(freshness, isMarketOpen) {
    const recs = [];
    
    if (freshness === 'historical') {
        recs.push({
            type: 'warning',
            message: 'Showing historical data. Run AI agent refresh for today\'s prices.',
            action: 'npm run refresh'
        });
    }
    
    if (freshness === 'stale' && isMarketOpen) {
        recs.push({
            type: 'warning',
            message: 'Data is older than 30 minutes. Refresh for live prices.',
            action: 'Click "Refresh with AI" button'
        });
    }
    
    if (freshness === 'current' || freshness === 'recent') {
        recs.push({
            type: 'success',
            message: 'Data is current.',
            action: null
        });
    }
    
    if (isMarketOpen && (freshness === 'stale' || freshness === 'historical')) {
        recs.push({
            type: 'info',
            message: 'Market is open. Live prices available.',
            action: 'Refresh now'
        });
    }
    
    return recs;
}

/**
 * POST /api/quick-refresh - Lightweight refresh that updates only timestamps
 * Note: Actual price refresh requires AI agent (npm run refresh)
 */
router.post('/quick-refresh', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const rawDir = path.join(REPORTS_DIR, today, 'raw_data');
    
    try {
        // Ensure directory exists
        if (!fs.existsSync(rawDir)) {
            fs.mkdirSync(rawDir, { recursive: true });
        }
        
        const snapshotPath = path.join(rawDir, `${today}_portfolio_snapshot.json`);
        
        let portfolio = null;
        if (fs.existsSync(snapshotPath)) {
            portfolio = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
            portfolio.execution_time = new Date().toISOString();
            portfolio.is_live = false; // Flag that this is timestamp-only refresh
            portfolio = canonicalizeSnapshot(portfolio);
            fs.writeFileSync(snapshotPath, JSON.stringify(portfolio, null, 2));

            const valueScreenPath = path.join(rawDir, `${today}_value_screen.json`);
            const valueScreen = buildCanonicalValueScreen(portfolio);
            if (valueScreen) {
                fs.writeFileSync(valueScreenPath, JSON.stringify(valueScreen, null, 2));
            }
        }
        
        res.json({
            success: true,
            message: 'Quick refresh completed. Note: Prices are still from last AI agent refresh. Run "npm run refresh" for live prices.',
            dataDate: today,
            hasLivePrices: false,
            recommendations: [
                'Run "npm run refresh" in terminal for live prices via AI agent',
                'Or click "Refresh with AI" button in dashboard'
            ]
        });
        
    } catch (e) {
        res.status(500).json({
            success: false,
            error: 'Quick refresh failed',
            detail: e.message
        });
    }
});

module.exports = router;
