/**
 * Game Constants and Configuration
 * Contains all game-related constants and configuration values
 */

import type { GameConfig, CSSCustomProperties } from '../types/game.js';

// Game configuration
export const GAME_CONFIG: GameConfig = {
  TOTAL_GAMES: 3399,
  MAX_GUESSES: 6,
  WIN_THRESHOLD_PERCENT: 5,
  NEAR_THRESHOLD_PERCENT: 25,
  COSTCODLE_START_DATE: new Date('09/21/2023'),

  // UI timing constants
  ANIMATION_DELAY: 100,
  TOAST_DURATION: 3000,
  WARNING_DURATION: 3000,
  SHAKE_DELAY: 100,

  // Price validation limits
  MIN_PRICE: 0.01,
  MAX_PRICE: 10000,
  MAX_DECIMAL_PLACES: 2,

  // Local storage keys
  STORAGE_KEYS: {
    ARCHIVE_MODE: 'archiveMode',
    SELECTED_GAME_NUMBER: 'selectedGameNumber',
    GAME_STATE: 'state',
    USER_STATS: 'stats'
  } as const
} as const;

// DOM element selectors
export const SELECTORS = {
  GUESS_INPUT: 'guess-input',
  GUESS_BUTTON: 'guess-button',
  INFO_BUTTON: 'info-button',
  STAT_BUTTON: 'stat-button',
  TITLE: 'title',
  GAME_CONTAINER: 'game-container',
  IMAGE_CONTAINER: 'image-container',
  PRODUCT_INFO: 'product-info',
  GAME_STATS: 'game-stats',
  SHARE_TOAST: 'share-toast',
  WARNING_TOAST: 'warning-toast',
  INFO_OVERLAY: 'info-overlay',
  STATS_OVERLAY: 'stats-overlay',
  MODE_TOGGLE: 'mode-toggle',
  MODE_TEXT: 'mode-text',
  MODE_INDICATOR: '.mode-indicator',
  INPUT_CONTAINER: 'input-container',
  INFO_CARD: 'info-card'
} as const;

// Game state default values
export const DEFAULT_USER_STATS = {
  numGames: 0,
  numWins: 0,
  winsInNum: [0, 0, 0, 0, 0, 0],
  currentStreak: 0,
  maxStreak: 0
};

export const DEFAULT_GAME_STATE = {
  gameNumber: -1,
  guesses: [],
  hasWon: false
};

// CSS class names
export const CSS_CLASSES = {
  GUESS_STATES: {
    WIN: 'guess-win',
    NEAR: 'guess-near',
    FAR: 'guess-far'
  },
  ANIMATIONS: {
    FLIP_IN: 'animate__flipInX',
    FLIP_OUT: 'animate__flipOutX',
    HEAD_SHAKE: 'animate__headShake'
  },
  VISIBILITY: {
    HIDE: 'hide',
    TRANSPARENT_BG: 'transparent-background'
  },
  MODES: {
    PRACTICE: 'practice-mode',
    INFO_TITLE: 'info-title'
  }
} as const;

// Game direction symbols
export const DIRECTION_SYMBOLS = {
  UP: '&uarr;',
  DOWN: '&darr;',
  CHECK: '&check;'
} as const;

// Share emoji mappings
export const SHARE_EMOJIS = {
  DIRECTIONS: {
    '&uarr;': '⬆️',
    '&darr;': '⬇️',
    '&check;': '✅'
  },
  CLOSENESS: {
    'guess-far': '🟥',
    'guess-near': '🟨'
  }
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_INPUT: 'Input must be a string',
  INVALID_NUMBER: 'Input must contain only numbers and decimal points',
  PRICE_RANGE: `Price must be between $${GAME_CONFIG.MIN_PRICE} and $${GAME_CONFIG.MAX_PRICE.toLocaleString()}`,
  DECIMAL_PLACES: `Price can have at most ${GAME_CONFIG.MAX_DECIMAL_PLACES} decimal places`,
  EMPTY_INPUT: 'Please enter a price',
  GAME_NUMBER_RANGE: 'Game number must be between 1 and {max}',
  NETWORK_ERROR: 'Unable to load game data. Please refresh the page and try again.',
  STORAGE_QUOTA: 'Storage quota exceeded. Some features may not work properly.'
} as const;

// CSS Custom Properties configuration
export const CSS_PROPERTIES: CSSCustomProperties = {
  colors: {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    background: 'var(--color-background)',
    surface: 'var(--color-surface)',
    text: 'var(--color-text)',
    textSecondary: 'var(--color-text-secondary)',
    border: 'var(--color-border)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
    info: 'var(--color-info)',
    focus: 'var(--color-focus)',
    hover: 'var(--color-hover)',
    active: 'var(--color-active)'
  },
  spacing: {
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)',
    '2xl': 'var(--spacing-2xl)',
    '3xl': 'var(--spacing-3xl)'
  },
  typography: {
    fontFamily: 'var(--font-family-primary)',
    fontSizeBase: 'var(--font-size-base)',
    fontSizeSmall: 'var(--font-size-small)',
    fontSizeLarge: 'var(--font-size-large)',
    fontWeightNormal: 'var(--font-weight-normal)',
    fontWeightBold: 'var(--font-weight-bold)',
    lineHeight: 'var(--line-height-base)'
  },
  shadows: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)'
  },
  transitions: {
    fast: 'var(--transition-fast)',
    normal: 'var(--transition-normal)',
    slow: 'var(--transition-slow)'
  }
} as const;

// Type guards
export const isGuessCloseness = (value: string): value is keyof typeof CSS_CLASSES.GUESS_STATES => {
  return Object.values(CSS_CLASSES.GUESS_STATES).includes(value as any);
};

export const isGuessDirection = (value: string): value is keyof typeof DIRECTION_SYMBOLS => {
  return Object.values(DIRECTION_SYMBOLS).includes(value as any);
};

// Utility types for better type safety
export type SelectorKey = keyof typeof SELECTORS;
export type CSSClassKey = keyof typeof CSS_CLASSES;
export type DirectionSymbolKey = keyof typeof DIRECTION_SYMBOLS;
export type ShareEmojiKey = keyof typeof SHARE_EMOJIS;
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;