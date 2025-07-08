import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsDir = path.join(__dirname, '../src/commands');
const entriesFile = path.join(__dirname, '../src/generated/entries.ts');

// Créer le répertoire généré s'il n'existe pas
fs.mkdirSync(path.dirname(entriesFile), { recursive: true });

// Trouver tous les fichiers de commandes
function findCommandFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(findCommandFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.command.ts')) {
      // Convertir le chemin en chemin d'importation relatif
      const relPath = path.relative(path.dirname(entriesFile), fullPath)
        .replace(/\\/g, '/') // Normaliser les séparateurs (échapper le backslash)
        .replace(/\.ts$/, ''); // Enlever l'extension
      results.push(relPath);
    }
  }
  
  return results;
}

// Générer le contenu du fichier d'entrée
const commandFiles = findCommandFiles(commandsDir);
const fileContent = `// Fichier généré automatiquement - NE PAS MODIFIER MANUELLEMENT

// Importer toutes les commandes
${commandFiles.map((file, index) => `import * as cmd${index} from '${file}';`).join('\n')}

// Exporter toutes les commandes
export const commands = [
${commandFiles.map((_, index) => `  cmd${index}.default`).join(',\n')}
];
`;

// Écrire le fichier
try {
  fs.writeFileSync(entriesFile, fileContent);
  console.log(`✅ Fichier d'entrée généré: ${entriesFile}`);
} catch (error) {
  console.error('❌ Erreur lors de la génération du fichier d\'entrée:', error);
  process.exit(1);
}
