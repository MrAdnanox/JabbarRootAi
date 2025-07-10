// packages/prompt-factory/src/services/knowledge/KnowledgeGraph.service.ts
import neo4j, { Driver, Session, ManagedTransaction } from 'neo4j-driver';
import { MCPServerConfig } from '@jabbarroot/types';

interface ResponseMetadata {
  responseId: string; // UUID unique pour cette réponse spécifique
}

interface KnowledgeNodeData {
  nodeId: string; // ID unique et stable pour le contenu (ex: doc:redis:hset)
  nodeType: string; // Ex: "Documentation", "CodeSample"
  properties: Record<string, any>; // Les données elles-mêmes
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
          `MERGE (r:MCPResponse {id: $responseId})`,
          { responseId: responseMeta.responseId }
        );

        // 3. Créer/mettre à jour le noeud de connaissance
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
      try {
        await session.close();
      } catch (closeError) {
        console.error('[KnowledgeGraph] Erreur lors de la fermeture de la session :', closeError);
      }
    }
  }

  public async close(): Promise<void> {
    try {
      await this.driver.close();
    } catch (error) {
      console.error('[KnowledgeGraph] Erreur lors de la fermeture du driver Neo4j :', error);
      throw new Error(`Failed to close Neo4j driver: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}