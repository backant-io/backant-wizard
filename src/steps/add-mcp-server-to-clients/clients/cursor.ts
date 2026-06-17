import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MCPClient } from '../MCPClient.js';
import { getRemoteServerConfig, getLocalServerConfig } from '../defaults.js';
import type { MCPServerConfig } from '../../../utils/types.js';

export class CursorMCPClient extends MCPClient {
  name = 'Cursor';
  docsUrl = 'https://cursor.com/docs/context/mcp';

  async isClientSupported(): Promise<boolean> {
    const platform = process.platform;
    if (platform !== 'darwin' && platform !== 'win32' && platform !== 'linux') {
      return false;
    }
    const configPath = await this.getConfigPath();
    const configDir = path.dirname(configPath);
    return fs.existsSync(path.dirname(configDir)) || fs.existsSync(configDir);
  }

  async getConfigPath(): Promise<string> {
    const platform = process.platform;
    if (platform === 'win32') {
      return path.join(process.env.APPDATA || '', 'Cursor', 'mcp.json');
    }
    if (platform === 'linux') {
      return path.join(os.homedir(), '.config', 'cursor', 'mcp.json');
    }
    return path.join(os.homedir(), '.cursor', 'mcp.json');
  }

  getServerPropertyName(): string {
    return 'mcpServers';
  }

  getServerConfig(apiKey: string, mode: 'local' | 'remote'): MCPServerConfig {
    if (mode === 'local') {
      return getLocalServerConfig(apiKey);
    }
    return getRemoteServerConfig(apiKey);
  }
}
