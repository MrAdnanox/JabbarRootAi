// packages/types/src/interfaces/IConfiguration.ts

/**
 * Définit une interface pour un fournisseur de configuration,
 * capable de lire des valeurs booléennes et de vérifier si une clé est activée.
 * C'est le contrat pour accéder à des paramètres comme ceux de `package.json`.
 */
export interface IConfiguration {
    /**
     * Récupère une valeur de configuration de type booléen.
     * @param key La clé de la configuration (ex: 'compilation.includeProjectTree').
     * @param defaultValue La valeur à retourner si la clé n'est pas trouvée.
     * @returns La valeur booléenne de la configuration ou la valeur par défaut.
     */
    getBool(key: string, defaultValue: boolean): boolean;
}