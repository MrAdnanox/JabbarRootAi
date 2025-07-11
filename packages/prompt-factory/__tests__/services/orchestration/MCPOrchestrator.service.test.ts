import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import sinon from 'sinon';
import { MCPOrchestrator } from '../../../src/services/orchestration/MCPOrchestrator.service.js';
import { MCPClient, MCPServerRegistry } from '@jabbarroot/core';
import type { MCPServerConfig } from '@jabbarroot/types';
import { KnowledgeGraphService } from '../../../src/services/knowledge/KnowledgeGraph.service.js';

describe('MCPOrchestrator', () => {
  let orchestrator: MCPOrchestrator;
  let mockMcpClient: sinon.SinonStubbedInstance<MCPClient>;
  let mockRegistry: sinon.SinonStubbedInstance<MCPServerRegistry>;
  let mockKnowledgeGraph: sinon.SinonStubbedInstance<KnowledgeGraphService>;

  const server1: MCPServerConfig = { id: 'server1', name: 'Server One', capabilities: ['doc'], priority: 100 } as MCPServerConfig;
  const server2: MCPServerConfig = { id: 'server2', name: 'Server Two', capabilities: ['doc'], priority: 90 } as MCPServerConfig;

  beforeEach(() => {
    mockMcpClient = sinon.createStubInstance(MCPClient);
    mockRegistry = sinon.createStubInstance(MCPServerRegistry);
    mockKnowledgeGraph = sinon.createStubInstance(KnowledgeGraphService);

    mockRegistry.findServersByCapability.withArgs('doc').returns([server1, server2]);
    mockRegistry.findServersByCapability.withArgs('nonexistent').returns([]);
    mockRegistry.getServerConfig.withArgs('server1').returns(server1);
    mockRegistry.getServerConfig.withArgs('server2').returns(server2);

    orchestrator = new MCPOrchestrator(mockMcpClient, mockRegistry, mockKnowledgeGraph);

  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return an empty result when no servers are found for a capability', async () => {
    const result = await orchestrator.query('nonexistent', {});
    expect(result.successful).to.be.empty;
    expect(result.failed).to.be.empty;
  });

  it('should call all relevant servers and persist successful responses to knowledge graph', async () => {
    // Arrange
    const capability = 'doc:search';
    const params = { query: 'test' };
    const responseFromServer1 = { data: 'response1' };
    const responseFromServer2 = { data: 'response2', documentation: 'This is a doc.' }; // Une réponse avec de la connaissance

    mockRegistry.findServersByCapability.withArgs(capability).returns([server1, server2]);
    mockMcpClient.call.withArgs(capability, params, { serverId: 'server1' }).resolves(responseFromServer1);
    mockMcpClient.call.withArgs(capability, params, { serverId: 'server2' }).resolves(responseFromServer2);
    mockRegistry.getServerConfig.withArgs('server2').returns(server2); // Pour la persistance

    // Act
    const result = await orchestrator.query(capability, params);

    // Assert
    // Vérifie que les appels ont été faits
    expect(result.successful).to.have.lengthOf(2);
    expect(result.failed).to.have.lengthOf(0);
    expect(mockMcpClient.call.callCount).to.equal(2);

    // AJOUTÉ : Vérifie que le service de graphe a été appelé pour la réponse contenant de la "connaissance"
    expect(mockKnowledgeGraph.addResponseNode.calledOnce).to.be.true;
    expect(mockKnowledgeGraph.addResponseNode.getCall(0).args[0]).to.equal(server2);
    expect(mockKnowledgeGraph.addResponseNode.getCall(0).args[1]).to.include({ capability });
    expect(mockKnowledgeGraph.addResponseNode.getCall(0).args[2].nodeType).to.equal('Documentation');
});

  it('should synthesize successful responses correctly', async () => {
    // CORRECTION : Fournir des objets avec la propriété attendue
    mockMcpClient.call.withArgs(sinon.match.any, sinon.match.any, { serverId: 'server1' }).resolves({ documentation: 'Response from Server 1' });
    mockMcpClient.call.withArgs(sinon.match.any, sinon.match.any, { serverId: 'server2' }).resolves({ documentation: 'Response from Server 2' });
    const result = await orchestrator.query('doc', {});
    expect(result.successful).to.have.lengthOf(2);
    expect(result.failed).to.be.empty;
    expect(result.successful).to.deep.include({ serverId: 'server1', response: { documentation: 'Response from Server 1' } });
    expect(result.successful).to.deep.include({ serverId: 'server2', response: { documentation: 'Response from Server 2' } });
  });

  // CORRECTION : Syntaxe du timeout
  it('should handle partial failures gracefully', async () => {
    const failureError = new Error('Server 2 failed');
    // CORRECTION : Fournir un objet avec la propriété attendue
    mockMcpClient.call.withArgs(sinon.match.any, sinon.match.any, { serverId: 'server1' }).resolves({ documentation: 'Response from Server 1' });
    mockMcpClient.call.withArgs(sinon.match.any, sinon.match.any, { serverId: 'server2' }).rejects(failureError);
    
    const result = await orchestrator.query('doc', {});
    
    expect(result.successful).to.have.lengthOf(1);
    expect(result.failed).to.have.lengthOf(1);
    expect(result.successful[0]).to.deep.equal({ serverId: 'server1', response: { documentation: 'Response from Server 1' } });
    expect(result.failed[0].serverId).to.equal('server2');
    // On vérifie que l'erreur est bien une erreur de retry
    expect(result.failed[0].error.message).to.include('Operation failed after 3 attempts');
  }, 10000); // <-- Syntaxe Vitest pour le timeout

  // CORRECTION : Syntaxe du timeout et logique d'assertion
  it('should use a circuit breaker for failing services', async () => {
    const failureError = new Error('Permanent failure');
    mockMcpClient.call.rejects(failureError);

    // On s'attend à ce que les appels échouent à cause du retry
    await expect(orchestrator.query('doc', {})).resolves.toBeDefined(); // 1ère tentative, les breakers sont encore fermés
    await expect(orchestrator.query('doc', {})).resolves.toBeDefined(); // 2ème tentative
    await expect(orchestrator.query('doc', {})).resolves.toBeDefined(); // 3ème tentative, les breakers devraient s'ouvrir

    mockMcpClient.call.resetHistory(); // On réinitialise l'historique des appels

    // 4ème tentative, les appels devraient être bloqués par le circuit breaker
    const result = await orchestrator.query('doc', {});
    
    // Le MCPClient ne devrait pas avoir été appelé car les circuits sont ouverts
    expect(mockMcpClient.call.called).to.be.false;
    expect(result.failed).to.have.lengthOf(2);
    expect(result.failed[0].error.message).to.include('Circuit Breaker is open');
  }, 10000); // <-- Syntaxe Vitest pour le timeout
});