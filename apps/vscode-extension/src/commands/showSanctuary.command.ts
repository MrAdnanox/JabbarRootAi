// --- FICHIER : apps/vscode-extension/src/commands/showSanctuary.command.ts ---
import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { SanctuaryViewProvider } from '../webviews/SanctuaryViewProvider';

export class ShowSanctuaryCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.showSanctuary',
        title: 'JabbarRoot: Ouvrir le Sanctuaire',
        category: 'jabbarroot' as const,
    };

    // La commande a besoin de la collection complète pour la passer au provider
    public readonly dependencies = [
        'extensionContext', 'projectService', 'artefactService', 'dialogService', 'ordoAbChaosOrchestrator'
    ] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        const context = services.get('extensionContext') as vscode.ExtensionContext;
        // On passe toute la collection de services pour que le provider puisse se construire
        SanctuaryViewProvider.createOrShow(context.extensionUri, services);
    }
}

export default new ShowSanctuaryCommand();