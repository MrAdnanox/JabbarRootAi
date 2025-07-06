import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../../core/interfaces';
import { OrdoAbChaosOrchestrator } from '@jabbarroot/prompt-factory';
import { NotificationService } from '../../services/ui/notification.service';
import { DialogService } from '../../services/ui/dialog.service';
import { IgnoreService } from '../../services/ignore.service';
import { getFilesRecursively } from '../../utils/workspace';
// AJOUT : Importer le service de contenu de fichier
import { FileContentService } from '@jabbarroot/core';

export class OrdoAbChaosCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.orchestration.OrdoAbChaos',
        title: 'JabbarRoot: Ordo Ab Chaos - Lancer l\'Analyse Sémantique',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'ordoAbChaosOrchestrator',
        'notificationService',
        'dialogService',
        'ignoreService',
        // AJOUT : Déclarer la dépendance
        'fileContentService'
    ] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        const orchestrator = services.get('ordoAbChaosOrchestrator') as OrdoAbChaosOrchestrator;
        const notificationService = services.get('notificationService') as NotificationService;
        const dialogService = services.get('dialogService') as DialogService;
        const ignoreService = services.get('ignoreService') as IgnoreService;
        // AJOUT : Obtenir le service
        const fileContentService = services.get('fileContentService') as FileContentService;

        try {
            const project = await dialogService.showProjectPicker();
            if (!project) {
                notificationService.showInfo('Analyse annulée. Aucun projet sélectionné.');
                return;
            }

            await notificationService.withProgress(`Analyse sémantique de "${project.name}"`, async (progress) => {
                progress.report({ message: 'Préparation de l\'analyse...' });

                const projectRootUri = vscode.Uri.file(project.projectRootPath);
                const shouldIgnore = await ignoreService.createIgnorePredicate(project);
                
                progress.report({ message: 'Scan des fichiers du projet...' });
                const allFilesUris = await getFilesRecursively(projectRootUri, shouldIgnore, project.projectRootPath);
                
                if (allFilesUris.length === 0) {
                    notificationService.showWarning('Aucun fichier à analyser dans le projet.');
                    return;
                }

                progress.report({ message: `Lecture du contenu de ${allFilesUris.length} fichiers...` });
                // CORRECTION : Lire le contenu des fichiers ici
                const filesWithContent = await Promise.all(
                    allFilesUris.map(async (uri) => {
                        const relativePath = vscode.workspace.asRelativePath(uri, false);
                        const content = await fileContentService.readFileContent(project.projectRootPath, relativePath);
                        return { path: uri.fsPath, content: content || '' };
                    })
                );

                progress.report({ message: `Analyse de ${filesWithContent.length} fichiers...` });
                // CORRECTION : Passer la nouvelle structure de données à l'orchestrateur
                const analysisJob = await orchestrator.runAnalysis(project.projectRootPath, filesWithContent);
                
                notificationService.showInfo(`Analyse terminée ! Job ID: ${analysisJob.job_id}, Score de confiance: ${analysisJob.confidence_score}`);
            });

        } catch (error) {
            notificationService.showError("L'analyse sémantique a échoué", error);
        }
    }
}

export default new OrdoAbChaosCommand();