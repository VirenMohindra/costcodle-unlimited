/**
 * Unit Tests for Storage Utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storage } from '../../src/modules/utils.js';

describe('storage utilities', () => {
  beforeEach(() => {
    // Reset localStorage mock
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('storage.get', () => {
    it('should return parsed value from localStorage', () => {
      const testData = { key: 'value', number: 42 };
      localStorage.setItem('test-key', JSON.stringify(testData));

      const result = storage.get('test-key', null);
      expect(result).toEqual(testData);
    });

    it('should return default value when key does not exist', () => {
      const defaultValue = { default: true };
      const result = storage.get('non-existent-key', defaultValue);
      expect(result).toEqual(defaultValue);
    });

    it('should return default value when localStorage throws error', () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const defaultValue = 'default';
      const result = storage.get('error-key', defaultValue);
      expect(result).toBe(defaultValue);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('invalid-json', 'invalid json {');

      const defaultValue = 'default';
      const result = storage.get('invalid-json', defaultValue);
      expect(result).toBe(defaultValue);
    });

    it('should handle different data types', () => {
      // String
      localStorage.setItem('string-key', JSON.stringify('test string'));
      expect(storage.get('string-key', null)).toBe('test string');

      // Number
      localStorage.setItem('number-key', JSON.stringify(123));
      expect(storage.get('number-key', null)).toBe(123);

      // Boolean
      localStorage.setItem('boolean-key', JSON.stringify(true));
      expect(storage.get('boolean-key', null)).toBe(true);

      // Array
      const array = [1, 2, 3];
      localStorage.setItem('array-key', JSON.stringify(array));
      expect(storage.get('array-key', null)).toEqual(array);
    });
  });

  describe('storage.set', () => {
    it('should store value in localStorage', () => {
      const testData = { key: 'value', number: 42 };
      const result = storage.set('test-key', testData);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(testData));
    });

    it('should handle localStorage errors', () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = storage.set('error-key', 'value');
      expect(result).toBe(false);
    });

    it('should handle quota exceeded error', () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'QuotaExceededError';

      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw quotaError;
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = storage.set('quota-key', 'value');
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should store different data types', () => {
      // String
      storage.set('string-key', 'test');
      expect(localStorage.setItem).toHaveBeenCalledWith('string-key', '"test"');

      // Number
      storage.set('number-key', 42);
      expect(localStorage.setItem).toHaveBeenCalledWith('number-key', '42');

      // Boolean
      storage.set('boolean-key', true);
      expect(localStorage.setItem).toHaveBeenCalledWith('boolean-key', 'true');

      // Object
      const obj = { test: true };
      storage.set('object-key', obj);
      expect(localStorage.setItem).toHaveBeenCalledWith('object-key', '{"test":true}');

      // Array
      const arr = [1, 2, 3];
      storage.set('array-key', arr);
      expect(localStorage.setItem).toHaveBeenCalledWith('array-key', '[1,2,3]');
    });

    it('should handle null and undefined values', () => {
      storage.set('null-key', null);
      expect(localStorage.setItem).toHaveBeenCalledWith('null-key', 'null');

      // JSON.stringify(undefined) returns undefined (not a string)
      // So storage.set will call setItem with the actual undefined value
      storage.set('undefined-key', undefined);
      expect(localStorage.setItem).toHaveBeenCalledWith('undefined-key', undefined);
    });
  });

  describe('integration tests', () => {
    it('should store and retrieve complex objects correctly', () => {
      const complexObject = {
        game: {
          number: 42,
          guesses: [10.99, 15.5, 12.75],
          hasWon: true,
          metadata: {
            timestamp: '2023-10-01T12:00:00.000Z',
            version: '2.0.0'
          }
        },
        user: {
          stats: {
            gamesPlayed: 100,
            winPercentage: 85.5,
            streak: 5
          }
        }
      };

      // Store
      const storeResult = storage.set('complex-data', complexObject);
      expect(storeResult).toBe(true);

      // Retrieve
      const retrievedData = storage.get('complex-data', null);
      expect(retrievedData).toEqual(complexObject);
    });

    it('should handle round-trip with default values', () => {
      const defaultStats = {
        gamesPlayed: 0,
        wins: 0,
        streak: 0
      };

      // First access should return default
      const firstAccess = storage.get('user-stats', defaultStats);
      expect(firstAccess).toEqual(defaultStats);

      // Store updated stats
      const updatedStats = { ...defaultStats, gamesPlayed: 1, wins: 1 };
      storage.set('user-stats', updatedStats);

      // Retrieve should return updated stats
      const secondAccess = storage.get('user-stats', defaultStats);
      expect(secondAccess).toEqual(updatedStats);
    });
  });
});
