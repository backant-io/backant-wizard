import chalk from 'chalk';
import clack from './utils/clack.js';
import { printWelcome, getApiKey, askInstallMode, abortIfCancelled } from './utils/clack-utils.js';
import { addMCPServerToClientsStep, getAllClients } from './steps/add-mcp-server-to-clients/index.js';
import { enableDebug } from './utils/debug.js';
import type { WizardOptions } from './utils/types.js';
import { REMOTE_MCP_URL, LOCAL_MCP_URL } from './steps/add-mcp-server-to-clients/defaults.js';

async function runManualMode(): Promise<void> {
  const allClients = getAllClients();

  const selectedName = await abortIfCancelled(
    clack.select({
      message: 'Select a coding agent to view its configuration:',
      options: allClients.map((client) => ({
        value: client.name,
        label: client.name,
        hint: client.note || undefined,
      })),
    }),
  );

  const client = allClients.find((c) => c.name === selectedName);
  if (!client) {
    clack.log.error('Client not found');
    return;
  }

  console.log('');
  clack.log.info(chalk.bold(`Configuration for ${client.name}`));
  console.log('');

  if (client.docsUrl) {
    console.log(chalk.cyan('  Documentation:'));
    console.log(`    ${chalk.underline(client.docsUrl)}`);
    console.log('');
  }

  if (client.note) {
    console.log(chalk.yellow('  Note:'));
    console.log(`    ${client.note}`);
    console.log('');
  }

  const exampleApiKey = 'bk_YOUR_API_KEY_HERE';

  console.log(chalk.cyan('  Remote mode config (HTTP):'));
  const remoteConfig = client.getServerConfig(exampleApiKey, 'remote');
  console.log(chalk.dim('    Add this to your config file under the servers section:'));
  console.log('');
  console.log(chalk.green(`    "${client.getServerPropertyName()}": {`));
  console.log(chalk.green(`      "backant": ${JSON.stringify(remoteConfig, null, 6).split('\n').map((line, i) => i === 0 ? line : '      ' + line).join('\n')}`));
  console.log(chalk.green(`    }`));
  console.log('');

  console.log(chalk.cyan('  Local mode config (HTTP to local server):'));
  const localConfig = client.getServerConfig(exampleApiKey, 'local');
  console.log(chalk.dim('    Add this to your config file under the servers section:'));
  console.log('');
  console.log(chalk.green(`    "${client.getServerPropertyName()}": {`));
  console.log(chalk.green(`      "backant": ${JSON.stringify(localConfig, null, 6).split('\n').map((line, i) => i === 0 ? line : '      ' + line).join('\n')}`));
  console.log(chalk.green(`    }`));
  console.log('');

  if (client.usesCLI) {
    console.log(chalk.cyan('  CLI commands:'));
    if (client.name === 'Claude Code') {
      console.log(chalk.dim('    Remote mode:'));
      console.log(`      claude mcp add --transport http --header "Authorization: Bearer ${exampleApiKey}" -s user backant "${REMOTE_MCP_URL}"`);
      console.log('');
      console.log(chalk.dim('    Local mode:'));
      console.log(`      claude mcp add --transport http --header "Authorization: Bearer ${exampleApiKey}" -s user backant "${LOCAL_MCP_URL}"`);
    }
    console.log('');
  }

  clack.outro(chalk.dim('Press Enter to exit'));
}

export async function runWizard(options: WizardOptions = {}): Promise<void> {
  if (options.debug) {
    enableDebug();
  }

  printWelcome();

  const actions = await abortIfCancelled(
    clack.multiselect({
      message: 'What would you like to do? (space to select, enter to confirm)',
      options: [
        {
          value: 'mcp' as const,
          label: 'Install Backant MCP Server',
          hint: 'Install to your coding agents',
        },
        {
          value: 'manual' as const,
          label: 'Manual Setup (View Config)',
          hint: 'View configuration for manual setup',
        },
      ],
      required: true,
    }),
  );

  if (actions.includes('manual') && actions.length === 1) {
    await runManualMode();
    return;
  }

  const apiKey = await getApiKey();

  let installedMcp = false;

  if (actions.includes('mcp')) {
    let mode: 'local' | 'remote';
    if (options.local !== undefined) {
      mode = options.local ? 'local' : 'remote';
      clack.log.info(`Using ${mode} mode`);
    } else if (options.ci) {
      mode = 'remote';
      clack.log.info('Using remote mode (CI default)');
    } else {
      mode = await askInstallMode();
    }

    const installedClients = await addMCPServerToClientsStep({
      apiKey,
      mode,
      ci: options.ci,
    });

    installedMcp = installedClients.length > 0;
  }

  if (installedMcp) {
    const outroMessage = `
${chalk.green('✓ Backant MCP installed!')}

${chalk.cyan('Get started in your coding agent:')}
  ${chalk.yellow('"Generate a REST API for a blog"')}
  ${chalk.yellow('"Create a new backant project"')}
  ${chalk.yellow('"Add a users route to my API"')}

${chalk.dim('Docs:')} ${chalk.cyan('https://backant.io/docs')}
`;
    clack.outro(outroMessage);
  } else {
    clack.outro(chalk.dim('No changes made.'));
  }
}
