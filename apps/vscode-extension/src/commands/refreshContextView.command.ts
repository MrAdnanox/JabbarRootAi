import * as vscode from 'vscode';
import { ContextTreeDataProvider } from '../providers/contextTreeDataProvider';

/**
 * Enregistre la commande pour rafraîchir la vue des contextes.
 * @param contextTreeProvider Le fournisseur de données de la vue à rafraîchir.
 * @returns Un objet vscode.Disposable qui peut être ajouté aux subscriptions.
 */
export function registerRefreshContextViewCommand(
  contextTreeProvider: ContextTreeDataProvider
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbaRoot.refreshContextView', () => {
    contextTreeProvider.refresh();
  });
}
