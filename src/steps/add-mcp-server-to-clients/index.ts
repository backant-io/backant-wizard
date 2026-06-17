import clack from '../../utils/clack.js';
import chalk from 'chalk';
import { abortIfCancelled } from '../../utils/clack-utils.js';
import { MCPClient } from './MCPClient.js';
import {
  CursorMCPClient,
  ClaudeCodeMCPClient,
  ClaudeDesktopMCPClient,
  VSCodeMCPClient,
  WindsurfMCPClient,
  ClineMCPClient,
  ContinueMCPClient,
  ZedMCPClient,
  JetBrainsMCPClient,
  AntigravityMCPClient,
  TraeMCPClient,
  RooCodeMCPClient,
  KiloCodeMCPClient,
  GeminiCLIMCPClient,
  OpencodeMCPClient,
  QodoGenMCPClient,
  QwenCoderMCPClient,
  VisualStudioMCPClient,
  CrushMCPClient,
  CopilotCLIMCPClient,
  CopilotAgentMCPClient,
  AugmentMCPClient,
  KiroMCPClient,
  LMStudioMCPClient,
  BoltAIMCPClient,
  PerplexityMCPClient,
  WarpMCPClient,
  AmazonQMCPClient,
  CodexCLIMCPClient,
  CodexAppMCPClient,
  FactoryMCPClient,
  AmpMCPClient,
  VibeMCPClient,
} from './clients/index.js';
import { debug } from '../../utils/debug.js';

export { MCPClient } from './MCPClient.js';
export * from './defaults.js';

export function getAllClients(): MCPClient[] {
  return [
    new CursorMCPClient(),
    new ClaudeCodeMCPClient(),
    new ClaudeDesktopMCPClient(),
    new VSCodeMCPClient(),
    new WindsurfMCPClient(),
    new ClineMCPClient(),
    new ContinueMCPClient(),
    new ZedMCPClient(),
    new JetBrainsMCPClient(),
    new AntigravityMCPClient(),
    new TraeMCPClient(),
    new RooCodeMCPClient(),
    new KiloCodeMCPClient(),
    new GeminiCLIMCPClient(),
    new OpencodeMCPClient(),
    new QodoGenMCPClient(),
    new QwenCoderMCPClient(),
    new VisualStudioMCPClient(),
    new CrushMCPClient(),
    new CopilotCLIMCPClient(),
    new CopilotAgentMCPClient(),
    new AugmentMCPClient(),
    new KiroMCPClient(),
    new LMStudioMCPClient(),
    new BoltAIMCPClient(),
    new PerplexityMCPClient(),
    new WarpMCPClient(),
    new AmazonQMCPClient(),
    new CodexCLIMCPClient(),
    new CodexAppMCPClient(),
    new FactoryMCPClient(),
    new AmpMCPClient(),
    new VibeMCPClient(),
  ];
}

export async function getSupportedClients(): Promise<MCPClient[]> {
  const allClients = getAllClients();
  const supportedClients: MCPClient[] = [];
  debug('Checking for supported MCP clients...');
  for (const client of allClients) {
    const isSupported = await client.isClientSupported();
    debug(`${client.name}: ${isSupported ? '✓ supported' : '✗ not supported'}`);
    if (isSupported) {
      supportedClients.push(client);
    }
  }
  debug(`Found ${supportedClients.length} supported client(s): ${supportedClients.map((c) => c.name).join(', ')}`);
  return supportedClients;
}

export interface AddMCPServerOptions {
  apiKey: string;
  mode: 'local' | 'remote';
  ci?: boolean;
}

export async function addMCPServerToClientsStep(options: AddMCPServerOptions): Promise<string[]> {
  const { apiKey, mode, ci = false } = options;

  const allClients = getAllClients();
  const supportedNames = new Set<string>();

  for (const client of allClients) {
    if (await client.isClientSupported()) {
      supportedNames.add(client.name);
    }
  }

  let selectedClients: MCPClient[];

  if (ci) {
    selectedClients = allClients.filter((c) => supportedNames.has(c.name));
    if (selectedClients.length === 0) {
      clack.log.warn('No coding agents detected on this system.');
      return [];
    }
    clack.log.info(`Auto-selecting ${selectedClients.length} client(s): ${selectedClients.map((c) => c.name).join(', ')}`);
  } else {
    const selectedNames = await abortIfCancelled(
      clack.multiselect({
        message: 'Select which coding agents to install Backant to:',
        options: allClients.map((client) => ({
          value: client.name,
          label: client.name,
          hint: supportedNames.has(client.name) ? undefined : 'not detected - rerun wizard → Manual Setup',
        })),
        initialValues: allClients.filter((c) => c.name === 'Claude Code' && supportedNames.has(c.name)).map((c) => c.name),
        required: false,
      }),
    );

    selectedClients = allClients.filter((client) => selectedNames.includes(client.name));
  }

  if (selectedClients.length === 0) {
    clack.log.info('No clients selected.');
    return [];
  }

  const installedClients: MCPClient[] = [];
  for (const client of selectedClients) {
    if (await client.isServerInstalled()) {
      installedClients.push(client);
    }
  }

  if (installedClients.length > 0 && !ci) {
    clack.log.warn(`Backant is already configured for:\n  ${installedClients.map((c) => `• ${c.name}`).join('\n  ')}`);
    const reinstall = await abortIfCancelled(
      clack.confirm({
        message: 'Reinstall to update configuration?',
        initialValue: true,
      }),
    );
    if (!reinstall) {
      selectedClients = selectedClients.filter((c) => !installedClients.includes(c));
      if (selectedClients.length === 0) {
        clack.log.info('Nothing to install.');
        return [];
      }
    }
  }

  const spinner = clack.spinner();
  spinner.start('Installing Backant MCP server...');

  const successfulClients: string[] = [];
  const failedClients: { name: string; error: string }[] = [];

  for (const client of selectedClients) {
    const result = await client.addServer(apiKey, mode);
    if (result.success) {
      successfulClients.push(client.name);
    } else {
      failedClients.push({ name: client.name, error: result.error || 'Unknown error' });
    }
  }

  spinner.stop('Installation complete.');

  if (successfulClients.length > 0) {
    clack.log.success(`Installed Backant to:\n  ${successfulClients.map((n) => `• ${n}`).join('\n  ')}`);
  }

  if (failedClients.length > 0) {
    clack.log.warn(`Failed to install to:\n  ${failedClients.map((f) => `• ${f.name}: ${f.error}`).join('\n  ')}`);
  }

  return successfulClients;
}

export async function removeMCPServerFromClientsStep(): Promise<string[]> {
  const supportedClients = await getSupportedClients();
  const installedClients: MCPClient[] = [];

  for (const client of supportedClients) {
    if (await client.isServerInstalled()) {
      installedClients.push(client);
    }
  }

  if (installedClients.length === 0) {
    clack.log.info('Backant is not installed in any detected coding agents.');
    return [];
  }

  const selectedNames = await abortIfCancelled(
    clack.multiselect({
      message: 'Select which coding agents to remove Backant from:',
      options: installedClients.map((client) => ({
        value: client.name,
        label: client.name,
      })),
      initialValues: installedClients.map((client) => client.name),
      required: true,
    }),
  );

  const selectedClients = installedClients.filter((client) => selectedNames.includes(client.name));

  if (selectedClients.length === 0) {
    return [];
  }

  const spinner = clack.spinner();
  spinner.start('Removing Backant MCP server...');

  const removedClients: string[] = [];

  for (const client of selectedClients) {
    const result = await client.removeServer();
    if (result.success) {
      removedClients.push(client.name);
    }
  }

  spinner.stop('Removal complete.');

  if (removedClients.length > 0) {
    clack.log.success(`Removed Backant from:\n  ${removedClients.map((n) => `• ${n}`).join('\n  ')}`);
  }

  return removedClients;
}
