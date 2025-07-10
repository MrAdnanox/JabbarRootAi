// JabbarRoot/infra/mock-context7-server/mock-server.js

const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Received ${req.method} request for ${req.url}`);
  // <-- CORRECTION : Vérifier que req.body existe avant d'y accéder -->
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

/**
 * Outil MCP factice : resolve-library-id
 * Prend un nom de bibliothèque et retourne un identifiant unique.
 */
app.post('/mcp/call/resolve-library-id', (req, res) => {
  const { params } = req.body;

  if (!params || !params.libraryName) {
    return res.status(400).json({ error: { message: "Paramètre 'libraryName' manquant." } });
  }

  if (params.libraryName === 'redis') {
    return res.status(200).json({
      result: {
        id: 'upstash/redis',
        confidence: 0.95,
        source: 'MockContext7Server'
      }
    });
  }

  return res.status(404).json({ error: { message: `Bibliothèque '${params.libraryName}' non trouvée.` } });
});

/**
 * Outil MCP factice : get-library-docs
 * Prend un ID de bibliothèque et retourne une documentation Markdown factice.
 */
app.post('/mcp/call/get-library-docs', (req, res) => {
  const { params } = req.body;

  if (!params || !params.libraryId) {
    return res.status(400).json({ error: { message: "Paramètre 'libraryId' manquant." } });
  }

  if (params.libraryId === 'upstash/redis') {
    const fakeMarkdownDoc = `
# hset (Hash Set)

Définit un champ dans un hash stocké à une clé donnée.

## Syntaxe
\`\`\`typescript
hset(key: string, field: string, value: any): Promise<number>
\`\`\`

## Description
Si la clé n'existe pas, un nouveau hash est créé. Si le champ existe déjà dans le hash, il est écrasé.

## Exemple
\`\`\`javascript
import { Redis } from '@upstash/redis';
const redis = new Redis({ ... });

await redis.hset('user:123', 'name', 'John Doe');
const name = await redis.hget('user:123', 'name'); // "John Doe"
\`\`\`
    `;
    return res.status(200).json({
      result: {
        documentation: fakeMarkdownDoc,
        format: 'markdown',
        source: 'MockContext7Server'
      }
    });
  }

  return res.status(404).json({ error: { message: `Documentation pour '${params.libraryId}' non trouvée.` } });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`✅ MockContext7Server démarré et à l'écoute sur http://localhost:${port}`);
  console.log('Outils disponibles :');
  console.log('  - POST /mcp/call/resolve-library-id');
  console.log('  - POST /mcp/call/get-library-docs');
});