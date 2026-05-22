import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error) {
    return new NextResponse(errorPage(error), { headers: { 'Content-Type': 'text/html' } });
  }

  if (!code) {
    return new NextResponse(errorPage('No authorization code received'), { headers: { 'Content-Type': 'text/html' } });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000/api/auth/callback'
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      return new NextResponse(
        errorPage('No refresh token returned. Try visiting /api/auth/setup again.'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new NextResponse(successPage(refreshToken), { headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new NextResponse(errorPage(msg), { headers: { 'Content-Type': 'text/html' } });
  }
}

function successPage(token: string) {
  return `<!DOCTYPE html>
<html>
<head><title>ReceiptScan — Auth Success</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 640px; margin: 60px auto; padding: 0 20px; background: #f8fafc; }
  .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  h2 { color: #16a34a; margin-top: 0; }
  .token { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; word-break: break-all; font-family: monospace; font-size: 13px; }
  .step { background: #eff6ff; border-left: 3px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 8px 0; }
  button { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; }
  button:active { background: #2563eb; }
</style>
</head>
<body>
<div class="card">
  <h2>✅ Authorization Successful!</h2>
  <p>Copy your refresh token below and add it to <code>.env.local</code>:</p>
  <div class="token" id="token">${token}</div>
  <br>
  <button onclick="navigator.clipboard.writeText('${token}').then(()=>this.textContent='Copied!')">Copy Token</button>
  <br><br>
  <div class="step">1. Open <code>.env.local</code> in your project</div>
  <div class="step">2. Replace <code>PASTE_REFRESH_TOKEN_HERE</code> with the token above</div>
  <div class="step">3. Save the file and restart: <code>npm run dev</code></div>
</div>
</body>
</html>`;
}

function errorPage(msg: string) {
  return `<!DOCTYPE html>
<html>
<head><title>Auth Error</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:60px auto;padding:0 20px} .card{background:white;border-radius:16px;padding:32px;box-shadow:0 1px 4px rgba(0,0,0,.08)} h2{color:#dc2626}</style>
</head>
<body><div class="card"><h2>❌ Error</h2><p>${msg}</p><a href="/api/auth/setup">Try again</a></div></body>
</html>`;
}
