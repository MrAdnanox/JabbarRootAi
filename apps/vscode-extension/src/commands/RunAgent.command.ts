import * as vscode from 'vscode';
import * as path from 'path';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { JabbarProject } from '@jabbarroot/core';
import { VscodeFileSystemAdapter } from '../adapters/vscodeFileSystem.adapter';
import { AgentDefinition } from '@jabbarroot/prompt-factory/dist/types/agent.types';
import { GenericWorkflowEngine } from '@jabbarroot/prompt-factory/dist/services/GenericWorkflowEngine.service';
import { DialogService } from '../services/ui/dialog.service';
import { GeminiConfigService } from '../services/config/gemini.config.service';
import { NotificationService } from '../services/ui/notification.service';

export class RunAgentCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.RunAgent',
        title: 'Exécuter un agent',
        category: 'jabbarroot' as const,
    };

    // DÉPENDANCES DÉCLARÉES : Claires, concises et injectées.
    public readonly dependencies = [
        'genericWorkflowEngine',
        'dialogService',
        'geminiConfigService',
        'notificationService'
    ] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        // 1. RÉCUPÉRATION DES SERVICES INJECTÉS
        // 1. RÉCUPÉRATION ET TYPAGE EXPLICITE DES SERVICES
        const genericWorkflowEngine = services.get('genericWorkflowEngine') as GenericWorkflowEngine;
        const dialogService = services.get('dialogService') as DialogService;
        const geminiConfigService = services.get('geminiConfigService') as GeminiConfigService;
        const notificationService = services.get('notificationService') as NotificationService;

        try {
            // 2. ORCHESTRATION DE LA LOGIQUE
            // La complexité est déléguée aux services. La commande ne fait que décrire le "quoi", pas le "comment".

            // Étape 2a : Valider et obtenir la clé API
            const apiKeyResult = await geminiConfigService.getApiKey();
            if (apiKeyResult.isFailure()) {
                // La logique de dialogue est encapsulée dans le service.
                await dialogService.showConfigureApiKeyDialog();
                return; // Arrêt propre si la pré-condition n'est pas remplie.
            }
            const apiKey = apiKeyResult.value;

            // Étape 2b : Charger les définitions et laisser l'utilisateur choisir
            const agentDefs = await this.loadAgentDefinitions(notificationService);
            if (!agentDefs.length) return;
            
            const pickedAgent = await this.pickAgent(agentDefs);
            if (!pickedAgent) return;

            // Étape 2c : Laisser l'utilisateur choisir le projet cible
            const selectedProject = await dialogService.showProjectPicker();
            if (!selectedProject) return;

            // Étape 2d : Exécuter la tâche principale avec une notification de progression
            await notificationService.withProgress(
                `Exécution de "${pickedAgent.label}" sur ${selectedProject.name}...`,
                () => this.executeAgent(
                    genericWorkflowEngine,
                    pickedAgent,
                    selectedProject,
                    apiKey
                )
            );

            notificationService.showInfo(`Agent "${pickedAgent.label}" exécuté avec succès sur le projet ${selectedProject.name}.`);

        } catch (error) {
            // 3. GESTION CENTRALISÉE DES ERREURS INATTENDUES
            notificationService.showError("L'exécution de l'agent a échoué", error);
        }
    }

    // Les méthodes privées restent pour la logique spécifique à CETTE commande.
    private async loadAgentDefinitions(notificationService: NotificationService): Promise<AgentDefinition[]> {
        try {
            const projectRootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!projectRootPath) {
                throw new Error('Aucun dossier de travail ouvert');
            }
            const manifestPath = path.join(projectRootPath, '.jabbarroot', '.jabbarroot_data', 'system', 'agents', 'manifest.json');
            const fsAdapter = new VscodeFileSystemAdapter();
            const manifestContent = await fsAdapter.readFile(manifestPath);
            const manifest = JSON.parse(manifestContent);
            if (!Array.isArray(manifest?.agents)) {
                throw new Error('Format de manifeste des agents invalide.');
            }
            return manifest.agents as AgentDefinition[];
        } catch (error) {
            notificationService.showError('Impossible de charger le manifeste des agents', error);
            return [];
        }
    }

    private async pickAgent(agentDefs: AgentDefinition[]): Promise<{ id: string; label: string; } | undefined> {
        const items = agentDefs.map(agent => ({
            label: agent.label,
            description: agent.description,
            detail: agent.id,
            id: agent.id
        }));
        return vscode.window.showQuickPick(items, {
            title: 'Sélectionnez un agent à exécuter',
            placeHolder: 'Recherchez un agent...',
            matchOnDescription: true,
            matchOnDetail: true
        });
    }

    private async executeAgent(
        engine: GenericWorkflowEngine,
        agent: { id: string; label: string },
        project: JabbarProject,
        apiKey: string
    ): Promise<void> {
        await engine.executeAgent(agent.id, project, apiKey);
    }
}

export default new RunAgentCommand();