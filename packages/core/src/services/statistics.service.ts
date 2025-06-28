// packages/core/src/services/statistics.service.ts

import { BrickContext, JabbarProject } from '../models/project.types';
import { BrickCompilationReport, FileCompilationStats } from '../models/compilation.types';
import { StructureGenerationOptions } from './structureGeneration.service';
import { CompactionService } from './compaction.service';
import { FileContentService } from './fileContent.service'; // On a besoin de lire les fichiers
import { BrickConstructorService } from './brickConstructor.service';
import { encoding_for_model } from 'tiktoken';
import * as path from 'path';
import { getMotivationMessage } from './statistics/statistics.formatter';

export class StatisticsService {
    constructor(
        private readonly fileContentService: FileContentService,
        private readonly compactionService: CompactionService,
        private readonly brickConstructorService: BrickConstructorService
    ) {}

    public async generateBrickReport(
        brick: BrickContext,
        project: JabbarProject,
        structureGenOptions: StructureGenerationOptions
    ): Promise<BrickCompilationReport> {
        const fileStats: FileCompilationStats[] = [];
        const compressedFileContents: { filePath: string; content: string }[] = [];
        const determinedCompressionLevel = this.brickConstructorService.resolveCompressionOption(brick.options, project.options);

        // 1. Filtrer les fichiers ignorés
        const shouldIgnore = structureGenOptions.shouldIgnore || (() => false);
        const filesToProcess = brick.files_scope.filter(filePath => !shouldIgnore(filePath));

        // 2. Process each file to gather stats and compressed content
        const encoder = encoding_for_model('gpt-4');
        try {
            for (const filePath of filesToProcess) {
                const originalContent = await this.fileContentService.readFileContent(project.projectRootPath, filePath);
                if (originalContent === null) continue; // Skip if file not readable

                const compressedContent = await this.compactionService.compact(originalContent, determinedCompressionLevel, filePath);

                const originalTokens = encoder.encode(originalContent).length;
                const compressedTokens = encoder.encode(compressedContent).length;
                const originalSize = originalContent.length;
                const compressedSize = compressedContent.length;

                fileStats.push({
                    filePath,
                    fileExtension: path.extname(filePath),
                    originalSize,
                    compressedSize,
                    originalTokens,
                    compressedTokens,
                    reductionPercent: originalSize > 0 ? Math.round(((originalSize - compressedSize) / originalSize) * 100) : 0,
                });
                
                // Stocker le contenu compressé pour l'assemblage final
                compressedFileContents.push({
                    filePath,
                    content: compressedContent
                });
            }
        } catch (error) {
            // Gérer les erreurs
        } finally {
            // Libérer les ressources de l'encodeur
            encoder.free();
        }

        // 2. Aggregate stats
        const totals = fileStats.reduce((acc, stat) => {
            acc.totalOriginalSize += stat.originalSize;
            acc.totalCompressedSize += stat.compressedSize;
            acc.totalOriginalTokens += stat.originalTokens;
            acc.totalCompressedTokens += stat.compressedTokens;
            return acc;
        }, { totalOriginalSize: 0, totalCompressedSize: 0, totalOriginalTokens: 0, totalCompressedTokens: 0 });

        const totalReductionPercent = totals.totalOriginalSize > 0 
            ? Math.round(((totals.totalOriginalSize - totals.totalCompressedSize) / totals.totalOriginalSize) * 100) 
            : 0;
            
        // 3. Assemble the final context string using the simplified BrickConstructorService
        const compiledContent = await this.brickConstructorService.assembleContextFromPreprocessedFiles(
            brick,
            project,
            structureGenOptions,
            compressedFileContents
        );

        return {
            brickName: brick.name,
            compilationLevel: determinedCompressionLevel, // Assigner explicitement
            ...totals,
            totalReductionPercent,
            fileStats,
            compiledContent,
            motivation: getMotivationMessage(totalReductionPercent),
        };
    }
}