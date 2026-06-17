import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MCPClient } from '../MCPClient.js';
import { REMOTE_MCP_URL, LOCAL_MCP_URL } from '../defaults.js';
import type { MCPServerConfig } from '../../../utils/types.js';

export class JetBrainsMCPClient extends MCPClient {
  name = 'JetBrains';
  docsUrl = 'https://www.jetbrains.com/help/idea/mcp-server.html';

  async isClientSupported(): Promise<boolean> {
    const homeDir = os.homedir();
    const possibleDirs = [
      path.join(homeDir, '.config', 'JetBrains'),
      path.join(homeDir, 'Library', 'Application Support', 'JetBrains'),
    ];
    return possibleDirs.some(dir => fs.existsSync(dir));
  }

  async getConfigPath(): Promise<string> {
    return path.join(os.homedir(), '.jetbrains', 'mcp.json');
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
