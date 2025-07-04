// apps/vscode-extension/src/core/di/service.registry.ts
import { IService, ServiceCollection } from '../interfaces';

export class ServiceRegistry {
  // Le stockage interne utilise maintenant le type de clé spécifique.
  private services = new Map<keyof ServiceCollection, IService>();

  // La méthode 'register' n'accepte que des clés valides de ServiceCollection.
  public register<K extends keyof ServiceCollection>(name: K, instance: ServiceCollection[K]): void {
    this.services.set(name, instance);
  }

  // La méthode 'get' retourne le type de service exact associé à la clé.
  public get<K extends keyof ServiceCollection>(name: K): ServiceCollection[K] {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`[ServiceRegistry] Service non trouvé : ${name}`);
    }
    return service as ServiceCollection[K];
  }
  
  // Cette méthode est maintenant garantie de retourner une Map avec les bonnes clés.
  public resolveMultiple(names: ReadonlyArray<keyof ServiceCollection>): Map<keyof ServiceCollection, IService> {
    const resolvedServices = new Map<keyof ServiceCollection, IService>();
    for (const name of names) {
        resolvedServices.set(name, this.get(name));
    }
    return resolvedServices;
  }

  public dispose(): void {
    for (const service of this.services.values()) {
      // Vérification dynamique de l'existence de la méthode 'dispose'
      if (service && typeof (service as any).dispose === 'function') {
        (service as any).dispose();
      }
    }
    this.services.clear();
  }
}