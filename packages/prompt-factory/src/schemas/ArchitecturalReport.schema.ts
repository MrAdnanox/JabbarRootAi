// packages/prompt-factory/src/schemas/ArchitecturalReport.schema.ts
import { z } from 'zod';

const KeyFileSchema = z.object({
  path: z.string().describe("Chemin exact du fichier depuis la racine du projet."),
  justification: z.string().describe("Brève raison de la sélection de ce fichier."),
  priority: z.number().int().min(1).max(5).describe("Priorité de 1 (le plus critique) à 5."),
  category: z.enum([
    "manifest", "entrypoint", "config", "docs", "core", "infra"
  ]).describe("Catégorie fonctionnelle du fichier."),
  role: z.string().describe("Rôle spécifique du fichier (ex: 'définit les dépendances')."),
  impact: z.enum(["critical", "high", "medium", "low"]).describe("Impact du fichier sur le projet.")
});

const StackSchema = z.object({
  primary: z.array(z.string()).describe("Technologies primaires détectées."),
  framework: z.string().describe("Framework principal (ex: 'Next.js', 'Django')."),
  build: z.string().describe("Système de build (ex: 'Webpack', 'pnpm')."),
  deploy: z.string().describe("Pattern de déploiement (ex: 'Vercel', 'Dockerfile').")
});

const MetricsSchema = z.object({
  scale: z.enum(["small", "medium", "large", "enterprise"]).describe("Échelle estimée du projet."),
  distribution: z.enum(["monolith", "modular", "microservices", "serverless"]).describe("Distribution architecturale."),
  maturity: z.enum(["prototype", "dev", "production", "legacy"]).describe("Maturité du projet.")
});

// Schéma pour les statistiques de structure du projet
const ProjectStatsSchema = z.object({
  totalFiles: z.number().describe("Nombre total de fichiers dans le projet."),
  totalDirectories: z.number().describe("Nombre total de répertoires dans le projet."),
  maxDepth: z.number().describe("Profondeur maximale de l'arborescence du projet."),
  filesByExtension: z.record(z.string(), z.number()).describe("Nombre de fichiers par extension."),
  ratios: z.object({
    byExtension: z.record(z.string(), z.number()).describe("Distribution des fichiers par extension (en pourcentage)."),
    testToCodeRatio: z.number().describe("Ratio entre les fichiers de test et les fichiers de code source.")
  }).describe("Ratios et distributions calculés.")
}).describe("Rapport statistique pré-calculé de la structure du projet.");

export const ArchitecturalReportSchema = z.object({
  keyFiles: z.array(KeyFileSchema).min(4).describe("Liste des fichiers les plus importants pour comprendre l'architecture."),
  pattern: z.string().describe("Pattern architectural principal détecté (ex: 'Monorepo', 'MVC')."),
  stack: StackSchema,
  metrics: MetricsSchema,
  confidence: z.number().min(0).max(1).describe("Niveau de confiance de l'analyse, de 0.0 à 1.0."),
  summary: z.string().max(1500).describe("Synthèse de l'analyse (environ 200 mots)."),
  insights: z.array(z.string()).describe("Décisions architecturales importantes."),
  risks: z.array(z.string()).describe("Risques ou préoccupations majeurs."),
  source_statistics: ProjectStatsSchema.optional().describe("Les statistiques brutes utilisées pour générer ce rapport.")
});

export type ArchitecturalReport = z.infer<typeof ArchitecturalReportSchema>;
export type ProjectStructureStats = z.infer<typeof ProjectStatsSchema>;