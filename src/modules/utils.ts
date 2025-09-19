/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

import { GAME_CONFIG, ERROR_MESSAGES } from './constants.js';
import type {
  ValidationResult,
  GameError,
  DeviceCapabilities,
  AnimationOptions
} from '../types/game.js';

/**
 * Safe localStorage operations with error handling
 */
export const storage = {
  get<T = unknown>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) as T : defaultValue;
    } catch (error) {
      console.error(`Failed to read from localStorage (${key}):`, error);
      return defaultValue;
    }
  },

  set(key: string, value: unknown): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to write to localStorage (${key}):`, error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.displayError(ERROR_MESSAGES.STORAGE_QUOTA);
      }
      return false;
    }
  },

  displayError(message: string): void {
    // This will be replaced with proper error display when DOM module is available
    console.error('Storage error:', message);
  }
};

/**
 * HTML sanitization and safe manipulation
 */
export const htmlUtils = {
  escape(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  safeSetInnerHTML(element: HTMLElement | null, htmlString: string): void {
    if (!element) return;

    // For simple text content, use textContent instead
    // But if it contains HTML entities (like &uarr;), use innerHTML
    if (typeof htmlString === 'string' && !htmlString.includes('<') && !htmlString.includes('&')) {
      element.textContent = htmlString;
      return;
    }

    // For trusted HTML content only (like our game UI)
    element.innerHTML = htmlString;
  },

  createElement(tag: string, textContent?: string, className?: string): HTMLElement {
    const element = document.createElement(tag);
    if (textContent) {
      element.textContent = textContent;
    }
    if (className) {
      element.className = className;
    }
    return element;
  }
};

/**
 * Input validation functions
 */
export const validation = {
  validatePriceInput(input: string): ValidationResult {
    if (!input || typeof input !== 'string') {
      return { valid: false, error: ERROR_MESSAGES.INVALID_INPUT };
    }

    // Remove whitespace and currency symbols
    const cleanInput = input.trim().replace(/[$,\s]/g, '');

    // Check if it's a valid number
    if (!/^\d*\.?\d*$/.test(cleanInput)) {
      return { valid: false, error: ERROR_MESSAGES.INVALID_NUMBER };
    }

    const numValue = parseFloat(cleanInput);

    // Check for valid range
    if (isNaN(numValue) || numValue < GAME_CONFIG.MIN_PRICE || numValue > GAME_CONFIG.MAX_PRICE) {
      return { valid: false, error: ERROR_MESSAGES.PRICE_RANGE };
    }

    // Check decimal places
    const decimalMatch = cleanInput.match(/\.(\d+)/);
    if (decimalMatch && decimalMatch[1]!.length > GAME_CONFIG.MAX_DECIMAL_PLACES) {
      return { valid: false, error: ERROR_MESSAGES.DECIMAL_PLACES };
    }

    return {
      valid: true,
      value: numValue,
      formatted: numValue.toFixed(2)
    };
  },

  validateGameNumber(gameNumber: number | string, maxGameNumber: number): ValidationResult {
    const num = typeof gameNumber === 'string' ? parseInt(gameNumber, 10) : gameNumber;

    if (isNaN(num) || num < 1 || num > maxGameNumber) {
      return {
        valid: false,
        error: ERROR_MESSAGES.GAME_NUMBER_RANGE.replace('{max}', maxGameNumber.toString())
      };
    }

    return { valid: true, value: num };
  }
};

/**
 * Date and time utilities
 */
export const dateUtils = {
  getGameNumber(): number {
    const currDate = new Date();
    const timeDifference = currDate.getTime() - GAME_CONFIG.COSTCODLE_START_DATE.getTime();
    const dayDifference = timeDifference / (1000 * 3600 * 24);
    return Math.ceil(dayDifference);
  },

  getDateForGameNumber(gameNum: number): string {
    const startDate = new Date(GAME_CONFIG.COSTCODLE_START_DATE);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + gameNum - 1);

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return targetDate.toLocaleDateString('en-US', options);
  },

  isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  },

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
};

/**
 * Device detection utilities
 */
export const deviceUtils = {
  getCapabilities(): DeviceCapabilities {
    return {
      isMobile: this.isMobile(),
      supportsClipboard: this.supportsClipboard(),
      supportsShare: this.supportsShare(),
      supportsServiceWorker: this.supportsServiceWorker(),
      supportsNotifications: this.supportsNotifications()
    };
  },

  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints != null && navigator.maxTouchPoints > 2);
  },

  supportsClipboard(): boolean {
    return 'clipboard' in navigator && typeof navigator.clipboard?.writeText === 'function';
  },

  supportsShare(): boolean {
    return 'canShare' in navigator && typeof navigator.canShare === 'function';
  },

  supportsServiceWorker(): boolean {
    return 'serviceWorker' in navigator;
  },

  supportsNotifications(): boolean {
    return 'Notification' in window;
  },

  getScreenSize(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  },

  isOnline(): boolean {
    return navigator.onLine;
  }
};

/**
 * Animation utilities
 */
export const animationUtils = {
  addTemporaryClass(
    element: HTMLElement | null,
    className: string,
    duration = 1000
  ): Promise<void> {
    if (!element) return Promise.resolve();

    element.classList.add(className);

    return new Promise(resolve => {
      setTimeout(() => {
        element.classList.remove(className);
        resolve();
      }, duration);
    });
  },

  async animateSequence(
    element: HTMLElement | null,
    inClass: string,
    outClass: string,
    displayDuration = 3000
  ): Promise<void> {
    if (!element) return;

    element.classList.remove('hide');
    element.classList.add(inClass);

    await new Promise<void>(resolve => setTimeout(resolve, displayDuration));

    element.classList.remove(inClass);
    element.classList.add(outClass);

    await new Promise<void>(resolve => setTimeout(resolve, 1000));

    element.classList.remove(outClass);
    element.classList.add('hide');
  },

  fadeIn(element: HTMLElement | null, options: AnimationOptions = {}): Promise<void> {
    return this.animate(element, 'fadeIn', options);
  },

  fadeOut(element: HTMLElement | null, options: AnimationOptions = {}): Promise<void> {
    return this.animate(element, 'fadeOut', options);
  },

  slideIn(element: HTMLElement | null, options: AnimationOptions = {}): Promise<void> {
    return this.animate(element, 'slideIn', options);
  },

  slideOut(element: HTMLElement | null, options: AnimationOptions = {}): Promise<void> {
    return this.animate(element, 'slideOut', options);
  },

  animate(
    element: HTMLElement | null,
    animationName: string,
    options: AnimationOptions = {}
  ): Promise<void> {
    if (!element) return Promise.resolve();

    const {
      duration = 300,
      easing = 'ease-out',
      delay = 0
    } = options;

    return new Promise(resolve => {
      element.style.animationName = animationName;
      element.style.animationDuration = `${duration}ms`;
      element.style.animationTimingFunction = easing;
      element.style.animationDelay = `${delay}ms`;

      const handleAnimationEnd = (): void => {
        element.removeEventListener('animationend', handleAnimationEnd);
        element.style.animation = '';
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd);
    });
  }
};

/**
 * Mathematical utilities
 */
export const mathUtils = {
  calculatePercentDifference(guess: number, target: number): number {
    if (target === 0) return guess === 0 ? 0 : Infinity;
    return ((guess * 100) / (target * 100)) * 100 - 100;
  },

  isWithinPercent(value: number, target: number, percent: number): boolean {
    const difference = Math.abs(this.calculatePercentDifference(value, target));
    return difference <= percent;
  },

  clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  },

  round(value: number, decimals = 0): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },

  randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  },

  formatCurrency(value: number, currency = 'USD', locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(value);
  }
};

/**
 * General utility functions
 */
export const utils = {
  debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>): void => {
      const later = (): void => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle<T extends (...args: unknown[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>): void => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    };
  },

  generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9);
  },

  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as T;
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as T;
    if (typeof obj === 'object') {
      const clonedObj = {} as T;
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
    return obj;
  },

  isEmpty(value: unknown): boolean {
    if (value == null) return true;
    if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

/**
 * Error handling utilities
 */
export const errorUtils = {
  createGameError(message: string, code?: string, context?: Record<string, unknown>): GameError {
    const error = new Error(message) as GameError;
    error.name = 'GameError';
    if (code) error.code = code;
    if (context) error.context = context;
    return error;
  },

  isGameError(error: unknown): error is GameError {
    return error instanceof Error && error.name === 'GameError';
  },

  handleError(error: unknown, context?: string): void {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);

    if (this.isGameError(error)) {
      console.error('Game Error Details:', {
        code: error.code,
        context: error.context
      });
    }
  },

  safeAsync<T>(
    asyncFn: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    return asyncFn().catch((error: unknown) => {
      this.handleError(error, 'safeAsync');
      return fallback;
    });
  }
};