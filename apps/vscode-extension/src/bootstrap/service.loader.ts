import { ServiceRegistry } from '../core/di/service.registry';
import { GeminiConfigService } from '../services/config/gemini.config.service';
import { DialogService } from '../services/ui/dialog.service';
import { ServiceCollection } from '../core/interfaces';
import { NotificationService } from '../services/ui/notification.service';

/**
 * Enregistre tous les services de l'application dans le registre de dépendances.
 * @param registry L'instance du ServiceRegistry.
 * @param existingServices Un objet contenant les services instanciés dans le bootstrapper.
 */
export function loadServices(registry: ServiceRegistry, existingServices: Partial<ServiceCollection>): void {
  // 1. Enregistrer les nouveaux services de l'architecture "Nexus"
  registry.register('geminiConfigService', new GeminiConfigService());
  registry.register('notificationService', new NotificationService());
  
  // Le DialogService dépend du ProjectService, on s'assure qu'il existe.
  if (existingServices.projectService) {
    registry.register('dialogService', new DialogService(existingServices.projectService));
  } else {
    throw new Error('[ServiceLoader] Le ProjectService est requis pour initialiser le DialogService.');
  }

  // 2. Enregistrer tous les services existants pour les rendre accessibles via le registry.
  // C'est la partie qui corrige l'erreur de type.
  if (existingServices.projectService) registry.register('projectService', existingServices.projectService);
  if (existingServices.brickService) registry.register('brickService', existingServices.brickService);
  if (existingServices.brickConstructorService) registry.register('brickConstructorService', existingServices.brickConstructorService);
  if (existingServices.statisticsService) registry.register('statisticsService', existingServices.statisticsService);
  if (existingServices.structureGenerationService) registry.register('structureGenerationService', existingServices.structureGenerationService);
  if (existingServices.fileContentService) registry.register('fileContentService', existingServices.fileContentService);
  if (existingServices.compactionService) registry.register('compactionService', existingServices.compactionService);
  if (existingServices.systemBrickManager) registry.register('systemBrickManager', existingServices.systemBrickManager);
  if (existingServices.ignoreService) registry.register('ignoreService', existingServices.ignoreService);
  if (existingServices.treeDataProvider) registry.register('treeDataProvider', existingServices.treeDataProvider);
  if (existingServices.analyzerService) registry.register('analyzerService', existingServices.analyzerService);
  if (existingServices.documentationService) registry.register('documentationService', existingServices.documentationService);
  if (existingServices.unitTestGeneratorService) registry.register('unitTestGeneratorService', existingServices.unitTestGeneratorService);
  if (existingServices.artefactService) registry.register('artefactService', existingServices.artefactService);
  if (existingServices.genericWorkflowEngine) registry.register('genericWorkflowEngine', existingServices.genericWorkflowEngine);
  if (existingServices.promptTemplateService) registry.register('promptTemplateService', existingServices.promptTemplateService);
  if (existingServices.extensionContext) registry.register('extensionContext', existingServices.extensionContext);
}