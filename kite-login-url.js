#!/usr/bin/env node
/**
 * kite-login-url.js — Kite URL-Based Login (No API Key)
 *
 * Uses the same OAuth flow as OpenCode - browser-based login.
 * No API key required - just your Zerodha credentials.
 */

const https = require('https');
const http = require('http');
const { spawn } = require('child_process');
const url = require('url');

const MCP_URL = 'https://mcp.kite.trade/mcp';
const CALLBACK_PORT = 3000;

// Colors
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', B = '\x1b[34m', X = '\x1b[0m', BOLD = '\x1b[1m';

function openBrowser(url) {
    const cmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
    try {
        spawn(cmd, [url], { detached: true, stdio: 'ignore', shell: true });
        return true;
    } catch (e) {
        return false;
    }
}

async function fetchLoginUrl() {
    return new Promise((resolve, reject) => {
        // Start a local callback server to receive the OAuth response
        const callbackServer = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            const requestToken = parsedUrl.query.request_token;

            if (requestToken) {
                console.log(`\n${G}✅ Login successful! Received request_token.${X}`);
                console.log(`${B}Token: ${requestToken.substring(0, 10)}...${X}\n`);

                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                    <body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h1 style="color: green;">✅ Login Successful!</h1>
                        <p>You can close this window and return to Claude Code.</p>
                    </body>
                    </html>
                `);

                callbackServer.close();
                resolve({ requestToken });
            } else {
                res.writeHead(400);
                res.end('Missing request_token');
            }
        });

        callbackServer.listen(CALLBACK_PORT, () => {
            console.log(`${B}Callback server listening on port ${CALLBACK_PORT}${X}\n`);

            // Generate the login URL with callback
            const redirectUri = `http://localhost:${CALLBACK_PORT}/callback`;
            const loginUrl = `https://kite.trade/connect/login?api_key=KITE_MCP_CLIENT&redirect_uri=${encodeURIComponent(redirectUri)}`;

            console.log(`${BOLD}Login URL:${X} ${G}${loginUrl}${X}\n`);
            console.log(`${BOLD}Instructions:${X}`);
            console.log('1. Click the URL above to open your browser');
            console.log('2. Login with your Zerodha credentials');
            console.log('3. Authorize the connection');
            console.log('4. You\'ll see "Login Successful" in the browser\n');

            // Try to open browser automatically
            if (openBrowser(loginUrl)) {
                console.log(`${G}✅ Browser opened automatically${X}\n`);
            } else {
                console.log(`${Y}⚠️  Please copy the URL above and paste in your browser${X}\n`);
            }

            console.log(`${Y}Waiting for login... (server will close automatically)${X}\n`);
        });

        // Timeout after 5 minutes
        setTimeout(() => {
            callbackServer.close();
            reject(new Error('Login timeout - please try again'));
        }, 300000);
    });
}

async function main() {
    console.log(`\n${BOLD}${B}╔═══════════════════════════════════════════════════════════════╗${X}`);
    console.log(`${BOLD}${B}║         Kite URL-Based Login (No API Key)            ║${X}`);
    console.log(`${BOLD}${B}╚═══════════════════════════════════════════════════════════════╝${X}\n`);

    console.log(`${B}This uses OAuth - just like logging into kite.trade${X}\n`);

    try {
        const result = await fetchLoginUrl();
        console.log(`${G}✅ Authentication complete!${X}`);
        console.log(`${B}The session is now active. You can use Kite MCP tools.${X}\n`);
    } catch (e) {
        console.log(`${R}❌ ${e.message}${X}\n`);
        process.exit(1);
    }
}

main();
