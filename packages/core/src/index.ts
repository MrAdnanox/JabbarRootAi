// packages/core/src/index.ts
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
export { MCPClient } from './services/mcp/MCPClient.service';
export { MCPConnectionPool } from './services/mcp/MCPConnectionPool';
export { MCPResponseCache } from './services/mcp/MCPResponseCache';
export { MCPServerRegistry } from './services/mcp/MCPServerRegistry.manager';
export { CompactionInput, ICompactor } from './services/compaction/types';