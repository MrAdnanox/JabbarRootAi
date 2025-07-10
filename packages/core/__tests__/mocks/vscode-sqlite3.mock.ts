import { vi } from 'vitest';

// Interface pour typer correctement les callbacks SQLite
interface SQLiteCallback<T = any> {
  (this: any, err: Error | null, result?: T): void;
}

// Interface pour les méthodes de base de données
interface MockDatabaseMethods {
  run: (sql: string, params?: any[], callback?: SQLiteCallback) => any;
  get: (sql: string, params?: any[], callback?: SQLiteCallback<any>) => any;
  all: (sql: string, params?: any[], callback?: SQLiteCallback<any[]>) => any;
  exec: (sql: string, callback?: SQLiteCallback) => any;
  close: (callback?: SQLiteCallback) => any;
  serialize: (callback?: () => void) => any;
  parallelize: (callback?: () => void) => any;
}

// Store en mémoire pour simuler la base de données
const dbStore = new Map<string, any>();
let autoIncrementId = 1;

// Fonction utilitaire pour générer une clé unique
const generateKey = (sql: string, params: any[] = []): string => {
  return `${sql}_${JSON.stringify(params)}_${Date.now()}`;
};

// Fonction utilitaire pour simuler un délai asynchrone
const simulateAsyncOperation = <T>(
  operation: () => T, 
  callback?: SQLiteCallback<T>
): void => {
  // Utiliser setTimeout avec un délai minimal pour simuler l'asynchrone
  setTimeout(() => {
    try {
      const result = operation();
      if (callback) {
        callback.call(null, null, result);
      }
    } catch (error) {
      if (callback) {
        callback.call(null, error as Error);
      }
    }
  }, 0);
};

// Méthodes mockées avec gestion d'erreurs appropriée
const mockDatabaseMethods: MockDatabaseMethods = {
  run: vi.fn((sql: string, params: any[] = [], callback?: SQLiteCallback) => {
    simulateAsyncOperation(() => {
      if (sql.toLowerCase().includes('insert')) {
        const key = generateKey(sql, params);
        const record = { id: autoIncrementId++, ...params };
        dbStore.set(key, record);
        return { lastID: record.id, changes: 1 };
      } else if (sql.toLowerCase().includes('update')) {
        // Simuler une mise à jour
        return { lastID: 0, changes: 1 };
      } else if (sql.toLowerCase().includes('delete')) {
        // Simuler une suppression
        return { lastID: 0, changes: 1 };
      }
      return { lastID: 0, changes: 0 };
    }, callback);
  }),

  get: vi.fn((sql: string, params: any[] = [], callback?: SQLiteCallback<any>) => {
    simulateAsyncOperation(() => {
      if (sql.toLowerCase().includes('select')) {
        // Simuler la récupération d'un enregistrement
        const keys = Array.from(dbStore.keys());
        const matchingKey = keys.find(key => key.includes(JSON.stringify(params)));
        return matchingKey ? dbStore.get(matchingKey) : null;
      }
      return null;
    }, callback);
  }),

  all: vi.fn((sql: string, params: any[] = [], callback?: SQLiteCallback<any[]>) => {
    simulateAsyncOperation(() => {
      if (sql.toLowerCase().includes('select')) {
        return Array.from(dbStore.values());
      }
      return [];
    }, callback);
  }),

  exec: vi.fn((sql: string, callback?: SQLiteCallback) => {
    simulateAsyncOperation(() => {
      // Simuler l'exécution de commandes SQL (CREATE TABLE, etc.)
      if (sql.toLowerCase().includes('create')) {
        return { changes: 0 };
      }
      return { changes: 0 };
    }, callback);
  }),

  close: vi.fn((callback?: SQLiteCallback) => {
    simulateAsyncOperation(() => {
      // Nettoyer le store si nécessaire
      dbStore.clear();
      return undefined;
    }, callback);
  }),

  serialize: vi.fn((callback?: () => void) => {
    if (callback) {
      callback();
    }
  }),

  parallelize: vi.fn((callback?: () => void) => {
    if (callback) {
      callback();
    }
  })
};

// Fonction pour réinitialiser le mock entre les tests
export const resetMockDatabase = (): void => {
  dbStore.clear();
  autoIncrementId = 1;
  
  // Réinitialiser tous les mocks
  Object.values(mockDatabaseMethods).forEach(mock => {
    if (vi.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
};

// Fonction pour accéder aux données du store (utile pour les tests)
export const getMockDatabaseStore = (): Map<string, any> => {
  return new Map(dbStore);
};

// Fonction pour injecter des données dans le store (utile pour les tests)
export const setMockDatabaseData = (data: Record<string, any>): void => {
  Object.entries(data).forEach(([key, value]) => {
    dbStore.set(key, value);
  });
};

// Mock de la classe Database
const MockDatabase = vi.fn().mockImplementation((filename?: string, mode?: number, callback?: SQLiteCallback) => {
  // Simuler l'ouverture asynchrone de la base de données
  if (typeof mode === 'function') {
    callback = mode;
    mode = undefined;
  }
  
  if (callback) {
    setTimeout(() => {
      callback.call(null, null);
    }, 0);
  }
  
  return mockDatabaseMethods;
});

// Exporter les constantes SQLite courantes
export const SQLITE_CONSTANTS = {
  OPEN_READONLY: 1,
  OPEN_READWRITE: 2,
  OPEN_CREATE: 4,
  OPEN_FULLMUTEX: 16,
  OPEN_SHAREDCACHE: 32,
  OPEN_PRIVATECACHE: 64,
};

// Mock du module @vscode/sqlite3
vi.mock('@vscode/sqlite3', () => ({
  default: {
    Database: MockDatabase,
    OPEN_READONLY: SQLITE_CONSTANTS.OPEN_READONLY,
    OPEN_READWRITE: SQLITE_CONSTANTS.OPEN_READWRITE,
    OPEN_CREATE: SQLITE_CONSTANTS.OPEN_CREATE,
    OPEN_FULLMUTEX: SQLITE_CONSTANTS.OPEN_FULLMUTEX,
    OPEN_SHAREDCACHE: SQLITE_CONSTANTS.OPEN_SHAREDCACHE,
    OPEN_PRIVATECACHE: SQLITE_CONSTANTS.OPEN_PRIVATECACHE,
  },
  Database: MockDatabase,
  OPEN_READONLY: SQLITE_CONSTANTS.OPEN_READONLY,
  OPEN_READWRITE: SQLITE_CONSTANTS.OPEN_READWRITE,
  OPEN_CREATE: SQLITE_CONSTANTS.OPEN_CREATE,
  OPEN_FULLMUTEX: SQLITE_CONSTANTS.OPEN_FULLMUTEX,
  OPEN_SHAREDCACHE: SQLITE_CONSTANTS.OPEN_SHAREDCACHE,
  OPEN_PRIVATECACHE: SQLITE_CONSTANTS.OPEN_PRIVATECACHE,
}));

// Exporter les méthodes mockées pour les tests
export { MockDatabase, mockDatabaseMethods };