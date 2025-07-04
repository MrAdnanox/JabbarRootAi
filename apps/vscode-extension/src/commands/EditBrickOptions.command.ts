import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectService, BrickService } from '@jabbarroot/core';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { BrickOptionsViewProvider } from '../webviews/BrickOptionsViewProvider';
import { NotificationService } from '../services/ui/notification.service';

export class EditBrickOptionsCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.EditBrickOptions',
        title: 'Edit Brick Options',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'projectService',
        'brickService',
        'extensionContext',
        'notificationService'
    ] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>, brickItem?: BrickTreeItem): Promise<void> {
        const projectService = services.get('projectService') as ProjectService;
        const brickService = services.get('brickService') as BrickService;
        const context = services.get('extensionContext') as vscode.ExtensionContext;
        const notificationService = services.get('notificationService') as NotificationService;

        if (!brickItem || brickItem.contextValue !== 'jabbarrootBrick') {
            notificationService.showError('Veuillez lancer cette commande depuis la vue JabbarRoot en cliquant sur une brique.');
            return;
        }

        try {
            const brickId = brickItem.brick.id;
            const [brick, project] = await Promise.all([
                brickService.getBrick(brickId),
                projectService.getProject(brickItem.brick.projectId)
            ]);

            if (!brick) throw new Error(`Impossible de trouver la brique avec l'ID: ${brickId}`);
            if (!project) throw new Error('Le projet parent de la brique est introuvable.');

            const panel = vscode.window.createWebviewPanel(
                'jabbarroot.brickOptions',
                `Options: ${brick.name}`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'assets')
                    ]
                }
            );

            const viewProvider = new BrickOptionsViewProvider(brick, project, context.extensionUri);
            panel.webview.html = viewProvider.getHtmlForWebview(panel.webview);

            panel.webview.onDidReceiveMessage(async message => {
                if (message.type === 'save') {
                    try {
                        await brickService.updateBrick(brick.id, {
                            options: message.payload.updatedOptions
                        });
                        notificationService.showInfo('Les options ont été enregistrées avec succès.');
                        panel.dispose();
                        await vscode.commands.executeCommand('jabbarroot.RefreshProjectView');
                    } catch (saveError) {
                        notificationService.showError('Échec de la sauvegarde des options', saveError);
                    }
                }
            }, undefined, context.subscriptions);

        } catch (error) {
            notificationService.showError("Erreur lors de l'initialisation de l'éditeur d'options de brique", error);
        }
    }
}

export default new EditBrickOptionsCommand();