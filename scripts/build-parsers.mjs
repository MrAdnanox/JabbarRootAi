// Fichier : scripts/build-parsers.mjs
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const parsersDir = path.join(rootDir, 'apps', 'vscode-extension', 'parsers');
const wasmSourceDir = path.join(rootDir, 'node_modules', 'tree-sitter-wasms', 'out');

console.log('🚀 Synchronisation des parsers pré-compilés...');

if (!fs.existsSync(wasmSourceDir)) {
    console.error(`❌ Erreur: Le répertoire des WASM pré-compilés n'a pas été trouvé.`);
    console.error(`   Chemin attendu: ${wasmSourceDir}`);
    console.error(`   Veuillez exécuter: pnpm add -D -w tree-sitter-wasms`);
    process.exit(1);
}

if (!fs.existsSync(parsersDir)) {
    fs.mkdirSync(parsersDir, { recursive: true });
}

const wasmFiles = fs.readdirSync(wasmSourceDir).filter(file => file.endsWith('.wasm'));

let copiedCount = 0;
for (const file of wasmFiles) {
    const sourcePath = path.join(wasmSourceDir, file);
    const destPath = path.join(parsersDir, file);
    fs.copyFileSync(sourcePath, destPath);
    copiedCount++;
}

console.log(`✅ Succès: ${copiedCount} parsers WASM synchronisés vers ${parsersDir}`);