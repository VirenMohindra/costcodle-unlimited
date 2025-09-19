/**
 * Unit Tests for Validation Utilities
 */

import { describe, it, expect } from 'vitest';
import { validation } from '../../src/modules/utils.js';

describe('validation.validatePriceInput', () => {
  it('should validate correct price formats', () => {
    expect(validation.validatePriceInput('10.99')).toEqual({
      valid: true,
      value: 10.99,
      formatted: '10.99'
    });

    expect(validation.validatePriceInput('$15.50')).toEqual({
      valid: true,
      value: 15.5,
      formatted: '15.50'
    });

    expect(validation.validatePriceInput('100')).toEqual({
      valid: true,
      value: 100,
      formatted: '100.00'
    });

    expect(validation.validatePriceInput('0.01')).toEqual({
      valid: true,
      value: 0.01,
      formatted: '0.01'
    });
  });

  it('should handle input with spaces and commas', () => {
    expect(validation.validatePriceInput(' $1,234.56 ')).toEqual({
      valid: true,
      value: 1234.56,
      formatted: '1234.56'
    });

    expect(validation.validatePriceInput('$10,000')).toEqual({
      valid: true,
      value: 10000,
      formatted: '10000.00'
    });
  });

  it('should reject invalid inputs', () => {
    expect(validation.validatePriceInput('')).toEqual({
      valid: false,
      error: 'Input must be a string'
    });

    expect(validation.validatePriceInput('abc')).toEqual({
      valid: false,
      error: 'Input must contain only numbers and decimal points'
    });

    expect(validation.validatePriceInput('10.999')).toEqual({
      valid: false,
      error: 'Price can have at most 2 decimal places'
    });

    expect(validation.validatePriceInput('-5')).toEqual({
      valid: false,
      error: 'Input must contain only numbers and decimal points'
    });
  });

  it('should reject prices outside valid range', () => {
    expect(validation.validatePriceInput('0')).toEqual({
      valid: false,
      error: 'Price must be between $0.01 and $10,000'
    });

    expect(validation.validatePriceInput('10001')).toEqual({
      valid: false,
      error: 'Price must be between $0.01 and $10,000'
    });
  });

  it('should handle null and undefined inputs', () => {
    expect(validation.validatePriceInput(null as any)).toEqual({
      valid: false,
      error: 'Input must be a string'
    });

    expect(validation.validatePriceInput(undefined as any)).toEqual({
      valid: false,
      error: 'Input must be a string'
    });
  });
});

describe('validation.validateGameNumber', () => {
  it('should validate correct game numbers', () => {
    expect(validation.validateGameNumber(1, 100)).toEqual({
      valid: true,
      value: 1
    });

    expect(validation.validateGameNumber(50, 100)).toEqual({
      valid: true,
      value: 50
    });

    expect(validation.validateGameNumber(100, 100)).toEqual({
      valid: true,
      value: 100
    });
  });

  it('should handle string inputs', () => {
    expect(validation.validateGameNumber('25', 100)).toEqual({
      valid: true,
      value: 25
    });
  });

  it('should reject invalid game numbers', () => {
    expect(validation.validateGameNumber(0, 100)).toEqual({
      valid: false,
      error: 'Game number must be between 1 and 100'
    });

    expect(validation.validateGameNumber(101, 100)).toEqual({
      valid: false,
      error: 'Game number must be between 1 and 100'
    });

    expect(validation.validateGameNumber(-1, 100)).toEqual({
      valid: false,
      error: 'Game number must be between 1 and 100'
    });
  });

  it('should handle invalid string inputs', () => {
    expect(validation.validateGameNumber('abc', 100)).toEqual({
      valid: false,
      error: 'Game number must be between 1 and 100'
    });

    expect(validation.validateGameNumber('', 100)).toEqual({
      valid: false,
      error: 'Game number must be between 1 and 100'
    });
  });
});
