// packages/types/src/models/mcp.types.ts

export type AuthStrategyType = 'api-key' | 'oauth2'; // Extensible

export interface AuthConfig {
  strategy: AuthStrategyType;
  // Pour 'api-key', ex: { secretKeyName: 'CONTEXT7_API_KEY' }
  // Pour 'oauth2', ex: { authorizationUrl: '...', tokenUrl: '...' }
  [key: string]: any;
}

export interface MCPServerConfig {
  id: string; // Ex: "context7-prod"
  name: string; // Ex: "Documentation de bibliothèques (Context7)"
  endpoint: string; // URL de base du serveur MCP, ex: "https://mcp.context7.dev"
  auth: AuthConfig;
  capabilities: string[]; // Ex: ["documentation:search", "documentation:fetch"]
  priority: number; // Pour la sélection du meilleur serveur, plus haut = plus prioritaire
  tags: string[]; // Ex: ["typescript", "libraries", "documentation"]
}

export interface MCPServerMetrics {
  serverId: string;
  responseTime: number; // en ms, -1 si jamais appelé
  successRate: number; // 0.0 à 1.0
  lastError?: string;
  lastSuccessfulCall: string; // ISO 8601
  status: 'UP' | 'DOWN' | 'DEGRADED';
}