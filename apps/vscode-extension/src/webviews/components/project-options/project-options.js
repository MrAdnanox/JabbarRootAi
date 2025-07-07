// apps/vscode-extension/src/webviews/assets/js/projectOptions.webview.js
(function() {
    const vscode = acquireVsCodeApi();
    const initialState = window.initialState || {};

    // --- LOGIQUE DE SAUVEGARDE ---
    function getFormValues() {
        const data = {};
        // Récupérer tous les inputs, radios, checkboxes, textareas
        document.querySelectorAll('input[name], textarea[name]').forEach(input => {
            if (input.type === 'radio') {
                if (input.checked) {
                    data[input.name] = input.value;
                }
            } else if (input.type === 'checkbox') {
                data[input.name] = input.checked;
            } else if (input.type === 'number') {
                data[input.name] = parseInt(input.value, 10);
            } else if (input.tagName.toLowerCase() === 'textarea') {
                data[input.name] = input.value.split('\n').filter(line => line.trim() !== '');
            } else {
                data[input.name] = input.value;
            }
        });
        return data;
    }

    // --- LOGIQUE D'INITIALISATION ---
    function initializeForm(state) {
        console.log("[jabbarroot] Initializing form with state:", state); // Log pour la console de la webview

        // Pour chaque clé dans notre état initial...
        for (const key in state) {
            const value = state[key];
            const radioSelector = `input[name="${key}"][value="${value}"]`;
            const radioElement = document.querySelector(radioSelector);

            if (radioElement && radioElement.type === 'radio') {
                // Gérer les boutons radio
                radioElement.checked = true;
            } else {
                // Gérer tous les autres types d'input
                const element = document.querySelector(`[name="${key}"]`);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = value === true;
                    } else if (Array.isArray(value)) {
                        element.value = value.join('\n');
                    } else {
                        element.value = value;
                    }
                }
            }
        }
    }


    // --- POINT D'ENTRÉE ---
    window.addEventListener('DOMContentLoaded', () => {
        // Le panneau de débogage est initialisé dans le HTML principal
        
        initializeForm(initialState);
        
        const saveButton = document.getElementById('save-button');
        if(saveButton) {
            saveButton.addEventListener('click', () => {
                const updatedOptions = getFormValues();
                console.log("[jabbarroot] Saving options:", updatedOptions); // Log avant l'envoi
                vscode.postMessage({
                    type: 'save',
                    payload: { updatedOptions: updatedOptions }
                });
            });
        }
    });
}());