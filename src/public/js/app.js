/**
 * KiteMCP Portfolio Dashboard - Client-Side Application
 * Handles data fetching, rendering, and interactivity
 */

(function() {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    const CONFIG = {
        REFRESH_INTERVAL: 30000, // 30 seconds
        MARKET_OPEN: 9 * 60 + 15, // 9:15 AM IST in minutes
        MARKET_CLOSE: 15 * 60 + 30, // 3:30 PM IST in minutes
        API_BASE: '/api'
    };

    // ============================================
    // State Management
    // ============================================
    const state = {
        currentDate: new Date().toISOString().split('T')[0],
        availableDates: [],
        dashboardData: null,
        deepValueData: null,
        marketStatus: { isOpen: false },
        autoRefreshTimer: null,
        isRefreshing: false,
        activeTab: 'holdings',
        activeHorizon: 'all',
        isMasked: false,
        deepValueSort: { column: 'score', direction: 'desc' }
    };

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        loadingOverlay: document.getElementById('loadingOverlay'),
        reportDate: document.getElementById('reportDate'),
        refreshBtn: document.getElementById('refreshBtn'),
        lastUpdated: document.getElementById('lastUpdated'),
        // Market Status
        marketStatus: document.getElementById('marketStatus'),
        
        // Mask Toggle
        maskToggleBtn: document.getElementById('maskToggleBtn'),
        maskIcon: document.getElementById('maskIcon'),
        
        // Summary cards
        totalValue: document.getElementById('totalValue'),
        totalPnl: document.getElementById('totalPnl'),
        totalPnlPct: document.getElementById('totalPnlPct'),
        availableMargin: document.getElementById('availableMargin'),
        holdingsCount: document.getElementById('holdingsCount'),
        
        // Holdings table
        holdingsBody: document.getElementById('holdingsBody'),
        holdingsSearch: document.getElementById('holdingsSearch'),
        holdingsSort: document.getElementById('holdingsSort'),
        
        // Deep discounts
        discountsGrid: document.getElementById('discountsGrid'),
        discountCount: document.getElementById('discountCount'),
        mosAlertPanel: document.getElementById('mosAlertPanel'),
        mosAlertCount: document.getElementById('mosAlertCount'),
        riskGrid: document.getElementById('riskGrid'),
        concentrationGrid: document.getElementById('concentrationGrid'),
        calendarGrid: document.getElementById('calendarGrid'),
        
        // GTT
        protectedCount: document.getElementById('protectedCount'),
        unprotectedCount: document.getElementById('unprotectedCount'),
        gttList: document.getElementById('gttList'),
        
        // Opportunities
        opportunitiesGrid: document.getElementById('opportunitiesGrid'),
        
        // Commodities
        commoditiesGrid: document.getElementById('commoditiesGrid'),
        
        // Deep Value Screener
        deepValueTable: document.getElementById('deepValueTable'),
        deepValueBody: document.getElementById('deepValueBody'),
        deepValueSearch: document.getElementById('deepValueSearch'),
        deepValueSector: document.getElementById('deepValueSector'),
        
        // Tabs
        tabs: document.querySelectorAll('.tab'),
        tabPanels: document.querySelectorAll('.tab-panel'),
        
        // Horizon filters
        horizonFilters: document.querySelectorAll('.filter-btn')
    };

    // ============================================
    // Utility Functions
    // ============================================
    function formatCurrency(value) {
        if (state.isMasked) return '••••••';
        if (value == null || isNaN(value)) return '₹--';
        const abs = Math.abs(value);
        if (abs >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
        if (abs >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
        return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }

    function formatPercent(value) {
        if (value == null || isNaN(value)) return '--%';
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    }

    function formatMos(value) {
        if (value == null || isNaN(value)) return '--';
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    }

    function getMosValue(holding) {
        return holding.mos_pct ?? 0;
    }

    function escapeHtml(text) {
        if (text == null) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function renderRiskTracker(data) {
        if (!elements.riskGrid) return;
        const holdings = data?.portfolio?.holdings || [];
        const riskItems = holdings.map(h => {
            const qty = h.quantity || h.qty || h.t1_quantity || 0;
            const avg = h.average_price || h.avg_price || 0;
            const cmp = h.current_price || h.last_price || 0;
            const stopLoss = avg ? avg * 0.88 : 0;
            const maxDrawdown = avg ? ((cmp - stopLoss) / avg) * 100 : 0;
            return {
                symbol: h.symbol,
                qty,
                stopLoss,
                maxDrawdown,
                riskLevel: maxDrawdown > 20 ? 'HIGH' : maxDrawdown > 10 ? 'MEDIUM' : 'LOW'
            };
        });

        if (!riskItems.length) {
            elements.riskGrid.innerHTML = '<p class="empty-state">Risk data not available.</p>';
            return;
        }

        elements.riskGrid.innerHTML = riskItems.map(item => `
            <article class="risk-card">
                <div class="risk-card-top">
                    <strong>${escapeHtml(item.symbol)}</strong>
                    <span class="risk-pill risk-${item.riskLevel.toLowerCase()}">${item.riskLevel}</span>
                </div>
                <div class="risk-card-body">
                    <span>Qty: ${item.qty}</span>
                    <span>Stop-Loss: ₹${item.stopLoss.toFixed(2)}</span>
                    <span>Max Drawdown: ${item.maxDrawdown.toFixed(1)}%</span>
                </div>
            </article>
        `).join('');
    }

    function renderConcentrationView(data) {
        if (!elements.concentrationGrid) return;
        const holdings = data?.portfolio?.holdings || [];
        if (!holdings.length) {
            elements.concentrationGrid.innerHTML = '<p class="empty-state">Concentration data not available.</p>';
            return;
        }

        const stockExposure = holdings.map(h => {
            const qty = h.quantity || h.qty || h.t1_quantity || 0;
            const price = h.current_price || h.last_price || 0;
            return { symbol: h.symbol, exposure: qty * price };
        }).sort((a, b) => b.exposure - a.exposure);

        const total = stockExposure.reduce((sum, item) => sum + item.exposure, 0) || 1;

        elements.concentrationGrid.innerHTML = stockExposure.map(item => `
            <article class="concentration-card">
                <div class="concentration-top">
                    <strong>${escapeHtml(item.symbol)}</strong>
                    <span>${((item.exposure / total) * 100).toFixed(1)}%</span>
                </div>
                <div class="concentration-bar"><span style="width:${Math.min(100, (item.exposure / total) * 100)}%"></span></div>
                <div class="concentration-meta">₹${item.exposure.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            </article>
        `).join('');
    }

    async function renderDividendCalendar() {
        if (!elements.calendarGrid) return;
        const data = await fetchAPI(`/dividend-calendar?date=${state.currentDate}`);
        if (!data) {
            elements.calendarGrid.innerHTML = '<p class="empty-state">Calendar data not available.</p>';
            return;
        }

        const items = (data.buybacks || []).map(item => ({ ...item, label: 'Buyback' }));

        if (!items.length) {
            elements.calendarGrid.innerHTML = '<p class="empty-state">No buyback events found on Chittorgarh.</p>';
            return;
        }

        elements.calendarGrid.innerHTML = `
            <div class="calendar-source">Source: ${escapeHtml(data.sources?.buybacks || 'Chittorgarh buyback calendar')}</div>
            <div class="calendar-cards">
                ${items.map(item => `
                    <article class="calendar-card">
                        <div class="calendar-card-top">
                            <strong>${escapeHtml(item.symbol)}</strong>
                            <span class="calendar-pill calendar-${item.label.toLowerCase()}">${item.label}</span>
                        </div>
                        <div class="calendar-card-body">
                            ${item.current_price ? `<div>CMP: ₹${item.current_price.toLocaleString('en-IN')}</div>` : ''}
                            ${item.buyback_price ? `<div>Buyback: ₹${item.buyback_price} (${item.premium_pct || '--'}% premium)</div>` : ''}
                            <div>Record: ${escapeHtml(item.record_date || '--')}</div>
                            <div>${escapeHtml(item.note || 'Buyback calendar entry')}</div>
                        </div>
                    </article>
                `).join('')}
            </div>
        `;
    }

    // ============================================
    // Sorting Functions - Deep Value
    // ============================================
    function sortDeepValue(column) {
        const currentSort = state.deepValueSort;
        
        if (currentSort.column === column) {
            state.deepValueSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            state.deepValueSort = { column: column, direction: 'asc' };
        }
        
        updateSortIcons('deepValue', column, state.deepValueSort.direction);
        renderDeepValueScreener();
    }

    function updateSortIcons(tableId, column, direction) {
        document.querySelectorAll(`#panel-${tableId} th.sortable`).forEach(th => {
            const col = th.getAttribute('onclick')?.match(/sort\w+\('(\w+)'\)/)?.[1];
            const icon = th.querySelector('.sort-icon');
            if (icon) {
                if (col === column) {
                    icon.textContent = direction === 'asc' ? ' ▲' : ' ▼';
                } else {
                    icon.textContent = '';
                }
            }
        });
    }

    function getSortValue(item, column) {
        switch(column) {
            case 'company': return (item.company || '').toLowerCase();
            case 'ticker': return (item.ticker || '').toLowerCase();
            case 'category': return (item.category || '').toLowerCase();
            case 'pe': return parseFloat(item.pe) || 0;
            case 'pb': return parseFloat(item.pb) || 0;
            case 'roe': return parseFloat(item.roe) || 0;
            case 'de': return parseFloat(item.de) || 0;
            case 'score': 
                const scoreNum = parseInt((item.score || '0').split('/')[0]);
                return scoreNum;
            case 'risk': return (item.risk || '').toLowerCase();
            default: return '';
        }
    }

    function formatTime(date) {
        return date.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    // ============================================
    // API Functions
    // ============================================
    async function fetchAPI(endpoint) {
        const url = `${CONFIG.API_BASE}${endpoint}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            return null;
        }
    }

    async function fetchDashboardData(date) {
        return await fetchAPI(`/dashboard?date=${date}`);
    }

    async function fetchMarketStatus() {
        return await fetchAPI('/market-status');
    }

    async function fetchAvailableDates() {
        const data = await fetchAPI('/dates');
        return data?.dates || [];
    }

    // ============================================
    // Market Status
    // ============================================
    function updateMarketStatus(status) {
        state.marketStatus = status;
        const { isOpen } = status;
        
        elements.marketStatus.classList.remove('open', 'closed');
        elements.marketStatus.classList.add(isOpen ? 'open' : 'closed');
        
        const statusText = isOpen ? 'Market Open' : 'Market Closed';
        const nextText = isOpen 
            ? `Closes at ${status.nextClose || '3:30 PM'}`
            : `Opens ${status.nextOpen || '9:15 AM'}`;
        
        elements.marketStatus.querySelector('.status-text').textContent = `${statusText} · ${nextText}`;
    }

    // ============================================
    // Auto Refresh
    // ============================================
    function startAutoRefresh() {
        if (state.autoRefreshTimer) {
            clearInterval(state.autoRefreshTimer);
        }
        
        state.autoRefreshTimer = setInterval(() => {
            if (state.marketStatus.isOpen && !state.isRefreshing) {
                loadDashboard(state.currentDate);
            }
        }, CONFIG.REFRESH_INTERVAL);
    }

    function stopAutoRefresh() {
        if (state.autoRefreshTimer) {
            clearInterval(state.autoRefreshTimer);
            state.autoRefreshTimer = null;
        }
    }

    // ============================================
    // Render Functions - Summary Cards
    // ============================================
    function renderSummaryCards(data) {
        const portfolio = data?.portfolio;
        
        if (portfolio) {
            const totalValue = portfolio.total_value || portfolio.total_market_value || 0;
            const totalPnl = portfolio.total_pnl || 0;
            const totalPnlPct = portfolio.total_pnl_pct || 0;
            const margin = portfolio.available_margin || 0;
            const holdings = portfolio.holdings?.length || 0;
            
            elements.totalValue.textContent = formatCurrency(totalValue);
            elements.totalPnl.textContent = formatCurrency(totalPnl);
            elements.totalPnlPct.textContent = formatPercent(totalPnlPct);
            elements.availableMargin.textContent = formatCurrency(margin);
            elements.holdingsCount.textContent = holdings;
            
            // Update P&L card colors
            const pnlCard = elements.totalPnl.closest('.summary-card');
            pnlCard.classList.remove('positive', 'negative');
            pnlCard.classList.add(totalPnl >= 0 ? 'positive' : 'negative');
        }
    }

    function renderMosAlerts(data) {
        const portfolio = data?.portfolio;
        const alerts = (portfolio?.holdings || [])
            .filter(h => (h.mos_pct ?? h.margin_of_safety_pct ?? 0) >= 25)
            .map(h => ({
                symbol: h.symbol,
                currentPrice: h.current_price || h.last_price || 0,
                intrinsicValue: h.intrinsic_value_avg || h.intrinsic_value || 0,
                mos: h.mos_pct ?? h.margin_of_safety_pct ?? 0
            }))
            .sort((a, b) => b.mos - a.mos);

        if (elements.mosAlertCount) {
            elements.mosAlertCount.textContent = alerts.length;
        }

        if (!elements.mosAlertPanel) {
            return;
        }

        if (!alerts.length) {
            elements.mosAlertPanel.innerHTML = '<p class="empty-state">No MoS alerts available.</p>';
            return;
        }

        elements.mosAlertPanel.innerHTML = alerts.map(alert => `
            <article class="mos-alert-card">
                <div class="mos-alert-top">
                    <strong>${escapeHtml(alert.symbol)}</strong>
                    <span>${alert.mos.toFixed(1)}% MoS</span>
                </div>
                <div class="mos-alert-body">
                    <span>CMP: ₹${alert.currentPrice.toFixed(2)}</span>
                    <span>IV: ₹${alert.intrinsicValue.toFixed(0)}</span>
                </div>
            </article>
        `).join('');
    }

    // ============================================
    // Render Functions - Holdings Table
    // ============================================
    function renderHoldingsTable(data) {
        const portfolio = data?.portfolio;
        if (!portfolio?.holdings?.length) {
            elements.holdingsBody.innerHTML = '<tr><td colspan="10" class="empty-state">No holdings data available</td></tr>';
            return;
        }
        
        let holdings = [...portfolio.holdings];
        
        // Apply search filter
        const searchTerm = elements.holdingsSearch.value.toLowerCase();
        if (searchTerm) {
            holdings = holdings.filter(h => 
                (h.symbol || '').toLowerCase().includes(searchTerm) ||
                (h.company_name || '').toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply sorting
        const sortBy = elements.holdingsSort.value;
        holdings.sort((a, b) => {
            switch (sortBy) {
                case 'value': {
                    const valA = ((a.quantity||a.qty||a.t1_quantity||0) * (a.current_price||a.last_price||0));
                    const valB = ((b.quantity||b.qty||b.t1_quantity||0) * (b.current_price||b.last_price||0));
                    return valB - valA;
                }
                case 'pnl':
                    return (b.pnl || 0) - (a.pnl || 0);
                case 'symbol':
                    return (a.symbol || '').localeCompare(b.symbol || '');
                default:
                    return 0;
            }
        });
        
        // Build table rows
        const rows = holdings.map(h => {
            const pnl = h.pnl || 0;
            const pnlPct = h.pnl_pct || 0;
            const qty = h.quantity || h.qty || h.t1_quantity || 0;
            const price = h.current_price || h.last_price || 0;
            const currentValue = (qty || 0) * (price || 0);
            const pnlClass = pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
            const statusClass = pnlPct > 20 ? 'profit' : (pnlPct < -15 ? 'loss' : 'hold');
            const statusLabel = pnlPct > 20 ? 'PROFIT' : (pnlPct < -15 ? 'CRITICAL' : 'HOLD');
            const mosValue = (h.mos_pct !== undefined && h.mos_pct !== null) ? h.mos_pct : '--';
            const mosDisplay = (typeof mosValue === 'number') ? ((mosValue >= 0 ? '+' : '') + mosValue.toFixed(1) + '%') : '--';
            const ivValue = (h.intrinsic_value_avg !== undefined && h.intrinsic_value_avg !== null && h.intrinsic_value_avg > 0) ? h.intrinsic_value_avg : null;
            const ivDisplay = ivValue ? '₹' + ivValue.toFixed(0) : '--';
            
            return `
                <tr>
                    <td class="symbol-cell">${escapeHtml(h.symbol)}</td>
                    <td>${escapeHtml(h.company_name || h.exchange)}</td>
                    <td class="text-right">${qty > 0 ? qty : (h.t1_quantity ? h.t1_quantity + ' (T+1)' : 0)}</td>
                    <td class="text-right price-cell">₹${(h.average_price || h.avg_price || 0).toFixed(2)}</td>
                    <td class="text-right price-cell">₹${price.toFixed(2)}</td>
                    <td class="text-right price-cell">${ivDisplay}</td>
                    <td class="text-right price-cell">${currentValue > 0 ? formatCurrency(currentValue) : '--'}</td>
                    <td class="text-right ${pnlClass}">${pnl !== 0 ? formatCurrency(pnl) : '--'}</td>
                    <td class="text-right ${pnlClass}">${formatPercent(pnlPct)}</td>
                    <td class="text-right">${mosDisplay}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                </tr>
            `;
        }).join('');
        
        elements.holdingsBody.innerHTML = rows;
    }

    // ============================================
    // Render Functions - Deep Discounts
    // ============================================
    function renderDeepDiscounts(data) {
        const valuescreen = data?.valuescreen;
        
        // Get deep discounts from holdings_analysis
        let discounts = [];
        if (valuescreen?.holdings_analysis) {
            discounts = valuescreen.holdings_analysis.filter(h => {
                const mos = h.mos_pct ?? 0;
                return mos > 25;
            });
        }
        
        // Fallback to deep_discount_stocks
        if (!discounts.length && valuescreen?.deep_discount_stocks) {
            discounts = Array.isArray(valuescreen.deep_discount_stocks) ? valuescreen.deep_discount_stocks : [];
        }
        
        // Also check stocks array
        if (!discounts.length && valuescreen?.stocks) {
            discounts = valuescreen.stocks.filter(s => {
                const mos = s.mos_pct ?? s.margin_of_safety_pct ?? 0;
                return mos > 25;
            });
        }
        
        elements.discountCount.textContent = discounts.length;
        
        if (!discounts.length) {
            elements.discountsGrid.innerHTML = '<p class="empty-state">No deep discount stocks found (MoS > 25%)</p>';
            return;
        }
        
        const cards = discounts.map(s => {
            const mos = s.mos_pct ?? s.margin_of_safety_pct ?? 0;
            const price = s.current_price || s.last_price || 0;
            const iv = s.intrinsic_value_avg ?? s.intrinsic_value ?? 0;
            const action = s.action_signal || s.action || 'ACCUMULATE';
            
            return `
                <article class="discount-card">
                    <div class="discount-header">
                        <span class="discount-symbol">${escapeHtml(s.symbol)}</span>
                        <span class="discount-mos">${mos.toFixed(1)}% MoS</span>
                    </div>
                    <div class="discount-prices">
                        <div class="discount-price">
                            <span class="discount-price-label">CMP</span>
                            <span class="discount-price-value">₹${price.toFixed(2)}</span>
                        </div>
                        <div class="discount-price">
                            <span class="discount-price-label">Intrinsic</span>
                            <span class="discount-price-value">₹${iv.toFixed(0)}</span>
                        </div>
                    </div>
                    <div class="discount-action">${action}</div>
                </article>
            `;
        }).join('');
        
        elements.discountsGrid.innerHTML = cards;
    }

    // ============================================
    // Render Functions - GTT Status
    // ============================================
    function renderGTTStatus(data) {
        const gtt = data?.gtt;
        
        // Handle both array of objects and array of strings
        let unprotectedList = gtt?.unprotected_holdings || [];
        let protectedList = gtt?.protected_holdings || [];
        
        // Normalize to array of symbols
        if (protectedList.length > 0 && typeof protectedList[0] === 'object') {
            protectedList = protectedList.map(h => h.symbol);
        }
        if (unprotectedList.length > 0 && typeof unprotectedList[0] === 'object') {
            unprotectedList = unprotectedList.map(h => h.symbol);
        }
        
        // Also get holdings needing GTT from the recommendations
        const holdingsNeedingGtt = gtt?.holdings_needing_gtt || [];
        
        // Calculate effective counts (active GTTs + recommended GTTs)
        const needsStopLoss = holdingsNeedingGtt.filter(h => h.recommended_action?.includes('STOP-LOSS')).map(h => h.symbol);
        const needsTarget = holdingsNeedingGtt.filter(h => h.recommended_action?.includes('TARGET')).map(h => h.symbol);
        
        // Protected = active GTTs + holdings with recommendations
        const effectiveProtected = [...new Set([...protectedList, ...needsStopLoss, ...needsTarget])];
        const effectiveUnprotected = unprotectedList.filter(s => !effectiveProtected.includes(s));
        
        elements.protectedCount.textContent = effectiveProtected.length;
        elements.unprotectedCount.textContent = effectiveUnprotected.length;
        
        if (!effectiveProtected.length && !effectiveUnprotected.length) {
            elements.gttList.innerHTML = '<p class="empty-state">No GTT data available</p>';
            return;
        }
        
        const items = [];
        
        // Add protected holdings (with active GTTs or recommendations)
        effectiveProtected.forEach(symbol => {
            let statusLabel = 'Protected';
            let statusClass = 'protected';
            
            // Check if it needs a GTT recommendation
            const holding = holdingsNeedingGtt.find(h => h.symbol === symbol);
            if (holding?.recommended_action) {
                if (holding.recommended_action.includes('STOP-LOSS')) {
                    statusLabel = 'Stop-Loss';
                    statusClass = 'recommended';
                } else if (holding.recommended_action.includes('TARGET')) {
                    statusLabel = 'Target';
                    statusClass = 'recommended';
                } else if (holding.recommended_action.includes('NO GTT')) {
                    statusLabel = 'N/A (ETF)';
                    statusClass = 'na';
                } else {
                    statusLabel = 'Protected';
                }
            }
            
            items.push(`
                <div class="gtt-item">
                    <span class="symbol">${escapeHtml(symbol)}</span>
                    <span class="status ${statusClass}">${statusLabel}</span>
                </div>
            `);
        });
        
        // Add unprotected holdings
        effectiveUnprotected.forEach(symbol => {
            items.push(`
                <div class="gtt-item unprotected">
                    <span class="symbol">${escapeHtml(symbol)}</span>
                    <span class="status unprotected">Unprotected</span>
                </div>
            `);
        });
        
        // Add section for GTT recommendations if any
        if (holdingsNeedingGtt.length > 0) {
            const recommendations = holdingsNeedingGtt.filter(h => h.recommended_action && !h.recommended_action.includes('NO GTT') && !h.recommended_action.includes('HOLD'));
            if (recommendations.length > 0) {
                items.push(`<div class="gtt-section-title">Recommendations</div>`);
                recommendations.forEach(h => {
                    items.push(`
                        <div class="gtt-item recommendation">
                            <span class="symbol">${escapeHtml(h.symbol)}</span>
                            <span class="recommendation-text">${escapeHtml(h.recommended_action)} @ ${h.trigger_price ? '₹'+h.trigger_price.toFixed(2) : 'N/A'}</span>
                        </div>
                    `);
                });
            }
        }
        
        elements.gttList.innerHTML = items.join('');
    }

    // ============================================
    // Render Functions - Opportunities
    // ============================================
    function renderOpportunities(data) {
        const opp = data?.opportunities;
        
        let opportunities = [];
        
        if (opp?.horizons) {
            // New format
            const horizons = opp.horizons;
            if (horizons.short_term?.opportunities) {
                horizons.short_term.opportunities.forEach(o => {
                    opportunities.push({ ...o, horizon: 'short' });
                });
            }
            if (horizons.medium_term?.opportunities) {
                horizons.medium_term.opportunities.forEach(o => {
                    opportunities.push({ ...o, horizon: 'medium' });
                });
            }
            if (horizons.long_term?.opportunities) {
                horizons.long_term.opportunities.forEach(o => {
                    opportunities.push({ ...o, horizon: 'long' });
                });
            }
        } else if (opp?.opportunities) {
            // Old format
            opportunities = Array.isArray(opp.opportunities) ? opp.opportunities : [];
        }
        
        // Apply horizon filter
        if (state.activeHorizon !== 'all') {
            opportunities = opportunities.filter(o => 
                (o.horizon || o.horizons || '').toLowerCase().startsWith(state.activeHorizon)
            );
        }
        
        if (!opportunities.length) {
            elements.opportunitiesGrid.innerHTML = '<p class="empty-state">No investment opportunities found</p>';
            return;
        }
        
        const cards = opportunities.map(o => {
            const change = o.change_pct || 0;
            const changeClass = change >= 0 ? 'positive' : 'negative';
            const horizonLabel = (o.horizon || 'SHORT').toUpperCase();
            
            return `
                <article class="opportunity-card">
                    <div class="opp-header">
                        <span class="opp-symbol">${escapeHtml(o.symbol)}</span>
                        <span class="opp-horizon">${horizonLabel}</span>
                    </div>
                    <div class="opp-sector">${escapeHtml(o.sector || o.company_name || '')}</div>
                    <div class="opp-change ${changeClass}">${formatPercent(change)}</div>
                    <div class="opp-recommendation">${escapeHtml(o.recommendation || o.pattern || 'WATCH')}</div>
                </article>
            `;
        }).join('');
        
        elements.opportunitiesGrid.innerHTML = cards;
    }

    // ============================================
    // Render Functions - Commodities
    // ============================================
    function renderCommodities(data) {
        const commoditiesData = data?.commodities;
        const commodities = commoditiesData?.commodities || (Array.isArray(commoditiesData) ? commoditiesData : []);
        
        if (!commodities?.length) {
            elements.commoditiesGrid.innerHTML = '<p class="empty-state">No commodity data available</p>';
            return;
        }
        
        const cards = commodities.map(c => {
            const change = c.change_percent || c.change_pct || 0;
            const changeClass = change >= 0 ? 'positive' : 'negative';
            const trend = (c.trend || '').toLowerCase();
            
            // Handle null prices - show "N/A" instead of 0
            const price = c.price || c.current_price;
            const priceDisplay = price != null ? `₹${price.toLocaleString('en-IN')}` : 'N/A';
            const changeDisplay = c.current_price != null ? formatPercent(change) : '--';
            
            return `
                <article class="commodity-card">
                    <div class="commodity-name">${escapeHtml(c.symbol || c.commodity)}</div>
                    <div class="commodity-price">${priceDisplay}</div>
                    <div class="commodity-change ${c.current_price != null ? changeClass : 'text-muted'}">${changeDisplay}</div>
                    <span class="commodity-trend ${trend}">${escapeHtml(c.trend || c.action || 'HOLD')}</span>
                </article>
            `;
        }).join('');
        
        elements.commoditiesGrid.innerHTML = cards;
    }

    // ============================================
    // Render Functions - Deep Value
    // ============================================
    function renderDeepValueScreener() {
        if (!state.deepValueData || !state.deepValueData.length) {
            elements.deepValueBody.innerHTML = '<tr><td colspan="9" class="empty-state">No deep value data available</td></tr>';
            return;
        }

        let data = [...state.deepValueData];

        // Apply sector filter
        const sector = elements.deepValueSector.value;
        if (sector !== 'all') {
            data = data.filter(d => d.category === sector);
        }

        // Apply search filter
        const searchTerm = elements.deepValueSearch.value.toLowerCase();
        if (searchTerm) {
            data = data.filter(d => 
                (d.company || '').toLowerCase().includes(searchTerm) ||
                (d.ticker || '').toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        const { column, direction } = state.deepValueSort;
        if (column) {
            data.sort((a, b) => {
                const valA = getSortValue(a, column);
                const valB = getSortValue(b, column);
                if (typeof valA === 'string') {
                    return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                return direction === 'asc' ? valA - valB : valB - valA;
            });
        }

        // Build table rows
        const rows = data.map(d => {
            const riskClass = (d.risk || '').toLowerCase();
            let scoreClass = 'text-muted';
            if (d.score) {
                const numScore = parseInt(d.score.split('/')[0]);
                if (numScore >= 8) scoreClass = 'pnl-positive';
                else if (numScore >= 6) scoreClass = 'text-warning';
            }

            const ticker = d.ticker || '';
            const tradingviewUrl = `https://in.tradingview.com/?symbol=NSE:${ticker}`;
            const screenerUrl = `https://www.screener.in/company/${ticker}/`;

            return `
                <tr>
                    <td><a href="${screenerUrl}" target="_blank" class="dv-link" title="View on Screener.in">${escapeHtml(d.company)}</a></td>
                    <td class="symbol-cell"><a href="${tradingviewUrl}" target="_blank" class="dv-link" title="View on TradingView">${escapeHtml(d.ticker)}</a></td>
                    <td><span class="badge badge-outline">${escapeHtml(d.category)}</span></td>
                    <td class="text-right">${(d.pe || 0).toFixed(1)}</td>
                    <td class="text-right">${(d.pb || 0).toFixed(2)}</td>
                    <td class="text-right">${(d.roe || 0).toFixed(1)}%</td>
                    <td class="text-right">${(d.de || 0).toFixed(2)}</td>
                    <td class="text-right ${scoreClass}">${escapeHtml(d.score)}</td>
                    <td><span class="status-badge risk-${riskClass}">${escapeHtml(d.risk)}</span></td>
                </tr>
            `;
        }).join('');
        
        elements.deepValueBody.innerHTML = rows;
    }

    function populateDeepValueSectors() {
        if (!state.deepValueData) return;
        const sectors = new Set(state.deepValueData.map(d => d.category));
        
        const currentValue = elements.deepValueSector.value;
        elements.deepValueSector.innerHTML = '<option value="all">All Sectors</option>';
        
        Array.from(sectors).sort().forEach(sector => {
            const option = document.createElement('option');
            option.value = sector;
            option.textContent = sector;
            if (sector === currentValue) option.selected = true;
            elements.deepValueSector.appendChild(option);
        });
    }

    // ============================================
    // Main Render Function
    // ============================================
    function renderDashboard(data) {
        console.log("Rendering dashboard with data:", data); // Debug log
        const dbg = document.getElementById('debug-log');
        if (dbg) {
            dbg.innerHTML = "Dashboard Data Keys: " + Object.keys(data).join(", ");
            if (data.portfolio) {
                dbg.innerHTML += "<br>Portfolio Holdings: " + (data.portfolio.holdings?.length || 0);
            }
        }
        
        state.dashboardData = data;
        
        try { renderSummaryCards(data); } catch(e) { console.error('Error rendering summary cards:', e); if(dbg) dbg.innerHTML += "<br>Error: " + e; }
        try { renderMosAlerts(data); } catch(e) { console.error('Error rendering MoS alerts:', e); if(dbg) dbg.innerHTML += "<br>Error: " + e; }
        try { renderRiskTracker(data); } catch(e) { console.error('Error rendering risk tracker:', e); if(dbg) dbg.innerHTML += "<br>Error: " + e; }
        try { renderConcentrationView(data); } catch(e) { console.error('Error rendering concentration view:', e); if(dbg) dbg.innerHTML += "<br>Error: " + e; }
        try { renderDividendCalendar(); } catch(e) { console.error('Error rendering dividend calendar:', e); if(dbg) dbg.innerHTML += "<br>Error: " + e; }
        try { renderHoldingsTable(data); } catch(e) { console.error('Error rendering holdings table:', e); if(dbg) dbg.innerHTML += "<br>Error: " + e; }
        try { renderDeepDiscounts(data); } catch(e) { console.error('Error rendering deep discounts:', e); if(dbg) dbg.innerHTML += "<br>Error: " + e; }
        try { renderGTTStatus(data); } catch(e) { console.error('Error rendering GTT status:', e); if(dbg) dbg.innerHTML += "<br>Error: " + e; }
        try { renderOpportunities(data); } catch(e) { console.error('Error rendering opportunities:', e); if(dbg) dbg.innerHTML += "<br>Error: " + e; }
        try { renderCommodities(data); } catch(e) { console.error('Error rendering commodities:', e); if(dbg) dbg.innerHTML += "<br>Error: " + e; }
        
        if (state.deepValueData) {
            try { populateDeepValueSectors(); } catch(e) { console.error('Error populating deep value sectors:', e); }
            try { renderDeepValueScreener(); } catch(e) { console.error('Error rendering deep value:', e); }
        }

        // Update last updated time
        try { elements.lastUpdated.querySelector('time').textContent = formatTime(new Date()); } catch(e) { console.error('Error updating time:', e); }
    }

    async function fetchDeepValueData() {
        return await fetchAPI('/deep-value');
    }

    // ============================================
    // Data Loading
    // ============================================
    async function loadDashboard(date) {
        if (state.isRefreshing) return;
        
        state.isRefreshing = true;
        
        try {
            const [dashboardData, marketStatus, availableDates, deepValueData] = await Promise.all([
                fetchDashboardData(date),
                fetchMarketStatus(),
                fetchAvailableDates(),
                fetchDeepValueData()
            ]);
            
            state.availableDates = availableDates;
            state.deepValueData = deepValueData;
            
            // Update date picker options
            updateDatePicker(availableDates);
            
            // Update market status
            updateMarketStatus(marketStatus);
            
            // Render dashboard
            if (dashboardData) {
                renderDashboard(dashboardData);
            } else {
                showError('No data available for selected date');
            }
            
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            showError('Failed to load portfolio data');
        } finally {
            state.isRefreshing = false;
            hideLoading();
        }
    }

    function updateDatePicker(dates) {
        const currentValue = elements.reportDate.value;
        
        // Clear existing options except current
        elements.reportDate.innerHTML = '';
        
        dates.forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = date;
            if (date === currentValue) option.selected = true;
            elements.reportDate.appendChild(option);
        });
        
        // Set current date if not in list
        if (!dates.includes(currentValue) && dates.length > 0) {
            elements.reportDate.value = dates[0];
            state.currentDate = dates[0];
        }
    }

    // ============================================
    // UI State Functions
    // ============================================
    function showLoading() {
        elements.loadingOverlay.classList.add('active');
    }

    function hideLoading() {
        elements.loadingOverlay.classList.remove('active');
    }

    function showError(message) {
        console.error(message);
        // Could add a toast notification here
    }

    // ============================================
    // Tab Navigation
    // ============================================
    function switchTab(tabName) {
        state.activeTab = tabName;
        
        // Update tab buttons
        elements.tabs.forEach(tab => {
            const isActive = tab.dataset.tab === tabName;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
        });
        
        // Update tab panels
        elements.tabPanels.forEach(panel => {
            const isActive = panel.id === `panel-${tabName}`;
            panel.classList.toggle('active', isActive);
            panel.hidden = !isActive;
        });
    }

    // ============================================
    // Event Listeners
    // ============================================
    function attachEventListeners() {
        // Date picker change
        elements.reportDate.addEventListener('change', (e) => {
            state.currentDate = e.target.value;
            showLoading();
            loadDashboard(state.currentDate);
        });
        
        // Refresh button
        elements.refreshBtn.addEventListener('click', async () => {
            showLoading();
            
            // Try quick refresh first
            try {
                await fetch('/api/quick-refresh', { method: 'POST' });
            } catch (e) {
                console.warn('Quick refresh failed:', e.message);
            }
            
            await loadDashboard(state.currentDate);
            await checkDataFreshness();
        });
        
        // Tab navigation
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                switchTab(tab.dataset.tab);
            });
        });
        
        // Holdings search
        elements.holdingsSearch.addEventListener('input', () => {
            if (state.dashboardData) {
                renderHoldingsTable(state.dashboardData);
            }
        });
        
        // Holdings sort
        elements.holdingsSort.addEventListener('change', () => {
            if (state.dashboardData) {
                renderHoldingsTable(state.dashboardData);
            }
        });
        
        // Horizon filters
        elements.horizonFilters.forEach(btn => {
            btn.addEventListener('click', () => {
                state.activeHorizon = btn.dataset.horizon;
                
                elements.horizonFilters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (state.dashboardData) {
                    renderOpportunities(state.dashboardData);
                }
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+R or F5 to refresh
            if ((e.ctrlKey || e.key === 'F5') && !e.shiftKey) {
                e.preventDefault();
                showLoading();
                loadDashboard(state.currentDate);
            }
        });

        // Mask toggle
        if (elements.maskToggleBtn) {
            elements.maskToggleBtn.addEventListener('click', () => {
                state.isMasked = !state.isMasked;
                elements.maskIcon.textContent = state.isMasked ? '👁️‍🗨️' : '👁️';
                if (state.dashboardData) {
                    renderSummaryCards(state.dashboardData);
                    renderHoldingsTable(state.dashboardData);
                }
            });
        }

        // Deep Value
        if (elements.deepValueSearch) {
            elements.deepValueSearch.addEventListener('input', () => {
                renderDeepValueScreener();
            });
        }
        if (elements.deepValueSector) {
            elements.deepValueSector.addEventListener('change', () => {
                renderDeepValueScreener();
            });
        }
    }

    // ============================================
    // Initialization
    // ============================================
    async function init() {
        showLoading();
        attachEventListeners();
        
        // Fetch available dates first
        const availableDates = await fetchAvailableDates();
        state.availableDates = availableDates;
        
        console.log("Available dates:", availableDates); // Debug log
        
        if (availableDates.length > 0) {
            state.currentDate = availableDates[0];
            elements.reportDate.value = availableDates[0]; // Set UI value
        }
        
        console.log("Loading dashboard for date:", state.currentDate); // Debug log
        
        // Load initial data
        await loadDashboard(state.currentDate);
        
        // Check data freshness and show warnings
        await checkDataFreshness();
        
        // Start auto-refresh
        startAutoRefresh();
        
        // Initialize live refresh features
        initLiveRefresh();
        
        console.log('KiteMCP Dashboard initialized');
    }

    // ============================================
    // Data Freshness Check
    // ============================================
    async function checkDataFreshness() {
        try {
            const response = await fetch('/api/data-status');
            if (!response.ok) return;
            
            const status = await response.json();
            
            // Show stale warning if needed
            if (status.isStale || !status.isToday) {
                showStaleDataWarning(status);
            }
            
            // Update last refresh indicator
            updateLastRefreshIndicator(status);
            
            // Show recommendation if market is open and data is stale
            if (status.isMarketOpen && status.isStale) {
                showRefreshRecommendation(status);
            }
            
        } catch (e) {
            console.warn('Could not check data freshness:', e.message);
        }
    }

    function showStaleDataWarning(status) {
        const banner = document.getElementById('staleWarning');
        if (!banner) return;
        
        banner.style.display = 'flex';
        
        const messageEl = banner.querySelector('.stale-message');
        const actionEl = banner.querySelector('.stale-action');
        
        if (messageEl) {
            if (!status.isToday) {
                messageEl.textContent = `⚠️ Showing ${status.dataDate} data. Today is ${status.currentDate}.`;
            } else if (status.freshness === 'stale') {
                messageEl.textContent = `⚠️ Data is outdated. Last refresh: ${status.lastRefreshed || 'unknown'}`;
            }
        }
        
        if (actionEl) {
            actionEl.textContent = 'Click "🔄 Refresh with AI" for live prices →';
        }
    }

    function updateLastRefreshIndicator(status) {
        const indicator = document.getElementById('liveIndicator');
        if (!indicator) return;
        
        if (status.lastRefreshed) {
            const time = new Date(status.lastRefreshed).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            indicator.textContent = `Live: ${time}`;
            indicator.style.color = status.freshness === 'current' ? '#22c55e' : '#f59e0b';
        } else if (!status.isToday) {
            indicator.textContent = 'Historical';
            indicator.style.color = '#6b7280';
        }
    }

    function showRefreshRecommendation(status) {
        // Could show a toast notification here
        console.log('💡 Market is open. Consider refreshing for live prices.');
    }

    function initLiveRefresh() {
        // Mark as refreshed after successful load
        localStorage.setItem('kitemcp_last_refresh', new Date().toISOString());
        
        // Attach AI refresh button handler
        const refreshAIBtn = document.getElementById('refreshAIBtn');
        if (refreshAIBtn) {
            refreshAIBtn.addEventListener('click', showAIRefreshModal);
        }
    }

    function showAIRefreshModal() {
        // Create or show modal
        let modal = document.getElementById('refreshModal');
        
        if (!modal) {
            modal = createRefreshModal();
        }
        
        modal.style.display = 'flex';
    }

    function createRefreshModal() {
        const modal = document.createElement('div');
        modal.id = 'refreshModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔄 Refresh Live Prices</h3>
                    <button class="modal-close" onclick="document.getElementById('refreshModal').style.display='none'">&times;</button>
                </div>
                <div class="modal-body">
                    <p>To get <strong>live prices</strong>, run this command in terminal:</p>
                    <div class="prompt-box">
                        <code>npm run refresh</code>
                        <button class="copy-btn" onclick="navigator.clipboard.writeText('npm run refresh')">📋 Copy</button>
                    </div>
                    <p style="margin-top: 16px;"><strong>Or follow these steps:</strong></p>
                    <ol style="text-align: left; margin-left: 20px;">
                        <li>Open a new terminal in this project folder</li>
                        <li>Run: <code>npm run refresh</code></li>
                        <li>Copy the AI prompt shown</li>
                        <li>Paste it into OpenCode/Antigravity</li>
                        <li>Let AI fetch live prices</li>
                        <li>Return here and click <strong>Refresh Dashboard</strong></li>
                    </ol>
                    <p style="margin-top: 16px; color: #6b7280;">
                        <em>Note: Live prices require AI agent because KiteMCP uses OAuth sessions that can't be called directly from the browser.</em>
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('refreshModal').style.display='none'">Cancel</button>
                    <button class="btn btn-primary" onclick="window.refreshDashboardFromModal()">🔄 Refresh Dashboard</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Expose refresh function globally
        window.refreshDashboardFromModal = function() {
            modal.style.display = 'none';
            location.reload();
        };
        
        return modal;
    }

    // Expose for live-refresh.js integration
    window.refreshDashboardData = async function() {
        await loadDashboard(state.currentDate);
        await checkDataFreshness();
    };

    // Expose sorting function globally for onclick handlers
    window.sortDeepValue = sortDeepValue;

    // Start the application
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
