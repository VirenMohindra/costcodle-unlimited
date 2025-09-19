/**
 * Main Application Module
 * Coordinates all modules and initializes the application
 */

import { stateManager } from './state.js';
import { gameInitializer, modalManager } from './game.js';
import { keyboard, domCache } from './dom.js';
import { dateUtils, utils } from './utils.js';
import type {
  AppState,
  GameState,
  UserStats,
  ServiceWorkerStatus
} from '../types/game.js';

/**
 * Application class that manages the entire game lifecycle
 */
class CostcodleApp {
  private initialized = false;
  private modules: {
    stateManager: typeof stateManager;
    gameInitializer: typeof gameInitializer;
    modalManager: typeof modalManager;
    keyboard: typeof keyboard;
    domCache: typeof domCache;
  };

  constructor() {
    this.modules = {
      stateManager,
      gameInitializer,
      modalManager,
      keyboard,
      domCache
    };
  }

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    try {
      // Prevent double initialization
      if (this.initialized) {
        console.warn('App already initialized');
        return;
      }

      console.log('🎮 Initializing Costcodle...');

      // Wait for DOM to be ready
      await this.waitForDOM();

      // Initialize core modules
      await this.initializeModules();

      // Setup global event listeners
      this.setupGlobalListeners();

      // Start the game
      await this.startGame();

      this.initialized = true;
      console.log('✅ Costcodle initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Costcodle:', error);
      this.handleInitializationError(error as Error);
    }
  }

  /**
   * Wait for DOM to be fully loaded
   */
  private waitForDOM(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve());
      } else {
        resolve();
      }
    });
  }

  /**
   * Initialize all required modules
   */
  private async initializeModules(): Promise<void> {
    console.log('🔧 Initializing modules...');

    // Initialize keyboard navigation
    this.modules.keyboard.init();

    // Initialize DOM cache
    this.modules.domCache.refresh();

    // Register service worker
    await this.registerServiceWorker();

    // Setup state change listeners
    this.setupStateListeners();

    console.log('✅ Modules initialized');
  }

  /**
   * Setup state change listeners
   */
  private setupStateListeners(): void {
    // Listen for loading state changes
    stateManager.subscribe('isLoading', (isLoading) => {
      this.handleLoadingStateChange(isLoading);
    });

    // Listen for archive mode changes
    stateManager.subscribe('isArchiveMode', (isArchiveMode) => {
      this.handleArchiveModeChange(isArchiveMode);
    });

    // Listen for game state changes
    stateManager.subscribe('gameState', (newState, oldState) => {
      this.handleGameStateChange(newState, oldState);
    });
  }

  /**
   * Setup global event listeners
   */
  private setupGlobalListeners(): void {
    // Handle window resize
    window.addEventListener('resize', utils.throttle(() => {
      this.handleWindowResize();
    }, 250));

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Handle beforeunload for unsaved changes
    window.addEventListener('beforeunload', (event) => {
      this.handleBeforeUnload(event);
    });

    // Handle online/offline status
    window.addEventListener('online', () => this.handleOnlineStatus(true));
    window.addEventListener('offline', () => this.handleOnlineStatus(false));
  }

  /**
   * Start the main game
   */
  private async startGame(): Promise<void> {
    console.log('🎯 Starting game...');

    try {
      // Update mode indicator
      const isArchiveMode = stateManager.get('isArchiveMode');
      const modeText = this.modules.domCache.get('MODE_TEXT');
      if (modeText) {
        modeText.textContent = isArchiveMode ? 'Archive Mode' : 'Daily Challenge';
      }

      // Initialize and start the game
      await this.modules.gameInitializer.startGame();

      console.log('✅ Game started successfully');

    } catch (error) {
      console.error('❌ Failed to start game:', error);
      throw error;
    }
  }

  /**
   * Handle loading state changes
   */
  private handleLoadingStateChange(isLoading: boolean): void {
    const loadingElements = document.querySelectorAll('.loading-indicator');
    loadingElements.forEach(element => {
      (element as HTMLElement).style.display = isLoading ? 'block' : 'none';
    });

    // Update UI elements
    const button = this.modules.domCache.get('GUESS_BUTTON') as HTMLButtonElement | null;
    const input = this.modules.domCache.get('GUESS_INPUT') as HTMLInputElement | null;

    if (button && input) {
      button.disabled = isLoading;
      input.disabled = isLoading;
      button.textContent = isLoading ? 'Loading...' : 'SUBMIT';
    }
  }

  /**
   * Handle archive mode changes
   */
  private handleArchiveModeChange(isArchiveMode: boolean): void {
    const modeToggle = this.modules.domCache.get('MODE_TOGGLE');
    const modeText = this.modules.domCache.get('MODE_TEXT');
    const modeIndicator = document.querySelector('.mode-indicator') as HTMLElement | null;

    if (modeToggle && modeText && modeIndicator) {
      if (isArchiveMode) {
        modeToggle.classList.add('practice-mode');
        modeText.textContent = 'Archive Mode';
        modeIndicator.textContent = '📅';
      } else {
        modeToggle.classList.remove('practice-mode');
        modeText.textContent = 'Daily Challenge';
        modeIndicator.textContent = '🎯';
      }
    }
  }

  /**
   * Handle game state changes
   */
  private handleGameStateChange(newState: GameState, oldState: GameState): void {
    // Log game progress for analytics (if needed)
    if (newState.guesses.length !== oldState.guesses.length) {
      console.log(`🎯 Guess ${newState.guesses.length}/6:`,
                  newState.guesses[newState.guesses.length - 1]);
    }

    if (newState.hasWon && !oldState.hasWon) {
      console.log('🎉 Game won!');
    }
  }

  /**
   * Handle window resize
   */
  private handleWindowResize(): void {
    // Refresh DOM cache if needed
    this.modules.domCache.refresh();

    // Handle responsive adjustments
    this.adjustForViewport();
  }

  /**
   * Handle page visibility changes
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Page is hidden - pause any ongoing animations or timers
      this.pauseAnimations();
    } else {
      // Page is visible - resume animations or check for updates
      this.resumeAnimations();
      this.checkForUpdates();
    }
  }

  /**
   * Handle before page unload
   */
  private handleBeforeUnload(event: BeforeUnloadEvent): void {
    // Only show warning if game is in progress
    const gameState = stateManager.getGameState();
    if (gameState.guesses.length > 0 && !gameState.hasWon && gameState.guesses.length < 6) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  /**
   * Handle online/offline status
   */
  private handleOnlineStatus(isOnline: boolean): void {
    const statusIndicator = document.querySelector('.connection-status') as HTMLElement | null;
    if (statusIndicator) {
      statusIndicator.textContent = isOnline ? 'Online' : 'Offline';
      statusIndicator.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
    }

    if (!isOnline) {
      console.warn('📶 Application is offline - some features may not work');
    }
  }

  /**
   * Handle initialization errors
   */
  private handleInitializationError(error: Error): void {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'initialization-error';
    errorContainer.innerHTML = `
      <h2>Failed to load Costcodle</h2>
      <p>Something went wrong while initializing the game.</p>
      <button onclick="location.reload()">Try Again</button>
      <details>
        <summary>Error Details</summary>
        <pre>${error.message}</pre>
      </details>
    `;

    document.body.appendChild(errorContainer);
  }

  /**
   * Adjust UI for different viewport sizes
   */
  private adjustForViewport(): void {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Adjust font sizes for mobile
    if (viewport.width < 768) {
      document.documentElement.style.setProperty('--base-font-size', '24px');
    } else {
      document.documentElement.style.setProperty('--base-font-size', '30px');
    }

    // Adjust game container height
    const gameContainer = this.modules.domCache.get('GAME_CONTAINER');
    if (gameContainer && viewport.height < 600) {
      gameContainer.classList.add('compact-mode');
    } else {
      gameContainer?.classList.remove('compact-mode');
    }
  }

  /**
   * Pause animations during page visibility changes
   */
  private pauseAnimations(): void {
    document.querySelectorAll('.animate__animated').forEach(element => {
      (element as HTMLElement).style.animationPlayState = 'paused';
    });
  }

  /**
   * Resume animations
   */
  private resumeAnimations(): void {
    document.querySelectorAll('.animate__animated').forEach(element => {
      (element as HTMLElement).style.animationPlayState = 'running';
    });
  }

  /**
   * Check for updates when page becomes visible
   */
  private checkForUpdates(): void {
    const currentGameNumber = dateUtils.getGameNumber();
    const stateGameNumber = stateManager.get('gameNumber');
    const isArchiveMode = stateManager.get('isArchiveMode');

    // If daily mode and game number changed, suggest refresh
    if (!isArchiveMode && currentGameNumber !== stateGameNumber) {
      this.showUpdateNotification();
    }
  }

  /**
   * Show update notification
   */
  private showUpdateNotification(): void {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <p>🎮 A new Costcodle is available!</p>
      <button onclick="location.reload()">Play Today's Game</button>
      <button onclick="this.parentElement.remove()">Dismiss</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  /**
   * Get application status
   */
  getStatus(): {
    initialized: boolean;
    gameState: GameState;
    userStats: UserStats;
    isArchiveMode: boolean;
    gameNumber: number;
  } {
    return {
      initialized: this.initialized,
      gameState: stateManager.getGameState(),
      userStats: stateManager.getUserStats(),
      isArchiveMode: stateManager.get('isArchiveMode'),
      gameNumber: stateManager.get('gameNumber')
    };
  }

  /**
   * Register service worker for offline functionality
   */
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.showUpdateAvailable();
              }
            });
          }
        });

        console.log('✅ Service Worker registered successfully');

        // Check for updates
        if (registration.active) {
          registration.update();
        }

      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error);
      }
    } else {
      console.warn('⚠️ Service Worker not supported');
    }
  }

  /**
   * Show update available notification
   */
  private showUpdateAvailable(): void {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <p>🚀 New version available!</p>
      <button onclick="location.reload()">Update Now</button>
      <button onclick="this.parentElement.remove()">Later</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 30000);
  }

  /**
   * Get service worker status
   */
  async getServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
    if (!('serviceWorker' in navigator)) {
      return { supported: false };
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        supported: true,
        registered: !!registration,
        active: !!registration?.active,
        waiting: !!registration?.waiting,
        installing: !!registration?.installing
      };
    } catch (error) {
      return {
        supported: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Restart the application
   */
  async restart(): Promise<void> {
    console.log('🔄 Restarting application...');
    this.initialized = false;
    await this.init();
  }
}

// Create and export the main application instance
export const app = new CostcodleApp();

// Initialize when script loads
app.init().catch(error => {
  console.error('Failed to initialize Costcodle:', error);
});

// Export for global access (with proper typing)
declare global {
  interface Window {
    CostcodleApp: CostcodleApp;
  }
}

window.CostcodleApp = app;