// packages/prompt-factory/src/services/knowledge/KnowledgeGraph.service.ts
import neo4j, { Driver, Session, ManagedTransaction } from 'neo4j-driver';
import { MCPServerConfig } from '@jabbarroot/types';

// Interfaces pour structurer les données
interface ResponseMetadata {
  responseId: string; // Un UUID pour cette réponse spécifique
  capability: string;
  params: object;
}

interface KnowledgeNodeData {
  nodeId: string; // Un ID stable pour le noeud de connaissance, ex: "doc:typescript:v4.8.0"
  nodeType: string; // Ex: "Documentation", "CodeSample"
  properties: Record<string, any>; // Les données à stocker sur le noeud
}

export class KnowledgeGraphService {
  constructor(private readonly driver: Driver) {}

  public async addResponseNode(
    server: MCPServerConfig,
    responseMeta: ResponseMetadata,
    knowledgeNode: KnowledgeNodeData
  ): Promise<void> {
    const session: Session = this.driver.session();
    try {
      await session.executeWrite(async (tx: ManagedTransaction) => {
        // 1. Assurer l'existence du serveur MCP
        await tx.run(
          `MERGE (s:MCPServer {id: $serverId}) ON CREATE SET s.name = $serverName`,
          { serverId: server.id, serverName: server.name }
        );

        // 2. Créer le noeud de réponse unique
        await tx.run(
          `CREATE (r:MCPResponse {id: $responseId, capability: $capability, params: $params, timestamp: datetime()})`,
          { 
            responseId: responseMeta.responseId,
            capability: responseMeta.capability,
            params: JSON.stringify(responseMeta.params)
          }
        );

        // 3. Assurer l'existence du noeud de connaissance
        await tx.run(
          `MERGE (k:${knowledgeNode.nodeType} {id: $nodeId}) SET k += $properties`,
          { nodeId: knowledgeNode.nodeId, properties: knowledgeNode.properties }
        );

        // 4. Lier le tout
        await tx.run(
          `
            MATCH (s:MCPServer {id: $serverId})
            MATCH (r:MCPResponse {id: $responseId})
            MATCH (k {id: $nodeId})
            MERGE (s)-[:PROVIDES]->(r)
            MERGE (r)-[:ENRICHES]->(k)
          `,
          { serverId: server.id, responseId: responseMeta.responseId, nodeId: knowledgeNode.nodeId }
        );
      });
      console.log(`[KnowledgeGraph] Nœud de réponse ${responseMeta.responseId} et relations créés avec succès.`);
    } catch (error) {
      console.error('[KnowledgeGraph] Échec de l\'écriture dans le graphe :', error);
      throw new Error(`Failed to add response node: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await session.close();
    }
  }

  public async close(): Promise<void> {
    await this.driver.close();
  }
}