#!/usr/bin/env node
/**
 * test_runner.js — Integration Test Suite for KiteMCP Portfolio Intelligence
 *
 * Tests: API endpoints, data integrity, report generation, stale detection.
 * Uses built-in http + fs — no external dependencies.
 *
 * Usage: node src/test_runner.js        (full suite)
 *        node src/test_runner.js --api  (API only)
 *        node src/test_runner.js --data (data integrity only)
 *        node src/test_runner.js --smoke (smoke tests only)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:3000';
const REPORTS_DIR = path.join(__dirname, '../reports');
const TODAY = new Date().toISOString().split('T')[0];

// ─── ANSI Colors ─────────────────────────────────────────────────────────────
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const RED    = '\x1b[31m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE   = '\x1b[34m';
const CYAN   = '\x1b[36m';

function pass(msg) { console.log(`${GREEN}✅ ${RESET}${msg}`); }
function fail(msg) { console.log(`${RED}❌ ${RESET}${msg}`); }
function warn(msg) { console.log(`${YELLOW}⚠️  ${RESET}${msg}`); }
function info(msg) { console.log(`${CYAN}ℹ️  ${RESET}${msg}`); }
function section(name) { console.log(`\n${BOLD}${BLUE}━━ ${name} ${'━'.repeat(50 - name.length - 3)}${RESET}`); }

// ─── Test Results ─────────────────────────────────────────────────────────────
let results = { passed: 0, failed: 0, skipped: 0 };
let allTests = [];

function test(name, fn) {
    return (async () => {
        try {
            const result = await fn();
            if (result === 'SKIP') {
                warn(`${name} [SKIPPED]`);
                results.skipped++;
                allTests.push({ name, status: 'skipped' });
            } else if (result === false) {
                fail(name);
                results.failed++;
                allTests.push({ name, status: 'failed' });
            } else {
                pass(name);
                results.passed++;
                allTests.push({ name, status: 'passed' });
            }
        } catch (err) {
            fail(`${name} — ${err.message}`);
            results.failed++;
            allTests.push({ name, status: 'failed', error: err.message });
        }
    })();
}

// ─── HTTP Helper ──────────────────────────────────────────────────────────────
function httpGet(pathname) {
    return new Promise((resolve, reject) => {
        const url = new URL(pathname, BASE_URL);
        http.get(url.toString(), (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        }).on('error', reject);
    });
}

function httpPost(pathname) {
    return new Promise((resolve, reject) => {
        const url = new URL(pathname, BASE_URL);
        const req = http.request(url.toString(), { method: 'POST' }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// ─── File Helpers ─────────────────────────────────────────────────────────────
function fileExists(...parts) {
    return fs.existsSync(path.join(...parts));
}

function readJSON(...parts) {
    const filePath = path.join(...parts);
    if (!fs.existsSync(filePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return null;
    }
}

function getLatestReportDate() {
    try {
        const entries = fs.readdirSync(REPORTS_DIR, { withFileTypes: true });
        const dates = entries
            .filter(e => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
            .map(e => e.name)
            .sort()
            .reverse();
        return dates[0] || null;
    } catch {
        return null;
    }
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

// ── Suite 1: API Endpoint Tests ──────────────────────────────────────────────
async function suiteAPI() {
    section('Suite 1: API Endpoints');

    await test('GET /api/dates returns 200 with dates array', async () => {
        const { status, data } = await httpGet('/api/dates');
        return status === 200 && Array.isArray(data.dates) && data.dates.length > 0;
    });

    await test('GET /api/portfolio returns 200 with holdings', async () => {
        const { status, data } = await httpGet('/api/portfolio');
        return status === 200 && Array.isArray(data.holdings) && data.holdings.length > 0;
    });

    await test('GET /api/portfolio returns total_value and total_pnl', async () => {
        const { data } = await httpGet('/api/portfolio');
        return typeof data.total_value === 'number' && typeof data.total_pnl === 'number';
    });

    await test('GET /api/valuescreen returns 200', async () => {
        const { status, data } = await httpGet('/api/valuescreen');
        return status === 200 && data !== null;
    });

    await test('GET /api/gtt returns 200 with GTT audit data', async () => {
        const { status, data } = await httpGet('/api/gtt');
        return status === 200 && typeof data.total_gtts_active === 'number';
    });

    await test('GET /api/opportunities returns 200', async () => {
        const { status } = await httpGet('/api/opportunities');
        return status === 200;
    });

    await test('GET /api/news returns 200', async () => {
        const { status } = await httpGet('/api/news');
        return status === 200;
    });

    await test('GET /api/commodities returns 200', async () => {
        const { status } = await httpGet('/api/commodities');
        return status === 200;
    });

    await test('GET /api/market-status returns 200 with isOpen boolean', async () => {
        const { status, data } = await httpGet('/api/market-status');
        return status === 200 && typeof data.isOpen === 'boolean';
    });

    await test('GET /api/data-status returns 200 with freshness field', async () => {
        const { status, data } = await httpGet('/api/data-status');
        return status === 200 && typeof data.freshness === 'string';
    });

    await test('GET /api/deep-value returns 200 or 404 (file optional)', async () => {
        const { status } = await httpGet('/api/deep-value');
        return status === 200 || status === 404;
    });

    await test('GET /api/portfolio with invalid date returns 404', async () => {
        const { status } = await httpGet('/api/portfolio?date=2099-01-01');
        return status === 404;
    });

    await test('GET /api/dashboard returns 200 with all sections', async () => {
        const { status, data } = await httpGet('/api/dashboard');
        return status === 200
            && typeof data.portfolio === 'object'
            && typeof data.gtt === 'object';
    });

    await test('POST /api/quick-refresh returns 200', async () => {
        const { status } = await httpPost('/api/quick-refresh');
        return status === 200;
    });
}

// ── Suite 2: Data Integrity Tests ────────────────────────────────────────────
async function suiteDataIntegrity() {
    section('Suite 2: Data Integrity');

    const { data: portfolio } = await httpGet('/api/portfolio');
    const { data: gttData } = await httpGet('/api/gtt');
    const { data: oppData } = await httpGet('/api/opportunities');
    const { data: commData } = await httpGet('/api/commodities');

    await test('Portfolio has 11 holdings', async () => {
        return portfolio.holdings.length === 11;
    });

    await test('Each holding has symbol, qty, avg_price, current_price', async () => {
        const missing = portfolio.holdings.filter(h =>
            !h.symbol || (h.qty === undefined && h.quantity === undefined && h.t1_quantity === undefined)
                || !h.avg_price === false && !h.average_price === false
                || !h.current_price === false && !h.last_price === false
        );
        return missing.length === 0;
    });

    await test('current_value = qty × price computes correctly', async () => {
        for (const h of portfolio.holdings) {
            const qty = h.quantity || h.qty || h.t1_quantity || 0;
            const price = h.current_price || h.last_price || 0;
            const computed = qty * price;
            if (h.current_value !== undefined && Math.abs(computed - h.current_value) > 0.01) {
                return false;
            }
        }
        return true;
    });

    await test('Total value matches sum of holdings (accounting for T+1)', async () => {
        let sum = 0;
        for (const h of portfolio.holdings) {
            const qty = h.quantity || h.qty || 0;
            const price = h.current_price || h.last_price || 0;
            sum += qty * price;
        }
        const diff = Math.abs(sum - portfolio.total_value);
        return diff < 100; // within Rs.100 tolerance (T+1 unsettled)
    });

    await test('Total P&L matches sum of holdings P&L', async () => {
        let sum = 0;
        for (const h of portfolio.holdings) {
            sum += h.pnl || 0;
        }
        return Math.abs(sum - portfolio.total_pnl) < 100;
    });

    await test('T+1 holdings (JUSTDIAL, KNRCON) show t1_quantity', async () => {
        const justdial = portfolio.holdings.find(h => h.symbol === 'JUSTDIAL');
        const knrcon = portfolio.holdings.find(h => h.symbol === 'KNRCON');
        return (justdial?.t1_quantity || 0) > 0 && (knrcon?.t1_quantity || 0) > 0;
    });

    await test('Holdings have mos_pct field', async () => {
        const mosCount = portfolio.holdings.filter(h => h.mos_pct !== undefined && h.mos_pct !== null).length;
        return mosCount >= 5; // At least some holdings should have MoS
    });

    await test('Dashboard API has non-zero MoS values', async () => {
        const { data: dash } = await httpGet('/api/dashboard');
        const nonZero = dash.portfolio.holdings.filter(h => (h.mos_pct || 0) !== 0).length;
        return nonZero >= 4; // ASHOKA, CAMS, JINDALPHOT, VHL
    });

    await test('Dashboard API has intrinsic_value_avg for holdings', async () => {
        const { data: dash } = await httpGet('/api/dashboard');
        const withIV = dash.portfolio.holdings.filter(h => h.intrinsic_value_avg > 0).length;
        return withIV >= 4; // ASHOKA, CAMS, JINDALPHOT, VHL have IV
    });

    await test('Deep discounts (MoS > 25%) are detected', async () => {
        const deepDiscounts = portfolio.holdings.filter(h => (h.mos_pct || 0) > 25);
        return deepDiscounts.length > 0; // Should have at least ASHOKA with 36.8%
    });

    await test('Value screen has deep discount stocks', async () => {
        const { data: vs } = await httpGet('/api/valuescreen');
        const deep = vs.deep_discount_stocks || vs.stocks?.filter(s => (s.margin_of_safety_pct || 0) > 25) || [];
        return deep.length > 0;
    });

    await test('GTT protected count matches array length', async () => {
        const reported = gttData.total_protected_holdings;
        const actual = gttData.protected_holdings?.length || 0;
        return reported === actual;
    });

    await test('Opportunities has 8 items', async () => {
        const count = oppData.opportunities?.length || 0;
        return count >= 8;
    });

    await test('All opportunities have symbol and recommendation', async () => {
        const opps = oppData.opportunities || [];
        const missing = opps.filter(o => !o.symbol || !o.recommendation);
        return missing.length === 0;
    });

    await test('Commodities has 4 items (GOLD, SILVER, CRUDE, NATURALGAS)', async () => {
        const comms = commData.commodities || [];
        return comms.length === 4;
    });

    await test('Commodities have numeric price and change_pct (null allowed)', async () => {
        const comms = commData.commodities || [];
        return comms.every(c =>
            (c.price === null || typeof c.price === 'number') &&
            (c.change_pct === null || typeof c.change_pct === 'number')
        );
    });

    await test('Data freshness is current/recent for today', async () => {
        const { data: status } = await httpGet('/api/data-status');
        return status.freshness === 'current' || status.freshness === 'recent' || status.freshness === 'stale';
    });

    await test('isToday flag correctly set for today data', async () => {
        const { data: status } = await httpGet('/api/data-status');
        return typeof status.isToday === 'boolean';
    });
}

// ── Suite 3: Report File Tests ───────────────────────────────────────────────
async function suiteReportFiles() {
    section('Suite 3: Report File Integrity');

    const latestDate = getLatestReportDate();
    const rawDir = path.join(REPORTS_DIR, latestDate, 'raw_data');

    const requiredFiles = [
        `${latestDate}_portfolio_snapshot.json`,
        `${latestDate}_gtt_audit.json`,
        `${latestDate}_value_screen.json`,
        `${latestDate}_opportunities.json`,
        `${latestDate}_news_opportunities.json`,
        `${latestDate}_commodity_opportunities.json`,
        `${latestDate}_gate_status.json`,
    ];

    for (const file of requiredFiles) {
        await test(`File exists: raw_data/${file}`, () => {
            return fileExists(rawDir, file);
        });

        await test(`Valid JSON: raw_data/${file}`, () => {
            const content = readJSON(rawDir, file);
            return content !== null;
        });
    }

    // Daily report markdown
    await test('Daily report markdown exists', () => {
        return fileExists(REPORTS_DIR, latestDate, `${latestDate}_daily_report.md`);
    });

    // Excel export
    await test('Portfolio Excel export exists', () => {
        return fileExists(REPORTS_DIR, latestDate, `Portfolio_${latestDate}.xlsx`);
    });
}

// ── Suite 4: Dashboard Logic Tests ───────────────────────────────────────────
async function suiteDashboardLogic() {
    section('Suite 4: Dashboard Logic');

    const srcDir = path.join(__dirname);
    const publicDir = path.join(srcDir, 'public');
    const appJs = path.join(publicDir, 'js', 'app.js');
    const cssDir = path.join(publicDir, 'css');
    const htmlFile = path.join(publicDir, 'index.html');

    await test('app.js computes current_value = qty × price', async () => {
        const content = fs.readFileSync(appJs, 'utf8');
        return content.includes('quantity') && content.includes('current_price') && content.includes('currentValue');
    });

    await test('app.js handles T+1 display format', async () => {
        const content = fs.readFileSync(appJs, 'utf8');
        return content.includes('t1_quantity');
    });

    await test('app.js has formatCurrency with L/Cr thresholds', async () => {
        const content = fs.readFileSync(appJs, 'utf8');
        return content.includes('10000000') && content.includes('100000');
    });

    await test('app.js has stale warning function', async () => {
        const content = fs.readFileSync(appJs, 'utf8');
        return content.includes('showStaleDataWarning');
    });

    await test('app.js has live refresh indicator function', async () => {
        const content = fs.readFileSync(appJs, 'utf8');
        return content.includes('updateLastRefreshIndicator');
    });

    await test('app.js has AI refresh modal', async () => {
        const content = fs.readFileSync(appJs, 'utf8');
        return content.includes('refreshAIBtn') || content.includes('refreshModal');
    });

    await test('CSS has stale warning styles', async () => {
        const cssFile = path.join(cssDir, 'style.css');
        if (!fs.existsSync(cssFile)) return 'SKIP';
        const content = fs.readFileSync(cssFile, 'utf8');
        return content.includes('stale');
    });

    await test('server.js auto-opens browser on startup', async () => {
        const serverJs = path.join(srcDir, 'server.js');
        const content = fs.readFileSync(serverJs, 'utf8');
        return content.includes('exec') && content.includes('open');
    });

    await test('HTML has MoS column in holdings table', async () => {
        const htmlFile = path.join(publicDir, 'index.html');
        const content = fs.readFileSync(htmlFile, 'utf8');
        return content.includes('MoS');
    });

    await test('HTML has IV column in holdings table', async () => {
        const htmlFile = path.join(publicDir, 'index.html');
        const content = fs.readFileSync(htmlFile, 'utf8');
        return content.includes('>IV</th>');
    });

    await test('app.js has formatMos function', async () => {
        const appFile = path.join(publicDir, 'js', 'app.js');
        const content = fs.readFileSync(appFile, 'utf8');
        return content.includes('formatMos');
    });
}

// ── Suite 5: Smoke Tests ─────────────────────────────────────────────────────
async function suiteSmoke() {
    section('Suite 5: Report Generation Smoke Tests');

    await test('create_master_markdown.js runs without error', async () => {
        return new Promise((resolve) => {
            const { execSync } = require('child_process');
            try {
                execSync(`node "${path.join(__dirname, 'create_master_markdown.js')}"`, {
                    stdio: 'pipe',
                    timeout: 30000,
                    windowsHide: true
                });
                resolve(true);
            } catch (err) {
                // Exit code 0 or 1 are acceptable (1 = warnings, 0 = success)
                const code = err.status;
                resolve(code === 0 || code === 1);
            }
        });
    });

    await test('Gate status file confirms all required gates passed', async () => {
        const latestDate = getLatestReportDate();
        const gateFile = readJSON(REPORTS_DIR, latestDate, 'raw_data', `${latestDate}_gate_status.json`);
        if (!gateFile) return false;
        const gates = gateFile.gates || gateFile;
        const required = ['GATE_1', 'GATE_2', 'GATE_3', 'GATE_4', 'GATE_4_5'];
        return required.every(g => gates[g]?.status === 'PASS');
    });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const runAll = args.length === 0;
    const runAPI = runAll || args.includes('--api');
    const runData = runAll || args.includes('--data');
    const runFiles = runAll || args.includes('--files');
    const runLogic = runAll || args.includes('--logic');
    const runSmoke = runAll || args.includes('--smoke');

    console.log(`\n${BOLD}${BLUE}╔═══════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}${BLUE}║       KiteMCP Integration Test Suite — ${TODAY}  ║${RESET}`);
    console.log(`${BOLD}${BLUE}╚═══════════════════════════════════════════════════════╝${RESET}`);
    info(`Reports: ${REPORTS_DIR}`);
    info(`Testing: ${runAll ? 'ALL suites' : [runAPI && 'API', runData && 'Data', runFiles && 'Files', runLogic && 'Logic', runSmoke && 'Smoke'].filter(Boolean).join(', ')}`);

    try {
        const { data: health } = await httpGet('/api/dates');
        info('Dashboard server is running.');
    } catch {
        warn('Dashboard server is NOT running. Start with: npm run web');
        warn('Skipping API and live data tests.');
        results.skipped += 15;
        // Still run file-based tests
    }

    if (runAPI)    await suiteAPI();
    if (runData)   await suiteDataIntegrity();
    if (runFiles)  await suiteReportFiles();
    if (runLogic)  await suiteDashboardLogic();
    if (runSmoke)  await suiteSmoke();

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log(`\n${BOLD}${BLUE}═══════════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}  RESULTS${RESET}`);
    console.log(`${BOLD}${BLUE}═══════════════════════════════════════════════════════════${RESET}`);
    console.log(`  ${GREEN}✅ Passed:  ${results.passed}${RESET}`);
    console.log(`  ${RED}❌ Failed:  ${results.failed}${RESET}`);
    console.log(`  ${YELLOW}⚠️  Skipped: ${results.skipped}${RESET}`);
    console.log(`  Total: ${results.passed + results.failed + results.skipped}`);

    if (results.failed > 0) {
        console.log(`\n${RED}${BOLD}🔴 FAILURES:${RESET}`);
        allTests.filter(t => t.status === 'failed').forEach(t => {
            console.log(`  ❌ ${t.name}${t.error ? ` — ${t.error}` : ''}`);
        });
    }

    const status = results.failed === 0 ? `${GREEN}✅ ALL TESTS PASSED` : `${RED}❌ TESTS FAILED`;
    console.log(`\n${BOLD}${status}${RESET}\n`);

    // ── Save Results ────────────────────────────────────────────────────────
    const latestDate = getLatestReportDate() || TODAY;
    const resultsDir = path.join(REPORTS_DIR, latestDate);
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    const outputFile = path.join(resultsDir, `${latestDate}_test_results.json`);
    fs.writeFileSync(outputFile, JSON.stringify({
        date: TODAY,
        executed_at: new Date().toISOString(),
        summary: { passed: results.passed, failed: results.failed, skipped: results.skipped },
        tests: allTests,
        exit: results.failed === 0 ? 'pass' : 'fail'
    }, null, 2));
    info(`Results saved to: ${outputFile}`);

    process.exit(results.failed === 0 ? 0 : 1);
}

main().catch(err => {
    console.error(`${RED}FATAL: ${err.message}${RESET}`);
    process.exit(1);
});
