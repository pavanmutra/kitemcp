#!/usr/bin/env node
/**
 * run_automated_workflow.js - Fully automated daily workflow
 * 
 * Run with: npm run workflow
 * 
 * This script orchestrates the daily workflow:
 * 1. Validates JSON data files exist and have correct schema
 * 2. Runs report generation scripts
 * 3. Generates Markdown & Excel reports
 * 
 * NOTE: JSON data files MUST be created first by AI agent using Kite MCP tools.
 * 
 * REQUIRED DATA FILES (created by AI agent):
 *   - reports/YYYY-MM-DD/raw_data/YYYY-MM-DD_portfolio_snapshot.json
 *   - reports/YYYY-MM-DD/raw_data/YYYY-MM-DD_value_screen.json
 *   - reports/YYYY-MM-DD/raw_data/YYYY-MM-DD_gtt_audit.json
 * 
 * OPTIONAL DATA FILES (created by AI agent via prompts):
 *   - reports/YYYY-MM-DD/raw_data/YYYY-MM-DD_opportunities.json (prompts/opportunity_scanner.md)
 *   - reports/YYYY-MM-DD/raw_data/YYYY-MM-DD_news_opportunities.json (prompts/news_scanner.md)
 *   - reports/YYYY-MM-DD/raw_data/YYYY-MM-DD_dividend_calendar.json (prompts/dividend_calendar.md)
 *   - reports/YYYY-MM-DD/raw_data/YYYY-MM-DD_risk_assessment.json (prompts/risk_assessment.md)
 * 
 * SCRIPTS RUN BY THIS WORKFLOW:
 *   1. create_master_markdown.js - Generate daily report (.md)
 *   2. create_portfolio_export.js - Generate Excel portfolio export
 *   3. create_dividend_calendar.js - Generate dividend calendar
 *   4. create_risk_assessment.js - Generate risk assessment
 *   5. convert_deep_value.js - Convert deep value screener
 *   6. fetch_commodities.js - Fetch MCX commodity prices
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TODAY = new Date().toISOString().split('T')[0];
const DAILY_DIR = path.join(__dirname, '../reports', TODAY);
const RAW_DIR = path.join(DAILY_DIR, 'raw_data');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function runScript(script) {
    console.log(`\n▶ Running ${script}...`);
    try {
        execSync(`node ${script}`, { cwd: __dirname, stdio: 'inherit' });
        return true;
    } catch (err) {
        console.error(`❌ Failed: ${script}`);
        return false;
    }
}

function validateSchema(data, schema) {
    const errors = [];
    for (const [field, type] of Object.entries(schema)) {
        if (data[field] === undefined) {
            errors.push(`Missing required field: ${field}`);
        } else if (type === 'array' && !Array.isArray(data[field])) {
            errors.push(`${field} must be an array`);
        } else if (type === 'object' && typeof data[field] !== 'object') {
            errors.push(`${field} must be an object`);
        } else if (type === 'number' && typeof data[field] !== 'number') {
            errors.push(`${field} must be a number`);
        }
    }
    return errors;
}

function checkRequiredFiles() {
    const requiredFiles = [
        { name: 'portfolio_snapshot.json', schema: {
            total_value: 'number',
            day_pnl: 'number',
            day_pnl_pct: 'number',
            total_pnl: 'number',
            total_pnl_pct: 'number',
            holdings: 'array'
        }},
        { name: 'value_screen.json', schema: {
            stocks: 'array'
        }},
        { name: 'gtt_audit.json', schema: {
            total_gtts_active: 'number',
            total_protected_holdings: 'number',
            protected_holdings: 'array',
            unprotected_holdings: 'array'
        }}
    ];

    const results = { passed: true, files: [] };

    for (const file of requiredFiles) {
        const filePath = path.join(RAW_DIR, `${TODAY}_${file.name}`);
        const result = { name: file.name, exists: false, valid: false, errors: [] };
        
        if (fs.existsSync(filePath)) {
            result.exists = true;
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const errors = validateSchema(data, file.schema);
                if (errors.length > 0) {
                    result.errors = errors;
                } else {
                    result.valid = true;
                }
            } catch (e) {
                result.errors = [`Invalid JSON: ${e.message}`];
            }
        } else {
            result.errors = ['File not found'];
        }
        
        results.files.push(result);
        if (!result.valid) {
            results.passed = false;
        }
    }
    
    return results;
}

async function main() {
    console.log(`\n🌀 KiteMCP Automated Workflow — ${TODAY}\n`);
    
    ensureDir(RAW_DIR);
    
    // Check required files
    console.log('📋 Checking required data files...\n');
    const check = checkRequiredFiles();
    
    for (const file of check.files) {
        const status = file.valid ? '✅' : (file.exists ? '⚠️' : '❌');
        console.log(`${status} ${file.name}`);
        if (file.errors.length > 0) {
            file.errors.forEach(e => console.log(`   └─ ${e}`));
        }
    }
    
    if (!check.passed) {
        console.log('\n❌ Data files missing or invalid schema!');
        console.log('   Run AI agent to fetch data via Kite MCP tools first.');
        console.log('   Required files:');
        console.log(`   - ${RAW_DIR}/${TODAY}_portfolio_snapshot.json`);
        console.log(`   - ${RAW_DIR}/${TODAY}_value_screen.json`);
        console.log(`   - ${RAW_DIR}/${TODAY}_gtt_audit.json`);
        console.log('\n   AI agent should:');
        console.log('   1. kite_get_holdings() → create portfolio_snapshot.json');
        console.log('   2. kite_get_gtts() → create gtt_audit.json');
        console.log('   3. Web search for IV → create value_screen.json');
        console.log('');
        console.log('   Then run: npm run workflow');
        process.exit(1);
    }
    
    console.log('\n✅ All data files validated successfully!');
    
    // Run all report generation scripts in sequence
    const scripts = [
        'create_master_markdown.js',
        'create_portfolio_export.js',
        'create_dividend_calendar.js',
        'create_risk_assessment.js',
        'convert_deep_value.js',
        'fetch_commodities.js'
    ];
    
    let allOk = true;
    for (const script of scripts) {
        if (!runScript(script)) {
            allOk = false;
        }
    }
    
    if (allOk) {
        console.log('\n✅ Daily workflow complete!');
        console.log(`   📄 Markdown: reports/${TODAY}/${TODAY}_daily_report.md`);
        console.log(`   📊 Excel: reports/${TODAY}/Portfolio_${TODAY}.xlsx`);
    } else {
        console.log('\n⚠️ Some steps failed. Check logs above.');
        process.exit(1);
    }
}

main();
