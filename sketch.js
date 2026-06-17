// ============================================================
// Week 6 & Week 5 Merged — Multi-Directional Sprite Shoot 'Em Up
// ============================================================
// A top-down vertical scroller using multi-directional sprite
// animation measurements from Week 5. The world scrolls upward.
// Orange blob enemies spawn at the top and move toward the player.
// Shoot them with Spacebar in the direction you are facing.
//
// Dark square obstacles are loaded from data/obstacles.json.
// Hitting one causes damage and bounces the player back.
//
// Files:
//   sketch.js         — all game logic
//   data/obstacles.json  — obstacle positions in world coordinates
//   assets/images/good_avatar.png — multi-directional player sprite sheet
// ============================================================

// ------------------------------------------------------------
// WORLD
// ------------------------------------------------------------
const WORLD_LENGTH = 3000;
const SCROLL_SPEED = 0.8;
let scrollY = 0;

// ------------------------------------------------------------
// SPRITE CONFIGURATION (From Week 5 Specs)
// ------------------------------------------------------------
const SPRITE = {
  frameWidth: 75, // width of one frame in pixels
  frameHeight: 150, // height of one frame in pixels
  numFrames: 4, // frames per row
  animSpeed: 20, // draw() frames per sprite frame (higher = slower)
  scale: 0.5, // draw at half original size

  // Row index for each direction
  rows: {
    down: 0,
    up: 1,
    right: 2,
    left: 3,
  },

  // Fine-tune the source position for each direction
  offsets: {
    down: { x: 0, y: 0 },
    up: { x: 0, y: 0 },
    right: { x: 0, y: 10 },
    left: { x: 0, y: 20 },
  },
};

// ------------------------------------------------------------
// BULLET & ENEMY CONFIGURATION
// ------------------------------------------------------------
const BULLET_SPEED = 10;
const SHOOT_COOLDOWN = 12;
const INVINCIBLE_FRAMES = 90;
const ENEMY_SPAWN_RATE = 120;
const MAX_ENEMIES = 3;
let spawnTimer = 0;

// ------------------------------------------------------------
// GAME ASSETS & DATA VARIABLES
// ------------------------------------------------------------
let goodAvatarSpriteSheet; // Holds good_avatar.png
let obstacleData;
let obstacles = [];
let bgShapes = [];
let bullets = [];
let enemies = [];
let score = 0;

// ------------------------------------------------------------
// PLAYER OBJECT (Merged State Machine)
// ------------------------------------------------------------
let player = {
  x: 400,
  y: 370,
  speed: 3,
  r: (75 * 0.5) / 2, // Collision radius mapped perfectly to the scaled width (18.75)

  // Animation State (Week 5)
  currentFrame: 0,
  frameTimer: 0,
  direction: "up", // Facing up initially to match shoot 'em up style
  isMoving: false,

  // Vector translation for bullets (Week 6)
  dirVector: { x: 0, y: -1 },

  // Combat State (Week 6)
  shootTimer: 0,
  health: 5,
  maxHealth: 5,
  invincible: false,
  invincibleTimer: 0,
  bounceVX: 0,
  bounceVY: 0,
};

// ------------------------------------------------------------
// GAME STATES
// ------------------------------------------------------------
const STATE_PLAY = "play";
const STATE_WIN = "win";
const STATE_OVER = "over";
let gameState = STATE_PLAY;

// ============================================================
// preload()
// ============================================================
function preload() {
  obstacleData = loadJSON("data/obstacles.json");
  goodAvatarSpriteSheet = loadImage("assets/images/good_avatar.png");
}

// ============================================================
// setup()
// ============================================================
function setup() {
  createCanvas(800, 450);
  imageMode(CENTER); // Critical for matching player center-coordinates

  // Build obstacle objects from JSON
  for (let i = 0; i < obstacleData.obstacles.length; i++) {
    let o = obstacleData.obstacles[i];
    obstacles.push({
      x: o.x,
      worldY: o.worldY,
      size: o.size,
    });
  }

  // Generate background shapes
  for (let i = 0; i < 80; i++) {
    bgShapes.push({
      x: random(width),
      worldY: random(-WORLD_LENGTH, 0),
      scrollMult: random(0.4, 0.9),
      type: random() > 0.5 ? "circle" : "rect",
      size: random(8, 40),
      r: floor(random(30, 70)),
      g: floor(random(30, 70)),
      b: floor(random(50, 100)),
    });
  }
}

// ============================================================
// draw()
// ============================================================
function draw() {
  background(20);

  if (gameState === STATE_PLAY) {
    scrollWorld();
    drawBackground();
    drawObstacles();
    handleInput();
    animateSprite();
    applyBounce();
    updateBullets();
    updateEnemies();
    spawnEnemies();
    checkBulletEnemyCollisions();
    checkEnemyPlayerCollision();
    checkObstaclePlayerCollision();
    updateInvincibility();
    checkLevelComplete();
    drawEnemies();
    drawBullets();
    drawPlayer(); // Runs destination/source rendering
    drawHUD();
  } else if (gameState === STATE_WIN) {
    drawWinScreen();
  } else if (gameState === STATE_OVER) {
    drawGameOver();
  }
}

// ------------------------------------------------------------
// scrollWorld()
// ------------------------------------------------------------
function scrollWorld() {
  if (scrollY < WORLD_LENGTH) {
    scrollY += SCROLL_SPEED;
  }
}

// ------------------------------------------------------------
// drawBackground()
// ------------------------------------------------------------
function drawBackground() {
  noStroke();
  for (let i = 0; i < bgShapes.length; i++) {
    let s = bgShapes[i];
    let screenY = s.worldY + scrollY * s.scrollMult;

    if (screenY > height + s.size) {
      s.worldY -= WORLD_LENGTH + height;
    }

    fill(s.r, s.g, s.b, 180);

    if (s.type === "circle") {
      ellipse(s.x, screenY, s.size);
    } else {
      rect(s.x - s.size / 2, screenY - s.size / 2, s.size, s.size, 3);
    }
  }

  stroke(255, 255, 255, 30);
  strokeWeight(1);
  line(0, 70, width, 70);
  noStroke();
}

// ------------------------------------------------------------
// drawObstacles()
// ------------------------------------------------------------
function drawObstacles() {
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];
    let screenY = o.worldY + scrollY;

    if (screenY < -o.size || screenY > height + o.size) continue;

    let x = o.x - o.size / 2;
    let y = screenY - o.size / 2;
    let s = o.size;

    let glow = map(sin(frameCount * 0.05 + i * 1.2), -1, 1, 40, 90);

    push();
    noStroke();
    fill(255, 100, 0, glow);
    rect(x - 4, y - 4, s + 8, s + 8, 8);

    fill(180, 40, 0);
    rect(x, y, s, s, 4);

    fill(220, 80, 10);
    rect(x + s * 0.1, y + s * 0.1, s * 0.4, s * 0.35, 2);
    rect(x + s * 0.55, y + s * 0.5, s * 0.35, s * 0.3, 2);
    rect(x + s * 0.2, y + s * 0.6, s * 0.25, s * 0.25, 2);

    stroke(100, 20, 0);
    strokeWeight(1.5);
    line(x + s * 0.3, y, x + s * 0.5, y + s * 0.4);
    line(x + s * 0.5, y + s * 0.4, x + s * 0.7, y + s * 0.6);
    line(x, y + s * 0.5, x + s * 0.3, y + s * 0.7);
    line(x + s * 0.3, y + s * 0.7, x + s * 0.6, y + s);

    noStroke();
    fill(255, 140, 0, 180);
    rect(x, y, s, 3, 2);
    rect(x, y, 3, s, 2);
    pop();
  }
}

// ------------------------------------------------------------
// handleInput() — Blends direction labels, logic tracking, and strict edge clamping
// ------------------------------------------------------------
function handleInput() {
  player.isMoving = false;

  if (keyIsDown(87)) {
    // W — up
    player.y -= player.speed;
    player.direction = "up";
    player.dirVector = { x: 0, y: -1 };
    player.isMoving = true;
  }
  if (keyIsDown(83)) {
    // S — down
    player.y += player.speed;
    player.direction = "down";
    player.dirVector = { x: 0, y: 1 };
    player.isMoving = true;
  }
  if (keyIsDown(65)) {
    // A — left
    player.x -= player.speed;
    player.direction = "left";
    player.dirVector = { x: -1, y: 0 };
    player.isMoving = true;
  }
  if (keyIsDown(68)) {
    // D — right
    player.x += player.speed;
    player.direction = "right";
    player.dirVector = { x: 1, y: 0 };
    player.isMoving = true;
  }

  // Bounds Calculations: Calculates half sizes dynamically to guarantee 0% screen cutoff
  let hw = (SPRITE.frameWidth * SPRITE.scale) / 2;
  let hh = (SPRITE.frameHeight * SPRITE.scale) / 2;

  player.x = constrain(player.x, hw, width - hw);
  player.y = constrain(player.y, 70 + hh, height - hh); // Keeps asset under HUD panel bar

  // Gun Cooldown Mechanics
  if (player.shootTimer > 0) player.shootTimer--;

  if (keyIsDown(32) && player.shootTimer === 0) {
    bullets.push({
      x: player.x + player.dirVector.x * (player.r + 4),
      y: player.y + player.dirVector.y * (player.r + 4),
      vx: player.dirVector.x * BULLET_SPEED,
      vy: player.dirVector.y * BULLET_SPEED,
    });
    player.shootTimer = SHOOT_COOLDOWN;
  }
}

// ------------------------------------------------------------
// animateSprite() (From Week 5 Specs)
// ------------------------------------------------------------
function animateSprite() {
  if (player.isMoving) {
    player.frameTimer++;
    if (player.frameTimer >= SPRITE.animSpeed) {
      player.frameTimer = 0;
      player.currentFrame = (player.currentFrame + 1) % SPRITE.numFrames;
    }
  } else {
    player.currentFrame = 0;
    player.frameTimer = 0;
  }
}

// ------------------------------------------------------------
// applyBounce()
// ------------------------------------------------------------
function applyBounce() {
  if (abs(player.bounceVX) > 0.1 || abs(player.bounceVY) > 0.1) {
    player.x += player.bounceVX;
    player.y += player.bounceVY;
    player.bounceVX *= 0.75;
    player.bounceVY *= 0.75;

    let hw = (SPRITE.frameWidth * SPRITE.scale) / 2;
    let hh = (SPRITE.frameHeight * SPRITE.scale) / 2;
    player.x = constrain(player.x, hw, width - hw);
    player.y = constrain(player.y, 70 + hh, height - hh);
  }
}

// ------------------------------------------------------------
// checkObstaclePlayerCollision()
// ------------------------------------------------------------
function checkObstaclePlayerCollision() {
  if (player.invincible) return;

  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];
    let screenY = o.worldY + scrollY;

    if (screenY < -o.size || screenY > height + o.size) continue;

    let closestX = constrain(player.x, o.x - o.size / 2, o.x + o.size / 2);
    let closestY = constrain(
      player.y,
      screenY - o.size / 2,
      screenY + o.size / 2,
    );

    let d = dist(player.x, player.y, closestX, closestY);

    if (d < player.r) {
      player.health--;
      player.invincible = true;
      player.invincibleTimer = INVINCIBLE_FRAMES;

      let dx = player.x - o.x;
      let dy = player.y - screenY;
      let len = dist(0, 0, dx, dy);
      if (len > 0) {
        player.bounceVX = (dx / len) * 8;
        player.bounceVY = (dy / len) * 8;
      }

      if (player.health <= 0) {
        gameState = STATE_OVER;
      }
      break;
    }
  }
}

// ------------------------------------------------------------
// updateBullets()
// ------------------------------------------------------------
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].vx;
    bullets[i].y += bullets[i].vy;

    if (
      bullets[i].x < 0 ||
      bullets[i].x > width ||
      bullets[i].y < 0 ||
      bullets[i].y > height
    ) {
      bullets.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------
// spawnEnemies()
// ------------------------------------------------------------
function spawnEnemies() {
  if (enemies.length >= MAX_ENEMIES) return;

  spawnTimer++;
  if (spawnTimer < ENEMY_SPAWN_RATE) return;
  spawnTimer = 0;

  let progress = scrollY / WORLD_LENGTH;
  let speed = 0.8 + progress * 1.0;

  enemies.push({
    x: random(30, width - 30),
    y: -25,
    r: 20,
    speed: speed,
    blobT: random(100),
  });
}

// ------------------------------------------------------------
// updateEnemies()
// ------------------------------------------------------------
function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let d = dist(e.x, e.y, player.x, player.y);

    if (d > 0) {
      e.x += (dx / d) * e.speed;
      e.y += (dy / d) * e.speed;
    }

    e.y += SCROLL_SPEED;

    if (e.y > height + 30) {
      enemies.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------
// checkBulletEnemyCollisions()
// ------------------------------------------------------------
function checkBulletEnemyCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      let d = dist(bullets[i].x, bullets[i].y, enemies[j].x, enemies[j].y);
      if (d < enemies[j].r + 6) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        score++;
        break;
      }
    }
  }
}

// ------------------------------------------------------------
// checkEnemyPlayerCollision()
// ------------------------------------------------------------
function checkEnemyPlayerCollision() {
  if (player.invincible) return;

  for (let i = 0; i < enemies.length; i++) {
    let d = dist(player.x, player.y, enemies[i].x, enemies[i].y);
    if (d < player.r + enemies[i].r - 8) {
      player.health--;
      player.invincible = true;
      player.invincibleTimer = INVINCIBLE_FRAMES;

      if (player.health <= 0) {
        gameState = STATE_OVER;
      }
      break;
    }
  }
}

// ------------------------------------------------------------
// updateInvincibility()
// ------------------------------------------------------------
function updateInvincibility() {
  if (player.invincible) {
    player.invincibleTimer--;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }
}

// ------------------------------------------------------------
// checkLevelComplete()
// ------------------------------------------------------------
function checkLevelComplete() {
  if (scrollY >= WORLD_LENGTH) {
    gameState = STATE_WIN;
  }
}

// ------------------------------------------------------------
// drawBullets()
// ------------------------------------------------------------
function drawBullets() {
  fill(255);
  noStroke();
  for (let i = 0; i < bullets.length; i++) {
    ellipse(bullets[i].x, bullets[i].y, 10);
  }
}

// ------------------------------------------------------------
// drawEnemies()
// ------------------------------------------------------------
function drawEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    let e = enemies[i];
    push();
    fill(255, 150, 30);
    noStroke();

    beginShape();
    let numPoints = 48;
    for (let j = 0; j < numPoints; j++) {
      let angle = (TWO_PI / numPoints) * j;
      let noiseVal = noise(
        cos(angle) * 0.8 + e.blobT,
        sin(angle) * 0.8 + e.blobT,
      );
      let r = e.r + map(noiseVal, 0, 1, -5, 5);
      vertex(e.x + cos(angle) * r, e.y + sin(angle) * r);
    }
    endShape(CLOSE);

    fill(10);
    ellipse(e.x - 6, e.y - 4, 6, 6);
    ellipse(e.x + 6, e.y - 4, 6, 6);
    pop();

    e.blobT += 0.015;
  }
}

// ------------------------------------------------------------
// drawPlayer() — Slices & draws good_avatar using your exact row and offset properties
// ------------------------------------------------------------
function drawPlayer() {
  if (player.invincible && floor(player.invincibleTimer / 6) % 2 === 0) return;

  push();

  // Extraction calculations matching your values
  let row = SPRITE.rows[player.direction];
  let offset = SPRITE.offsets[player.direction];

  let sx = player.currentFrame * SPRITE.frameWidth + offset.x;
  let sy = row * SPRITE.frameHeight + offset.y;

  let dw = SPRITE.frameWidth * SPRITE.scale;
  let dh = SPRITE.frameHeight * SPRITE.scale;

  // Render call
  image(
    goodAvatarSpriteSheet,
    player.x,
    player.y,
    dw,
    dh,
    sx,
    sy,
    SPRITE.frameWidth,
    SPRITE.frameHeight,
  );

  // Crosshair reticle tracked forward from character face boundary
  fill(255);
  noStroke();
  ellipse(
    player.x + player.dirVector.x * (player.r + 4),
    player.y + player.dirVector.y * (player.r + 4),
    6,
  );

  pop();
}

// ------------------------------------------------------------
// drawHUD()
// ------------------------------------------------------------
function drawHUD() {
  noStroke();
  fill(160);
  textSize(13);
  textAlign(LEFT);
  textFont("monospace");
  text("Move: WASD   Shoot: Spacebar", 16, 24);

  fill(255);
  textSize(16);
  textAlign(RIGHT);
  text("Score: " + score, width - 16, 28);

  let barW = 160;
  let barH = 14;
  let barX = width - barW - 16;
  let barY = 40;
  let fillW = map(player.health, 0, player.maxHealth, 0, barW);

  fill(40);
  rect(barX, barY, barW, barH, 4);

  let healthColour = lerpColor(
    color(220, 60, 60),
    color(60, 220, 120),
    player.health / player.maxHealth,
  );
  fill(healthColour);
  rect(barX, barY, fillW, barH, 4);

  fill(200);
  textSize(11);
  textAlign(RIGHT);
  text("Health", width - 16, barY + barH + 12);

  let progBarX = width - 6;
  let progBarH = height - 40;
  let progBarY = 20;
  let progFill = map(scrollY, 0, WORLD_LENGTH, 0, progBarH);

  fill(40);
  rect(progBarX, progBarY, 4, progBarH, 2);

  fill(100, 180, 255);
  rect(progBarX, progBarY + progBarH - progFill, 4, progFill, 2);
}

// ------------------------------------------------------------
// drawWinScreen()
// ------------------------------------------------------------
function drawWinScreen() {
  background(20);
  fill(255);
  textAlign(CENTER);
  textSize(52);
  text("Level Complete!", width / 2, height / 2 - 30);

  fill(180);
  textSize(18);
  text("Score: " + score, width / 2, height / 2 + 20);

  fill(120);
  textSize(14);
  text("Press R to play again", width / 2, height / 2 + 60);
}

// ------------------------------------------------------------
// drawGameOver()
// ------------------------------------------------------------
function drawGameOver() {
  background(20);
  fill(255);
  textAlign(CENTER);
  textSize(52);
  text("Game Over", width / 2, height / 2 - 30);

  fill(180);
  textSize(18);
  text("Score: " + score, width / 2, height / 2 + 20);

  fill(120);
  textSize(14);
  text("Press R to play again", width / 2, height / 2 + 60);
}

// ------------------------------------------------------------
// keyPressed()
// ------------------------------------------------------------
function keyPressed() {
  if ((key === "r" || key === "R") && gameState !== STATE_PLAY) {
    gameState = STATE_PLAY;
    score = 0;
    scrollY = 0;
    spawnTimer = 0;
    bullets = [];
    enemies = [];

    player.x = 400;
    player.y = 370;
    player.direction = "up";
    player.dirVector = { x: 0, y: -1 };
    player.currentFrame = 0;
    player.frameTimer = 0;
    player.shootTimer = 0;
    player.health = player.maxHealth;
    player.invincible = false;
    player.invincibleTimer = 0;
    player.bounceVX = 0;
    player.bounceVY = 0;
  }
}
