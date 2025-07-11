// packages/core/src/services/mcp/MCPAuth.service.ts
import { AuthConfig, ISecureStorage } from '@jabbarroot/types';

// Utilisation de Headers de 'undici' ou 'node-fetch'
type HttpHeaders = Record<string, string>;

export interface IMcpAuthStrategy {
    getHeaders(authConfig: AuthConfig): Promise<HttpHeaders>;
}

class ApiKeyAuthStrategy implements IMcpAuthStrategy {
    constructor(private readonly secureStorage: ISecureStorage) {}

    async getHeaders(authConfig: AuthConfig): Promise<HttpHeaders> {
        const secretKeyName = authConfig.secretKeyName as string;
        if (!secretKeyName) {
            throw new Error("Configuration d'authentification 'api-key' invalide : 'secretKeyName' manquant.");
        }
        const apiKey = await this.secureStorage.getSecret(secretKeyName);
        if (!apiKey) {
            throw new Error(`Clé API '${secretKeyName}' non trouvée dans le stockage sécurisé.`);
        }
        const headerName = (authConfig.headerName as string) || 'Authorization';
        const headerValue = (authConfig.headerPrefix as string || 'Bearer ') + apiKey;
        return { [headerName]: headerValue };
    }
}

export class MCPAuthService {
    private strategies: Map<string, IMcpAuthStrategy>;

    constructor(secureStorage: ISecureStorage) {
        this.strategies = new Map();
        this.strategies.set('api-key', new ApiKeyAuthStrategy(secureStorage));
    }

    public async getHeaders(authConfig: AuthConfig): Promise<HttpHeaders> {
        const strategy = this.strategies.get(authConfig.strategy);
        if (!strategy) {
            throw new Error(`Stratégie d'authentification non supportée : '${authConfig.strategy}'`);
        }
        return strategy.getHeaders(authConfig);
    }
}