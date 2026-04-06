#!/usr/bin/env node
/**
 * check_gates.js — Pre-Flight Gate Status Checker
 * Run this before placing any order to verify all daily workflow gates passed.
 *
 * Usage: node check_gates.js   OR   npm run check
 */

const fs = require('fs');
const path = require('path');
const config = require('./lib/config');

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const reportsDir = path.join(__dirname, '../reports');
const staleThreshold = config.gates.staleThresholdMinutes;

/**
 * Find a gate file across flat root and organized structure.
 * Returns the first matching path or null.
 */
function findGateFile(filename) {
    const candidates = [
        // Flat root: reports/YYYY-MM-DD_filename
        path.join(reportsDir, filename),
        // Organized by type
        path.join(reportsDir, today, 'raw_data', filename), path.join(reportsDir, today, filename),
        path.join(reportsDir, today, 'reports', filename.replace(`${today}_`, '')),
        path.join(reportsDir, today, 'exports', filename.replace(`Portfolio_${today}`, 'Portfolio')),
        path.join(reportsDir, today, 'exports', filename.replace(`Weekly_Portfolio_${today}`, 'Weekly_Portfolio')),
    ];
    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    return null;
}

const GATES = [
  {
    gate: 'GATE 0',
    label: 'Opportunity Scan',
    filename: `${today}_opportunities.json`,
    required: false,
    tip: 'Ask AI: "Run opportunity-scanner for today"'
  },
  {
    gate: 'GATE 0.3',
    label: 'Commodity Scan',
    filename: `${today}_commodity_opportunities.json`,
    required: false,
    tip: 'Ask AI: "Run commodity-scanner for today"'
  },
  {
    gate: 'GATE 0.5',
    label: 'News Scan',
    filename: `${today}_news_opportunities.json`,
    required: false,
    tip: 'Ask AI: "Run news-scanner for today"'
  },
  {
    gate: 'GATE 1',
    label: 'Portfolio Scan',
    filename: `${today}_portfolio_snapshot.json`,
    required: true,
    tip: 'Ask AI: "Run portfolio-scanner — fetch holdings from Kite"'
  },
  {
    gate: 'GATE 2',
    label: 'Intrinsic Value Screen',
    filename: `${today}_value_screen.json`,
    required: true,
    tip: 'Ask AI: "Run intrinsic-value-scanner on today\'s holdings"'
  },
  {
    gate: 'GATE 3',
    label: 'GTT Audit',
    filename: `${today}_gtt_audit.json`,
    required: true,
    tip: 'Ask AI: "Run gtt-manager audit for today"'
  },
  {
    gate: 'GATE 4',
    label: 'Daily Report (.md)',
    filename: `${today}_daily_report.md`,
    required: true,
    tip: 'Run: npm run report'
  },
  {
    gate: 'GATE 4.5',
    label: 'Excel Export (.xlsx)',
    filename: `Portfolio_${today}.xlsx`,
    required: true,
    tip: 'Run: npm run export'
  },
  {
    gate: 'GATE 5',
    label: 'Individual Reports',
    filename: `${today}_portfolio_report.md`,
    required: false,
    tip: 'Run individual deep-dive reports generation'
  },
  {
    gate: 'GATE 6',
    label: 'Agent Reports Summary',
    filename: `${today}_GATE6_AGENT_REPORTS_SUMMARY.md`,
    required: false,
    tip: 'Compile agent summary'
  },
  {
    gate: 'GATE 7',
    label: 'Weekly Export',
    filename: `Weekly_Portfolio_${today}.xlsx`,
    required: false,
    tip: 'Generate Weekly Portfolio Excel Export'
  },
  {
    gate: 'GATE 8',
    label: 'Verification & Audit',
    filename: `${today}_GATE8_COMPREHENSIVE_VERIFICATION_REPORT.md`,
    required: false,
    tip: 'Run verification script'
  },
  {
    gate: 'GATE 9',
    label: 'Archive Gate',
    filename: `${today}_ARCHIVE_MANIFEST.json`,
    required: false,
    tip: 'Run archive script'
  },
  {
    gate: 'GATE 10',
    label: 'Risk Assessment',
    filename: `${today}_risk_assessment.json`,
    required: false,
    tip: 'Run risk assessment (concentration, sector exposure)'
  },
  {
    gate: 'GATE 11',
    label: 'Rebalancing Recommendation',
    filename: `${today}_rebalancing.json`,
    required: false,
    tip: 'Run rebalancing logic'
  },
  {
    gate: 'GATE 12',
    label: 'Tax Optimization',
    filename: `${today}_tax_optimization.json`,
    required: false,
    tip: 'Run tax optimization script'
  },
  {
    gate: 'GATE 13',
    label: 'Dividend Calendar',
    filename: `${today}_dividend_calendar.json`,
    required: false,
    tip: 'Run dividend calendar script'
  }
];

// ─── helpers ─────────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE   = '\x1b[34m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

function fileAgeMinutes(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return Math.round((Date.now() - stat.mtimeMs) / 60000);
  } catch { return null; }
}

// Only run gate check when executed as CLI (not when imported by tests)
if (require.main === module) {
// ─── main ────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}${BLUE}═══════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}  KiteMCP Pre-Flight Gate Check — ${today}${RESET}`);
console.log(`${BOLD}${BLUE}═══════════════════════════════════════════════════${RESET}\n`);

let hardBlock = false;
let warnings  = 0;

for (const g of GATES) {
  const foundPath = findGateFile(g.filename);
  const exists = foundPath !== null;
  const age    = exists ? fileAgeMinutes(foundPath) : null;
  const stale  = age !== null && age > staleThreshold;

  if (exists && !stale) {
    console.log(`${GREEN}✅ ${g.gate}${RESET}  ${g.label}  ${BLUE}(${age}m ago)${RESET}`);
  } else if (exists && stale) {
    console.log(`${YELLOW}⚠️  ${g.gate}${RESET}  ${g.label}  ${YELLOW}(STALE — ${age}m ago)${RESET}`);
    console.log(`       Tip: ${g.tip}`);
    warnings++;
  } else {
    if (g.required) {
      console.log(`${RED}❌ ${g.gate}${RESET}  ${g.label}  ${RED}(MISSING — HARD BLOCK)${RESET}`);
      console.log(`       Tip: ${g.tip}`);
      hardBlock = true;
    } else {
      console.log(`${YELLOW}⚠️  ${g.gate}${RESET}  ${g.label}  ${YELLOW}(missing — optional)${RESET}`);
      console.log(`       Tip: ${g.tip}`);
      warnings++;
    }
  }
}

// ─── verdict ─────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}${BLUE}═══════════════════════════════════════════════════${RESET}`);

if (hardBlock) {
  console.log(`\n${BOLD}${RED}🚫 TRADING BLOCKED — Complete missing required gates first.${RESET}`);
  console.log(`${RED}   Per Rule P-002: No orders without completed daily report.${RESET}\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`\n${BOLD}${YELLOW}⚠️  ${warnings} optional gates missing — proceed with caution.${RESET}`);
  console.log(`${YELLOW}   You may trade, but opportunity/news data may be incomplete.${RESET}\n`);
  process.exit(0);
} else {
  console.log(`\n${BOLD}${GREEN}✅ ALL GATES PASSED — Safe to proceed with order execution.${RESET}\n`);
  process.exit(0);
}
}

// Export for unit testing
module.exports = { fileAgeMinutes, findGateFile, GATES };
