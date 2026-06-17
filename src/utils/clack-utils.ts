import clack, { isCancel } from './clack.js';
import chalk from 'chalk';
import open from 'open';
import { startDeviceFlow, exchangeSessionForToken } from './device-flow.js';

export async function abortIfCancelled<T>(
  input: T | Promise<T>,
): Promise<Exclude<T, symbol>> {
  const result = await input;

  if (isCancel(result)) {
    clack.cancel('Setup cancelled.');
    process.exit(0);
  }

  return result as Exclude<T, symbol>;
}

export async function abort(message?: string, code = 1): Promise<never> {
  clack.outro(message ?? 'Setup cancelled.');
  process.exit(code);
}

export function printWelcome(): void {
  console.log('');
  clack.intro(chalk.bgBlue.white(' Backant MCP Wizard '));
  clack.note(
    'This wizard will install the Backant MCP server to your coding agents.\nGet a fully managed REST API backend generated directly in your IDE.',
  );
}

export async function getApiKey(): Promise<string> {
  clack.log.step('Starting browser-based authorization...');

  const session = await startDeviceFlow();

  clack.log.info(`Opening authorization page in your browser...`);
  clack.log.info(`If it doesn't open automatically, visit:\n  ${chalk.cyan(session.authUrl)}`);

  try {
    await open(session.authUrl);
  } catch {
    clack.log.warn('Could not open browser. Please visit the URL above manually.');
  }

  const spinner = clack.spinner();
  spinner.start('Waiting for authorization in browser...');

  try {
    const tokens = await exchangeSessionForToken(session);
    spinner.stop('Authorization successful!');
    return tokens.access_token;
  } catch (err) {
    spinner.stop('Authorization failed.');
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Authorization failed: ${message}`);
  }
}

export async function askInstallMode(
  defaultLocal = false,
): Promise<'local' | 'remote'> {
  const mode = await abortIfCancelled(
    clack.select({
      message: 'Select installation mode:',
      options: [
        {
          value: 'remote' as const,
          label: 'Remote (Recommended)',
          hint: 'Connects to your Backant MCP server via HTTP',
        },
        {
          value: 'local' as const,
          label: 'Local',
          hint: 'Requires Docker / backant-mcp binary running locally',
        },
      ],
      initialValue: (defaultLocal ? 'local' : 'remote') as 'local' | 'remote',
    }),
  );

  return mode as 'local' | 'remote';
}
