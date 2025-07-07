// apps/vscode-extension/src/webviews/assets/js/webview.js

// L'objet 'vscode' est fourni automatiquement dans l'environnement de la webview.
// Il contient la méthode postMessage pour communiquer avec l'extension.
const vscode = acquireVsCodeApi();

// Récupération de l'état initial injecté dans le HTML
const initialState = window.initialState || {
    brickOptions: {},
    projectDefaults: {},
    effectiveOptions: {
        compilationCompressionLevel: 'standard',
        compilationIncludeProjectTree: true
    }
};

// État actuel du formulaire
let currentState = { ...initialState.effectiveOptions };

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des champs du formulaire avec les données reçues
    initializeForm(initialState);
    
    // Configuration des écouteurs d'événements
    setupEventListeners();
});

/**
 * Initialise le formulaire avec les valeurs de l'état fourni
 * @param {Object} state - L'état initial contenant les valeurs à afficher
 */
function initializeForm(state) {
    if (!state) return;

    console.log('Initialisation du formulaire avec l\'état :', state);

    // --- Niveau de Compression ---
    const compressionLevel = state.effectiveOptions?.compilationCompressionLevel || 'standard';
    const compressionRadio = document.querySelector(`input[name="compilationCompressionLevel"][value="${compressionLevel}"]`);
    if (compressionRadio) {
        compressionRadio.checked = true;
    }
    
    // --- Inclusion de l'arborescence ---
    const includeTree = state.effectiveOptions?.compilationIncludeProjectTree ?? true;
    const includeCheckbox = document.getElementById('include-tree');
    if (includeCheckbox) {
        includeCheckbox.checked = Boolean(includeTree);
    }

    // Mise à jour de l'état courant
    currentState = {
        ...currentState,
        compilationCompressionLevel: compressionLevel,
        compilationIncludeProjectTree: includeTree
    };
}

/**
 * Configure les écouteurs d'événements pour le formulaire
 */
function setupEventListeners() {
    // Gestion des changements sur les boutons radio de compression
    const compressionRadios = document.querySelectorAll('input[name="compilationCompressionLevel"]');
    compressionRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentState.compressionLevel = e.target.value;
            console.log('Niveau de compression mis à jour :', e.target.value);
        });
    });

    // Gestion des changements sur la case à cocher d'inclusion d'arborescence
    const includeCheckbox = document.getElementById('include-tree');
    if (includeCheckbox) {
        includeCheckbox.addEventListener('change', (e) => {
            currentState.compilationIncludeProjectTree = e.target.checked;
            console.log('Inclusion de l\'arborescence mise à jour :', e.target.checked);
        });
    }

    // Gestion du clic sur le bouton Enregistrer
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.addEventListener('click', handleSave);
    }
}

/**
 * Gère l'enregistrement des modifications
 */
function handleSave() {
    console.log('Enregistrement des modifications :', currentState);
    
    // Envoi des données à l'extension
    vscode.postMessage({
        command: 'saveOptions',
        options: {
            compilationCompressionLevel: currentState.compressionLevel,
            compilationIncludeProjectTree: currentState.compilationIncludeProjectTree
        }
    });
    
    // Feedback visuel
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        const originalText = saveButton.textContent;
        saveButton.textContent = 'Enregistré !';
        saveButton.disabled = true;
        
        // Réinitialisation après 2 secondes
        setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }, 2000);
    }
}

// Fonction pour récupérer les valeurs du formulaire
function getFormValues() {
    // Niveau de compression
    const compressionRadio = document.querySelector('input[name="compilationCompressionLevel"]:checked');
    const compressionLevel = compressionRadio ? compressionRadio.value : undefined;

    // Inclusion de l'arborescence
    const includeTreeCheckbox = document.getElementById('include-tree');
    const includeTree = includeTreeCheckbox ? includeTreeCheckbox.checked : undefined;

    return {
        compilationCompressionLevel: compressionLevel,
        compilationIncludeProjectTree: includeTree
    };
}

// Gestion des messages en provenance de l'extension
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
        case 'optionsSaved':
            console.log('Options enregistrées avec succès');
            showFeedback('Options enregistrées avec succès', 'success');
            break;
        case 'error':
            console.error('Erreur lors de l\'enregistrement des options :', message.error);
            showFeedback(`Erreur: ${message.error}`, 'error');
            break;
    }
});

// Fonction pour afficher un retour visuel à l'utilisateur
function showFeedback(message, type = 'info') {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    
    document.body.appendChild(feedback);
    
    // Supprimer le message après 3 secondes
    setTimeout(() => {
        feedback.remove();
    }, 3000);
}

// Initialisation de l'écouteur d'événements pour le bouton de sauvegarde
document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const updatedOptions = getFormValues();
            vscode.postMessage({
                type: 'save',
                payload: {
                    updatedOptions: updatedOptions
                }
            });
        });
    }
});