# Kite Login Skill

## Description
Handle Kite MCP authentication using the dynamic login URL flow.

## When to Use
When the user needs to log in to Kite for trading operations or when Kite MCP returns "Kite Login Required" error.

## Steps

1. **Check Current Session Status**
   - Try calling `kite_get_profile` tool from the kite MCP server
   - If successful, user is already logged in

2. **Handle Login Required Error**
   - If error message is "Kite Login Required", extract `login_url` from error.data
   - Present the login URL to the user

3. **Guide User Through Login**
   - Provide the login URL: `{login_url}`
   - Instruct user to:
     1. Open the URL in their browser
     2. Complete the Zerodha login
     3. Click "Authorize" when prompted
     4. Wait for "Login Successful" message

4. **Verify Login**
   - After user completes login, call `kite_get_profile` again
   - Confirm successful authentication

## Example

```
User: "kite login"
→ Try kite_get_profile
→ If login required:
   "Please visit this URL to login: https://kite.trade/connect/login?..."
→ After user confirms:
   "Checking login status..."
→ Verify with kite_get_profile again
```

## Notes
- The login URL is dynamic and includes a session_id
- Do not cache login URLs - fetch fresh each time
- Session remains valid until explicitly logged out
