import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MCPClient } from '../MCPClient.js';
import { REMOTE_MCP_URL, LOCAL_MCP_URL } from '../defaults.js';
import type { MCPServerConfig } from '../../../utils/types.js';

export class WindsurfMCPClient extends MCPClient {
  name = 'Windsurf';
  docsUrl = 'https://docs.windsurf.com/windsurf/cascade/mcp';

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
      return path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
    }
    if (platform === 'win32') {
      return path.join(process.env.APPDATA || '', 'Codeium', 'windsurf', 'mcp_config.json');
    }
    return path.join(os.homedir(), '.config', 'windsurf', 'mcp.json');
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
