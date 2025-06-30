// packages/core/src/models/codex/bricks/analytics/ArchitecturalReport.schema.ts
import { z } from 'zod';

const KeyFileSchema = z.object({
  path: z.string().describe("Chemin exact du fichier depuis la racine du projet."),
  justification: z.string().max(80).describe("Brève raison de la sélection de ce fichier."),
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

export const ArchitecturalReportSchema = z.object({
  keyFiles: z.array(KeyFileSchema).min(4).max(8).describe("Liste des 4 à 8 fichiers les plus importants pour comprendre l'architecture."),
  pattern: z.string().describe("Pattern architectural principal détecté (ex: 'Monorepo', 'MVC')."),
  stack: StackSchema,
  metrics: MetricsSchema,
  confidence: z.number().min(0).max(1).describe("Niveau de confiance de l'analyse, de 0.0 à 1.0."),
  summary: z.string().max(150, "Le résumé ne doit pas dépasser 150 mots.").describe("Synthèse de l'architecture."),
  insights: z.array(z.string()).max(3).describe("Les 3 décisions architecturales les plus importantes."),
  risks: z.array(z.string()).max(2).describe("Les 2 risques ou préoccupations majeurs.")
});

export type ArchitecturalReport = z.infer<typeof ArchitecturalReportSchema>;