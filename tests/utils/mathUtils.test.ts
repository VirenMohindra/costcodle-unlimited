/**
 * Unit Tests for Math Utilities
 */

import { describe, it, expect } from 'vitest';
import { mathUtils } from '../../src/modules/utils.js';

describe('mathUtils.calculatePercentDifference', () => {
  it('should calculate percentage difference correctly', () => {
    expect(mathUtils.calculatePercentDifference(100, 100)).toBe(0);
    expect(mathUtils.calculatePercentDifference(110, 100)).toBeCloseTo(10, 10);
    expect(mathUtils.calculatePercentDifference(90, 100)).toBeCloseTo(-10, 10);
    expect(mathUtils.calculatePercentDifference(150, 100)).toBeCloseTo(50, 10);
    expect(mathUtils.calculatePercentDifference(50, 100)).toBeCloseTo(-50, 10);
  });

  it('should handle target of zero', () => {
    expect(mathUtils.calculatePercentDifference(0, 0)).toBe(0);
    expect(mathUtils.calculatePercentDifference(10, 0)).toBe(Infinity);
  });

  it('should handle decimal values', () => {
    expect(mathUtils.calculatePercentDifference(10.5, 10)).toBe(5);
    expect(mathUtils.calculatePercentDifference(9.5, 10)).toBe(-5);
  });
});

describe('mathUtils.isWithinPercent', () => {
  it('should correctly determine if value is within percentage', () => {
    expect(mathUtils.isWithinPercent(95, 100, 5)).toBe(true);
    expect(mathUtils.isWithinPercent(105, 100, 5)).toBe(true);
    expect(mathUtils.isWithinPercent(100, 100, 5)).toBe(true);

    expect(mathUtils.isWithinPercent(94, 100, 5)).toBe(false);
    expect(mathUtils.isWithinPercent(106, 100, 5)).toBe(false);
  });

  it('should handle zero target values', () => {
    expect(mathUtils.isWithinPercent(0, 0, 5)).toBe(true);
    expect(mathUtils.isWithinPercent(1, 0, 5)).toBe(false);
  });
});

describe('mathUtils.clamp', () => {
  it('should clamp values within range', () => {
    expect(mathUtils.clamp(5, 0, 10)).toBe(5);
    expect(mathUtils.clamp(-5, 0, 10)).toBe(0);
    expect(mathUtils.clamp(15, 0, 10)).toBe(10);
    expect(mathUtils.clamp(0, 0, 10)).toBe(0);
    expect(mathUtils.clamp(10, 0, 10)).toBe(10);
  });

  it('should handle negative ranges', () => {
    expect(mathUtils.clamp(-5, -10, -1)).toBe(-5);
    expect(mathUtils.clamp(-15, -10, -1)).toBe(-10);
    expect(mathUtils.clamp(5, -10, -1)).toBe(-1);
  });
});

describe('mathUtils.round', () => {
  it('should round to specified decimal places', () => {
    expect(mathUtils.round(3.14159)).toBe(3);
    expect(mathUtils.round(3.14159, 0)).toBe(3);
    expect(mathUtils.round(3.14159, 2)).toBe(3.14);
    expect(mathUtils.round(3.14159, 4)).toBe(3.1416);
  });

  it('should handle negative numbers', () => {
    expect(mathUtils.round(-3.14159, 2)).toBe(-3.14);
    expect(mathUtils.round(-3.16159, 2)).toBe(-3.16);
  });
});

describe('mathUtils.randomBetween', () => {
  it('should return values within range', () => {
    for (let i = 0; i < 100; i++) {
      const result = mathUtils.randomBetween(10, 20);
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(20);
    }
  });

  it('should handle negative ranges', () => {
    for (let i = 0; i < 100; i++) {
      const result = mathUtils.randomBetween(-20, -10);
      expect(result).toBeGreaterThanOrEqual(-20);
      expect(result).toBeLessThanOrEqual(-10);
    }
  });
});

describe('mathUtils.formatCurrency', () => {
  it('should format currency correctly with defaults', () => {
    expect(mathUtils.formatCurrency(1234.56)).toBe('$1,234.56');
    expect(mathUtils.formatCurrency(0)).toBe('$0.00');
    expect(mathUtils.formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('should handle different currencies', () => {
    expect(mathUtils.formatCurrency(1234.56, 'EUR', 'en-US')).toBe('€1,234.56');
    expect(mathUtils.formatCurrency(1234.56, 'GBP', 'en-US')).toBe('£1,234.56');
  });

  it('should handle different locales', () => {
    // Note: These tests might be environment dependent
    const result = mathUtils.formatCurrency(1234.56, 'USD', 'de-DE');
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('56');
  });
});
