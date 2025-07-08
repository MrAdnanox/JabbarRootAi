// --- FICHIER : apps/vscode-extension/package.mjs ---
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const stagingDir = path.resolve(process.cwd(), 'out/package');
const rootDir = process.cwd();

function log(message) { console.log(`📦 [Package Script] ${message}`); }
function run(command, options = {}) {
  log(`Running: ${command}`);
  execSync(command, { stdio: 'inherit', ...options });
}

// 1. Nettoyer
log(`Cleaning staging directory: ${stagingDir}`);
fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(stagingDir, { recursive: true });

// 2. Construire notre code source avec esbuild
run('pnpm run build:esbuild --package');

// 3. Préparer le package.json pour le staging
log('Cleaning and preparing package.json for staging...');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

delete packageJson.scripts;
delete packageJson.devDependencies;

// Suppression des dépendances workspace car elles sont incluses dans le bundle
for (const key in packageJson.dependencies) {
    if (packageJson.dependencies[key].startsWith('workspace:')) {
        delete packageJson.dependencies[key];
    }
}

fs.writeFileSync(path.join(stagingDir, 'package.json'), JSON.stringify(packageJson, null, 2));

// 4. Copier les fichiers nécessaires
log('Copying necessary files to staging directory...');
const filesToCopy = [
  'dist',
  'resources',
  'README.md',
  'LICENSE',
  'src/webviews/components/shared',
  'src/webviews/components/sanctuary'
];

// Créer la structure de dossiers nécessaire
const requiredDirs = [
  path.join(stagingDir, 'src/webviews/components/sanctuary/js')
];

for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

for (const file of filesToCopy) {
  const source = path.join(rootDir, file);
  const dest = path.join(stagingDir, file);
  
  if (fs.existsSync(source)) {
    log(`Copying ${file}...`);
    
    // Copie récursive pour les dossiers, copie simple pour les fichiers
    if (fs.lstatSync(source).isDirectory()) {
      fs.cpSync(source, dest, { recursive: true });
    } else {
      fs.copyFileSync(source, dest);
    }
  } else {
    log(`⚠️  Source file/directory not found: ${source}`);
  }
}

// 5. Installer les dépendances TIERCES avec NPM
log('Installing production dependencies in staging directory using NPM...');
run('npm install --omit=dev', { cwd: stagingDir });

// 6. Lancer vsce package depuis le staging
log('Packaging extension with vsce...');
run('npx vsce package', { cwd: stagingDir });

log('✅ Packaging complete!');
