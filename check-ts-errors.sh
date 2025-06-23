#!/bin/bash

# Script pour vérifier les erreurs TypeScript dans le monorepo
# Amélioré avec gestion d'erreurs, couleurs et options

set -euo pipefail

# Configuration
readonly SCRIPT_NAME="$(basename "$0")"
readonly PROJECT_ROOT="/media/adnan/Projects/JabbarRoot"
readonly PACKAGES_DIR="$PROJECT_ROOT/packages"

# Couleurs pour l'affichage
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# Options par défaut
VERBOSE=false
QUICK_MODE=false
SHOW_HELP=false

# Fonction d'aide
show_help() {
    cat << EOF
Usage: $SCRIPT_NAME [OPTIONS]

Script de vérification des erreurs TypeScript dans le monorepo

OPTIONS:
    -h, --help      Affiche cette aide
    -v, --verbose   Mode verbeux (affiche plus de détails)
    -q, --quick     Mode rapide (skip certaines vérifications)

EXEMPLES:
    $SCRIPT_NAME                    # Vérification standard
    $SCRIPT_NAME --verbose          # Avec détails supplémentaires
    $SCRIPT_NAME --quick            # Vérification rapide
EOF
}

# Traitement des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -q|--quick)
            QUICK_MODE=true
            shift
            ;;
        *)
            echo -e "${RED}Erreur: Option inconnue '$1'${NC}" >&2
            show_help
            exit 1
            ;;
    esac
done

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_section() {
    echo -e "\n${BOLD}${BLUE}=== $1 ===${NC}"
}

# Vérification des prérequis
check_prerequisites() {
    log_section "Vérification des prérequis"
    
    # Vérifier que le répertoire du projet existe
    if [[ ! -d "$PROJECT_ROOT" ]]; then
        log_error "Répertoire du projet non trouvé: $PROJECT_ROOT"
        exit 1
    fi
    
    # Vérifier que le répertoire packages existe
    if [[ ! -d "$PACKAGES_DIR" ]]; then
        log_error "Répertoire packages non trouvé: $PACKAGES_DIR"
        exit 1
    fi
    
    # Vérifier que TypeScript est disponible
    if ! command -v npx &> /dev/null; then
        log_error "npx n'est pas installé"
        exit 1
    fi
    
    log_success "Prérequis validés"
}

# Fonction pour vérifier un package
check_package() {
    local dir="$1"
    local name="$2"
    local exit_code=0
    
    log_section "Vérification de $name"
    
    if [[ ! -d "$dir" ]]; then
        log_warning "Répertoire non trouvé: $dir"
        return 1
    fi
    
    if [[ ! -f "$dir/tsconfig.json" ]]; then
        log_warning "tsconfig.json non trouvé dans: $dir"
        return 1
    fi
    
    log_info "Vérification en cours dans: $dir"
    
    # Sauvegarder le répertoire actuel
    local current_dir="$(pwd)"
    
    # Exécuter la vérification TypeScript
    if cd "$dir" && npx tsc --noEmit --pretty 2>&1; then
        log_success "$name: Aucune erreur TypeScript détectée"
    else
        exit_code=$?
        log_error "$name: Erreurs TypeScript détectées"
    fi
    
    # Retourner au répertoire initial
    cd "$current_dir"
    
    return $exit_code
}

# Fonction pour rechercher des erreurs courantes
check_common_errors() {
    log_section "Recherche d'erreurs courantes"
    
    local errors_found=false
    
    # 1. Erreurs d'import
    log_info "Recherche des erreurs d'import..."
    if grep -r -n "Cannot find module" --include="*.ts" --include="*.tsx" "$PACKAGES_DIR" 2>/dev/null; then
        log_error "Erreurs d'import détectées"
        errors_found=true
    else
        log_success "Aucune erreur d'import trouvée"
    fi
    
    # 2. Erreurs de syntaxe TypeScript
    log_info "Recherche d'erreurs de syntaxe TypeScript..."
    if grep -r -n "error TS" --include="*.ts" --include="*.tsx" "$PACKAGES_DIR" 2>/dev/null; then
        log_error "Erreurs de syntaxe TypeScript détectées"
        errors_found=true
    else
        log_success "Aucune erreur de syntaxe TypeScript trouvée"
    fi
    
    # 3. Vérifications spécifiques (mode non-rapide seulement)
    if [[ "$QUICK_MODE" = false ]]; then
        check_specific_files
    fi
    
    if [[ "$errors_found" = false ]]; then
        log_success "Aucune erreur courante détectée"
    fi
}

# Fonction pour vérifier des fichiers spécifiques
check_specific_files() {
    log_info "Vérification des fichiers spécifiques..."
    
    local files=(
        "$PACKAGES_DIR/vscode-extension/src/extension.ts"
        "$PACKAGES_DIR/vscode-extension/src/test/suite/commands/createContext.command.integration.test.ts"
    )
    
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            local filename="$(basename "$file")"
            log_info "Analyse des imports dans: $filename"
            
            # Afficher les imports (en excluant les commentaires)
            if grep -n "from\|import" "$file" | grep -v "^\s*//\|^\s*/\*" | head -10; then
                if [[ "$VERBOSE" = true ]]; then
                    log_info "Imports trouvés dans $filename"
                fi
            else
                log_warning "Aucun import trouvé dans $filename"
            fi
        else
            log_warning "Fichier non trouvé: $file"
        fi
    done
}

# Fonction pour afficher un résumé
show_summary() {
    log_section "Résumé de la vérification"
    
    local total_packages=0
    local valid_packages=0
    
    # Compter les packages avec tsconfig.json
    for dir in "$PACKAGES_DIR"/*; do
        if [[ -d "$dir" && -f "$dir/tsconfig.json" ]]; then
            ((total_packages++))
        fi
    done
    
    log_info "Packages analysés: $total_packages"
    
    if [[ "$VERBOSE" = true ]]; then
        log_info "Mode verbeux activé"
    fi
    
    if [[ "$QUICK_MODE" = true ]]; then
        log_info "Mode rapide utilisé"
    fi
}

# Fonction principale
main() {
    log_section "Démarrage de la vérification TypeScript"
    
    # Vérifier les prérequis
    check_prerequisites
    
    local overall_exit_code=0
    
    # Vérifier chaque package
    local packages=(
        "$PACKAGES_DIR/core:Core"
        "$PACKAGES_DIR/vscode-extension:VS Code Extension"
    )
    
    for package_info in "${packages[@]}"; do
        IFS=':' read -r dir name <<< "$package_info"
        if ! check_package "$dir" "$name"; then
            overall_exit_code=1
        fi
    done
    
    # Vérifier les erreurs courantes
    check_common_errors
    
    # Afficher le résumé
    show_summary
    
    # Message final
    if [[ $overall_exit_code -eq 0 ]]; then
        log_success "Vérification terminée avec succès"
    else
        log_error "Vérification terminée avec des erreurs"
    fi
    
    exit $overall_exit_code
}

# Gestion des signaux
trap 'log_error "Script interrompu"; exit 130' INT TERM

# Exécution du script principal
main "$@"