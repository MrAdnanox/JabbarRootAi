// CodeCompactor.js
// Compacteur de code ULTRA-AGRESSIF pour Node.js
// Philosophie: Éliminer TOUT ce qui n'est pas strictement nécessaire

class CodeCompactor {
    constructor() {
        // Patterns pour identifier ce qu'il faut protéger
        this.protectedPatterns = [
            // Docstrings et commentaires JSDoc
            /\/\*\*[\s\S]*?\*\//g,
            // Commentaires blocs
            /\/\*[\s\S]*?\*\//g,
            // Commentaires ligne
            /\/\/.*$/gm,
            // Strings avec guillemets doubles
            /"(?:[^"\\]|\\.)*"/g,
            // Strings avec guillemets simples
            /'(?:[^'\\]|\\.)*'/g,
            // Template literals
            /`(?:[^`\\]|\\.)*`/g,
            // Regex literals
            /\/(?:[^\/\\\n]|\\.)+\/[gimsuxy]*/g
        ];
    }

    /**
     * COMPACTAGE MAXIMUM - Mode destruction totale des espaces
     */
    compact(code) {
        if (!code || !code.trim()) {
            return "";
        }

        // Étape 1: Extraire et remplacer les zones protégées
        const protectedContent = new Map();
        let workingCode = code;
        
        this.protectedPatterns.forEach((pattern, i) => {
            const matches = [];
            let match;
            
            while ((match = pattern.exec(workingCode)) !== null) {
                const placeholder = `__PROTECTED_${i}_${matches.length}__`;
                protectedContent.set(placeholder, match[0]);
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    placeholder
                });
                
                // Éviter les boucles infinies avec les regex globales
                if (!pattern.global) break;
            }
            
            // Remplace de la fin vers le début pour préserver les positions
            matches.reverse().forEach(({start, end, placeholder}) => {
                workingCode = workingCode.substring(0, start) + placeholder + workingCode.substring(end);
            });
            
            // Reset regex index pour la prochaine utilisation
            pattern.lastIndex = 0;
        });

        // Étape 2: DESTRUCTION TOTALE des espaces et lignes
        workingCode = this._ultraCompact(workingCode);

        // Étape 3: Restaurer les zones protégées
        protectedContent.forEach((original, placeholder) => {
            workingCode = workingCode.replace(placeholder, original);
        });

        return workingCode.trim();
    }

    /**
     * Compactage ultra-agressif sans pitié
     */
    _ultraCompact(code) {
        // Supprime TOUTES les lignes complètement vides
        const lines = code.split('\n').filter(line => line.trim());
        
        const compactedLines = [];
        
        for (const line of lines) {
            const stripped = line.trimStart();
            if (!stripped) continue;
            
            // Calcule l'indentation minimum (2 espaces par niveau au lieu de 4)
            const originalIndent = line.length - stripped.length;
            const minimalIndent = ' '.repeat(Math.floor(originalIndent / 2));
            
            // DESTRUCTION des espaces dans le contenu
            const content = this._destroySpaces(stripped);
            
            compactedLines.push(minimalIndent + content);
        }

        // Joint tout en éliminant les sauts de ligne excessifs
        let result = compactedLines.join('\n');
        
        // Supprime les sauts de ligne multiples
        result = result.replace(/\n\n+/g, '\n');
        
        return result;
    }

    /**
     * Élimine TOUS les espaces non-critiques
     */
    _destroySpaces(line) {
        // Opérateurs JavaScript
        const operators = [
            '===', '!==', '==', '!=', '<=', '>=', '<', '>', 
            '+=', '-=', '*=', '/=', '%=', '**=', '&=', '|=', '^=', '<<=', '>>=', '>>>=',
            '&&', '||', '??', '?.', 
            '+', '-', '*', '/', '%', '**',
            '&', '|', '^', '~', '<<', '>>', '>>>',
            '=', '=>'
        ];

        let result = line;

        // Supprime espaces autour des opérateurs (traiter les plus longs en premier)
        const sortedOperators = operators.sort((a, b) => b.length - a.length);
        
        for (const op of sortedOperators) {
            const escapedOp = op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Pour les opérateurs comme =>, garde un espace avant si nécessaire
            if (op === '=>') {
                result = result.replace(new RegExp(` *${escapedOp} *`, 'g'), ' => ');
            } else {
                result = result.replace(new RegExp(` *${escapedOp} *`, 'g'), op);
            }
        }

        // Supprime espaces autour des délimiteurs
        const delimiters = ['(', ')', '[', ']', '{', '}', ',', ';', ':'];
        for (const delim of delimiters) {
            // Fix: Correct escaping for delimiters
            let pattern;
            if (delim === '(' || delim === ')' || delim === '[' || delim === ']' || delim === '{' || delim === '}') {
                pattern = new RegExp(` *\\${delim} *`, 'g');
            } else {
                pattern = new RegExp(` *${delim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} *`, 'g');
            }
            
            if (delim === ':') {
                // Pour les objets, garde un espace après :
                result = result.replace(pattern, ': ');
            } else if (delim === ',') {
                // Pour les virgules, garde un espace après
                result = result.replace(pattern, ', ');
            } else {
                result = result.replace(pattern, delim);
            }
        }

        // Supprime espaces multiples restants
        result = result.replace(/ +/g, ' ');
        
        // Supprime espaces en début/fin
        result = result.trim();

        return result;
    }

    /**
     * MODE EXTRÊME: Supprime même les sauts de ligne non-critiques
     */
    extremeCompact(code) {
        // Commence par le compactage normal
        const compacted = this.compact(code);
        
        // Identifie les lignes qu'on peut fusionner
        const lines = compacted.split('\n');
        const extremeLines = [];
        
        let i = 0;
        while (i < lines.length) {
            const currentLine = lines[i].trim();
            
            // Si la ligne se termine par { ou [ ou (, garde le saut de ligne
            if (currentLine.endsWith('{') || currentLine.endsWith('[') || currentLine.endsWith('(')) {
                extremeLines.push(lines[i]);
                i++;
                continue;
            }

            // Si la ligne commence par } ou ] ou ), garde le saut de ligne
            if (currentLine.startsWith('}') || currentLine.startsWith(']') || currentLine.startsWith(')')
                || currentLine.startsWith('else') || currentLine.startsWith('catch') || currentLine.startsWith('finally')) {
                extremeLines.push(lines[i]);
                i++;
                continue;
            }
            
            // Sinon, essaie de fusionner avec la ligne suivante
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                
                // Conditions pour fusionner
                const canMerge = (
                    !currentLine.startsWith('//') &&  // Pas un commentaire
                    !nextLine.startsWith('//') &&
                    !currentLine.includes('import ') &&  // Pas un import
                    !currentLine.includes('export ') &&  // Pas un export
                    !nextLine.startsWith('else') &&
                    !nextLine.startsWith('catch') &&
                    !nextLine.startsWith('finally') &&
                    !nextLine.startsWith('case ') &&
                    !nextLine.startsWith('default:')
                );
                
                if (canMerge && (currentLine + nextLine).length < 120) {  // Ligne pas trop longue
                    const merged = lines[i].trimEnd() + ' ' + lines[i + 1].trimStart();
                    extremeLines.push(merged);
                    i += 2;
                    continue;
                }
            }
            
            extremeLines.push(lines[i]);
            i++;
        }
        
        return extremeLines.join('\n');
    }

    /**
     * Stats de compression avec motivation
     */
    getCompressionStats(original, compacted) {
        if (!original) {
            return { error: "Code vide" };
        }

        const origChars = original.length;
        const compChars = compacted.length;
        const reduction = origChars - compChars;
        const reductionPercent = origChars > 0 ? Math.round((reduction / origChars * 100) * 10) / 10 : 0.0;
        
        // Messages motivants
        let message;
        if (reductionPercent >= 30) {
            message = "🔥 DESTRUCTION COMPLÈTE ! Excellent travail !";
        } else if (reductionPercent >= 20) {
            message = "💪 TRÈS BON compactage !";
        } else if (reductionPercent >= 10) {
            message = "✅ Bon compactage";
        } else {
            message = "😤 On peut faire mieux...";
        }

        return {
            original: origChars,
            compacted: compChars,
            saved: reduction,
            reductionPercent,
            motivation: message,
            tokensSavedApprox: Math.floor(reduction / 4)  // Estimation tokens
        };
    }
}

// Fonctions utilitaires pour différents niveaux
function compactBrutal(code) {
    return new CodeCompactor().compact(code);
}

function compactExtreme(code) {
    return new CodeCompactor().extremeCompact(code);
}

// --- FONCTION POUR LE SERVEUR WEB MULTI-FICHIERS ---
function runMultiFileAnalysisForWeb(filesData, agentName) {
    console.log(`[WEB] Analyse multi-fichiers demandée avec l'agent ${agentName}`);
    
    // Pour un upload, il n'y a pas de "projet" parent commun sur le disque
    const projectPathForContext = null;

    try {
        // Ici vous intégreriez votre système d'analyse équivalent
        // const analyzer = new ALJabbarConfigured({
        //     testsConfigFile: "config/config_tests.json",
        //     agentsConfigFile: "config/agents_config.json"
        // });
        
        const context = {
            filesToAnalyze: filesData,
            projectPath: projectPathForContext
        };
        
        // const analysisResult = analyzer.runAgent(agentName, context);
        // return analysisResult;
        
        // Placeholder pour l'instant
        return {
            success: true,
            message: "Analyse simulée",
            context,
            agentName
        };

    } catch (error) {
        console.error("[ERREUR WEB] Une erreur interne est survenue:");
        console.error(error.stack);
        return { 
            error: `Une erreur interne est survenue lors de l'analyse : ${error.message}` 
        };
    }
}

// --- L'ancienne fonction peut être gardée pour compatibilité ---
function runAnalysisForWeb(fileContent, fileName, agentName) {
    const singleFileData = [{ filepath: fileName, content: fileContent }];
    return runMultiFileAnalysisForWeb(singleFileData, agentName);
}

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CodeCompactor,
        compactBrutal,
        compactExtreme,
        runMultiFileAnalysisForWeb,
        runAnalysisForWeb
    };
}

// Export pour ES6 modules
// export { CodeCompactor, compactBrutal, compactExtreme, runMultiFileAnalysisForWeb, runAnalysisForWeb };