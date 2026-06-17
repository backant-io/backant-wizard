import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MCPClient } from '../MCPClient.js';
import { REMOTE_MCP_URL, LOCAL_MCP_URL } from '../defaults.js';
import type { MCPServerConfig } from '../../../utils/types.js';

export class ZedMCPClient extends MCPClient {
  name = 'Zed';
  docsUrl = 'https://zed.dev/docs/ai/mcp';

  async isClientSupported(): Promise<boolean> {
    const platform = process.platform;
    if (platform !== 'darwin' && platform !== 'linux') {
      return false;
    }
    const configPath = await this.getConfigPath();
    const configDir = path.dirname(configPath);
    return fs.existsSync(configDir);
  }

  async getConfigPath(): Promise<string> {
    const platform = process.platform;
    if (platform === 'darwin') {
      return path.join(os.homedir(), '.config', 'zed', 'settings.json');
    }
    const xdgConfigHome = process.env.XDG_CONFIG_HOME;
    if (xdgConfigHome) {
      return path.join(xdgConfigHome, 'zed', 'settings.json');
    }
    return path.join(os.homedir(), '.config', 'zed', 'settings.json');
  }

  getServerPropertyName(): string {
    return 'context_servers';
  }

  getServerConfig(apiKey: string, mode: 'local' | 'remote'): MCPServerConfig {
    const url = mode === 'local' ? LOCAL_MCP_URL : REMOTE_MCP_URL;
    return {
      url,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    };
  }
}
