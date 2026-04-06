/**
 * live-refresh.js
 * Frontend logic for AI agent live refresh with stale data detection
 * 
 * Features:
 * - Detects stale data (historical dates vs today)
 * - Shows warning banner when data is old
 * - "Refresh with AI" button opens the AI refresh prompt
 * - Shows last refreshed time
 * - Auto-check for stale data during market hours
 */

(function() {
    'use strict';

    const STALE_THRESHOLD_MINUTES = 5; // Warn if data is older than this during market hours
    const AUTO_CHECK_INTERVAL = 60000; // Check every minute

    /**
     * Check if market is currently open
     */
    function isMarketHours() {
        const now = new Date();
        const istHour = (now.getUTCHours() + 5.5) % 24;
        const istMinute = now.getUTCMinutes() + 30;
        const istTotalMinutes = istHour * 60 + istMinute;
        
        const marketOpen = 9 * 60 + 15;  // 9:15 AM IST
        const marketClose = 15 * 60 + 30; // 3:30 PM IST
        const isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6;
        
        return istTotalMinutes >= marketOpen && istTotalMinutes <= marketClose && !isWeekend;
    }

    /**
     * Get today's date in YYYY-MM-DD format
     */
    function getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Format time for display
     */
    function formatTime(date) {
        if (!date) return '--:--';
        const d = new Date(date);
        return d.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    /**
     * Get last refreshed time from localStorage
     */
    function getLastRefreshedTime() {
        const saved = localStorage.getItem('kitemcp_last_refresh');
        return saved ? new Date(saved) : null;
    }

    /**
     * Set last refreshed time in localStorage
     */
    function setLastRefreshedTime() {
        localStorage.setItem('kitemcp_last_refresh', new Date().toISOString());
    }

    /**
     * Update the "Last refreshed" display in the UI
     */
    function updateLastRefreshedDisplay() {
        const lastRefreshed = getLastRefreshedTime();
        const indicator = document.getElementById('liveIndicator');
        const timeDisplay = document.getElementById('lastRefreshTime');
        
        if (indicator) {
            if (lastRefreshed) {
                indicator.textContent = `Live: ${formatTime(lastRefreshed)}`;
                indicator.style.color = '#22c55e'; // Green
            } else {
                indicator.textContent = 'Stale';
                indicator.style.color = '#ef4444'; // Red
            }
        }
        
        if (timeDisplay) {
            timeDisplay.textContent = lastRefreshed ? formatTime(lastRefreshed) : 'Never';
        }
    }

    /**
     * Fetch data status from API
     */
    async function fetchDataStatus() {
        try {
            const response = await fetch('/api/data-status');
            if (!response.ok) throw new Error('Failed to fetch data status');
            return await response.json();
        } catch (e) {
            console.warn('Could not fetch data status:', e.message);
            return null;
        }
    }

    /**
     * Show stale data warning banner
     */
    function showStaleWarning(dataStatus) {
        const banner = document.getElementById('staleWarning');
        if (!banner) return;
        
        const today = getTodayDate();
        const dataDate = dataStatus?.dataDate;
        const isMarket = isMarketHours();
        
        if (dataStatus?.isStale || dataDate !== today) {
            banner.style.display = 'flex';
            
            const messageEl = banner.querySelector('.stale-message');
            const actionEl = banner.querySelector('.stale-action');
            
            if (messageEl) {
                if (dataDate) {
                    messageEl.textContent = `⚠️ Showing ${dataDate} data. Today is ${today}.`;
                } else {
                    messageEl.textContent = '⚠️ Data may be outdated.';
                }
            }
            
            if (actionEl && isMarket) {
                actionEl.textContent = 'Click "Refresh with AI" for live prices →';
            } else if (actionEl) {
                actionEl.textContent = 'Market closed. Refresh tomorrow.';
            }
        } else {
            // Data is current
            const lastRefreshed = getLastRefreshedTime();
            if (lastRefreshed) {
                const minutesAgo = (Date.now() - lastRefreshed.getTime()) / 60000;
                
                if (isMarket && minutesAgo > STALE_THRESHOLD_MINUTES) {
                    banner.style.display = 'flex';
                    const messageEl = banner.querySelector('.stale-message');
                    const actionEl = banner.querySelector('.stale-action');
                    
                    if (messageEl) {
                        messageEl.textContent = `⚠️ Data is ${Math.round(minutesAgo)} min old.`;
                    }
                    if (actionEl) {
                        actionEl.textContent = 'Click "Refresh with AI" for live prices →';
                    }
                } else {
                    banner.style.display = 'none';
                }
            } else {
                // No refresh time recorded - show gentle reminder
                if (isMarket) {
                    banner.style.display = 'flex';
                    const messageEl = banner.querySelector('.stale-message');
                    const actionEl = banner.querySelector('.stale-action');
                    
                    if (messageEl) {
                        messageEl.textContent = '💡 Run AI agent refresh for live prices.';
                    }
                    if (actionEl) {
                        actionEl.textContent = 'Click "Refresh with AI" →';
                    }
                } else {
                    banner.style.display = 'none';
                }
            }
        }
    }

    /**
     * Show the refresh prompt modal
     */
    function showRefreshModal() {
        const modal = document.getElementById('refreshModal');
        if (!modal) {
            // Create modal if it doesn't exist
            createRefreshModal();
            return;
        }
        modal.style.display = 'flex';
    }

    /**
     * Create the refresh prompt modal
     */
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
                    <p>To refresh live prices, copy the prompt below and paste it into <strong>OpenCode</strong>:</p>
                    <div class="prompt-box">
                        <pre id="refreshPrompt"></pre>
                        <button class="copy-btn" onclick="copyRefreshPrompt()">📋 Copy</button>
                    </div>
                    <div class="modal-steps">
                        <p><strong>Steps:</strong></p>
                        <ol>
                            <li>Open OpenCode in this project folder</li>
                            <li>Paste the copied prompt</li>
                            <li>Let AI agent fetch live prices</li>
                            <li>Return here and click "Refresh Dashboard"</li>
                        </ol>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('refreshModal').style.display='none'">Cancel</button>
                    <button class="btn btn-primary" onclick="refreshDashboard()">🔄 Refresh Dashboard</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Load and set the prompt
        loadRefreshPrompt();
    }

    /**
     * Load refresh prompt from file
     */
    async function loadRefreshPrompt() {
        try {
            const response = await fetch('/prompts/live_refresh.txt');
            if (response.ok) {
                const text = await response.text();
                const today = getTodayDate();
                const prompt = text.replace(/YYYY-MM-DD/g, today);
                document.getElementById('refreshPrompt').textContent = prompt;
            }
        } catch (e) {
            console.warn('Could not load refresh prompt:', e.message);
            document.getElementById('refreshPrompt').textContent = 
                'Error loading prompt. Please copy from terminal: npm run refresh';
        }
    }

    /**
     * Copy refresh prompt to clipboard
     */
    window.copyRefreshPrompt = function() {
        const prompt = document.getElementById('refreshPrompt').textContent;
        navigator.clipboard.writeText(prompt).then(() => {
            const btn = document.querySelector('.copy-btn');
            if (btn) {
                btn.textContent = '✅ Copied!';
                setTimeout(() => {
                    btn.textContent = '📋 Copy';
                }, 2000);
            }
        }).catch(e => {
            console.error('Failed to copy:', e);
        });
    };

    /**
     * Refresh the dashboard
     */
    window.refreshDashboard = function() {
        const modal = document.getElementById('refreshModal');
        if (modal) modal.style.display = 'none';
        
        // Mark as refreshed
        setLastRefreshedTime();
        updateLastRefreshedDisplay();
        
        // Trigger dashboard refresh (if using the main app)
        if (window.refreshDashboardData) {
            window.refreshDashboardData();
        } else {
            // Fallback: reload the page
            location.reload();
        }
    };

    /**
     * Initialize the live refresh functionality
     */
    function init() {
        // Update last refreshed display
        updateLastRefreshedDisplay();
        
        // Attach "Refresh with AI" button handler
        const refreshAIBtn = document.getElementById('refreshAIBtn');
        if (refreshAIBtn) {
            refreshAIBtn.addEventListener('click', showRefreshModal);
        }
        
        // Check data status and show warning
        fetchDataStatus().then(dataStatus => {
            showStaleWarning(dataStatus);
        });
        
        // Auto-check every minute during market hours
        setInterval(() => {
            if (isMarketHours()) {
                fetchDataStatus().then(showStaleWarning);
                updateLastRefreshedDisplay();
            }
        }, AUTO_CHECK_INTERVAL);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for external access
    window.liveRefresh = {
        refresh: showRefreshModal,
        updateTime: updateLastRefreshedDisplay,
        markRefreshed: setLastRefreshedTime
    };

})();
