// packages/core/src/index.ts

// --- Interfaces ---
export * from '../../types/src/interfaces/IConfiguration'
export * from '../../types/src/interfaces/IFileSystem';
export * from '../../types/src/interfaces/IStorage';

// --- Models ---
export * from './models/programmableContext';
export * from './models/contextStats';

// --- Services ---
export * from './services/compaction.service';
export * from './services/fileContent.service';
export * from './services/structureGeneration.service';
export * from './services/contextConstructor.service';