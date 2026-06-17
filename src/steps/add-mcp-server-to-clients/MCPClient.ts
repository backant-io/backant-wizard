import * as fs from 'fs';
import * as path from 'path';
import * as jsonc from 'jsonc-parser';
import { getDefaultServerConfig } from './defaults.js';
import type { MCPServerConfig, MCPClientResult } from '../../utils/types.js';
import { debug } from '../../utils/debug.js';

export const SERVER_NAME = 'backant';

export abstract class MCPClient {
  abstract name: string;
  abstract getConfigPath(): Promise<string>;
  abstract getServerPropertyName(): string;
  abstract isClientSupported(): Promise<boolean>;

  docsUrl?: string;
  note?: string;
  usesCLI?: boolean;

  async isServerInstalled(): Promise<boolean> {
    try {
      const configPath = await this.getConfigPath();

      if (!fs.existsSync(configPath)) {
        return false;
      }

      const configContent = await fs.promises.readFile(configPath, 'utf8');
      const config = jsonc.parse(configContent) as Record<string, unknown>;
      const serverProp = this.getServerPropertyName();

      return (
        serverProp in config &&
        typeof config[serverProp] === 'object' &&
        config[serverProp] !== null &&
        SERVER_NAME in (config[serverProp] as Record<string, unknown>)
      );
    } catch {
      return false;
    }
  }

  getServerConfig(apiKey: string, mode: 'local' | 'remote'): MCPServerConfig {
    return getDefaultServerConfig(apiKey, mode);
  }

  async addServer(
    apiKey: string,
    mode: 'local' | 'remote',
  ): Promise<MCPClientResult> {
    try {
      const configPath = await this.getConfigPath();
      const configDir = path.dirname(configPath);

      await fs.promises.mkdir(configDir, { recursive: true });

      const serverProp = this.getServerPropertyName();
      let configContent = '';

      if (fs.existsSync(configPath)) {
        configContent = await fs.promises.readFile(configPath, 'utf8');
      }

      const newServerConfig = this.getServerConfig(apiKey, mode);

      const edits = jsonc.modify(
        configContent,
        [serverProp, SERVER_NAME],
        newServerConfig,
        {
          formattingOptions: {
            tabSize: 2,
            insertSpaces: true,
          },
        },
      );

      const modifiedContent = jsonc.applyEdits(configContent, edits);
      await fs.promises.writeFile(configPath, modifiedContent, 'utf8');

      debug(`Wrote config to ${configPath}`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      debug(`Failed to add server: ${message}`);
      return { success: false, error: message };
    }
  }

  async removeServer(): Promise<MCPClientResult> {
    try {
      const configPath = await this.getConfigPath();

      if (!fs.existsSync(configPath)) {
        return { success: false, error: 'Config file not found' };
      }

      const configContent = await fs.promises.readFile(configPath, 'utf8');
      const serverProp = this.getServerPropertyName();

      const edits = jsonc.modify(
        configContent,
        [serverProp, SERVER_NAME],
        undefined,
        {
          formattingOptions: {
            tabSize: 2,
            insertSpaces: true,
          },
        },
      );

      const modifiedContent = jsonc.applyEdits(configContent, edits);
      await fs.promises.writeFile(configPath, modifiedContent, 'utf8');

      debug(`Removed server from ${configPath}`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }
}
