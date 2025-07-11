// packages/core/src/services/mcp/MCPServerRegistry.manager.ts
import { MCPServerConfig, MCPServerMetrics } from '@jabbarroot/types';

export class MCPServerRegistry {
  private configs: Map<string, MCPServerConfig> = new Map();
  private metrics: Map<string, MCPServerMetrics> = new Map();

  // ==================== MÉTHODE PRÉCÉDEMMENT MANQUANTE ====================
  /**
   * Enregistre un nouveau serveur MCP ou met à jour sa configuration.
   * @param config La configuration complète du serveur.
   */
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
  // =====================================================================

  // ==================== MÉTHODE PRÉCÉDEMMENT MANQUANTE ====================
  /**
   * Met à jour les métriques de performance et de santé d'un serveur.
   * @param serverId L'ID du serveur à mettre à jour.
   * @param newMetrics Un objet partiel contenant les nouvelles métriques.
   */
  public updateServerMetrics(serverId: string, newMetrics: Partial<Omit<MCPServerMetrics, 'serverId'>>): void {
    const currentMetrics = this.metrics.get(serverId);
    if (currentMetrics) {
      this.metrics.set(serverId, { ...currentMetrics, ...newMetrics });
    }
  }
  // =====================================================================

  public findBestServer(capability: string): MCPServerConfig | undefined {
    const candidates = this.findServersByCapability(capability);

    if (candidates.length === 0) {
      return undefined;
    }

    candidates.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      const metricsA = this.metrics.get(a.id)!;
      const metricsB = this.metrics.get(b.id)!;
      return metricsA.responseTime - metricsB.responseTime;
    });

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
}