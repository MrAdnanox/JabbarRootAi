// packages/prompt-factory/src/services/ordo-ab-chao/GraphBuilderService.ts
// Assemble les résultats partiels en Graphe de Connaissance.
import { SemanticAnalysisResult } from './types';

export class GraphBuilderService {
    constructor() {}

    public buildGraph(analysisResults: SemanticAnalysisResult[]): any {
        // TODO: Implémenter la logique de construction du graphe.
        // Cela impliquerait de créer des noeuds pour chaque fichier/symbole
        // et des arêtes pour les dépendances.
        console.log(`[GraphBuilderService] Construction du graphe à partir de ${analysisResults.length} résultats.`);
        const graph = {
            nodes: [],
            edges: [],
        };
        // ... logique de construction ...
        return graph;
    }

    public calculateConfidenceScore(
        totalFiles: number,
        succeededFiles: number,
        failedFilesInfo: { path: string; isCritical: boolean }[]
    ): number {
        if (totalFiles === 0) return 1.0;

        let baseScore = succeededFiles / totalFiles;
        
        // Pénaliser pour chaque échec critique
        const criticalFailures = failedFilesInfo.filter(f => f.isCritical).length;
        const penalty = criticalFailures * 0.2; // 20% de pénalité par échec critique

        const finalScore = Math.max(0, baseScore - penalty);
        console.log(`[GraphBuilderService] Score de confiance calculé : ${finalScore.toFixed(2)}`);
        return finalScore;
    }
}