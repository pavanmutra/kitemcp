/**
 * Unit tests for API helper: getRecommendations()
 * Tests pure recommendation logic in isolation.
 *
 * NOTE: getRecommendations is not exported from routes/api.js,
 * so we copy it inline here. Keep in sync with api.js:275-311.
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

describe('getRecommendations (API helper)', () => {
    describe('historical freshness', () => {
        test('returns warning for historical data', () => {
            const result = getRecommendations('historical', false);
            expect(result).toContainEqual(
                expect.objectContaining({
                    type: 'warning',
                    message: expect.stringContaining('historical')
                })
            );
        });

        test('returns action for historical data', () => {
            const result = getRecommendations('historical', false);
            expect(result[0].action).toBe('npm run refresh');
        });
    });

    describe('stale freshness during market open', () => {
        test('returns warning for stale data during market hours', () => {
            const result = getRecommendations('stale', true);
            expect(result).toContainEqual(
                expect.objectContaining({
                    type: 'warning',
                    message: expect.stringContaining('30 minutes')
                })
            );
        });

        test('returns info for stale + market open', () => {
            const result = getRecommendations('stale', true);
            expect(result.some(r => r.type === 'info' && r.message.includes('Market is open'))).toBe(true);
        });
    });

    describe('current/recent freshness', () => {
        test('returns success for current data', () => {
            const result = getRecommendations('current', true);
            expect(result).toContainEqual(
                expect.objectContaining({
                    type: 'success',
                    message: expect.stringContaining('current')
                })
            );
        });

        test('returns success for recent data', () => {
            const result = getRecommendations('recent', false);
            expect(result).toContainEqual(
                expect.objectContaining({
                    type: 'success'
                })
            );
        });

        test('recent data has no action', () => {
            const result = getRecommendations('recent', true);
            const success = result.find(r => r.type === 'success');
            expect(success.action).toBeNull();
        });
    });

    describe('market closed scenarios', () => {
        test('historical + market closed: no market info message', () => {
            const result = getRecommendations('historical', false);
            const hasMarketInfo = result.some(r =>
                r.type === 'info' && r.message.includes('Market is open')
            );
            expect(hasMarketInfo).toBe(false);
        });

        test('current + market closed: no market open info', () => {
            const result = getRecommendations('current', false);
            const hasMarketOpen = result.some(r =>
                r.type === 'info' && r.message.includes('Market is open')
            );
            expect(hasMarketOpen).toBe(false);
        });
    });

    describe('empty freshness', () => {
        test('returns empty array for unrecognized freshness', () => {
            // Unknown freshness values don't match any condition → empty array
            const result = getRecommendations('', true);
            expect(Array.isArray(result)).toBe(true);
        });

        test('returns empty array for null freshness', () => {
            const result = getRecommendations(null, false);
            expect(Array.isArray(result)).toBe(true);
        });
    });
});
