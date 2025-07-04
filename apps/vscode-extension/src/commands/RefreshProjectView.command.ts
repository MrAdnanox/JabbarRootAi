import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { NotificationService } from '../services/ui/notification.service';

export class RefreshProjectViewCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.RefreshProjectView',
        title: 'Refresh Project View',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'treeDataProvider',
        'notificationService'
    ] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;
        const notificationService = services.get('notificationService') as NotificationService;

        try {
            treeDataProvider.refresh();
        } catch (error) {
            notificationService.showError('Erreur lors du rafraîchissement de la vue', error);
        }
    }
}

export default new RefreshProjectViewCommand();