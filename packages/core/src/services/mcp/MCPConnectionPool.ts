// packages/core/src/services/mcp/MCPConnectionPool.ts

import { Pool } from 'undici';

/**
 * Gère un pool de connexions HTTP/1.1 keep-alive pour un origine donnée.
 * Réutilise les sockets pour réduire la latence des nouvelles requêtes.
 */
export class MCPConnectionPool {
  private pools: Map<string, Pool> = new Map();

  /**
   * Récupère ou crée un pool de connexions pour une URL de base donnée.
   * @param baseUrl L'origine du serveur (ex: "http://localhost:3000").
   * @returns Une instance de Pool undici.
   */
  public getPool(baseUrl: string): Pool {
    if (!this.pools.has(baseUrl)) {
      const newPool = new Pool(baseUrl, {
        connections: 50, // Nombre maximum de connexions simultanées
        keepAliveTimeout: 10 * 1000, // 10 secondes
      });
      this.pools.set(baseUrl, newPool);
    }
    return this.pools.get(baseUrl)!;
  }

  /**
   * Ferme toutes les connexions et nettoie les pools.
   * À appeler lors de l'arrêt de l'application.
   */
  public async closeAll(): Promise<void> {
    for (const pool of this.pools.values()) {
      await pool.close();
    }
    this.pools.clear();
  }
}