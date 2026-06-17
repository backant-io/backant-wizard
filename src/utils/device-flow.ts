import * as http from 'http';
import * as crypto from 'crypto';
import { debug } from './debug.js';

const BACKANT_MCP_URL = process.env.BACKANT_MCP_URL || 'https://mcp.backant.io';
const CALLBACK_PORT = 54321;
const CALLBACK_URL = `http://localhost:${CALLBACK_PORT}/callback`;

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
}

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = base64urlEncode(crypto.randomBytes(32));
  const challenge = base64urlEncode(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

async function registerClient(mcpBase: string): Promise<string> {
  debug('Registering OAuth client...');
  const response = await fetch(`${mcpBase}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'backant-wizard',
      redirect_uris: [CALLBACK_URL],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Client registration failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { client_id: string };
  debug(`Registered client: ${data.client_id}`);
  return data.client_id;
}

function waitForCallback(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${CALLBACK_PORT}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<html><body style="font-family:monospace;text-align:center;padding:40px">
        <h2 style="color:#22c55e">✓ Authorized!</h2>
        <p>You can close this tab and return to the terminal.</p>
      </body></html>`);

      server.close();

      if (error) {
        reject(new Error(`OAuth error: ${error}`));
      } else if (code) {
        resolve(code);
      } else {
        reject(new Error('No code in callback'));
      }
    });

    server.listen(CALLBACK_PORT, 'localhost', () => {
      debug(`Callback server listening on port ${CALLBACK_PORT}`);
    });

    server.on('error', (err) => {
      reject(new Error(`Failed to start callback server: ${err.message}`));
    });

    setTimeout(() => {
      server.close();
      reject(new Error('Authorization timed out (5 minutes)'));
    }, 5 * 60 * 1000);
  });
}

async function exchangeCode(
  mcpBase: string,
  clientId: string,
  code: string,
  verifier: string,
): Promise<OAuthTokens> {
  debug('Exchanging code for token...');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: CALLBACK_URL,
    client_id: clientId,
    code_verifier: verifier,
  });

  const response = await fetch(`${mcpBase}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Token exchange failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<OAuthTokens>;
}

export async function runDeviceFlow(): Promise<OAuthTokens> {
  const mcpBase = BACKANT_MCP_URL;

  const clientId = await registerClient(mcpBase);
  const { verifier, challenge } = generatePKCE();
  const state = base64urlEncode(crypto.randomBytes(16));

  const authUrl = new URL(`${mcpBase}/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', state);

  debug(`Auth URL: ${authUrl.toString()}`);

  const callbackPromise = waitForCallback();

  return { clientId, verifier, authUrl: authUrl.toString(), callbackPromise } as unknown as OAuthTokens;
}

export interface DeviceFlowSession {
  clientId: string;
  verifier: string;
  authUrl: string;
  callbackPromise: Promise<string>;
}

export async function startDeviceFlow(): Promise<DeviceFlowSession> {
  const mcpBase = BACKANT_MCP_URL;

  const clientId = await registerClient(mcpBase);
  const { verifier, challenge } = generatePKCE();

  const authUrl = new URL(`${mcpBase}/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  debug(`Auth URL: ${authUrl.toString()}`);

  const callbackPromise = waitForCallback();

  return {
    clientId,
    verifier,
    authUrl: authUrl.toString(),
    callbackPromise,
  };
}

export async function exchangeSessionForToken(session: DeviceFlowSession): Promise<OAuthTokens> {
  const mcpBase = BACKANT_MCP_URL;
  const code = await session.callbackPromise;
  return exchangeCode(mcpBase, session.clientId, code, session.verifier);
}
