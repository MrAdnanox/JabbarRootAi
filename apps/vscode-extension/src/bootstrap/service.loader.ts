// Contenu final pour: apps/vscode-extension/src/bootstrap/service.loader.ts
import { ServiceRegistry } from '../core/di/service.registry';
import { ServiceCollection } from '../core/interfaces';

export function loadServices(registry: ServiceRegistry, existingServices: Partial<ServiceCollection>): void {
  // Le bootstrapper est maintenant la source de vérité pour la création des services.
  // Ce loader ne fait qu'enregistrer les services déjà instanciés.
  // Cela garantit que l'ordre d'initialisation est correct et que les dépendances sont satisfaites.
  
  for (const [name, service] of Object.entries(existingServices)) {
    if (service) {
      registry.register(name as keyof ServiceCollection, service);
    }
  }
}