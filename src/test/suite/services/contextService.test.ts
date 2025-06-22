// src/test/suite/services/contextService.test.ts

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { ContextService } from '../../../services/contextService';
import { ProgrammableContext } from '../../../models/programmableContext';

class MockMemento implements vscode.Memento {
    private values: { [key: string]: any } = {};
    get<T>(key: string, defaultValue?: T): T | undefined { return this.values[key] || defaultValue; }
    async update(key: string, value: any): Promise<void> { this.values[key] = value; }
    keys(): readonly string[] { return Object.keys(this.values); }
}

suite('Service: ContextService', () => {
    let contextService: ContextService;
    let mockMemento: vscode.Memento;

    setup(() => {
        mockMemento = new MockMemento();
        contextService = new ContextService(mockMemento);
    });

    teardown(() => {
        sinon.restore();
    });

    test('doit créer un contexte avec un ID au format UUID', async () => {
        const newContext = await contextService.createContext('Test UUID', [], {});
        
        // CHANGED: On ne mocke plus crypto. On teste le résultat.
        // Un UUID a un format de 36 caractères : 8-4-4-4-12
        assert.strictEqual(typeof newContext.id, 'string');
        assert.strictEqual(newContext.id.length, 36);
        assert.match(newContext.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    test('doit initialiser avec une map de contextes vide', () => {
        assert.deepStrictEqual(contextService.getContexts(), []);
    });

    test('doit créer un contexte et le sauvegarder', async () => {
        const mementoUpdateSpy = sinon.spy(mockMemento, 'update');
        const newContext = await contextService.createContext('Test', [], {});

        assert.ok(mementoUpdateSpy.calledOnce);
    });

    test('doit créer un contexte avec des options personnalisées', async () => {
        const customOptions = { compression_level: 'extreme' as const, include_project_tree: true };
        const files = [vscode.Uri.file('/test/file.ts')];

        const newContext = await contextService.createContext('Test', files, customOptions);

        assert.strictEqual(newContext.options.compression_level, 'extreme');
        assert.strictEqual(newContext.options.include_project_tree, true);
        assert.deepStrictEqual(newContext.files_scope, ['/test/file.ts']);
    });
    
    test('doit sauvegarder les contextes après création', async () => {
        const mementoUpdateSpy = sinon.spy(mockMemento, 'update');
        await contextService.createContext('Test Save', [], {});
        assert.ok(mementoUpdateSpy.calledOnce, 'Memento.update n\'a pas été appelé');
    });

    test('doit récupérer un contexte par son ID', async () => {
        const newContext = await contextService.createContext('Test Get', [], {});
        const retrievedContext = contextService.getContext(newContext.id);
        
        assert.ok(retrievedContext, "Le contexte aurait dû être trouvé");
        assert.strictEqual(retrievedContext?.id, newContext.id);
    });

    test('doit retourner undefined pour un ID de contexte inexistant', () => {
        const retrievedContext = contextService.getContext('non-existent-id');
        assert.strictEqual(retrievedContext, undefined);
    });

    test('doit supprimer un contexte existant', async () => {
        const newContext = await contextService.createContext('Test Delete', [], {});
        assert.strictEqual(contextService.getContexts().length, 1, "Le contexte devrait exister avant la suppression");

        await contextService.deleteContext(newContext.id);
        assert.strictEqual(contextService.getContexts().length, 0, "Le contexte ne devrait plus exister après la suppression");
    });

    test('ne doit pas échouer en supprimant un contexte inexistant', async () => {
        await assert.doesNotReject(async () => {
            await contextService.deleteContext('non-existent-id');
        });
    });

    test('doit charger les contextes depuis Memento lors de l\'initialisation', () => {
        const initialContexts: ProgrammableContext[] = [{
            id: 'loaded-uuid',
            name: 'Loaded Context',
            files_scope: [],
            options: { compression_level: 'none', include_project_tree: false, special_sections: {} },
            metadata: { createdAt: new Date().toISOString() }
        }];
        
        const mementoWithData = new MockMemento();
        mementoWithData.update('jabbaRoot.contexts', JSON.stringify(initialContexts));
        
        const newService = new ContextService(mementoWithData);
        
        const loadedContexts = newService.getContexts();
        assert.strictEqual(loadedContexts.length, 1);
        assert.strictEqual(loadedContexts[0].name, 'Loaded Context');
    });
});