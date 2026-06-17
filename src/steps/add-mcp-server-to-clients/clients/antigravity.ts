import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MCPClient } from '../MCPClient.js';
import { REMOTE_MCP_URL, LOCAL_MCP_URL } from '../defaults.js';
import type { MCPServerConfig } from '../../../utils/types.js';

export class AntigravityMCPClient extends MCPClient {
  name = 'Google Antigravity';
  docsUrl = 'https://developers.google.com/gemini-code-assist/docs/use-mcp-servers';

  async isClientSupported(): Promise<boolean> {
    const configPath = await this.getConfigPath();
    const configDir = path.dirname(configPath);
    return fs.existsSync(configDir) || fs.existsSync(path.dirname(configDir));
  }

  async getConfigPath(): Promise<string> {
    const platform = process.platform;
    if (platform === 'win32') {
      return path.join(process.env.APPDATA || '', 'Gemini', 'Antigravity', 'mcp_config.json');
    }
    if (platform === 'linux') {
      return path.join(os.homedir(), '.config', 'gemini', 'antigravity', 'mcp_config.json');
    }
    return path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json');
  }

  getServerPropertyName(): string {
    return 'mcpServers';
  }

  getServerConfig(apiKey: string, mode: 'local' | 'remote'): MCPServerConfig {
    const url = mode === 'local' ? LOCAL_MCP_URL : REMOTE_MCP_URL;
    return {
      serverUrl: url,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    };
  }
}
