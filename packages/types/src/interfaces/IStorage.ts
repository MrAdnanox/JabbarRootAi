// packages/types/src/interfaces/IStorage.ts

/**
 * Définit un contrat pour un service de stockage clé-valeur simple et asynchrone.
 */
export interface IStorage {
    get<T>(key: string): Promise<T | undefined>;
    update<T>(key: string, value: T): Promise<void>;
}

/**
 * Définit un contrat pour un service de stockage sécurisé pour les secrets.
 * Les implémentations doivent garantir un stockage chiffré des données sensibles.
 */
export interface ISecureStorage {
    getSecret(key: string): Promise<string | undefined>;
    setSecret(key: string, value: string): Promise<void>;
}