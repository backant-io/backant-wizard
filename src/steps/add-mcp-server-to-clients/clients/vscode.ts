import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MCPClient } from '../MCPClient.js';
import { REMOTE_MCP_URL, LOCAL_MCP_URL } from '../defaults.js';
import type { MCPServerConfig } from '../../../utils/types.js';

export class VSCodeMCPClient extends MCPClient {
  name = 'VS Code';
  docsUrl = 'https://code.visualstudio.com/docs/copilot/chat/mcp-servers';

  async isClientSupported(): Promise<boolean> {
    const platform = process.platform;
    if (platform !== 'darwin' && platform !== 'win32' && platform !== 'linux') {
      return false;
    }
    const configPath = await this.getConfigPath();
    const configDir = path.dirname(configPath);
    return fs.existsSync(configDir) || fs.existsSync(path.dirname(configDir));
  }

  async getConfigPath(): Promise<string> {
    const platform = process.platform;
    if (platform === 'darwin') {
      return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'mcp.json');
    }
    if (platform === 'win32') {
      return path.join(process.env.APPDATA || '', 'Code', 'User', 'mcp.json');
    }
    return path.join(os.homedir(), '.config', 'Code', 'User', 'mcp.json');
  }

  getServerPropertyName(): string {
    return 'servers';
  }

  getServerConfig(apiKey: string, mode: 'local' | 'remote'): MCPServerConfig {
    const url = mode === 'local' ? LOCAL_MCP_URL : REMOTE_MCP_URL;
    return {
      type: 'http',
      url,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    };
  }
}
