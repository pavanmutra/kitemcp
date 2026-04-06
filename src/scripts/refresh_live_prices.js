/**
 * refresh_live_prices.js
 * 
 * Refreshes live portfolio prices using AI Agent via OpenCode MCP.
 * Since KiteMCP uses OAuth sessions that can't be called directly from Node.js,
 * this script launches OpenCode with the live refresh prompt.
 * 
 * Usage:
 *   npm run refresh
 * 
 * Workflow:
 *   1. Script generates the AI prompt with today's date
 *   2. Opens OpenCode with the refresh prompt
 *   3. User lets AI agent fetch live prices and update JSON files
 *   4. User runs: npm run web to view dashboard with live data
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROMPT_FILE = path.join(__dirname, 'prompts', 'live_refresh.txt');
const REPORTS_DIR = path.join(__dirname, '../../reports');

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function getLatestReportDate() {
    try {
        const entries = fs.readdirSync(REPORTS_DIR, { withFileTypes: true });
        const dates = entries
            .filter(e => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
            .map(e => e.name)
            .sort()
            .reverse();
        return dates[0] || getTodayDate();
    } catch (e) {
        return getTodayDate();
    }
}

function loadPrompt() {
    try {
        return fs.readFileSync(PROMPT_FILE, 'utf8');
    } catch (e) {
        console.error('Error loading prompt file:', e.message);
        process.exit(1);
    }
}

function replaceDatePlaceholders(prompt, date) {
    return prompt.replace(/YYYY-MM-DD/g, date);
}

function printBanner() {
    const today = getTodayDate();
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║           KiteMCP Live Price Refresh - AI Agent Workflow          ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  📅 Today: ${today}`);
    console.log(`  📂 Latest report: ${getLatestReportDate()}`);
    console.log('');
    console.log('  ┌─────────────────────────────────────────────────────────────────┐');
    console.log('  │  STEP 1: Run this command to launch AI agent refresh           │');
    console.log('  │                                                                 │');
    console.log('  │  👇 Copy and paste the prompt below into OpenCode 👇          │');
    console.log('  └─────────────────────────────────────────────────────────────────┘');
    console.log('');
}

function printPrompt(prompt) {
    const lines = prompt.split('\n');
    const maxLen = Math.min(60, process.stdout.columns || 80);
    
    console.log('  ' + '─'.repeat(maxLen));
    console.log('');
    
    // Find the START EXECUTION marker
    const startIdx = lines.findIndex(l => l.includes('START EXECUTION:'));
    const relevantLines = startIdx >= 0 ? lines.slice(startIdx) : lines;
    
    // Print the prompt with wrapping
    relevantLines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.length > 0) {
            // Simple wrapping
            const words = trimmed.split(' ');
            let currentLine = '  │  ';
            
            words.forEach(word => {
                if ((currentLine + word).length > maxLen + 4) {
                    console.log(currentLine.padEnd(maxLen + 6) + '│');
                    currentLine = '  │  ' + word + ' ';
                } else {
                    currentLine += word + ' ';
                }
            });
            
            if (currentLine.trim() !== '│' && currentLine.trim() !== '│  ') {
                console.log(currentLine.padEnd(maxLen + 6) + '│');
            }
        }
    });
    
    console.log('');
    console.log('  ' + '─'.repeat(maxLen));
}

function printInstructions() {
    console.log('');
    console.log('  ┌─────────────────────────────────────────────────────────────────┐');
    console.log('  │  WORKFLOW:                                                   │');
    console.log('  │                                                                 │');
    console.log('  │  1. Open OpenCode (or Antigravity) in this project folder      │');
    console.log('  │  2. Paste the prompt above into the chat                      │');
    console.log('  │  3. Let AI agent fetch live prices and update JSON files       │');
    console.log('  │  4. AI agent will report: "X holdings refreshed, ₹X value"     │');
    console.log('  │  5. Run: npm run web  (opens dashboard with LIVE prices)      │');
    console.log('  │                                                                 │');
    console.log('  │  TIP: The AI will automatically update the JSON files in         │');
    console.log('  │       reports/YYYY-MM-DD/raw_data/ with fresh prices            │');
    console.log('  └─────────────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('  📌 Alternative: Type "refresh live prices" in OpenCode');
    console.log('');
}

function tryLaunchOpenCode(prompt) {
    const opencodeCmd = process.platform === 'win32' ? 'opencode' : 'opencode';
    
    try {
        console.log('  🚀 Attempting to launch OpenCode automatically...');
        
        const child = spawn(opencodeCmd, [], {
            detached: true,
            stdio: 'ignore',
            shell: true
        });
        
        child.unref();
        
        // Give it a moment
        setTimeout(() => {
            console.log('  ✅ OpenCode launched!');
            console.log('');
            console.log('  ⚠️  If OpenCode did not open, copy the prompt manually.');
        }, 1000);
        
    } catch (e) {
        console.log('  💡 Could not auto-launch. Copy the prompt manually.');
    }
}

function main() {
    const today = getTodayDate();
    const basePrompt = loadPrompt();
    const prompt = replaceDatePlaceholders(basePrompt, today);
    
    printBanner();
    printPrompt(prompt);
    printInstructions();
    
    // Try to auto-launch OpenCode
    tryLaunchOpenCode(prompt);
    
    console.log('');
}

main();
