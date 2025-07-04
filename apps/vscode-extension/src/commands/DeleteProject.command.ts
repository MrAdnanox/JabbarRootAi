import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectTreeItem } from '../providers/projectTreeItem.factory';
import { BrickService, ProjectService } from '@jabbarroot/core';
import { DialogService } from '../services/ui/dialog.service';
import { NotificationService } from '../services/ui/notification.service';

export class DeleteProjectCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.DeleteProject',
        title: 'Delete Project',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'projectService',
        'brickService',
        'treeDataProvider',
        'dialogService',
        'notificationService'
    ] as const;

    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        projectItem?: ProjectTreeItem
    ): Promise<void> {
        const projectService = services.get('projectService') as ProjectService;
        const brickService = services.get('brickService') as BrickService;
        const treeDataProvider = services.get('treeDataProvider') as any;
        const dialogService = services.get('dialogService') as DialogService;
        const notificationService = services.get('notificationService') as NotificationService;

        // --- VALIDATION CORRIGÉE ---
        if (!projectItem || projectItem.contextValue !== 'jabbarrootProject') {
            notificationService.showError('Veuillez lancer cette commande depuis la vue JabbarRoot sur un projet.');
            return;
        }
        // --- FIN DE LA CORRECTION ---

        const project = projectItem.project;
        const confirmed = await dialogService.showConfirmationDialog({
            title: `Supprimer le projet "${project.name}" supprimera aussi ses ${project.brickContextIds.length} brique(s).`,
            detail: 'Cette action est irréversible et toutes les données associées seront définitivement perdues.',
            confirmActionLabel: 'Supprimer Définitivement'
        });

        if (!confirmed) {
            return;
        }

        try {
            const brickIds = [...project.brickContextIds];
            for (const brickId of brickIds) {
                await brickService.deleteBrick(brickId);
            }

            await projectService.deleteProject(project.id);
            notificationService.showInfo(`Projet "${project.name}" et ses briques ont été supprimés.`);
            treeDataProvider.refresh();
        } catch (error) {
            notificationService.showError('Erreur lors de la suppression du projet', error);
            treeDataProvider.refresh();
        }
    }
}

export default new DeleteProjectCommand();