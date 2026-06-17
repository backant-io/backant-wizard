import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MCPClient } from '../MCPClient.js';
import { REMOTE_MCP_URL, LOCAL_MCP_URL } from '../defaults.js';
import type { MCPServerConfig } from '../../../utils/types.js';

export class CopilotCLIMCPClient extends MCPClient {
  name = 'Copilot CLI';
  docsUrl = 'https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/extend-copilot-chat-with-mcp';

  async isClientSupported(): Promise<boolean> {
    const configPath = await this.getConfigPath();
    const configDir = path.dirname(configPath);
    return fs.existsSync(configDir) || fs.existsSync(path.dirname(configDir));
  }

  async getConfigPath(): Promise<string> {
    if (process.platform === 'win32') {
      return path.join(process.env.USERPROFILE || '', '.copilot', 'mcp-config.json');
    }
    return path.join(os.homedir(), '.copilot', 'mcp-config.json');
  }

  getServerPropertyName(): string {
    return 'mcpServers';
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

export class CopilotAgentMCPClient extends MCPClient {
  name = 'Copilot Coding Agent';
  docsUrl = 'https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/extend-copilot-chat-with-mcp';

  async isClientSupported(): Promise<boolean> {
    return fs.existsSync('.github');
  }

  async getConfigPath(): Promise<string> {
    return path.join('.github', 'copilot-mcp.json');
  }

  getServerPropertyName(): string {
    return 'mcpServers';
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
