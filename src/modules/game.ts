/**
 * Game Logic Module
 * Handles core game mechanics and business logic
 */

import { GAME_CONFIG, CSS_CLASSES, DIRECTION_SYMBOLS, ERROR_MESSAGES } from './constants.js';
import { validation, mathUtils, dateUtils, deviceUtils, htmlUtils } from './utils.js';
import { stateManager } from './state.js';
import { ui, guessDisplay } from './dom.js';
import type {
  ProcessedProductData,
  Guess,
  GuessCloseness,
  GuessDirection
} from '../types/game.js';

/**
 * Game Data Management
 */
export const gameData = {
  async fetchGameData(gameNumber: number): Promise<ProcessedProductData> {
    try {
      stateManager.setLoading(true);

      const response = await fetch('./games.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = (await response.json()) as Record<string, unknown>;
      const gameKey = `game-${gameNumber}`;
      const gameData = json[gameKey] as Record<string, unknown>;

      if (!gameData) {
        throw new Error(`Game data not found for game ${gameNumber}`);
      }

      if (!gameData.name || !gameData.price || !gameData.image) {
        throw new Error(`Invalid game data structure for game ${gameNumber}`);
      }

      // Validate and parse price
      if (typeof gameData.price !== 'string' || !gameData.price.startsWith('$')) {
        throw new Error(`Invalid price format: ${gameData.price}`);
      }

      const priceNumber = Number(gameData.price.slice(1));
      if (isNaN(priceNumber) || priceNumber <= 0) {
        throw new Error(`Invalid price value: ${gameData.price}`);
      }

      // Update state with validated data
      stateManager.setProductData(gameData.name as string, priceNumber, gameData.image as string);

      return {
        name: gameData.name as string,
        price: priceNumber,
        image: gameData.image as string
      };
    } catch (error) {
      console.error('Failed to load game data:', error);
      ui.displayError(ERROR_MESSAGES.NETWORK_ERROR);
      throw error;
    } finally {
      stateManager.setLoading(false);
    }
  }
};

/**
 * Game Mechanics
 */
export const gameMechanics = {
  processGuess(userInput: string): boolean {
    // Validate input
    if (!userInput) {
      ui.showToast(ERROR_MESSAGES.EMPTY_INPUT, 'warning');
      return false;
    }

    const validation_result = validation.validatePriceInput(userInput);
    if (!validation_result.valid) {
      ui.showToast(validation_result.error!, 'warning');
      return false;
    }

    // Check if game can accept more guesses
    if (!stateManager.canGuess) {
      return false;
    }

    // Process the guess
    const guess = this.createGuessObject(validation_result.value!);
    stateManager.addGuess(guess);

    // Display the guess
    const gameState = stateManager.getGameState();
    guessDisplay.displayGuess(guess, undefined, gameState.guesses.length);

    // Check win/lose conditions
    if (guess.closeness === CSS_CLASSES.GUESS_STATES.WIN) {
      this.handleGameWon();
    } else if (gameState.guesses.length >= GAME_CONFIG.MAX_GUESSES) {
      this.handleGameLost();
    } else {
      // Show shake animation for incorrect guess
      ui.shakeInfoCard();
    }

    // Update game stats after win/lose state is set
    this.updateGameStats();

    return true;
  },

  createGuessObject(guessValue: number): Guess {
    const productPrice = stateManager.get('productPrice');
    const percentAway = mathUtils.calculatePercentDifference(guessValue, productPrice);

    let closeness: GuessCloseness;
    let direction: GuessDirection;

    // Determine closeness
    if (Math.abs(percentAway) <= GAME_CONFIG.WIN_THRESHOLD_PERCENT) {
      closeness = CSS_CLASSES.GUESS_STATES.WIN;
    } else if (Math.abs(percentAway) <= GAME_CONFIG.NEAR_THRESHOLD_PERCENT) {
      closeness = CSS_CLASSES.GUESS_STATES.NEAR;
    } else {
      closeness = CSS_CLASSES.GUESS_STATES.FAR;
    }

    // Determine direction
    if (closeness === CSS_CLASSES.GUESS_STATES.WIN) {
      direction = DIRECTION_SYMBOLS.CHECK;
    } else if (percentAway < 0) {
      direction = DIRECTION_SYMBOLS.UP;
    } else {
      direction = DIRECTION_SYMBOLS.DOWN;
    }

    return {
      guess: guessValue,
      closeness,
      direction
    };
  },

  updateGameStats(): void {
    const gameState = stateManager.getGameState();
    const productPrice = stateManager.get('productPrice');
    const isArchiveMode = stateManager.get('isArchiveMode');
    const selectedGameNumber = stateManager.get('selectedGameNumber');

    let content = '';

    if (gameState.hasWon) {
      content = `<center>You win! Congratulations!🎉</center>`;
      content += `<center>The price was $${productPrice}</center>`;
      if (isArchiveMode) {
        const gameDate = dateUtils.getDateForGameNumber(selectedGameNumber);
        content += `<center>Game #${selectedGameNumber} (${gameDate})</center>`;
      }
    } else if (gameState.guesses.length === GAME_CONFIG.MAX_GUESSES) {
      content = `<center>Better luck next time!</center>`;
      content += `<center>The price was $${productPrice}</center>`;
      if (isArchiveMode) {
        const gameDate = dateUtils.getDateForGameNumber(selectedGameNumber);
        content += `<center>Game #${selectedGameNumber} (${gameDate})</center>`;
      }
    } else {
      if (isArchiveMode) {
        const gameDate = dateUtils.getDateForGameNumber(selectedGameNumber);
        content = `Game #${selectedGameNumber} (${gameDate})<br>Guess: ${gameState.guesses.length + 1}/${GAME_CONFIG.MAX_GUESSES}`;
      } else {
        content = `Guess: ${gameState.guesses.length + 1}/${GAME_CONFIG.MAX_GUESSES}`;
      }
    }

    ui.updateGameStats(content);
  },

  handleGameWon(): void {
    stateManager.setGameWon();
    this.endGame();
  },

  handleGameLost(): void {
    stateManager.setGameLost();
    this.endGame();
  },

  endGame(): void {
    // Remove input event listeners and convert to share button
    this.removeEventListeners();
    ui.createShareButton(() => shareManager.copyStats());
  },

  removeEventListeners(): void {
    const button = document.getElementById('guess-button') as HTMLButtonElement | null;
    const input = document.getElementById('guess-input') as HTMLInputElement | null;

    if (button && input) {
      button.disabled = true;
      button.classList.remove('active');
      input.disabled = true;
      input.placeholder = 'Game Over!';
    }
  }
};

/**
 * Game Initialization
 */
export const gameInitializer = {
  inputKeyHandler: null as ((_event: KeyboardEvent) => void) | null,

  async startGame(): Promise<void> {
    try {
      const isArchiveMode = stateManager.get('isArchiveMode');
      const selectedGameNumber = stateManager.get('selectedGameNumber');
      const gameNumber = isArchiveMode ? selectedGameNumber : dateUtils.getGameNumber();

      // Fetch game data
      await gameData.fetchGameData(gameNumber);

      // Initialize game state
      stateManager.initializeGame();

      // Display game
      this.displayGame();

      // Setup event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  },

  displayGame(): void {
    const productName = stateManager.get('productName');
    const productImage = stateManager.get('productImage');
    const isArchiveMode = stateManager.get('isArchiveMode');

    // Display product card
    ui.displayProductCard(productName, productImage);

    // Update game board with existing guesses
    this.updateGameBoard();

    // Setup input or share button based on game state
    if (stateManager.canGuess) {
      this.addEventListeners();
    } else {
      ui.createShareButton(() => shareManager.copyStats());
    }

    // Update mode indicator
    ui.updateModeIndicator(isArchiveMode);

    // Add archive navigation if needed
    if (isArchiveMode) {
      this.addArchiveNavigation();
    }
  },

  updateGameBoard(): void {
    const gameState = stateManager.getGameState();

    // Update stats
    gameMechanics.updateGameStats();

    // Display existing guesses
    gameState.guesses.forEach((guess, index) => {
      guessDisplay.displayGuess(guess, index + 1);
    });
  },

  setupEventListeners(): void {
    this.addEventListeners();
    this.addModeToggleListener();
    this.addModalListeners();
  },

  addEventListeners(): void {
    const input = document.getElementById('guess-input') as HTMLInputElement | null;
    const button = document.getElementById('guess-button') as HTMLButtonElement | null;

    if (input && button) {
      const handleInput = (): void => {
        const success = gameMechanics.processGuess(input.value.trim());
        if (success) {
          input.value = '';
        }
      };

      // Remove existing listeners
      if (this.inputKeyHandler) {
        input.removeEventListener('keydown', this.inputKeyHandler);
      }
      button.removeEventListener('click', handleInput);

      // Add new listeners
      this.inputKeyHandler = (event: KeyboardEvent): void => {
        if (event.key === 'Enter') {
          handleInput();
        }
      };

      input.addEventListener('keydown', this.inputKeyHandler);
      button.addEventListener('click', handleInput);

      // Focus management
      input.addEventListener('focus', () => {
        input.placeholder = '0.00';
      });
      input.addEventListener('blur', () => {
        input.placeholder = 'Enter a guess...';
      });
    }
  },

  addModeToggleListener(): void {
    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) {
      modeToggle.addEventListener('click', () => this.toggleMode());
    }
  },

  addModalListeners(): void {
    const infoButton = document.getElementById('info-button');
    const statButton = document.getElementById('stat-button');
    const calendarButton = document.getElementById('calendar-button');

    if (infoButton) {
      infoButton.addEventListener('click', event => modalManager.handleModalToggle(event));
    }
    if (statButton) {
      statButton.addEventListener('click', event => modalManager.handleModalToggle(event));
    }
    if (calendarButton) {
      calendarButton.addEventListener('click', event => modalManager.handleModalToggle(event));
    }
  },

  toggleMode(): void {
    stateManager.toggleArchiveMode();
    ui.updateModeIndicator(stateManager.get('isArchiveMode'));

    // Reload to reset game state
    location.reload();
  },

  addArchiveNavigation(): void {
    const navContainer = document.getElementById('archive-nav');

    if (!navContainer) {
      // Create navigation container if it doesn't exist
      const container = htmlUtils.createElement('div');
      container.id = 'archive-nav';
      container.className = 'practice-navigation';

      const selectedGameNumber = stateManager.get('selectedGameNumber');
      const todayGameNumber = dateUtils.getGameNumber();

      const prevBtn = htmlUtils.createElement(
        'button',
        '← Previous Day',
        'practice-nav-btn'
      ) as HTMLButtonElement;
      prevBtn.onclick = () => this.navigateArchiveGame(-1);
      prevBtn.disabled = selectedGameNumber <= 1;

      const gameInfo = htmlUtils.createElement('span', '', 'practice-game-info');
      const gameDate = dateUtils.getDateForGameNumber(selectedGameNumber);
      gameInfo.textContent = gameDate;

      const nextBtn = htmlUtils.createElement(
        'button',
        'Next Day →',
        'practice-nav-btn'
      ) as HTMLButtonElement;
      nextBtn.onclick = () => this.navigateArchiveGame(1);
      nextBtn.disabled = selectedGameNumber >= todayGameNumber;

      const todayBtn = htmlUtils.createElement(
        'button',
        '📅 Today',
        'practice-nav-btn random-btn'
      ) as HTMLButtonElement;
      todayBtn.onclick = () => this.navigateToToday();

      container.appendChild(prevBtn);
      container.appendChild(gameInfo);
      container.appendChild(nextBtn);
      container.appendChild(todayBtn);

      const gameContainer = document.getElementById('game-container');
      if (gameContainer && gameContainer.firstChild) {
        gameContainer.insertBefore(container, gameContainer.firstChild.nextSibling);
      }
    }
  },

  navigateArchiveGame(direction: number): void {
    const currentGameNumber = stateManager.get('selectedGameNumber');
    const newGameNumber = currentGameNumber + direction;
    const maxGameNumber = dateUtils.getGameNumber();

    const validationResult = validation.validateGameNumber(newGameNumber, maxGameNumber);
    if (validationResult.valid && validationResult.value) {
      stateManager.setSelectedGameNumber(validationResult.value);
      location.reload();
    }
  },

  navigateToToday(): void {
    const todayGameNumber = dateUtils.getGameNumber();
    stateManager.setSelectedGameNumber(todayGameNumber);
    location.reload();
  }
};

/**
 * Modal Management
 */
export const modalManager = {
  previousFocus: null as HTMLElement | null,

  handleModalToggle(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    const overlayId = target.dataset.overlay;
    const overlay = document.getElementById(overlayId!);

    if (!overlay) return;

    if (overlay.style.display === 'flex') {
      this.closeModal(overlay);
    } else {
      this.openModal(overlay, overlayId!);
    }
  },

  openModal(overlay: HTMLElement, overlayId: string): void {
    // Store previous focus
    this.previousFocus = document.activeElement as HTMLElement;

    // Close other modals
    this.closeAllModals();

    // Show modal
    ui.showModal(overlayId);

    // Render content based on modal type
    if (overlayId === 'info-overlay') {
      this.renderInfoModal();
    } else if (overlayId === 'stats-overlay') {
      this.renderStatsModal();
    } else if (overlayId === 'calendar-overlay') {
      this.renderCalendarModal();
    }
  },

  closeModal(overlay: HTMLElement): void {
    ui.hideModal(overlay.id);

    // Restore focus
    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }

    // Reset title
    const title = document.getElementById('title');
    if (title) {
      title.innerHTML = `COSTCO<span class="costco-blue">DLE</span>`;
      title.classList.remove('info-title');
    }
  },

  closeAllModals(): void {
    const modals = document.querySelectorAll('.overlay');
    modals.forEach(modal => {
      (modal as HTMLElement).style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    });
  },

  renderInfoModal(): void {
    const title = document.getElementById('title');
    if (title) {
      title.innerHTML = `HOW TO <span class="costco-blue">PLAY</span>`;
      title.classList.add('info-title');
    }
  },

  renderStatsModal(): void {
    const title = document.getElementById('title');
    if (title) {
      title.innerHTML = `GAME <span class="costco-blue">STATS</span>`;
    }

    this.renderStatistics();
    this.renderGraphDistribution();
  },

  renderStatistics(): void {
    const userStats = stateManager.getUserStats();
    const winPercentage = stateManager.winPercentage;

    const elements: Record<string, number> = {
      'number-wins': userStats.numGames,
      'win-percent': winPercentage,
      'current-streak': userStats.currentStreak,
      'max-streak': userStats.maxStreak
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value.toString();
      }
    });
  },

  renderGraphDistribution(): void {
    const userStats = stateManager.getUserStats();

    userStats.winsInNum.forEach((value, index) => {
      const graphElement = document.getElementById(`graph-${index + 1}`);
      if (graphElement) {
        const percentage =
          userStats.numWins === 0 ? 5 : Math.floor((value / userStats.numWins) * 0.95 * 100) + 5;

        graphElement.style.width = `${percentage}%`;
        graphElement.textContent = value.toString();
      }
    });
  },

  renderCalendarModal(): void {
    const title = document.getElementById('title');
    if (title) {
      title.innerHTML = `GAME <span class="costco-blue">CALENDAR</span>`;
    }

    this.initializeCalendar();
  },

  initializeCalendar(): void {
    const calendarState = {
      currentDate: new Date(),
      selectedDate: new Date(),
      today: new Date()
    };

    this.renderCalendarMonth(calendarState);
    this.setupCalendarListeners(calendarState);
  },

  renderCalendarMonth(calendarState: { currentDate: Date; selectedDate: Date; today: Date }): void {
    const monthYearElement = document.getElementById('calendar-month-year');
    const calendarDaysElement = document.getElementById('calendar-days');

    if (!monthYearElement || !calendarDaysElement) return;

    // Set month/year display
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
    monthYearElement.textContent = calendarState.currentDate.toLocaleDateString('en-US', options);

    // Clear existing days
    calendarDaysElement.innerHTML = '';

    // Get first day of month and number of days
    const firstDay = new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth(), 1);
    const lastDay = new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day other-month';
      calendarDaysElement.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = day.toString();

      const currentDate = new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth(), day);
      const gameNumber = this.dateToGameNumber(currentDate);
      const todayGameNumber = dateUtils.getGameNumber();

      // Add appropriate classes
      if (this.isSameDay(currentDate, calendarState.today)) {
        dayElement.classList.add('today');
      }

      if (gameNumber > todayGameNumber) {
        dayElement.classList.add('disabled');
      } else {
        // Check if game was completed (this would need to be implemented with actual game state)
        const isCompleted = this.isGameCompleted(gameNumber);
        if (isCompleted) {
          dayElement.classList.add('completed');
        }

        // Add click listener for valid days
        dayElement.addEventListener('click', () => {
          this.selectCalendarDate(gameNumber);
        });
      }

      calendarDaysElement.appendChild(dayElement);
    }
  },

  setupCalendarListeners(calendarState: { currentDate: Date; selectedDate: Date; today: Date }): void {
    const prevButton = document.getElementById('prev-month');
    const nextButton = document.getElementById('next-month');
    const todayButton = document.getElementById('today-btn');
    const randomButton = document.getElementById('random-game-btn');

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() - 1);
        this.renderCalendarMonth(calendarState);
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() + 1);
        this.renderCalendarMonth(calendarState);
      });
    }

    if (todayButton) {
      todayButton.addEventListener('click', () => {
        // Switch to daily mode by toggling if currently in archive mode
        if (stateManager.get('isArchiveMode')) {
          stateManager.toggleArchiveMode();
        }
        this.closeAllModals();
        location.reload();
      });
    }

    if (randomButton) {
      randomButton.addEventListener('click', () => {
        const randomGameNumber = Math.floor(Math.random() * dateUtils.getGameNumber()) + 1;
        this.selectCalendarDate(randomGameNumber);
      });
    }
  },

  selectCalendarDate(gameNumber: number): void {
    // Switch to archive mode if not already in it
    if (!stateManager.get('isArchiveMode')) {
      stateManager.toggleArchiveMode();
    }
    stateManager.setSelectedGameNumber(gameNumber);
    this.closeAllModals();
    location.reload();
  },

  dateToGameNumber(date: Date): number {
    const startDate = new Date('09/21/2023');
    const timeDifference = date.getTime() - startDate.getTime();
    const dayDifference = timeDifference / (1000 * 3600 * 24);
    return Math.ceil(dayDifference);
  },

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  },

  isGameCompleted(_gameNumber: number): boolean {
    // TODO: Implement actual game completion tracking
    // This would check localStorage for completed games
    return false;
  }
};

/**
 * Share functionality
 */
export const shareManager = {
  async copyStats(): Promise<void> {
    const isArchiveMode = stateManager.get('isArchiveMode');
    const gameNumber = stateManager.get('gameNumber');
    const selectedGameNumber = stateManager.get('selectedGameNumber');
    const gameState = stateManager.getGameState();

    const gameTitle = isArchiveMode
      ? `Costcodle Archive #${selectedGameNumber}`
      : `Costcodle #${gameNumber}`;

    const result = gameState.hasWon
      ? `${gameState.guesses.length}/${GAME_CONFIG.MAX_GUESSES}`
      : `X/${GAME_CONFIG.MAX_GUESSES}`;

    let output = `${gameTitle} ${result}\n`;

    // Add guess results
    gameState.guesses.forEach(({ direction, closeness }) => {
      const directionEmoji: Record<string, string> = {
        '&uarr;': '⬆️',
        '&darr;': '⬇️',
        '&check;': '✅'
      };

      const closenessEmoji: Record<string, string> = {
        'guess-far': '🟥',
        'guess-near': '🟨'
      };

      const dirSymbol = directionEmoji[direction] || '';
      const closeSymbol = closenessEmoji[closeness] || '';

      output += `${dirSymbol}${closeSymbol}\n`;
    });

    try {
      await this.shareResults(output);
    } catch (error) {
      console.error('Share failed:', error);
      ui.showToast('Share text generated (share unavailable)');
    }
  },

  async shareResults(output: string): Promise<void> {
    const capabilities = deviceUtils.getCapabilities();

    if (capabilities.isMobile && capabilities.supportsShare) {
      try {
        await navigator.share({
          title: 'COSTCODLE',
          text: output,
          url: 'https://costcodle.com'
        });
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    // Fallback to clipboard
    await this.copyToClipboard(output + 'https://costcodle.com');
  },

  async copyToClipboard(text: string): Promise<void> {
    const capabilities = deviceUtils.getCapabilities();

    if (capabilities.supportsClipboard) {
      try {
        await navigator.clipboard.writeText(text);
        ui.showToast('Results copied to clipboard');
      } catch {
        this.fallbackCopy(text);
      }
    } else {
      this.fallbackCopy(text);
    }
  },

  fallbackCopy(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      ui.showToast('Results copied to clipboard');
    } catch {
      ui.showToast('Share text generated (copy unavailable)');
    }

    document.body.removeChild(textArea);
  }
};
