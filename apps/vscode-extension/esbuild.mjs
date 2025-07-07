import esbuild from 'esbuild';
import { nativeNodeModulesPlugin } from 'esbuild-native-node-modules-plugin';

import * as fs from 'fs'; // Import de fs
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');
const outDir = path.join(__dirname, 'dist');

const nativeExternals = [
    'vscode', 
    'tree-sitter', 
    'web-tree-sitter', 
    'tiktoken',
    '@vscode/sqlite3'
];

// Votre plugin personnalisé, c'est la bonne approche.
const monorepoPathsPlugin = {
  name: 'monorepo-paths',
  setup(build) {
    build.onResolve({ filter: /^@jabbarroot\/.*/ }, (args) => {
      const packageName = args.path.replace('@jabbarroot/', '');
      const packagePath = path.resolve(__dirname, `../../packages/${packageName}/src/index.ts`);
      return { path: packagePath };
    });
  }
};

const baseConfig = {
  bundle: true,
  external: nativeExternals,
  format: 'cjs',
  platform: 'node',
  target: 'node16',
  sourcemap: 'inline',
  plugins: [
    monorepoPathsPlugin,
    nativeNodeModulesPlugin 
  ],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  logLevel: 'info'
};

// --- RÉINTRODUCTION DE LA LOGIQUE DE BUILD DES COMMANDES ---
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

const commandsDir = path.join(__dirname, 'src', 'commands');
const commandFiles = findCommandFiles(commandsDir);
console.log(`Found ${commandFiles.length} command files to build.`);

const commandBuilds = await Promise.all(
  commandFiles.map(entry => {
    const relativePath = path.relative(commandsDir, entry);
    const outfile = path.join(outDir, 'commands', relativePath.replace(/\.ts$/, '.cjs'));
    const outfileDir = path.dirname(outfile);
    if (!fs.existsSync(outfileDir)) {
      fs.mkdirSync(outfileDir, { recursive: true });
    }
    return esbuild.context({
      ...baseConfig,
      entryPoints: [entry],
      outfile,
      // Les commandes doivent traiter les packages du monorepo comme externes
      // car ils sont déjà dans le bundle principal de l'extension.
      // Cela évite de dupliquer le code.
      external: [ ...nativeExternals, '@jabbarroot/core', '@jabbarroot/types', '@jabbarroot/prompt-factory' ],
    });
  })
);
// --- FIN DE LA LOGIQUE DE BUILD DES COMMANDES ---

const workerBuild = await esbuild.context({
    ...baseConfig,
    entryPoints: ['../../packages/core/src/services/concurrency/worker-task.ts'],
    outfile: path.join(outDir, 'worker-task.js'),
    external: ['web-tree-sitter'] 
});

const extensionBuild = await esbuild.context({
  ...baseConfig,
  entryPoints: ['src/extension.ts'],
  outfile: path.join(outDir, 'extension.cjs'),
  external: [ ...baseConfig.external, './commands/*' ],
});

// Ajout des contextes de build des commandes
const allContexts = [extensionBuild, workerBuild, ...commandBuilds];

const startBuilds = async () => {
  console.log('🔧 Starting corrected build process...');
  
  // Copier le répertoire des parsers
  const parsersSrc = path.join(__dirname, 'parsers');
  const parsersDest = path.join(outDir, 'parsers');
  if (fs.existsSync(parsersSrc)) {
    fs.mkdirSync(parsersDest, { recursive: true });
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