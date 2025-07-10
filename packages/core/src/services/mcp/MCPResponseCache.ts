// packages/core/src/services/mcp/MCPResponseCache.ts

import { LRUCache } from 'lru-cache';

/**
 * Gère un cache en mémoire (L1) pour les réponses des serveurs MCP.
 * Utilise une stratégie LRU (Least Recently Used) pour l'éviction.
 */
export class MCPResponseCache {
  private cache: LRUCache<string, any>;

  /**
   * @param maxSize Le nombre maximum d'éléments à conserver en cache.
   * @param ttl La durée de vie (en millisecondes) d'un élément de cache.
   */
  constructor(maxSize: number = 100, ttl: number = 1000 * 60 * 5) { // 5 minutes par défaut
    this.cache = new LRUCache({
      max: maxSize,
      ttl: ttl,
    });
  }

  /**
   * Génère une clé de cache unique basée sur l'ID du serveur, le nom de l'outil et les paramètres.
   * @param serverId L'ID du serveur.
   * @param toolName Le nom de l'outil appelé.
   * @param params Les paramètres de l'appel.
   * @returns Une chaîne de caractères unique pour la clé de cache.
   */
  private generateKey(serverId: string, toolName: string, params: object): string {
    // La sérialisation JSON stable des paramètres est cruciale pour la cohérence du cache.
    const stableParams = JSON.stringify(Object.keys(params).sort().reduce(
      (obj, key) => { 
        obj[key as keyof typeof params] = params[key as keyof typeof params]; 
        return obj;
      }, 
      {}
    ));
    return `${serverId}:${toolName}:${stableParams}`;
  }

  /**
   * Récupère une réponse depuis le cache.
   * @returns La réponse mise en cache ou `undefined` si elle n'existe pas.
   */
  public get(serverId: string, toolName: string, params: object): any | undefined {
    const key = this.generateKey(serverId, toolName, params);
    return this.cache.get(key);
  }

  /**
   * Ajoute ou met à jour une réponse dans le cache.
   */
  public set(serverId: string, toolName: string, params: object, response: any): void {
    const key = this.generateKey(serverId, toolName, params);
    this.cache.set(key, response);
  }

  /**
   * Invalide une entrée spécifique du cache.
   */
  public invalidate(serverId: string, toolName: string, params: object): void {
    const key = this.generateKey(serverId, toolName, params);
    this.cache.delete(key);
  }

  /**
   * Vide entièrement le cache.
   */
  public clear(): void {
    this.cache.clear();
  }
}