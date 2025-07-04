// apps/vscode-extension/esbuild.mjs
import esbuild from 'esbuild';
import { pnpPlugin } from '@yarnpkg/esbuild-plugin-pnp';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');

/**
 * Trouve récursivement tous les fichiers .command.ts dans un répertoire.
 * @param {string} dir - Le répertoire de départ.
 * @returns {string[]} Liste des chemins complets des fichiers trouvés.
 */
const findCommandFiles = (dir) => {
  let files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(findCommandFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.command.ts')) {
      files.push(fullPath);
    }
  }
  return files;
};

// Copier le fichier WASM dans le dossier dist
const copyWasmFile = () => {
  try {
    const wasmPath = path.join(__dirname, '..', '..', 'node_modules', 'tiktoken', 'tiktoken_bg.wasm');
    const outDir = path.join(__dirname, 'dist');
    const outPath = path.join(outDir, 'tiktoken_bg.wasm');
    
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    fs.copyFileSync(wasmPath, outPath);
    console.log('Fichier tiktoken_bg.wasm copié avec succès');
  } catch (error) {
    console.error('Erreur lors de la copie du fichier WASM:', error);
  }
};

// Exécuter les fonctions d'initialisation
copyWasmFile();

// Configuration pour l'extension principale
const extensionBuild = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node16',
  sourcemap: 'inline',
  plugins: [pnpPlugin()],
});

// Configuration pour les commandes
const commandsDir = path.join(__dirname, 'src', 'commands');
const commandFiles = findCommandFiles(commandsDir);

console.log(`Found ${commandFiles.length} command files to build.`);

const commandBuilds = await Promise.all(
  commandFiles.map(entry => {
    // Calcule le chemin de sortie en préservant la structure des sous-dossiers
    const relativePath = path.relative(commandsDir, entry);
    const outfile = path.join(__dirname, 'dist', 'commands', relativePath.replace(/\.ts$/, '.js'));

    // S'assurer que le répertoire de sortie existe
    const outDir = path.dirname(outfile);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    return esbuild.context({
      entryPoints: [entry],
      bundle: true,
      outfile,
      external: ['vscode', '@jabbarroot/core', '@jabbarroot/types', '@jabbarroot/prompt-factory'],
      format: 'cjs',
      platform: 'node',
      target: 'node16',
      sourcemap: 'inline',
      plugins: [pnpPlugin()],
    });
  })
);

// Combiner tous les contextes de build
const allContexts = [extensionBuild, ...commandBuilds];

// Fonction pour démarrer tous les builds
const startBuilds = async () => {
  if (isWatch) {
    await Promise.all(allContexts.map(ctx => ctx.watch()));
    console.log('esbuild is watching for changes...');
  } else {
    await Promise.all(allContexts.map(ctx => ctx.rebuild()));
    await Promise.all(allContexts.map(ctx => ctx.dispose()));
    console.log('esbuild build complete.');
  }
};

// Démarrer les builds
await startBuilds();