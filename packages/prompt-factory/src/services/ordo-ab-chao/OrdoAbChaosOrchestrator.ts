// FICHIER : packages/prompt-factory/src/services/ordo-ab-chao/OrdoAbChaosOrchestrator.ts

import * as path from 'path';
import { CacheService, ConcurrencyService, FileContentService, JabbarProject } from '@jabbarroot/core';
import { GraphBuilderService } from './GraphBuilderService';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisJob, SemanticAnalysisResult } from './types';
import * as crypto from 'crypto';
// CORRECTION : Import du bon type de rapport et de ses sous-types
import { ArchitecturalReportV2 } from '@jabbarroot/types';
import { LanguageRegistryService } from '@jabbarroot/core';

export class OrdoAbChaosOrchestrator {
    private cacheService: CacheService;
    private graphBuilder: GraphBuilderService;
    private readonly concurrencyService: ConcurrencyService;
    private readonly fileContentService: FileContentService;
    private readonly parsersPath: string;
    private readonly languageRegistry: LanguageRegistryService;

    constructor(
        projectRootPath: string,
        concurrencyService: ConcurrencyService,
        fileContentService: FileContentService,
        parsersPath: string,
        languageRegistry: LanguageRegistryService
    ) {
        this.concurrencyService = concurrencyService;
        this.fileContentService = fileContentService;
        this.parsersPath = parsersPath;
        this.languageRegistry = languageRegistry;
        this.cacheService = new CacheService(projectRootPath);
        this.graphBuilder = new GraphBuilderService();
    }

    public async executePhasedAnalysis(
        project: JabbarProject,
        report: ArchitecturalReportV2,
        filesToAnalyze: Set<string>
    ): Promise<{ jobId: string, graphId: string }> {
        const jobId = uuidv4();
        await this.cacheService.createAnalysisJob(jobId, project.projectRootPath, filesToAnalyze.size);

        const analysisResults = await this.runSemanticAnalysisOnScope(project, filesToAnalyze);

        const candidateGraph = this.graphBuilder.buildGraph(analysisResults, report);
        
        const confidenceScore = this.graphBuilder.calculateConfidenceScore(
            filesToAnalyze.size,
            analysisResults.length,
            []
        );

        const graphId = uuidv4();
        await this.cacheService.saveKnowledgeGraph(
            graphId,
            jobId,
            project.projectRootPath,
            Buffer.from(JSON.stringify(candidateGraph)),
            { confidence_score: confidenceScore }
        );
        
        await this.cacheService.updateJobStatus(jobId, 'completed');

        return { jobId, graphId };
    }

    public async promoteGraph(graphId: string, projectPath: string): Promise<void> {
        await this.cacheService.promoteGraph(graphId, projectPath);
    }

    private async runSemanticAnalysisOnScope(
        project: JabbarProject,
        filesToAnalyze: Set<string>
    ): Promise<SemanticAnalysisResult[]> {
        const analysisConfig = { version: '1.4', parser: 'tree-sitter', source: 'ordo-ab-chao-v2-polyglot-registry' };
        
        const analysisPromises = Array.from(filesToAnalyze).map(async (filePath: string): Promise<SemanticAnalysisResult | undefined> => {
            const ext = path.extname(filePath).toLowerCase();
            const language = this.languageRegistry.getLanguageFromFilename(filePath);
            if (!language) return undefined;

            const parserName = this.languageRegistry.getParserForLanguage(language);
            if (!parserName) {
                console.log(`[Orchestrator] Fichier '${filePath}' skippé (aucun parser sémantique pour le langage : ${language}).`);
                return undefined;
            }
            
            const fileContent = await this.fileContentService.readFileContent(project.projectRootPath, filePath);
            if (!fileContent) return undefined;

            const contentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
            const signature = crypto.createHash('sha256').update(fileContent + JSON.stringify(analysisConfig)).digest('hex');
            
            const cachedResult = await this.cacheService.get<SemanticAnalysisResult>(signature);
            if (cachedResult) return cachedResult;

            const analysisResult = await this.concurrencyService.runTaskInWorker<SemanticAnalysisResult>({
                filePath: path.join(project.projectRootPath, filePath),
                fileContent: fileContent,
                language: parserName,
                parsersPath: this.parsersPath
            });
            
            if (analysisResult && !analysisResult.error) {
                await this.cacheService.set(signature, analysisResult, filePath, contentHash, analysisConfig);
            }
            return { ...analysisResult, filePath };
        });

        // CORRECTION ARCHITECTURALE : Remplacer Promise.all par Promise.allSettled
        const settledResults = await Promise.allSettled(analysisPromises);
        
        const validResults: SemanticAnalysisResult[] = [];
        settledResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                // Si la promesse a réussi et a une valeur, on l'ajoute
                validResults.push(result.value);
            } else if (result.status === 'rejected') {
                // Si la promesse a échoué, on log l'erreur mais on ne stoppe pas le processus
                console.error(`[Orchestrator] Une tâche d'analyse a échoué :`, result.reason);
            }
            // Les cas 'fulfilled' mais avec `undefined` sont simplement ignorés.
        });

        return validResults;
    }
}