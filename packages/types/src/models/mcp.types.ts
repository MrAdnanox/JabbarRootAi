// packages/types/src/models/mcp.types.ts

/**
 * Configuration statique d'un serveur MCP ("Jabbril").
 * Décrit comment découvrir, gérer et interagir avec un service.
 */
export interface MCPServerConfig {
    /** Identifiant unique du serveur. Ex: "context7-prod" */
    id: string;
  
    /** Nom lisible pour l'affichage. Ex: "Context7 Documentation" */
    name: string;
  
    /** La commande pour lancer le processus serveur (si local). Ex: "node" */
    command: string;
  
    /** Les arguments pour la commande. Ex: ["./dist/server.js"] */
    args: string[];
  
    /** Variables d'environnement à passer au processus. */
    env?: Record<string, string>;
  
    /** Liste des capacités fonctionnelles du serveur. Ex: ["documentation", "code_generation"] */
    capabilities: string[];
  
    /** Priorité de sélection (0-100). Plus le nombre est élevé, plus la priorité est haute. */
    priority: number;
  
    /** Intervalle en secondes pour les vérifications de santé. */
    healthCheckInterval: number;
  
    /** Tags pour un filtrage fin. Ex: ["typescript", "frontend", "paid-service"] */
    tags: string[];
  }
  
  /**
   * Métriques dynamiques et état de santé d'un serveur MCP.
   * Représente l'état observé en temps réel du service.
   */
  export interface MCPServerMetrics {
    /** Lie cette métrique à un serveur configuré. */
    serverId: string;
  
    /** Temps de réponse moyen des derniers appels en millisecondes. */
    responseTime: number;
  
    /** Taux de succès des appels (0.0 à 1.0). */
    successRate: number;
  
    /** Message de la dernière erreur rencontrée. */
    lastError?: string;
  
    /** Date ISO du dernier appel réussi. */
    lastSuccessfulCall: string;
  
    /** État de santé actuel du serveur. */
    status: 'UP' | 'DOWN' | 'DEGRADED';
  }