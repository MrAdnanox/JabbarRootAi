# JabbarRoot - Context Manager for VS Code

## 🚀 Overview

JabbarRoot is a VS Code extension designed for developers working with Language Models (LLMs). It simplifies project context management by allowing you to create, organize, and compile code "bricks" for optimal integration with LLMs.

## ✨ Key Features

### 🧱 Code Bricks Management
- Create and organize modular code bricks
- Selectively enable/disable bricks for compilation
- Visual brick management directly from the VS Code explorer

### 🛠️ Smart Compilation
- Optimized compression for different file types
- Customizable compilation options per project
- Generation of structured contexts for LLMs

### 🔄 Integrated Workflow
- Quick access commands from the command palette
- Context menu for intuitive file and folder management
- Dedicated view in the activity bar for easy navigation

## 📦 Installation

1. Open VS Code
2. Go to the Extensions tab (Ctrl+Shift+X)
3. Search for "JabbarRoot"
4. Click Install

## 🚀 Quick Start

### Create a New Project
1. Open the command palette (Ctrl+Shift+P)
2. Type "JabbarRoot: Create New Project"
3. Follow the prompts to configure your project

### Add Files to a Brick
1. Select one or more files in the explorer
2. Right-click and choose "JabbarRoot: Add Path to Brick"
3. Select the target brick or create a new one

### Compile a Project
1. Open the JabbarRoot view in the activity bar
2. Click the compile icon (⚙️) next to your project
3. The compiled context is available in the configured output directory

## 🛠 Available Commands

### Project Management
- `JabbarRoot: Create New Project` - Creates a new project
- `JabbarRoot: Edit Project Options` - Modifies options for the active project
- `JabbarRoot: Delete Project` - Deletes the selected project

### Brick Management
- `JabbarRoot: Create New Brick` - Creates a new brick in the project
- `JabbarRoot: Add Path to Brick` - Adds files to an existing brick
- `JabbarRoot: Remove Files from Brick` - Removes files from a brick
- `JabbarRoot: Compile Brick Individually` - Compiles a specific brick

### Compilation
- `JabbarRoot: Compile Project (Active Bricks)` - Compiles the project with active bricks

## ⚙️ Configuration

You can configure the extension through VS Code settings (File > Preferences > Settings > Extensions > JabbarRoot) with the following options:

- `jabbarroot.compilation.includeProjectTree`: Include project tree
- `jabbarroot.compilation.compressionLevel`: Compression level (none/standard/extreme)
- `jabbarroot.paths.outputDirectory`: Output directory for compilations

## 📊 Statistics

The extension provides statistics on:
- Brick sizes
- Compression ratios
- Project structure

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a branch for your feature
3. Submit a pull request

## 📄 License

MIT

## 📋 TODO

### Améliorations de la compression
- [ ] Ajouter le support de plus de langages et types de fichiers
  - [ ] Support avancé pour les fichiers JSON
  - [ ] Minification des fichiers JavaScript/TypeScript
  - [ ] Support des fichiers Markdown
  - [ ] Compression des images (WebP, SVG optimisé)

### Interface utilisateur
- [ ] Corriger l'icône SVG de l'extension
  - [ ] Vérifier la compatibilité des formats
  - [ ] Optimiser la taille du fichier
  - [ ] S'assurer de la bonne visibilité dans le thème sombre/clair

### Optimisations techniques
- [ ] Implémenter le cache pour les fichiers fréquemment compressés
- [ ] Ajouter des tests de performance
- [ ] Documenter les options avancées de compression

---

Built with ❤️ for developers working with LLMs
