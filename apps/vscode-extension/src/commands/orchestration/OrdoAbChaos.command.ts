// FICHIER : apps/vscode-extension/src/commands/orchestration/OrdoAbChaos.command.ts

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../../core/interfaces';
import { OrdoAbChaosOrchestrator, AnalyzerService } from '@jabbarroot/prompt-factory';
import { ArchitecturalReportV2, KeyFileV2, JabbarProject } from '@jabbarroot/types';
import { NotificationService } from '../../services/ui/notification.service';
import { DialogService } from '../../services/ui/dialog.service';
import { GeminiConfigService } from '../../services/config/gemini.config.service';
import { StructureGenerationService, BrickService } from '@jabbarroot/core';
import { IgnoreService } from '../../services/ignore.service';

export class OrdoAbChaosCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.orchestration.OrdoAbChaos',
        title: 'JabbarRoot: Ordo Ab Chaos - Lancer l\'Analyse Sémantique',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'ordoAbChaosOrchestrator', 'notificationService', 'dialogService', 'analyzerService',
        'geminiConfigService', 'structureGenerationService', 'ignoreService', 'brickService'
    ] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        // --- DÉPENDANCES ---
        const orchestrator = services.get('ordoAbChaosOrchestrator') as OrdoAbChaosOrchestrator;
        const notificationService = services.get('notificationService') as NotificationService;
        const dialogService = services.get('dialogService') as DialogService;
        const analyzerService = services.get('analyzerService') as AnalyzerService;
        const geminiConfigService = services.get('geminiConfigService') as GeminiConfigService;
        const structureService = services.get('structureGenerationService') as StructureGenerationService;
        const ignoreService = services.get('ignoreService') as IgnoreService;
        const brickService = services.get('brickService') as BrickService;

        try {
            // --- PHASE 0: SETUP ---
            const project = await dialogService.showProjectPicker();
            if (!project) {return notificationService.showInfo('Analyse annulée.');}

            const apiKeyResult = await geminiConfigService.getApiKey();
            if (apiKeyResult.isFailure()) {
                // CORRECTION : Ne pas retourner la valeur de la fonction de dialogue
                await dialogService.showConfigureApiKeyDialog();
                return;
            }
            const apiKey = apiKeyResult.value;

            // --- PHASE 1: ANALYSE ARCHITECTURALE ---
            const architecturalReport = await notificationService.withProgress('Phase 1/3 : Analyse architecturale...', async () => {
                const shouldIgnore = await ignoreService.createIgnorePredicate(project);
                const treeReport = await structureService.generate(project.projectRootPath, { maxDepth: 8, shouldIgnore });
                const fileTree = treeReport?.tree || '';
                return await analyzerService.analyzeStructureAndPersist(project, fileTree, apiKey);
            });

            if (!architecturalReport?.keyFiles?.length) {
                return notificationService.showWarning("L'analyse n'a identifié aucun fichier clé. Impossible de continuer.");
            }

            // --- PHASE 2: SÉLECTION DE LA PORTÉE ---
            const mode = await dialogService.showAnalysisScopePicker();
            if (!mode) {return notificationService.showInfo('Analyse annulée.');}

            let filesToAnalyze: Set<string>;
            switch (mode) {
                case 'surgical':
                    // CORRECTION : Ajout du type explicite pour 'f'
                    filesToAnalyze = new Set(architecturalReport.keyFiles.map((f: KeyFileV2) => f.path));
                    break;
                case 'exploration':
                    const selectedFiles = await dialogService.showBrickMultiPicker(project, brickService);
                    if (!selectedFiles) {return notificationService.showInfo('Analyse annulée.');}
                    filesToAnalyze = new Set(selectedFiles);
                    break;
                case 'exhaustive':
                    const confirmed = await dialogService.showConfirmationDialog({
                        title: 'Confirmer l\'analyse exhaustive ?',
                        detail: 'Cette action analysera tous les fichiers du projet, ce qui peut être très long et coûteux en tokens. Êtes-vous sûr ?',
                        confirmActionLabel: 'Oui, lancer l\'analyse exhaustive'
                    });
                    if (!confirmed) {return notificationService.showInfo('Analyse annulée.');}
                    // Logique pour obtenir tous les fichiers (à implémenter si nécessaire, pour l'instant on simule)
                    const allBricks = await brickService.getBricksByProjectId(project.id);
                    filesToAnalyze = new Set(allBricks.flatMap(b => b.files_scope));
                    break;
            }

            // --- PHASE 3 & 4: ANALYSE SÉMANTIQUE & GÉNÉRATION DU GRAPHE ---
            const { jobId, graphId } = await notificationService.withProgress(`Phase 2/3 : Analyse sémantique de ${filesToAnalyze.size} fichiers...`, async () => {
                // CORRECTION : Conversion explicite du type architecturalReport
                return await orchestrator.executePhasedAnalysis(project, architecturalReport as ArchitecturalReportV2, filesToAnalyze);
            });
            notificationService.showInfo(`Analyse sémantique terminée. Graphe candidat (ID: ${graphId}) généré.`);

            // --- PHASE 5: PROMOTION DU GRAPHE ---
            const promote = await dialogService.showConfirmationDialog({
                title: 'Promouvoir le nouveau graphe ?',
                detail: `Le graphe généré (Job ID: ${jobId}) peut maintenant devenir la version de référence pour ce projet. L'ancienne version sera archivée.`,
                confirmActionLabel: 'Promouvoir ce graphe'
            });

            if (promote) {
                await notificationService.withProgress('Phase 3/3 : Promotion du graphe...', async () => {
                    await orchestrator.promoteGraph(graphId, project.projectRootPath);
                });
                notificationService.showInfoWithActions(
                    'Le nouveau graphe de connaissance est promu et actif !',
                    [{ title: 'Ouvrir le Sanctuaire' }]
                ).then(selection => {
                    if (selection === 'Ouvrir le Sanctuaire') {
                        vscode.commands.executeCommand('jabbarroot.showSanctuary');
                    }
                });
            } else {
                notificationService.showInfo('Le graphe candidat a été sauvegardé mais non promu.');
            }

        } catch (error) {
            notificationService.showError("La pipeline 'Ordo Ab Chaos' a échoué", error);
        }
    }
}
export default new OrdoAbChaosCommand();