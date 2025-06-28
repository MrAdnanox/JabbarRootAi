// apps/vscode-extension/src/commands/editProjectOptions.command.ts
import * as vscode from 'vscode';
import { ProjectTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectService } from '@jabbarroot/core';
import { ProjectOptionsViewProvider } from '../webviews/ProjectOptionsViewProvider';

export function registerEditProjectOptionsCommand(
    context: vscode.ExtensionContext,
    projectService: ProjectService
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.editProjectOptions', async (projectItem?: ProjectTreeItem) => {
        if (!projectItem || !(projectItem instanceof ProjectTreeItem)) return;

        // Utiliser l'ID du projet (stable) pour récupérer les données fraîches
        const projectId = projectItem.project.id;
        const freshProject = await projectService.getProject(projectId);

        if (!freshProject) {
            vscode.window.showErrorMessage(`Impossible de trouver le projet avec l'ID: ${projectId}`);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'jabbarroot.projectOptions',
            `Options: ${freshProject.name}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        // Passer les données fraîches au fournisseur
        const viewProvider = new ProjectOptionsViewProvider(freshProject, context.extensionUri);
        panel.webview.html = viewProvider.getHtmlForWebview(panel.webview);

        panel.webview.onDidReceiveMessage(async message => {
            if (message.type === 'save') {
                // Important : utiliser l'ID du projet frais pour la mise à jour
                await projectService.updateProject(freshProject.id, {
                    options: message.payload.updatedOptions
                });
                vscode.window.showInformationMessage(`Options pour "${freshProject.name}" enregistrées.`);
                panel.dispose();
                // Rafraîchir la vue pour mettre à jour le 'tooltip' ou 'description' si on en ajoute
                await vscode.commands.executeCommand('jabbarroot.refreshProjectView');
            }
        }, undefined, context.subscriptions);
    });
}