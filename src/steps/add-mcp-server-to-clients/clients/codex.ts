import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { MCPClient, SERVER_NAME } from '../MCPClient.js';
import { REMOTE_MCP_URL, LOCAL_MCP_URL } from '../defaults.js';
import type { MCPClientResult } from '../../../utils/types.js';
import { debug } from '../../../utils/debug.js';

export class CodexCLIMCPClient extends MCPClient {
  name = 'Codex CLI';
  docsUrl = 'https://developers.openai.com/codex/mcp/';
  private codexBinaryPath: string | null = null;

  private findCodexBinary(): string | null {
    if (this.codexBinaryPath) return this.codexBinaryPath;
    const possiblePaths = [
      path.join(os.homedir(), '.bun', 'bin', 'codex'),
      path.join(os.homedir(), '.npm', 'bin', 'codex'),
      path.join(os.homedir(), '.yarn', 'bin', 'codex'),
      '/usr/local/bin/codex',
      '/opt/homebrew/bin/codex',
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.codexBinaryPath = p;
        return p;
      }
    }
    try {
      execSync('command -v codex', { stdio: 'pipe' });
      this.codexBinaryPath = 'codex';
      return 'codex';
    } catch {
      return null;
    }
  }

  private getConfigFilePath(): string {
    if (process.platform === 'win32') {
      return path.join(process.env.USERPROFILE || '', '.codex', 'config.toml');
    }
    return path.join(os.homedir(), '.codex', 'config.toml');
  }

  async isClientSupported(): Promise<boolean> {
    const binary = this.findCodexBinary();
    if (binary) {
      try {
        execSync(`${binary} --version`, { stdio: 'ignore' });
        return true;
      } catch {}
    }
    const codexDir = path.dirname(this.getConfigFilePath());
    return fs.existsSync(codexDir);
  }

  async getConfigPath(): Promise<string> {
    return this.getConfigFilePath();
  }

  getServerPropertyName(): string {
    return 'mcp_servers';
  }

  async isServerInstalled(): Promise<boolean> {
    const binary = this.findCodexBinary();
    if (binary) {
      try {
        const result = spawnSync(binary, ['mcp', 'list', '--json'], { encoding: 'utf-8' });
        if (!result.error && result.status === 0 && result.stdout?.trim()) {
          const servers = JSON.parse(result.stdout.trim()) as Array<{ name: string }>;
          if (servers.some((server) => server.name === SERVER_NAME)) {
            return true;
          }
        }
      } catch {}
    }
    const configPath = this.getConfigFilePath();
    if (!fs.existsSync(configPath)) return false;
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      return content.includes(`[mcp_servers.${SERVER_NAME}]`);
    } catch {
      return false;
    }
  }

  async addServer(apiKey: string, mode: 'local' | 'remote'): Promise<MCPClientResult> {
    const url = mode === 'local' ? LOCAL_MCP_URL : REMOTE_MCP_URL;
    return this.addServerViaConfigFile(apiKey, url);
  }

  private async addServerViaConfigFile(apiKey: string, url: string): Promise<MCPClientResult> {
    const configPath = this.getConfigFilePath();
    const configDir = path.dirname(configPath);
    try {
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      let content = '';
      if (fs.existsSync(configPath)) {
        content = fs.readFileSync(configPath, 'utf-8');
      }
      const serverRegex = new RegExp(`\\[mcp_servers\\.${SERVER_NAME}\\][\\s\\S]*?(?=\\n\\[|$)`, 'g');
      content = content.replace(serverRegex, '').trim();
      const serverConfig = `
[mcp_servers.${SERVER_NAME}]
url = "${url}"
http_headers = { "Authorization" = "Bearer ${apiKey}" }
`;
      content = content + '\n' + serverConfig.trim() + '\n';
      fs.writeFileSync(configPath, content.trim() + '\n');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  async removeServer(): Promise<MCPClientResult> {
    const binary = this.findCodexBinary();
    if (binary) {
      const result = spawnSync(binary, ['mcp', 'remove', SERVER_NAME], { stdio: 'ignore' });
      if (!result.error && result.status === 0) {
        return { success: true };
      }
    }
    const configPath = this.getConfigFilePath();
    if (!fs.existsSync(configPath)) {
      return { success: true };
    }
    try {
      let content = fs.readFileSync(configPath, 'utf-8');
      const serverRegex = new RegExp(`\\[mcp_servers\\.${SERVER_NAME}\\][\\s\\S]*?(?=\\n\\[|$)`, 'g');
      content = content.replace(serverRegex, '').trim();
      fs.writeFileSync(configPath, content + '\n');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }
}

export class CodexAppMCPClient extends CodexCLIMCPClient {
  name = 'Codex App';
}

export { CodexCLIMCPClient as CodexMCPClient };
