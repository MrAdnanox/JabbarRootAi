// packages/core/src/index.ts

// Exporter les services DÉFINIS dans le package 'core'
export { CacheService } from './services/cache/CacheService';
export { ConcurrencyService } from './services/concurrency/ConcurrencyService';
export { SecurityService } from './services/security/SecurityService';
export { CompactionService } from './services/compaction.service';
export { FileContentService } from './services/fileContent.service';
export { StructureGenerationService, type StructureGenerationOptions, type GenerationReport } from './services/structureGeneration.service';
export { BrickConstructorService } from './services/brickConstructor.service';
export { StatisticsService } from './services/statistics.service';
export { ProjectService } from './services/project.service';
export { BrickService } from './services/brick.service';
export { SystemBrickManager } from './services/SystemBrickManager.service';
export { LanguageRegistryService } from './services/registry/language.registry.service';
export { IgnoreService } from './services/ignore.service';

// Exporter les types d'interfaces pour les services 'core'
export { CompactionInput, ICompactor } from './services/compaction/types';