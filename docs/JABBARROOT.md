# JabbarRoot.md - Configuration Projet Automatisable

> **Template 100% automatisable pour la génération de documentation JabbarRoot optimisée**
> 
> Version: 3.0.0 | Auto-généré le: {{AUTO_GENERATED_DATE}} | Projet: {{PROJECT_NAME}}

## 🤖 Métadonnées d'Automatisation

```yaml
automation:
  script_version: "3.0.0"
  generation_method: "{{GENERATION_METHOD}}" # git-scan, package-scan, config-parse
  data_sources: ["{{DATA_SOURCES}}"] # package.json, composer.json, requirements.txt, etc.
  last_scan: "{{LAST_SCAN_TIMESTAMP}}"
  confidence_score: "{{CONFIDENCE_SCORE}}" # 0-100 basé sur la détection automatique
  manual_overrides: "{{MANUAL_OVERRIDES_COUNT}}"
  
manual_input_required:
  business_info: false # Vision stratégique, objectifs SMART - non automatisable
  organizational_data: false # Équipes, contacts, rôles - non automatisable
  budget_constraints: false # Coûts, deadlines, ressources - non automatisable
  architectural_decisions: false # Choix stratégiques - nécessite expertise humaine
  business_processes: false # Méthodologies agiles, rituels - non automatisable
```

## 📋 Métadonnées du Projet (Auto-détectées)

```yaml
projet:
  nom: "{{PROJECT_NAME}}" # Depuis package.json/pyproject.toml/etc.
  version: "{{PROJECT_VERSION}}" # Depuis version control tags
  type: "{{PROJECT_TYPE}}" # Détecté via structure de fichiers
  stack_principal: "{{MAIN_STACK}}" # Analysé depuis dependencies
  derniere_activite: "{{LAST_COMMIT_DATE}}" # Git log
  taille_codebase: "{{CODEBASE_SIZE_LOC}}" # Lines of code
  langages_detectes: ["{{DETECTED_LANGUAGES}}"] # Extension analysis
  framework_version: "{{FRAMEWORK_VERSION}}" # Package version detection

git_info:
  repo_url: "{{REPOSITORY_URL}}" # Git remote origin
  branche_principale: "{{MAIN_BRANCH}}" # Default branch
  nombre_commits: "{{TOTAL_COMMITS}}" # Git log count
  contributeurs: "{{CONTRIBUTOR_COUNT}}" # Git contributors
  derniere_release: "{{LAST_RELEASE_TAG}}" # Git tags
  issues_ouvertes: "{{OPEN_ISSUES}}" # GitHub API si disponible
  prs_ouvertes: "{{OPEN_PRS}}" # GitHub API si disponible

structure_projet:
  repertoires_principaux: ["{{MAIN_DIRECTORIES}}"] # ls -la scan
  fichiers_config: ["{{CONFIG_FILES}}"] # Détection patterns
  tests_directory: "{{TEST_DIRECTORY}}" # Convention-based detection
  docs_directory: "{{DOCS_DIRECTORY}}" # Documentation folder
  build_directory: "{{BUILD_DIRECTORY}}" # Build output folder
```

## 📊 Contexte Business et Organisationnel

> **⚠️ Section non-automatisable** - Informations à fournir manuellement

### Vision Stratégique et Objectifs
```yaml
# À compléter manuellement - non automatisable
vision_strategique:
  mission: "{{MISSION_STATEMENT}}" # Vision métier du projet
  objectifs_smart: ["{{SMART_OBJECTIVES}}"] # Objectifs SMART spécifiques
  valeur_business: "{{BUSINESS_VALUE}}" # ROI attendu, impact métier
  public_cible: "{{TARGET_AUDIENCE}}" # Utilisateurs finaux, stakeholders
  
kpis_business:
  metriques_cles: ["{{KEY_METRICS}}"] # Conversion, rétention, satisfaction
  seuils_acceptation: ["{{ACCEPTANCE_THRESHOLDS}}"] # Critères de succès
  frequence_mesure: "{{MEASUREMENT_FREQUENCY}}" # Hebdo, mensuel, trimestriel
  outils_mesure: ["{{MEASUREMENT_TOOLS}}"] # Analytics, dashboards métier
```

### Organisation et Équipes
```yaml
# À compléter manuellement - données organisationnelles sensibles
organisation:
  equipe_dev:
    lead: "{{DEV_LEAD_NAME}}" # Lead développeur
    membres: ["{{DEV_TEAM_MEMBERS}}"] # Développeurs
    specialites: ["{{DEV_SPECIALTIES}}"] # Frontend, Backend, DevOps
    
  equipe_produit:
    product_owner: "{{PO_NAME}}" # Product Owner
    ux_designer: "{{UX_DESIGNER}}" # Designer UX/UI
    business_analyst: "{{BA_NAME}}" # Analyste métier
    
  stakeholders:
    sponsor: "{{PROJECT_SPONSOR}}" # Sponsor du projet
    utilisateurs_cles: ["{{KEY_USERS}}"] # Utilisateurs métier clés
    experts_domaine: ["{{DOMAIN_EXPERTS}}"] # Experts métier
    
  communication:
    canaux_principaux: ["{{COMMUNICATION_CHANNELS}}"] # Slack, Teams, Email
    rituels_equipe: ["{{TEAM_RITUALS}}"] # Daily, retro, planning
    outils_collaboration: ["{{COLLABORATION_TOOLS}}"] # Jira, Confluence, Notion
```

### Contraintes et Ressources
```yaml
# À compléter manuellement - informations budgétaires et temporelles
contraintes:
  budget:
    budget_total: "{{TOTAL_BUDGET}}" # Budget alloué
    budget_dev: "{{DEV_BUDGET}}" # Coût développement
    budget_infra: "{{INFRA_BUDGET}}" # Coût infrastructure
    cout_maintenance: "{{MAINTENANCE_COST}}" # Coût maintenance annuel
    
  planning:
    date_debut: "{{START_DATE}}" # Date de début projet
    milestones: ["{{PROJECT_MILESTONES}}"] # Jalons importants
    date_livraison: "{{DELIVERY_DATE}}" # Date de livraison
    contraintes_externes: ["{{EXTERNAL_CONSTRAINTS}}"] # Dépendances externes
    
  ressources:
    jours_homme_alloues: "{{ALLOCATED_MANDAYS}}" # Charge prévue
    competences_manquantes: ["{{MISSING_SKILLS}}"] # Besoins en formation
    dependances_equipes: ["{{TEAM_DEPENDENCIES}}"] # Dépendances autres équipes
    prestataires_externes: ["{{EXTERNAL_VENDORS}}"] # Prestataires impliqués
```

### Processus et Méthodologie
```yaml
# À compléter manuellement - processus organisationnels spécifiques
processus:
  methodologie:
    framework_agile: "{{AGILE_FRAMEWORK}}" # Scrum, Kanban, SAFe
    duree_sprint: "{{SPRINT_DURATION}}" # Durée des itérations
    ceremonies: ["{{SCRUM_CEREMONIES}}"] # Planning, daily, retro, review
    
  qualite:
    definition_of_done: ["{{DOD_CRITERIA}}"] # Critères de Definition of Done
    processus_review: "{{REVIEW_PROCESS}}" # Processus de revue de code
    standards_qualite: ["{{QUALITY_STANDARDS}}"] # Standards internes
    
  gouvernance:
    processus_decision: "{{DECISION_PROCESS}}" # Processus de prise de décision
    escalation_path: ["{{ESCALATION_PATH}}"] # Escalade des problèmes
    comites_gouvernance: ["{{GOVERNANCE_COMMITTEES}}"] # Comités de pilotage
```

## 🏗️ Architecture & Stack (Auto-analysé)

### Décisions Architecturales
```yaml
# Partie automatisable (détection) + manuelle (justification)
decisions_techniques:
  # Auto-détecté
  architecture_detectee: "{{DETECTED_ARCHITECTURE}}" # MVC, microservices, etc.
  patterns_utilises: ["{{USED_PATTERNS}}"] # Observer, Factory, etc.
  
  # À compléter manuellement - expertise humaine requise
  choix_strategiques:
    raisons_stack: "{{STACK_CHOICE_REASONS}}" # Pourquoi cette stack ?
    alternatives_evaluees: ["{{EVALUATED_ALTERNATIVES}}"] # Autres options considérées
    contraintes_techniques: ["{{TECHNICAL_CONSTRAINTS}}"] # Limitations techniques
    evolution_prevue: "{{PLANNED_EVOLUTION}}" # Évolution architecturale prévue
```

### Stack Technique Détecté

#### Frontend (si détecté)
```yaml
detection_method: "{{FRONTEND_DETECTION_METHOD}}" # package.json, bower.json, etc.
framework: "{{FRONTEND_FRAMEWORK}}" # React, Vue, Angular détecté
version: "{{FRONTEND_VERSION}}" # Version exacte du package
dependencies_count: "{{FRONTEND_DEPS_COUNT}}" # Nombre de dépendances
dev_dependencies_count: "{{FRONTEND_DEV_DEPS_COUNT}}"
build_tool: "{{BUILD_TOOL}}" # webpack.config.js, vite.config.js détecté
package_manager: "{{PACKAGE_MANAGER}}" # yarn.lock, package-lock.json détecté
node_version: "{{NODE_VERSION}}" # .nvmrc ou package.json engines
typescript_usage: "{{TYPESCRIPT_DETECTED}}" # tsconfig.json présent
css_framework: "{{CSS_FRAMEWORK}}" # Tailwind, Bootstrap détecté dans deps
testing_framework: "{{FRONTEND_TESTING}}" # Jest, Vitest détecté
linting_tools: ["{{LINTING_TOOLS}}"] # ESLint, Prettier configs détectés
```

#### Backend (si détecté)
```yaml
detection_method: "{{BACKEND_DETECTION_METHOD}}" # requirements.txt, composer.json, etc.
runtime: "{{BACKEND_RUNTIME}}" # Python, Node.js, PHP, etc.
framework: "{{BACKEND_FRAMEWORK}}" # Django, FastAPI, Express détecté
version: "{{BACKEND_VERSION}}" # Version du framework
dependencies: ["{{BACKEND_DEPENDENCIES}}"] # Top 10 dependencies
virtual_env: "{{VIRTUAL_ENV_DETECTED}}" # venv, pipenv, conda détecté
docker_present: "{{DOCKER_DETECTED}}" # Dockerfile présent
api_type: "{{API_TYPE}}" # REST, GraphQL détecté par patterns
database_drivers: ["{{DB_DRIVERS}}"] # psycopg2, mysql-connector détectés
auth_libraries: ["{{AUTH_LIBS}}"] # JWT, OAuth libraries détectées
orm_detected: "{{ORM_FRAMEWORK}}" # SQLAlchemy, Prisma, etc.
```

#### Base de Données (Configuration détectée)
```yaml
database_configs: ["{{DB_CONFIG_FILES}}"] # .env, config files scannés
connection_strings: "{{DB_CONNECTIONS_FOUND}}" # Patterns trouvés
migration_system: "{{MIGRATION_SYSTEM}}" # Alembic, Prisma migrations
schema_files: ["{{SCHEMA_FILES}}"] # SQL, GraphQL schemas
seed_files: ["{{SEED_FILES}}"] # Fixtures, seeders détectés
```

#### Infrastructure (Fichiers détectés)
```yaml
containerization: "{{CONTAINER_TECH}}" # Dockerfile, docker-compose.yml
orchestration: "{{ORCHESTRATION_FILES}}" # k8s yaml, docker-compose
ci_cd_configs: ["{{CI_CD_FILES}}"] # .github/workflows, .gitlab-ci.yml
cloud_configs: ["{{CLOUD_CONFIG_FILES}}"] # terraform, cloudformation
environment_files: ["{{ENV_FILES}}"] # .env, .env.example
deployment_scripts: ["{{DEPLOY_SCRIPTS}}"] # Scripts de déploiement
monitoring_configs: ["{{MONITORING_FILES}}"] # prometheus.yml, etc.
```

## 🔍 Analyse de Code Automatique

### Métriques de Qualité
```yaml
complexity:
  cyclomatic_complexity: "{{CYCLOMATIC_COMPLEXITY}}" # Via outils statiques
  code_duplication: "{{CODE_DUPLICATION_PERCENT}}%" # Détection de doublons
  lines_of_code: "{{TOTAL_LOC}}" # Comptage automatique
  comment_density: "{{COMMENT_DENSITY}}%" # Ratio commentaires/code
  
test_coverage:
  coverage_files: ["{{COVERAGE_FILES}}"] # coverage.xml, .coverage
  estimated_coverage: "{{ESTIMATED_COVERAGE}}%" # Si rapports disponibles
  test_files_count: "{{TEST_FILES_COUNT}}" # Nombre de fichiers de test
  
security:
  vulnerable_dependencies: "{{VULNERABLE_DEPS}}" # npm audit, safety check
  hardcoded_secrets: "{{SECRETS_FOUND}}" # Pattern matching
  security_configs: ["{{SECURITY_FILES}}"] # helmet, CORS configs
  
maintainability:
  technical_debt_ratio: "{{TECH_DEBT_RATIO}}" # Via SonarQube patterns
  outdated_dependencies: "{{OUTDATED_DEPS_COUNT}}" # Version checking
  code_smells: "{{CODE_SMELLS_COUNT}}" # Pattern detection
```

### Patterns et Conventions
```yaml
code_style:
  formatter_config: "{{FORMATTER_CONFIG}}" # prettier, black config
  linter_config: "{{LINTER_CONFIG}}" # eslint, flake8 config
  naming_conventions: "{{NAMING_PATTERNS}}" # Détection de patterns
  
architecture_patterns:
  mvc_detected: "{{MVC_PATTERN}}" # Structure MVC détectée
  api_patterns: ["{{API_PATTERNS}}"] # RESTful patterns
  design_patterns: ["{{DESIGN_PATTERNS}}"] # Singleton, Factory détectés
  
file_organization:
  modular_structure: "{{MODULAR_SCORE}}" # Score de modularité
  coupling_level: "{{COUPLING_LEVEL}}" # Faible/Moyen/Fort
  cohesion_score: "{{COHESION_SCORE}}" # Score de cohésion
```

## 📦 Gestion des Dépendances

### Analyse des Dépendances
```yaml
production_dependencies:
  count: "{{PROD_DEPS_COUNT}}"
  top_dependencies: ["{{TOP_PROD_DEPS}}"] # Top 10 par taille/usage
  total_size: "{{TOTAL_DEPS_SIZE}}" # Taille totale
  outdated_count: "{{OUTDATED_PROD_COUNT}}"
  security_issues: "{{PROD_SECURITY_ISSUES}}"

development_dependencies:
  count: "{{DEV_DEPS_COUNT}}"
  testing_tools: ["{{TESTING_DEPS}}"]
  build_tools: ["{{BUILD_DEPS}}"]
  linting_tools: ["{{LINTING_DEPS}}"]

dependency_analysis:
  circular_dependencies: "{{CIRCULAR_DEPS}}" # Détection de cycles
  unused_dependencies: ["{{UNUSED_DEPS}}"] # Dépendances non utilisées
  duplicate_dependencies: ["{{DUPLICATE_DEPS}}"] # Doublons
  license_issues: ["{{LICENSE_ISSUES}}"] # Conflits de licences
  bundle_size_impact: "{{BUNDLE_SIZE}}" # Impact sur la taille
```

## 🔧 Configuration Automatique des Environnements

### Variables d'Environnement Détectées
```bash
# Variables trouvées dans les fichiers de config
{{DETECTED_ENV_VARS}}

# Variables par catégorie
# Base de données
{{DB_ENV_VARS}}

# APIs externes
{{API_ENV_VARS}}

# Sécurité
{{SECURITY_ENV_VARS}}

# Configuration application
{{APP_CONFIG_VARS}}
```

### Fichiers de Configuration
```yaml
config_files_found:
  application: ["{{APP_CONFIG_FILES}}"] # config.json, settings.py
  database: ["{{DB_CONFIG_FILES}}"] # database.yml, db.config
  deployment: ["{{DEPLOY_CONFIG_FILES}}"] # docker-compose, k8s
  ci_cd: ["{{CI_CONFIG_FILES}}"] # .github, .gitlab-ci
  monitoring: ["{{MONITORING_CONFIG_FILES}}"] # logging, metrics
  security: ["{{SECURITY_CONFIG_FILES}}"] # cors, helmet, etc.
```

## 🚀 Scripts et Automatisation

### Scripts Détectés
```yaml
package_scripts: # Depuis package.json, composer.json, etc.
  build: "{{BUILD_SCRIPT}}"
  test: "{{TEST_SCRIPT}}"
  start: "{{START_SCRIPT}}"
  dev: "{{DEV_SCRIPT}}"
  lint: "{{LINT_SCRIPT}}"
  deploy: "{{DEPLOY_SCRIPT}}"

custom_scripts: ["{{CUSTOM_SCRIPTS}}"] # Scripts dans /scripts, /bin

automation_files:
  makefiles: ["{{MAKEFILES}}"] # Makefile détectés
  task_runners: ["{{TASK_RUNNERS}}"] # gulpfile, gruntfile
  pre_commit_hooks: ["{{PRE_COMMIT_HOOKS}}"] # .pre-commit-config
```

### Workflows CI/CD
```yaml
ci_cd_pipelines:
  github_actions: ["{{GITHUB_WORKFLOWS}}"] # .github/workflows/*
  gitlab_ci: "{{GITLAB_CI_PRESENT}}" # .gitlab-ci.yml
  jenkins: ["{{JENKINS_FILES}}"] # Jenkinsfile
  circle_ci: "{{CIRCLE_CI_PRESENT}}" # .circleci/config.yml
  travis_ci: "{{TRAVIS_CI_PRESENT}}" # .travis.yml

deployment_stages:
  stages_detected: ["{{DEPLOYMENT_STAGES}}"] # dev, staging, prod
  deployment_targets: ["{{DEPLOYMENT_TARGETS}}"] # docker, k8s, cloud
  rollback_strategies: ["{{ROLLBACK_CONFIGS}}"] # Stratégies détectées

# Processus DevOps (à compléter manuellement)
devops_processes:
  code_review_process: "{{CODE_REVIEW_PROCESS}}" # Processus de revue manuelle
  release_management: "{{RELEASE_MANAGEMENT}}" # Gestion des releases
  incident_response: "{{INCIDENT_RESPONSE}}" # Processus d'incident
  monitoring_strategy: "{{MONITORING_STRATEGY}}" # Stratégie de monitoring
```

## 📊 Métriques de Projet

### Activité de Développement
```yaml
commit_activity:
  commits_last_week: "{{COMMITS_LAST_WEEK}}"
  commits_last_month: "{{COMMITS_LAST_MONTH}}"
  most_active_day: "{{MOST_ACTIVE_DAY}}"
  commit_frequency: "{{COMMIT_FREQUENCY}}" # commits/day

contributor_metrics:
  total_contributors: "{{TOTAL_CONTRIBUTORS}}"
  active_contributors: "{{ACTIVE_CONTRIBUTORS}}" # Last 30 days
  top_contributors: ["{{TOP_CONTRIBUTORS}}"] # Par nombre de commits
  bus_factor: "{{BUS_FACTOR}}" # Risque de concentration

code_churn:
  files_changed_frequently: ["{{FREQUENT_CHANGES}}"] # Files modifiés souvent
  hotspot_files: ["{{HOTSPOT_FILES}}"] # Files avec le plus de bugs
  refactoring_candidates: ["{{REFACTOR_CANDIDATES}}"] # Complexité élevée
```

### Performance et Santé
```yaml
build_metrics:
  build_time: "{{BUILD_TIME}}" # Temps de build moyen
  test_execution_time: "{{TEST_EXECUTION_TIME}}" # Temps des tests
  bundle_size: "{{BUNDLE_SIZE}}" # Taille du bundle
  dependencies_size: "{{DEPS_SIZE}}" # Taille des dépendances

quality_metrics:
  code_quality_score: "{{QUALITY_SCORE}}" # Score calculé
  maintainability_index: "{{MAINTAINABILITY_INDEX}}"
  test_to_code_ratio: "{{TEST_RATIO}}" # Ratio test/code
  documentation_coverage: "{{DOC_COVERAGE}}" # Couverture doc

# Métriques métier (à compléter manuellement)
business_metrics:
  user_satisfaction: "{{USER_SATISFACTION}}" # Satisfaction utilisateur
  adoption_rate: "{{ADOPTION_RATE}}" # Taux d'adoption
  business_impact: "{{BUSINESS_IMPACT}}" # Impact métier mesuré
  roi_achieved: "{{ROI_ACHIEVED}}" # ROI réalisé vs prévu
```

## 🎯 Prompts JabbarRoot Auto-générés

### Prompt de Développement (Contextuel)
```
Contexte automatique pour {{PROJECT_NAME}}:
Stack détecté: {{MAIN_STACK}} v{{FRAMEWORK_VERSION}}
Architecture: {{ARCHITECTURE_PATTERN}}
Dépendances principales: {{TOP_DEPENDENCIES}}
Dernière activité: {{LAST_COMMIT_DATE}}
Métriques qualité: {{QUALITY_METRICS}}

Contexte business (si fourni):
Vision: {{MISSION_STATEMENT}}
Contraintes: {{BUDGET_CONSTRAINTS}} / {{TIME_CONSTRAINTS}}
Équipe: {{TEAM_COMPOSITION}}
Processus: {{DEVELOPMENT_PROCESS}}

En tant qu'expert {{MAIN_STACK}}, aide-moi avec ce projet en tenant compte de:
- Structure existante: {{PROJECT_STRUCTURE}}
- Conventions détectées: {{CODE_CONVENTIONS}}
- Problèmes identifiés: {{IDENTIFIED_ISSUES}}
- Outils configurés: {{CONFIGURED_TOOLS}}
- Objectifs business: {{BUSINESS_OBJECTIVES}}
```

### Prompt d'Architecture (Enrichi contexte métier)
```
Analyse architecturale automatique pour {{PROJECT_NAME}}:
Type de projet: {{PROJECT_TYPE}}
Patterns détectés: {{ARCHITECTURE_PATTERNS}}
Couplage: {{COUPLING_LEVEL}}
Complexité: {{COMPLEXITY_SCORE}}
Dette technique: {{TECH_DEBT_RATIO}}

Contexte métier et contraintes:
Mission du projet: {{MISSION_STATEMENT}}
Contraintes budgétaires: {{BUDGET_CONSTRAINTS}}
Échéances critiques: {{CRITICAL_DEADLINES}}
Scalabilité requise: {{SCALABILITY_REQUIREMENTS}}
Équipe disponible: {{TEAM_SKILLS_MATRIX}}

Évalue et suggère des améliorations pour:
- Scalabilité actuelle: {{SCALABILITY_INDICATORS}}
- Points de friction: {{BOTTLENECKS}}
- Opportunités d'optimisation: {{OPTIMIZATION_OPPORTUNITIES}}
- Alignement avec les objectifs business: {{BUSINESS_ALIGNMENT}}
```

### Prompt DevOps (Intégré processus organisationnels)
```
Configuration DevOps détectée pour {{PROJECT_NAME}}:
CI/CD: {{CI_CD_SETUP}}
Containerisation: {{CONTAINER_SETUP}}
Scripts disponibles: {{AVAILABLE_SCRIPTS}}
Environnements: {{DETECTED_ENVIRONMENTS}}

Contexte organisationnel:
Méthodologie: {{AGILE_FRAMEWORK}}
Processus de release: {{RELEASE_PROCESS}}
Équipe DevOps: {{DEVOPS_TEAM}}
Contraintes de sécurité: {{SECURITY_CONSTRAINTS}}
SLA requis: {{SLA_REQUIREMENTS}}

Optimise la configuration existante:
- Pipeline actuel: {{CURRENT_PIPELINE}}
- Goulots d'étranglement: {{PIPELINE_BOTTLENECKS}}
- Sécurité: {{SECURITY_GAPS}}
- Monitoring: {{MONITORING_GAPS}}
- Conformité processus: {{PROCESS_COMPLIANCE}}
```

### Prompt de Refactoring (Priorisé business)
```
Analyse de refactoring pour {{PROJECT_NAME}}:
Hotspots identifiés: {{CODE_HOTSPOTS}}
Duplication de code: {{CODE_DUPLICATION}}%
Complexité cyclomatique: {{CYCLOMATIC_COMPLEXITY}}
Dépendances obsolètes: {{OUTDATED_DEPENDENCIES}}

Contexte de priorisation business:
Roadmap produit: {{PRODUCT_ROADMAP}}
Contraintes de temps: {{TIME_CONSTRAINTS}}
Zones critiques métier: {{BUSINESS_CRITICAL_AREAS}}
Ressources disponibles: {{AVAILABLE_RESOURCES}}
Impact utilisateur: {{USER_IMPACT_ASSESSMENT}}

Priorités de refactoring alignées business:
1. Fichiers critiques métier: {{BUSINESS_CRITICAL_FILES}}
2. Blockers roadmap: {{ROADMAP_BLOCKERS}}
3. Risques sécurité: {{SECURITY_RISKS}}
4. Optimisations performance: {{PERFORMANCE_OPTIMIZATIONS}}
5. Dette technique acceptable: {{ACCEPTABLE_TECH_DEBT}}
```

### Prompt de Support Utilisateur (Contextuel métier)
```
Support technique pour {{PROJECT_NAME}}:
Version déployée: {{DEPLOYED_VERSION}}
Environnement: {{ENVIRONMENT}}
Monitoring actuel: {{MONITORING_STATUS}}
Incidents récents: {{RECENT_INCIDENTS}}

Contexte utilisateur et métier:
Utilisateurs impactés: {{AFFECTED_USERS}}
Processus métier critiques: {{CRITICAL_BUSINESS_PROCESSES}}
SLA en vigueur: {{CURRENT_SLA}}
Escalation path: {{ESCALATION_PATH}}
Impact business: {{BUSINESS_IMPACT_LEVEL}}

Aide-moi à résoudre les problèmes en priorisant:
- Impact utilisateur: {{USER_IMPACT}}
- Continuité métier: {{BUSINESS_CONTINUITY}}
- Conformité SLA: {{SLA_COMPLIANCE}}
- Communication stakeholders: {{STAKEHOLDER_COMMUNICATION}}
```

## 🔄 Auto-maintenance et Monitoring

### Tâches d'Auto-maintenance
```yaml
daily_checks:
  - dependency_updates: "{{DEPS_UPDATE_CHECK}}"
  - security_vulnerabilities: "{{SECURITY_SCAN}}"
  - build_status: "{{BUILD_HEALTH_CHECK}}"
  - test_results: "{{TEST_RESULTS_CHECK}}"
  - business_metrics: "{{BUSINESS_METRICS_CHECK}}" # Si APIs disponibles

weekly_analysis:
  - code_quality_trends: "{{QUALITY_TRENDS}}"
  - performance_metrics: "{{PERFORMANCE_TRENDS}}"
  - contributor_activity: "{{ACTIVITY_ANALYSIS}}"
  - technical_debt_evolution: "{{DEBT_TRACKING}}"
  - business_kpi_trends: "{{BUSINESS_KPI_TRENDS}}" # Si configuré

monthly_reports:
  - architecture_review: "{{ARCHITECTURE_HEALTH}}"
  - dependency_audit: "{{DEPENDENCY_HEALTH}}"
  - security_posture: "{{SECURITY_REVIEW}}"
  - refactoring_opportunities: "{{REFACTOR_SUGGESTIONS}}"
  - business_alignment_review: "{{BUSINESS_ALIGNMENT_REVIEW}}" # Manuel
```

### Alertes Automatiques
```yaml
quality_alerts:
  complexity_threshold: "{{COMPLEXITY_ALERT_THRESHOLD}}"
  duplication_threshold: "{{DUPLICATION_ALERT_THRESHOLD}}"
  coverage_drop: "{{COVERAGE_DROP_THRESHOLD}}"

security_alerts:
  vulnerability_detection: "{{VULN_ALERT_ENABLED}}"
  outdated_dependencies: "{{OUTDATED_ALERT_THRESHOLD}}"
  secret_exposure: "{{SECRET_DETECTION_ENABLED}}"

performance_alerts:
  build_time_increase: "{{BUILD_TIME_THRESHOLD}}"
  bundle_size_increase: "{{BUNDLE_SIZE_THRESHOLD}}"
  test_time_increase: "{{TEST_TIME_THRESHOLD}}"

# Alertes métier (configuration manuelle requise)
business_alerts:
  kpi_degradation: "{{KPI_DEGRADATION_THRESHOLD}}" # Seuils métier
  user_satisfaction_drop: "{{SATISFACTION_THRESHOLD}}" # Satisfaction utilisateur
  adoption_rate_decline: "{{ADOPTION_DECLINE_THRESHOLD}}" # Adoption
  budget_overrun: "{{BUDGET_ALERT_THRESHOLD}}" # Dépassement budget
```

## 📈 Tableau de Bord Auto-généré

### KPIs Calculés Automatiquement
```yaml
health_score:
  overall: "{{OVERALL_HEALTH_SCORE}}/100"
  code_quality: "{{CODE_QUALITY_SCORE}}/100"
  security: "{{SECURITY_SCORE}}/100"
  maintainability: "{{MAINTAINABILITY_SCORE}}/100"
  performance: "{{PERFORMANCE_SCORE}}/100"
  # Score business si données fournies
  business_alignment: "{{BUSINESS_ALIGNMENT_SCORE}}/100"

trends:
  quality_trend: "{{QUALITY_TREND}}" # improving, stable, declining
  activity_trend: "{{ACTIVITY_TREND}}" # active, moderate, inactive
  complexity_trend: "{{COMPLEXITY_TREND}}" # increasing, stable, decreasing
  business_trend: "{{BUSINESS_TREND}}" # Si métriques métier disponibles

recommendations:
  top_priority: "{{TOP_RECOMMENDATION}}"
  quick_wins: ["{{QUICK_WIN_SUGGESTIONS}}"]
  long_term: ["{{LONG_TERM_SUGGESTIONS}}"]
  business_opportunities: ["{{BUSINESS_OPPORTUNITIES}}"] # Si contexte fourni
```

### Dashboard Intégré Business + Technique
```yaml
# Corrélation automatique si données business fournies
correlations:
  quality_vs_velocity: "{{QUALITY_VELOCITY_CORRELATION}}"
  technical_debt_vs_business_impact: "{{DEBT_BUSINESS_CORRELATION}}"
  team_productivity_vs_process_maturity: "{{PRODUCTIVITY_PROCESS_CORRELATION}}"
  
alerts_prioritization:
  critical_business_impact: ["{{CRITICAL_BUSINESS_ALERTS}}"]
  high_technical_risk: ["{{HIGH_TECHNICAL_RISK_ALERTS}}"]
  resource_constraint_warnings: ["{{RESOURCE_CONSTRAINT_ALERTS}}"]
  
action_items:
  immediate_business_actions: ["{{IMMEDIATE_BUSINESS_ACTIONS}}"]
  technical_debt_priorities: ["{{TECH_DEBT_PRIORITIES}}"]
  resource_optimization: ["{{RESOURCE_OPTIMIZATION_SUGGESTIONS}}"]
```

---

## 🔧 Configuration du Script d'Auto-génération

### Variables de Configuration
```bash
# Configuration du script de génération
SCAN_DEPTH=3 # Profondeur de scan des répertoires
INCLUDE_PATTERNS="*.js,*.ts,*.py,*.php,*.json,*.yml,*.yaml"
EXCLUDE_PATTERNS="node_modules,vendor,dist,build,.git"
ANALYSIS_LEVEL="full" # basic, standard, full
CACHE_DURATION=3600 # Cache en secondes
OUTPUT_FORMAT="markdown" # markdown, json, yaml

# APIs externes (optionnelles)
GITHUB_TOKEN={{GITHUB_TOKEN}} # Pour les métriques GitHub
SONARQUBE_URL={{SONARQUBE_URL}} # Pour l'analyse de qualité
