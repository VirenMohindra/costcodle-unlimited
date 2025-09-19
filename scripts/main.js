/*
  Declaration of global variables
*/

//Product info variables
let productName;
let productPrice;
let productImage;

//Archive mode variables - play any past game
let isArchiveMode = localStorage.getItem("archiveMode") === "true" || false;
let selectedGameNumber = parseInt(localStorage.getItem("selectedGameNumber")) || 1;
const TOTAL_GAMES = 3399;

//Timeout IDs
let shakeTimeout;
let toastTimeout;
let warningTimeout;

/*
  Global variable constants
*/

//The day Costcodle was launched. Used to find game number each day
const costcodleStartDate = new Date("09/21/2023");
let gameNumber = isArchiveMode ? selectedGameNumber : getGameNumber();

//Elements with event listeners to play the game
const input = document.getElementById("guess-input");
const buttonInput = document.getElementById("guess-button");

const infoButton = document.getElementById("info-button");
infoButton.addEventListener("click", switchState);

const statButton = document.getElementById("stat-button");
statButton.addEventListener("click", switchState);

//User stats object
const userStats = JSON.parse(localStorage.getItem("stats")) || {
  numGames: 0,
  numWins: 0,
  winsInNum: [0, 0, 0, 0, 0, 0],
  currentStreak: 0,
  maxStreak: 0,
};

//User game state
const gameState = JSON.parse(localStorage.getItem("state")) || {
  gameNumber: -1,
  guesses: [],
  hasWon: false,
};

/*
  Starts playing the game. Called at beginning of execution
*/

playGame();
updateModeIndicator(); // Update UI to show current mode

// Add mode toggle listener after initialization
const modeToggle = document.getElementById("mode-toggle");
if (modeToggle) {
  modeToggle.addEventListener("click", toggleMode);
}

function playGame() {
  if (isArchiveMode) {
    fetchGameData(selectedGameNumber);
  } else {
    fetchGameData(getGameNumber());
  }
}

function toggleMode() {
  isArchiveMode = !isArchiveMode;
  localStorage.setItem("archiveMode", isArchiveMode);

  if (isArchiveMode) {
    // Entering archive mode
    selectedGameNumber = parseInt(localStorage.getItem("selectedGameNumber")) || 1;
    gameNumber = selectedGameNumber;
  } else {
    // Entering daily mode
    gameNumber = getGameNumber();
  }

  updateModeIndicator();
  location.reload(); // Reload to reset the game state
}

function updateModeIndicator() {
  const modeToggle = document.getElementById("mode-toggle");
  const modeText = document.getElementById("mode-text");
  const modeIndicator = document.querySelector(".mode-indicator");

  if (isArchiveMode) {
    modeToggle.classList.add("practice-mode");
    modeText.textContent = "Archive Mode";
    modeIndicator.textContent = "📅";
  } else {
    modeToggle.classList.remove("practice-mode");
    modeText.textContent = "Daily Challenge";
    modeIndicator.textContent = "🎯";
  }
}

/*
  Acquiring Game Data
*/

//Fetches the current day's game data from the json and starts game
function fetchGameData(gameNumber) {
  fetch("./games.json")
    .then((response) => response.json())
    .then((json) => {
      productName = json[`game-${gameNumber}`].name;
      productPrice = json[`game-${gameNumber}`].price;
      productPrice = Number(productPrice.slice(1, productPrice.length));
      productImage = json[`game-${gameNumber}`].image;

      initializeGame();
    });
}

/*
  Used to initialize the game board using the current game state
*/

function initializeGame() {
  //Reset game state and track new game if user last played on a previous day
  if (isArchiveMode) {
    // Always reset for archive mode when switching games
    gameState.gameNumber = gameNumber;
    gameState.guesses = [];
    gameState.hasWon = false;
    localStorage.setItem("state", JSON.stringify(gameState));
  } else {
    // Daily mode logic
    if (gameState.gameNumber !== gameNumber) {
      if (gameState.hasWon === false) {
        userStats.currentStreak = 0;
      }
      gameState.gameNumber = gameNumber;
      gameState.guesses = [];
      gameState.hasWon = false;
      userStats.numGames++;

      localStorage.setItem("stats", JSON.stringify(userStats));
      localStorage.setItem("state", JSON.stringify(gameState));
    }
  }

  displayProductCard();
  updateGameBoard();

  // Both modes use 6-guess limit
  if (gameState.guesses.length < 6 && !gameState.hasWon) {
    addEventListeners();
  } else {
    convertToShareButton();
  }

  // Add navigation buttons in archive mode
  if (isArchiveMode) {
    addArchiveNavigationButtons();
  }
}

function convertToShareButton() {
  const containerElem = document.getElementById("input-container");
  const shareButtonElem = document.createElement("button");
  shareButtonElem.setAttribute("id", "share-button");
  containerElem.innerHTML = "";
  shareButtonElem.innerHTML = `Share
  <img src="./assets/share-icon.svg" class="share-icon" />`;
  shareButtonElem.addEventListener("click", copyStats);
  containerElem.appendChild(shareButtonElem);
}

function displayProductCard() {
  //First, update the image container with the new product image
  const imageContainer = document.getElementById("image-container");

  //Create a new image element to dynamically store game image
  const productImageElement = document.createElement("img");
  productImageElement.src = productImage;
  productImageElement.setAttribute("id", "product-image");

  //Add created image to the image container
  imageContainer.appendChild(productImageElement);

  //Select product info element and update the html to display product name
  const productInfo = document.getElementById("product-info");
  productInfo.innerHTML = `<center>${productName}</center>`;
}

function updateGameBoard() {
  updateGuessStat();

  gameState.guesses.forEach((guess, index) => displayGuess(guess, index + 1));
}

function updateGuessStat() {
  const guessStats = document.getElementById("game-stats");
  if (gameState.hasWon) {
    guessStats.innerHTML = `<center>You win! Congratulations!🎉</center>`;
    guessStats.innerHTML += `<center>The price was $${productPrice}</center>`;
    if (isArchiveMode) {
      const gameDate = getDateForGameNumber(selectedGameNumber);
      guessStats.innerHTML += `<center>Game #${selectedGameNumber} (${gameDate})</center>`;
    }
    return;
  }

  if (gameState.guesses.length === 6) {
    guessStats.innerHTML = `<center>Better luck next time!</center>`;
    guessStats.innerHTML += `<center>The price was $${productPrice}</center>`;
    if (isArchiveMode) {
      const gameDate = getDateForGameNumber(selectedGameNumber);
      guessStats.innerHTML += `<center>Game #${selectedGameNumber} (${gameDate})</center>`;
    }
  } else {
    if (isArchiveMode) {
      const gameDate = getDateForGameNumber(selectedGameNumber);
      guessStats.innerHTML = `Game #${selectedGameNumber} (${gameDate})<br>Guess: ${gameState.guesses.length + 1}/6`;
    } else {
      guessStats.innerHTML = `Guess: ${gameState.guesses.length + 1}/6`;
    }
  }
}

/*
  Event Listeners
*/

//Text input event listener to submit guess when user presses "Enter"
function inputEventListener(event) {
  if (event.key === "Enter") {
    handleInput();
  }
}

//Button event listener to submit guess when user presses guess button
function buttonEventListener() {
  handleInput();
}

function handleInput() {
  const strippedString = input.value.replaceAll(",", "");
  const guess = Number(strippedString).toFixed(2);

  if (isNaN(guess) || !strippedString) {
    displayWarning();
    return;
  }

  checkGuess(guess);

  input.value = "";

  function displayWarning() {
    clearTimeout(warningTimeout);

    const warningElem = document.getElementById("warning-toast");
    warningElem.classList.remove("hide");
    warningElem.classList.add("animate__flipInX");

    warningTimeout = setTimeout(() => {
      warningElem.classList.remove("animate__flipInX");
      warningElem.classList.add("animate__flipOutX");
      setTimeout(() => {
        warningElem.classList.remove("animate__flipOutX");
        warningElem.classList.add("hide");
      }, 1000);
    }, 2000);
  }
}

function copyStats() {
  let output = isArchiveMode ?
    `Costcodle Archive #${selectedGameNumber}` :
    `Costcodle #${gameNumber}`;

  if (!gameState.hasWon) {
    output += ` X/6\n`;
  } else {
    output += ` ${gameState.guesses.length}/6\n`;
  }

  gameState.guesses.forEach((guess) => {
    switch (guess.direction) {
      case "&uarr;":
        output += `⬆️`;
        break;
      case "&darr;":
        output += `⬇️`;
        break;
      case "&check;":
        output += `✅`;
        break;
    }

    switch (guess.closeness) {
      case "guess-far":
        output += `🟥`;
        break;
      case "guess-near":
        output += `🟨`;
        break;
    }
    output += `\n`;
  });

  const isMobile =
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i) ||
    navigator.userAgent.match(/IEMobile/i) ||
    navigator.userAgent.match(/Opera Mini/i);

  if (isMobile) {
    if (navigator.canShare) {
      navigator
        .share({
          title: "COSTCODLE",
          text: output,
          url: "https://costcodle.com",
        })
        .catch((error) => console.error("Share failed:", error));
    }
  } else {
    output += `https://costcodle.com`;
    navigator.clipboard.writeText(output);
    displayToast();
  }

  function displayToast() {
    clearTimeout(toastTimeout);

    const toastElem = document.getElementById("share-toast");
    toastElem.classList.remove("hide");
    toastElem.classList.add("animate__flipInX");

    toastTimeout = setTimeout(() => {
      toastElem.classList.remove("animate__flipInX");
      toastElem.classList.add("animate__flipOutX");
      setTimeout(() => {
        toastElem.classList.remove("animate__flipOutX");
        toastElem.classList.add("hide");
      }, 1000);
    }, 3000);
  }
}

function addEventListeners() {
  input.addEventListener("keydown", inputEventListener);
  buttonInput.addEventListener("click", buttonEventListener);

  input.addEventListener("focus", () => {
    input.setAttribute("placeholder", "0.00");
  });
  input.addEventListener("blur", () => {
    input.setAttribute("placeholder", "Enter a guess...");
  });
}

function removeEventListeners() {
  buttonInput.setAttribute("disabled", "");
  buttonInput.classList.remove("active");
  input.setAttribute("disabled", "");
  input.setAttribute("placeholder", "Game Over!");
  input.removeEventListener("keydown", inputEventListener);
  buttonInput.removeEventListener("click", buttonEventListener);
}

/*
  Handles the logic of Costocodle
  Creates a guess object based on user guess and checks win condition
*/

function checkGuess(guess) {
  const guessObj = { guess, closeness: "", direction: "" };

  const percentAway = calculatePercent(guess);

  if (Math.abs(percentAway) <= 5) {
    guessObj.closeness = "guess-win";
    gameState.hasWon = true;
  } else {
    shakeBox();
    if (Math.abs(percentAway) <= 25) {
      guessObj.closeness = "guess-near";
    } else {
      guessObj.closeness = "guess-far";
    }
  }

  if (gameState.hasWon) {
    guessObj.direction = "&check;";
  } else if (percentAway < 0) {
    guessObj.direction = "&uarr;";
  } else {
    guessObj.direction = "&darr;";
  }

  gameState.guesses.push(guessObj);
  localStorage.setItem("state", JSON.stringify(gameState));

  displayGuess(guessObj);

  if (gameState.hasWon) {
    gameWon();
  } else if (gameState.guesses.length === 6) {
    gameLost();
  }
}

/*
  Displays guess object from either game state or a new guess
*/

function displayGuess(guess, index = gameState.guesses.length) {
  const guessContainer = document.getElementById(index);
  const guessValueContainer = document.createElement("div");
  const infoContainer = document.createElement("div");

  guessValueContainer.classList.add(
    "guess-value-container",
    "animate__flipInX"
  );

  infoContainer.classList.add("guess-direction-container", "animate__flipInX");

  guessValueContainer.innerHTML = `$${guess.guess}`;

  infoContainer.classList.add(guess.closeness);
  infoContainer.innerHTML = guess.direction;

  guessContainer.classList.add("animate__flipOutX");

  setTimeout(() => {
    guessContainer.classList.add("transparent-background");
    guessContainer.appendChild(guessValueContainer);
    guessContainer.appendChild(infoContainer);
  }, 500);

  updateGuessStat();
}

/*
  Helper function to compute guess accuracy
*/

function calculatePercent(guess) {
  return ((guess * 100) / (productPrice * 100)) * 100 - 100;
}

/* 
  End state function to handle win/loss conditions
*/

function gameWon() {
  if (!isArchiveMode) {
    // Only update stats in daily mode
    userStats.numWins++;
    userStats.currentStreak++;
    userStats.winsInNum[gameState.guesses.length - 1]++;
    if (userStats.currentStreak > userStats.maxStreak) {
      userStats.maxStreak = userStats.currentStreak;
    }
    localStorage.setItem("stats", JSON.stringify(userStats));
  }

  gameState.hasWon = true;
  localStorage.setItem("state", JSON.stringify(gameState));

  removeEventListeners();
  convertToShareButton();
}

function gameLost() {
  if (!isArchiveMode) {
    // Only update stats in daily mode
    userStats.currentStreak = 0;
    localStorage.setItem("stats", JSON.stringify(userStats));
  }

  removeEventListeners();
  convertToShareButton();
}

/*
  DOM manipulation functions for overlays and animations
*/

function switchState(event) {
  const overlayBtnClicked = event.currentTarget.dataset.overlay;
  const overlayElem = document.getElementById(overlayBtnClicked);
  const title = document.getElementById("title");

  if (title.classList.contains("info-title")) {
    title.classList.remove("info-title");
  }

  if (overlayElem.style.display === "flex") {
    title.innerHTML = `COSTCO<span class="costco-blue">DLE</span>`;
    overlayElem.style.display = "none";
    return;
  }

  if (overlayBtnClicked === "info-overlay") {
    document.getElementById("stats-overlay").style.display = "none";
    renderInfo();
  } else {
    document.getElementById("info-overlay").style.display = "none";
    renderStats();
  }

  function renderInfo() {
    title.innerHTML = `HOW TO <span class="costco-blue">PLAY</span>`;
    if (!title.classList.contains("info-title")) {
      title.classList.add("info-title");
    }
    overlayElem.style.display = "flex";
  }

  function renderStats() {
    title.innerHTML = `GAME <span class="costco-blue">STATS</span>`;

    renderStatistics();
    graphDistribution();

    overlayElem.style.display = "flex";

    function renderStatistics() {
      const numWinsElem = document.getElementById("number-wins");
      numWinsElem.innerHTML = `${userStats.numGames}`;

      const winPercentElem = document.getElementById("win-percent");
      if (userStats.numGames === 0) {
        winPercentElem.innerHTML = `0`;
      } else {
        winPercentElem.innerHTML = `${Math.round(
          (userStats.numWins / userStats.numGames) * 100
        )}`;
      }

      const currentStreakElem = document.getElementById("current-streak");
      currentStreakElem.innerHTML = `${userStats.currentStreak}`;

      const maxStreakElem = document.getElementById("max-streak");
      maxStreakElem.innerHTML = `${userStats.maxStreak}`;
    }

    function graphDistribution() {
      console.log("here");
      userStats.winsInNum.forEach((value, index) => {
        const graphElem = document.getElementById(`graph-${index + 1}`);
        if (userStats.numWins === 0) {
          graphElem.style = `width: 5%`;
        } else {
          graphElem.style = `width: ${
            Math.floor((value / userStats.numWins) * 0.95 * 100) + 5
          }%`;
        }
        graphElem.innerHTML = `${value}`;
      });
    }
  }
}

function shakeBox() {
  clearTimeout(shakeTimeout);
  const infoCard = document.getElementById("info-card");
  if (infoCard.classList.contains("animate__headShake")) {
    infoCard.classList.remove("animate__headShake");
  }
  shakeTimeout = setTimeout(
    () => infoCard.classList.add("animate__headShake"),
    100
  );
}

/*
  Finds current game number based off of Costcodle start date
*/

function getGameNumber() {
  const currDate = new Date();
  let timeDifference = currDate.getTime() - costcodleStartDate.getTime();
  let dayDifference = timeDifference / (1000 * 3600 * 24);

  return Math.ceil(dayDifference);
}

function addArchiveNavigationButtons() {
  const navContainer = document.getElementById("archive-nav");

  if (!navContainer) {
    // Create navigation container if it doesn't exist
    const container = document.createElement("div");
    container.id = "archive-nav";
    container.className = "practice-navigation";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "← Previous Day";
    prevBtn.className = "practice-nav-btn";
    prevBtn.onclick = () => navigateArchiveGame(-1);
    prevBtn.disabled = selectedGameNumber <= 1;

    const gameInfo = document.createElement("span");
    const gameDate = getDateForGameNumber(selectedGameNumber);
    gameInfo.textContent = `${gameDate}`;
    gameInfo.className = "practice-game-info";

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next Day →";
    nextBtn.className = "practice-nav-btn";
    nextBtn.onclick = () => navigateArchiveGame(1);
    const todayGameNumber = getGameNumber();
    nextBtn.disabled = selectedGameNumber >= todayGameNumber;

    const todayBtn = document.createElement("button");
    todayBtn.textContent = "📅 Today";
    todayBtn.className = "practice-nav-btn random-btn";
    todayBtn.onclick = () => navigateToToday();

    container.appendChild(prevBtn);
    container.appendChild(gameInfo);
    container.appendChild(nextBtn);
    container.appendChild(todayBtn);

    const gameContainer = document.getElementById("game-container");
    gameContainer.insertBefore(container, gameContainer.firstChild.nextSibling);
  }
}

function navigateArchiveGame(direction) {
  const newGameNumber = selectedGameNumber + direction;
  const todayGameNumber = getGameNumber();
  if (newGameNumber >= 1 && newGameNumber <= todayGameNumber) {
    selectedGameNumber = newGameNumber;
    gameNumber = selectedGameNumber;
    localStorage.setItem("selectedGameNumber", selectedGameNumber);

    // Reset the game state for the new game
    gameState.gameNumber = -1; // Force reset
    location.reload();
  }
}

function navigateToToday() {
  const todayGameNumber = getGameNumber();
  selectedGameNumber = todayGameNumber;
  gameNumber = selectedGameNumber;
  localStorage.setItem("selectedGameNumber", selectedGameNumber);

  // Reset the game state for the new game
  gameState.gameNumber = -1; // Force reset
  location.reload();
}

function getDateForGameNumber(gameNum) {
  const startDate = new Date(costcodleStartDate);
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + gameNum - 1);

  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return targetDate.toLocaleDateString('en-US', options);
}
