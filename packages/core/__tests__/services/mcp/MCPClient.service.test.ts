// packages/core/__tests__/services/mcp/MCPClient.service.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import sinon from 'sinon';
import { MCPClient } from '../../../src/services/mcp/MCPClient.service.js';
import { MCPServerRegistry } from '../../../src/services/mcp/MCPServerRegistry.manager.js';
import { MCPResponseCache } from '../../../src/services/mcp/MCPResponseCache.js';
import { MCPConnectionPool } from '../../../src/services/mcp/MCPConnectionPool.js';
import { MCPServerConfig } from '@jabbarroot/types'; // <-- LIGNE CORRIGÉE/AJOUTÉE
import { Pool } from 'undici';

describe('MCPClient Service', () => {
  let mcpClient: MCPClient;
  let registry: MCPServerRegistry;
  let cache: MCPResponseCache;
  let mockConnectionPool: sinon.SinonStubbedInstance<MCPConnectionPool>;
  let mockUndiciPool: sinon.SinonStubbedInstance<Pool>;
  const server1: MCPServerConfig = { id: 'server1', name: 'Test Server', capabilities: ['test'], priority: 100 } as MCPServerConfig;

  beforeEach(() => {
    registry = new MCPServerRegistry();
    cache = new MCPResponseCache();
    registry.registerServer(server1);
    mockUndiciPool = sinon.createStubInstance(Pool);
    mockConnectionPool = sinon.createStubInstance(MCPConnectionPool);
    mockConnectionPool.getPool.returns(mockUndiciPool);
    mcpClient = new MCPClient(registry, cache, mockConnectionPool);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should update server metrics to UP on successful call', async () => {
    const successResponse = { result: 'OK' };
    mockUndiciPool.request.resolves({
      statusCode: 200,
      body: { json: async () => successResponse }
    } as any);
    await mcpClient.call('test', {});
    const metrics = registry.getServerMetrics('server1');
    expect(metrics?.status).toBe('UP');
  });

  it('should update server metrics to DEGRADED on failed call', async () => {
    const failureResponse = { error: { message: 'Internal Server Error' } };
    mockUndiciPool.request.resolves({
      statusCode: 500,
      body: { json: async () => failureResponse }
    } as any);
    await expect(mcpClient.call('test', {})).rejects.toThrow('Internal Server Error');
    const metrics = registry.getServerMetrics('server1');
    expect(metrics?.status).toBe('DEGRADED');
  });
});