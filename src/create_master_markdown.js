const fs = require('fs');
const path = require('path');
const { readJsonFile, isFileAccessible, ensureDir } = require('./lib/jsonUtils');
const logger = require('./lib/logger');

const today = new Date().toISOString().split('T')[0];
const reportDate = today;

const DAILY_DIR = path.join(__dirname, '../reports', reportDate);
const RAW_DIR = path.join(DAILY_DIR, 'raw_data');

ensureDir(DAILY_DIR);
ensureDir(RAW_DIR);

// First, find any stray JSON files in reports/ and move them to RAW_DIR
const REPORTS_DIR = path.join(__dirname, '../reports');
fs.readdirSync(REPORTS_DIR).forEach(file => {
    if (file.endsWith('.json') && file.startsWith(reportDate)) {
        const oldPath = path.join(REPORTS_DIR, file);
        const newPath = path.join(RAW_DIR, file);
        try {
            fs.renameSync(oldPath, newPath);
            logger.info(`Moved ${file} to raw_data/`);
        } catch (e) {
            logger.error(`Failed to move ${file}: ${e.message}`);
        }
    }
});

function readRawJSON(filename) {
    try {
        const filePath = path.join(RAW_DIR, filename);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        return null;
    } catch (err) {
        logger.warn(`Could not read ${filename}: ${err.message}`);
        return null;
    }
}

const portfolioData  = readRawJSON(`${reportDate}_portfolio_snapshot.json`);
const valueData      = readRawJSON(`${reportDate}_value_screen.json`);
const gttData        = readRawJSON(`${reportDate}_gtt_audit.json`);
const commodityData  = readRawJSON(`${reportDate}_commodity_opportunities.json`);
const oppData        = readRawJSON(`${reportDate}_opportunities.json`);
const newsOppData    = readRawJSON(`${reportDate}_news_opportunities.json`) || {};

let md = `# KiteMCP Daily Report — ${reportDate}\n\n`;

// 1. Immediate Actions
md += `## ⚠️ Immediate Actions Required\n\n`;
let actionsFound = false;

if (gttData?.unprotected_holdings?.length > 0) {
    actionsFound = true;
    md += `### Unprotected Holdings (No GTT)\n`;
    gttData.unprotected_holdings.forEach(h => {
        md += `- **${h.symbol}**: Needs stop-loss GTT. CMP: ₹${h.current_price}\n`;
    });
    md += `\n`;
}

if (valueData?.stocks) {
    const deepDiscounts = valueData.stocks.filter(s => (s.margin_of_safety_pct || s.margin_of_safety || 0) > 40);
    if (deepDiscounts.length > 0) {
        actionsFound = true;
        md += `### 🔴 Deep Discount Alerts (MoS > 40%)\n`;
        deepDiscounts.forEach(s => {
            const mos = s.margin_of_safety_pct || s.margin_of_safety || 0;
            md += `- **${s.symbol}**: CMP ₹${s.current_price} vs IV ₹${s.intrinsic_value_avg || s.intrinsic_value}. Discount: ${mos.toFixed(1)}%. Action: ${s.action_signal || 'ACCUMULATE'}\n`;
        });
        md += `\n`;
    }
    
    const overvalued = valueData.stocks.filter(s => {
        const iv = s.intrinsic_value_avg || s.intrinsic_value || 0;
        return iv > 0 && s.current_price > iv;
    });
    if (overvalued.length > 0) {
        actionsFound = true;
        md += `### ⚠️ Overvalued Holdings (Price > IV)\n`;
        overvalued.forEach(s => {
            md += `- **${s.symbol}**: CMP ₹${s.current_price} vs IV ₹${s.intrinsic_value_avg || s.intrinsic_value}. Action: ${s.action_signal || 'TRIM/WATCH'}\n`;
        });
        md += `\n`;
    }
}

if (!actionsFound) {
    md += `*No immediate critical actions required today.*\n\n`;
}

// 2. Portfolio Snapshot
if (portfolioData) {
    md += `## 📊 Portfolio Snapshot\n\n`;
    md += `- **Total Value**: ₹${(portfolioData.total_value || 0).toLocaleString('en-IN')}\n`;
    md += `- **Day P&L**: ₹${(portfolioData.day_pnl || 0).toLocaleString('en-IN')} (${(portfolioData.day_pnl_pct || 0).toFixed(2)}%)\n`;
    md += `- **Total P&L**: ₹${(portfolioData.total_pnl || 0).toLocaleString('en-IN')} (${(portfolioData.total_pnl_pct || 0).toFixed(2)}%)\n`;
    md += `- **Available Cash/Margin**: ₹${(portfolioData.available_margin || 0).toLocaleString('en-IN')}\n\n`;
    
    if (portfolioData.holdings && portfolioData.holdings.length > 0) {
        md += `### Holdings\n\n`;
        md += `| Symbol | Qty | Avg Price | CMP | P&L % | Status |\n`;
        md += `|--------|-----|-----------|-----|-------|--------|\n`;
        portfolioData.holdings.forEach(h => {
            const pnlPct = h.pnl_percent || h.pnl_pct || 0;
            const status = pnlPct < -15 ? 'CRITICAL' : (pnlPct > 20 ? 'PROFIT' : 'HOLD');
            md += `| **${h.symbol}** | ${h.quantity || h.qty} | ₹${h.average_price || h.avg_price} | ₹${h.current_price || h.last_price} | ${pnlPct > 0 ? '+' : ''}${pnlPct.toFixed(2)}% | ${status} |\n`;
        });
        md += `\n`;
    }
}

// 3. Intrinsic Value Screen
if (valueData && valueData.stocks) {
    md += `## 📈 Intrinsic Value Screen\n\n`;
    md += `| Symbol | CMP | Intrinsic Value | Margin of Safety | Action |\n`;
    md += `|--------|-----|-----------------|------------------|--------|\n`;
    valueData.stocks.forEach(s => {
        const mos = s.margin_of_safety_pct || s.margin_of_safety || 0;
        let signal = mos > 40 ? '🔴 ACCUMULATE' : (mos > 25 ? '🟡 HOLD' : '🟢 WATCH/TRIM');
        md += `| **${s.symbol}** | ₹${s.current_price} | ₹${(s.intrinsic_value_avg || s.intrinsic_value || 0).toFixed(1)} | ${mos.toFixed(1)}% | ${s.action_signal || signal} |\n`;
    });
    md += `\n`;
}

// 4. GTT Audit
if (gttData) {
    md += `## 🛡️ GTT Safety Audit\n\n`;
    md += `- **Total GTTs Active**: ${gttData.total_gtts_active || 0}\n`;
    md += `- **Protected Holdings**: ${gttData.total_protected_holdings || (gttData.protected_holdings?.length || 0)} / ${portfolioData?.holdings?.length || 0}\n\n`;
    
    if (gttData.stale_gtts && gttData.stale_gtts.length > 0) {
        md += `### Stale GTTs (Need Update)\n`;
        gttData.stale_gtts.forEach(g => {
            md += `- **${g.symbol}**: Trigger ₹${g.trigger_price} is too far from CMP ₹${g.current_price}\n`;
        });
        md += `\n`;
    }
}

// 5. Market Opportunities
if (oppData && oppData.opportunities) {
    md += `## 💡 Web Scanned Opportunities\n\n`;
    oppData.opportunities.forEach(o => {
        md += `### ${o.symbol} (${o.horizon})\n`;
        md += `- **CMP**: ₹${o.current_price}\n`;
        md += `- **Target**: ₹${o.target_price} (${o.upside_pct}% upside)\n`;
        md += `- **Catalyst**: ${o.catalyst}\n`;
        md += `- **Recommendation**: **${o.recommendation}**\n\n`;
    });
}

if (newsOppData && newsOppData.news) {
    md += `## 📰 News-Driven Opportunities\n\n`;
    newsOppData.news.forEach(n => {
        md += `### ${n.symbol} - ${n.type}\n`;
        md += `- **Headline**: ${n.headline}\n`;
        md += `- **Impact**: ${n.impact_score}/10 (${n.sentiment})\n`;
        md += `- **Catalyst**: ${n.catalyst}\n`;
        md += `- **Action**: **${n.recommendation}**\n\n`;
    });
}

if (commodityData && commodityData.commodities) {
    md += `## 🛢️ Commodities\n\n`;
    md += `| Commodity | Price | Change % | Trend | Action |\n`;
    md += `|-----------|-------|----------|-------|--------|\n`;
    commodityData.commodities.forEach(c => {
        md += `| **${c.symbol || c.commodity}** | ₹${c.price || c.current_price} | ${(c.change_percent || 0).toFixed(2)}% | ${c.trend} | ${c.recommendation || c.action || 'HOLD'} |\n`;
    });
    md += `\n`;
}

md += `---\n*Report generated by KiteMCP Portfolio Intelligence*\n`;

const outputPath = path.join(DAILY_DIR, `${reportDate}_daily_report.md`);
fs.writeFileSync(outputPath, md);
console.log(`✅ Master Markdown report saved to: ${outputPath}`);

// Copy to Latest
const latestPath = path.join(__dirname, '../reports', 'Latest_Report.md');
fs.copyFileSync(outputPath, latestPath);
console.log(`✅ Shortcut updated: reports/Latest_Report.md`);
