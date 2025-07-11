import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RetryWithBackoff } from '../../../../src/services/orchestration/resilience/RetryWithBackoff.js';

describe('RetryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the result on the first successful attempt', async () => {
    const retry = new RetryWithBackoff(3, 100);
    const successfulFunction = vi.fn().mockResolvedValue('SUCCESS');
    
    const result = await retry.execute(successfulFunction);
    
    expect(result).toBe('SUCCESS');
    expect(successfulFunction).toHaveBeenCalledTimes(1);
  });

  it('should retry the specified number of times on failure', async () => {
    const maxRetries = 3;
    const retry = new RetryWithBackoff(maxRetries, 100);
    const failingFunction = vi.fn().mockRejectedValue(new Error('Failure'));

    // Créer une promesse qui sera rejetée
    const executePromise = retry.execute(failingFunction);
    
    // Utiliser runAllTimersAsync pour gérer correctement les timers asynchrones
    const timersPromise = vi.runAllTimersAsync();
    
    // Attendre que les timers et la promesse se terminent
    await Promise.allSettled([timersPromise, executePromise]);
    
    // Vérifier que la promesse a été rejetée avec le bon message
    await expect(executePromise).rejects.toThrow('Operation failed after 3 attempts');
    expect(failingFunction).toHaveBeenCalledTimes(maxRetries);
  });

  it('should succeed if one of the retries is successful', async () => {
    const retry = new RetryWithBackoff(3, 100);
    const flakyFunction = vi.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('SUCCESS');

    // Démarrer l'exécution
    const executePromise = retry.execute(flakyFunction);
    
    // Avancer tous les timers asynchrones
    await vi.runAllTimersAsync();
    
    // Attendre le résultat
    const result = await executePromise;
    
    expect(result).toBe('SUCCESS');
    expect(flakyFunction).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff for delays', async () => {
    const maxRetries = 4;
    const initialDelay = 100;
    const backoffFactor = 2;
    const retry = new RetryWithBackoff(maxRetries, initialDelay, backoffFactor);
    const failingFunction = vi.fn().mockRejectedValue(new Error('Failure'));

    // Créer une promesse qui gère l'erreur attendue
    const executePromise = retry.execute(failingFunction);
    const errorPromise = executePromise.catch(error => error);
    
    // Spy sur setTimeout APRÈS avoir démarré l'exécution pour éviter les interférences
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    
    // Avancer tous les timers asynchrones
    await vi.runAllTimersAsync();
    
    // Attendre l'erreur
    const caughtError = await errorPromise;
    expect(caughtError).toBeInstanceOf(Error);
    if (caughtError instanceof Error) {
      expect(caughtError.message).toContain('Operation failed after 4 attempts');
    }
    
    // Vérifier que la fonction a été appelée le bon nombre de fois
    expect(failingFunction).toHaveBeenCalledTimes(maxRetries);
    
    // Vérifier que setTimeout a été appelé pour les délais (3 délais pour 4 tentatives)
    // Filtrer seulement les appels avec des délais correspondant à notre backoff
    const backoffCalls = setTimeoutSpy.mock.calls.filter(call => 
      call[1] === 100 || call[1] === 200 || call[1] === 400
    );
    expect(backoffCalls).toHaveLength(3);
    
    // Vérifier les délais spécifiques
    expect(backoffCalls[0][1]).toBe(100);
    expect(backoffCalls[1][1]).toBe(200);
    expect(backoffCalls[2][1]).toBe(400);
    
    setTimeoutSpy.mockRestore();
  });

  it('should handle immediate success without delay', async () => {
    const retry = new RetryWithBackoff(3, 100);
    const immediateSuccessFunction = vi.fn().mockResolvedValue('IMMEDIATE_SUCCESS');
    
    const result = await retry.execute(immediateSuccessFunction);
    
    expect(result).toBe('IMMEDIATE_SUCCESS');
    expect(immediateSuccessFunction).toHaveBeenCalledTimes(1);
  });

  it('should preserve error details from the last attempt', async () => {
    const retry = new RetryWithBackoff(2, 100);
    const specificError = new Error('Specific failure reason');
    const failingFunction = vi.fn().mockRejectedValue(specificError);

    // Démarrer l'exécution et immédiatement encapsuler dans try-catch
    const executePromise = retry.execute(failingFunction);
    
    // Créer une promesse qui gère l'erreur attendue
    const errorPromise = executePromise.catch(error => error);
    
    // Avancer tous les timers
    await vi.runAllTimersAsync();
    
    // Attendre l'erreur et vérifier (inclure le préfixe [Retry])
    const caughtError = await errorPromise;
    expect(caughtError).toBeInstanceOf(Error);
    if (caughtError instanceof Error) {
      expect(caughtError.message).toBe('[Retry] Operation failed after 2 attempts. Last error: Specific failure reason');
    }
    expect(failingFunction).toHaveBeenCalledTimes(2);
  });
});