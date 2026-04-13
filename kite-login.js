const https = require('https');
const { spawn } = require('child_process');

const MCP_URL = 'https://mcp.kite.trade/mcp';

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

async function getLoginUrl() {
    return new Promise((resolve, reject) => {
        // First, try to call any tool that requires authentication
        // This will return the login URL in the error response
        const body = JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
                name: 'kite_get_profile',
                arguments: {}
            }
        });

        const req = https.request(MCP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error && json.error.data && json.error.data.login_url) {
                        resolve({ needsLogin: true, loginUrl: json.error.data.login_url });
                    } else if (json.result) {
                        resolve({ needsLogin: false, profile: json.result });
                    } else {
                        resolve({ needsLogin: true, loginUrl: json.error?.data?.login_url || null });
                    }
                } catch (e) {
                    reject(new Error('Invalid response: ' + data));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    console.log(`\n${BOLD}${B}╔═══════════════════════════════════════════════════════════════╗${X}`);
    console.log(`${BOLD}${B}║              Kite MCP Login Handler                    ║${X}`);
    console.log(`${BOLD}${B}╚═══════════════════════════════════════════════════════════════╝${X}\n`);

    try {
        console.log(`${BOLD}Fetching login status from Kite MCP...${X}\n`);

        const result = await getLoginUrl();

        if (!result.needsLogin) {
            console.log(`${G}✅ You are already logged in!${X}`);
            console.log(`${G}Profile: ${JSON.stringify(result.profile, null, 2)}${X}\n`);
            return;
        }

        if (result.loginUrl) {
            console.log(`${Y}⚠️  LOGIN REQUIRED${X}\n`);
            console.log(`${BOLD}Login URL:${X} ${G}${result.loginUrl}${X}\n`);

            console.log(`${BOLD}Instructions:${X}`);
            console.log('1. Click the URL above or copy it to your browser');
            console.log('2. Login with your Zerodha credentials');
            console.log('3. Click "Authorize" to grant access');
            console.log('4. Once you see "Login Successful", return here\n');

            // Try to open browser
            console.log(`${B}Opening browser...${X}`);
            if (openBrowser(result.loginUrl)) {
                console.log(`${G}✅ Browser opened${X}\n`);
            } else {
                console.log(`${Y}⚠️  Could not auto-open browser. Please copy the URL manually.${X}\n`);
            }

            console.log(`${BOLD}After logging in, run:${X} npm run login:status\n`);
        } else {
            console.log(`${R}❌ Could not retrieve login URL${X}`);
            console.log('The MCP server may be temporarily unavailable.\n');
        }

    } catch (e) {
        console.log(`${R}❌ Error: ${e.message}${X}\n`);
    }
}

main();
