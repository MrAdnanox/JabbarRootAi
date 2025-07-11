// packages/core/__tests__/services/mcp/MCPClient.service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as sinon from 'sinon';
import { MCPClient } from '../../../src/services/mcp/MCPClient.service';
import { MCPServerRegistry } from '../../../src/services/mcp/MCPServerRegistry.manager';
import { MCPResponseCache } from '../../../src/services/mcp/MCPResponseCache';
import { MCPConnectionPool } from '../../../src/services/mcp/MCPConnectionPool';
import { MCPAuthService } from '../../../src/services/mcp/MCPAuth.service'; // AJOUTÉ : Import du service à mocker
import { MCPServerConfig } from '@jabbarroot/types';

describe('MCPClient Service', () => {
    let client: MCPClient;
    let registry: sinon.SinonStubbedInstance<MCPServerRegistry>;
    let cache: sinon.SinonStubbedInstance<MCPResponseCache>;
    let pool: sinon.SinonStubbedInstance<MCPConnectionPool>;
    let authService: sinon.SinonStubbedInstance<MCPAuthService>; // AJOUTÉ : Déclaration du mock

    const mockServerConfig: MCPServerConfig = {
        id: 'test-server',
        name: 'Test Server',
        endpoint: 'http://localhost:8080',
        auth: { strategy: 'api-key', secretKeyName: 'TEST_KEY' },
        capabilities: ['test:capability'],
        priority: 1,
        tags: []
    };

    beforeEach(() => {
        registry = sinon.createStubInstance(MCPServerRegistry);
        cache = sinon.createStubInstance(MCPResponseCache);
        pool = sinon.createStubInstance(MCPConnectionPool);
        authService = sinon.createStubInstance(MCPAuthService); // AJOUTÉ : Instanciation du mock

        // Configuration par défaut des mocks
        registry.findBestServer.returns(mockServerConfig);
        cache.get.returns(undefined);
        // AJOUTÉ : Comportement par défaut pour le mock d'authentification
        authService.getHeaders.resolves({ 'Authorization': 'Bearer test-token' });

        const mockPoolRequest = { request: sinon.stub() };
        pool.getPool.returns(mockPoolRequest as any);

        // MODIFIÉ : Le constructeur inclut maintenant le mock du service d'authentification
        client = new MCPClient(registry, cache, pool, authService);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should update server metrics to UP on successful call', async () => {
        // Arrange
        const mockPool = pool.getPool(mockServerConfig.endpoint) as any;
        mockPool.request.resolves({
            statusCode: 200,
            body: { json: () => Promise.resolve({ result: { success: true } }) }
        });

        // Act
        await client.call('test:capability', {});

        // Assert
        expect(registry.updateServerMetrics.calledOnceWith('test-server', sinon.match({
            status: 'UP',
            successRate: 1.0
        }))).to.be.true;
    });

    it('should update server metrics to DEGRADED on failed call', async () => {
        // Arrange
        const mockPool = pool.getPool(mockServerConfig.endpoint) as any;
        const networkError = new Error('Network Error');
        mockPool.request.rejects(networkError);

        // Act & Assert
        await expect(client.call('test:capability', {})).rejects.toThrow(networkError);
        
        expect(registry.updateServerMetrics.calledOnceWith('test-server', sinon.match({
            status: 'DEGRADED',
            successRate: 0.0,
            lastError: 'Network Error'
        }))).to.be.true;
    });
});