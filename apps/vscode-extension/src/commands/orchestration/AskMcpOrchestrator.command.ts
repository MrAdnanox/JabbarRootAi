// apps/vscode-extension/src/commands/orchestration/AskMcpOrchestrator.command.ts
import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../../core/interfaces';
import { MCPOrchestrator } from '@jabbarroot/prompt-factory';
import { NotificationService } from '../../services/ui/notification.service';

export class AskMcpOrchestratorCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.orchestration.AskMcpOrchestrator',
        title: 'JabbarRoot: Interroger l\'Orchestrateur MCP...',
        category: 'jabbarroot' as const,
    };
    public readonly dependencies = ['mcpOrchestrator', 'notificationService'] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        const orchestrator = services.get('mcpOrchestrator') as MCPOrchestrator;
        const notificationService = services.get('notificationService') as NotificationService;

        const capability = await vscode.window.showInputBox({ 
            prompt: 'Capacité (ex: resolve-library-id, get-library-docs)' 
        });
        if (!capability) return;

        // JUSTIFICATION : L'invite est mise à jour pour refléter les SEULS paramètres valides,
        // tels qu'établis par l'Opérateur. Zéro place à l'erreur.
        const paramsStr = await vscode.window.showInputBox({ 
            prompt: 'Paramètres JSON. Exemples:',
            placeHolder: `Pour resolve-library-id: {"libraryName": "zod"} | Pour get-library-docs: {"context7CompatibleLibraryID": "/colinhacks/zod", "tokens": 4000}`
        });
        if (!paramsStr) return;

        let params: object;
        try {
            params = JSON.parse(paramsStr);
        } catch (e) {
            notificationService.showError('JSON des paramètres invalide.');
            return;
        }

        await notificationService.withProgress(`Appel à l'orchestrateur pour "${capability}"`, async () => {
            try {
                const result = await orchestrator.query(capability, params);
                const outputChannel = vscode.window.createOutputChannel("JabbarRoot - Réponse MCP");
                outputChannel.clear();
                outputChannel.appendLine(`--- Résultats pour ${capability} ---`);
                outputChannel.appendLine(`\n✅ Succès: ${result.successful.length}`);
                outputChannel.append(JSON.stringify(result.successful, null, 2));
                outputChannel.appendLine(`\n\n❌ Échecs: ${result.failed.length}`);
                outputChannel.append(JSON.stringify(result.failed.map((f: any) => ({ serverId: f.serverId, error: f.error.message })), null, 2));
                outputChannel.show();
            } catch (error) {
                notificationService.showError("L'orchestrateur a rencontré une erreur fatale", error);
            }
        });
    }
}

export default new AskMcpOrchestratorCommand();