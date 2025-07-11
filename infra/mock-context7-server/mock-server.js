// infra/mock-context7-server/mock-server.js
const express = require('express');
const cors =require('cors');

const app = express();
const port = 3000;

app.use(cors());
// MODIFICATION 1 : Utilisation du middleware express.json() intégré et moderne.
app.use(express.json());

// Endpoint MCP générique
app.post('/mcp/call/:capability', (req, res) => {
    const { capability } = req.params;
    // MODIFICATION 2 : Déstructuration sécurisée avec optional chaining et valeur par défaut.
    // Cela empêche le crash si req.body est undefined ou si params est manquant.
    const params = req.body?.params || {};

    console.log(`[Mock Server] Received call for capability: ${capability}`);
    console.log(`[Mock Server] With params:`, params);

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[Mock Server] Authentication failed: Missing or invalid Bearer token.');
        return res.status(401).json({
            error: { message: 'Unauthorized' }
        });
    }

    let result;

    switch (capability) {
        case 'documentation:search':
            result = {
                query: params.query,
                results: [
                    { id: 'doc-react-hooks', score: 0.98, title: 'Introduction to React Hooks' },
                    { id: 'doc-react-state', score: 0.95, title: 'Managing State in React' }
                ],
                documentation: `Found 2 documents for query: "${params.query}"`
            };
            break;
        
        case 'documentation:fetch':
            result = {
                id: params.id,
                content: `# Document ${params.id}\n\nThis is the full content of the document.`,
                documentation: `Content for document ${params.id} fetched successfully.`
            };
            break;

        default:
            return res.status(404).json({
                error: { message: `Capability '${capability}' not found.` }
            });
    }

    res.status(200).json({
        result: result
    });
});

app.listen(port, () => {
    console.log(`[Mock Server] MCP Mock Server listening on http://localhost:${port}`);
});