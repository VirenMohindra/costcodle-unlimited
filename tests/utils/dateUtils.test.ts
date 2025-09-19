/**
 * Unit Tests for Date Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dateUtils } from '../../src/modules/utils.js';

describe('dateUtils.getGameNumber', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate game number correctly from start date', () => {
    // Mock a specific date - October 1, 2023 (10 days after start date)
    const mockDate = new Date('2023-10-01T00:00:00.000Z');
    vi.setSystemTime(mockDate);

    const gameNumber = dateUtils.getGameNumber();
    expect(gameNumber).toBe(10); // Day 10 since September 21, 2023
  });

  it('should return 1 for the start date', () => {
    // Mock the exact start date (day after to account for ceil calculation)
    const mockDate = new Date('2023-09-21T12:00:00.000Z');
    vi.setSystemTime(mockDate);

    const gameNumber = dateUtils.getGameNumber();
    expect(gameNumber).toBe(1);
  });

  it('should handle different times of day consistently', () => {
    // Morning
    vi.setSystemTime(new Date('2023-09-22T08:00:00.000Z'));
    const morningGame = dateUtils.getGameNumber();

    // Evening
    vi.setSystemTime(new Date('2023-09-22T23:59:59.999Z'));
    const eveningGame = dateUtils.getGameNumber();

    expect(morningGame).toBe(eveningGame);
    expect(morningGame).toBe(2);
  });
});

describe('dateUtils.getDateForGameNumber', () => {
  it('should return correct date for game number', () => {
    const date1 = dateUtils.getDateForGameNumber(1);
    expect(date1).toBe('Sep 21, 2023');

    const date2 = dateUtils.getDateForGameNumber(2);
    expect(date2).toBe('Sep 22, 2023');

    const date10 = dateUtils.getDateForGameNumber(10);
    expect(date10).toBe('Sep 30, 2023');

    const date11 = dateUtils.getDateForGameNumber(11);
    expect(date11).toBe('Oct 1, 2023');
  });

  it('should handle large game numbers', () => {
    const date365 = dateUtils.getDateForGameNumber(365);
    expect(date365).toContain('2024'); // Should be in 2024

    const date100 = dateUtils.getDateForGameNumber(100);
    expect(date100).toBe('Dec 29, 2023');
  });
});

describe('dateUtils.isValidDate', () => {
  it('should validate correct dates', () => {
    expect(dateUtils.isValidDate(new Date())).toBe(true);
    expect(dateUtils.isValidDate(new Date('2023-01-01'))).toBe(true);
    expect(dateUtils.isValidDate(new Date('2023-12-31T23:59:59.999Z'))).toBe(true);
  });

  it('should reject invalid dates', () => {
    expect(dateUtils.isValidDate(new Date('invalid'))).toBe(false);
    expect(dateUtils.isValidDate(new Date('2023-13-01'))).toBe(false); // Invalid month
    // Note: JavaScript Date constructor is lenient and converts invalid dates
    // So we test with a clearly invalid string that results in NaN
    expect(dateUtils.isValidDate(new Date('not-a-date-at-all'))).toBe(false);
  });

  it('should reject non-date objects', () => {
    expect(dateUtils.isValidDate('2023-01-01' as any)).toBe(false);
    expect(dateUtils.isValidDate(null as any)).toBe(false);
    expect(dateUtils.isValidDate(undefined as any)).toBe(false);
    expect(dateUtils.isValidDate({} as any)).toBe(false);
  });
});

describe('dateUtils.formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format recent times correctly', () => {
    const now = new Date('2023-10-01T12:00:00.000Z');
    vi.setSystemTime(now);

    // Just now
    expect(dateUtils.formatRelativeTime(new Date('2023-10-01T12:00:00.000Z'))).toBe('just now');
    expect(dateUtils.formatRelativeTime(new Date('2023-10-01T11:59:30.000Z'))).toBe('just now');

    // Minutes ago
    expect(dateUtils.formatRelativeTime(new Date('2023-10-01T11:59:00.000Z'))).toBe('1 minute ago');
    expect(dateUtils.formatRelativeTime(new Date('2023-10-01T11:45:00.000Z'))).toBe(
      '15 minutes ago'
    );

    // Hours ago
    expect(dateUtils.formatRelativeTime(new Date('2023-10-01T11:00:00.000Z'))).toBe('1 hour ago');
    expect(dateUtils.formatRelativeTime(new Date('2023-10-01T08:00:00.000Z'))).toBe('4 hours ago');

    // Days ago
    expect(dateUtils.formatRelativeTime(new Date('2023-09-30T12:00:00.000Z'))).toBe('1 day ago');
    expect(dateUtils.formatRelativeTime(new Date('2023-09-28T12:00:00.000Z'))).toBe('3 days ago');
  });

  it('should handle singular vs plural correctly', () => {
    const now = new Date('2023-10-01T12:00:00.000Z');
    vi.setSystemTime(now);

    expect(dateUtils.formatRelativeTime(new Date('2023-10-01T11:59:00.000Z'))).toBe('1 minute ago');
    expect(dateUtils.formatRelativeTime(new Date('2023-10-01T11:58:00.000Z'))).toBe(
      '2 minutes ago'
    );

    expect(dateUtils.formatRelativeTime(new Date('2023-10-01T11:00:00.000Z'))).toBe('1 hour ago');
    expect(dateUtils.formatRelativeTime(new Date('2023-10-01T10:00:00.000Z'))).toBe('2 hours ago');

    expect(dateUtils.formatRelativeTime(new Date('2023-09-30T12:00:00.000Z'))).toBe('1 day ago');
    expect(dateUtils.formatRelativeTime(new Date('2023-09-29T12:00:00.000Z'))).toBe('2 days ago');
  });
});
