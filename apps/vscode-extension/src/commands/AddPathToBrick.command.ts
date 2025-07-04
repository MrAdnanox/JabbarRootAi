import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectService, BrickService, JabbarProject, BrickContext } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { IgnoreService } from '../services/ignore.service';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { DialogService } from '../services/ui/dialog.service';
import { NotificationService } from '../services/ui/notification.service';

export class AddPathToBrickCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.AddPathToBrick',
        title: 'Ajouter un chemin à une brique',
        category: 'jabbarroot' as const,
    };
    public readonly dependencies = [
        'projectService',
        'brickService',
        'treeDataProvider',
        'ignoreService',
        'dialogService',
        'notificationService'
    ] as const;

    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        brickItem?: BrickTreeItem
    ): Promise<void> {
        const projectService = services.get('projectService') as ProjectService;
        const brickService = services.get('brickService') as BrickService;
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;
        const ignoreService = services.get('ignoreService') as IgnoreService;
        const dialogService = services.get('dialogService') as DialogService;
        const notificationService = services.get('notificationService') as NotificationService;

        try {
            let targetBrick: BrickContext | undefined;

            if (brickItem && brickItem.contextValue === 'jabbarrootBrick') {
                targetBrick = brickItem.brick;
            } else {
                const projects = await projectService.getAllProjects();
                if (projects.length === 0) {
                    notificationService.showWarning('Aucun projet trouvé.');
                    return;
                }
                const project = projects.length === 1 ? projects[0] : await dialogService.showQuickPick({
                    title: 'Sélectionnez un projet',
                    items: projects.map(p => ({ label: p.name, description: p.projectRootPath, data: p }))
                });
                if (!project) return;

                const bricksInProject = (await Promise.all(
                    project.brickContextIds.map(id => brickService.getBrick(id))
                )).filter((b): b is BrickContext => !!b);

                if (bricksInProject.length === 0) {
                    notificationService.showWarning('Aucune brique trouvée dans ce projet.');
                    return;
                }
                targetBrick = bricksInProject.length === 1 ? bricksInProject[0] : await dialogService.showQuickPick({
                    title: 'Sélectionnez une brique',
                    items: bricksInProject.map(b => ({ label: b.name, data: b }))
                });
            }

            if (!targetBrick) return;

            const parentProject = await projectService.getProject(targetBrick.projectId);
            if (!parentProject) {
                throw new Error(`Projet parent (ID: ${targetBrick.projectId}) de la brique introuvable.`);
            }

            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                notificationService.showWarning('Aucun éditeur actif. Veuillez ouvrir un fichier pour en ajouter le chemin.');
                return;
            }

            const relativePath = vscode.workspace.asRelativePath(activeEditor.document.uri.fsPath, false);
            const ignorePredicate = await ignoreService.createIgnorePredicate(parentProject, targetBrick);

            if (ignorePredicate(relativePath)) {
                notificationService.showInfo(`Chemin "${relativePath}" ignoré par les règles d'exclusion.`);
                return;
            }
            if (targetBrick.files_scope.includes(relativePath)) {
                notificationService.showInfo(`Chemin "${relativePath}" déjà présent dans la brique "${targetBrick.name}".`);
                return;
            }

            await brickService.addPathsToBrick(targetBrick.id, [relativePath]);
            treeDataProvider.refresh();
            notificationService.showInfo(`Chemin "${relativePath}" ajouté à la brique "${targetBrick.name}".`);

        } catch (error) {
            notificationService.showError("Erreur lors de l'ajout du chemin à la brique", error);
        }
    }
}

export default new AddPathToBrickCommand();