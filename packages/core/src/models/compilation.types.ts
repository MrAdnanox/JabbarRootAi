// packages/core/src/models/compilation.types.ts

import { CompressionLevel } from '@jabbarroot/types';

export interface FileCompilationStats {
    filePath: string;
    fileExtension: string;
    originalSize: number;
    compressedSize: number;
    originalTokens: number;
    compressedTokens: number;
    reductionPercent: number;
}

export interface BrickCompilationReport {
    brickName: string;
    compilationLevel: CompressionLevel;
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalOriginalTokens: number;
    totalCompressedTokens: number;
    totalReductionPercent: number;
    fileStats: FileCompilationStats[];
    compiledContent: string;
    motivation: string;
}
