// apps/vscode-extension/src/commands/editBrickOptions.command.ts
import * as vscode from 'vscode';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectService, BrickService } from '@jabbarroot/core';
import { BrickOptionsViewProvider } from '../webviews/BrickOptionsViewProvider';

export function registerEditBrickOptionsCommand(
    context: vscode.ExtensionContext,
    projectService: ProjectService,
    brickService: BrickService
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.editBrickOptions', async (brickItem?: BrickTreeItem) => {
        if (!brickItem || !(brickItem instanceof BrickTreeItem)) {
            vscode.window.showErrorMessage('Veuillez lancer cette commande depuis la vue JabbarRoot en cliquant sur une brique.');
            return;
        }

        // Utiliser l'ID de la brique (qui est stable) pour récupérer les données fraîches
        const brickId = brickItem.brick.id;
        const freshBrick = await brickService.getBrick(brickId);

        if (!freshBrick) {
            vscode.window.showErrorMessage(`Impossible de trouver la brique avec l'ID: ${brickId}`);
            return;
        }

        const project = await projectService.getProject(freshBrick.projectId);
        if (!project) {
            vscode.window.showErrorMessage(`Projet parent de la brique introuvable.`);
            return;
        }

        // Création et affichage du panneau Webview
        const panel = vscode.window.createWebviewPanel(
            'jabbarroot.brickOptions',
            `Options: ${freshBrick.name}`, // Utiliser le nom frais
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'assets')
                ]
            }
        );

        // Passer les données fraîches au fournisseur
        const viewProvider = new BrickOptionsViewProvider(freshBrick, project, context.extensionUri);
        panel.webview.html = viewProvider.getHtmlForWebview(panel.webview);

        // Gestion des messages de la webview
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.type) {
                    case 'save':
                        try {
                            await brickService.updateBrick(freshBrick.id, {
                                options: message.payload.updatedOptions
                            });
                            
                            // Envoyer un message de confirmation à la webview
                            panel.webview.postMessage({
                                type: 'optionsSaved',
                                message: 'Les options ont été enregistrées avec succès.'
                            });
                            
                            // Fermer le panneau après un court délai
                            setTimeout(() => {
                                panel.dispose();
                                // Rafraîchir la vue pour refléter les changements
                                vscode.commands.executeCommand('jabbarroot.refreshProjectView');
                            }, 1000);
                            
                        } catch (error) {
                            console.error('Erreur lors de la mise à jour de la brique :', error);
                            // Envoyer un message d'erreur à la webview
                            panel.webview.postMessage({
                                type: 'error',
                                error: 'Échec de l\'enregistrement des options.'
                            });
                        }
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });
}