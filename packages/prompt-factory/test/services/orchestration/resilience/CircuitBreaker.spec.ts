// packages/prompt-factory/test/services/orchestration/resilience/CircuitBreaker.spec.ts
import { expect } from 'chai';
import * as sinon from 'sinon';
import { CircuitBreaker } from '../../../../src/services/orchestration/resilience/CircuitBreaker.js';

describe('CircuitBreaker', () => {
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it('should be in CLOSED state initially', () => {
    const breaker = new CircuitBreaker();
    expect(breaker.getState()).to.equal('CLOSED');
  });

  it('should remain CLOSED after successful calls', async () => {
    const breaker = new CircuitBreaker();
    const successfulFunction = () => Promise.resolve('SUCCESS');
    
    await breaker.execute(successfulFunction);
    await breaker.execute(successfulFunction);

    expect(breaker.getState()).to.equal('CLOSED');
  });

  it('should transition to OPEN state after reaching failure threshold', async () => {
    const breaker = new CircuitBreaker(2, 10000); // 2 échecs pour ouvrir
    const failingFunction = () => Promise.reject(new Error('Failure'));

    await expect(breaker.execute(failingFunction)).to.be.rejected;
    expect(breaker.getState()).to.equal('CLOSED');

    await expect(breaker.execute(failingFunction)).to.be.rejected;
    expect(breaker.getState()).to.equal('OPEN');
  });

  it('should block calls when in OPEN state', async () => {
    const breaker = new CircuitBreaker(1);
    const failingFunction = () => Promise.reject(new Error('Failure'));
    const successfulFunction = sinon.stub().resolves('SUCCESS');

    await expect(breaker.execute(failingFunction)).to.be.rejected; // Ouvre le circuit
    expect(breaker.getState()).to.equal('OPEN');

    await expect(breaker.execute(successfulFunction)).to.be.rejectedWith('Circuit Breaker is open');
    expect(successfulFunction.called).to.be.false; // La fonction n'a même pas été appelée
  });

  it('should transition to HALF_OPEN after reset timeout', async () => {
    const breaker = new CircuitBreaker(1, 5000);
    const failingFunction = () => Promise.reject(new Error('Failure'));

    await expect(breaker.execute(failingFunction)).to.be.rejected;
    expect(breaker.getState()).to.equal('OPEN');

    await clock.tickAsync(5000); // Avance le temps du timeout

    expect(breaker.getState()).to.equal('HALF_OPEN');
  });

  it('should transition from HALF_OPEN to CLOSED on success', async () => {
    const breaker = new CircuitBreaker(1, 5000);
    await expect(breaker.execute(() => Promise.reject(new Error('Failure')))).to.be.rejected;
    await clock.tickAsync(5000);
    expect(breaker.getState()).to.equal('HALF_OPEN');

    await breaker.execute(() => Promise.resolve('SUCCESS'));
    
    expect(breaker.getState()).to.equal('CLOSED');
  });

  it('should transition from HALF_OPEN to OPEN on failure', async () => {
    const breaker = new CircuitBreaker(1, 5000);
    await expect(breaker.execute(() => Promise.reject(new Error('Failure')))).to.be.rejected;
    await clock.tickAsync(5000);
    expect(breaker.getState()).to.equal('HALF_OPEN');

    await expect(breaker.execute(() => Promise.reject(new Error('Another Failure')))).to.be.rejected;

    expect(breaker.getState()).to.equal('OPEN');
  });
});