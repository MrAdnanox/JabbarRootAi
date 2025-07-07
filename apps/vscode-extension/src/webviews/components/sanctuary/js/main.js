// --- FICHIER : apps/vscode-extension/src/webviews/components/sanctuary/js/main.js ---
import { initOverview } from './overview.controller.js';
import { initGraph } from './graph.controller.js';

(function() {
    // --- Initialisation des données ---
    const vscode = window.vscode;
    const { projectName, report, graph } = window.initialData;
    
    const projectNameElement = document.getElementById('project-name');
    if (projectNameElement) {
        projectNameElement.textContent = projectName || 'Inconnu';
    }

    // --- CORRECTION : Logique de gestion des onglets ---
    const overviewTabBtn = document.getElementById('overview-tab');
    const graphTabBtn = document.getElementById('graph-tab');
    
    const overviewView = document.getElementById('overview-view');
    const graphView = document.getElementById('graph-view');

    const tabs = [overviewTabBtn, graphTabBtn];
    const views = [overviewView, graphView];

    function switchTab(targetTab) {
        tabs.forEach(tab => {
            if (tab === targetTab) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        views.forEach(view => {
            if (view.id === `${targetTab.id.replace('-tab', '')}-view`) {
                view.classList.remove('hidden');
            } else {
                view.classList.add('hidden');
            }
        });
    }

    overviewTabBtn.addEventListener('click', () => switchTab(overviewTabBtn));
    
    graphTabBtn.addEventListener('click', () => {
        switchTab(graphTabBtn);
        // Initialiser le graphe seulement quand on clique sur l'onglet pour la première fois
        // pour de meilleures performances.
        if (!graphView.dataset.initialized) {
            initGraph(graph, vscode);
            graphView.dataset.initialized = "true";
        }
    });

    // --- Initialisation de la vue par défaut ---
    initOverview(report, vscode);

}());