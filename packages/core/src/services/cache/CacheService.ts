// packages/core/src/services/cache/CacheService.ts
import sqlite3 from '@vscode/sqlite3';
import { LRUCache } from 'lru-cache';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

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

export class CacheService {
    private l1Cache: LRUCache<string, any>; // Cache en mémoire (L1)
    private l2Db: sqlite3.Database;         // Base de données SQLite (L2)
    private dbAll: Function;
    private dbGet: Function;
    private dbRun: Function;
    private dbExec: Function;

    constructor(projectRootPath: string, l1CacheSize: number = 500) {
        this.l1Cache = new LRUCache({ max: l1CacheSize });

        const dbPath = path.join(projectRootPath, '.jabbarroot_data', 'cache.sqlite');
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });

        this.l2Db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('[CacheService] Erreur lors de l\'ouverture de la base de données:', err);
                throw err;
            }
        });

        // Promisification des méthodes SQLite
        this.dbAll = promisify(this.l2Db.all.bind(this.l2Db));
        this.dbGet = promisify(this.l2Db.get.bind(this.l2Db));
        this.dbRun = promisify(this.l2Db.run.bind(this.l2Db));
        this.dbExec = promisify(this.l2Db.exec.bind(this.l2Db));

        // Initialisation du schéma de la base de données
        this.initDatabase();

        console.log(`[CacheService] Initialisé. L1 (LRU): ${l1CacheSize} items. L2 (SQLite): ${dbPath}`);
    }

    private async initDatabase(): Promise<void> {
        try {
            // Activation du mode WAL pour la haute concurrence
            await this.dbRun('PRAGMA journal_mode = WAL');
            
            // Initialisation du schéma
            await this.dbExec(DB_SCHEMA);
        } catch (error) {
            console.error('[CacheService] Erreur lors de l\'initialisation de la base de données:', error);
            throw error;
        }
    }

    public async get<T>(key: string): Promise<T | undefined> {
        // 1. Tenter de récupérer depuis le cache L1
        const l1Result = this.l1Cache.get(key);
        if (l1Result) {
            return l1Result as T;
        }

        // 2. Si échec, tenter de récupérer depuis le cache L2
        try {
            const row = await this.dbGet(
                'SELECT analysis_result_json FROM analysis_cache WHERE signature = ?',
                [key]
            ) as { analysis_result_json: string } | undefined;

            if (row) {
                const result = JSON.parse(row.analysis_result_json);
                // Mettre à jour le cache L1 avec le résultat du L2
                this.l1Cache.set(key, result);
                return result as T;
            }
        } catch (error) {
            console.error('[CacheService] Erreur lors de la récupération:', error);
        }

        return undefined;
    }

    public async set(key: string, value: any, filePath: string, contentHash: string, config: any): Promise<void> {
        // 1. Mettre à jour le cache L1
        this.l1Cache.set(key, value);

        // 2. Mettre à jour le cache L2
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
}