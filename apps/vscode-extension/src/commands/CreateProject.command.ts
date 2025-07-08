import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectService, SystemBrickManager } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { DialogService } from '../services/ui/dialog.service';
import { NotificationService } from '../services/ui/notification.service';

export class CreateProjectCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.CreateProject',
        title: 'Create Project',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'projectService',
        'treeDataProvider',
        'systemBrickManager',
        'dialogService',
        'notificationService'
    ] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        const projectService = services.get('projectService') as ProjectService;
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;
        const systemBrickManager = services.get('systemBrickManager') as SystemBrickManager;
        const dialogService = services.get('dialogService') as DialogService;
        const notificationService = services.get('notificationService') as NotificationService;

        try {
            const projectName = await dialogService.askQuestion({
                prompt: 'Entrez le nom du nouveau projet',
                placeHolder: 'MonProjetJabbarRoot'
            });
            if (!projectName) {return;}

            const projectRootPath = await dialogService.showFolderPicker({
                title: `Sélectionnez le dossier racine pour le projet "${projectName}"`
            });

            if (!projectRootPath) {return;}

            const newProject = await projectService.createProject(projectName, projectRootPath);
            await systemBrickManager.ensureSystemBricksExist(newProject);

            treeDataProvider.refresh();
            notificationService.showInfo(`Projet "${projectName}" créé avec succès.`);

        } catch (error) {
            notificationService.showError('La création du projet a échoué', error);
            treeDataProvider.refresh();
        }
    }
}

export default new CreateProjectCommand();