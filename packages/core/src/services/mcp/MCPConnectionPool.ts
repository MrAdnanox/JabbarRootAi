// packages/core/src/services/mcp/MCPConnectionPool.ts
import { Pool } from 'undici';

export class MCPConnectionPool {
  private pools: Map<string, Pool> = new Map();

  public getPool(baseUrl: string): Pool {
    if (!this.pools.has(baseUrl)) {
      const newPool = new Pool(baseUrl, {
        connections: 50, // Configurable
        keepAliveTimeout: 10 * 1000, // 10 seconds
      });
      this.pools.set(baseUrl, newPool);
    }
    return this.pools.get(baseUrl)!;
  }

  public async closeAll(): Promise<void> {
    for (const pool of this.pools.values()) {
      await pool.close();
    }
    this.pools.clear();
  }
}