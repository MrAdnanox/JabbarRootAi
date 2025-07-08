import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { BrickService, JabbarProject, ProjectService } from '@jabbarroot/core'; // <-- Ajout de ProjectService
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { ProjectTreeItem } from '../providers/projectTreeItem.factory';
import { DialogService } from '../services/ui/dialog.service';
import { NotificationService } from '../services/ui/notification.service';

export class CreateBrickCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.CreateBrickInProject',
        title: 'Create Brick In Project',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'brickService',
        'projectService', // <-- Dépendance ajoutée
        'treeDataProvider',
        'dialogService',
        'notificationService'
    ] as const;

    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        projectItem?: ProjectTreeItem
    ): Promise<void> {
        const brickService = services.get('brickService') as BrickService;
        const projectService = services.get('projectService') as ProjectService; // <-- Service récupéré
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;
        const dialogService = services.get('dialogService') as DialogService;
        const notificationService = services.get('notificationService') as NotificationService;

        try {
            let project: JabbarProject | undefined;
            if (projectItem && projectItem.project) {
                project = projectItem.project;
            } else {
                project = await dialogService.showProjectPicker();
            }
            if (!project) {
                return; // Annulé par l'utilisateur
            }

            const brickName = await dialogService.askQuestion({
                prompt: 'Entrez le nom de la nouvelle brique',
                placeHolder: 'ma-nouvelle-brique',
                validateInput: value => {
                    if (!value || value.trim().length === 0) {
                        return 'Le nom de la brique ne peut pas être vide.';
                    }
                    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                        return 'Le nom ne peut contenir que des lettres, chiffres, tirets et underscores.';
                    }
                    return undefined;
                }
            });
            if (!brickName) {return;} // Annulé par l'utilisateur

            // --- LOGIQUE CORRIGÉE ---
            // 1. Créer la brique et capturer le résultat
            const newBrick = await brickService.createBrick(
                project.id,
                brickName,
                {
                    compilationCompressionLevel: 'standard',
                    compilationIncludeProjectTree: false,
                    brickIgnorePatterns: [],
                    special_sections: {}
                },
                true
            );

            // 2. Associer la nouvelle brique au projet
            await projectService.addBrickIdToProject(project.id, newBrick.id);
            // --- FIN DE LA CORRECTION ---

            treeDataProvider.refresh();
            notificationService.showInfo(`Brique "${brickName}" créée et associée avec succès.`);

        } catch (error) {
            notificationService.showError('La création de la brique a échoué', error);
        }
    }
}

export default new CreateBrickCommand();