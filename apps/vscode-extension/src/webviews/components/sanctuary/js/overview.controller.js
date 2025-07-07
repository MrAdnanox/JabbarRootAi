export function initOverview(report, vscode) {
    const view = document.getElementById('overview-view');
    if (!report) {
        view.innerHTML = `<div class="card"><p>Aucun rapport architectural trouvé. Veuillez lancer l'analyse.</p></div>`;
        return;
    }

    const kpiHtml = `
        <div class="kpi-column flex flex-col gap-4 w-full lg:w-1/4">
            <div class="card">
                <h2 class="text-lg font-semibold mb-3 text-white">Indicateurs Clés</h2>
                <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between"><span>Fichiers</span><span class="kpi-badge bg-blue-600 text-white">${report.source_statistics.totalFiles}</span></div>
                    <div class="flex items-center justify-between"><span>Profondeur Max</span><span class="kpi-badge bg-blue-600 text-white">${report.source_statistics.maxDepth}</span></div>
                    <div class="flex items-center justify-between"><span>Ratio Test/Code</span><span class="kpi-badge red">${report.source_statistics.ratios.testToCodeRatio.toFixed(2)}%</span></div>
                </div>
            </div>
        </div>`;

    const keyFilesRows = report.keyFiles.map(file => `
        <tr class="table-row" data-path="${file.path}">
            <td class="py-2 px-4 font-medium text-white">${file.path}</td>
            <td class="py-2 px-4">${file.priority}</td>
            <td class="py-2 px-4">${file.impact}</td>
            <td class="py-2 px-4">${file.justification}</td>
        </tr>`).join('');

    const mainContentHtml = `
        <div class="main-content flex flex-col gap-6 w-full lg:w-2/4">
            <div class="card">
                <h2 class="text-lg font-semibold mb-3 text-white">Synthèse</h2>
                <p class="text-sm text-gray-300">${report.summary}</p>
            </div>
            <div class="card flex-grow overflow-x-auto">
                <h2 class="text-lg font-semibold mb-3 text-white">Fichiers Clés</h2>
                <table class="min-w-full text-sm">
                    <thead>...</thead>
                    <tbody>${keyFilesRows}</tbody>
                </table>
            </div>
        </div>`;
    
    // ... construire le HTML pour les insights et les risques ...

    view.innerHTML = kpiHtml + mainContentHtml /* + insightsRisksHtml */;

    // Ajouter les écouteurs d'événements
    view.querySelectorAll('.table-row').forEach(row => {
        row.addEventListener('dblclick', () => {
            vscode.postMessage({ command: 'openFile', path: row.dataset.path });
        });
    });
}