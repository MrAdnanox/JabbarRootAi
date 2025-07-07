// packages/core/src/index.ts

// --- Interfaces ---
export * from '@jabbarroot/types';

// --- Models ---
export * from './models/programmableContext';
export * from './models/contextStats';
export * from './models/project.types';
export * from './models/compilation.types';

// --- Services ---
// Exporter directement les services
import { CacheService } from './services/cache/CacheService';
import { ConcurrencyService } from './services/concurrency/ConcurrencyService';
import { SecurityService } from './services/security/SecurityService';
export { CacheService, ConcurrencyService, SecurityService };

// --- Services ---
import { CompactionService } from './services/compaction.service';
import { FileContentService } from './services/fileContent.service';
import { StructureGenerationService, type StructureGenerationOptions } from './services/structureGeneration.service';
import { BrickConstructorService } from './services/brickConstructor.service';
import { StatisticsService } from './services/statistics.service';
import { ProjectService } from './services/project.service';
import { BrickService } from './services/brick.service';
import { SystemBrickManager } from './services/SystemBrickManager.service';
export { CompactionService };
export { FileContentService };
export { StructureGenerationService, type StructureGenerationOptions };
export { BrickConstructorService };
export { StatisticsService };
export { ProjectService };
export { BrickService };
export { SystemBrickManager };
export { CompactionInput, ICompactor } from './services/compaction/types';
export { CompressionLevel, BrickContextOptions } from './models/project.types';
export { BrickContext, JabbarProject } from './models/project.types';
export { BrickCompilationReport } from './models/compilation.types';
export { FileCompilationStats } from './models/compilation.types';
export { GenerationReport } from './services/structureGeneration.service';      


