// apps/vscode-extension/src/commands/diagnostics/TestContext7Sequence.command.ts

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../../core/interfaces';
import { MCPOrchestrator } from '@jabbarroot/prompt-factory';
import { NotificationService } from '../../services/ui/notification.service';

export class TestContext7SequenceCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.diagnostics.testContext7Sequence',
        title: 'JabbarRoot (Diag): Test de la séquence Context7',
        category: 'jabbarroot' as const,
    };
    public readonly dependencies = ['mcpOrchestrator', 'notificationService'] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        const orchestrator = services.get('mcpOrchestrator') as MCPOrchestrator;
        const notificationService = services.get('notificationService') as NotificationService;

        const outputChannel = vscode.window.createOutputChannel("JabbarRoot - DIAGNOSTIC Context7");
        outputChannel.show(true);
        outputChannel.clear();
        outputChannel.appendLine("--- DÉBUT DU TEST DE SÉQUENCE CONTEXT7 MCP (V4 - Parsing Corrigé) ---");

        await notificationService.withProgress('Exécution du test de diagnostic Context7 MCP...', async () => {
            try {
                // --- ÉTAPE 0 : Diagnostic du serveur ---
                outputChannel.appendLine("\n[ÉTAPE 0] Diagnostic du serveur Context7...");
                const diagnosis = await orchestrator.diagnoseServer('context7');
                
                if (diagnosis.error || diagnosis.status !== 'operational') {
                    outputChannel.appendLine(`ERREUR: Le serveur Context7 n'est pas opérationnel.`);
                    outputChannel.appendLine(JSON.stringify(diagnosis, null, 2));
                    notificationService.showError("Le serveur Context7 n'est pas opérationnel. Vérifiez les logs.");
                    return;
                }
                
                outputChannel.appendLine(`Outils disponibles: ${diagnosis.availableTools.map((t: any) => t.name).join(', ')}`);

                // --- ÉTAPE 1 : resolve-library-id ---
                const resolveParams = { libraryName: "react" };
                outputChannel.appendLine(`\n[ÉTAPE 1] Appel de l'outil 'resolve-library-id' avec ${JSON.stringify(resolveParams)}...`);
                
                const resolveResult = await orchestrator.query('resolve-library-id', resolveParams);
                
                if (!resolveResult.successful || resolveResult.successful.length === 0) {
                    outputChannel.appendLine("ERREUR: L'étape 1 a échoué.");
                    outputChannel.appendLine(`Détails: ${JSON.stringify(resolveResult.failed, null, 2)}`);
                    notificationService.showError("Le test de diagnostic a échoué à l'étape 1. Vérifiez les logs.");
                    return;
                }

                const resolveResponse = resolveResult.successful[0].response;
                
                let libraryId: string | null = null;
                
                if (Array.isArray(resolveResponse) && resolveResponse[0]?.type === 'text') {
                    const responseText = resolveResponse[0].text;
                    outputChannel.appendLine(`[ÉTAPE 1] Réponse texte reçue. Recherche de l'ID le plus pertinent pour "React"...`);
                    
                    const blocks = responseText.split('----------');
                    let bestMatch = { id: null as string | null, score: -1 };

                    for (const block of blocks) {
                        const titleMatch = block.match(/-\s*Title:\s*(.*)/);
                        const idMatch = block.match(/-\s*Context7-compatible library ID:\s*(\S*)/);
                        const scoreMatch = block.match(/-\s*Trust Score:\s*(\d+\.?\d*)/);
                        
                        if (titleMatch && idMatch && scoreMatch) {
                            const title = titleMatch[1].trim();
                            const id = idMatch[1].trim();
                            const score = parseFloat(scoreMatch[1]);

                            if (title.toLowerCase() === 'react' && score > bestMatch.score) {
                                bestMatch = { id: id, score: score };
                            }
                        }
                    }
                    libraryId = bestMatch.id;
                }

                if (!libraryId) {
                    outputChannel.appendLine("ERREUR: Impossible d'extraire un ID fiable pour 'React' de la réponse.");
                    outputChannel.appendLine(`Réponse brute: ${JSON.stringify(resolveResponse, null, 2)}`);
                    notificationService.showError("Impossible d'extraire l'ID de la bibliothèque.");
                    return;
                }

                outputChannel.appendLine(`[ÉTAPE 1] SUCCÈS. ID de bibliothèque le plus pertinent extrait : ${libraryId}`);

                // --- ÉTAPE 2 : get-library-docs ---
                const docsParams = { 
                    context7CompatibleLibraryID: libraryId,
                    topic: "hooks",
                    tokens: 3000
                };
                outputChannel.appendLine(`\n[ÉTAPE 2] Appel de l'outil 'get-library-docs' avec ${JSON.stringify(docsParams)}...`);
                
                const docsResult = await orchestrator.query('get-library-docs', docsParams);
                
                if (!docsResult.successful || docsResult.successful.length === 0) {
                    outputChannel.appendLine("ERREUR: L'étape 2 a échoué.");
                    outputChannel.appendLine(`Détails: ${JSON.stringify(docsResult.failed, null, 2)}`);
                    notificationService.showError("Le test de diagnostic a échoué à l'étape 2. Vérifiez les logs.");
                    return;
                }

                const docsResponse = docsResult.successful[0].response;
                
                let documentationText = '';
                if (Array.isArray(docsResponse)) {
                    for (const content of docsResponse) {
                        if (content.type === 'text' && content.text) {
                            documentationText += content.text + '\n';
                        }
                    }
                }

                outputChannel.appendLine(`\n[ÉTAPE 2] SUCCÈS. Documentation reçue.`);
                outputChannel.appendLine(`\n[DOCUMENTATION EXTRAITE] (${documentationText.length} caractères):`);
                outputChannel.appendLine(documentationText.substring(0, 1000) + (documentationText.length > 1000 ? '...' : ''));
                
                outputChannel.appendLine("\n🎉 SUCCÈS: Le test de séquence Context7 MCP s'est terminé avec succès!");
                notificationService.showInfo("Test Context7 MCP terminé avec succès!");

            } catch (error: any) {
                outputChannel.appendLine(`\n❌ ERREUR GLOBALE: ${error.message}`);
                if(error.stack) outputChannel.appendLine(`Stack trace: ${error.stack}`);
                notificationService.showError(`Erreur lors du test Context7 MCP: ${error.message}`);
            }
        });
    }
}

export default new TestContext7SequenceCommand();