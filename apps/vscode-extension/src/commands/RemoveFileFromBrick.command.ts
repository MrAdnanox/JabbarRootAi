import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { BrickService } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { DialogService } from '../services/ui/dialog.service';
import { NotificationService } from '../services/ui/notification.service';

export class RemoveFileFromBrickCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.RemoveFileFromBrick',
        title: 'Remove File from Brick',
        category: 'jabbarroot' as const,
    };
    public readonly dependencies = [
        'brickService',
        'treeDataProvider',
        'dialogService',
        'notificationService'
    ] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>, brickItem?: BrickTreeItem): Promise<void> {
        const brickService = services.get('brickService') as BrickService;
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;
        const dialogService = services.get('dialogService') as DialogService;
        const notificationService = services.get('notificationService') as NotificationService;

        if (!brickItem || brickItem.contextValue !== 'jabbarrootBrick') {
            notificationService.showWarning('Veuillez sélectionner une brique valide pour en supprimer un fichier.');
            return;
        }

        const brick = brickItem.brick;
        if (!brick.files_scope || brick.files_scope.length === 0) {
            notificationService.showInfo(`La brique "${brick.name}" ne contient aucun fichier.`);
            return;
        }

        const fileToRemove = await dialogService.showQuickPick({
            title: 'Sélectionnez le fichier à retirer de la brique',
            items: brick.files_scope.map(f => ({ label: f, data: f }))
        });

        if (!fileToRemove) return;

        try {
            await brickService.removePathFromBrick(brick.id, fileToRemove);
            treeDataProvider.refresh();
            notificationService.showInfo(`Fichier "${fileToRemove}" supprimé de la brique "${brick.name}".`);
        } catch (error) {
            notificationService.showError('Échec de la suppression du fichier', error);
        }
    }
}

export default new RemoveFileFromBrickCommand();