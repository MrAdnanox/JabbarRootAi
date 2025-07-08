import sqlite3 from '@vscode/sqlite3';
import { LRUCache } from 'lru-cache';
import * as path from 'path';
import * as fs from 'fs';

export type JobStatus = 'pending' | 'running' | 'partially_completed' | 'completed' | 'failed' | 'promoted';

export interface AnalysisJob {
    job_id: string;
    project_path: string;
    status: JobStatus;
    confidence_score: number;
    progress_processed: number;
    progress_total: number;
    cache_hit_rate: number;
    avg_time_per_file_ms: number;
    peak_memory_usage_mb: number;
    error_log_json: string | undefined;
    created_at: string;
    completed_at: string | undefined; 
}

export class CacheService {
    private l1Cache: LRUCache<string, any>; 
    private l2Db: sqlite3.Database;         
    
    private dbRun: (sql: string, params?: any[]) => Promise<void>;
    private dbGet: <T>(sql: string, params?: any[]) => Promise<T | undefined>;
    private dbAll: <T>(sql: string, params?: any[]) => Promise<T[]>;
    private dbExec: (sql: string) => Promise<void>;

    constructor(projectRootPath: string, l1CacheSize: number = 500) {
        this.l1Cache = new LRUCache({ max: l1CacheSize });
        const dbPath = path.join(projectRootPath, '.jabbarroot', '.jabbarroot_data', 'cache.sqlite');
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        
        this.l2Db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('[CacheService] Erreur lors de l\'ouverture de la base de données:', err);
                throw err;
            }
        });

        // --- CORRECTION DE LA SYNTAXE DE PROMESSE ---
        this.dbRun = (sql: string, params: any[] = []) => new Promise((resolve, reject) => {
            this.l2Db.run(sql, params, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        this.dbGet = <T>(sql: string, params: any[] = []) => new Promise<T | undefined>((resolve, reject) => {
            this.l2Db.get(sql, params, (err: Error | null, row: T) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        this.dbAll = <T>(sql: string, params: any[] = []) => new Promise<T[]>((resolve, reject) => {
            this.l2Db.all(sql, params, (err: Error | null, rows: T[]) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        this.dbExec = (sql: string) => new Promise<void>((resolve, reject) => {
            this.l2Db.exec(sql, (err: Error | null) => {
                if (err) reject(err);
                else resolve();
            });
        });
        // --- FIN DE LA CORRECTION ---

        this.initDatabase();
        console.log(`[CacheService] Initialisé. L1 (LRU): ${l1CacheSize} items. L2 (SQLite): ${dbPath}`);
    }

    // ... Le reste de la classe reste inchangé ...
    private async initDatabase(): Promise<void> {
        try {
            await this.dbRun('PRAGMA journal_mode = WAL');
            await this.dbExec(DB_SCHEMA);
        } catch (error) {
            console.error('[CacheService] Erreur lors de l\'initialisation de la base de données:', error);
            throw error;
        }
    }
    public async get<T>(key: string): Promise<T | undefined> {
        const l1Result = this.l1Cache.get(key);
        if (l1Result) {
            return l1Result as T;
        }
        try {
            const row = await this.dbGet<{ analysis_result_json: string }>(
                'SELECT analysis_result_json FROM analysis_cache WHERE signature = ?',
                [key]
            );
            if (row) {
                const result = JSON.parse(row.analysis_result_json);
                this.l1Cache.set(key, result);
                return result as T;
            }
        } catch (error) {
            console.error('[CacheService] Erreur lors de la récupération:', error);
        }
        return undefined;
    }
    public async set(key: string, value: any, filePath: string, contentHash: string, config: any): Promise<void> {
        this.l1Cache.set(key, value);
        try {
            await this.dbRun(`
                INSERT OR REPLACE INTO analysis_cache 
                (signature, file_path, file_content_hash, analysis_config_json, analysis_result_json) 
                VALUES (?, ?, ?, ?, ?)
            `, [key, filePath, contentHash, JSON.stringify(config), JSON.stringify(value)]);
        } catch (error) {
            console.error('[CacheService] Erreur lors de la sauvegarde:', error);
        }
    }
    public getDbConnection(): sqlite3.Database {
        return this.l2Db;
    }
    public dispose(): void {
        this.l2Db.close((err) => {
            if (err) {
                console.error('[CacheService] Erreur lors de la fermeture de la base de données:', err);
            } else {
                console.log('[CacheService] Connexion à la base de données fermée.');
            }
        });
    }
    public async createAnalysisJob(jobId: string, projectPath: string, totalFiles: number): Promise<void> {
        const sql = "INSERT INTO analysis_jobs (job_id, project_path, status, progress_total) VALUES (?, ?, 'pending', ?)";
        await this.dbRun(sql, [jobId, projectPath, totalFiles]);
    }

    // AJOUT : Méthode pour mettre à jour le statut d'un job
    public async updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
        const sql = "UPDATE analysis_jobs SET status = ? WHERE job_id = ?";
        await this.dbRun(sql, [status, jobId]);
    }
    public async saveKnowledgeGraph(graphId: string, jobId: string, projectPath: string, graphData: Buffer, metadata: object): Promise<void> {
        const sql = "INSERT INTO knowledge_graphs (graph_id, job_id, project_path, graph_data_blob, metadata_json) VALUES (?, ?, ?, ?, ?)";
        await this.dbRun(sql, [graphId, jobId, projectPath, graphData, JSON.stringify(metadata)]);
    }
    public async promoteGraph(graphId: string, projectPath: string): Promise<void> {
        const demoteSql = "UPDATE knowledge_graphs SET is_promoted = 0 WHERE project_path = ?";
        await this.dbRun(demoteSql, [projectPath]);
        const promoteSql = "UPDATE knowledge_graphs SET is_promoted = 1 WHERE graph_id = ?";
        await this.dbRun(promoteSql, [graphId]);
    }
    public async completeJob(jobId: string, confidenceScore: number): Promise<void> {
        const sql = "UPDATE analysis_jobs SET status = 'promoted', confidence_score = ?, completed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE job_id = ?";
        await this.dbRun(sql, [confidenceScore, jobId]);
    }
    public async getJob(jobId: string): Promise<AnalysisJob | undefined> {
        const sql = "SELECT * FROM analysis_jobs WHERE job_id = ?";
        return this.dbGet(sql, [jobId]);
    }
}

const DB_SCHEMA = `
CREATE TABLE IF NOT EXISTS analysis_jobs (
    job_id TEXT PRIMARY KEY NOT NULL,
    project_path TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'partially_completed', 'completed', 'failed', 'promoted')),
    confidence_score REAL DEFAULT 0.0,
    progress_processed INTEGER DEFAULT 0,
    progress_total INTEGER DEFAULT 0,
    cache_hit_rate REAL DEFAULT 0.0,
    avg_time_per_file_ms REAL DEFAULT 0.0,
    peak_memory_usage_mb REAL DEFAULT 0.0,
    error_log_json TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_jobs_project_path ON analysis_jobs(project_path);
CREATE TABLE IF NOT EXISTS analysis_cache (
    signature TEXT PRIMARY KEY NOT NULL,
    file_path TEXT NOT NULL,
    file_content_hash TEXT NOT NULL,
    analysis_config_json TEXT NOT NULL,
    analysis_result_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE TABLE IF NOT EXISTS knowledge_graphs (
    graph_id TEXT PRIMARY KEY NOT NULL,
    job_id TEXT NOT NULL,
    project_path TEXT NOT NULL,
    is_promoted INTEGER NOT NULL DEFAULT 0,
    graph_data_blob BLOB NOT NULL,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (job_id) REFERENCES analysis_jobs(job_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_promoted_graph_per_project ON knowledge_graphs(project_path) WHERE is_promoted = 1;
`;