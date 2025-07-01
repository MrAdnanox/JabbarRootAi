// packages/core/src/services/statistics.service.ts

import { BrickContext, JabbarProject } from '../models/project.types';
import { BrickCompilationReport, FileCompilationStats } from '../models/compilation.types';
import { StructureGenerationOptions } from './structureGeneration.service';
import { CompactionService } from './compaction.service';
import { FileContentService } from './fileContent.service';
import { BrickConstructorService } from './brickConstructor.service';
import * as path from 'path';
import { IFileSystem } from '@jabbarroot/types';

// Configuration du chemin pour le cache de tiktoken
process.env.TIKTOKEN_CACHE_DIR = path.join(__dirname, '..', '..', 'dist');
import { encoding_for_model } from 'tiktoken';
import { getMotivationMessage } from './statistics/statistics.formatter';
import { CompactionInput } from './compaction/types';

export class StatisticsService {
    constructor(
        private readonly fileContentService: FileContentService,
        private readonly compactionService: CompactionService,
        private readonly brickConstructorService: BrickConstructorService,
        private readonly fileSystem: IFileSystem
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

                // Correction architecturale
                const compactionPayload: CompactionInput[] = [{ path: filePath, content: originalContent }];
                const compactedResult = await this.compactionService.compactFiles(compactionPayload);
                const compactedContent = compactedResult[0].content; // On récupère le contenu du premier (et unique) élément

                const originalTokens = encoder.encode(originalContent).length;
                const compressedTokens = encoder.encode(compactedContent).length;
                const originalSize = originalContent.length;
                const compressedSize = compactedContent.length;

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
                    content: compactedContent
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

    public async generateStructureStats(
        projectRootPath: string, 
        shouldIgnore: (path: string) => boolean = () => false
    ): Promise<ProjectStructureStats> {
        // Initialisation des compteurs
        let totalFiles = 0;
        let totalDirectories = 0;
        let maxDepth = 0;
        const filesByExtension: Record<string, number> = {};
        let testFileCount = 0;
        let sourceFileCount = 0;

        // Fonction récursive pour parcourir l'arborescence
        const processDirectory = async (currentPath: string, depth: number) => {
            if (shouldIgnore(currentPath)) {
                return;
            }

            // Mise à jour de la profondeur maximale
            maxDepth = Math.max(maxDepth, depth);

            const entries = await this.fileSystem.readDirectory(currentPath);

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                
                if (shouldIgnore(fullPath)) {
                    continue;
                }

                if (entry.isDirectory) {
                    totalDirectories++;
                    await processDirectory(fullPath, depth + 1);
                } else {
                    totalFiles++;
                    
                    // Analyse de l'extension
                    const ext = path.extname(entry.name).toLowerCase() || '.none';
                    filesByExtension[ext] = (filesByExtension[ext] || 0) + 1;

                    // Détection des fichiers de test
                    if (entry.name.includes('.test.') || 
                        entry.name.includes('.spec.') || 
                        fullPath.includes('/test/') || 
                        fullPath.includes('\\test\\')) {
                        testFileCount++;
                    } else if (ext !== '') { // Ne pas compter les fichiers sans extension comme du code source
                        sourceFileCount++;
                    }
                }
            }
        };

        // Démarrage du traitement
        await processDirectory(projectRootPath, 0);

        // Calcul des ratios
        const totalCount = Object.values(filesByExtension).reduce((a, b) => a + b, 0);
        const byExtension: Record<string, number> = {};
        
        for (const [ext, count] of Object.entries(filesByExtension)) {
            byExtension[ext] = totalCount > 0 ? (count / totalCount) * 100 : 0; // Pourcentage
        }

        const testToCodeRatio = sourceFileCount > 0 
            ? (testFileCount / sourceFileCount) * 100 
            : 0;

        return {
            totalFiles,
            totalDirectories,
            maxDepth,
            filesByExtension,
            ratios: {
                byExtension,
                testToCodeRatio
            }
        };
    }
}

// Interface pour les statistiques de structure de projet
export interface ProjectStructureStats {
    totalFiles: number;
    totalDirectories: number;
    maxDepth: number;
    filesByExtension: Record<string, number>;
    ratios: {
        byExtension: Record<string, number>; // en pourcentage
        testToCodeRatio: number; // en pourcentage
    };
}