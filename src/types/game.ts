/**
 * Type definitions for Costcodle game
 */

// Game configuration types
export interface GameConfig {
  readonly TOTAL_GAMES: number;
  readonly MAX_GUESSES: number;
  readonly WIN_THRESHOLD_PERCENT: number;
  readonly NEAR_THRESHOLD_PERCENT: number;
  readonly COSTCODLE_START_DATE: Date;
  readonly ANIMATION_DELAY: number;
  readonly TOAST_DURATION: number;
  readonly WARNING_DURATION: number;
  readonly SHAKE_DELAY: number;
  readonly MIN_PRICE: number;
  readonly MAX_PRICE: number;
  readonly MAX_DECIMAL_PLACES: number;
  readonly STORAGE_KEYS: {
    readonly ARCHIVE_MODE: string;
    readonly SELECTED_GAME_NUMBER: string;
    readonly GAME_STATE: string;
    readonly USER_STATS: string;
  };
}

// Game state types
export interface GameState {
  gameNumber: number;
  guesses: Guess[];
  hasWon: boolean;
}

export interface UserStats {
  numGames: number;
  numWins: number;
  winsInNum: number[];
  currentStreak: number;
  maxStreak: number;
}

export interface Guess {
  guess: number;
  closeness: GuessCloseness;
  direction: GuessDirection;
}

export type GuessCloseness = 'guess-win' | 'guess-near' | 'guess-far';
export type GuessDirection = '&uarr;' | '&darr;' | '&check;';

// Product data types
export interface ProductData {
  name: string;
  price: string;
  image: string;
}

export interface ProcessedProductData {
  name: string;
  price: number;
  image: string;
}

export interface GameData {
  [key: string]: ProductData;
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  error?: string;
  value?: number;
  formatted?: string;
}

// Application state types
export interface AppState {
  isArchiveMode: boolean;
  selectedGameNumber: number;
  gameNumber: number;
  productName: string;
  productPrice: number;
  productImage: string;
  gameState: GameState;
  userStats: UserStats;
  isLoading: boolean;
  currentModal: string | null;
  previousFocus: HTMLElement | null;
}

// DOM types
export interface DOMElements {
  [key: string]: HTMLElement | null;
}

// Event types
export interface GameEvents {
  stateChange: (newState: AppState, oldState: AppState) => void;
  gameWon: (guesses: number) => void;
  gameLost: () => void;
  guessAdded: (guess: Guess) => void;
  modeChanged: (isArchiveMode: boolean) => void;
}

// Service Worker types
export interface ServiceWorkerStatus {
  supported: boolean;
  registered?: boolean;
  active?: boolean;
  waiting?: boolean;
  installing?: boolean;
  error?: string;
}

export interface CacheStatus {
  caches: Record<string, number>;
  version: string;
  timestamp: string;
}

// Animation types
export interface AnimationOptions {
  duration?: number;
  easing?: string;
  delay?: number;
}

// Toast types
export type ToastType = 'share' | 'warning' | 'error' | 'success';

export interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
  persistent?: boolean;
}

// Modal types
export type ModalType = 'info' | 'stats';

export interface ModalOptions {
  type: ModalType;
  title?: string;
  content?: string;
  closable?: boolean;
}

// Utility types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

// Error types
export interface GameError extends Error {
  code?: string;
  context?: Record<string, unknown>;
}

// Archive navigation types
export interface ArchiveNavigationOptions {
  gameNumber: number;
  maxGameNumber: number;
  onNavigate?: (gameNumber: number) => void;
}

// Share types
export interface ShareData {
  title: string;
  text: string;
  url: string;
}

export interface ShareOptions {
  gameTitle: string;
  result: string;
  guesses: Guess[];
  url: string;
}

// Device detection types
export interface DeviceCapabilities {
  isMobile: boolean;
  supportsClipboard: boolean;
  supportsShare: boolean;
  supportsServiceWorker: boolean;
  supportsNotifications: boolean;
}

// Component types
export interface ComponentOptions {
  element: HTMLElement;
  props?: Record<string, unknown>;
  children?: ComponentOptions[];
}

// Game mechanics types
export interface GameMechanicsOptions {
  winThreshold: number;
  nearThreshold: number;
  maxGuesses: number;
}

// State manager types
export type StateSubscriber<T = unknown> = (newValue: T, oldValue: T) => void;

export interface StateManager {
  get<K extends keyof AppState>(key: K): AppState[K];
  set<K extends keyof AppState>(key: K, value: AppState[K]): void;
  subscribe<K extends keyof AppState>(key: K, callback: StateSubscriber<AppState[K]>): void;
  unsubscribe<K extends keyof AppState>(key: K, callback: StateSubscriber<AppState[K]>): void;
}

// CSS Custom Properties types
export interface CSSCustomProperties {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: Record<string, string>;
  shadows: Record<string, string>;
  transitions: Record<string, string>;
}

// Build and deployment types
export interface BuildConfig {
  outDir: string;
  sourceDir: string;
  assetsDir: string[];
  environment: 'development' | 'production';
}

export interface DeploymentConfig {
  platform: 'github-pages' | 'netlify' | 'vercel';
  buildCommand: string;
  outputDir: string;
  customDomain?: string;
}

// Performance monitoring types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  cacheHitRate: number;
  errorRate: number;
}
