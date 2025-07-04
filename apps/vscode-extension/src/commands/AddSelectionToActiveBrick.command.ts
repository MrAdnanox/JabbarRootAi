import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { BrickService, ProjectService } from '@jabbarroot/core';
import { IgnoreService } from '../services/ignore.service';
import { getFilesRecursively } from '../utils/workspace';
import { NotificationService } from '../services/ui/notification.service';

export class AddSelectionToActiveBrickCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.AddSelectionToActiveBrick',
        title: 'JabbarRoot: Ajouter la sélection à la brique active',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'projectService',
        'brickService',
        'ignoreService',
        'notificationService'
    ] as const;

    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        mainUri: vscode.Uri,
        selectedUris: vscode.Uri[]
    ): Promise<void> {
        const projectService = services.get('projectService') as ProjectService;
        const brickService = services.get('brickService') as BrickService;
        const ignoreService = services.get('ignoreService') as IgnoreService;
        const notificationService = services.get('notificationService') as NotificationService;

        const uris = selectedUris?.length > 0 ? selectedUris : [mainUri];
        if (!uris?.length) {
            notificationService.showWarning('Aucune sélection valide détectée.');
            return;
        }

        try {
            const targetBrick = await brickService.getDefaultTargetBrick();
            if (!targetBrick) {
                notificationService.showWarning("Aucune brique de collecte n'est définie. Faites un clic droit sur une brique et choisissez 'Définir comme brique de collecte'.");
                return;
            }

            const parentProject = await projectService.getProject(targetBrick.projectId);
            if (!parentProject) {
                throw new Error(`Projet parent de la brique de collecte introuvable.`);
            }

            const shouldIgnore = await ignoreService.createIgnorePredicate(parentProject, targetBrick);
            const allRelativeFilePaths: Set<string> = new Set();

            for (const uri of uris) {
                const stat = await vscode.workspace.fs.stat(uri);
                if (stat.type === vscode.FileType.Directory) {
                    const nestedFiles = await getFilesRecursively(uri, shouldIgnore, parentProject.projectRootPath);
                    nestedFiles.forEach(f => allRelativeFilePaths.add(vscode.workspace.asRelativePath(f.fsPath, false)));
                } else if (stat.type === vscode.FileType.File) {
                    const relativePath = vscode.workspace.asRelativePath(uri.fsPath, false);
                    if (!shouldIgnore(relativePath)) {
                        allRelativeFilePaths.add(relativePath);
                    }
                }
            }

            const finalPaths = Array.from(allRelativeFilePaths);
            if (finalPaths.length === 0) {
                notificationService.showInfo('Aucun fichier à ajouter (tous les fichiers sélectionnés sont peut-être ignorés ou déjà présents).');
                return;
            }

            await brickService.addPathsToBrick(targetBrick.id, finalPaths);
            const message = finalPaths.length > 1
                ? `${finalPaths.length} éléments ajoutés à la brique : ${targetBrick.name}`
                : `1 élément ajouté à la brique : ${targetBrick.name}`;
            notificationService.showInfo(message);
            await vscode.commands.executeCommand('jabbarroot.RefreshProjectView');

        } catch (error) {
            notificationService.showError("Erreur lors de l'ajout des éléments à la brique", error);
        }
    }
}

export default new AddSelectionToActiveBrickCommand();