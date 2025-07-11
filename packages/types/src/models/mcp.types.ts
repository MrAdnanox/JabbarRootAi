// packages/types/src/models/mcp.types.ts

// packages/types/src/models/mcp.types.ts

export type MCPProtocol = 'http' | 'ipc'; // Protocole de communication

export type AuthStrategyType = 'api-key' | 'oauth2' | 'none'; 

export interface AuthConfig {
  strategy: AuthStrategyType;
  secretKeyName?: string; 
  [key: string]: any;
}

export interface RunConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPServerDefinition {
  id: string;
  name: string;
  description: string;
  protocol: MCPProtocol; // Champ obligatoire pour savoir comment parler au serveur
  run: RunConfig;
  auth?: AuthConfig; 
}

export interface MCPServerState {
  enabled: boolean;
}

export interface ManagedMCPServer extends MCPServerDefinition {
  state: MCPServerState;
  type: 'system' | 'user';
}

export interface MCPServerConfig {
  id: string;
  name: string;
  endpoint: string;
  auth?: AuthConfig;
  capabilities?: string[];
  priority: number;
  tags: string[];
}

export interface MCPServerMetrics {
  serverId: string;
  responseTime: number;
  successRate: number;
  lastError?: string;
  lastSuccessfulCall: string;
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'STARTING';
}