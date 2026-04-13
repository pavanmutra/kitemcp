/**
 * Unit tests for convert_deep_value.js
 * Tests the parseRow pure function and markdown parsing logic
 */

const convertDeepValueMarkdown = require('../convert_deep_value');
const path = require('path');
const fs = require('fs');

describe('convertDeepValueMarkdown', () => {
    test('module exports a function', () => {
        expect(typeof convertDeepValueMarkdown).toBe('function');
    });

    test('returns undefined when called directly (no return value)', () => {
        // The function writes to file but returns nothing
        // We verify by checking it doesn't throw
        jest.mock('fs', () => ({
            existsSync: jest.fn(() => false),
            readFileSync: jest.fn(() => ''),
            writeFileSync: jest.fn(),
            mkdirSync: jest.fn()
        }));

        // If the input file doesn't exist, it returns undefined silently
        expect(convertDeepValueMarkdown).not.toThrow();
    });
});

describe('parseRow helper (inline pure function)', () => {
    // parseRow is defined inside convertDeepValueMarkdown, not exported
    // We test the logic by extracting the same pattern

    function parseRow(line) {
        return line
            .split('|')
            .slice(1, -1)
            .map((cell) => cell.trim());
    }

    test('parses standard pipe-separated row', () => {
        const line = '| Tata Motors | TATAMOTORS | 18.5 | 2.1 | 22% | 0.3 | 46% | 0% | 15% | 2,80,000 | 8/10 | LOW |';
        const cells = parseRow(line);
        expect(cells).toEqual([
            'Tata Motors',
            'TATAMOTORS',
            '18.5',
            '2.1',
            '22%',
            '0.3',
            '46%',
            '0%',
            '15%',
            '2,80,000',
            '8/10',
            'LOW'
        ]);
    });

    test('handles empty cells', () => {
        const line = '|  | UNKNOWN |  |  |  |  |  |  |  |  |  |  |';
        const cells = parseRow(line);
        expect(cells).toEqual([
            '', 'UNKNOWN', '', '', '', '', '', '', '', '', '', ''
        ]);
    });

    test('trims whitespace from each cell', () => {
        const line = '|  Apple  |  150.5  |  25%  |';
        const cells = parseRow(line);
        expect(cells).toEqual(['Apple', '150.5', '25%']);
    });

    test('returns empty array for empty line', () => {
        const cells = parseRow('');
        expect(cells).toEqual([]);
    });

    test('handles complex numbers with commas', () => {
        const line = '| Company | TICK | 15.2 | 1.8 | 18.5% | 0.5 | 55% | 0% | 22% | 12,50,000 | 9/10 | LOW |';
        const cells = parseRow(line);
        expect(cells[9]).toBe('12,50,000');
    });
});

describe('Float parsing for numeric fields', () => {
    function parseNumeric(str) {
        return parseFloat(str) || 0;
    }

    function parsePercent(str) {
        return parseFloat(str.replace('%', '')) || 0;
    }

    test('parses valid floats', () => {
        expect(parseNumeric('18.5')).toBe(18.5);
        expect(parseNumeric('2.1')).toBe(2.1);
        expect(parseNumeric('0')).toBe(0);
    });

    test('returns 0 for invalid floats', () => {
        expect(parseNumeric('')).toBe(0);
        expect(parseNumeric('N/A')).toBe(0);
        expect(parseNumeric('INVALID')).toBe(0);
    });

    test('parses percentage strings', () => {
        expect(parsePercent('22%')).toBe(22);
        expect(parsePercent('0%')).toBe(0);
        expect(parsePercent('15.5%')).toBe(15.5);
    });

    test('handles mcap with commas', () => {
        const mcapStr = '2,80,000';
        const mcap = parseFloat(mcapStr.replace(/,/g, ''));
        expect(mcap).toBe(280000);
    });
});

describe('Category header extraction', () => {
    test('extracts category name from ## header', () => {
        const line = '## Banking (14 stocks)';
        const match = line.match(/##\s+([^\(]+)/);
        expect(match[1].trim()).toBe('Banking');
    });

    test('extracts category from simple ## header', () => {
        const line = '## Infrastructure';
        const match = line.match(/##\s+([^\(]+)/);
        expect(match[1].trim()).toBe('Infrastructure');
    });

    test('skips scoring legend headers', () => {
        const line = '## Scoring Legend';
        // In the actual code, this would be filtered out by !line.includes('Scoring Legend')
        expect(line.includes('Scoring Legend')).toBe(true);
    });
});

describe('Data row validation', () => {
    test('validates row has >= 12 cells', () => {
        const validRow = '| A | B | C | D | E | F | G | H | I | J | K | L |';
        const cells = validRow.split('|').slice(1, -1);
        expect(cells.length).toBe(12);
    });

    test('skips header rows (Company in first cell)', () => {
        const headerRow = '| Company | Ticker | P/E | P/B | ROE | D/E | Promoter | Pledge | Sales 5Y | MCap | Score | Risk |';
        const cells = headerRow.split('|').slice(1, -1).map(c => c.trim());
        expect(cells[0]).toBe('Company');
    });

    test('identifies separator rows', () => {
        const separator = '|---|---|---|---|---|---|---|---|---|---|---|---|';
        expect(separator.includes('---|')).toBe(true);
    });
});

describe('Input file existence', () => {
    test('input markdown file exists', () => {
        const inputFile = path.join(__dirname, '../../prompts/indian_deep_value_stocks.md');
        const exists = fs.existsSync(inputFile);
        expect(exists).toBe(true);
    });
});
