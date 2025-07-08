// FICHIER : packages/prompt-factory/src/services/ordo-ab-chao/OrdoAbChaosOrchestrator.ts

import * as path from 'path';
import { CacheService, ConcurrencyService, FileContentService, JabbarProject } from '@jabbarroot/core';
import { GraphBuilderService } from './GraphBuilderService';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisJob, SemanticAnalysisResult } from './types';
import * as crypto from 'crypto';
// CORRECTION : Import du bon type de rapport et de ses sous-types
import { ArchitecturalReportV2 } from '@jabbarroot/types';

export class OrdoAbChaosOrchestrator {
    private cacheService: CacheService;
    private graphBuilder: GraphBuilderService;
    private readonly concurrencyService: ConcurrencyService;
    private readonly fileContentService: FileContentService;
    private readonly parsersPath: string;

    constructor(
        projectRootPath: string,
        concurrencyService: ConcurrencyService,
        fileContentService: FileContentService,
        parsersPath: string
    ) {
        this.concurrencyService = concurrencyService;
        this.fileContentService = fileContentService;
        this.parsersPath = parsersPath;
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
        const analysisConfig = { version: '1.2', parser: 'tree-sitter', source: 'ordo-ab-chao-v2' };
        
        const analysisPromises = Array.from(filesToAnalyze).map(async (filePath: string): Promise<SemanticAnalysisResult | undefined> => {
            const ext = path.extname(filePath).toLowerCase();
            let language: string | null = null;
            if (['.ts', '.tsx'].includes(ext)) language = 'typescript';
            else if (['.js', '.jsx', '.mjs', '.cjs'].includes(ext)) language = 'javascript';
            if (!language) return undefined;

            const fileContent = await this.fileContentService.readFileContent(project.projectRootPath, filePath);
            if (!fileContent) return undefined;

            const contentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
            const signature = crypto.createHash('sha256').update(fileContent + JSON.stringify(analysisConfig)).digest('hex');
            
            const cachedResult = await this.cacheService.get<SemanticAnalysisResult>(signature);
            if (cachedResult) return cachedResult;

            const analysisResult = await this.concurrencyService.runTaskInWorker<SemanticAnalysisResult>({
                filePath: path.join(project.projectRootPath, filePath),
                fileContent: fileContent,
                language: language,
                parsersPath: this.parsersPath
            });
            
            if (analysisResult && !analysisResult.error) {
                await this.cacheService.set(signature, analysisResult, filePath, contentHash, analysisConfig);
            }
            return { ...analysisResult, filePath };
        });

        return (await Promise.all(analysisPromises))
            .filter((result): result is SemanticAnalysisResult => !!result && !result.error);
    }
}