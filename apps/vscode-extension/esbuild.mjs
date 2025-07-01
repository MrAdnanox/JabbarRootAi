// apps/vscode-extension/esbuild.mjs
import esbuild from 'esbuild';
import { pnpPlugin } from '@yarnpkg/esbuild-plugin-pnp';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');

// Copier le fichier WASM dans le dossier dist
const copyWasmFile = () => {
  try {
    const wasmPath = join(__dirname, '..', '..', 'node_modules', 'tiktoken', 'tiktoken_bg.wasm');
    const outDir = join(__dirname, 'dist');
    const outPath = join(outDir, 'tiktoken_bg.wasm');
    
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }
    
    copyFileSync(wasmPath, outPath);
    console.log('Fichier tiktoken_bg.wasm copié avec succès');
  } catch (error) {
    console.error('Erreur lors de la copie du fichier WASM:', error);
  }
};

// Exécuter la copie du fichier WASM
copyWasmFile();

const context = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'], // Marquer 'vscode' comme module externe
  format: 'cjs',
  platform: 'node',
  target: 'node16', // Cible compatible avec le runtime de VS Code
  sourcemap: 'inline', // Source maps intégrées pour un débogage facile
  plugins: [pnpPlugin()], // Plugin essentiel pour la résolution dans pnpm
  // La minification peut être activée ici si nécessaire
  // minify: true,
});

if (isWatch) {
  await context.watch();
  console.log('esbuild is watching for changes...');
} else {
  await context.rebuild();
  console.log('esbuild build complete.');
  await context.dispose();
}