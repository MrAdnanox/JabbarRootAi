// packages/prompt-factory/src/services/orchestration/MCPOrchestrator.service.ts
import { MCPServerRegistry, ProcessManagerService, MCPStdioClient } from '@jabbarroot/core';
import { ManagedMCPServer } from '@jabbarroot/types';
import { KnowledgeGraphService } from '../knowledge/KnowledgeGraph.service';

export class MCPOrchestrator {
  private activeClients: Map<string, MCPStdioClient> = new Map();

  constructor(
    private readonly registry: MCPServerRegistry,
    private readonly processManager: ProcessManagerService,
    private readonly knowledgeGraph: KnowledgeGraphService
  ) {}

  private async getClientForServer(server: ManagedMCPServer): Promise<MCPStdioClient> {
    if (this.activeClients.has(server.id)) {
      const client = this.activeClients.get(server.id)!;
      await client.waitForInitialization();
      return client;
    }

    const process = await this.processManager.startServer(server);
    const client = new MCPStdioClient(process, server.id);
    this.activeClients.set(server.id, client);
    
    await client.waitForInitialization();
    
    return client;
  }

  public async query(capability: string, params: object): Promise<any> {
    const servers = this.registry.findServersByCapability(capability);
    if (!servers || servers.length === 0) {
      console.warn(`[MCPOrchestrator] Aucun serveur trouvé pour la capacité : ${capability}`);
      return { successful: [], failed: [] };
    }

    const server = servers[0];
    try {
      const client = await this.getClientForServer(server);
      
      console.log(`[MCPOrchestrator] Appel de l'outil '${capability}' sur le serveur ${server.id} avec les paramètres:`, params);
      
      const response = await client.callTool(capability, params);
      
      console.log(`[MCPOrchestrator] Réponse reçue du serveur ${server.id}:`, response);
      
      return { 
        successful: [{ serverId: server.id, response: response.content || response }], 
        failed: [] 
      };
    } catch (error: any) {
      console.error(`[MCPOrchestrator] Échec de l'appel à ${server.id} pour ${capability}:`, error);
      return { 
        successful: [], 
        failed: [{ serverId: server.id, error: error.message || error }] 
      };
    }
  }

  public async diagnoseServer(serverId: string): Promise<any> {
    try {
      const server = this.registry.findServerById(serverId);
      if (!server) {
        return { error: `Serveur ${serverId} non trouvé dans le registre` };
      }

      const client = await this.getClientForServer(server);
      const tools = client.getAvailableTools();
      
      return {
        serverId: server.id,
        serverName: server.name,
        protocol: server.protocol,
        availableTools: tools,
        status: 'operational'
      };
    } catch (error: any) {
      return {
        serverId,
        error: error.message || error,
        status: 'error'
      };
    }
  }
}