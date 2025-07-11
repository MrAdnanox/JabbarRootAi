// packages/prompt-factory/src/services/orchestration/MCPOrchestrator.service.ts

import { MCPClient, MCPServerRegistry } from '@jabbarroot/core';
import { MCPServerConfig } from '@jabbarroot/types';
import { CircuitBreaker } from './resilience/CircuitBreaker';
import { RetryWithBackoff } from './resilience/RetryWithBackoff';
import { KnowledgeGraphService } from '../knowledge/KnowledgeGraph.service';
import { v4 as uuidv4 } from 'uuid';

interface OrchestrationResult {
  successful: { serverId: string; response: any }[];
  failed: { serverId: string; error: Error }[];
}

export class MCPOrchestrator {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(
    private readonly mcpClient: MCPClient,
    private readonly registry: MCPServerRegistry,
    private readonly knowledgeGraph: KnowledgeGraphService
  ) {}

  public async query(capability: string, params: object): Promise<OrchestrationResult> {
    const candidateServers = this.registry.findServersByCapability(capability);

    if (candidateServers.length === 0) {
      console.warn(`[Orchestrator] Aucun serveur trouvé pour la capacité '${capability}'.`);
      return { successful: [], failed: [] };
    }

    const callPromises = candidateServers.map((serverConfig: MCPServerConfig) => {
      if (!this.circuitBreakers.has(serverConfig.id)) {
        this.circuitBreakers.set(serverConfig.id, new CircuitBreaker());
      }
      const breaker = this.circuitBreakers.get(serverConfig.id)!;
      const retry = new RetryWithBackoff();

      const resilientCall = () => retry.execute(() => 
        this.mcpClient.call(capability, params, { serverId: serverConfig.id })
      );

      return breaker.execute(resilientCall)
        .then(response => ({ status: 'fulfilled', value: { serverId: serverConfig.id, response } }))
        .catch(error => ({ status: 'rejected', reason: { serverId: serverConfig.id, error } }));
    });

    const results = await Promise.all(callPromises);
    
    const finalResult = await this.synthesizeResponses(results, capability, params);
    return finalResult;
  }

  private async synthesizeResponses(
    results: any[],
    capability: string,
    params: object
  ): Promise<OrchestrationResult> {
    const finalResult: OrchestrationResult = { successful: [], failed: [] };
    for (const result of results) {
      if (result.status === 'fulfilled') {
        finalResult.successful.push(result.value);
      } else {
        finalResult.failed.push(result.reason);
      }
    }

    // Persister les réponses réussies dans le graphe
    for (const success of finalResult.successful) {
      const serverConfig = this.registry.getServerConfig(success.serverId);
      if (serverConfig && success.response) {
        // Exemple simple : si la réponse contient un champ 'documentation'
        if (success.response.documentation) {
            await this.knowledgeGraph.addResponseNode(
                serverConfig,
                { responseId: uuidv4(), capability, params },
                {
                    nodeId: `doc:${capability}:${JSON.stringify(params)}`,
                    nodeType: 'Documentation',
                    properties: { content: success.response.documentation },
                }
            );
        }
      }
    }

    console.log(`[Orchestrator] Synthèse terminée: ${finalResult.successful.length} succès, ${finalResult.failed.length} échecs.`);
    return finalResult;
  }
}