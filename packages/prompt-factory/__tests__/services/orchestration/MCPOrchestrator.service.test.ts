// packages/prompt-factory/__tests__/services/orchestration/MCPOrchestrator.service.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import sinon from 'sinon';
import { MCPOrchestrator } from '../../../src/services/orchestration/MCPOrchestrator.service.js';
import { MCPServerRegistry, ProcessManagerService } from '@jabbarroot/core';
import type { ManagedMCPServer } from '@jabbarroot/types';
import { KnowledgeGraphService } from '../../../src/services/knowledge/KnowledgeGraph.service.js';
import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';

// JUSTIFICATION : Création d'une fonction pour un mock plus robuste et typé.
const createMockProcess = (): ChildProcess => {
    const process = new EventEmitter() as ChildProcess;
    process.stdin = new EventEmitter() as any;
    process.stdout = new EventEmitter() as any;
    process.stderr = new EventEmitter() as any;
    return process;
};

describe('MCPOrchestrator', () => {
  let orchestrator: MCPOrchestrator;
  let mockProcessManager: sinon.SinonStubbedInstance<ProcessManagerService>;
  let mockRegistry: sinon.SinonStubbedInstance<MCPServerRegistry>;
  let mockKnowledgeGraph: sinon.SinonStubbedInstance<KnowledgeGraphService>;

  const server1: ManagedMCPServer = { 
    id: 'server1', 
    name: 'Server One', 
    protocol: 'ipc',
    run: { command: 'test', args: [] },
    state: { enabled: true },
    type: 'system',
    description: 'A test server'
  };

  beforeEach(() => {
    mockProcessManager = sinon.createStubInstance(ProcessManagerService);
    mockRegistry = sinon.createStubInstance(MCPServerRegistry);
    mockKnowledgeGraph = sinon.createStubInstance(KnowledgeGraphService);

    mockRegistry.findServersByCapability.withArgs('doc').returns([server1]);
    mockRegistry.findServersByCapability.withArgs('nonexistent').returns([]);

    orchestrator = new MCPOrchestrator(mockRegistry, mockProcessManager, mockKnowledgeGraph);
  });

  afterEach(() => {
    sinon.restore();
  });

  // Ce test est maintenant correct car le code ne lève plus d'exception.
  it('should return an empty result when no servers are found for a capability', async () => {
    const result = await orchestrator.query('nonexistent', {});
    expect(result.successful).to.be.empty;
    expect(result.failed).to.be.empty;
  });

  it('should start a process and call it via stdio', async () => {
    // JUSTIFICATION : La capacité utilisée ici doit correspondre exactement
    // à celle configurée dans le mock du 'beforeEach'.
    const capability = 'doc'; 
    const params = { query: 'test' };
    const responseFromServer1 = { data: 'response1' };

    const mockProcess = createMockProcess();
    
    const writeStub = sinon.stub();
    
    mockProcess.stdin!.write = writeStub.callsFake((data, callback) => {
        const request = JSON.parse(data);
        const response = JSON.stringify({ id: request.id, result: responseFromServer1 });
        mockProcess.stdout!.emit('data', Buffer.from(response + '\n'));
        if (callback) callback(null);
        return true;
    });
    
    mockProcessManager.startServer.withArgs(server1).resolves(mockProcess);

    const result = await orchestrator.query(capability, params); // Utilisation de la bonne capacité

    expect(result.successful).to.have.lengthOf(1);
    expect(result.failed).to.have.lengthOf(0);
    expect(result.successful[0].response).to.deep.equal(responseFromServer1);
    expect(mockProcessManager.startServer.calledOnceWith(server1)).to.be.true;
    expect(writeStub.calledOnce).to.be.true;
  });
});