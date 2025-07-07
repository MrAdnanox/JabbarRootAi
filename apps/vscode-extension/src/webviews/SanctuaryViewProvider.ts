// --- FICHIER : apps/vscode-extension/src/webviews/SanctuaryViewProvider.ts ---
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IService, ServiceCollection } from '../core/interfaces';
import { ArtefactService, OrdoAbChaosOrchestrator } from '@jabbarroot/prompt-factory';
import { ProjectService, CacheService, JabbarProject } from '@jabbarroot/core';
import { DialogService } from '../services/ui/dialog.service';

function getCacheFromOrchestrator(orchestrator: any): CacheService | undefined {
    return orchestrator['cacheService'];
}

export class SanctuaryViewProvider implements IService {
    public static currentPanel: SanctuaryViewProvider | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _isDisposed = false; // Garde de protection

    constructor(
        extensionUri: vscode.Uri,
        private readonly projectService: ProjectService,
        private readonly artefactService: ArtefactService,
        private readonly dialogService: DialogService,
        private readonly cacheService: CacheService | undefined
    ) {
        this._extensionUri = extensionUri;
        this._panel = vscode.window.createWebviewPanel(
            'sanctuary', 'Le Sanctuaire', vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'src', 'webviews', 'components')]
            }
        );

        // Le constructeur met en place le panel et les écouteurs.
        // Le chargement des données est déclenché séparément.
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(message => this.handleMessage(message), null, this._disposables);
        
        // On déclenche le chargement initial
        this.loadContent();
    }

    public static createOrShow(
        extensionUri: vscode.Uri,
        services: Map<keyof ServiceCollection, IService>
    ): void {
        if (SanctuaryViewProvider.currentPanel) {
            SanctuaryViewProvider.currentPanel._panel.reveal(vscode.ViewColumn.One);
        } else {
            const projectService = services.get('projectService') as ProjectService;
            const artefactService = services.get('artefactService') as ArtefactService;
            const dialogService = services.get('dialogService') as DialogService;
            const orchestrator = services.get('ordoAbChaosOrchestrator') as OrdoAbChaosOrchestrator;
            const cacheService = getCacheFromOrchestrator(orchestrator);

            const provider = new SanctuaryViewProvider(
                extensionUri, projectService, artefactService, dialogService, cacheService
            );
            SanctuaryViewProvider.currentPanel = provider;
        }
    }

    // Nouvelle méthode pour charger le contenu de manière asynchrone et sécurisée
    private async loadContent(): Promise<void> {
        // Affiche un message de chargement immédiatement
        this._panel.webview.html = `<h1>Chargement du Sanctuaire...</h1>`;

        const project = await this.dialogService.showProjectPicker();
        
        // Vérifier si le panel a été fermé pendant l'attente
        if (this._isDisposed) {
            return;
        }

        if (!project) {
            this._panel.webview.html = `<h1>Veuillez sélectionner un projet pour continuer.</h1>`;
            this._panel.title = 'Le Sanctuaire';
            return;
        }
        
        this._panel.title = `Sanctuaire : ${project.name}`;

        const artefactBrick = await this.artefactService.findArtefactBrick(project, 'Architectural Report');
        const report = artefactBrick ? await this.artefactService.readArchitecturalReport(artefactBrick) : undefined;
        
        let graph = { nodes: [], edges: [] };
        if (this.cacheService) {
            const db = this.cacheService.getDbConnection();
            const graphRow = await new Promise<{ graph_data_blob: Buffer } | undefined>((resolve, reject) => {
                db.get(
                    "SELECT graph_data_blob FROM knowledge_graphs WHERE project_path = ? AND is_promoted = 1 ORDER BY created_at DESC LIMIT 1",
                    [project.projectRootPath],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row as any);
                    }
                );
            });

            if (graphRow) {
                try {
                    graph = JSON.parse(graphRow.graph_data_blob.toString('utf8'));
                } catch (e) {
                    console.error("Erreur de parsing du graphe JSON:", e);
                }
            }
        }

        // Vérifier à nouveau avant la mise à jour finale du HTML
        if (this._isDisposed) {
            return;
        }
        this._panel.webview.html = await this.getHtmlForWebview(project, report, graph);
    }
    
    private handleMessage(message: any) {
        if (this._isDisposed) return;
        // ... (implémentation de la gestion des messages)
    }

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private async getHtmlForWebview(project: JabbarProject, report: any, graph: any): Promise<string> {
        const webview = this._panel.webview;
        const nonce = this.getNonce();
        const cspSource = webview.cspSource;

        // --- CSP avec support pour les styles inline ---
        // On autorise les ressources locales, les polices inline et les styles inline
        const csp = `
            default-src 'none';
            style-src ${cspSource} 'unsafe-inline';
            script-src 'nonce-${nonce}';
            font-src ${cspSource};
            connect-src 'self';
        `;

        // --- URIs des ressources locales ---
        const tailwindUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webviews', 'components', 'shared', 'css', 'tailwind.min.css'));
        const sanctuaryCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webviews', 'components', 'sanctuary', 'sanctuary.css'));
        const d3Uri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webviews', 'components', 'shared', 'js', 'd3.v7.min.js'));
        const mainJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webviews', 'components', 'sanctuary', 'js', 'main.js'));

        // --- Injection des données ---
        const initialData = { 
            projectName: project.name,
            report, 
            graph 
        };

        // --- Construction du HTML final avec les ressources locales ---
        return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Le Sanctuaire</title>
    
    <link rel="stylesheet" href="${tailwindUri}">
    <link rel="stylesheet" href="${sanctuaryCssUri}">
</head>
<body class="antialiased">
    <div class="dashboard-container">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 bg-[#2c2c2d] border-b border-[#3a3a3a]">
            <h1 class="text-xl font-semibold text-white">Dashboard : <span id="project-name"></span></h1>
            <div class="flex space-x-2">
                <button id="overview-tab" class="tab-button active">Vue d'Ensemble</button>
                <button id="graph-tab" class="tab-button">Graphe de Connaissance</button>
            </div>
        </div>

        <!-- Content Area -->
        <div id="dashboard-content" class="p-6">
            <!-- Overview Tab -->
            <div id="overview-view" class="flex flex-col lg:flex-row gap-6 w-full">
                <!-- Contenu sera généré par le code JavaScript -->
            </div>
            <!-- Graph Tab -->
            <div id="graph-view" class="hidden w-full flex-col items-center justify-center">
                <div class="graph-container">
                    <svg id="knowledge-graph"></svg>
                </div>
            </div>
        </div>
    </div>

    <script nonce="${nonce}">
        window.vscode = acquireVsCodeApi();
        window.initialData = ${JSON.stringify(initialData)};
    </script>
    <script nonce="${nonce}" src="${d3Uri}"></script>
    <script nonce="${nonce}" type="module" src="${mainJsUri}"></script>
</body>
</html>`;
    }
    
    public dispose() {
        if (this._isDisposed) return;
        this._isDisposed = true; // Marquer comme disposé
        SanctuaryViewProvider.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            this._disposables.pop()?.dispose();
        }
    }
}
