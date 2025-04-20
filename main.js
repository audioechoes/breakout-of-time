// === BOOT SCREEN ===
const bootLines = [
  "Loading... Unpacking Ennui █▒▒▒",
  "[OK] Initialising Toasting Module... Crumpets warmed",
  "[WARN] Tuning sarcasm levels... dangerously high",
  "[OK] Mounting Tea Protocol v2.1... stirred, not shaken",
  "[OK] Generating existential dread table… done",
  "[OK] Calibrating disappointment metrics... success",
  "[BOOT] (break)out of time loaded.",
];

const bootPre = document.getElementById("boot-lines");
const bootPrompt = document.getElementById("boot-prompt");

let currentLine = 0;

function showNextBootLine() {
  if (currentLine < bootLines.length) {
    bootPre.textContent += bootLines[currentLine++] + "\n";
    setTimeout(showNextBootLine, 500);
  } else {
    bootPrompt.classList.remove("hidden");
    document.addEventListener("keydown", startGame);
    document.addEventListener("click", startGame);
    document.addEventListener("touchstart", startGame);
  }
}

function startGame() {
  document.getElementById("boot-screen").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  document.removeEventListener("keydown", startGame);
  document.removeEventListener("click", startGame);
  document.removeEventListener("touchstart", startGame);
  initGame();
}

showNextBootLine();

// === GAME ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let paddle = {
  x: canvas.width / 2 - 60,
  y: canvas.height - 50,
  w: 120,
  h: 30,
  vx: 8
};

let ball = {
  x: canvas.width / 2,
  y: paddle.y - 10,
  radius: 8,
  speedX: 5,
  speedY: -5,
  moving: false
};

let balls = [ball];
let blocks = [];
let blockCols = 8;
let blockRows = 4;
let blockWidth = 100;
let blockHeight = 30;
let blockPadding = 20;
let blockOffsetTop = 100;

let lives = 3;
let timeLeft = 30;
let gameStarted = false;
let currentLevel = 0;
let maxLevels = 3;
let multiballTriggered = false;
let gamePaused = false;

const overlay = document.getElementById("overlay");

function createBlocks() {
  blocks = [];
  const totalWidth = blockCols * blockWidth + (blockCols - 1) * blockPadding;
  const startX = (canvas.width - totalWidth) / 2;

  for (let c = 0; c < blockCols; c++) {
    for (let r = 0; r < blockRows; r++) {
      const blockX = startX + c * (blockWidth + blockPadding);
      const blockY = blockOffsetTop + r * (blockHeight + blockPadding);
      blocks.push({ x: blockX, y: blockY, status: 1 });
    }
  }
}

function drawPaddle() {
  ctx.fillStyle = "black";
  const label = `${Math.max(0, Math.floor(timeLeft))}s`;
  const boxWidth = paddle.w;
  ctx.fillRect(paddle.x, paddle.y, boxWidth, paddle.h);
  ctx.fillStyle = "white";
  ctx.font = "16px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, paddle.x + boxWidth / 2, paddle.y + 20);
}

function drawBall(b) {
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.closePath();
}

function drawBlocks() {
  blocks.forEach(block => {
    if (block.status === 1) {
      ctx.fillStyle = "black";
      ctx.fillRect(block.x, block.y, blockWidth, blockHeight);
    }
  });
}

function movePaddle(dir) {
  if (dir === "left") {
    paddle.x = Math.max(0, paddle.x - paddle.vx);
  } else {
    paddle.x = Math.min(canvas.width - paddle.w, paddle.x + paddle.vx);
  }
}

function moveBalls() {
  balls.forEach((b, index) => {
    if (!b.moving) return;

    b.x += b.speedX;
    b.y += b.speedY;

    if (b.x + b.radius > canvas.width || b.x - b.radius < 0) {
      b.speedX *= -1;
    }
    if (b.y - b.radius < 0) {
      b.speedY *= -1;
    }

    if (
      b.y + b.radius > paddle.y &&
      b.x > paddle.x &&
      b.x < paddle.x + paddle.w
    ) {
      b.speedY *= -1;
      paddleShake();
    }

    if (b.y - b.radius > canvas.height) {
      balls.splice(index, 1);
      if (balls.length === 0) {
        lives--;
        if (lives <= 0) return endGame();
        resetBall();
      }
    }

    blocks.forEach(block => {
      if (block.status === 1) {
        if (
          b.x > block.x &&
          b.x < block.x + blockWidth &&
          b.y > block.y &&
          b.y < block.y + blockHeight
        ) {
          block.status = 0;
          b.speedY *= -1;
          timeLeft += 1;

          if (!multiballTriggered && Math.random() < 0.2) {
            triggerMultiball();
          }
        }
      }
    });
  });
}

function paddleShake() {
  paddle.x += Math.random() < 0.5 ? -2 : 2;
  setTimeout(() => {
    paddle.x -= Math.random() < 0.5 ? -2 : 2;
  }, 60);
}

function triggerMultiball() {
  multiballTriggered = true;
  const newBall = { ...ball };
  newBall.x += 10;
  newBall.y -= 10;
  newBall.speedX *= -1;
  balls.push(newBall);
}

function drawLives() {
  ctx.font = "16px monospace";
  ctx.fillStyle = "black";
  ctx.fillText("♥".repeat(lives), 20, 30);
}

function checkLevelComplete() {
  if (blocks.every(block => block.status === 0)) {
    nextLevel();
  }
}

function nextLevel() {
  gamePaused = true;
  currentLevel++;
  if (currentLevel >= maxLevels) return endGame(true);

  overlay.classList.remove("hidden");
  overlay.innerHTML = `"Well done. That says more about you than me."<br><br>Next level in 4...`;
  let countdown = 3;
  const interval = setInterval(() => {
    overlay.innerHTML = `"Still here? Okay then."<br><br>Next level in ${countdown}...`;
    countdown--;
    if (countdown < 0) {
      clearInterval(interval);
      overlay.classList.add("hidden");
      multiballTriggered = false;
      resetBall();
      createBlocks();
      gamePaused = false;
    }
  }, 1000);
}

function resetBall() {
  ball.x = paddle.x + paddle.w / 2;
  ball.y = paddle.y - 10;
  ball.moving = false;
  balls = [ball];
}

function endGame(won = false) {
  gamePaused = true;
  overlay.classList.remove("hidden");
  overlay.innerHTML = won
    ? `You beat it. Somehow.<br><br><a href="https://audioechoes.com" target="_blank">Go stare at something else</a>`
    : `Out of time and/or lives.<br><br><a href="https://audioechoes.com" target="_blank">Just… leave</a>`;
}

function drawBalls() {
  balls.forEach(drawBall);
}

function gameLoop() {
  if (!gameStarted || gamePaused) return requestAnimationFrame(gameLoop);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPaddle();
  drawBalls();
  drawBlocks();
  drawLives();
  moveBalls();
  checkLevelComplete();

  timeLeft -= 0.016;
  if (timeLeft <= 0) endGame();

  requestAnimationFrame(gameLoop);
}

function initGame() {
  createBlocks();
  resetBall();
  gameStarted = true;
  gameLoop();
}

// Keyboard + Touch Controls
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") movePaddle("left");
  if (e.key === "ArrowRight") movePaddle("right");
  if (e.key === " " || e.key === "Enter") balls.forEach(b => (b.moving = true));
});

document.getElementById("left-btn").addEventListener("touchstart", () => movePaddle("left"));
document.getElementById("right-btn").addEventListener("touchstart", () => movePaddle("right"));
