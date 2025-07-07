// --- FICHIER : apps/vscode-extension/esbuild.mjs ---
import esbuild from 'esbuild';
import { nativeNodeModulesPlugin } from 'esbuild-native-node-modules-plugin';
import * as fs from 'fs'; 
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');
const isPackage = process.argv.includes('--package'); // Bonne pratique : option pour le build final
const outDir = path.join(__dirname, 'dist');

// CORRECTION : Ces dépendances sont natives à l'environnement VS Code ou contiennent
// des binaires. Elles DOIVENT impérativement rester externes et ne pas être "bundlées".
const nativeExternals = [
    'vscode', 
    'tree-sitter', 
    'web-tree-sitter', 
    'tiktoken',
    '@vscode/sqlite3'
];

// SUPPRESSION : Le plugin personnalisé pour les chemins du monorepo est maintenant obsolète.
// esbuild est capable de résoudre les "workspaces" d'un monorepo tout seul (via les 
// package.json) tant qu'on ne lui dit PAS de les traiter comme des paquets externes.
/*
const monorepoPathsPlugin = { ... };
*/

const baseConfig = {
  bundle: true,
  // CORRECTION : La seule liste d'externals nécessaire est celle des dépendances natives.
  // En ne déclarant pas nos propres packages (@jabbarroot/...) ici, on demande à esbuild
  // de les trouver et de les inclure dans le bundle.
  external: nativeExternals,
  format: 'cjs',
  platform: 'node',
  target: 'node16',
  // Amélioration : on désactive les sourcemaps pour le package final pour réduire sa taille.
  sourcemap: isPackage ? false : 'inline', 
  plugins: [
    // On retire le plugin monorepo devenu inutile.
    nativeNodeModulesPlugin 
  ],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  logLevel: 'info'
};

// SIMPLIFICATION MAJEURE :
// Toute la logique de build séparé pour les commandes a été supprimée.
// C'était une complexité inutile. esbuild va maintenant créer un seul et unique
// fichier `extension.cjs` qui contiendra tout le code nécessaire (celui de l'extension
// ET celui des commandes), ce qui est beaucoup plus simple et robuste.

const extensionBuild = await esbuild.context({
  ...baseConfig,
  // Le seul point d'entrée nécessaire est celui de l'extension.
  // esbuild suivra tous les `import` à partir de ce fichier.
  entryPoints: ['src/extension.ts'],
  outfile: path.join(outDir, 'extension.cjs'),
  // Plus besoin de déclarer les commandes ou les packages du monorepo comme externes.
});

// Le build du worker reste pertinent s'il doit s'exécuter dans un processus séparé.
const workerBuild = await esbuild.context({
    ...baseConfig,
    entryPoints: ['../../packages/core/src/services/concurrency/worker-task.ts'],
    outfile: path.join(outDir, 'worker-task.js'),
    // 'web-tree-sitter' peut rester externe ici si le worker le charge d'une manière spécifique.
    external: ['web-tree-sitter'] 
});

// La liste des contextes est maintenant bien plus simple.
const allContexts = [extensionBuild, workerBuild];

const startBuilds = async () => {
  console.log('🔧 Starting simplified build process...');
  
  // La logique de copie des parsers est conservée, car ce sont des assets.
  const parsersSrc = path.join(__dirname, 'parsers');
  const parsersDest = path.join(outDir, 'parsers');
  if (fs.existsSync(parsersSrc)) {
    // S'assurer que le répertoire de destination existe
    fs.mkdirSync(parsersDest, { recursive: true });
    // Copier les fichiers
    fs.readdirSync(parsersSrc).forEach(file => {
      fs.copyFileSync(path.join(parsersSrc, file), path.join(parsersDest, file));
    });
    console.log('✅ Copied parsers to dist/parsers');
  } else {
    console.warn('⚠️  Parsers directory not found at:', parsersSrc);
  }

  if (isWatch) {
    await Promise.all(allContexts.map(ctx => ctx.watch()));
    console.log('👁️  esbuild is watching for changes...');
  } else {
    await Promise.all(allContexts.map(ctx => ctx.rebuild()));
    await Promise.all(allContexts.map(ctx => ctx.dispose()));
    console.log('✅ esbuild build complete.');
  }
};

await startBuilds();