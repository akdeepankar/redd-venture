class Game {
  
  constructor() {
    this.level = 1;
    this.maxLevel = 7;
    this.selectedBox = null;
    this.riddlePopup = document.getElementById('popup');
    this.riddleAnswerInput = document.getElementById('riddleAnswer');
    this.levelNumber = document.getElementById('levelNumber');
    this.checkButton = document.getElementById('checkButton');
    this.gridContainer = document.getElementById('level-container');
    this.score = 0; // To accumulate the score
    this.scoreDisplay = document.getElementById('totalScore'); // Element to display the total score
    this.gameStatus = 'false';

    // Timer variables
    this.countdownTime = 90; // Initial countdown time (in seconds)
    this.timerInterval = null;
    this.timerDisplay = document.getElementById('timerDisplay'); // Timer display element

    // Predefined answers, questions, and corresponding grid positions for each level
    this.levelAnswers = {
      1: { answerIndex: 66, question: "Hey! Is anyone there? The bridge is out, and I can’t move! Someone sabotaged it. Please, fix the bridge!", riddle: "Thank you!", riddleImage: "assets/1gif.gif" },
      2: { answerIndex: 47, question: "Find Me India on the World Map.", riddle: "Thanks. What is the National capital of India. New _____ ?", correctAnswer: "delhi", riddleImage: "assets/level2.webp" },
      3: { answerIndex: 28, question: "Bip Bip! Can you tell which scooter will reach the gas station? 🛵", riddle: "Correct !!", correctAnswer: "", riddleImage: "assets/footsteps.jpg" },
      4: { answerIndex: 56, question: "Concentrate and think about which glass will be filled first! 🥛", riddle: "Correct !!", correctAnswer: "", riddleImage: "assets/moment.jpg" },
      5: { answerIndex: 74, question: "If it takes 15 minutes to boil one egg, how long will it take to boil five eggs?", riddle: "Correct !!", correctAnswer: "", riddleImage: "assets/stamp.jpg" },
      6: { answerIndex: 45, question: "I hold life within me, but I am not alive. I often sit still, yet I help things thrive. What am I?", riddle: "Correct !! A plant pot! 🌱", correctAnswer: "", riddleImage: "assets/stamp.jpg" },
      7: { answerIndex: 45, question: "I hold life within me, but I am not alive. I often sit still, yet I help things thrive. What am I?", riddle: "Correct !! A plant pot! 🌱", correctAnswer: "", riddleImage: "assets/stamp.jpg" }


    };

    // Background images for each level
    this.levelBackgrounds = [
      'assets/level1.png',
      'assets/level2.jpg',
      'assets/level3.png',
      'assets/level4.png',
      'assets/level5.png',
      'assets/level6.jpg',
      'assets/level6.jpg'


    ];

    // Icons for each level
    this.levelIcons = [
      { hoverIcon: 'assets/tile1.png', selectedIcon: 'assets/tile1.png' },
      { hoverIcon: 'assets/tile2.png', selectedIcon: 'assets/tile2.png' },
      { hoverIcon: 'assets/tile3.png', selectedIcon: 'assets/tile3.png' },
      { hoverIcon: 'assets/tile3.png', selectedIcon: 'assets/tile3.png' },
      { hoverIcon: 'assets/tile3.png', selectedIcon: 'assets/tile3.png' },
      { hoverIcon: 'assets/tile6.png', selectedIcon: 'assets/tile6.png' },
      { hoverIcon: 'assets/tile6.png', selectedIcon: 'assets/tile6.png' }


    ];

    // Set initial level and grid
    this.setLevel(this.level);

    // Update level display in the score section
    document.getElementById('currentLevel').innerText = this.level;
    document.getElementById('totalLevels').innerText = this.maxLevel;

    // Event listener for check button
    this.checkButton.addEventListener('click', () => this.checkAnswer());

    // Event listener for riddle answer submission
    document.getElementById('submitAnswer').addEventListener('click', () => this.submitAnswer());

     // Listen for messages from Devvit
    window.addEventListener('message', (ev) => {

      const { type, data } = ev.data;
      if (type === 'devvit-message') {
        const { message } = data;
        console.log('Received from Devvit:', message);
        this.scoreDisplay.innerText = message.data.currentScore;
        this.setLevel(message.data.currentLevel);
        this.score = message.data.currentScore;
        


        // Handle level update from Devvit message
        if (message.type === 'updateLevel') {
          const newLevel = message.data.level;
          console.log('Level updated from Devvit:', newLevel);
          this.updateLevelFromDevvit(newLevel);
        }
        

        // Example: Update game state if required
        if (message.type === 'updateScore') {
          const newScore = message.data.score;
          console.log('Updated score from Devvit:', newScore);
          this.score = newScore;  // Update game score from Devvit message
          this.updateScoreDisplay();
        }

        if (message.type === 'setGameCompleted') {
          const newStatus = message.data.gameCompleted;
          console.log('Updated Status from Devvit:', newStatus);
          this.gameStatus = newStatus;  // Update game score from Devvit message
        }
      }
    });
  }


  updateScoreDisplay() {
    this.scoreDisplay.innerText = this.score;
  }

  updateLevelFromDevvit(newLevel) {
    if (newLevel >= 1 && newLevel <= this.maxLevel) {
      this.level = newLevel;
      this.setLevel(this.level); // Update to the new level
      this.postLevelToDevvit();
    } else {
      console.error('Invalid level received from Devvit:', newLevel);
    }
  }
  
  currentLevel = document.getElementById('currentLevel').innerText;

  postScoreToDevvit() {
    window.parent.postMessage({
      type: 'updateScore',
      data: { score: this.score },
    }, '*');
  }

  postLevelToDevvit() {
    window.parent.postMessage({
      type: 'updateLevel',
      data: { level: this.level },
    }, '*');
  }

  postGameStatusToDevvit() {
    window.parent.postMessage({
      type: 'setGameCompleted',
      data: { gameCompleted: 'true' },
    }, '*');
  }


  startCountdown() {
    // Start or reset the countdown timer
    this.countdownTime = 30; // Reset to 30 seconds for each new level
    this.updateTimerDisplay();

    if (this.timerInterval) {
      clearInterval(this.timerInterval); // Clear any existing interval
    }

    this.timerInterval = setInterval(() => {
      if (this.countdownTime > 0) {
        this.countdownTime--;
        this.updateTimerDisplay();
      } else {
        clearInterval(this.timerInterval); // Stop the timer
        //this.timerRanOut(); // Handle when time runs out
      }
    }, 1000); // Update every second
  }

  updateTimerDisplay() {
    // Display the countdown time in the timer element
    this.timerDisplay.innerText = `Time: ${this.countdownTime}s`;
  }

  setLevel(level) {
    this.level = level;
    this.levelNumber.innerText = `Level ${this.level}`;
    document.getElementById('currentLevel').innerText = this.level;


    // Clear grid container
    this.gridContainer.innerHTML = '';

    // Apply the background image for the current level
    const backgroundImage = this.levelBackgrounds[this.level - 1];
    this.gridContainer.style.backgroundImage = `url(${backgroundImage})`;
    this.gridContainer.style.backgroundSize = 'contain';
    this.gridContainer.style.backgroundPosition = 'center';

    // Generate grid for the current level
    for (let i = 0; i < 100; i++) {
      const gridBox = document.createElement('div');
      gridBox.classList.add('grid-box');
      gridBox.dataset.index = i; // Store index of the box
      gridBox.addEventListener('click', () => this.selectBox(gridBox));

      // Add hover effect for dynamic background icon
      gridBox.addEventListener('mouseover', () => this.setHoverIcon(gridBox));

      // Remove hover effect on mouseout
      gridBox.addEventListener('mouseout', () => this.removeHoverIcon(gridBox));

      this.gridContainer.appendChild(gridBox);
    }

    // Set predefined answer and question for the current level
    const { answerIndex, question, riddle } = this.levelAnswers[this.level];
    this.answerIndex = answerIndex; // Correct index for the current level
    this.correctAnswer = this.levelAnswers[this.level].correctAnswer;
    this.riddle = riddle; // Riddle text for the correct answer box
    this.question = question; // Predefined question for the level

    // Display the question for the current level
    document.getElementById('levelQuestion').innerText = this.question;

    // Start the countdown timer when the level is set
    this.startCountdown();
  }

  selectBox(gridBox) {
    // Deselect previously selected box
    if (this.selectedBox) {
      this.selectedBox.style.backgroundImage = ''; // Remove icon from previously selected box
      this.selectedBox.classList.remove('selected');
    }

    // Select new box
    this.selectedBox = gridBox;
    this.selectedBox.classList.add('selected');

    // Set the selected icon for the box based on the current level
    const selectedIcon = this.levelIcons[this.level - 1].selectedIcon;
    this.selectedBox.style.backgroundImage = `url(${selectedIcon})`;
    this.selectedBox.style.backgroundSize = 'contain';
    this.selectedBox.style.backgroundPosition = 'center';
  }

  setHoverIcon(gridBox) {
    // Set the hover icon dynamically based on the level
    const hoverIcon = this.levelIcons[this.level - 1].hoverIcon;
    gridBox.style.backgroundImage = `url(${hoverIcon})`;
    gridBox.style.backgroundSize = 'contain';
    gridBox.style.backgroundPosition = 'center';
  }

  removeHoverIcon(gridBox) {
    // Remove the hover icon on mouseout
    if (!gridBox.classList.contains('selected')) {
      gridBox.style.backgroundImage = '';
    }
  }

  checkAnswer() {
    // Get the button by its ID (or class)
    const checkButton = document.querySelector('#checkButton');

    // Check if the selected box is correct
    if (this.selectedBox && parseInt(this.selectedBox.dataset.index) === this.answerIndex) {
      this.showRiddlePopup();
    } else {
      // Add shake animation to the button
      checkButton.classList.add('shake');

      // Remove the shake animation after it finishes (0.5s duration)
      setTimeout(() => {
        checkButton.classList.remove('shake');
      }, 500); // Match the duration of the animation
    }
  }

  showRiddlePopup() {
    // Get the image for the current level
    const riddleImage = this.levelAnswers[this.level].riddleImage;
  
    // Show riddle popup with text and image (if available)
    document.getElementById('riddle').innerText = this.riddle;
  
    const imageContainer = document.getElementById('riddleImageContainer');
  
    // If there's an image for this level, display it
    if (riddleImage) {
      imageContainer.innerHTML = `<img src="${riddleImage}" alt="Riddle Image" class="riddle-image">`;
    } else {
      imageContainer.innerHTML = ''; // Clear image if not available
    }
  
    // Create or get the Next Level button
    let nextLevelButton = document.getElementById('nextLevelButton');
    if (!nextLevelButton) {
      nextLevelButton = document.createElement('button');
      nextLevelButton.id = 'nextLevelButton';
      nextLevelButton.innerText = 'Next Level';
      nextLevelButton.addEventListener('click', () => this.moveToNextLevel());
      document.getElementById('popup').appendChild(nextLevelButton);
    }
  
    if (!this.correctAnswer) {
      // No answer required, hide the input and enable the Next Level button
      this.riddleAnswerInput.style.display = 'none';
      document.getElementById('submitAnswer').style.display = 'none';
      nextLevelButton.disabled = false; // Enable the button
    } else {
      // Answer is required, show the input and disable the Next Level button initially
      this.riddleAnswerInput.style.display = 'block';
      document.getElementById('submitAnswer').style.display = 'block';
      nextLevelButton.disabled = true; // Disable the button until the correct answer is entered
      nextLevelButton.style.backgroundColor = 'gray';
    }
  
    this.riddlePopup.style.display = 'flex';
  }
  
  submitAnswer() {
    const submitAnswerButton = document.querySelector('#submitAnswer');
    const nextLevelButton = document.getElementById('nextLevelButton');
    const answer = this.riddleAnswerInput.value.trim().toLowerCase();
  
    if (answer === this.correctAnswer) {
      // Unlock the Next Level button if the answer is correct
      nextLevelButton.disabled = false; // Enable the button
      nextLevelButton.style.backgroundColor = ''; // Reset the button's style (default enabled style)
      submitAnswerButton.classList.add('correct'); // Optionally, add a visual cue
      setTimeout(() => submitAnswerButton.classList.remove('correct'), 500);
    } else {
      // Add shake animation to indicate a wrong answer
      submitAnswerButton.classList.add('shake');
      setTimeout(() => {
        submitAnswerButton.classList.remove('shake');
      }, 500); // Match the duration of the animation
    }
  }
  

  moveToNextLevel() {
    // Hide the popup and move to the next level
    this.riddlePopup.style.display = 'none';
  
    // Only add points if the timer is not over
    if (this.countdownTime > 0) {
      this.score += 10 + this.countdownTime; // Add 5 points + countDown Time for each correct answer
      console.log('Score:', this.score);
    // Post the score to Devvit
    }
  
    // Update the score display
    this.scoreDisplay.innerText = this.score;

    this.postScoreToDevvit();
  
    // Check if it’s the last level
    if (this.level === this.maxLevel) {
      // Display a final message with the total score
      alert(`Congratulations! You've completed all levels. Your final score is: ${this.score}`);
      
      // Optionally, you can display the final score on a popup
      this.riddlePopup.innerHTML = `<h2>Congratulations!</h2><p>You completed all levels!</p><p>Your final score is: ${this.score}</p>`;
      this.riddlePopup.style.display = 'flex'; // Show the final popup
      this.postGameStatusToDevvit();
    } else {
      // If not the last level, move to the next level
      this.level++;
      this.setLevel(this.level);
      this.postLevelToDevvit();
    }
  }
  

  timerRanOut() {
    // If the timer runs out, do not allow moving to the next level
    alert("Time is up! No points awarded this level.");
    //this.level++; // Automatically move to the next level
    //this.setLevel(this.level); // Set up the next level
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
});
