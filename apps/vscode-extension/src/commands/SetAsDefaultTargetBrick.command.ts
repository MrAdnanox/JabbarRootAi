import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { BrickService } from '@jabbarroot/core';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { NotificationService } from '../services/ui/notification.service';

export class SetAsDefaultTargetBrickCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.SetAsDefaultTargetBrick',
        title: 'Définir comme cible par défaut',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'brickService',
        'notificationService'
    ] as const;

    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        brickItem?: BrickTreeItem
    ): Promise<void> {
        const brickService = services.get('brickService') as BrickService;
        const notificationService = services.get('notificationService') as NotificationService;

        if (!brickItem || brickItem.contextValue !== 'jabbarrootBrick') {
            notificationService.showWarning('Veuillez sélectionner une brique valide pour la définir comme cible par défaut.');
            return;
        }

        const brick = brickItem.brick;
        try {
            await notificationService.withProgress(
                `Définition de la brique "${brick.name}" comme cible par défaut...`,
                async () => {
                    await brickService.setAsDefaultTarget(brick.id);
                }
            );
            notificationService.showInfo(`La brique "${brick.name}" est maintenant la cible par défaut.`);
            await vscode.commands.executeCommand('jabbarroot.RefreshProjectView');
        } catch (error) {
            notificationService.showError(`Impossible de définir la brique "${brick.name}" comme cible par défaut`, error);
        }
    }
}

export default new SetAsDefaultTargetBrickCommand();