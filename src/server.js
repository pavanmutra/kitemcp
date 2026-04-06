/**
 * KiteMCP Portfolio Dashboard Server
 * Express.js web server for the portfolio dashboard
 */

const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const apiRoutes = require('./routes/api');

function openBrowser(url) {
    const cmd = process.platform === 'win32' ? `start ${url}` :
                process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
    exec(cmd, (err) => {
        if (err) console.warn('Could not auto-open browser:', err.message);
    });
}

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers for local development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', apiRoutes);

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 KiteMCP Dashboard running at http://localhost:${PORT}`);
    console.log(`   Press Ctrl+C to stop the server\n`);
    openBrowser(`http://localhost:${PORT}`);
});

module.exports = app;
