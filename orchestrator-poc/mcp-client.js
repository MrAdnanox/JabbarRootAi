// JabbarRoot/orchestrator-poc/mcp-client.js

const fetch = require('node-fetch');

class McpClient {
  constructor(serverBaseUrl) {
    if (!serverBaseUrl) {
      throw new Error("L'URL de base du serveur MCP est requise.");
    }
    this.serverBaseUrl = serverBaseUrl;
    console.log(`[McpClient] Initialisé pour le serveur : ${this.serverBaseUrl}`);
  }

  /**
   * Appelle un outil sur le serveur MCP.
   * @param {string} toolName Le nom de l'outil à appeler.
   * @param {object} params Les paramètres à envoyer à l'outil.
   * @returns {Promise<object>} Le champ 'result' de la réponse JSON du serveur.
   */
  async call(toolName, params) {
    const url = `${this.serverBaseUrl}/mcp/call/${toolName}`;
    console.log(`[McpClient] Appel de l'outil '${toolName}' sur ${url}`);
    console.log(`[McpClient] avec les paramètres :`, params);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ params }),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        const errorMessage = responseBody.error?.message || `Erreur HTTP ${response.status}`;
        console.error(`[McpClient] Erreur lors de l'appel à '${toolName}': ${errorMessage}`);
        throw new Error(errorMessage);
      }

      console.log(`[McpClient] Réponse reçue pour '${toolName}'.`);
      return responseBody.result;

    } catch (error) {
      console.error(`[McpClient] Échec de la communication avec le serveur pour l'outil '${toolName}'.`, error);
      throw error;
    }
  }
}

module.exports = { McpClient };