const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

async function deleteNodeModulesAndDist(rootDir) {
    try {
        const items = await fs.readdir(rootDir, { withFileTypes: true });
        
        for (const item of items) {
            const fullPath = path.join(rootDir, item.name);
            
            if (item.isDirectory()) {
                // Supprimer les dossiers node_modules et dist
                if (item.name === 'node_modules' || item.name === 'dist') {
                    console.log(`Suppression de ${fullPath}...`);
                    try {
                        await fs.rm(fullPath, { recursive: true, force: true });
                        console.log(`✓ ${fullPath} supprimé avec succès`);
                    } catch (err) {
                        console.error(`Erreur lors de la suppression de ${fullPath}:`, err.message);
                    }
                } else {
                    // Explorer les sous-dossiers
                    await deleteNodeModulesAndDist(fullPath);
                }
            } else if (item.isFile() && item.name === 'tsconfig.tsbuildinfo') {
                // Supprimer les fichiers tsconfig.tsbuildinfo
                console.log(`Suppression du fichier ${fullPath}...`);
                try {
                    await fs.unlink(fullPath);
                    console.log(`✓ ${fullPath} supprimé avec succès`);
                } catch (err) {
                    console.error(`Erreur lors de la suppression de ${fullPath}:`, err.message);
                }
            }
        }
    } catch (err) {
        console.error(`Erreur lors de la lecture du dossier ${rootDir}:`, err.message);
    }
}

// Démarrer depuis le répertoire parent du script
const rootDir = __dirname;
console.log(`Nettoyage des dossiers node_modules et dist dans ${rootDir}...`);

deleteNodeModulesAndDist(rootDir)
    .then(() => console.log('Nettoyage terminé !'))
    .catch(err => console.error('Erreur lors du nettoyage:', err));
