// packages/core/src/services/mcp/MCPServerRegistry.manager.ts
import { MCPServerConfig, MCPServerMetrics } from '@jabbarroot/types';

export class MCPServerRegistry {
  private configs: Map<string, MCPServerConfig> = new Map();
  private metrics: Map<string, MCPServerMetrics> = new Map();

  constructor() {
    // Potentiellement charger les configs depuis un fichier ici
  }

  public registerServer(config: MCPServerConfig): void {
    this.configs.set(config.id, config);
    if (!this.metrics.has(config.id)) {
      this.metrics.set(config.id, {
        serverId: config.id,
        responseTime: -1,
        successRate: 1.0,
        lastSuccessfulCall: new Date(0).toISOString(),
        status: 'UP', 
      });
    }
  }

  public updateServerMetrics(serverId: string, newMetrics: Partial<Omit<MCPServerMetrics, 'serverId'>>): void {
    const currentMetrics = this.metrics.get(serverId);
    if (currentMetrics) {
      this.metrics.set(serverId, { ...currentMetrics, ...newMetrics });
    }
  }

  public findBestServer(capability: string): MCPServerConfig | undefined {
    const candidates = Array.from(this.configs.values()).filter(config => {
      const serverMetrics = this.metrics.get(config.id);
      return (
        config.capabilities.includes(capability) &&
        serverMetrics?.status === 'UP'
      );
    });

    if (candidates.length === 0) {
      return undefined;
    }

    // Tri par priorité (plus haute en premier)
    candidates.sort((a, b) => b.priority - a.priority);
    return candidates[0];
  }
  
  public findServersByCapability(capability: string): MCPServerConfig[] {
    return Array.from(this.configs.values()).filter(config => {
    const serverMetrics = this.metrics.get(config.id);
        return (
            config.capabilities.includes(capability) &&
            serverMetrics?.status === 'UP'
        );
    });
  }

  public getServerConfig(serverId: string): MCPServerConfig | undefined {
    return this.configs.get(serverId);
  }

  public getServerMetrics(serverId: string): MCPServerMetrics | undefined {
    return this.metrics.get(serverId);
  }
  
  public getAllServerIds(): string[] {
    return Array.from(this.configs.keys());
  }
}