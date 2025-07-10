// JabbarRoot/orchestrator-poc/run-workflow.js (version corrigée)

const { McpClient } = require('./mcp-client.js');
const neo4j = require('neo4j-driver');

// --- Points de Configuration ---
const MOCK_SERVER_URL = 'http://localhost:3000';
const NEO4J_URL = 'bolt://localhost:7687';
const NEO4J_USER = 'neo4j';
const NEO4J_PASSWORD = 'DevPassTemp'; // <-- MODIFICATION REQUISE

/**
 * Fonction pour créer un nœud de documentation dans Neo4j.
 * (Cette fonction reste inchangée)
 */
async function createDocumentationNode(driver, docData) {
  console.log('\n--- ÉTAPE 3: Synthèse et persistance dans le Graphe de Connaissance ---');
  const session = driver.session();
  try {
    const { libraryId, documentation, source } = docData;
    const result = await session.executeWrite(tx =>
      tx.run(
        `
          MERGE (d:Documentation { id: $libraryId })
          ON CREATE SET d.content = $documentation, d.source = $source, d.createdAt = timestamp(), d.updatedAt = timestamp()
          ON MATCH SET d.content = $documentation, d.source = $source, d.updatedAt = timestamp()
          RETURN d
        `,
        { libraryId, documentation, source }
      )
    );
    const createdNode = result.records[0].get('d');
    console.log('[Neo4j] Nœud de documentation créé/mis à jour avec succès.');
  } finally {
    await session.close();
  }
}

// <-- AJOUT : Fonction utilitaire pour la temporisation -->
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * <-- AJOUT : Fonction pour vérifier la connectivité avec une politique de réessai -->
 * @param {neo4j.Driver} driver L'instance du driver Neo4j.
 * @param {number} retries Le nombre de tentatives.
 * @param {number} delayMs Le délai entre les tentatives.
 */
async function verifyConnectivityWithRetry(driver, retries = 5, delayMs = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await driver.verifyConnectivity();
      console.log('[Neo4j] Connexion à la base de données réussie.');
      return; // Succès, on sort de la fonction
    } catch (error) {
      console.warn(`[Neo4j] Tentative de connexion ${i}/${retries} échouée... Erreur : ${error.message}`);
      if (i === retries) {
        console.error("[Neo4j] Nombre maximum de tentatives atteint. Abandon.");
        throw error; // Relance l'erreur après la dernière tentative
      }
      await delay(delayMs);
    }
  }
}


async function main() {
  console.log('🚀 [Workflow] Démarrage du workflow de test "Context7++"...');

  const client = new McpClient(MOCK_SERVER_URL);
  const driver = neo4j.driver(NEO4J_URL, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

  try {
    // <-- MODIFICATION : Utilisation de la nouvelle fonction de vérification -->
    await verifyConnectivityWithRetry(driver);

    // Le reste du workflow reste identique...
    console.log('\n--- ÉTAPE 1: Résolution de l\'ID de la bibliothèque ---');
    const resolveResult = await client.call('resolve-library-id', { libraryName: 'redis' });
    const libraryId = resolveResult.id;
    console.log(`[Workflow] ID de bibliothèque obtenu : ${libraryId}`);

    console.log('\n--- ÉTAPE 2: Récupération de la documentation ---');
    const docsResult = await client.call('get-library-docs', { libraryId: libraryId });
    console.log(`[Workflow] Documentation reçue avec succès !`);

    await createDocumentationNode(driver, {
      libraryId: libraryId,
      documentation: docsResult.documentation,
      source: docsResult.source
    });

    console.log('\n✅ [Workflow] Le cycle complet (Orchestration -> Appel -> Synthèse) s\'est terminé avec succès.');

  } catch (error) {
    console.error('\n❌ [Workflow] Le workflow a échoué :', error.message);
    process.exit(1);
  } finally {
    await driver.close();
    console.log('[Neo4j] Connexion à la base de données fermée.');
  }
}

main();