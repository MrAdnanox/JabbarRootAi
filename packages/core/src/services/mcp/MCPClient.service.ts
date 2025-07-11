// packages/core/src/services/mcp/MCPClient.service.ts
import { MCPServerRegistry } from './MCPServerRegistry.manager.js';
import { MCPResponseCache } from './MCPResponseCache.js';
import { MCPConnectionPool } from './MCPConnectionPool.js';
import { MCPServerConfig } from '@jabbarroot/types';
import { MCPAuthService } from './MCPAuth.service.js'; // Ajouter cet import

// Note: L'authentification est laissée en placeholder pour une implémentation future (Tâche 1.2)
// import { MCPAuthService } from './MCPAuth.service.js';

// Placeholder pour la réponse du SDK
interface MCPApiResponse {
  result?: any;
  error?: { message: string };
}

export class MCPClient {
  constructor(
    private readonly registry: MCPServerRegistry,
    private readonly cache: MCPResponseCache,
    private readonly connectionPool: MCPConnectionPool,
    private readonly authService: MCPAuthService
  ) {}

  public async call(
    capability: string,
    params: object,
    options: { forceRefresh?: boolean; serverId?: string } = {}
  ): Promise<any> {
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

    // 1. Vérifier le cache
    if (!options.forceRefresh) {
      const cachedResponse = this.cache.get(serverConfig.id, capability, params);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    const startTime = Date.now();
    try {
      // Le nom de l'outil est la capacité elle-même dans ce modèle simple
      const toolName = capability; 
      
      // 2. Exécuter l'appel
      const response = await this.executeHttpCall(serverConfig, toolName, params);
      
      const duration = Date.now() - startTime;
      this.registry.updateServerMetrics(serverConfig.id, {
        responseTime: duration,
        successRate: 1.0,
        lastSuccessfulCall: new Date().toISOString(),
        status: 'UP',
      });

      // 3. Mettre en cache la réponse
      this.cache.set(serverConfig.id, toolName, params, response);
      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.registry.updateServerMetrics(serverConfig.id, {
        responseTime: duration,
        successRate: 0.0,
        lastError: error instanceof Error ? error.message : String(error),
        status: 'DEGRADED',
      });
      throw error;
    }
  }

  private async executeHttpCall(serverConfig: MCPServerConfig, toolName: string, params: object): Promise<any> {
    const baseUrl = serverConfig.endpoint;
    const path = `/mcp/call/${toolName}`;
    const pool = this.connectionPool.getPool(baseUrl);

    // Obtenir les en-têtes d'authentification
    const authHeaders = await this.authService.getHeaders(serverConfig.auth);
    const headers = {
        'content-type': 'application/json',
        ...authHeaders
    };

    const { statusCode, body } = await pool.request({
      path: path,
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ params }),
    });

    const responseBody = await body.json() as MCPApiResponse;

    if (statusCode < 200 || statusCode >= 300) {
      const errorMessage = responseBody.error?.message || `Erreur HTTP ${statusCode}`;
      throw new Error(errorMessage);
    }
    
    if (typeof responseBody.result === 'undefined') {
        throw new Error('Réponse invalide du serveur : champ "result" manquant.');
    }

    return responseBody.result;
  }
}