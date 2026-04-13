/**
 * Unit tests for config.js
 * Tests that all configuration values are correctly defined
 */

const config = require('../lib/config');

describe('config', () => {
    describe('risk thresholds', () => {
        test('maxPositionSizePercent is 10', () => {
            expect(config.risk.maxPositionSizePercent).toBe(10);
        });

        test('maxSingleStockPercent is 25', () => {
            expect(config.risk.maxSingleStockPercent).toBe(25);
        });

        test('maxSectorWeightPercent is 40', () => {
            expect(config.risk.maxSectorWeightPercent).toBe(40);
        });

        test('deepDiscountMos is 40', () => {
            expect(config.risk.deepDiscountMos).toBe(40);
        });

        test('moderateDiscountMos is 25', () => {
            expect(config.risk.moderateDiscountMos).toBe(25);
        });

        test('overvaluedMos is -15', () => {
            expect(config.risk.overvaluedMos).toBe(-15);
        });

        test('largeLossThreshold is -15', () => {
            expect(config.risk.largeLossThreshold).toBe(-15);
        });

        test('taxLossHarvestThreshold is -10', () => {
            expect(config.risk.taxLossHarvestThreshold).toBe(-10);
        });
    });

    describe('valuation', () => {
        test('grahamMultiplier is 22.5', () => {
            expect(config.valuation.grahamMultiplier).toBe(22.5);
        });

        test('dcfDiscountRate is 0.12', () => {
            expect(config.valuation.dcfDiscountRate).toBe(0.12);
        });

        test('dcfHorizonYears is 5', () => {
            expect(config.valuation.dcfHorizonYears).toBe(5);
        });

        test('bankPbMultiple is 2.0', () => {
            expect(config.valuation.bankPbMultiple).toBe(2.0);
        });

        test('holdingCompanyPb is 1.0', () => {
            expect(config.valuation.holdingCompanyPb).toBe(1.0);
        });
    });

    describe('gates', () => {
        test('staleThresholdMinutes is 240 (4 hours)', () => {
            expect(config.gates.staleThresholdMinutes).toBe(240);
        });

        test('pollIntervalMs is 5000 (5 seconds)', () => {
            expect(config.gates.pollIntervalMs).toBe(5000);
        });

        test('scriptTimeoutMs is 60000 (1 minute)', () => {
            expect(config.gates.scriptTimeoutMs).toBe(60000);
        });

        test('timeoutMs is 2 hours', () => {
            expect(config.gates.timeoutMs).toBe(2 * 60 * 60 * 1000);
        });
    });

    describe('time', () => {
        test('msPerMinute is 60000', () => {
            expect(config.time.msPerMinute).toBe(60000);
        });

        test('msPerHour is 3600000', () => {
            expect(config.time.msPerHour).toBe(3600000);
        });
    });

    describe('document settings', () => {
        test('pageWidth is 12240 DXA', () => {
            expect(config.document.pageWidth).toBe(12240);
        });

        test('pageHeight is 15840 DXA', () => {
            expect(config.document.pageHeight).toBe(15840);
        });

        test('margin is defined for all sides', () => {
            expect(config.document.margin.top).toBe(1440);
            expect(config.document.margin.right).toBe(1440);
            expect(config.document.margin.bottom).toBe(1440);
            expect(config.document.margin.left).toBe(1440);
        });

        test('font is Arial', () => {
            expect(config.document.font).toBe('Arial');
        });

        test('fontSize is 22 half-points (11pt)', () => {
            expect(config.document.fontSize).toBe(22);
        });
    });

    describe('portfolio defaults', () => {
        test('defaultHoldings array is defined', () => {
            expect(Array.isArray(config.portfolio.defaultHoldings)).toBe(true);
        });

        test('defaultHoldings has 6 stocks', () => {
            expect(config.portfolio.defaultHoldings).toHaveLength(6);
        });

        test('defaultAvailableMargin is null and sourced from Kite snapshot', () => {
            expect(config.portfolio.defaultAvailableMargin).toBeNull();
        });

        test('dividend calendar generator exists', () => {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '../../src/create_dividend_calendar.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });
    });

    describe('export defaults', () => {
        test('commodityDefaults has 4 commodities', () => {
            expect(config.export.commodityDefaults).toHaveLength(4);
        });

        test('commodityDefaults includes GOLD, SILVER, CRUDE, NATURALGAS', () => {
            const symbols = config.export.commodityDefaults.map(c => c.symbol);
            expect(symbols).toContain('GOLD');
            expect(symbols).toContain('SILVER');
            expect(symbols).toContain('CRUDE');
            expect(symbols).toContain('NATURALGAS');
        });

        test('all commodities have required fields', () => {
            config.export.commodityDefaults.forEach(c => {
                expect(typeof c.symbol).toBe('string');
                expect(typeof c.price).toBe('number');
                expect(typeof c.change_percent).toBe('number');
                expect(typeof c.trend).toBe('string');
                expect(typeof c.recommendation).toBe('string');
            });
        });

        test('defaultHoldings has 6 stocks', () => {
            expect(config.export.defaultHoldings).toHaveLength(6);
        });
    });
});
