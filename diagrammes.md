# Architecture Cognitive Distribuée - jabbarroot

```mermaid
graph TB
    subgraph "Interface Utilisateur"
        U[👤 Développeur]
        CLI[🖥️ CLI Interface]
        VSC[📝 VS Code Extension]
    end
    
    subgraph "Couche Cognitive"
        NLP[🧠 NLP Engine<br/>Extraction d'intention]
        MCP[🎯 Multi-Context Planner<br/>Génération DAG]
        ORDO[⚡ OrdoAbChaos<br/>Orchestrateur]
    end
    
    subgraph "Codex Vivant (.jabbarroot/)"
        PROF[👔 Profils & Postures<br/>Architecte, DevOps, QA]
        LAWS[⚖️ Laws Engine<br/>Contraintes formelles]
        CONFIG[⚙️ Hot Reload JSONC<br/>Configuration dynamique]
    end
    
    subgraph "Mémoire Vectorielle"
        PGV[(🧮 PGVector<br/>Base vectorielle)]
        EMB[📊 Embeddings<br/>Encodage sémantique]
        KNN[🔍 k-NN Search<br/>Recherche contextuelle]
    end
    
    subgraph "Prompt Factory"
        BRICKS[🧱 PromptBricks<br/>Fonctions spécialisées]
        TEMPS[📋 Templates<br/>Pipelines métier]
        COMP[⚙️ Compilateur<br/>System Prompts]
    end
    
    subgraph "Agents LLM Spécialisés"
        SEC[🔒 Security Analyzer]
        TEST[🧪 Test Generator]
        REF[🔄 Refactorer]
        DOC[📚 Doc Updater]
        ARCH[🏗️ Architect Agent]
    end
    
    subgraph "Providers LLM"
        GPT4[🤖 GPT-4]
        CLAUDE[🤖 Claude-4]
        LOCAL[🖥️ Local LLM]
    end
    
    U --> CLI
    U --> VSC
    CLI --> NLP
    VSC --> NLP
    
    NLP --> MCP
    MCP --> ORDO
    
    ORDO --> PROF
    ORDO --> LAWS
    ORDO --> CONFIG
    
    ORDO --> PGV
    PGV --> EMB
    EMB --> KNN
    
    ORDO --> BRICKS
    BRICKS --> TEMPS
    TEMPS --> COMP
    
    COMP --> SEC
    COMP --> TEST  
    COMP --> REF
    COMP --> DOC
    COMP --> ARCH
    
    SEC --> GPT4
    TEST --> CLAUDE
    REF --> LOCAL
    DOC --> GPT4
    ARCH --> CLAUDE
    
    KNN --> COMP
    PROF --> COMP
    LAWS --> COMP
    
    style U fill:#e1f5fe
    style NLP fill:#f3e5f5
    style MCP fill:#f3e5f5
    style ORDO fill:#f3e5f5
    style PGV fill:#fff3e0
    style BRICKS fill:#e8f5e8
    style SEC fill:#ffebee
    style TEST fill:#ffebee
    style REF fill:#ffebee
    style DOC fill:#ffebee
    style ARCH fill:#ffebee

```

# Processus de Compilation Cognitive - jabbarroot
```mermaid
sequenceDiagram
    participant Dev as 👤 Développeur
    participant NLP as 🧠 NLP Engine
    participant MCP as 🎯 MCP Planner
    participant PGV as 🧮 PGVector
    participant PF as 🏭 Prompt Factory
    participant Orch as ⚡ Orchestrateur
    participant Agents as 🤖 Agents LLM
    participant Output as 📦 Artefacts

    Dev->>NLP: "Prompt flou: j'ai une idée d'appli bancaire"
    
    Note over NLP: Extraction d'intention latente
    NLP->>NLP: Classification des entités métier
    NLP->>NLP: Identification des priorités
    
    NLP->>MCP: Intentions structurées
    MCP->>PGV: Recherche contexte similaire
    PGV-->>MCP: Contexte vectoriel pertinent
    
    Note over MCP: Génération DAG cognitif
    MCP->>MCP: Définition tâches & dépendances
    MCP->>MCP: Sélection agents spécialisés
    
    MCP->>PF: Plan d'orchestration
    PF->>PF: Sélection PromptBricks
    PF->>PF: Compilation system prompts
    
    PF->>Orch: Prompts contextualisés
    
    Note over Orch: Exécution parallèle
    Orch->>Agents: Prompt Security Analyzer
    Orch->>Agents: Prompt Architect Agent
    Orch->>Agents: Prompt Test Generator
    Orch->>Agents: Prompt Doc Updater
    
    par Agents parallèles
        Agents-->>Output: Code sécurisé
    and
        Agents-->>Output: Architecture modulaire
    and
        Agents-->>Output: Tests automatisés
    and
        Agents-->>Output: Documentation
    end
    
    Output->>PGV: Archivage vectoriel
    Output->>Dev: Projet structuré livré
    
    Note over Dev,Output: Cycle d'amélioration continue

```mermaid
# Structure du Codex Vivant (.jabbarroot/)
```mermaid
graph TD
    subgraph "📁 .jabbarroot/"
        subgraph "👔 Profils & Postures"
            ARCH_PROF[🏗️ Architecte FinTech<br/>- Sécurité prioritaire<br/>- Modularité<br/>- Performance]
            QA_PROF[🧪 Analyste Qualité<br/>- Tests exhaustifs<br/>- Code coverage<br/>- Validation formelle]
            DEVOPS_PROF[⚙️ Ingénieur DevOps<br/>- CI/CD<br/>- Containerisation<br/>- Monitoring]
            UX_PROF[🎨 Designer UX<br/>- Accessibilité<br/>- Ergonomie<br/>- Responsive]
        end
        
        subgraph "⚖️ Laws Engine"
            LAW1[🚫 no-circular-deps<br/>Absence dépendances circulaires]
            LAW2[🏷️ strict-typing<br/>Typage strict obligatoire]
            LAW3[📖 code-readability<br/>Lisibilité prioritaire]
            LAW4[🔒 security-first<br/>Sécurité par conception]
            LAW5[🧪 test-driven<br/>TDD obligatoire]
        end
        
        subgraph "⚙️ Configuration Dynamique"
            CONFIG[📄 config.jsonc<br/>Hot Reload]
            TEMPLATES[📋 templates/<br/>Pipelines métier]
            BRICKS[🧱 bricks/<br/>Fonctions atomiques]
            HISTORY[📚 history/<br/>Contexte vectoriel]
        end
    end
    
    subgraph "🔄 Mécanismes d'Interaction"
        RELOAD[🔥 Hot Reload<br/>Reconfiguration<br/>sans redémarrage]
        VALIDATOR[✅ Validateur<br/>Conformité aux lois]
        SELECTOR[🎯 Sélecteur<br/>Profil contextuel]
    end
    
    ARCH_PROF --> SELECTOR
    QA_PROF --> SELECTOR  
    DEVOPS_PROF --> SELECTOR
    UX_PROF --> SELECTOR
    
    LAW1 --> VALIDATOR
    LAW2 --> VALIDATOR
    LAW3 --> VALIDATOR
    LAW4 --> VALIDATOR
    LAW5 --> VALIDATOR
    
    CONFIG --> RELOAD
    TEMPLATES --> RELOAD
    BRICKS --> RELOAD
    
    SELECTOR --> RELOAD
    VALIDATOR --> RELOAD
    
    style ARCH_PROF fill:#e3f2fd
    style QA_PROF fill:#f1f8e9
    style DEVOPS_PROF fill:#fff3e0
    style UX_PROF fill:#fce4ec
    
    style LAW1 fill:#ffebee
    style LAW2 fill:#ffebee
    style LAW3 fill:#ffebee
    style LAW4 fill:#ffebee
    style LAW5 fill:#ffebee
    
    style CONFIG fill:#f3e5f5
    style RELOAD fill:#e8f5e8
```

# Scénario FinTech : Refactoring Système de Paiement

```mermaid
flowchart TD
    START([🚀 Prompt utilisateur:<br/>refactorer mon système<br/>de paiement])
    
    subgraph "Phase 1: Analyse NLP"
        NLP1[🧠 Classification intention]
        NLP2[🎯 Extraction priorités:<br/>• Sécurité<br/>• Modularité<br/>• Performance]
        NLP3[🏷️ Identification entités:<br/>• Système paiement<br/>• Architecture existante]
    end
    
    subgraph "Phase 2: Planification MCP"
        MCP1[📋 Création plan orchestration]
        MCP2[🤖 Sélection 4 agents:<br/>• Audit sécurité<br/>• Génération tests<br/>• Refactoring<br/>• Documentation]
        MCP3[🔗 Définition dépendances<br/>et contraintes]
    end
    
    subgraph "Phase 3: Exécution Parallèle"
        AGENT1[🔒 Agent Sécurité<br/>Audit vulnérabilités<br/>PCI-DSS compliance]
        AGENT2[🧪 Agent Tests<br/>Tests unitaires<br/>Tests intégration<br/>Tests charge]
        AGENT3[🔄 Agent Refactoring<br/>Modularisation<br/>Clean Architecture<br/>Design patterns]
        AGENT4[📚 Agent Documentation<br/>Architecture docs<br/>API documentation<br/>Guides déploiement]
    end
    
    subgraph "Phase 4: Livrables"
        OUT1[💻 Code refactoré<br/>+ Validation formelle]
        OUT2[🛡️ Rapport sécurité<br/>+ Recommandations]
        OUT3[🧪 Suite tests<br/>auto-générée]
        OUT4[📖 Documentation<br/>mise à jour]
        OUT5[🧮 Archivage vectoriel<br/>contextuel]
    end
    
    SYNC[⚡ Synchronisation<br/>& Orchestration]
    
    START --> NLP1
    NLP1 --> NLP2
    NLP2 --> NLP3
    NLP3 --> MCP1
    
    MCP1 --> MCP2
    MCP2 --> MCP3
    MCP3 --> SYNC
    
    SYNC --> AGENT1
    SYNC --> AGENT2
    SYNC --> AGENT3
    SYNC --> AGENT4
    
    AGENT1 --> OUT1
    AGENT1 --> OUT2
    
    AGENT2 --> OUT3
    
    AGENT3 --> OUT1
    
    AGENT4 --> OUT4
    
    OUT1 --> OUT5
    OUT2 --> OUT5
    OUT3 --> OUT5
    OUT4 --> OUT5
    
    style START fill:#e1f5fe
    style NLP1 fill:#f3e5f5
    style NLP2 fill:#f3e5f5
    style NLP3 fill:#f3e5f5
    style MCP1 fill:#fff3e0
    style MCP2 fill:#fff3e0
    style MCP3 fill:#fff3e0
    style AGENT1 fill:#ffebee
    style AGENT2 fill:#ffebee
    style AGENT3 fill:#ffebee
    style AGENT4 fill:#ffebee
    style OUT1 fill:#e8f5e8
    style OUT2 fill:#e8f5e8
    style OUT3 fill:#e8f5e8
    style OUT4 fill:#e8f5e8
    style OUT5 fill:#e8f5e8
    style SYNC fill:#fce4ec
```

# Écosystème Complet jabbarroot

```mermaid
graph TB
    subgraph "🖥️ Interfaces Utilisateur"
        CLI[⌨️ CLI avancée<br/>`jabbarroot ordo --visualize`<br/>Visualisation DAG]
        VSC[📝 Extension VS Code<br/>Éditeur graphique<br/>Pipelines visuels]
        WEB[🌐 Interface Web<br/>Dashboard monitoring<br/>Métriques temps réel]
    end
    
    subgraph "🧠 Couche Cognitive"
        CORE[⚡ jabbarroot Core<br/>Orchestrateur principal]
        
        subgraph "NLP Pipeline"
            INTENT[🎯 Intent Extraction]
            ENTITY[🏷️ Entity Recognition] 
            CONTEXT[📝 Context Analysis]
        end
        
        subgraph "Planning & Orchestration"
            MCP[📋 Multi-Context Planner]
            DAG[🔗 DAG Generator]
            EXEC[▶️ Execution Engine]
        end
    end
    
    subgraph "💾 Persistence Layer"
        VECTOR[(🧮 PGVector DB<br/>Mémoire sémantique)]
        CONFIG[(⚙️ Configuration Store<br/>JSONC Hot Reload)]
        HISTORY[(📚 History Store<br/>Auditabilité)]
        METRICS[(📊 Metrics DB<br/>Performance)]
    end
    
    subgraph "🏭 Agent Factory"
        subgraph "PromptBricks"
            B1[🔒 security-analyzer]
            B2[🧪 test-generator]
            B3[🔄 refactorer]
            B4[📚 doc-updater]
            B5[🏗️ architect]
        end
        
        subgraph "Templates"
            T1[💳 fintech-pipeline]
            T2[🌐 webapp-generator]
            T3[🔌 api-builder]
            T4[📱 mobile-scaffold]
        end
    end
    
    subgraph "🤖 LLM Providers"
        GPT[🧠 OpenAI GPT-4<br/>Provider principal]
        CLAUDE[🤖 Anthropic Claude-4<br/>Fallback & spécialisation]
        LOCAL[🖥️ Local LLM<br/>Ollama/LM Studio]
        CUSTOM[⚙️ Custom Models<br/>Fine-tunés métier]
    end
    
    subgraph "☁️ Infrastructure"
        DOCKER[🐳 Docker Containers<br/>Isolation agents]
        K8S[⎈ Kubernetes<br/>Orchestration distribuée]
        CICD[🔄 CI/CD Pipeline<br/>Déploiement continu]
        MONITOR[📈 Monitoring<br/>Observabilité]
    end
    
    CLI --> CORE
    VSC --> CORE
    WEB --> CORE
    
    CORE --> INTENT
    CORE --> ENTITY
    CORE --> CONTEXT
    
    INTENT --> MCP
    ENTITY --> MCP
    CONTEXT --> MCP
    
    MCP --> DAG
    DAG --> EXEC
    
    EXEC --> B1
    EXEC --> B2
    EXEC --> B3
    EXEC --> B4
    EXEC --> B5
    
    B1 --> T1
    B2 --> T2
    B3 --> T3
    B4 --> T4
    B5 --> T1
    
    T1 --> GPT
    T2 --> CLAUDE
    T3 --> LOCAL
    T4 --> CUSTOM
    
    CORE <--> VECTOR
    CORE <--> CONFIG
    CORE <--> HISTORY
    CORE <--> METRICS
    
    EXEC --> DOCKER
    DOCKER --> K8S
    K8S --> CICD
    K8S --> MONITOR
    
    style CLI fill:#e3f2fd
    style VSC fill:#e3f2fd
    style WEB fill:#e3f2fd
    style CORE fill:#f3e5f5
    style VECTOR fill:#fff3e0
    style GPT fill:#ffebee
    style CLAUDE fill:#ffebee
    style LOCAL fill:#ffebee
    style DOCKER fill:#e8f5e8

```
