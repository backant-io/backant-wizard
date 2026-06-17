import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MCPClient } from '../MCPClient.js';
import { REMOTE_MCP_URL, LOCAL_MCP_URL } from '../defaults.js';
import type { MCPServerConfig } from '../../../utils/types.js';

export class BoltAIMCPClient extends MCPClient {
  name = 'BoltAI';
  docsUrl = 'https://docs.boltai.com/docs/plugins/mcp-servers';
  note = 'macOS only';

  async isClientSupported(): Promise<boolean> {
    if (process.platform !== 'darwin') {
      return false;
    }
    const configPath = await this.getConfigPath();
    const configDir = path.dirname(configPath);
    return fs.existsSync(configDir) || fs.existsSync(path.dirname(configDir));
  }

  async getConfigPath(): Promise<string> {
    return path.join(os.homedir(), 'Library', 'Application Support', 'BoltAI', 'mcp.json');
  }

  getServerPropertyName(): string {
    return 'mcpServers';
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
