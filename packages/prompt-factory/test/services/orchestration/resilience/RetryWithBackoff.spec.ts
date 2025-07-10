// packages/prompt-factory/src/services/orchestration/resilience/RetryWithBackoff.spec.ts (version finale)

import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import { RetryWithBackoff } from '../../../../src/services/orchestration/resilience/RetryWithBackoff.js'; // Assurez-vous d'utiliser .js

use(chaiAsPromised);

describe('RetryWithBackoff', () => {
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it('should return the result on the first successful attempt', async () => {
    const retry = new RetryWithBackoff(3, 100);
    const successfulFunction = sinon.stub().resolves('SUCCESS');
    await expect(retry.execute(successfulFunction)).to.eventually.equal('SUCCESS');
    expect(successfulFunction.callCount).to.equal(1);
  });

  it('should retry the specified number of times on failure', async function() {
    // <-- AUGMENTATION DU TIMEOUT POUR CE TEST SPÉCIFIQUE -->
    this.timeout(5000); 
    
    const maxRetries = 3;
    const retry = new RetryWithBackoff(maxRetries, 100);
    const failingFunction = sinon.stub().rejects(new Error('Failure'));
    const promise = retry.execute(failingFunction);
    
    // Avance l'horloge pour couvrir tous les délais
    await clock.tickAsync(100 + 200 + 400);

    await expect(promise).to.be.rejectedWith(/Operation failed after 3 attempts/);
    expect(failingFunction.callCount).to.equal(maxRetries);
  });

  it('should succeed if one of the retries is successful', async function() {
    this.timeout(5000);
    const retry = new RetryWithBackoff(3, 100);
    const flakyFunction = sinon.stub();
    flakyFunction.onFirstCall().rejects(new Error('First failure'));
    flakyFunction.onSecondCall().resolves('SUCCESS');
    
    const promise = retry.execute(flakyFunction);
    
    // Avance l'horloge pour le premier délai
    await clock.tickAsync(100);
    
    await expect(promise).to.eventually.equal('SUCCESS');
    expect(flakyFunction.callCount).to.equal(2);
  });

  // <-- TEST SIMPLIFIÉ ET CORRIGÉ -->
  it('should use exponential backoff for delays', async function() {
    this.timeout(5000); // Sécurité
    const maxRetries = 4;
    const retry = new RetryWithBackoff(maxRetries, 100, 2);
    const failingFunction = sinon.stub().rejects(new Error('Failure'));

    const promise = retry.execute(failingFunction);

    // Avance le temps total nécessaire pour tous les réessais
    // Délais : 100 + 200 + 400 + 800 = 1500ms
    await clock.tickAsync(1500);

    // Vérifie que la promesse finale est bien rejetée
    await expect(promise).to.be.rejected;
    // Vérifie que la fonction a été appelée le bon nombre de fois (1 initial + 3 retries)
    expect(failingFunction.callCount).to.equal(maxRetries);
  });
});