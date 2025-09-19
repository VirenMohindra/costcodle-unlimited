/**
 * DOM Management Module
 * Handles all DOM operations and element caching
 */

import { SELECTORS, CSS_CLASSES, type SelectorKey } from './constants.js';
import { htmlUtils, animationUtils } from './utils.js';
import type { ModalType, ToastType, Guess } from '../types/game.js';

/**
 * DOM element cache for performance optimization
 */
class DOMCache {
  private elements = new Map<string, HTMLElement>();

  constructor() {
    this.cacheElements();
  }

  private cacheElements(): void {
    Object.entries(SELECTORS).forEach(([key, selector]) => {
      const element = selector.startsWith('.')
        ? document.querySelector(selector) as HTMLElement | null
        : document.getElementById(selector);

      if (element) {
        this.elements.set(key, element);
      }
    });
  }

  get(key: SelectorKey): HTMLElement | null {
    return this.elements.get(key) ?? null;
  }

  refresh(key?: SelectorKey): void {
    if (key) {
      const selector = SELECTORS[key];
      const element = selector.startsWith('.')
        ? document.querySelector(selector) as HTMLElement | null
        : document.getElementById(selector);

      if (element) {
        this.elements.set(key, element);
      }
    } else {
      this.cacheElements();
    }
  }
}

// Create global DOM cache instance
export const domCache = new DOMCache();

/**
 * UI Component management
 */
export const ui = {
  // Toast notifications
  async showToast(message: string | null = null, type: ToastType = 'share'): Promise<void> {
    const toastElement = type === 'warning'
      ? domCache.get('WARNING_TOAST')
      : domCache.get('SHARE_TOAST');

    if (!toastElement) return;

    // Update message if provided
    if (message) {
      const textElement = toastElement.querySelector('.toast-text') ||
                         toastElement.querySelector('center');
      if (textElement) {
        textElement.textContent = message;
      }
    }

    await animationUtils.animateSequence(
      toastElement,
      CSS_CLASSES.ANIMATIONS.FLIP_IN,
      CSS_CLASSES.ANIMATIONS.FLIP_OUT,
      3000
    );
  },

  // Loading states
  setLoadingState(isLoading: boolean): void {
    const button = domCache.get('GUESS_BUTTON') as HTMLButtonElement | null;
    const input = domCache.get('GUESS_INPUT') as HTMLInputElement | null;

    if (button && input) {
      if (isLoading) {
        button.disabled = true;
        button.textContent = 'Loading...';
        input.disabled = true;
      } else {
        button.disabled = false;
        button.textContent = 'SUBMIT';
        input.disabled = false;
      }
    }
  },

  // Modal management
  showModal(overlayId: string): void {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');

      // Focus management
      const focusTarget = overlay.querySelector('h2[tabindex="-1"]') as HTMLElement | null;
      if (focusTarget) {
        setTimeout(() => focusTarget.focus(), 100);
      }
    }
  },

  hideModal(overlayId: string): void {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
  },

  // Game stats updates
  updateGameStats(content: string): void {
    const statsElement = domCache.get('GAME_STATS');
    if (statsElement) {
      htmlUtils.safeSetInnerHTML(statsElement, content);
    }
  },

  // Product card display
  displayProductCard(productName: string, productImage: string): void {
    const imageContainer = domCache.get('IMAGE_CONTAINER');
    const productInfo = domCache.get('PRODUCT_INFO');

    if (imageContainer && productInfo) {
      // Clear existing content
      imageContainer.innerHTML = '';
      productInfo.innerHTML = '';

      // Create and add image
      const productImageElement = htmlUtils.createElement('img') as HTMLImageElement;
      productImageElement.src = productImage;
      productImageElement.id = 'product-image';
      productImageElement.alt = `${productName} - Costco product image`;
      productImageElement.setAttribute('role', 'img');
      imageContainer.appendChild(productImageElement);

      // Create and add product name
      const centerDiv = htmlUtils.createElement('center');
      centerDiv.textContent = productName;
      productInfo.appendChild(centerDiv);
    }
  },

  // Share button creation
  createShareButton(clickHandler: () => void): void {
    const inputContainer = domCache.get('INPUT_CONTAINER');
    if (!inputContainer) return;

    const shareButton = htmlUtils.createElement('button');
    shareButton.id = 'share-button';
    shareButton.innerHTML = `Share <img src="./assets/share-icon.svg" class="share-icon" />`;
    shareButton.addEventListener('click', clickHandler);

    inputContainer.innerHTML = '';
    inputContainer.appendChild(shareButton);
  },

  // Shake animation
  async shakeInfoCard(): Promise<void> {
    const infoCard = domCache.get('INFO_CARD');
    if (infoCard) {
      await animationUtils.addTemporaryClass(
        infoCard,
        CSS_CLASSES.ANIMATIONS.HEAD_SHAKE,
        1000
      );
    }
  },

  // Mode indicator updates
  updateModeIndicator(isArchiveMode: boolean): void {
    const modeToggle = domCache.get('MODE_TOGGLE');
    const modeText = domCache.get('MODE_TEXT');
    const modeIndicator = document.querySelector(SELECTORS.MODE_INDICATOR) as HTMLElement | null;

    if (modeToggle && modeText && modeIndicator) {
      if (isArchiveMode) {
        modeToggle.classList.add(CSS_CLASSES.MODES.PRACTICE);
        modeText.textContent = 'Archive Mode';
        modeIndicator.textContent = '📅';
      } else {
        modeToggle.classList.remove(CSS_CLASSES.MODES.PRACTICE);
        modeText.textContent = 'Daily Challenge';
        modeIndicator.textContent = '🎯';
      }
    }
  },

  // Error display
  displayError(message: string): void {
    const gameContainer = domCache.get('GAME_CONTAINER');
    if (gameContainer) {
      gameContainer.innerHTML = `
        <div class="error-container">
          <h2>Oops! Something went wrong</h2>
          <p>${htmlUtils.escape(message)}</p>
          <button onclick="location.reload()" class="retry-button">Try Again</button>
        </div>
      `;
    }
  }
};

/**
 * Guess display management
 */
export const guessDisplay = {
  displayGuess(guess: Guess, index?: number, gameStateLength?: number): void {
    const guessIndex = index ?? gameStateLength ?? 0;
    const guessContainer = document.getElementById(guessIndex.toString());

    if (!guessContainer) return;

    const guessValueContainer = htmlUtils.createElement('div', '',
      `guess-value-container ${CSS_CLASSES.ANIMATIONS.FLIP_IN}`);
    const infoContainer = htmlUtils.createElement('div', '',
      `guess-direction-container ${CSS_CLASSES.ANIMATIONS.FLIP_IN}`);

    guessValueContainer.textContent = `$${guess.guess}`;
    infoContainer.classList.add(guess.closeness);
    htmlUtils.safeSetInnerHTML(infoContainer, guess.direction);

    guessContainer.classList.add(CSS_CLASSES.ANIMATIONS.FLIP_OUT);

    setTimeout(() => {
      guessContainer.classList.add(CSS_CLASSES.VISIBILITY.TRANSPARENT_BG);
      guessContainer.appendChild(guessValueContainer);
      guessContainer.appendChild(infoContainer);
    }, 500);
  }
};

/**
 * Keyboard navigation handler
 */
export const keyboard = {
  init(): void {
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
  },

  handleKeyPress(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.handleEscape();
        break;
      case 'Enter':
        this.handleEnter(event);
        break;
      case 'Tab':
        this.handleTab(event);
        break;
    }
  },

  handleEscape(): void {
    const infoOverlay = domCache.get('INFO_OVERLAY');
    const statsOverlay = domCache.get('STATS_OVERLAY');

    if (infoOverlay && infoOverlay.style.display === 'flex') {
      this.closeModal('info');
    } else if (statsOverlay && statsOverlay.style.display === 'flex') {
      this.closeModal('stats');
    }
  },

  handleEnter(event: KeyboardEvent): void {
    // Handle Enter key on focused elements
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement && activeElement.tagName === 'BUTTON') {
      event.preventDefault();
      (activeElement as HTMLButtonElement).click();
    }
  },

  handleTab(event: KeyboardEvent): void {
    // Enhanced tab navigation within modals
    const openModal = document.querySelector('.overlay[style*="flex"]') as HTMLElement | null;
    if (openModal) {
      this.trapTabInModal(event, openModal);
    }
  },

  trapTabInModal(event: KeyboardEvent, modal: HTMLElement): void {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) return;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  },

  closeModal(type: ModalType): void {
    const button = type === 'info'
      ? domCache.get('INFO_BUTTON')
      : domCache.get('STAT_BUTTON');

    if (button) {
      // Simulate click to trigger existing close logic
      (button as HTMLButtonElement).click();
    }
  }
};