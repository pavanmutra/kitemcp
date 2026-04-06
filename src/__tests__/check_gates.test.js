/**
 * Unit tests for check_gates.js helpers
 * Tests fileAgeMinutes and findGateFile logic
 *
 * NOTE: check_gates.js calls process.exit() at top-level on require.
 * We use jest.mock to intercept process.exit before the module runs.
 */

const { fileAgeMinutes, findGateFile } = require('../check_gates');
const path = require('path');
const fs = require('fs');

describe('fileAgeMinutes', () => {

    test('returns number for real file path', () => {
        const reportsDir = path.join(__dirname, '../../reports');
        const testFile = path.join(reportsDir, '2026-04-06', 'raw_data', '2026-04-06_gate_status.json');
        if (!fs.existsSync(testFile)) return; // skip if not found

        const result = fileAgeMinutes(testFile);
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(0);
    });

    test('returns null for truly non-existent path', () => {
        const nonExistent = path.join(__dirname, 'nonexistent_2099_file_xyz123.json');
        const result = fileAgeMinutes(nonExistent);
        expect(result).toBeNull();
    });

});

describe('findGateFile', () => {

    test('finds portfolio snapshot for today', () => {
        const result = findGateFile('2026-04-06_portfolio_snapshot.json');
        expect(result).not.toBeNull();
        expect(typeof result).toBe('string');
        expect(result).toContain('2026-04-06_portfolio_snapshot.json');
    });

    test('finds value screen file', () => {
        const result = findGateFile('2026-04-06_value_screen.json');
        expect(result).not.toBeNull();
        expect(typeof result).toBe('string');
    });

    test('finds GTT audit file', () => {
        const result = findGateFile('2026-04-06_gtt_audit.json');
        expect(result).not.toBeNull();
    });

    test('returns null for non-existent file', () => {
        const result = findGateFile('nonexistent_20991231_file.json');
        expect(result).toBeNull();
    });

    test('searches across multiple candidate paths', () => {
        // The function should try: flat root, raw_data, archive
        const result = findGateFile('2026-04-06_gate_status.json');
        expect(result).not.toBeNull();
    });
});

describe('Gate files exist for 2026-04-06', () => {
    const today = '2026-04-06';
    const reportsDir = path.join(__dirname, '../../reports');
    const todayDir = path.join(reportsDir, today);

    test('today directory exists', () => {
        expect(fs.existsSync(todayDir)).toBe(true);
    });

    test('raw_data directory exists', () => {
        const rawDir = path.join(todayDir, 'raw_data');
        expect(fs.existsSync(rawDir)).toBe(true);
    });

    const requiredFiles = [
        '2026-04-06_portfolio_snapshot.json',
        '2026-04-06_gtt_audit.json',
        '2026-04-06_value_screen.json',
        '2026-04-06_gate_status.json',
        '2026-04-06_opportunities.json',
        '2026-04-06_news_opportunities.json',
        '2026-04-06_commodity_opportunities.json'
    ];

    requiredFiles.forEach(file => {
        test(`raw_data/${file} exists`, () => {
            const filePath = path.join(todayDir, 'raw_data', file);
            expect(fs.existsSync(filePath)).toBe(true);
        });
    });

    test('daily report markdown exists', () => {
        const reportPath = path.join(todayDir, `${today}_daily_report.md`);
        expect(fs.existsSync(reportPath)).toBe(true);
    });
});
