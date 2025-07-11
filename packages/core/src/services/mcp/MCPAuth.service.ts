// packages/core/src/services/mcp/MCPAuth.service.ts
import { AuthConfig, ISecureStorage } from '@jabbarroot/types';

type HttpHeaders = Record<string, string>;

export interface IMcpAuthStrategy {
    getHeaders(authConfig: AuthConfig): Promise<HttpHeaders>;
}

// JUSTIFICATION : Nouvelle stratégie qui ne fait rien. Elle retourne simplement
// un objet d'en-têtes vide, ce qui est le comportement correct pour une
// requête non authentifiée.
class NoAuthStrategy implements IMcpAuthStrategy {
    async getHeaders(authConfig: AuthConfig): Promise<HttpHeaders> {
        return {};
    }
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
        // JUSTIFICATION : Enregistrement de la nouvelle stratégie.
        this.strategies.set('none', new NoAuthStrategy());
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