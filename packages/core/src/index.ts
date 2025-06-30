// packages/core/src/index.ts

// --- Interfaces ---
export * from '../../types/src/interfaces/IConfiguration'
export * from '../../types/src/interfaces/IFileSystem';
export * from '../../types/src/interfaces/IStorage';

// --- Models ---
export * from './models/programmableContext';
export * from './models/contextStats';
export * from './models/project.types';
export * from './models/compilation.types';

// --- Services ---
// Export sélectif pour éviter les conflits
import { CompactionService } from './services/compaction.service';
import { FileContentService } from './services/fileContent.service';
import { StructureGenerationService, type StructureGenerationOptions } from './services/structureGeneration.service';
import { BrickConstructorService } from './services/brickConstructor.service';
import { StatisticsService } from './services/statistics.service';
import { ProjectService } from './services/project.service';
import { BrickService } from './services/brick.service';
export { CompactionService };
export { FileContentService };
export { StructureGenerationService, type StructureGenerationOptions };
export { BrickConstructorService };
export { StatisticsService };
export { ProjectService };
export { BrickService };
export { CompactionInput, ICompactor } from './services/compaction/types';
export { CompressionLevel } from './models/project.types';
export { BrickContext, JabbarProject } from './models/project.types';
export { BrickCompilationReport } from './models/compilation.types';
export { FileCompilationStats } from './models/compilation.types';
export { GenerationReport } from './services/structureGeneration.service';      
