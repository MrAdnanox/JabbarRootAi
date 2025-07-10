// packages/core/src/services/mcp/MCPClient.service.ts

import { request, Dispatcher } from 'undici';
import { MCPServerRegistry } from './MCPServerRegistry.manager';
import { MCPResponseCache } from './MCPResponseCache';
import { MCPServerConfig } from '@jabbarroot/types';
import { MCPConnectionPool } from './MCPConnectionPool';

interface MCPApiResponse {
  result?: any;
  error?: {
    message: string;
    code?: string | number;
  };
}

/**
 * Le client principal pour interagir avec l'écosystème de serveurs MCP.
 * Orchestre la sélection de serveur, la mise en cache et les appels réseau.
 */
export class MCPClient {
    constructor(
      private readonly registry: MCPServerRegistry,
      private readonly cache: MCPResponseCache,
      private readonly connectionPool: MCPConnectionPool // <-- AJOUT
    ) {}

  /**
   * Appelle le meilleur serveur disponible pour une capacité donnée.
   * @param capability La capacité fonctionnelle requise (ex: "documentation").
   * @param params Les paramètres à envoyer à l'outil du serveur.
   * @param options Options pour forcer le rafraîchissement du cache.
   * @returns Le champ 'result' de la réponse JSON du serveur.
   */
  public async call(
    capability: string,
    params: object,
    options: { forceRefresh?: boolean; serverId?: string } = {} // <-- AJOUT de serverId
  ): Promise<any> {
    // 1. Sélectionner le serveur
    let serverConfig: MCPServerConfig | undefined;
    if (options.serverId) {
      serverConfig = this.registry.getServerConfig(options.serverId);
      if (!serverConfig) throw new Error(`Serveur avec ID '${options.serverId}' non trouvé.`);
    } else {
      serverConfig = this.registry.findBestServer(capability);
    }
    if (!serverConfig) {
      throw new Error(`Aucun serveur MCP disponible pour la capacité : '${capability}'`);
    }

    // 2. Vérifier le cache avant de faire un appel réseau.
    if (!options.forceRefresh) {
      const cachedResponse = this.cache.get(serverConfig.id, capability, params);
      if (cachedResponse) {
        console.log(`[MCPClient] Cache HIT pour ${serverConfig.id}:${capability}`);
        return cachedResponse;
      }
    }
    console.log(`[MCPClient] Cache MISS pour ${serverConfig.id}:${capability}. Appel réseau...`);

    // 3. Exécuter l'appel réseau.
    const startTime = Date.now();
    try {
      // Note : L'URL et le nom de l'outil sont dérivés par convention.
      // Pour l'instant, nous supposons que la capacité est le nom de l'outil.
      const toolName = capability; 
      const response = await this.executeHttpCall(serverConfig, toolName, params);

      const duration = Date.now() - startTime;
      this.registry.updateServerMetrics(serverConfig.id, {
        responseTime: duration, // Pourrait être une moyenne mobile plus tard
        successRate: 1.0, // Logique à affiner
        lastSuccessfulCall: new Date().toISOString(),
        status: 'UP',
      });

      // 4. Mettre le résultat en cache.
      this.cache.set(serverConfig.id, toolName, params, response);

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.registry.updateServerMetrics(serverConfig.id, {
        responseTime: duration,
        successRate: 0.0, // Logique à affiner
        lastError: error instanceof Error ? error.message : String(error),
        status: 'DEGRADED', // Ou 'DOWN' après plusieurs échecs
      });
      throw error; // Relancer l'erreur pour que l'appelant puisse la gérer.
    }
  }

  /**
   * Méthode privée pour gérer l'appel HTTP réel.
   */
  private async executeHttpCall(serverConfig: MCPServerConfig, toolName: string, params: object): Promise<any> {
    // Dériver l'URL de base et le chemin de l'outil
    const baseUrl = 'http://localhost:3000'; // Doit venir de la config à terme
    const path = `/mcp/call/${toolName}`;

    // <-- MODIFICATION : Utilisation du pool de connexions -->
    const pool = this.connectionPool.getPool(baseUrl);

    const { statusCode, body } = await request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ params }),
      dispatcher: pool, // Utilise le pool pour la requête
    });

    const responseBody = await body.json() as MCPApiResponse;

    if (statusCode < 200 || statusCode >= 300) {
      const errorMessage = responseBody.error?.message || `Erreur HTTP ${statusCode}`;
      throw new Error(errorMessage);
    }

    if (!responseBody.result) {
      throw new Error('Réponse du serveur invalide: résultat manquant');
    }

    return responseBody.result;
  }
}