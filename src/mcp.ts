import chalk from 'chalk';
import clack from './utils/clack.js';
import {
  addMCPServerToClientsStep,
  removeMCPServerFromClientsStep,
} from './steps/add-mcp-server-to-clients/index.js';
import { getApiKey, askInstallMode } from './utils/clack-utils.js';
import { enableDebug } from './utils/debug.js';

export interface MCPAddOptions {
  local?: boolean;
  debug?: boolean;
  ci?: boolean;
}

export async function runMCPAdd(options: MCPAddOptions): Promise<void> {
  if (options.debug) {
    enableDebug();
  }

  clack.intro(chalk.bgBlue.white(' Backant MCP Server '));

  const apiKey = await getApiKey();

  let mode: 'local' | 'remote';
  if (options.local !== undefined) {
    mode = options.local ? 'local' : 'remote';
    clack.log.info(`Using ${mode} mode`);
  } else if (options.ci) {
    mode = 'remote';
    clack.log.info('Using remote mode (CI default)');
  } else {
    mode = await askInstallMode(false);
  }

  const installedClients = await addMCPServerToClientsStep({
    apiKey,
    mode,
    ci: options.ci,
  });

  if (installedClients.length > 0) {
    clack.log.message(chalk.dim('You may need to restart your coding agents to load Backant.'));
  }

  clack.outro(chalk.green('Done!'));
}

export async function runMCPRemove(options: { debug?: boolean } = {}): Promise<void> {
  if (options.debug) {
    enableDebug();
  }

  clack.intro(chalk.bgRed.white(' Remove Backant MCP Server '));

  const removedClients = await removeMCPServerFromClientsStep();

  if (removedClients.length > 0) {
    clack.log.message(chalk.dim('You may need to restart your coding agents for changes to take effect.'));
  }

  clack.outro(chalk.green('Done!'));
}
