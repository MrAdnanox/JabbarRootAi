// FICHIER : packages/types/src/schemas/report.types.ts

import { z } from 'zod';

// Schéma et type pour les statistiques de structure (inchangé)
export const ProjectStructureStatsSchema = z.object({
  totalFiles: z.number(),
  totalDirectories: z.number(),
  maxDepth: z.number(),
  filesByExtension: z.record(z.string(), z.number()),
  ratios: z.object({
    byExtension: z.record(z.string(), z.number()),
    testToCodeRatio: z.number(),
  }),
});
export type ProjectStructureStats = z.infer<typeof ProjectStructureStatsSchema>;

// --- REFORME COMPLÈTE BASÉE SUR LE PROMPT ---

// Schéma et type pour les fichiers clés
export const KeyFileSchema = z.object({
  path: z.string().describe("exact/path/from/root"),
  justification: z.string().describe("Why critical for architecture understanding"),
  priority: z.number().int().min(1).max(5).describe("1-5"), // Zod gère la conversion de string en nombre si possible
  category: z.enum(["manifest", "entrypoint", "config", "docs", "core", "infra"]),
  role: z.string().describe("What file does"),
  impact: z.enum(["critical", "high", "medium", "low"]),
});
export type KeyFileV2 = z.infer<typeof KeyFileSchema>;

// Schéma pour la stack technique
const StackSchema = z.object({
  primary: z.array(z.string()).describe("Primary technologies"),
  framework: z.string().describe("Main framework or None"),
  build: z.string().describe("Build system"),
  deploy: z.string().describe("Deployment pattern"),
});

// Schéma pour les métriques
const MetricsSchema = z.object({
  scale: z.enum(["small", "medium", "large", "enterprise"]),
  distribution: z.enum(["monolith", "modular", "microservices", "serverless"]),
  maturity: z.enum(["prototype", "dev", "production", "legacy"]),
});

// Schéma et type pour le rapport architectural complet
export const ArchitecturalReportSchemaV2 = z.object({
  keyFiles: z.array(KeyFileSchema),
  pattern: z.string().describe("Main architectural pattern"),
  stack: StackSchema,
  metrics: MetricsSchema,
  confidence: z.number().min(0).max(1),
  summary: z.string().max(2000).describe("Concise overview (flexible word count)"), // Limite de caractères très large
  insights: z.array(z.string()).max(3).describe("≤3 key architectural decisions"),
  risks: z.array(z.string()).max(3).describe("≤3 potential concerns"),
  source_statistics: ProjectStructureStatsSchema.optional(),
});
export type ArchitecturalReportV2 = z.infer<typeof ArchitecturalReportSchemaV2>;