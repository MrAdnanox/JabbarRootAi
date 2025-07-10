// packages/prompt-factory/__tests__/Agora.integration.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as sinon from 'sinon';
import { MCPOrchestrator } from '../src/services/orchestration/MCPOrchestrator.service.js';
import { KnowledgeGraphService } from '../src/services/knowledge/KnowledgeGraph.service.js';
import { MCPClient, MCPServerRegistry } from '@jabbarroot/core';
import { MCPServerConfig } from '@jabbarroot/types';
import { Driver } from 'neo4j-driver';

describe('Project Agora: Full Integration Scenario', () => {
  let orchestrator: MCPOrchestrator;
  let mockMcpClient: sinon.SinonStubbedInstance<MCPClient>;
  let registry: MCPServerRegistry;
  let mockKnowledgeGraphService: sinon.SinonStubbedInstance<KnowledgeGraphService>;

  const localServer: MCPServerConfig = { id: 'local-analyzer', name: 'Local Analyzer', capabilities: ['doc'], priority: 100 } as MCPServerConfig;
  const remoteServer: MCPServerConfig = { id: 'context7-remote', name: 'Context7 Remote', capabilities: ['doc'], priority: 90 } as MCPServerConfig;

  beforeEach(() => {
    registry = new MCPServerRegistry();
    mockMcpClient = sinon.createStubInstance(MCPClient);
    
    // <-- CORRECTION : Création d'un mock plus simple pour KnowledgeGraphService -->
    const mockDriver = {} as Driver;
    const realInstance = new KnowledgeGraphService(mockDriver);
    mockKnowledgeGraphService = sinon.stub(realInstance);

    orchestrator = new MCPOrchestrator(mockMcpClient, registry, mockKnowledgeGraphService);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should successfully execute the final validation scenario', async () => {
    // Augmenter le timeout pour les tests d'intégration
    vi.setConfig({ testTimeout: 10000 });

    // --- 1. Configuration ---
    registry.registerServer(localServer);
    registry.registerServer(remoteServer);

    // --- 4. Gestion de Panne (Configuration du Mock) ---
    const successResponse = { documentation: 'Local doc success' };
    const failureError = new Error('Remote service unavailable');
    
    // Configuration des mocks avec sinon
    (mockMcpClient.call as sinon.SinonStub)
      .withArgs('doc', sinon.match.any, { serverId: localServer.id })
      .resolves(successResponse);
      
    (mockMcpClient.call as sinon.SinonStub)
      .withArgs('doc', sinon.match.any, { serverId: remoteServer.id })
      .rejects(failureError);

    // --- 2. Déclenchement ---
    const result = await orchestrator.query('doc', { topic: 'hset' });

    // --- 5. Résultat (Vérification) ---
    expect(result).toHaveProperty('successful');
    expect(result).toHaveProperty('failed');
    expect(Array.isArray(result.successful)).toBe(true);
    expect(Array.isArray(result.failed)).toBe(true);

    // Vérifications sur les résultats
    expect(result.successful).toHaveLength(1);
    expect(result.failed).toHaveLength(1);
    
    // Vérification des erreurs
    expect(result.failed[0].serverId).toBe(remoteServer.id);

    // --- 7. Persistance (Vérification) ---
    expect(mockKnowledgeGraphService.addResponseNode.calledOnce).toBe(true);
    const [serverArg, , knowledgeNodeArg] = mockKnowledgeGraphService.addResponseNode.firstCall.args;
    expect(serverArg.id).toBe(localServer.id);
    expect(knowledgeNodeArg.properties.content).toBe(successResponse.documentation);
  });
});