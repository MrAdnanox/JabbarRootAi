// apps/vscode-extension/src/commands/diagnostics/CheckSecret.command.ts
import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../../core/interfaces';

const SECRET_KEY_TO_CHECK = 'CONTEXT7_API_KEY';

export class CheckSecretCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.diagnostics.checkSecret',
        title: 'JabbarRoot (Diag): Vérifier la présence d\'un secret',
        category: 'jabbarroot' as const,
    };

    // Cette commande n'a besoin que du contexte de l'extension pour accéder aux secrets
    public readonly dependencies = ['extensionContext'] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        const context = services.get('extensionContext') as vscode.ExtensionContext;

        if (!context || !context.secrets) {
            vscode.window.showErrorMessage('[DIAGNOSTIC] Le contexte ou context.secrets est indéfini !');
            return;
        }

        vscode.window.showInformationMessage(`[DIAGNOSTIC] Lecture du secret : '${SECRET_KEY_TO_CHECK}'...`);

        try {
            // Appel direct à l'API VS Code, sans notre adaptateur, pour une mesure brute.
            const secretValue = await context.secrets.get(SECRET_KEY_TO_CHECK);

            if (secretValue !== undefined) {
                // NE PAS afficher le secret complet pour des raisons de sécurité, juste une confirmation.
                const confirmation = `Secret '${SECRET_KEY_TO_CHECK}' TROUVÉ. Valeur commence par : ${secretValue.substring(0, 8)}...`;
                vscode.window.showInformationMessage(confirmation);
                console.log(`[DIAGNOSTIC] ${confirmation}`);
            } else {
                const message = `Secret '${SECRET_KEY_TO_CHECK}' NON TROUVÉ (la valeur est undefined).`;
                vscode.window.showErrorMessage(message);
                console.warn(`[DIAGNOSTIC] ${message}`);
            }
        } catch (error) {
            const errorMessage = `ERREUR SYSTÈME lors de la lecture du secret '${SECRET_KEY_TO_CHECK}'.`;
            vscode.window.showErrorMessage(errorMessage);
            console.error(`[DIAGNOSTIC] ${errorMessage}`, error);
        }
    }
}

export default new CheckSecretCommand();