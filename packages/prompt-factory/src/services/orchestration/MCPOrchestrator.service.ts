// packages/prompt-factory/src/services/orchestration/MCPOrchestrator.service.ts

import { MCPClient } from '@jabbarroot/core/dist/services/mcp/MCPClient.service.js';
import { MCPServerRegistry } from '@jabbarroot/core/dist/services/mcp/MCPServerRegistry.manager.js';
import { CircuitBreaker } from './resilience/CircuitBreaker.js';
import { RetryWithBackoff } from './resilience/RetryWithBackoff.js';

interface OrchestrationResult {
  successful: { serverId: string; response: any }[];
  failed: { serverId: string; error: Error }[];
}

/**
 * Orchestre les appels aux serveurs MCP en appliquant des stratégies
 * de sélection, de résilience et de synthèse.
 */
export class MCPOrchestrator {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(
    private readonly mcpClient: MCPClient,
    private readonly registry: MCPServerRegistry
  ) {}

  /**
   * Interroge les serveurs pertinents pour une capacité donnée,
   * exécute les appels en parallèle avec résilience, et synthétise les réponses.
   * @param capability La capacité fonctionnelle requise.
   * @param params Les paramètres de l'appel.
   * @returns Un objet contenant les réponses réussies et les échecs.
   */
  public async query(capability: string, params: object): Promise<OrchestrationResult> {
    // 1. Filtrer les serveurs pertinents (pour l'instant, on prend tous ceux qui ont la capacité)
    const candidateServers = this.registry.findServersByCapability(capability);

    if (candidateServers.length === 0) {
      console.warn(`[Orchestrator] Aucun serveur trouvé pour la capacité '${capability}'.`);
      return { successful: [], failed: [] };
    }

    // 2. Préparer et exécuter les appels en parallèle
    const callPromises = candidateServers.map(serverConfig => {
      // Récupère ou crée un disjoncteur pour ce serveur
      if (!this.circuitBreakers.has(serverConfig.id)) {
        this.circuitBreakers.set(serverConfig.id, new CircuitBreaker());
      }
      const breaker = this.circuitBreakers.get(serverConfig.id)!;

      // Crée une instance de politique de réessai pour cet appel spécifique
      const retry = new RetryWithBackoff();

      // Enveloppe l'appel dans la logique de résilience (le "sandwich")
      const resilientCall = () => retry.execute(() => 
        this.mcpClient.call(capability, params, { serverId: serverConfig.id }) // Note: MCPClient devra être adapté
      );

      return breaker.execute(resilientCall)
        .then(response => ({
          status: 'fulfilled',
          value: { serverId: serverConfig.id, response },
        }))
        .catch(error => ({
          status: 'rejected',
          reason: { serverId: serverConfig.id, error },
        }));
    });

    // 3. Attendre que tous les appels soient terminés (succès ou échec)
    const results = await Promise.all(callPromises);

    // 4. Synthétiser les résultats
    return this.synthesizeResponses(results);
  }

  /**
   * Traite les résultats de Promise.all et les sépare en succès et échecs.
   */
  private synthesizeResponses(results: any[]): OrchestrationResult {
    const finalResult: OrchestrationResult = { successful: [], failed: [] };

    for (const result of results) {
      if (result.status === 'fulfilled') {
        finalResult.successful.push(result.value);
      } else {
        finalResult.failed.push(result.reason);
      }
    }

    console.log(`[Orchestrator] Synthèse terminée: ${finalResult.successful.length} succès, ${finalResult.failed.length} échecs.`);
    return finalResult;
  }
}