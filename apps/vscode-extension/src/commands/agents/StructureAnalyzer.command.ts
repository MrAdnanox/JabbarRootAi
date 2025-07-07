import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../../core/interfaces';
import { AnalyzerService } from '@jabbarroot/prompt-factory';
import { StructureGenerationService, JabbarProject } from '@jabbarroot/core';
import { IgnoreService } from '../../services/ignore.service';
import { DialogService } from '../../services/ui/dialog.service';
import { NotificationService } from '../../services/ui/notification.service';
import { GeminiConfigService } from '../../services/config/gemini.config.service';

export class StructureAnalyzerCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.agents.StructureAnalyzer',
        title: 'Analyser la structure du projet',
        category: 'jabbarroot' as const,
    };
    public readonly dependencies = [
        'analyzerService',
        'structureGenerationService',
        'ignoreService',
        'dialogService',
        'notificationService',
        'geminiConfigService'
    ] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        const analyzerService = services.get('analyzerService') as AnalyzerService;
        const structureService = services.get('structureGenerationService') as StructureGenerationService;
        const ignoreService = services.get('ignoreService') as IgnoreService;
        const dialogService = services.get('dialogService') as DialogService;
        const notificationService = services.get('notificationService') as NotificationService;
        const geminiConfigService = services.get('geminiConfigService') as GeminiConfigService;

        try {
            const apiKeyResult = await geminiConfigService.getApiKey();
            if (apiKeyResult.isFailure()) {
                await dialogService.showConfigureApiKeyDialog();
                return;
            }
            const apiKey = apiKeyResult.value;

            const project = await dialogService.showProjectPicker();
            if (!project) return;

            await notificationService.withProgress(`Analyse de la structure du projet "${project.name}"`, async () => {
                const shouldIgnore = await ignoreService.createIgnorePredicate(project);
                const treeReport = await structureService.generate(project.projectRootPath, {
                    maxDepth: 8,
                    shouldIgnore: shouldIgnore
                });
                const fileTree = treeReport?.tree || '';

                const finalReport = await analyzerService.analyzeStructureAndPersist(project, fileTree, apiKey);
                
                await this.displayResults(finalReport);
                await vscode.commands.executeCommand('jabbarroot.RefreshProjectView');
            });

            notificationService.showInfo('Analyse de structure terminée avec succès !');

        } catch (error) {
            notificationService.showError("Échec de l'analyse de structure", error);
        }
    }

    private async displayResults(report: any): Promise<void> {
        const reportContent = JSON.stringify(report, null, 2);
        const document = await vscode.workspace.openTextDocument({
            content: reportContent,
            language: 'json',
        });
        await vscode.window.showTextDocument(document, {
            preview: false,
            viewColumn: vscode.ViewColumn.Beside
        });
    }
}

export default new StructureAnalyzerCommand();