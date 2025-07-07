// apps/vscode-extension/src/commands/orchestration/OrdoAbChaos.command.ts
import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../../core/interfaces';
import { OrdoAbChaosOrchestrator, AnalyzerService } from '@jabbarroot/prompt-factory';
import { NotificationService } from '../../services/ui/notification.service';
import { DialogService } from '../../services/ui/dialog.service';
import { GeminiConfigService } from '../../services/config/gemini.config.service';
import { StructureGenerationService } from '@jabbarroot/core';
import { IgnoreService } from '../../services/ignore.service';

export class OrdoAbChaosCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.orchestration.OrdoAbChaos',
        title: 'JabbarRoot: Ordo Ab Chaos - Lancer l\'Analyse Sémantique',
        category: 'jabbarroot' as const,
    };

    // <-- CORRECTION : Dépendances mises à jour pour la nouvelle logique
    public readonly dependencies = [
        'ordoAbChaosOrchestrator',
        'notificationService',
        'dialogService',
        'analyzerService',
        'geminiConfigService',
        'structureGenerationService',
        'ignoreService'
    ] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        const orchestrator = services.get('ordoAbChaosOrchestrator') as OrdoAbChaosOrchestrator;
        const notificationService = services.get('notificationService') as NotificationService;
        const dialogService = services.get('dialogService') as DialogService;
        const analyzerService = services.get('analyzerService') as AnalyzerService;
        const geminiConfigService = services.get('geminiConfigService') as GeminiConfigService;
        const structureService = services.get('structureGenerationService') as StructureGenerationService;
        const ignoreService = services.get('ignoreService') as IgnoreService;

        try {
            const project = await dialogService.showProjectPicker();
            if (!project) {
                notificationService.showInfo('Analyse annulée. Aucun projet sélectionné.');
                return;
            }

            const apiKeyResult = await geminiConfigService.getApiKey();
            if (apiKeyResult.isFailure()) {
                await dialogService.showConfigureApiKeyDialog();
                return;
            }
            const apiKey = apiKeyResult.value;

            await notificationService.withProgress(`Analyse de "${project.name}"`, async (progress) => {
                // <-- CORRECTION : Implémentation de la nouvelle pipeline
                // Étape 1: Analyse Stratégique
                progress.report({ message: 'Phase 1/3 : Analyse architecturale...' });
                const shouldIgnore = await ignoreService.createIgnorePredicate(project);
                const treeReport = await structureService.generate(project.projectRootPath, {
                    maxDepth: 8,
                    shouldIgnore: shouldIgnore
                });
                const fileTree = treeReport?.tree || '';
                const architecturalReport = await analyzerService.analyzeStructureAndPersist(project, fileTree, apiKey);
                
                if (!architecturalReport || !architecturalReport.keyFiles || architecturalReport.keyFiles.length === 0) {
                    notificationService.showWarning("L'analyse architecturale n'a identifié aucun fichier clé. Impossible de continuer.");
                    return;
                }

                // Étape 2 & 3: Planification et Analyse en Profondeur
                progress.report({ message: `Phase 2/3 : Analyse sémantique de ${architecturalReport.keyFiles.length} fichiers clés...` });
                // L'appel utilise maintenant le projet et le rapport, pas une liste de fichiers
                const analysisJob = await orchestrator.runAnalysis(project, architecturalReport);

                // Étape 4: Synthèse (implicite dans runAnalysis)
                progress.report({ message: 'Phase 3/3 : Finalisation du graphe de connaissance...' });
                notificationService.showInfo(`Analyse terminée ! Job ID: ${analysisJob.job_id}, Score de confiance: ${analysisJob.confidence_score.toFixed(2)}`);
            });
        } catch (error) {
            notificationService.showError("La pipeline d'analyse 'Ordo Ab Chaos' a échoué", error);
        }
    }
}
export default new OrdoAbChaosCommand();