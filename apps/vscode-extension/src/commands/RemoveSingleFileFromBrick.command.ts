import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { BrickService } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { FileTreeItem } from '../providers/projectTreeItem.factory';
import { NotificationService } from '../services/ui/notification.service';

export class RemoveSingleFileFromBrickCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.RemoveSingleFileFromBrick',
        title: 'Remove Single File from Brick',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'brickService',
        'treeDataProvider',
        'notificationService'
    ] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>, fileItem?: FileTreeItem): Promise<void> {
        const brickService = services.get('brickService') as BrickService;
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;
        const notificationService = services.get('notificationService') as NotificationService;

        // --- VALIDATION CORRIGÉE ---
        if (!fileItem || fileItem.contextValue !== 'jabbarrootFileInBrick') {
            notificationService.showWarning('Veuillez sélectionner un fichier valide à supprimer.');
            return;
        }
        // --- FIN DE LA CORRECTION ---

        try {
            const brick = await brickService.getBrick(fileItem.brickId);
            if (!brick) {
                notificationService.showError(`Impossible de trouver la brique parente (ID: ${fileItem.brickId}).`);
                return;
            }

            // Le label de FileTreeItem est le chemin du fichier
            const filePathToRemove = fileItem.label as string;

            await brickService.removePathFromBrick(brick.id, filePathToRemove);
            treeDataProvider.refresh();
            notificationService.showInfo(`Fichier "${filePathToRemove}" supprimé de la brique "${brick.name}".`);

        } catch (error) {
            notificationService.showError('Échec de la suppression du fichier', error);
        }
    }
}

export default new RemoveSingleFileFromBrickCommand();