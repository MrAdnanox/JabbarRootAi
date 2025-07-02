# JabbarRoot - The Cognitive Exocortex

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Project Status: Production](https://img.shields.io/badge/status-production-green.svg)](https://github.com/your-repo/your-project/blob/main/docs/VISION.md)

JabbarRoot is a cutting-edge VS Code extension that acts as a **computational exocortex**, partnering with developers to transform ambiguous concepts, fragmented ideas, or strategic objectives into structured, traceable, and industrialized software artifacts. It augments software cognition through intelligent context management and AI-driven workflows.

## Table of Contents

1.  [Overview](#1-overview)
2.  [Quick Start](#2-quick-start)
3.  [Technical](#3-technical)
4.  [Development](#4-development)
5.  [Roadmap](#5-roadmap)
6.  [Resources](#6-resources)

---

## 1. Overview

JabbarRoot is designed to integrate seamlessly into a developer's creative flow, acting as a **dialogical co-evolutive partner** for augmented software cognition. Its core mission is to transform complexity into clarity by structuring and industrializing software artifacts.

### 1.1. About

At its heart, JabbarRoot implements the **Cognitive Triumvirate**, a tripartite architecture where JabbarRoot itself serves as the orchestrating consciousness. It guides specialized components (Agents and Bricks) to process information, generate insights, and produce tangible deliverables, thereby extending the developer's cognitive capacity.

### 1.2. Core Features

*   **The Cognitive Triumvirate:** A three-tiered architecture comprising:
    *   **Orchestrator (JabbarRoot):** Interprets operator intent, plans complex workflows, deploys and directs Agents and Bricks, and reports progress.
    *   **Creative Agents:** Specialized artisans that transform structured knowledge into final, human-consumable artifacts (e.g., source code, Markdown documentation, textual reports). Example: `readme-scribe`.
    *   **Competence Bricks:** Tools for analysis and measurement that transform raw data into structured, validatable knowledge, always outputting strict JSON contracts validated by schemas. Example: `structure-decoder`.
*   **Code Bricks Management:** Create, organize, and selectively enable/disable modular code "bricks" for optimal context compilation.
*   **Smart Context Compilation:** Optimized compression for various file types and customizable compilation options for generating structured contexts for Language Models (LLMs).
*   **Integrated Workflow:** Quick access commands from the VS Code command palette, intuitive context menus, and a dedicated activity bar view for seamless navigation and interaction.
*   **Memory & Contextual Awareness:** Utilizes **Artefact Bricks** to persist analysis results, enabling the system to provide previous analyses to the AI for iterative updates and maintain a "living codex" of project knowledge.

### 1.3. Status

JabbarRoot is currently in a **stable, compilable, and functional** state, reflecting a production maturity level. Core architectural refactoring is complete, establishing a robust separation of concerns by transplanting business logic from the VS Code extension to an autonomous Cognitive Core (`packages/prompt-factory`). Foundational AI capabilities, such as the `structure-decoder` brick and the `ArtefactService` for memory persistence, are fully operational. The project is actively progressing towards a fully memorial and intelligent system, with the `ReadmeWorkflow` being the immediate focus for advanced integration of memory and analytical capabilities.

### 1.4. Quick Links

*   [Architectural Vision (docs/VISION.md)](./docs/VISION.md)
*   [Architecture Overview (docs/architecture.md)](./docs/architecture.md)

---

## 2. Quick Start

This section guides you through setting up and performing your first actions with JabbarRoot.

### 2.1. Prerequisites

*   **Visual Studio Code:** Ensure you have VS Code installed.
*   **pnpm:** JabbarRoot uses `pnpm` for package management in its monorepo structure.

### 2.2. Installation

1.  Open Visual Studio Code.
2.  Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X on macOS).
3.  Search for "JabbarRoot".
4.  Click "Install".

### 2.3. First Usage

JabbarRoot simplifies project context management and AI-driven documentation. Here's how to begin:

1.  **Create a New Project:**
    *   Open the command palette (Ctrl+Shift+P or Cmd+Shift+P).
    *   Type and select "JabbarRoot: Create New Project".
    *   Follow the prompts to configure your project.
2.  **Add Files to a Brick:**
    *   Select one or more files or folders in the VS Code Explorer.
    *   Right-click and choose "JabbarRoot: Add Path to Brick".
    *   Select an existing brick or create a new one to organize your project context.
3.  **Compile a Project Context:**
    *   Open the JabbarRoot view in the Activity Bar.
    *   Click the compile icon (⚙️) next to your project.
    *   The compiled context, optimized for LLMs, will be available in your configured output directory.

### 2.4. Verification

Upon successful compilation, you will find a structured context file in your designated output directory, ready for use with LLMs. The `jabbarroot.brick.structureAnalyzer` command serves as a reference implementation, demonstrating the new architecture's ability to transform a project tree into a structured JSON report.

---

## 3. Technical

JabbarRoot is built as a robust, modular monorepo, designed to offer deep integration with AI/LLM capabilities for dynamic content generation, analysis, and self-documentation.

### 3.1. Architecture

The project follows a **Monorepo pattern** managed by `pnpm`, primarily delivering a VS Code extension (`apps/vscode-extension`). Its core strength lies in its deep integration with AI/LLM through dedicated packages like `prompt-factory` and `vector-engine`.

*   **Cognitive Core (`packages/prompt-factory`):** This package is the central orchestrator, managing the execution of Bricks and Agents, and handling the entire cognitive data flow.
*   **Unified Data Flow:** All cognitive operations adhere to a canonical flow:
    1.  **Interface (VS Code Extension):** Operator initiates a command.
    2.  **Service (VS Code Extension):** Prepares initial context and invokes a Workflow in the Cognitive Core.
    3.  **Orchestrator (Workflows in `prompt-factory`):** Takes control, orchestrates Bricks and Agents.
    4.  **Analysis (Analyzers/Bricks):** Transforms raw code into structured JSON.
    5.  **Memorization (Artefact Service):** Persists analysis results into **Artefact Bricks**.
    6.  **Synthesis (Synthesizers/Agents):** Reads Artefact Bricks to produce final artifacts (Markdown, code, etc.).
    7.  **Restitution (VS Code Extension):** Workflow returns the final artifact for display.
*   **Support Systems:**
    *   **The Living Codex (`.jabbarroot/`):** The central repository for shared knowledge, containing the taxonomy of prompts (Orchestrators, Agents, Bricks), tribal laws, and configuration.
    *   **Vector Memory (Future):** A long-term memory system for semantic similarity search, ensuring interactions are informed by historical context.

### 3.2. Structure

The project is organized as a `pnpm` monorepo with the following key packages and directories:

```
.
├── apps/
│   └── vscode-extension/   # The VS Code extension application
├── packages/
│   ├── core/               # Core business logic and services
│   ├── prompt-factory/     # The Cognitive Core: Workflows, Analyzers, Synthesizers, Services, Schemas
│   │   └── src/
│   │       ├── workflows/      # High-level orchestrators (e.g., readme.workflow.ts)
│   │       ├── analyzers/      # Definitions of analysis bricks (e.g., structure.analyzer.ts)
│   │       ├── synthesizers/   # Definitions of synthesis agents (e.g., readme.synthesizer.ts)
│   │       ├── services/       # Internal services (Codex.service.ts, Artefact.service.ts)
│   │       ├── schemas/        # Zod data contracts (e.g., ArchitecturalReport.schema.ts)
│   │       ├── executors/      # Low-level LLM interfaces
│   │       └── types/          # Specific types and interfaces
│   ├── types/              # Shared TypeScript interfaces and types
│   └── vector-engine/      # Vector embedding functionalities
└── docs/                   # Project documentation (VISION.md, architecture.md)
```

### 3.3. APIs

JabbarRoot's primary "API" is its VS Code command set, which triggers internal workflows. Internally, the `prompt-factory` package exposes services and workflows (e.g., `ArtefactService`, `CodexService`, `documentation.service.ts`, `readme.workflow.ts`) that constitute its operational interface. Data contracts are strictly defined via Zod schemas (e.g., `ArchitecturalReport.schema.ts`) to ensure robust communication between components.

### 3.4. Configuration

JabbarRoot can be configured both through VS Code settings and internal `.jabbarroot/config.jsonc` files.

*   **VS Code Settings:**
    *   `jabbarroot.compilation.includeProjectTree`: Include project tree in compilation.
    *   `jabbarroot.compilation.compressionLevel`: Compression level (none/standard/extreme).
    *   `jabbarroot.paths.outputDirectory`: Output directory for compiled contexts.
*   **Internal Configuration (`.jabbarroot/config.jsonc`):** Defines LLM providers, active stances, and declarative workflows, controlling the orchestration logic of the Cognitive Core.
    Example workflow configuration:
    ```jsonc
    // .jabbarroot/config.jsonc
    {
      "llmProvider": "gemini-1.5-pro",
      "activeStance": "core.orchestrators.stances.architecte",
      "workflows": {
        "generateReadme": {
          "description": "Workflow complet pour la génération d'un README.",
          "steps": [
            { "execute": "brick:core.bricks.analytics.structure-decoder" },
            { "action": "compileContextFromKeyFiles" },
            { "execute": "agent:core.agents.doc.readme-scribe" }
          ]
        }
      }
    }
    ```

---

## 4. Development

We welcome contributions! JabbarRoot's architecture is designed for clarity and extensibility.

### 4.1. Contribution Process

To contribute, follow the standard GitHub workflow:
1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Commit your changes following the project's [standards](#44-standards).
4.  Submit a pull request.

### 4.2. Environment Setup

As a `pnpm` monorepo, setting up the development environment is straightforward:
1.  Clone the repository.
2.  Run `pnpm install` in the root directory to install all dependencies for all packages.
3.  Open the project in VS Code.

### 4.3. Adding New Cognitive Capabilities (5-Step Methodology)

To add a new analysis or synthesis capability (e.g., "Analyze Dependencies"), follow this ritual:

1.  **Define the Contract (Schema):**
    *   **Action:** Create a Zod schema file in `src/schemas/`.
    *   **Principle:** Always start by defining the structure of the knowledge to be captured.
2.  **Build the Analysis Tool (Analyzer):**
    *   **Action:** Create the brick definition in `src/analyzers/`.
    *   **Principle:** Analysis is an atomic task transforming raw data into structured JSON.
3.  **Design the Synthesis Tool (Synthesizer):**
    *   **Action:** Create the agent's prompt in `.jabbarroot/prompt-factory/agents/` and its definition in `src/synthesizers/`.
    *   **Principle:** Synthesis relies on structured knowledge (JSON), not raw data.
4.  **Assemble the Production Chain (Workflow):**
    *   **Action:** Create the orchestration file in `src/workflows/`.
    *   **Principle:** The workflow is the "Master Builder"; it orchestrates analyzers, saves results via `ArtefactService`, then calls synthesizers with the artifact. It contains orchestration logic, not business logic.
5.  **Connect to the Interface (Command):**
    *   **Action:** Update `extension.ts` and command files in `apps/vscode-extension/src/commands/`.
    *   **Principle:** The command is "dumb"; it collects operator intent, calls the corresponding workflow, awaits the result, and displays it. All complexity is delegated to the Cognitive Core.

### 4.4. Testing

While JabbarRoot is robust in design, the current test-to-code ratio is low (approximately 0.11). This indicates a significant area for improvement. Contributions to increase test coverage and ensure stability are highly valued.

### 4.5. Standards

*   **File Naming:** `[feature].[type].ts` (e.g., `readme.workflow.ts`, `git.analyzer.ts`, `ArchitecturalReport.schema.ts`).
*   **Artefact Brick Naming:** `[ARTEFACT] <Feature> Analysis` (e.g., `[ARTEFACT] README Analysis`). This prefix enables programmatic and visual identification.
*   **Workflow Structure:** Each workflow is a class implementing `IWorkflow` with an `execute(context: T): Promise<U>` method. Internal steps should be clear private methods (e.g., `step1_AnalyzeStructure`).
*   **Dependencies:** Only the `executors/` directory is permitted to import an LLM SDK. Other modules must depend on these executors.

---

## 5. Roadmap

JabbarRoot's vision extends beyond mere context management; it aims to become a proactive, self-improving cognitive partner.

### 5.1. Vision

The long-term vision for JabbarRoot is to be an exocortex that deeply integrates into the creative flow, transforming ambiguity into structured, industrializable software artifacts. Key areas for future development include:

*   **Workflow Composition:** Developing a declarative language or graphical interface to allow operators to compose their own workflows by assembling Bricks and Agents.
*   **Proactive Dialogues:** Enhancing JabbarRoot's ability to anticipate needs, ask pertinent questions, and propose contextual actions.
*   **Codex Self-Improvement:** Implementing mechanisms for JabbarRoot to propose new Bricks or Agents by analyzing repetitive operator tasks.
*   **Distributed Scalability:** Exploring the deployment of Agents and Bricks as containerized micro-services for increased scalability and robustness.

### 5.2. Key Milestones

The "Genesis" launch plan outlines the strategic development of 5 founding agents, demonstrating JabbarRoot's full project formalization capabilities:

1.  **The Visionary (`vision-interrogator.agent`):** Guides the operator to define the project's strategic intention, producing a `VISION.md`.
2.  **The Tactician (`mission-planner.agent`):** Transforms the `VISION.md` into concrete objectives and an initial roadmap, creating a `MISSION_ROADMAP.md`.
3.  **The Architect (`structure-analyzer.agent`):** Analyzes the project's file structure, generating an `ArchitecturalReport.json` as an Artefact Brick. This is a pivotal existing agent.
4.  **The Cartographer (`architecture-synthesizer.agent`):** Translates the `ArchitecturalReport.json` into a human-readable `ARCHITECTURE.md` explaining technical choices.
5.  **The Ambassador (`readme-scribe.agent`):** The grand finale, synthesizing all previous deliverables (`VISION.md`, `MISSION_ROADMAP.md`, `ARCHITECTURE.md`, and the JSON report) into the ultimate, comprehensive `README.md`.

### 5.3. Status of Milestones

The architectural refactoring is complete, enabling a memory-centric system. The `structure-decoder` analyzer is fully operational, and the `ArtefactService` successfully manages persistent memory. The immediate next step is to make the `ReadmeWorkflow` fully intelligent and memorial, ensuring it uses the `ArchitecturalReport` as its primary source of truth and stores the generated README in its own Artefact Brick. This will complete the vertical prototype for AI-driven documentation generation.

---

## 6. Resources

*   **Architectural Vision:** Dive deeper into the philosophical and technical underpinnings of JabbarRoot: [docs/VISION.md](./docs/VISION.md)
*   **Architecture Overview:** Understand the high-level design and principles of the project's structure: [docs/architecture.md](./docs/architecture.md)
*   **Contributing:** Refer to the [Development](#4-development) section for detailed contribution guidelines.

### 6.1. License

JabbarRoot is released under the [MIT License](https://opensource.org/licenses/MIT).

---
Built with ❤️ for developers working with LLMs.