import { z } from 'zod';

export const REMOTE_MCP_URL = process.env.BACKANT_MCP_URL || 'https://mcp.backant.io/mcp';
export const LOCAL_MCP_URL = process.env.BACKANT_LOCAL_MCP_URL || 'http://localhost:8000/mcp';

export const DefaultMCPClientConfig = z
  .object({
    mcpServers: z.record(
      z.string(),
      z.union([
        z.object({
          command: z.string().optional(),
          args: z.array(z.string()).optional(),
          env: z.record(z.string(), z.string()).optional(),
        }),
        z.object({
          url: z.string(),
          headers: z.record(z.string(), z.string()).optional(),
        }),
      ]),
    ),
  })
  .passthrough();

export function getRemoteServerConfig(apiKey: string) {
  return {
    url: REMOTE_MCP_URL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  };
}

export function getLocalServerConfig(apiKey: string) {
  return {
    url: LOCAL_MCP_URL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  };
}

export function getDefaultServerConfig(
  apiKey: string,
  mode: 'local' | 'remote',
) {
  if (mode === 'local') {
    return getLocalServerConfig(apiKey);
  }
  return getRemoteServerConfig(apiKey);
}
