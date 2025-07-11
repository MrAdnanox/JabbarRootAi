// packages/core/src/services/mcp/MCPResponseCache.ts
import { LRUCache } from 'lru-cache';

export class MCPResponseCache {
  private cache: LRUCache<string, any>;

  constructor(maxSize: number = 100, ttl: number = 1000 * 60 * 5) { // 5 minutes TTL
    this.cache = new LRUCache({
      max: maxSize,
      ttl: ttl,
    });
  }

  private generateKey(serverId: string, toolName: string, params: object): string {
    // Trie les clés des paramètres pour une clé de cache stable
    const stableParams = JSON.stringify(Object.keys(params).sort().reduce(
      (obj, key) => { 
        obj[key as keyof typeof params] = params[key as keyof typeof params]; 
        return obj;
      }, 
      {}
    ));
    return `${serverId}:${toolName}:${stableParams}`;
  }

  public get(serverId: string, toolName: string, params: object): any | undefined {
    const key = this.generateKey(serverId, toolName, params);
    return this.cache.get(key);
  }

  public set(serverId: string, toolName: string, params: object, response: any): void {
    const key = this.generateKey(serverId, toolName, params);
    this.cache.set(key, response);
  }
}