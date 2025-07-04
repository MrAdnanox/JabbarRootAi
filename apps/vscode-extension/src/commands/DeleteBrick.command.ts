import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { BrickService, ProjectService } from '@jabbarroot/core';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { DialogService } from '../services/ui/dialog.service';
import { NotificationService } from '../services/ui/notification.service';

export class DeleteBrickCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.DeleteBrick',
        title: 'Delete Brick',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'brickService',
        'projectService',
        'treeDataProvider',
        'dialogService',
        'notificationService'
    ] as const;

    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        brickItem?: BrickTreeItem
    ): Promise<void> {
        const brickService = services.get('brickService') as BrickService;
        const projectService = services.get('projectService') as ProjectService;
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;
        const dialogService = services.get('dialogService') as DialogService;
        const notificationService = services.get('notificationService') as NotificationService;

        if (!brickItem || brickItem.contextValue !== 'jabbarrootBrick') {
            notificationService.showError('Veuillez lancer cette commande depuis la vue JabbarRoot sur une brique.');
            return;
        }

        const brick = brickItem.brick;
        const confirmed = await dialogService.showConfirmationDialog({
            title: `Êtes-vous sûr de vouloir supprimer définitivement la brique "${brick.name}" ?`,
            detail: 'Cette action est irréversible.',
            confirmActionLabel: 'Supprimer'
        });

        if (!confirmed) {
            return;
        }

        try {
            await brickService.deleteBrick(brick.id);
            await projectService.removeBrickIdFromProject(brick.projectId, brick.id);
            notificationService.showInfo(`Brique "${brick.name}" supprimée avec succès.`);
            treeDataProvider.refresh();
        } catch (error) {
            notificationService.showError(`Erreur lors de la suppression de la brique`, error);
            treeDataProvider.refresh(); // Rafraîchir même en cas d'erreur
        }
    }
}

export default new DeleteBrickCommand();