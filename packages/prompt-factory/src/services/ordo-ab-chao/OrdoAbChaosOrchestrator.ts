import * as path from 'path';
import { CacheService, ConcurrencyService, FileContentService, JabbarProject } from '@jabbarroot/core';
import { GraphBuilderService } from './GraphBuilderService';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisJob, SemanticAnalysisResult } from './types';
import * as crypto from 'crypto';
import { ArchitecturalReport } from '../../schemas/ArchitecturalReport.schema';

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

    // ... (runSmokeTest reste inchangé)

    public async runAnalysis(
        project: JabbarProject,
        report: ArchitecturalReport
    ): Promise<AnalysisJob> {
        const jobId = uuidv4();
        const filesToAnalyze = report.keyFiles.map(kf => kf.path);
        await this.cacheService.createAnalysisJob(jobId, project.projectRootPath, filesToAnalyze.length);

        const analysisConfig = { version: '1.2', parser: 'tree-sitter', source: 'ordo-ab-chao-v2' };
        
        const analysisPromises = filesToAnalyze.map(async (filePath): Promise<SemanticAnalysisResult | undefined> => {
            // Déterminer le langage AVANT de lire le fichier pour optimiser
            const ext = path.extname(filePath).toLowerCase();
            let language: string | null = null;
            if (['.ts', '.tsx'].includes(ext)) language = 'typescript';
            else if (['.js', '.jsx', '.mjs', '.cjs'].includes(ext)) language = 'javascript';

            // <-- CORRECTION : La logique de filtrage est maintenant active
            if (!language) {
                console.log(`[Orchestrator] Fichier '${filePath}' skippé de l'analyse sémantique (langage non supporté).`);
                return undefined;
            }

            const fileContent = await this.fileContentService.readFileContent(project.projectRootPath, filePath);
            if (!fileContent) {
                console.warn(`[Orchestrator] Contenu du fichier introuvable pour : ${filePath}`);
                return undefined;
            }

            const contentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
            const signature = crypto.createHash('sha256').update(fileContent + JSON.stringify(analysisConfig)).digest('hex');

            const cachedResult = await this.cacheService.get<SemanticAnalysisResult>(signature);
            if (cachedResult) return cachedResult;
            
            const analysisResult = await this.concurrencyService.runTaskInWorker<SemanticAnalysisResult>({
                filePath: filePath,
                fileContent: fileContent,
                language: language,
                parsersPath: this.parsersPath
            });

            if (analysisResult && !analysisResult.error) {
                await this.cacheService.set(signature, analysisResult, filePath, contentHash, analysisConfig);
            }
            return analysisResult || undefined;
        });

        const validResults = (await Promise.all(analysisPromises))
            .filter((result): result is SemanticAnalysisResult => !!result && !result.error);
        
        const candidateGraph = this.graphBuilder.buildGraph(validResults, report);
        
        const confidenceScore = this.graphBuilder.calculateConfidenceScore(filesToAnalyze.length, validResults.length, []);
        
        const graphId = uuidv4();
        await this.cacheService.saveKnowledgeGraph(graphId, jobId, project.projectRootPath, Buffer.from(JSON.stringify(candidateGraph)), { confidence_score: confidenceScore });
        await this.cacheService.promoteGraph(graphId, project.projectRootPath);
        await this.cacheService.completeJob(jobId, confidenceScore);
        
        const finalJob = await this.cacheService.getJob(jobId);
        if (!finalJob) throw new Error(`CRITICAL: Impossible de récupérer le travail d'analyse ${jobId} après sa complétion.`);
        
        return finalJob;
    }
}