// apps/vscode-extension/src/webviews/ProjectOptionsViewProvider.ts
import * as vscode from 'vscode';
import { JabbarProject, JabbarProjectOptions } from '@jabbarroot/core';

// Le nonce est une fonction utilitaire que nous pourrions factoriser plus tard
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export class ProjectOptionsViewProvider {
    constructor(
        private readonly project: JabbarProject,
        private readonly extensionUri: vscode.Uri
    ) {}

    public getHtmlForWebview(webview: vscode.Webview): string {
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src', 'webviews', 'assets', 'css', 'main.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src', 'webviews', 'components', 'project-options', 'project-options.js'));
        const nonce = getNonce();

        // Nous passons directement les options du projet, car il n'y a pas de concept d'héritage ici.
        const state: JabbarProjectOptions = this.project.options;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Options: ${this.project.name}</title>
    <style>
        body { font-family: var(--vscode-font-family); color: var(--vscode-editor-foreground); background-color: var(--vscode-editor-background); padding: 1rem 2rem; }
        h1, .section-title { border-bottom: 1px solid var(--vscode-editor-widget-border); padding-bottom: 0.5rem; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem 2rem; }
        .section-title { grid-column: 1 / -1; font-size: 1.2rem; margin: 2rem 0 1rem 0; }
        .config-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        .option-container { display: flex; flex-direction: column; gap: 0.75rem; }
        .radio-label, .checkbox-label { display: flex; align-items: center; gap: 0.5rem; margin: 0; font-weight: normal; }
        .input-label { display: flex; align-items: center; gap: 0.5rem; }
        input[type="radio"], input[type="checkbox"] { width: 1rem; height: 1rem; }
        .description { font-size: 0.8rem; color: var(--vscode-descriptionForeground); margin-left: 1.5rem; }
        textarea, input[type="number"] { width: 100%; background-color: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); font-family: var(--vscode-font-family); padding: 0.25rem; }
        input[type="number"] { width: 60px; }
        textarea { height: 80px; }
        button { padding: 0.5rem 1rem; border: 1px solid transparent; background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); cursor: pointer; margin-top: 1rem; }
        button:hover { background-color: var(--vscode-button-hoverBackground); }
    </style>
</head>
<body>
    <h1>Options pour le Projet : <em>${this.project.name}</em></h1>


    <!-- BLOC DE DÉBOGAGE -->
    <div id="debug-panel" style="background-color: var(--vscode-textCodeBlock-background); padding: 1rem; border: 1px solid red; margin-bottom: 2rem;">
        <h2>État Initial Reçu par la Webview :</h2>
        <pre><code id="debug-state"></code></pre>
    </div>
    <!-- FIN DU BLOC DE DÉBOGAGE -->

    <div class="grid">
        <h2 class="section-title">Options de Compilation du Projet Global</h2>
        <div class="config-group">
            <label>Niveau de Compression</label>
            <div class="option-container">
                <div class="radio-label"><input type="radio" name="compilationCompressionLevel" value="none"><label>Aucune</label></div>
                <div class="radio-label"><input type="radio" name="compilationCompressionLevel" value="standard"><label>Standard</label></div>
                <div class="radio-label"><input type="radio" name="compilationCompressionLevel" value="extreme"><label>Extrême</label></div>
            </div>
        </div>
        <div class="config-group">
            <label>Structure du Projet</label>
            <div class="option-container">
                 <div class="checkbox-label"><input type="checkbox" name="compilationIncludeProjectTree"><label>Inclure l'arborescence (PROJECT_TREE)</label></div>
            </div>
        </div>

        <h2 class="section-title">Options par Défaut (pour les Briques)</h2>
        <div class="config-group">
            <label>Compression par Défaut</label>
            <div class="option-container">
                <div class="radio-label"><input type="radio" name="defaultBrickCompressionLevel" value="none"><label>Aucune</label></div>
                <div class="radio-label"><input type="radio" name="defaultBrickCompressionLevel" value="standard"><label>Standard</label></div>
                <div class="radio-label"><input type="radio" name="defaultBrickCompressionLevel" value="extreme"><label>Extrême</label></div>
            </div>
        </div>
        <div class="config-group">
            <label>Arborescence par Défaut</label>
            <div class="option-container">
                 <div class="checkbox-label"><input type="checkbox" name="defaultBrickIncludeProjectTree"><label>Inclure par défaut</label></div>
                 <div class="input-label"><label for="default-depth">Profondeur max:</label><input type="number" id="default-depth" name="defaultBrickIncludeProjectTreeMaxDepth" min="1" max="20"></div>
            </div>
        </div>

        <h2 class="section-title">Options d'Ignorance (Globales)</h2>
        <div class="config-group">
            <label>Fichiers d'ignorance</label>
            <textarea name="projectIgnoreFiles" placeholder="ex: ./.jabbarrootignore"></textarea>
            <p class="description">Chemins relatifs à la racine.</p>
        </div>
        <div class="config-group">
            <label>Patterns d'ignorance</label>
            <textarea name="projectIgnorePatterns" placeholder="ex: **/*.log"></textarea>
            <p class="description">Un pattern glob par ligne.</p>
        </div>
    </div>
    
    <button id="save-button">Enregistrer et Fermer</button>
    

    <script nonce="${nonce}">
        window.initialState = ${JSON.stringify(state)};
        // Afficher l'état dans le panneau de débogage
        document.addEventListener('DOMContentLoaded', () => {
            const debugState = document.getElementById('debug-state');
            if (debugState) {
                debugState.textContent = JSON.stringify(window.initialState, null, 2);
            }
        });
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}