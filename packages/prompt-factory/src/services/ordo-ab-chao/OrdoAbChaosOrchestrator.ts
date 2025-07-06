import * as path from 'path';
import { CacheService, ConcurrencyService } from '@jabbarroot/core';
import { GraphBuilderService } from './GraphBuilderService';
import { SemanticAnalysisService } from './SemanticAnalysisService';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisJob, SemanticAnalysisResult } from './types';
import * as crypto from 'crypto';

export class OrdoAbChaosOrchestrator {
    private cacheService: CacheService;
    private graphBuilder: GraphBuilderService;
    private semanticAnalyzer: SemanticAnalysisService;
    private readonly concurrencyService: ConcurrencyService;
    private readonly projectRootPath: string;

    // CORRECTION : Le constructeur reçoit le service comme un paramètre normal
    // et l'assigne explicitement à la propriété de la classe.
    constructor(
        projectRootPath: string,
        concurrencyService: ConcurrencyService
    ) {
        this.projectRootPath = projectRootPath;
        this.concurrencyService = concurrencyService;
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

    // ... le reste de la classe reste inchangé ...
    public async runAnalysis(projectPath: string, filePaths: string[]): Promise<AnalysisJob> {
        const jobId = uuidv4();
        const db = this.cacheService.getDbConnection();
        const createJobStmt = db.prepare("INSERT INTO analysis_jobs (job_id, project_path, status, progress_total) VALUES (?, ?, 'pending', ?)");
        createJobStmt.run(jobId, projectPath, filePaths.length);
        const analysisConfig = { version: '1.0', parser: 'tree-sitter' }; 
        const analysisPromises = filePaths.map(async (filePath): Promise<SemanticAnalysisResult | undefined> => {
            const fileContent = "..."; 
            const contentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
            const signature = crypto.createHash('sha256').update(fileContent + JSON.stringify(analysisConfig)).digest('hex');
            const cachedResult = await this.cacheService.get<SemanticAnalysisResult>(signature);
            if (cachedResult) {
                return cachedResult;
            }
            const parsersPath = path.join(this.projectRootPath, '.jabbarroot', '.jabbarroot_data', 'system', 'parsers');
            const analysisResult = await this.concurrencyService.runTaskInWorker<SemanticAnalysisResult>({
                filePath,
                fileContent,
                parsersPath: parsersPath
            });
            if(analysisResult) {
                await this.cacheService.set(signature, analysisResult, filePath, contentHash, analysisConfig);
            }
            return analysisResult;
        });
        const results = (await Promise.all(analysisPromises)).filter((result): result is SemanticAnalysisResult => result !== undefined);
        if (results.length === 0) {
            throw new Error('Aucune analyse sémantique valide n\'a pu être effectuée');
        }
        const candidateGraph = this.graphBuilder.buildGraph(results);
        const confidenceScore = this.graphBuilder.calculateConfidenceScore(filePaths.length, results.length, []);
        const graphId = uuidv4();
        const saveGraphStmt = db.prepare("INSERT INTO knowledge_graphs (graph_id, job_id, project_path, graph_data_blob, metadata_json) VALUES (?, ?, ?, ?, ?)");
        saveGraphStmt.run(graphId, jobId, projectPath, Buffer.from(JSON.stringify(candidateGraph)), JSON.stringify({ confidence_score: confidenceScore }));
        const promoteStmt = db.prepare("UPDATE knowledge_graphs SET is_promoted = 1 WHERE graph_id = ?");
        promoteStmt.run(graphId);
        const updateJobStmt = db.prepare("UPDATE analysis_jobs SET status = 'promoted', confidence_score = ?, completed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE job_id = ?");
        updateJobStmt.run(confidenceScore, jobId);
        const finalJobStmt = db.prepare("SELECT * FROM analysis_jobs WHERE job_id = ?");
        const job = finalJobStmt.get(jobId);
        if (!job) {
            throw new Error('Impossible de récupérer le travail d\'analyse après sa création');
        }
        return job as unknown as AnalysisJob;
    }
}