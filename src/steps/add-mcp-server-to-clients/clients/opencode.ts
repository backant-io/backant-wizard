import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MCPClient } from '../MCPClient.js';
import { REMOTE_MCP_URL, LOCAL_MCP_URL } from '../defaults.js';
import type { MCPServerConfig } from '../../../utils/types.js';

export class OpencodeMCPClient extends MCPClient {
  name = 'Opencode';
  docsUrl = 'https://opencode.ai/docs/mcp-servers/';

  async isClientSupported(): Promise<boolean> {
    const configPath = await this.getConfigPath();
    const configDir = path.dirname(configPath);
    return fs.existsSync(configDir) || fs.existsSync(path.dirname(configDir));
  }

  async getConfigPath(): Promise<string> {
    return path.join(os.homedir(), '.opencode', 'config.json');
  }

  getServerPropertyName(): string {
    return 'mcp';
  }

  getServerConfig(apiKey: string, mode: 'local' | 'remote'): MCPServerConfig {
    const url = mode === 'local' ? LOCAL_MCP_URL : REMOTE_MCP_URL;
    return {
      type: 'remote',
      url,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      enabled: true,
    };
  }
}
