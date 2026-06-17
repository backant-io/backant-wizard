import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MCPClient } from '../MCPClient.js';
import { REMOTE_MCP_URL, LOCAL_MCP_URL } from '../defaults.js';
import type { MCPServerConfig } from '../../../utils/types.js';

export class VisualStudioMCPClient extends MCPClient {
  name = 'Visual Studio 2022';
  docsUrl = 'https://learn.microsoft.com/en-us/visualstudio/ide/mcp-servers';

  async isClientSupported(): Promise<boolean> {
    if (process.platform !== 'win32') {
      return false;
    }
    const configPath = await this.getConfigPath();
    const configDir = path.dirname(configPath);
    return fs.existsSync(configDir) || fs.existsSync(path.dirname(configDir));
  }

  async getConfigPath(): Promise<string> {
    return path.join(os.homedir(), '.vs', 'mcp.json');
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
