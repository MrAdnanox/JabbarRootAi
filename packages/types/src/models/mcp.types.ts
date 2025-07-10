// packages/types/src/models/mcp.types.ts

export interface MCPServerConfig {
  id: string;
  name: string;
  capabilities: string[];
  priority: number;
  // Note: L'implémentation complète de l'auth et de l'endpoint sera dans une phase ultérieure.
  // Pour l'instant, nous nous concentrons sur la structure.
}

export interface MCPServerMetrics {
  serverId: string;
  responseTime: number;
  successRate: number;
  lastError?: string;
  lastSuccessfulCall: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
}