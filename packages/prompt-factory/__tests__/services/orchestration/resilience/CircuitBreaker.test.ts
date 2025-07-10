// packages/prompt-factory/__tests__/services/orchestration/resilience/CircuitBreaker.test.ts

// import { expect } from 'chai'; // Supprimé
import * as sinon from 'sinon';
import { CircuitBreaker } from '../../../../src/services/orchestration/resilience/CircuitBreaker.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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
    const breaker = new CircuitBreaker(2, 10000); 
    const failingFunction = () => Promise.reject(new Error('Failure'));
    
    // CORRECTION
    await expect(breaker.execute(failingFunction)).rejects.toThrow('Failure');
    expect(breaker.getState()).to.equal('CLOSED');
    
    // CORRECTION
    await expect(breaker.execute(failingFunction)).rejects.toThrow('Failure');
    expect(breaker.getState()).to.equal('OPEN');
  });

  it('should block calls when in OPEN state', async () => {
    const breaker = new CircuitBreaker(1);
    const failingFunction = () => Promise.reject(new Error('Failure'));
    const successfulFunction = sinon.stub().resolves('SUCCESS');
    
    // CORRECTION
    await expect(breaker.execute(failingFunction)).rejects.toThrow('Failure'); 
    expect(breaker.getState()).to.equal('OPEN');
    
    // CORRECTION
    await expect(breaker.execute(successfulFunction)).rejects.toThrow('Circuit Breaker is open');
    expect(successfulFunction.called).to.be.false; 
  });

  it('should transition to HALF_OPEN after reset timeout', async () => {
    const breaker = new CircuitBreaker(1, 5000);
    const failingFunction = () => Promise.reject(new Error('Failure'));
    
    // CORRECTION
    await expect(breaker.execute(failingFunction)).rejects.toThrow('Failure');
    expect(breaker.getState()).to.equal('OPEN');
    
    await clock.tickAsync(5000); 
    expect(breaker.getState()).to.equal('HALF_OPEN');
  });

  it('should transition from HALF_OPEN to CLOSED on success', async () => {
    const breaker = new CircuitBreaker(1, 5000);
    
    // CORRECTION
    await expect(breaker.execute(() => Promise.reject(new Error('Failure')))).rejects.toThrow('Failure');
    await clock.tickAsync(5000);
    expect(breaker.getState()).to.equal('HALF_OPEN');
    
    await breaker.execute(() => Promise.resolve('SUCCESS'));
    expect(breaker.getState()).to.equal('CLOSED');
  });

  it('should transition from HALF_OPEN to OPEN on failure', async () => {
    const breaker = new CircuitBreaker(1, 5000);
    
    // CORRECTION
    await expect(breaker.execute(() => Promise.reject(new Error('Failure')))).rejects.toThrow('Failure');
    await clock.tickAsync(5000);
    expect(breaker.getState()).to.equal('HALF_OPEN');
    
    // CORRECTION
    await expect(breaker.execute(() => Promise.reject(new Error('Another Failure')))).rejects.toThrow('Another Failure');
    expect(breaker.getState()).to.equal('OPEN');
  });
});