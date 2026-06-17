export interface WizardOptions {
  debug?: boolean;
  local?: boolean;
  ci?: boolean;
}

export type MCPServerConfig = Record<string, unknown>;

export interface MCPClientResult {
  success: boolean;
  error?: string;
}
