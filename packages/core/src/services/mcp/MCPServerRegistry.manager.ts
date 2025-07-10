// packages/core/src/services/mcp/MCPServerRegistry.manager.ts

import { MCPServerConfig, MCPServerMetrics } from '@jabbarroot/types';

/**
 * Gère l'enregistrement, l'état et la sélection des serveurs MCP.
 * C'est l'annuaire central de tous les services fédérés.
 */
export class MCPServerRegistry {
  private configs: Map<string, MCPServerConfig> = new Map();
  private metrics: Map<string, MCPServerMetrics> = new Map();
  // Le health checker sera activé dans une étape ultérieure.
  // private healthCheckTimer?: NodeJS.Timeout;

  constructor() {
    // Dans une future implémentation, on chargerait les configs depuis un fichier.
  }

  /**
   * Enregistre un nouveau serveur ou met à jour sa configuration.
   */
  public registerServer(config: MCPServerConfig): void {
    this.configs.set(config.id, config);
    // Initialise les métriques si elles n'existent pas.
    if (!this.metrics.has(config.id)) {
      this.metrics.set(config.id, {
        serverId: config.id,
        responseTime: -1,
        successRate: 1.0,
        lastSuccessfulCall: new Date(0).toISOString(),
        status: 'UP', // Optimiste par défaut
      });
    }
  }

  /**
   * Met à jour les métriques d'un serveur.
   */
  public updateServerMetrics(serverId: string, newMetrics: Partial<Omit<MCPServerMetrics, 'serverId'>>): void {
    const currentMetrics = this.metrics.get(serverId);
    if (currentMetrics) {
      this.metrics.set(serverId, { ...currentMetrics, ...newMetrics });
    }
  }

  /**
   * Trouve le meilleur serveur disponible pour une capacité donnée.
   * La logique de sélection est basée sur la capacité, le statut et la priorité.
   * @param capability La capacité fonctionnelle requise (ex: "documentation").
   * @returns La configuration du meilleur serveur ou `undefined`.
   */
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

    // Trie les candidats par priorité (la plus haute d'abord).
    candidates.sort((a, b) => b.priority - a.priority);

    return candidates[0];
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

  public findServersByCapability(capability: string): MCPServerConfig[] {
    return Array.from(this.configs.values()).filter(config => {
    const serverMetrics = this.metrics.get(config.id);
        return (
            config.capabilities.includes(capability) &&
            serverMetrics?.status === 'UP'
        );
    });
  }

  // La logique de health check sera ajoutée ici.
  // public startHealthChecks(client: MCPClient): void { ... }
  // public stopHealthChecks(): void { ... }
}