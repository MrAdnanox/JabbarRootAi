// packages/prompt-factory/src/services/ordo-ab-chao/types.ts
import { z } from 'zod';

export const JobStatusSchema = z.enum(['pending', 'running', 'partially_completed', 'completed', 'failed', 'promoted']);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const AnalysisJobSchema = z.object({
    job_id: z.string().uuid(),
    project_path: z.string(),
    status: JobStatusSchema,
    confidence_score: z.number().min(0).max(1).default(0.0),
    progress_processed: z.number().int().default(0),
    progress_total: z.number().int().default(0),
    cache_hit_rate: z.number().min(0).max(1).default(0.0),
    avg_time_per_file_ms: z.number().default(0.0),
    peak_memory_usage_mb: z.number().default(0.0),
    error_log_json: z.string().optional(), // JSON string
    created_at: z.string().datetime(),
    completed_at: z.string().datetime().optional(),
});
export type AnalysisJob = z.infer<typeof AnalysisJobSchema>;

export const AnalysisCacheEntrySchema = z.object({
    signature: z.string(), // SHA256(file_content + analysis_config)
    file_path: z.string(),
    file_content_hash: z.string(),
    analysis_config_json: z.string(), // JSON string
    analysis_result_json: z.string(), // JSON string
    created_at: z.string().datetime(),
});
export type AnalysisCacheEntry = z.infer<typeof AnalysisCacheEntrySchema>;

export const KnowledgeGraphSchema = z.object({
    graph_id: z.string().uuid(),
    job_id: z.string().uuid(),
    project_path: z.string(),
    is_promoted: z.boolean(),
    graph_data_blob: z.any(), // Représente le BLOB
    metadata_json: z.string().optional(), // JSON string
    created_at: z.string().datetime(),
});
export type KnowledgeGraph = z.infer<typeof KnowledgeGraphSchema>;

// Représente le résultat d'une analyse sémantique sur un seul fichier
export const SemanticAnalysisResultSchema = z.object({
    filePath: z.string(),
    language: z.string().optional(), 
    symbols: z.array(z.object({ 
        name: z.string(), 
        kind: z.string(), 
        isExported: z.boolean(), 
    })).optional(),
    dependencies: z.array(z.string()).optional(),
    error: z.string().optional(),
    stack: z.string().optional() 
});
export type SemanticAnalysisResult = z.infer<typeof SemanticAnalysisResultSchema>;