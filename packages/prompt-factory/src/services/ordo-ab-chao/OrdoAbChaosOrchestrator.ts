import * as path from 'path';
import { CacheService, ConcurrencyService } from '@jabbarroot/core';
import { GraphBuilderService } from './GraphBuilderService';
import { SemanticAnalysisService } from './SemanticAnalysisService';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisJob, SemanticAnalysisResult } from './types';
import * as crypto from 'crypto';
import { FileContentService } from '@jabbarroot/core'; // Importer si nécessaire

export class OrdoAbChaosOrchestrator {
    private cacheService: CacheService;
    private graphBuilder: GraphBuilderService;
    private semanticAnalyzer: SemanticAnalysisService;
    private readonly concurrencyService: ConcurrencyService;
    private readonly projectRootPath: string;
    private readonly parsersPath: string;
    
    /**
     * Crée une nouvelle instance de l'orchestrateur OrdoAbChaos
     * @param projectRootPath Chemin racine du projet
     * @param concurrencyService Service de concurrence pour exécuter des tâches en parallèle
     * @param parsersPath Chemin vers le répertoire des parsers Tree-sitter
     */
    constructor(
        projectRootPath: string,
        concurrencyService: ConcurrencyService,
        parsersPath: string
    ) {
        this.projectRootPath = projectRootPath;
        this.concurrencyService = concurrencyService;
        this.parsersPath = parsersPath;
        this.cacheService = new CacheService(projectRootPath);
        this.graphBuilder = new GraphBuilderService();
        this.semanticAnalyzer = new SemanticAnalysisService();
    }

    public async runSmokeTest(): Promise<string> {
        console.log('[Orchestrator] Exécution du smoke test...');
        
        const db = this.cacheService.getDbConnection();
        console.log('[Orchestrator] Connexion DB obtenue.');
        
        const parsersPath = path.join(this.projectRootPath, '.jabbarroot', '.jabbarroot_data', 'system', 'parsers');
        console.log(`[Orchestrator] Chemin des parsers déterminé : ${parsersPath}`);
        
        const workerResult = await this.concurrencyService.runTaskInWorker<{ filePath: string }>({
            filePath: "test.js",
            fileContent: "const x = 1;",
            parsersPath: parsersPath
        });
        console.log('[Orchestrator] Résultat du worker obtenu:', workerResult);

        return `Cache OK, Worker a répondu pour ${workerResult.filePath}.`;
    }

    public async runAnalysis(
        projectPath: string, 
        files: { path: string; content: string }[]
    ): Promise<AnalysisJob> {
        const jobId = uuidv4();
        
        // Création du job d'analyse
        await this.cacheService.createAnalysisJob(jobId, projectPath, files.length);

        const analysisConfig = { version: '1.0', parser: 'tree-sitter' }; 
        console.log(`[Orchestrator] Utilisation du chemin des parsers : ${this.parsersPath}`);

        // Traitement parallèle des fichiers
        const analysisPromises = files.map(async (file): Promise<SemanticAnalysisResult | undefined> => {
            const contentHash = crypto.createHash('sha256').update(file.content).digest('hex');
            const signature = crypto.createHash('sha256')
                .update(file.content + JSON.stringify(analysisConfig))
                .digest('hex');
            
            // Vérification du cache
            const cachedResult = await this.cacheService.get<SemanticAnalysisResult>(signature);
            if (cachedResult) {
                return cachedResult;
            }

            // Exécution de l'analyse dans un worker
            const analysisResult = await this.concurrencyService.runTaskInWorker<SemanticAnalysisResult>({
                filePath: file.path,
                fileContent: file.content,
                parsersPath: this.parsersPath
            });

            // Mise en cache du résultat si valide
            if (analysisResult && !analysisResult.error) {
                await this.cacheService.set(
                    signature, 
                    analysisResult, 
                    file.path, 
                    contentHash, 
                    analysisConfig
                );
            }
            
            return analysisResult || undefined;
        });

        // Attente de la fin de toutes les analyses et filtrage des résultats valides
        const results = (await Promise.all(analysisPromises))
            .filter((result): result is SemanticAnalysisResult => !!result && !result.error);
        
        if (results.length === 0 && files.length > 0) {
            console.warn('[Orchestrator] Aucune analyse sémantique valide n\'a pu être effectuée. Tous les fichiers étaient peut-être non supportés.');
        }

        // Construction du graphe de connaissances
        const candidateGraph = this.graphBuilder.buildGraph(results);
        const confidenceScore = this.graphBuilder.calculateConfidenceScore(
            files.length, 
            results.length, 
            []
        );
        
        // Sauvegarde et promotion du graphe
        const graphId = uuidv4();
        await this.cacheService.saveKnowledgeGraph(
            graphId, 
            jobId, 
            projectPath, 
            Buffer.from(JSON.stringify(candidateGraph)), 
            { confidence_score: confidenceScore }
        );
        
        // Promotion du graphe avec vérification du projet
        await this.cacheService.promoteGraph(graphId, projectPath);
        await this.cacheService.completeJob(jobId, confidenceScore);
        
        // Récupération du job final
        const finalJob = await this.cacheService.getJob(jobId);
        
        if (!finalJob) {
            throw new Error(`CRITICAL: Impossible de récupérer le travail d'analyse ${jobId} après sa complétion.`);
        }
        
        return finalJob;
    }
}