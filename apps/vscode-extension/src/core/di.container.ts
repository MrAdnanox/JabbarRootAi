// apps/vscode-extension/src/core/di.container.ts
import { IService, ServiceCollection } from './interfaces';

export class DIContainer implements IService {
    private readonly _services = new Map<keyof ServiceCollection, IService>();

    /**
     * Enregistre une instance de service dans le conteneur.
     */
    public register<K extends keyof ServiceCollection>(name: K, service: ServiceCollection[K]): void {
        console.log(`[DIContainer] Registering service: ${name}`);
        this._services.set(name, service);
    }

    /**
     * Résout et retourne une instance de service par son nom.
     * @throws Error si le service n'est pas trouvé.
     */
    public resolve<K extends keyof ServiceCollection>(name: K): ServiceCollection[K] {
        const service = this._services.get(name);
        if (!service) {
            throw new Error(`[DIContainer] Service not found: ${name}`);
        }
        return service as ServiceCollection[K];
    }

    /**
     * Résout et retourne une collection de services.
     */
    public resolveMultiple(names: ReadonlyArray<keyof ServiceCollection>): Map<keyof ServiceCollection, IService> {
        const resolvedServices = new Map<keyof ServiceCollection, IService>();
        for (const name of names) {
            resolvedServices.set(name, this.resolve(name));
        }
        return resolvedServices;
    }

    /**
     * Appelle la méthode dispose() sur tous les services enregistrés qui l'implémentent.
     */
    public dispose(): void {
        console.log('[DIContainer] Disposing all services...');
        for (const service of this._services.values()) {
            if (service.dispose) {
                service.dispose();
            }
        }
        this._services.clear();
    }
}