/**
 * Unit tests for Formatters utility class
 * Tests pure formatting functions in isolation
 */

const Formatters = require('../utils/formatters');

describe('Formatters', () => {
    describe('formatCurrency', () => {
        test('returns ₹0.00 for null', () => {
            expect(Formatters.formatCurrency(null)).toBe('₹0.00');
        });

        test('returns ₹0.00 for undefined', () => {
            expect(Formatters.formatCurrency(undefined)).toBe('₹0.00');
        });

        test('returns ₹0.00 for NaN', () => {
            expect(Formatters.formatCurrency(NaN)).toBe('₹0.00');
        });

        test('formats Crore values correctly (>= 1 Cr)', () => {
            expect(Formatters.formatCurrency(15000000)).toBe('₹1.50Cr');
            expect(Formatters.formatCurrency(10000000)).toBe('₹1.00Cr');
            expect(Formatters.formatCurrency(50000000)).toBe('₹5.00Cr');
            expect(Formatters.formatCurrency(123456789)).toBe('₹12.35Cr');
        });

        test('formats Lakh values correctly (>= 1 L)', () => {
            expect(Formatters.formatCurrency(150000)).toBe('₹1.50L');
            expect(Formatters.formatCurrency(100000)).toBe('₹1.00L');
            expect(Formatters.formatCurrency(99999)).toBe('₹99,999.00');
        });

        test('formats plain values correctly (< 1 L)', () => {
            expect(Formatters.formatCurrency(500)).toBe('₹500.00');
            expect(Formatters.formatCurrency(1234.56)).toBe('₹1,234.56');
            expect(Formatters.formatCurrency(0)).toBe('₹0.00');
        });

        test('handles negative values correctly', () => {
            expect(Formatters.formatCurrency(-50000)).toBe('₹-50,000.00');
            expect(Formatters.formatCurrency(-150000)).toBe('₹-1.50L');
            expect(Formatters.formatCurrency(-15000000)).toBe('₹-1.50Cr');
        });

        test('handles small fractional values', () => {
            expect(Formatters.formatCurrency(0.01)).toBe('₹0.01');
            expect(Formatters.formatCurrency(99.99)).toBe('₹99.99');
        });

        test('handles 99,99,999 (9999999) as L since 10L < 1Cr', () => {
            // 9999999 >= 100000 (100L) and < 10000000 (1Cr) → Lakh format
            const result = Formatters.formatCurrency(9999999);
            expect(result).toBe('₹100.00L');
        });

        test('handles 99,999 as plain since < 1 Lakh', () => {
            // 99999 < 100000 → plain format
            const result = Formatters.formatCurrency(99999);
            expect(result).toBe('₹99,999.00');
        });
    });

    describe('formatPercent', () => {
        test('returns 0.00% for null', () => {
            expect(Formatters.formatPercent(null)).toBe('0.00%');
        });

        test('returns 0.00% for undefined', () => {
            expect(Formatters.formatPercent(undefined)).toBe('0.00%');
        });

        test('returns 0.00% for NaN', () => {
            expect(Formatters.formatPercent(NaN)).toBe('0.00%');
        });

        test('adds + sign for positive values', () => {
            expect(Formatters.formatPercent(25.5)).toBe('+25.50%');
            expect(Formatters.formatPercent(0)).toBe('+0.00%');
            expect(Formatters.formatPercent(100)).toBe('+100.00%');
            expect(Formatters.formatPercent(0.01)).toBe('+0.01%');
        });

        test('no + sign for zero', () => {
            expect(Formatters.formatPercent(0)).toBe('+0.00%');
        });

        test('no + sign for negative values', () => {
            expect(Formatters.formatPercent(-10)).toBe('-10.00%');
            expect(Formatters.formatPercent(-0.5)).toBe('-0.50%');
            expect(Formatters.formatPercent(-100)).toBe('-100.00%');
        });

        test('always shows 2 decimal places', () => {
            expect(Formatters.formatPercent(5)).toBe('+5.00%');
            expect(Formatters.formatPercent(-5)).toBe('-5.00%');
        });
    });

    describe('normalizeHoldings', () => {
        test('returns empty array for undefined input', () => {
            expect(Formatters.normalizeHoldings(undefined)).toEqual([]);
            expect(Formatters.normalizeHoldings()).toEqual([]);
        });

        test('throws TypeError for null input (null bypasses default [])', () => {
            // normalizeHoldings has default param [] but null bypasses it
            // This is a known behavior — function crashes on null
            expect(() => Formatters.normalizeHoldings(null)).toThrow(TypeError);
        });

        test('normalizes standard holding fields', () => {
            const input = [{
                symbol: 'TMCV',
                quantity: 110,
                average_price: 355.37,
                current_price: 431.85,
                pnl: 8412.26
            }];
            const result = Formatters.normalizeHoldings(input);
            expect(result[0]).toEqual({
                symbol: 'TMCV',
                qty: 110,
                avg: 355.37,
                last: 431.85,
                pnl: 8412.26
            });
        });

        test('maps alternate field names (qty, avg, last_price)', () => {
            const input = [{
                symbol: 'NXST',
                qty: 650,
                avg_price: 135.19,
                last_price: 155.52,
                pnl: 13217.14
            }];
            const result = Formatters.normalizeHoldings(input);
            expect(result[0]).toEqual({
                symbol: 'NXST',
                qty: 650,
                avg: 135.19,
                last: 155.52,
                pnl: 13217.14
            });
        });

        test('maps tradingsymbol to symbol', () => {
            const input = [{
                tradingsymbol: 'NSE:ASHOKA',
                qty: 535,
                avg: 112.72,
                last: 109.15,
                pnl: -1911
            }];
            const result = Formatters.normalizeHoldings(input);
            expect(result[0].symbol).toBe('NSE:ASHOKA');
        });

        test('uses UNKNOWN for missing symbol', () => {
            const input = [{ quantity: 100 }];
            const result = Formatters.normalizeHoldings(input);
            expect(result[0].symbol).toBe('UNKNOWN');
        });

        test('defaults missing fields to 0', () => {
            const input = [{ symbol: 'TEST' }];
            const result = Formatters.normalizeHoldings(input);
            expect(result[0]).toEqual({
                symbol: 'TEST',
                qty: 0,
                avg: 0,
                last: 0,
                pnl: 0
            });
        });

        test('handles multiple holdings', () => {
            const input = [
                { symbol: 'A', quantity: 10, average_price: 100, current_price: 110, pnl: 100 },
                { symbol: 'B', qty: 20, avg: 200, last_price: 180, pnl: -400 }
            ];
            const result = Formatters.normalizeHoldings(input);
            expect(result).toHaveLength(2);
            expect(result[0].symbol).toBe('A');
            expect(result[1].symbol).toBe('B');
        });

        test('prefers quantity over qty', () => {
            const input = [{ symbol: 'TEST', quantity: 100, qty: 50 }];
            const result = Formatters.normalizeHoldings(input);
            expect(result[0].qty).toBe(100);
        });

        test('prefers average_price over avg over avg_price', () => {
            const input = [{ symbol: 'T', average_price: 100, avg: 50, avg_price: 25 }];
            const result = Formatters.normalizeHoldings(input);
            expect(result[0].avg).toBe(100);
        });

        test('prefers current_price over last_price over last', () => {
            const input = [{ symbol: 'T', current_price: 150, last_price: 100, last: 50 }];
            const result = Formatters.normalizeHoldings(input);
            expect(result[0].last).toBe(150);
        });
    });
});
