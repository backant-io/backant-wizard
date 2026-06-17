import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MCPClient, SERVER_NAME } from '../MCPClient.js';
import { REMOTE_MCP_URL } from '../defaults.js';
import type { MCPClientResult } from '../../../utils/types.js';
import { debug } from '../../../utils/debug.js';

export class VibeMCPClient extends MCPClient {
  name = 'Mistral Vibe CLI';
  docsUrl = 'https://github.com/mistralai/mistral-vibe?tab=readme-ov-file#mcp-server-configuration';
  note = 'Uses TOML config';

  async isClientSupported(): Promise<boolean> {
    const configPath = await this.getConfigPath();
    return fs.existsSync(configPath);
  }

  async getConfigPath(): Promise<string> {
    if (process.platform === 'win32') {
      return path.join(process.env.USERPROFILE || '', '.vibe', 'config.toml');
    }
    return path.join(os.homedir(), '.vibe', 'config.toml');
  }

  getServerPropertyName(): string {
    return 'mcp_servers';
  }

  async isServerInstalled(): Promise<boolean> {
    try {
      const configPath = await this.getConfigPath();
      if (!fs.existsSync(configPath)) {
        return false;
      }
      const content = await fs.promises.readFile(configPath, 'utf8');
      return content.includes(`name = "${SERVER_NAME}"`);
    } catch {
      return false;
    }
  }

  async addServer(apiKey: string, _mode: 'local' | 'remote'): Promise<MCPClientResult> {
    try {
      const configPath = await this.getConfigPath();
      if (!fs.existsSync(configPath)) {
        return { success: false, error: 'Vibe config not found' };
      }
      let content = await fs.promises.readFile(configPath, 'utf8');
      if (content.includes(`name = "${SERVER_NAME}"`)) {
        debug(`${SERVER_NAME} already configured in Vibe`);
        return { success: true };
      }
      content = content.replace(/^mcp_servers = \[\]\s*$/m, '');
      const serverConfig = `
[[mcp_servers]]
name = "${SERVER_NAME}"
transport = "streamable-http"
url = "${REMOTE_MCP_URL}"

[mcp_servers.headers]
Authorization = "Bearer ${apiKey}"
`;
      content = content.trimEnd() + '\n' + serverConfig;
      await fs.promises.writeFile(configPath, content, 'utf8');
      debug(`Wrote Vibe config to ${configPath}`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  async removeServer(): Promise<MCPClientResult> {
    try {
      const configPath = await this.getConfigPath();
      if (!fs.existsSync(configPath)) {
        return { success: false, error: 'Vibe config not found' };
      }
      let content = await fs.promises.readFile(configPath, 'utf8');
      const niaBlockRegex = new RegExp(`\\[\\[mcp_servers\\]\\]\\s*name\\s*=\\s*"${SERVER_NAME}"[\\s\\S]*?(?=\\[\\[|\\[(?!\\[)|$)`, 'g');
      content = content.replace(niaBlockRegex, '');
      await fs.promises.writeFile(configPath, content.trimEnd() + '\n', 'utf8');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }
}
