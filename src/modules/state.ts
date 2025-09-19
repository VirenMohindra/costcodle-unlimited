/**
 * State Management Module
 * Handles all application state and persistence
 */

import { GAME_CONFIG, DEFAULT_USER_STATS, DEFAULT_GAME_STATE } from './constants.js';
import { storage, dateUtils } from './utils.js';
import type {
  AppState,
  GameState,
  UserStats,
  Guess,
  StateSubscriber,
  StateManager as IStateManager
} from '../types/game.js';

/**
 * Reactive State Manager
 */
class StateManager implements IStateManager {
  private state: AppState;
  private subscribers = new Map<keyof AppState, StateSubscriber<unknown>[]>();

  constructor() {
    this.state = {
      // Game configuration
      isArchiveMode: false,
      selectedGameNumber: 1,
      gameNumber: 1,

      // Current game data
      productName: '',
      productPrice: 0,
      productImage: '',

      // Game state
      gameState: { ...DEFAULT_GAME_STATE } as GameState,
      userStats: { ...DEFAULT_USER_STATS } as UserStats,

      // UI state
      isLoading: false,
      currentModal: null,
      previousFocus: null
    };

    this.init();
  }

  private init(): void {
    this.loadFromStorage();
    this.calculateGameNumber();
  }

  private loadFromStorage(): void {
    // Load archive mode
    const archiveModeValue = storage.get(GAME_CONFIG.STORAGE_KEYS.ARCHIVE_MODE, false);
    this.state.isArchiveMode = typeof archiveModeValue === 'string' ? archiveModeValue === "true" : Boolean(archiveModeValue);

    // Load selected game number
    this.state.selectedGameNumber = parseInt(
      storage.get(GAME_CONFIG.STORAGE_KEYS.SELECTED_GAME_NUMBER, "1") as string
    ) || 1;

    // Load game state
    const savedGameState = storage.get(GAME_CONFIG.STORAGE_KEYS.GAME_STATE, {}) as Partial<GameState>;
    this.state.gameState = {
      gameNumber: savedGameState.gameNumber ?? DEFAULT_GAME_STATE.gameNumber,
      guesses: savedGameState.guesses ?? [],
      hasWon: savedGameState.hasWon ?? DEFAULT_GAME_STATE.hasWon
    };

    // Load user stats
    const savedUserStats = storage.get(GAME_CONFIG.STORAGE_KEYS.USER_STATS, {}) as Partial<UserStats>;
    this.state.userStats = {
      numGames: savedUserStats.numGames ?? DEFAULT_USER_STATS.numGames,
      numWins: savedUserStats.numWins ?? DEFAULT_USER_STATS.numWins,
      winsInNum: savedUserStats.winsInNum ?? [...DEFAULT_USER_STATS.winsInNum],
      currentStreak: savedUserStats.currentStreak ?? DEFAULT_USER_STATS.currentStreak,
      maxStreak: savedUserStats.maxStreak ?? DEFAULT_USER_STATS.maxStreak
    };
  }

  private calculateGameNumber(): void {
    this.state.gameNumber = this.state.isArchiveMode
      ? this.state.selectedGameNumber
      : dateUtils.getGameNumber();
  }

  // State subscription system
  subscribe<K extends keyof AppState>(key: K, callback: StateSubscriber<AppState[K]>): void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    this.subscribers.get(key)!.push(callback as StateSubscriber<unknown>);
  }

  unsubscribe<K extends keyof AppState>(key: K, callback: StateSubscriber<AppState[K]>): void {
    if (this.subscribers.has(key)) {
      const callbacks = this.subscribers.get(key)!;
      const index = callbacks.indexOf(callback as StateSubscriber<unknown>);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notify<K extends keyof AppState>(key: K, newValue: AppState[K], oldValue?: AppState[K]): void {
    if (this.subscribers.has(key)) {
      this.subscribers.get(key)!.forEach(callback => {
        (callback as StateSubscriber<AppState[K]>)(newValue, oldValue!);
      });
    }
  }

  // State getters
  get<K extends keyof AppState>(key: K): AppState[K] {
    return this.state[key];
  }

  getGameState(): GameState {
    return this.state.gameState;
  }

  getUserStats(): UserStats {
    return this.state.userStats;
  }

  // State setters with change notification
  set<K extends keyof AppState>(key: K, value: AppState[K]): void {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.notify(key, value, oldValue);
  }

  updateGameState(updates: Partial<GameState>): void {
    const oldState = { ...this.state.gameState };
    this.state.gameState = { ...this.state.gameState, ...updates };
    this.persist('gameState');
    this.notify('gameState', this.state.gameState, oldState);
  }

  updateUserStats(updates: Partial<UserStats>): void {
    const oldStats = { ...this.state.userStats };
    this.state.userStats = { ...this.state.userStats, ...updates };
    this.persist('userStats');
    this.notify('userStats', this.state.userStats, oldStats);
  }

  // Persistence methods
  private persist(key: 'gameState' | 'userStats' | 'archiveMode' | 'selectedGameNumber'): void {
    switch (key) {
      case 'gameState':
        storage.set(GAME_CONFIG.STORAGE_KEYS.GAME_STATE, this.state.gameState);
        break;
      case 'userStats':
        storage.set(GAME_CONFIG.STORAGE_KEYS.USER_STATS, this.state.userStats);
        break;
      case 'archiveMode':
        storage.set(GAME_CONFIG.STORAGE_KEYS.ARCHIVE_MODE, this.state.isArchiveMode);
        break;
      case 'selectedGameNumber':
        storage.set(GAME_CONFIG.STORAGE_KEYS.SELECTED_GAME_NUMBER, this.state.selectedGameNumber);
        break;
    }
  }

  // Game mode management
  toggleArchiveMode(): void {
    const wasArchiveMode = this.state.isArchiveMode;
    this.state.isArchiveMode = !this.state.isArchiveMode;

    if (this.state.isArchiveMode) {
      // Entering archive mode
      this.state.gameNumber = this.state.selectedGameNumber;
    } else {
      // Entering daily mode
      this.state.gameNumber = dateUtils.getGameNumber();
    }

    this.persist('archiveMode');
    this.notify('isArchiveMode', this.state.isArchiveMode, wasArchiveMode);
    this.notify('gameNumber', this.state.gameNumber);
  }

  setSelectedGameNumber(gameNumber: number): void {
    const oldNumber = this.state.selectedGameNumber;
    this.state.selectedGameNumber = gameNumber;

    if (this.state.isArchiveMode) {
      this.state.gameNumber = gameNumber;
    }

    this.persist('selectedGameNumber');
    this.notify('selectedGameNumber', gameNumber, oldNumber);
    this.notify('gameNumber', this.state.gameNumber);
  }

  // Game initialization
  initializeGame(): void {
    // Reset game state for new game if needed
    if (this.state.isArchiveMode) {
      // Always reset for archive mode when switching games
      this.updateGameState({
        gameNumber: this.state.gameNumber,
        guesses: [],
        hasWon: false
      });
    } else {
      // Daily mode logic
      if (this.state.gameState.gameNumber !== this.state.gameNumber) {
        if (this.state.gameState.hasWon === false) {
          this.updateUserStats({ currentStreak: 0 });
        }

        this.updateGameState({
          gameNumber: this.state.gameNumber,
          guesses: [],
          hasWon: false
        });

        this.updateUserStats({
          numGames: this.state.userStats.numGames + 1
        });
      }
    }
  }

  // Game actions
  addGuess(guess: Guess): void {
    const newGuesses = [...this.state.gameState.guesses, guess];
    this.updateGameState({ guesses: newGuesses });
  }

  setGameWon(): void {
    this.updateGameState({ hasWon: true });

    if (!this.state.isArchiveMode) {
      // Only update stats in daily mode
      const newWinsInNum = [...this.state.userStats.winsInNum];
      const guessIndex = this.state.gameState.guesses.length - 1;
      if (guessIndex >= 0 && guessIndex < newWinsInNum.length) {
        newWinsInNum[guessIndex] = (newWinsInNum[guessIndex] || 0) + 1;
      }

      const newCurrentStreak = this.state.userStats.currentStreak + 1;
      const newMaxStreak = Math.max(newCurrentStreak, this.state.userStats.maxStreak);

      this.updateUserStats({
        numWins: this.state.userStats.numWins + 1,
        currentStreak: newCurrentStreak,
        maxStreak: newMaxStreak,
        winsInNum: newWinsInNum
      });
    }
  }

  setGameLost(): void {
    if (!this.state.isArchiveMode) {
      // Only update stats in daily mode
      this.updateUserStats({ currentStreak: 0 });
    }
  }

  // UI state management
  setLoading(isLoading: boolean): void {
    this.set('isLoading', isLoading);
  }

  setCurrentModal(modalId: string | null): void {
    this.set('currentModal', modalId);
  }

  setPreviousFocus(element: HTMLElement | null): void {
    this.set('previousFocus', element);
  }

  // Product data
  setProductData(name: string, price: number, image: string): void {
    this.set('productName', name);
    this.set('productPrice', price);
    this.set('productImage', image);
  }

  // Computed properties
  get canGuess(): boolean {
    return this.state.gameState.guesses.length < GAME_CONFIG.MAX_GUESSES &&
           !this.state.gameState.hasWon;
  }

  get gameComplete(): boolean {
    return this.state.gameState.hasWon ||
           this.state.gameState.guesses.length >= GAME_CONFIG.MAX_GUESSES;
  }

  get winPercentage(): number {
    if (this.state.userStats.numGames === 0) return 0;
    return Math.round((this.state.userStats.numWins / this.state.userStats.numGames) * 100);
  }
}

// Create and export global state manager instance
export const stateManager = new StateManager();

// Export convenient getters
export const getState = (): AppState => stateManager.get as unknown as AppState;
export const getGameState = (): GameState => stateManager.getGameState();
export const getUserStats = (): UserStats => stateManager.getUserStats();