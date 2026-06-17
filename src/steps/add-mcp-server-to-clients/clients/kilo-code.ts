import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MCPClient } from '../MCPClient.js';
import { REMOTE_MCP_URL, LOCAL_MCP_URL } from '../defaults.js';
import type { MCPServerConfig } from '../../../utils/types.js';

export class KiloCodeMCPClient extends MCPClient {
  name = 'Kilo Code';
  docsUrl = 'https://kilo.ai/docs/features/mcp/using-mcp-in-kilo-code';

  async isClientSupported(): Promise<boolean> {
    const configPath = await this.getConfigPath();
    const configDir = path.dirname(configPath);
    return fs.existsSync(configDir) || fs.existsSync(path.dirname(configDir));
  }

  async getConfigPath(): Promise<string> {
    const platform = process.platform;
    if (platform === 'darwin') {
      return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'kilocode.kilocode', 'settings', 'mcp_settings.json');
    }
    if (platform === 'win32') {
      return path.join(process.env.APPDATA || '', 'Code', 'User', 'globalStorage', 'kilocode.kilocode', 'settings', 'mcp_settings.json');
    }
    return path.join(os.homedir(), '.config', 'Code', 'User', 'globalStorage', 'kilocode.kilocode', 'settings', 'mcp_settings.json');
  }

  getServerPropertyName(): string {
    return 'mcpServers';
  }

  getServerConfig(apiKey: string, mode: 'local' | 'remote'): MCPServerConfig {
    const url = mode === 'local' ? LOCAL_MCP_URL : REMOTE_MCP_URL;
    return {
      type: 'streamable-http',
      url,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      alwaysAllow: [],
      disabled: false,
    };
  }
}
