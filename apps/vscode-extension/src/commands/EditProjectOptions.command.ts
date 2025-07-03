// apps/vscode-extension/src/commands/EditProjectOptions.command.ts
/**
 * @file Commande pour éditer les options d'un projet via une interface web
 * @module EditProjectOptionsCommand
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectService } from '@jabbarroot/core';
import { ProjectTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectOptionsViewProvider } from '../webviews/ProjectOptionsViewProvider';

// === TYPES & INTERFACES ===
interface ProjectPanelConfig {
    panel: vscode.WebviewPanel;
    project: any;
}

interface SavePayload {
    updatedOptions: any;
}

interface WebviewMessage {
    type: string;
    payload: SavePayload;
}

// === GESTIONNAIRE D'ERREURS CENTRALISÉ ===
class ErrorHandler {
    private static readonly LOG_PREFIX = '[EditProjectOptions]';

    static showError(message: string): void {
        vscode.window.showErrorMessage(message);
        console.error(`${this.LOG_PREFIX} ${message}`);
    }

    static showInfo(message: string): void {
        vscode.window.showInformationMessage(message);
        console.log(`${this.LOG_PREFIX} ${message}`);
    }

    static handleError(context: string, error: unknown): void {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const fullMessage = `${context}: ${errorMessage}`;
        
        console.error(`${this.LOG_PREFIX} ${fullMessage}`, error);
        vscode.window.showErrorMessage(fullMessage, 'Voir les logs')
            .then(selection => {
                if (selection === 'Voir les logs') {
                    vscode.commands.executeCommand('workbench.action.output.show.extension-output-jabbarroot');
                }
            });
    }
}

// === GESTIONNAIRE DE SERVICES ===
class ServiceManager {
    constructor(private services: Map<keyof ServiceCollection, IService>) {}

    get projectService(): ProjectService {
        return this.services.get('projectService') as ProjectService;
    }

    get extensionContext(): vscode.ExtensionContext {
        return this.services.get('extensionContext') as vscode.ExtensionContext;
    }
}

// === GESTIONNAIRE DE WEBVIEW ===
class WebviewManager {
    constructor(
        private serviceManager: ServiceManager,
        private errorHandler: typeof ErrorHandler
    ) {}

    async createProjectOptionsPanel(projectItem: ProjectTreeItem): Promise<ProjectPanelConfig | null> {
        const projectId = projectItem.project!.id;
        
        // Récupération des données fraîches
        const freshProject = await this.serviceManager.projectService.getProject(projectId);
        if (!freshProject) {
            this.errorHandler.showError(`Impossible de trouver le projet avec l'ID: ${projectId}`);
            return null;
        }

        // Création du panneau
        const panel = this.createWebviewPanel(freshProject);
        this.configureWebviewContent(panel, freshProject);

        return { panel, project: freshProject };
    }

    private createWebviewPanel(project: any): vscode.WebviewPanel {
        return vscode.window.createWebviewPanel(
            'jabbarroot.projectOptions',
            `Options: ${project.name}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );
    }

    private configureWebviewContent(panel: vscode.WebviewPanel, project: any): void {
        const viewProvider = new ProjectOptionsViewProvider(
            project, 
            this.serviceManager.extensionContext.extensionUri
        );
        panel.webview.html = viewProvider.getHtmlForWebview(panel.webview);
    }

    setupMessageHandlers(panel: vscode.WebviewPanel, project: any): void {
        panel.webview.onDidReceiveMessage(
            (message: WebviewMessage) => this.handleWebviewMessage(panel, project, message),
            undefined,
            this.serviceManager.extensionContext.subscriptions
        );
    }

    private async handleWebviewMessage(
        panel: vscode.WebviewPanel, 
        project: any, 
        message: WebviewMessage
    ): Promise<void> {
        switch (message.type) {
            case 'save':
                await this.handleSaveOptions(panel, project, message.payload);
                break;
            default:
                console.warn(`[WebviewManager] Message type non géré: ${message.type}`);
        }
    }

    private async handleSaveOptions(
        panel: vscode.WebviewPanel,
        project: any,
        payload: SavePayload
    ): Promise<void> {
        try {
            await this.serviceManager.projectService.updateProject(project.id, {
                options: payload.updatedOptions
            });
            
            this.errorHandler.showInfo(`Options pour "${project.name}" enregistrées.`);
            panel.dispose();
            await vscode.commands.executeCommand('jabbarroot.RefreshProjectView');
        } catch (error) {
            this.errorHandler.handleError('Échec de la sauvegarde des options', error);
        }
    }
}

// === VALIDATEUR ===
class ProjectValidator {
    static isValidSelection(projectItem?: ProjectTreeItem): boolean {
        return !!projectItem && 
               projectItem instanceof ProjectTreeItem && 
               !!projectItem.project?.id;
    }

    static validateOrShowError(projectItem?: ProjectTreeItem): boolean {
        if (!this.isValidSelection(projectItem)) {
            ErrorHandler.showError('Veuillez lancer cette commande depuis la vue JabbarRoot sur un projet.');
            return false;
        }
        return true;
    }
}

// === COMMANDE PRINCIPALE (SIMPLIFIÉE) ===
export class EditProjectOptionsCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.EditProjectOptions',
        title: 'Edit Project Options',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'projectService',
        'extensionContext'
    ] as const;

    async execute(
        services: Map<keyof ServiceCollection, IService>,
        ...args: any[]
    ): Promise<void> {
        const projectItem = args[0] as ProjectTreeItem | undefined;
        
        try {
            // Validation
            if (!ProjectValidator.validateOrShowError(projectItem)) {
                return;
            }

            // Initialisation des gestionnaires
            const serviceManager = new ServiceManager(services);
            const webviewManager = new WebviewManager(serviceManager, ErrorHandler);

            // Configuration du panneau
            const panelConfig = await webviewManager.createProjectOptionsPanel(projectItem!);
            if (!panelConfig) return;

            // Configuration des événements
            webviewManager.setupMessageHandlers(panelConfig.panel, panelConfig.project);

        } catch (error) {
            ErrorHandler.handleError('Erreur lors de l\'initialisation de l\'éditeur d\'options', error);
        }
    }
}

export default new EditProjectOptionsCommand();