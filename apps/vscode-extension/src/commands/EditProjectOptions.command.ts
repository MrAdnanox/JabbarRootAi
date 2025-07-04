import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectService } from '@jabbarroot/core';
import { ProjectTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectOptionsViewProvider } from '../webviews/ProjectOptionsViewProvider';
import { NotificationService } from '../services/ui/notification.service';

export class EditProjectOptionsCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.EditProjectOptions',
        title: 'Edit Project Options',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'projectService',
        'extensionContext',
        'notificationService'
    ] as const;

    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        projectItem?: ProjectTreeItem
    ): Promise<void> {
        const projectService = services.get('projectService') as ProjectService;
        const context = services.get('extensionContext') as vscode.ExtensionContext;
        const notificationService = services.get('notificationService') as NotificationService;

        if (!projectItem || projectItem.contextValue !== 'jabbarrootProject') {
            notificationService.showError('Veuillez lancer cette commande depuis la vue JabbarRoot sur un projet.');
            return;
        }

        try {
            const project = await projectService.getProject(projectItem.project.id);
            if (!project) {
                throw new Error(`Impossible de trouver le projet avec l'ID: ${projectItem.project.id}`);
            }

            const panel = vscode.window.createWebviewPanel(
                'jabbarroot.projectOptions',
                `Options: ${project.name}`,
                vscode.ViewColumn.One,
                { 
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'assets')
                    ]
                }
            );

            const viewProvider = new ProjectOptionsViewProvider(project, context.extensionUri);
            panel.webview.html = viewProvider.getHtmlForWebview(panel.webview);

            panel.webview.onDidReceiveMessage(async message => {
                if (message.type === 'save') {
                    try {
                        await projectService.updateProject(project.id, {
                            options: message.payload.updatedOptions
                        });
                        notificationService.showInfo(`Options pour "${project.name}" enregistrées.`);
                        panel.dispose();
                        await vscode.commands.executeCommand('jabbarroot.RefreshProjectView');
                    } catch (saveError) {
                        notificationService.showError('Échec de la sauvegarde des options', saveError);
                    }
                }
            }, undefined, context.subscriptions);

        } catch (error) {
            notificationService.showError("Erreur lors de l'ouverture de l'éditeur d'options", error);
        }
    }
}

export default new EditProjectOptionsCommand();