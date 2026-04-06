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
        console.error("Error reading dates directory:", e);
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
        path.join(REPORTS_DIR, 'archive', date, 'raw_data', filename),
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
    const data = readReportJSON(date, `${date}_portfolio_snapshot.json`);
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
        res.json(data);
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
        res.json(data);
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
    let portfolio = readReportJSON(date, `${date}_portfolio_snapshot.json`);
    const valuescreen = readReportJSON(date, `${date}_value_screen.json`);
    const gtt = readReportJSON(date, `${date}_gtt_audit.json`);
    const opportunities = readReportJSON(date, `${date}_opportunities.json`);
    const news = readReportJSON(date, `${date}_news_opportunities.json`);
    const commodities = readReportJSON(date, `${date}_commodity_opportunities.json`);
    
    // Enrich portfolio holdings with MoS from value_screen
    if (portfolio?.holdings && valuescreen?.stocks) {
        const valuescreenMap = {};
        valuescreen.stocks.forEach(s => {
            valuescreenMap[s.symbol] = {
                margin_of_safety_pct: s.margin_of_safety_pct,
                intrinsic_value_avg: s.intrinsic_value_avg
            };
        });
        
        portfolio.holdings.forEach(h => {
            const vs = valuescreenMap[h.symbol];
            if (vs) {
                // Set MoS from value_screen if not set or 0
                if (!h.mos_pct || h.mos_pct === 0) {
                    h.mos_pct = vs.margin_of_safety_pct ?? h.mos_pct;
                }
                // Set IV from value_screen
                if (vs.intrinsic_value_avg && vs.intrinsic_value_avg > 0) {
                    h.intrinsic_value_avg = vs.intrinsic_value_avg;
                }
            }
        });
    }
    
    res.json({
        date,
        portfolio,
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
            
            if (minutesAgo < 5) freshness = 'current';
            else if (minutesAgo < 30) freshness = 'recent';
            else freshness = 'stale';
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
            fs.writeFileSync(snapshotPath, JSON.stringify(portfolio, null, 2));
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
