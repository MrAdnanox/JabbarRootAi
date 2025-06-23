// packages/core/src/interfaces/IStorage.ts

/**
 * Définit un contrat pour un service de stockage clé-valeur simple et asynchrone.
 */
export interface IStorage {
    get<T>(key: string): Promise<T | undefined>;
    update<T>(key: string, value: T): Promise<void>;
}