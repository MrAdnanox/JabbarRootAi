// apps/vscode-extension/src/webviews/BrickOptionsViewProvider.ts
import * as vscode from 'vscode';
import { JabbarProject, BrickContext, BrickContextOptions, JabbarProjectOptions, CompressionLevel } from '@jabbarroot/types';

// Interface pour clarifier les données passées à la webview
interface WebviewState {
    brickOptions: BrickContextOptions;
    projectDefaults: JabbarProjectOptions;
    effectiveOptions: {
        compilationCompressionLevel: CompressionLevel;
        compilationIncludeProjectTree: boolean;
    };
}

export class BrickOptionsViewProvider {
    constructor(
        private readonly brick: BrickContext,
        private readonly project: JabbarProject,
        private readonly extensionUri: vscode.Uri
    ) {}

    public getHtmlForWebview(webview: vscode.Webview): string {
        // 1. Calculer les options effectives
        const effectiveCompression = this.brick.options.compilationCompressionLevel ?? this.project.options.defaultBrickCompressionLevel;
        const effectiveIncludeTree = this.brick.options.compilationIncludeProjectTree ?? this.project.options.defaultBrickIncludeProjectTree;

        const state: WebviewState = {
            brickOptions: this.brick.options,
            projectDefaults: this.project.options,
            effectiveOptions: {
                compilationCompressionLevel: effectiveCompression,
                compilationIncludeProjectTree: effectiveIncludeTree,
            }
        };

        // 2. Créer les URIs sécurisées pour les assets
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src', 'webviews', 'components', 'brick-options', 'brick-options.js'));
        const commonCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src', 'webviews', 'components', 'shared', 'css', 'common.css'));
        const nonce = getNonce();

        // 3. Construire l'HTML final, en injectant l'état et le script
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Options: ${this.brick.name}</title>
    <link rel="stylesheet" href="${commonCssUri}">
</head>
<body>
    <h1>Options pour la brique : <em>${this.brick.name}</em></h1>

    <div class="config-group">
        <label>Niveau de Compression</label>
        <div class="option-container">
            <div class="radio-label">
                <input type="radio" id="comp-none" name="compilationCompressionLevel" value="none">
                <label for="comp-none">Aucune (None)</label>
            </div>
            <p class="description">Le contenu des fichiers est inclus tel quel. Idéal pour la lisibilité.</p>

            <div class="radio-label">
                <input type="radio" id="comp-standard" name="compilationCompressionLevel" value="standard">
                <label for="comp-standard">Standard</label>
            </div>
            <p class="description">Supprime les commentaires et les espaces inutiles. Bon équilibre.</p>

            <div class="radio-label">
                <input type="radio" id="comp-extreme" name="compilationCompressionLevel" value="extreme">
                <label for="comp-extreme">Extrême</label>
            </div>
            <p class="description">Compaction agressive, peut joindre des lignes. Réduction maximale des tokens.</p>
        </div>
    </div>

    <div class="config-group">
        <label>Structure du Projet</label>
        <div class="option-container">
             <div class="checkbox-label">
                <input type="checkbox" id="include-tree" name="compilationIncludeProjectTree">
                <label for="include-tree">Inclure l'arborescence du projet (PROJECT_TREE)</label>
            </div>
            <p class="description">Ajoute une section listant la structure des fichiers du projet au début du contexte.</p>
        </div>
    </div>
    
    <button id="save-button">Enregistrer</button>

    <!-- INJECTION DES DONNÉES ET DU SCRIPT -->
    <script nonce="${nonce}">
        window.initialState = ${JSON.stringify(state)};
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}