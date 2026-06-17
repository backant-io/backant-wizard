import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MCPClient } from '../MCPClient.js';
import { getRemoteServerConfig } from '../defaults.js';
import type { MCPServerConfig } from '../../../utils/types.js';

export class ClaudeDesktopMCPClient extends MCPClient {
  name = 'Claude Desktop';
  docsUrl = 'https://modelcontextprotocol.io/quickstart/user';

  async isClientSupported(): Promise<boolean> {
    const platform = process.platform;
    if (platform !== 'darwin' && platform !== 'win32') {
      return false;
    }
    const configPath = await this.getConfigPath();
    const configDir = path.dirname(configPath);
    return fs.existsSync(configDir);
  }

  async getConfigPath(): Promise<string> {
    const platform = process.platform;
    if (platform === 'darwin') {
      return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    }
    if (platform === 'win32') {
      return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
    }
    throw new Error(`Unsupported platform: ${platform}`);
  }

  getServerPropertyName(): string {
    return 'mcpServers';
  }

  getServerConfig(apiKey: string, _mode: 'local' | 'remote'): MCPServerConfig {
    return getRemoteServerConfig(apiKey);
  }
}
