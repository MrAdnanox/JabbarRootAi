// packages/core/src/services/mcp/MCPServerRegistry.manager.ts

import { ManagedMCPServer, MCPServerConfig, MCPServerMetrics } from '@jabbarroot/types';

/**
 * Le MCPServerRegistry est le répertoire central pour toutes les connaissances
 * sur les serveurs MCP disponibles dans l'écosystème.
 * Il gère trois niveaux d'information :
 * 1. Définitions (ManagedMCPServer): Les "plans" de chaque serveur, chargés au démarrage.
 *    Contient comment lancer un serveur (commande, protocole, etc.).
 * 2. Configurations (MCPServerConfig): Les configurations des serveurs *en cours d'exécution*
 *    qui communiquent via HTTP. Contient l'endpoint (host:port).
 * 3. Métriques (MCPServerMetrics): Les données de santé et de performance de chaque serveur.
 */
export class MCPServerRegistry {
  // Stocke les "plans" de tous les serveurs connus (système et utilisateur).
  private definitions: Map<string, ManagedMCPServer> = new Map();
  
  // Stocke les configurations des serveurs HTTP qui sont actuellement en cours d'exécution.
  private configs: Map<string, MCPServerConfig> = new Map();
  
  // Stocke les métriques de santé pour tous les serveurs.
  private metrics: Map<string, MCPServerMetrics> = new Map();

  /**
   * Enregistre la définition (le plan) d'un serveur.
   * C'est la première étape, appelée par le bootstrapper au démarrage de l'extension.
   * @param definition La définition complète du serveur.
   */
  public registerServerDefinition(definition: ManagedMCPServer): void {
    this.definitions.set(definition.id, definition);
    
    // Initialise les métriques pour ce serveur avec un état 'DOWN'.
    if (!this.metrics.has(definition.id)) {
      this.metrics.set(definition.id, {
        serverId: definition.id,
        responseTime: -1,
        successRate: 1.0, // Commence optimiste
        lastSuccessfulCall: new Date(0).toISOString(),
        status: 'DOWN', // L'état initial est toujours 'DOWN'
      });
    }
  }

  /**
   * Enregistre la configuration d'un serveur HTTP qui est maintenant en cours d'exécution.
   * Appelée après qu'un serveur HTTP a été démarré avec succès.
   * @param config La configuration d'exécution du serveur, incluant son endpoint.
   */
  public registerServer(config: MCPServerConfig): void {
    this.configs.set(config.id, config);
    // Met à jour le statut pour refléter qu'il est maintenant en ligne.
    this.updateServerMetrics(config.id, { status: 'UP' });
  }

  /**
   * Met à jour les métriques de santé d'un serveur.
   * @param serverId L'ID du serveur à mettre à jour.
   * @param newMetrics Les nouvelles données de métriques partielles.
   */
  public updateServerMetrics(serverId: string, newMetrics: Partial<Omit<MCPServerMetrics, 'serverId'>>): void {
    const currentMetrics = this.metrics.get(serverId);
    if (currentMetrics) {
      const updatedMetrics = { ...currentMetrics, ...newMetrics };
      this.metrics.set(serverId, updatedMetrics);
    }
  }

  /**
   * Trouve une définition de serveur par son ID.
   * @param serverId L'ID du serveur.
   */
  public findServerById(serverId: string): ManagedMCPServer | undefined {
    return this.definitions.get(serverId);
  }

  /**
   * Trouve les définitions de tous les serveurs capables de gérer une certaine tâche.
   * C'est le point d'entrée principal pour l'orchestrateur.
   * @param capability La capacité requise (ex: "documentation:search").
   * @returns Un tableau des définitions de serveurs correspondants.
   */
  public findServersByCapability(capability: string): ManagedMCPServer[] {
    // TODO: Implémenter une véritable découverte de capacités. Pour l'instant,
    // on suppose que tous les serveurs enregistrés peuvent potentiellement gérer la capacité.
    // Une future version pourrait appeler une méthode 'mcp.discover' sur chaque serveur
    // au démarrage pour peupler une liste de capacités.
    return Array.from(this.definitions.values());
  }

  /**
   * Récupère la définition complète d'un serveur par son ID.
   * @param serverId L'ID du serveur.
   */
  public getServerDefinition(serverId: string): ManagedMCPServer | undefined {
    return this.definitions.get(serverId);
  }

  /**
   * Récupère la configuration d'exécution d'un serveur HTTP par son ID.
   * @param serverId L'ID du serveur.
   */
  public getServerConfig(serverId: string): MCPServerConfig | undefined {
    return this.configs.get(serverId);
  }

  /**
   * Récupère les métriques de santé d'un serveur par son ID.
   * @param serverId L'ID du serveur.
   */
  public getServerMetrics(serverId: string): MCPServerMetrics | undefined {
    return this.metrics.get(serverId);
  }
}