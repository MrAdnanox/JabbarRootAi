// apps/vscode-extension/esbuild.mjs
import esbuild from 'esbuild';
import { pnpPlugin } from '@yarnpkg/esbuild-plugin-pnp'; // Important pour pnpm

const isWatch = process.argv.includes('--watch');

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