// packages/core/src/index.ts

// --- Interfaces ---
export * from '../../types/src/interfaces/IConfiguration'
export * from '../../types/src/interfaces/IFileSystem';
export * from '../../types/src/interfaces/IStorage';

// --- Models ---
export * from './models/programmableContext';
export * from './models/contextStats';
export * from './models/project.types';

// --- Services ---
// Export sélectif pour éviter les conflits
export { CompactionService, type ICompactionService } from './services/compaction.service';
export { FileContentService } from './services/fileContent.service';
export { StructureGenerationService, type StructureGenerationOptions } from './services/structureGeneration.service';
export { BrickConstructorService } from './services/brickConstructor.service';
export { StatisticsService } from './services/statistics.service';
export { ProjectService } from './services/project.service';
export { BrickService } from './services/brick.service';
