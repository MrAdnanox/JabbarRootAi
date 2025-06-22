// flex_compactor.js
// FlexCompactor - Compresseur flexible et intelligent pour prompts et textes structurés

class FlexCompactor {
    /**
     * FlexCompactor - Compresseur flexible et intelligent pour prompts et textes structurés.
     */
    constructor() {
        this.flexReplacements = {
            "implementation": "impl", 
            "configuration": "config", 
            "optimization": "optim",
            "performance": "perf", 
            "recommendation": "rec", 
            "description": "desc",
            "validation": "valid", 
            "monitoring": "monit", 
            "analysis": "anlys",
            "complexity": "cplx", 
            "vulnerability": "vuln", 
            "security": "sec",
            "remediation": "fix", 
            "executive_summary": "summary", 
            "identified_issues": "issues",
            "proposed_fixes": "fixes", 
            "bottlenecks_detected": "bottlenecks",
            "memory_analysis": "mem_anlys", 
            "technical_risk": "tech_risk",
            "business_risk": "biz_risk", 
            "confidence": "conf", 
            "severity": "sev",
            "priority": "prio",
            "Your response MUST be a valid xml following this structure": "XML_STRUCTURE:",
            "Execute comprehensive analysis": "ANALYZE:", 
            "Act as an expert": "EXPERT:"
        };
    }

    /**
     * Compression flexible pour prompts et textes structurés.
     */
    flexCompress(text) {
        if (!text || !text.trim()) {
            return "";
        }
            
        let workingText = text;
        
        // 1. Remplacements sémantiques flexibles
        for (const [longForm, shortForm] of Object.entries(this.flexReplacements)) {
            // Créer un pattern avec word boundaries et flags case-insensitive
            const pattern = new RegExp(`\\b${longForm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            workingText = workingText.replace(pattern, shortForm);
        }
        
        // 2. Suppression intelligente des espaces
        // Préserver les espaces après certains mots-clés en les marquant temporairement
        const keywordsToPreserve = ['XML_STRUCTURE:', 'EXPERT:', 'TASK:', 'ANALYZE:', 'ENSURE:', 'INCLUDE:'];
        const tempMarkers = {};
        
        keywordsToPreserve.forEach((keyword, index) => {
            const marker = `__PRESERVE_SPACE_${index}__`;
            tempMarkers[marker] = keyword + ' ';
            workingText = workingText.replace(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+', 'g'), marker);
        });
        
        workingText = workingText.replace(/\s*:\s*/g, ':');
        workingText = workingText.replace(/\s*,\s*/g, ',');
        workingText = workingText.replace(/\s*\{\s*/g, '{');
        workingText = workingText.replace(/\s*\}\s*/g, '}');
        workingText = workingText.replace(/\s*\[\s*/g, '[');
        workingText = workingText.replace(/\s*\]\s*/g, ']');
        workingText = workingText.replace(/\s*\(\s*/g, '(');
        workingText = workingText.replace(/\s*\)\s*/g, ')');
        workingText = workingText.replace(/([\{\[])\s*\n\s*/g, '$1');
        workingText = workingText.replace(/\n\s*([\}\]])/g, '$1');
        workingText = workingText.replace(/([,:"])\s*\n\s*/g, '$1');
        
        // Restaurer les espaces préservés
        Object.entries(tempMarkers).forEach(([marker, replacement]) => {
            workingText = workingText.replace(new RegExp(marker, 'g'), replacement);
        });
        
        // 3. Nettoyage final intelligent
        const lines = workingText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
            
        const cleanedLines = lines.map(line => line.replace(/\s{2,}/g, ' '));
        const result = cleanedLines.join(' ');
        
        return result.trim();
    }

    /**
     * Statistiques de compression flexibles
     */
    getFlexStats(original, compressed) {
        if (!original) {
            return { error: "Texte vide" };
        }

        const origChars = original.length;
        const compChars = compressed.length;
        const reduction = origChars - compChars;
        const reductionPercent = origChars > 0 ? Math.round((reduction / origChars * 100) * 10) / 10 : 0.0;
        
        // Messages motivants flexibles
        let message;
        if (reductionPercent >= 40) {
            message = "🚀 COMPRESSION FLEXIBLE MAXIMALE ! Prompt ultra-optimisé !";
        } else if (reductionPercent >= 30) {
            message = "🔥 EXCELLENT ! Très bon gain flexible !";
        } else if (reductionPercent >= 20) {
            message = "💪 BON compactage flexible !";
        } else if (reductionPercent >= 10) {
            message = "✅ Compression flexible acceptable";
        } else {
            message = "😤 Peu d'optimisation flexible possible...";
        }

        return {
            original: origChars,
            compressed: compChars,
            saved: reduction,
            reductionPercent,
            motivation: message,
            tokensSavedApprox: Math.floor(reduction / 4),
            wordsOriginal: original.split(/\s+/).length,
            wordsCompressed: compressed.split(/\s+/).length,
            wordsSaved: original.split(/\s+/).length - compressed.split(/\s+/).length
        };
    }

    /**
     * Mode FLEX ULTRA pour prompts système
     */
    flexUltraCompress(text) {
        let result = text;
        
        // Remplacements supplémentaires pour prompts flexibles
        const flexPromptReplacements = {
            "You are an expert": "EXPERT:",
            "Your task is to": "TASK:",
            "Please analyze": "ANALYZE:",
            "Make sure to": "ENSURE:",
            "It is important": "IMPORTANT:",
            "Remember that": "NOTE:",
            "Keep in mind": "NOTE:",
            "Take into account": "CONSIDER:",
            "Pay attention to": "FOCUS:",
            "Be careful about": "WATCH:",
            "Don't forget to": "REMEMBER:",
            "Always include": "INCLUDE:",
            "Never include": "EXCLUDE:",
            "Format your response": "FORMAT:",
            "Structure your answer": "STRUCTURE:"
        };
        
        for (const [longForm, shortForm] of Object.entries(flexPromptReplacements)) {
            const pattern = new RegExp(longForm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            result = result.replace(pattern, shortForm);
        }
        
        // Suppression flexible de mots de liaison non-essentiels
        const flexFillerWords = [
            "\\bplease\\b", "\\bkindly\\b", "\\bthank you\\b", "\\bthanks\\b",
            "\\bif possible\\b", "\\bif you can\\b", "\\bwould you\\b",
            "\\bcould you\\b", "\\bmay you\\b", "\\bI would like\\b",
            "\\bI need\\b", "\\bI want\\b", "\\bI require\\b"
        ];
        
        for (const filler of flexFillerWords) {
            result = result.replace(new RegExp(filler, 'gi'), '');
        }
        
        // Nettoyage des espaces multiples
        result = result.replace(/\s+/g, ' ').trim();
        
        // Appliquer flexCompress()
        result = this.flexCompress(result);
        
        return result;
    }
}

// Fonctions utilitaires flexibles
function flexCompress(text) {
    return new FlexCompactor().flexCompress(text);
}

function flexUltraCompress(text) {
    return new FlexCompactor().flexUltraCompress(text);
}

// ============================================
// TESTS FLEXCOMPACTOR
// ============================================

function runFlexTests() {
    console.log("🧪 === TESTS FLEXCOMPACTOR ===\n");
    
    const flexCompactor = new FlexCompactor();
    let testsSuccess = 0;
    let testsTotal = 0;

    function flexTest(testName, testFunction) {
        testsTotal++;
        try {
            testFunction();
            console.log(`✅ ${testName}`);
            testsSuccess++;
        } catch (error) {
            console.log(`❌ ${testName}: ${error.message}`);
        }
    }

    function assertFlexEquals(actual, expected, message = "") {
        if (actual !== expected) {
            throw new Error(`Expected "${expected}", got "${actual}". ${message}`);
        }
    }

    function assertFlexTrue(condition, message = "") {
        if (!condition) {
            throw new Error(`Assertion failed. ${message}`);
        }
    }

    // FLEX TEST 1: Remplacements sémantiques flexibles
    flexTest("Remplacements sémantiques flexibles", () => {
        const input = "This is an implementation with configuration and optimization";
        const result = flexCompactor.flexCompress(input);
        assertFlexEquals(result, "This is an impl with config and optim");
    });

    // FLEX TEST 2: Suppression d'espaces autour des délimiteurs
    flexTest("Suppression espaces délimiteurs flexibles", () => {
        const input = "object : { key : value , array : [ 1 , 2 , 3 ] }";
        const result = flexCompactor.flexCompress(input);
        assertFlexEquals(result, "object:{key:value,array:[1,2,3]}");
    });

    // FLEX TEST 3: Nettoyage des lignes vides et espaces multiples
    flexTest("Nettoyage lignes et espaces flexibles", () => {
        const input = `Line one    with   spaces

        
        Line two
        
        Line three`;
        const result = flexCompactor.flexCompress(input);
        assertFlexEquals(result, "Line one with spaces Line two Line three");
    });

    // FLEX TEST 4: Texte vide
    flexTest("Texte vide flexible", () => {
        assertFlexEquals(flexCompactor.flexCompress(""), "");
        assertFlexEquals(flexCompactor.flexCompress("   "), "");
        assertFlexEquals(flexCompactor.flexCompress(null), "");
    });

    // FLEX TEST 5: Remplacements case-insensitive
    flexTest("Remplacements flexibles insensibles à la casse", () => {
        const input = "IMPLEMENTATION Implementation implementation";
        const result = flexCompactor.flexCompress(input);
        assertFlexEquals(result, "impl impl impl");
    });

    // FLEX TEST 6: Phrases complexes XML
    flexTest("Phrases XML flexibles complexes", () => {
        const input = "Your response MUST be a valid xml following this structure with configuration";
        const result = flexCompactor.flexCompress(input);
        assertFlexEquals(result, "XML_STRUCTURE: with config");
    });

    // FLEX TEST 7: Mode FLEX ULTRA prompt
    flexTest("Mode FLEX ULTRA prompt", () => {
        const input = "You are an expert. Please analyze this code. Make sure to include all details.";
        const result = flexCompactor.flexUltraCompress(input);
        assertFlexEquals(result, "EXPERT:. ANALYZE: this code. ENSURE: include all details.");
    });

    // FLEX TEST 8: Suppression mots de liaison flexibles
    flexTest("Suppression mots de liaison flexibles", () => {
        const input = "Please kindly analyze this if possible, thank you";
        const result = flexCompactor.flexUltraCompress(input);
        assertFlexEquals(result, "analyze this,");
    });

    // FLEX TEST 9: Structures JSON flexibles
    flexTest("Structures JSON flexibles", () => {
        const input = `{
            "performance" : {
                "optimization" : "high" ,
                "monitoring" : [ "cpu" , "memory" ]
            }
        }`;
        const result = flexCompactor.flexCompress(input);
        assertFlexEquals(result, '{"perf":{"optim":"high","monit":["cpu","memory"]}}');
    });

    // FLEX TEST 10: Stats de compression flexibles
    flexTest("Stats de compression flexibles", () => {
        const original = "This is a long implementation text with configuration";
        const compressed = flexCompactor.flexCompress(original);
        const stats = flexCompactor.getFlexStats(original, compressed);
        
        assertFlexTrue(stats.original > stats.compressed, "Original doit être plus long");
        assertFlexTrue(stats.saved > 0, "Doit avoir économisé des caractères");
        assertFlexTrue(stats.reductionPercent > 0, "Pourcentage doit être positif");
        assertFlexTrue(stats.motivation.length > 0, "Message de motivation requis");
    });

    // FLEX TEST 11: Préservation des mots importants
    flexTest("Préservation mots importants flexibles", () => {
        const input = "function implementation() { return configuration; }";
        const result = flexCompactor.flexCompress(input);
        assertFlexEquals(result, "function impl(){return config;}");
    });

    // FLEX TEST 12: Gestion des regex patterns spéciaux
    flexTest("Caractères spéciaux regex flexibles", () => {
        const input = "text with (parentheses) and [brackets] and {braces}";
        const result = flexCompactor.flexCompress(input);
        assertFlexEquals(result, "text with(parentheses)and[brackets]and{braces}");
    });

    // FLEX TEST 13: Mode prompt complet flexible
    flexTest("Prompt système complet flexible", () => {
        const input = `You are an expert developer. Your task is to analyze this implementation.
        Please make sure to include performance optimization and security validation.
        Remember that configuration is important. Thank you for your help.`;
        const result = flexCompactor.flexUltraCompress(input);
        
        assertFlexTrue(result.includes("EXPERT:"), "Doit contenir EXPERT:");
        assertFlexTrue(result.includes("TASK:"), "Doit contenir TASK:");
        assertFlexTrue(result.includes("impl"), "Doit remplacer implementation");
        assertFlexTrue(result.includes("config"), "Doit remplacer configuration");
        assertFlexTrue(!result.includes("Thank you"), "Ne doit pas contenir Thank you");
    });

    // FLEX TEST 14: Messages motivants flexibles
    flexTest("Messages motivants flexibles", () => {
        // Test avec forte compression
        const longText = "implementation ".repeat(20) + "configuration ".repeat(20);
        const compressed = flexCompactor.flexCompress(longText);
        const stats = flexCompactor.getFlexStats(longText, compressed);
        
        assertFlexTrue(stats.reductionPercent > 30, "Doit avoir forte compression");
        assertFlexTrue(stats.motivation.includes("🚀") || stats.motivation.includes("🔥"), 
                  "Doit avoir émoji positif");
    });

    // FLEX TEST 15: Fonctions utilitaires flexibles
    flexTest("Fonctions utilitaires flexibles", () => {
        const input = "implementation and configuration";
        
        const result1 = flexCompress(input);
        const result2 = flexUltraCompress(input);
        
        assertFlexEquals(result1, "impl and config");
        assertFlexEquals(result2, "impl and config");
    });

    // RÉSULTATS FINAUX FLEXIBLES
    console.log("\n" + "=".repeat(50));
    console.log(`📊 RÉSULTATS FLEXCOMPACTOR: ${testsSuccess}/${testsTotal} tests réussis`);
    
    if (testsSuccess === testsTotal) {
        console.log("🎉 TOUS LES TESTS FLEXCOMPACTOR SONT PASSÉS ! 🎉");
    } else {
        console.log(`⚠️  ${testsTotal - testsSuccess} tests flexibles ont échoué`);
    }
    
    // DEMO INTERACTIVE FLEXIBLE
    console.log("\n🚀 === DÉMO INTERACTIVE FLEXCOMPACTOR ===");
    
    const flexDemoTexts = [
        "You are an expert developer. Your task is to analyze this implementation code and provide configuration optimization recommendations.",
        
        `{
            "security_analysis": {
                "vulnerability_detection": "enabled",
                "performance_monitoring": ["cpu", "memory", "disk"]
            }
        }`,
        
        "Execute comprehensive analysis of the implementation. Make sure to include performance optimization, security validation, and configuration monitoring. Please be thorough, thank you."
    ];
    
    flexDemoTexts.forEach((text, i) => {
        console.log(`\n--- DÉMO FLEX ${i + 1} ---`);
        console.log("ORIGINAL:", text.substring(0, 80) + (text.length > 80 ? "..." : ""));
        
        const flexCompressed = flexCompactor.flexCompress(text);
        const flexUltra = flexCompactor.flexUltraCompress(text);
        const flexStats = flexCompactor.getFlexStats(text, flexUltra);
        
        console.log("FLEX COMPRESS:", flexCompressed.substring(0, 80) + (flexCompressed.length > 80 ? "..." : ""));
        console.log("FLEX ULTRA   :", flexUltra.substring(0, 80) + (flexUltra.length > 80 ? "..." : ""));
        console.log("FLEX STATS   :", `${flexStats.reductionPercent}% compression - ${flexStats.motivation}`);
    });
}

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FlexCompactor,
        flexCompress,
        flexUltraCompress,
        runFlexTests
    };
}

// Export pour ES6 modules
// export { FlexCompactor, flexCompress, flexUltraCompress, runFlexTests };

// Auto-exécution des tests si le fichier est lancé directement
if (typeof require !== 'undefined' && require.main === module) {
    runFlexTests();
}