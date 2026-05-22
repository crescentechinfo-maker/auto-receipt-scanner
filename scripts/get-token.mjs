// Run once to get your Google refresh token:
// node scripts/get-token.mjs
import { google } from 'googleapis';
import * as readline from 'readline/promises';
import { stdin, stdout } from 'process';
import { readFileSync } from 'fs';

// Load .env.local manually
const env = readFileSync('.env.local', 'utf8');
const get = (key) => env.split('\n').find(l => l.startsWith(key + '='))?.slice(key.length + 1).trim();

const CLIENT_ID = get('GOOGLE_CLIENT_ID');
const CLIENT_SECRET = get('GOOGLE_CLIENT_SECRET');

if (!CLIENT_ID || !CLIENT_SECRET || CLIENT_ID.includes('PASTE')) {
  console.error('\n❌ Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local first.\n');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'urn:ietf:wg:oauth:2.0:oob');

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive'],
  prompt: 'consent',
});

console.log('\n── Step 1: Open this URL in your browser ──────────────────────');
console.log(authUrl);
console.log('────────────────────────────────────────────────────────────────');
console.log('\n── Step 2: Sign in with YOUR Google account → click Allow ─────');
console.log('── Step 3: Copy the code shown on the next page ────────────────\n');

const rl = readline.createInterface({ input: stdin, output: stdout });
const code = (await rl.question('Paste the authorization code here: ')).trim();
rl.close();

try {
  const { tokens } = await oauth2Client.getToken(code);
  console.log('\n✅ Success! Add this to your .env.local:\n');
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log('\nThen restart: npm run dev\n');
} catch (e) {
  console.error('\n❌ Failed to exchange code:', e.message);
}
