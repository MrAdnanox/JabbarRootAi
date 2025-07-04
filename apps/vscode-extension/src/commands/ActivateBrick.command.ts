import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { BrickService } from '@jabbarroot/core';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { NotificationService } from '../services/ui/notification.service';

export class ActivateBrickCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.ActivateBrick',
        title: 'Activer la brique pour la compilation',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'brickService',
        'treeDataProvider',
        'notificationService'
    ] as const;

    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        brickItem?: BrickTreeItem
    ): Promise<void> {
        const brickService = services.get('brickService') as BrickService;
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;
        const notificationService = services.get('notificationService') as NotificationService;

        if (!brickItem || brickItem.contextValue !== 'jabbarrootBrick') {
            notificationService.showWarning("Veuillez sélectionner une brique pour l'activer.");
            return;
        }

        const brick = brickItem.brick;

        if (brick.isActiveForProjectCompilation) {
            notificationService.showInfo(`La brique "${brick.name}" est déjà active.`);
            return;
        }

        try {
            await brickService.updateBrick(
                brick.id,
                { isActiveForProjectCompilation: true }
            );

            // --- L'APPEL CRUCIAL ---
            // On rafraîchit la vue pour que le changement soit visible immédiatement.
            treeDataProvider.refresh();
            // --- FIN DE L'APPEL ---

            notificationService.showInfo(`Brique "${brick.name}" activée.`);

        } catch (error) {
            notificationService.showError(`Échec de l'activation de la brique "${brick.name}"`, error);
        }
    }
}

export default new ActivateBrickCommand();