import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../../core/interfaces';
import { JabbarProject } from '@jabbarroot/core';
import { DocumentationService, AnalyzerService } from '@jabbarroot/prompt-factory';
import { DialogService } from '../../services/ui/dialog.service';
import { GeminiConfigService } from '../../services/config/gemini.config.service';
import { NotificationService } from '../../services/ui/notification.service';

export class GenerateReadmeCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.agents.GenerateReadme',
        title: 'Générer un README',
        category: 'jabbarroot' as const,
    };
    public readonly dependencies = [
        'documentationService',
        'analyzerService',
        'dialogService',
        'geminiConfigService',
        'notificationService'
    ] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        const docService = services.get('documentationService') as DocumentationService;
        const analyzerService = services.get('analyzerService') as AnalyzerService;
        const dialogService = services.get('dialogService') as DialogService;
        const geminiConfigService = services.get('geminiConfigService') as GeminiConfigService;
        const notificationService = services.get('notificationService') as NotificationService;

        try {
            const apiKeyResult = await geminiConfigService.getApiKey();
            if (apiKeyResult.isFailure()) {
                await dialogService.showConfigureApiKeyDialog();
                return;
            }
            const apiKey = apiKeyResult.value;

            const project = await dialogService.showProjectPicker();
            if (!project) {return;}

            const hasReport = await this.ensureArchitecturalReportExists(project, analyzerService, dialogService, notificationService);
            if (!hasReport) {
                notificationService.showInfo('Génération du README annulée car le rapport architectural est requis.');
                return;
            }

            await notificationService.withProgress(`Génération du README pour "${project.name}"`, async () => {
                const readmeContent = await docService.generateReadme(project, apiKey);
                const readmePath = vscode.Uri.joinPath(vscode.Uri.file(project.projectRootPath), 'README.md');
                await vscode.workspace.fs.writeFile(readmePath, Buffer.from(readmeContent, 'utf8'));
                
                const choice = await notificationService.showInfoWithActions('README généré avec succès !', [{ title: 'Ouvrir le fichier' }]);
                if (choice === 'Ouvrir le fichier') {
                    const doc = await vscode.workspace.openTextDocument(readmePath);
                    await vscode.window.showTextDocument(doc);
                }
            });
        } catch (error) {
            notificationService.showError('La génération du README a échoué', error);
        }
    }

    private async ensureArchitecturalReportExists(
        project: JabbarProject,
        analyzerService: AnalyzerService,
        dialogService: DialogService,
        notificationService: NotificationService
    ): Promise<boolean> {
        const artefactBrick = await analyzerService.findArtefactBrick(project);
        if (artefactBrick) {return true;}

        const confirmed = await dialogService.showConfirmationDialog({
            title: `Le rapport architectural pour "${project.name}" est introuvable. Ce rapport est nécessaire pour générer un README de qualité.`,
            confirmActionLabel: "Analyser la structure maintenant"
        });

        if (confirmed) {
            await vscode.commands.executeCommand('jabbarroot.brick.StructureAnalyzer');
            const newArtefactBrick = await analyzerService.findArtefactBrick(project);
            if (newArtefactBrick) {
                notificationService.showInfo("Rapport architectural généré. Reprise de la génération du README...");
                return true;
            } else {
                notificationService.showError("La génération du rapport architectural semble avoir échoué.");
                return false;
            }
        }
        return false;
    }
}

export default new GenerateReadmeCommand();