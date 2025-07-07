// packages/prompt-factory/src/services/ordo-ab-chao/constants.ts
export const JOB_STATUS = {
    PENDING: 'pending',
    RUNNING: 'running',
    PARTIALLY_COMPLETED: 'partially_completed',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PROMOTED: 'promoted',
} as const;

export const ANALYSIS_SCHEMA_VERSION = '1.0';