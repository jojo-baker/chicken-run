const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// SCALE factor for zooming in
const SCALE = 1.5;

// Set canvas size
canvas.width = 800;
canvas.height = 400;

// Game state
let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = 0; // Track highest score
let scoreTimer = 0;
const scoreInterval = 100; // Score increases every 100ms
let prevGameOver = false;
let prevGameStarted = false;
let gameState = 'start'; // New game states: 'start', 'info', 'playing', 'gameOver'

// Add this near the top with other game state variables
let scoreFlashTimer = 0;
const SCORE_FLASH_INTERVAL = 1000; // Flash every 1000ms (1 second)

// Player properties
const player = {
    x: 100 * SCALE,
    y: canvas.height - 38 * SCALE - 30 * SCALE, // Stand on grass
    width: 30 * SCALE,
    height: 30 * SCALE,
    jumping: false,
    doubleJumping: false,
    jumpForce: 13 * SCALE,
    doubleJumpForce: 9 * SCALE,
    gravity: 0.6 * SCALE,
    velocityY: 0
};

// Chaser properties
const CHASER_SIZE = 90 * SCALE * 1.5 * 0.6; // Increased from 0.55 to 0.6 (another 10% larger)
const CHASER_START_X = -CHASER_SIZE; // Off-screen to the left
const CHASER_FOLLOW_DISTANCE = 70 * SCALE; // Balanced chase distance
let chaserIntro = true; // True until chaser reaches chicken
let chaserIntroChickenWait = true; // Chicken waits until chaser is close
const CHASER_INTRO_DELAY_TIME = 700; // ms delay before chicken starts running
const chaser = {
    x: CHASER_START_X, // Starts off-screen
    y: 0, // Will be set after ground is defined
    width: CHASER_SIZE,
    height: CHASER_SIZE,
    jumping: false,
    doubleJumping: false,
    jumpForce: 13 * SCALE,
    doubleJumpForce: 9 * SCALE,
    gravity: 0.6 * SCALE,
    velocityY: 0,
    followDistance: CHASER_FOLLOW_DISTANCE // Distance to maintain behind player
};

// Ground properties
const ground = {
    y: canvas.height - 38 * SCALE,
    height: 38 * SCALE,
    image: new Image(),
    offset: 0 // For scrolling
};

// Load grass tile image
ground.image.src = 'Assets/grass.png';

// Hedge image for background
const hedgeImage = new Image();
hedgeImage.src = 'Assets/hedge.png';
let hedgeOffset = 0;

// Obstacle properties
const obstacles = [];
const obstacleWidth = 30 * SCALE;
const obstacleHeights = [50 * SCALE, 70 * SCALE, 90 * SCALE]; // Different obstacle heights
const obstacleColors = ['#FF0000', '#FF4500', '#FF8C00']; // Different colors for different heights
let obstacleTimer = 0;
const obstacleInterval = 1500; // Time between obstacles in milliseconds
const initialObstacleDelay = 500; // Time until first obstacle appears
let firstObstacleSpawned = false;
let obstacleCount = 0; // Track number of obstacles spawned
const MAX_OBSTACLES = 10; // Limit maximum number of obstacles on screen

// Game speed
let gameSpeed = 2.5 * SCALE;
let lastFrameTime = 0; // Track last frame time for consistent updates

// Overlap amount for natural look
const OVERLAP = 0.15; // 15% of height for chicken and chaser
const OBSTACLE_OVERLAP = 0.1; // 10% for obstacles
const HEDGE_PARALLAX = 0.4; // Hedge moves at 40% of canvas speed (reduced from 0.6)

// Bug types
const bugTypes = [
    { name: 'normal', color: '#2222ff', speed: 4.5 * SCALE, radius: 12 * SCALE },
    { name: 'fast', color: '#ff22aa', speed: 4 * SCALE, radius: 12 * SCALE },
    { name: 'slow', color: '#22cc22', speed: gameSpeed - 0.5 * SCALE, radius: 12 * SCALE }, // Green bug slower than canvas
    { name: 'worm', color: '#ff69b4', speed: null, width: 32 * SCALE, height: 14 * SCALE } // Pink worm, speed set dynamically
];

// Bug properties
const bug = {
    active: false,
    x: 0,
    y: 0,
    radius: 12 * SCALE,
    speed: 4.5 * SCALE,
    type: bugTypes[0],
    spawnTimer: 0,
    spawnInterval: 4000 + Math.random() * 4000, // 4-8 seconds
    eaten: false,
    floatText: null
};

// Worm sprite sheet
const wormSprite = new Image();
wormSprite.src = 'Assets/worm.png';
const WORM_FRAME_WIDTH = 15;
const WORM_FRAME_HEIGHT = 20;
const WORM_FRAMES = 8;
const WORM_COLS = 4;
const WORM_ROWS = 2;
let wormAnimFrame = 0;
let wormAnimTimer = 0;
const WORM_ANIM_SPEED = 160; // ms per frame, slowed down from 80

// Dragonfly sprite sheet
const dragonflySprite = new Image();
dragonflySprite.src = 'Assets/dragonfly.png';
const DRAGONFLY_FRAME_WIDTH = 32;
const DRAGONFLY_FRAME_HEIGHT = 16;
const DRAGONFLY_FRAMES = 4;
const DRAGONFLY_COLS = 4;
let dragonflyAnimFrame = 0;
let dragonflyAnimTimer = 0;
const DRAGONFLY_ANIM_SPEED = 80; // ms per frame

// Chicken sprite sheet
const chickenSprite = new Image();
chickenSprite.src = 'Assets/ChickenWalking.png';
const CHICKEN_FRAME_WIDTH = 20;
const CHICKEN_FRAME_HEIGHT = 21;
const CHICKEN_FRAMES = 4;
let chickenAnimFrame = 0;
let chickenAnimTimer = 0;
const CHICKEN_ANIM_SPEED = 90; // ms per frame

// Chicken jumping sprite sheet
const chickenJumpSprite = new Image();
chickenJumpSprite.src = 'Assets/ChickenJumping-Sheet.png';
const CHICKEN_JUMP_FRAME_WIDTH = 20;
const CHICKEN_JUMP_FRAME_HEIGHT = 21;
const CHICKEN_JUMP_FRAMES = 6;
let chickenJumpAnimFrame = 0;
let chickenJumpAnimTimer = 0;
const CHICKEN_JUMP_ANIM_SPEED = 90; // ms per frame

// Chicken flying sprite sheet
const chickenFlySprite = new Image();
chickenFlySprite.src = 'Assets/ChickenFly-Sheet.png';
const CHICKEN_FLY_FRAME_WIDTH = 32;
const CHICKEN_FLY_FRAME_HEIGHT = 21;
const CHICKEN_FLY_FRAMES = 5;
let chickenFlyAnimFrame = 0;
let chickenFlyAnimTimer = 0;
const CHICKEN_FLY_ANIM_SPEED = 90; // ms per frame

// Chicken idle sprite sheet
const chickenIdleSprite = new Image();
chickenIdleSprite.src = 'Assets/ChickenIdle-Sheet.png';
const CHICKEN_IDLE_FRAME_WIDTH = 20;
const CHICKEN_IDLE_FRAME_HEIGHT = 21;
const CHICKEN_IDLE_FRAMES = 5;
let chickenIdleAnimFrame = 0;
let chickenIdleAnimTimer = 0;
const CHICKEN_IDLE_ANIM_SPEED = 120; // ms per frame

// Chicken pecking sprite sheet
const chickenPeckSprite = new Image();
chickenPeckSprite.src = 'Assets/ChickenPeck-Sheet.png';
const CHICKEN_PECK_FRAME_WIDTH = 27;
const CHICKEN_PECK_FRAME_HEIGHT = 21;
const CHICKEN_PECK_FRAMES = 8;
let chickenPeckAnimFrame = 0;
let chickenPeckAnimTimer = 0;
const CHICKEN_PECK_ANIM_SPEED = 60; // ms per frame
let isPecking = false;

// Biker chaser run sprite sheet
const bikerRunSprite = new Image();
bikerRunSprite.src = 'Assets/Biker_run.png';
const BIKER_RUN_FRAME_WIDTH = 48;
const BIKER_RUN_FRAME_HEIGHT = 48;
const BIKER_RUN_FRAMES = 6;
let bikerRunAnimFrame = 0;
let bikerRunAnimTimer = 0;
const BIKER_RUN_ANIM_SPEED = 90; // ms per frame

// Biker chaser idle sprite sheet
const bikerIdleSprite = new Image();
bikerIdleSprite.src = 'Assets/Biker_idle.png';
const BIKER_IDLE_FRAME_WIDTH = 48;
const BIKER_IDLE_FRAME_HEIGHT = 48;
const BIKER_IDLE_FRAMES = 4;
let bikerIdleAnimFrame = 0;
let bikerIdleAnimTimer = 0;
const BIKER_IDLE_ANIM_SPEED = 240; // ms per frame, slowed down from 120

// Gnome image for lowest obstacle
const gnomeImage = new Image();
gnomeImage.src = 'Assets/gnome.png';

// Leaves, bird bath, and statue images
const leavesImage = new Image();
leavesImage.src = 'Assets/Leaves.png';
const birdBathImage = new Image();
birdBathImage.src = 'Assets/bird_bath.png';
const statueImage = new Image();
statueImage.src = 'Assets/Statue.png';

// Leaves, bird bath, and statue obstacle types (define after player)
const LEAVES_HEIGHT = player.height * 0.9; // Bigger leaves
const BIRD_BATH_HEIGHT = player.height * 1.8; // Increased from 1.4 to 1.8
const STATUE_HEIGHT = player.height * 1.5 * 1.8; // Much taller, requires double jump
const obstacleTypes = [
    { name: 'leaves', height: LEAVES_HEIGHT, image: leavesImage },
    { name: 'gnome', height: Math.min(...obstacleHeights), image: gnomeImage },
    { name: 'birdbath', height: BIRD_BATH_HEIGHT, image: birdBathImage },
    { name: 'statue', height: STATUE_HEIGHT, image: statueImage },
    { name: 'normal', height: obstacleHeights[1], color: obstacleColors[1] },
    { name: 'tall', height: obstacleHeights[2], color: obstacleColors[2] }
];

// Floating text for bonus
function FloatingText(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.alpha = 1;
    this.dy = -1 * SCALE;
    this.update = function() {
        this.y += this.dy;
        this.alpha -= 0.02;
    };
    this.draw = function(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${16 * SCALE}px Arial`;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    };
}

// --- AUDIO SETUP ---
const jumpSound = new Audio('Assets/jump.mp3');
const doubleJumpSound = new Audio('Assets/jump.mp3'); // Using same sound for double jump
const gameOverSound = new Audio('Assets/game over.mp3');
const bgMusic = new Audio('Assets/8bit-music-for-game.mp3');
const bugEatenSound = new Audio('Assets/peck.mp3'); // Using peck sound for bug eaten
let musicStarted = false;
let musicPlayAttempted = false;

// Set up background music
bgMusic.loop = true;
bgMusic.volume = 0.5; // Set volume to 50%

async function startBgMusic() {
    if (musicPlayAttempted) return; // Prevent multiple attempts
    
    try {
        musicPlayAttempted = true;
        bgMusic.currentTime = 0;
        await bgMusic.play();
        musicStarted = true;
    } catch (error) {
        console.log("Audio play failed:", error);
        musicPlayAttempted = false;
        musicStarted = false;
    }
}

function stopBgMusic() {
    if (musicStarted) {
        bgMusic.pause();
        musicStarted = false;
        musicPlayAttempted = false;
    }
}

function playJumpSound() { 
    jumpSound.currentTime = 0; 
    jumpSound.play(); 
}

function playDoubleJumpSound() {
    doubleJumpSound.currentTime = 0;
    doubleJumpSound.play();
}

function playGameOverSound() {
    setTimeout(() => {
        gameOverSound.currentTime = 0;
        gameOverSound.play();
    }, 60); // 60ms delay to allow browser to process pause
}

// --- END AUDIO SETUP ---

// Load start, info, and end screen images
const startScreenImage = new Image();
startScreenImage.src = 'Assets/Chicken_Run_Start_Screen.jpg';
const infoScreenImage = new Image();
infoScreenImage.src = 'Assets/Chicken_Run_Info_Screen.jpg';
const endScreenImage = new Image();
endScreenImage.src = 'Assets/Chicken_Run_End_Screen.jpg';

// Event listeners
document.addEventListener('keydown', async (event) => {
    if (event.code === 'Space') {
        if (gameState === 'start') {
            gameState = 'info';
            await startBgMusic(); // Wait for music to start
        } else if (gameState === 'info') {
            gameState = 'playing';
            gameStarted = true;
            gameOver = false;
            obstacles.length = 0;
            score = 0;
            resetCharacterPositions();
            chaser.x = CHASER_START_X;
            chaserIntro = true;
            chaserIntroChickenWait = true;
        } else if (gameState === 'gameOver') {
            stopBgMusic(); // Stop music before changing state
            gameState = 'playing';
            gameStarted = true;
            gameOver = false;
            obstacles.length = 0;
            score = 0;
            resetCharacterPositions();
            chaser.x = CHASER_START_X;
            chaserIntro = true;
            chaserIntroChickenWait = true;
        }
        // Eat bug if in vicinity
        if (bug.active && !bug.eaten && gameState === 'playing') {
            const dx = player.x - bug.x;
            const dy = player.y - bug.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 50 * SCALE) {
                bug.eaten = true;
                bug.active = false;
                score += 10;
                bugEatenSound.currentTime = 0;
                bugEatenSound.play();
            }
        }
        // Trigger pecking animation
        if (!isPecking) {
            isPecking = true;
            chickenPeckAnimFrame = 0;
            chickenPeckAnimTimer = 0;
        }
    }
    
    if (event.code === 'ArrowUp' && gameState === 'playing') {
        if (!player.jumping) {
            // First jump
            player.jumping = true;
            player.velocityY = -player.jumpForce;
            playJumpSound();
        } else if (!player.doubleJumping) {
            // Double jump
            player.doubleJumping = true;
            player.velocityY = -player.doubleJumpForce;
            playDoubleJumpSound();
        }
    }
});

// Helper to reset player and chaser y positions
function resetCharacterPositions() {
    player.y = canvas.height - 38 * SCALE - 30 * SCALE;
    chaser.y = canvas.height - 38 * SCALE - chaser.height;
}

// Set initial positions
resetCharacterPositions();

// Game loop
function gameLoop(timestamp) {
    // Calculate delta time for consistent updates
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    try {
        if (gameState === 'start') {
            // Draw start screen
            if (startScreenImage.complete) {
                ctx.drawImage(startScreenImage, 0, 0, canvas.width, canvas.height);
            }
        } else if (gameState === 'info') {
            // Draw info screen
            if (infoScreenImage.complete) {
                ctx.drawImage(infoScreenImage, 0, 0, canvas.width, canvas.height);
            }
        } else {
            // Regular game drawing code
            // Scroll ground
            if (gameState === 'playing') {
                ground.offset -= gameSpeed;
                if (ground.offset <= -ground.image.width) {
                    ground.offset += ground.image.width;
                }
            }
            
            // Draw ground using grass tile
            if (ground.image.complete && ground.image.width > 0) {
                for (let x = ground.offset; x < canvas.width; x += ground.image.width) {
                    ctx.drawImage(ground.image, x, ground.y);
                }
            } else {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(0, ground.y, canvas.width, ground.height);
            }
            
            // Scroll hedge with ground (parallax)
            if (gameState === 'playing') {
                hedgeOffset -= gameSpeed * HEDGE_PARALLAX;
                if (hedgeOffset <= -hedgeImage.width * SCALE) {
                    hedgeOffset += hedgeImage.width * SCALE;
                }
            }
            
            // Draw hedge background (repeating, above ground, slightly overlapping grass)
            if (hedgeImage.complete && hedgeImage.naturalWidth > 0) {
                const HEDGE_SCALE = SCALE * 0.27;
                const hedgeY = ground.y - hedgeImage.height * HEDGE_SCALE * 0.9;
                for (let x = hedgeOffset; x < canvas.width; x += hedgeImage.width * HEDGE_SCALE) {
                    ctx.drawImage(
                        hedgeImage,
                        x,
                        hedgeY,
                        hedgeImage.width * HEDGE_SCALE,
                        hedgeImage.height * HEDGE_SCALE
                    );
                }
            }
            
            if (gameState === 'playing') {
                // Update score
                scoreTimer += deltaTime;
                if (scoreTimer >= scoreInterval) {
                    score += 1;
                    scoreTimer = 0;
                }
                
                // Update player
                if (player.jumping) {
                    player.velocityY += player.gravity;
                    player.y += player.velocityY;
                    
                    if (player.y >= canvas.height - 38 * SCALE - 30 * SCALE) {
                        player.y = canvas.height - 38 * SCALE - 30 * SCALE;
                        player.jumping = false;
                        player.doubleJumping = false;
                        player.velocityY = 0;
                    }
                }
                
                // Chaser intro logic
                if (gameState === 'playing' && chaserIntro) {
                    // Chaser runs in
                    chaser.x += gameSpeed;
                    if (chaser.x >= 0) {
                        chaser.x = 0;
                        // Now wait for chaser to reach follow distance to chicken
                        chaserIntro = false;
                    }
                } else if (gameState === 'playing' && chaserIntroChickenWait) {
                    // Chaser keeps running until at follow distance
                    if (chaser.x < player.x - chaser.followDistance) {
                        chaser.x += gameSpeed;
                    } else {
                        chaser.x = player.x - chaser.followDistance;
                        chaserIntroChickenWait = false; // Chicken can start running
                    }
                } else if (gameState === 'playing') {
                    // Normal chase logic
                    chaser.x = player.x - chaser.followDistance;
                }
                
                // Check if chaser needs to jump
                for (const obstacle of obstacles) {
                    // Jump later to ensure proper clearance
                    if (obstacle.x > chaser.x && 
                        obstacle.x < chaser.x + 80 * SCALE && // Reduced from 120 to 80
                        obstacle.x > chaser.x + 40 * SCALE && // Reduced from 60 to 40
                        !chaser.jumping) {
                        chaser.jumping = true;
                        chaser.velocityY = -chaser.jumpForce;
                        break;
                    }
                }

                // Update chaser
                if (chaser.jumping) {
                    chaser.velocityY += chaser.gravity;
                    chaser.y += chaser.velocityY;
                    
                    // If chaser is falling and not double jumped yet, do the double jump
                    if (chaser.velocityY > 0 && !chaser.doubleJumping) {
                        for (const obstacle of obstacles) {
                            if (obstacle.x > chaser.x && 
                                obstacle.x < chaser.x + 60 * SCALE && // Reduced from 80 to 60
                                obstacle.height > 70 * SCALE) {
                                chaser.doubleJumping = true;
                                chaser.velocityY = -chaser.doubleJumpForce;
                                break;
                            }
                        }
                    }
                    
                    if (chaser.y >= canvas.height - 38 * SCALE - chaser.height) {
                        chaser.y = canvas.height - 38 * SCALE - chaser.height;
                        chaser.jumping = false;
                        chaser.doubleJumping = false;
                        chaser.velocityY = 0;
                    }
                }
                
                // Generate obstacles
                obstacleTimer += deltaTime;
                if (!firstObstacleSpawned && obstacleTimer >= initialObstacleDelay) {
                    if (obstacles.length < MAX_OBSTACLES) {
                        const type = obstacleTypes[0];
                        obstacles.push({
                            x: canvas.width,
                            y: ground.y - type.height,
                            width: obstacleWidth,
                            height: type.height,
                            type: type
                        });
                        firstObstacleSpawned = true;
                        obstacleTimer = 0;
                        obstacleCount++;
                    }
                } else if (firstObstacleSpawned && obstacleTimer >= obstacleInterval) {
                    if (obstacles.length < MAX_OBSTACLES) {
                        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
                        obstacles.push({
                            x: canvas.width,
                            y: ground.y - type.height,
                            width: obstacleWidth,
                            height: type.height,
                            type: type
                        });
                        obstacleTimer = 0;
                        obstacleCount++;
                    }
                }
                
                // Update and draw obstacles
                for (let i = obstacles.length - 1; i >= 0; i--) {
                    const obstacle = obstacles[i];
                    obstacle.x -= gameSpeed;
                    
                    // Remove obstacles that are off screen
                    if (obstacle.x + obstacle.width < 0) {
                        obstacles.splice(i, 1);
                        continue;
                    }
                    
                    // Draw obstacle
                    if (obstacle.type && obstacle.type.image) {
                        const img = obstacle.type.image;
                        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                            let drawW, drawH, drawX, drawY;
                            if (obstacle.type.name === 'leaves') {
                                drawW = img.naturalWidth * SCALE * 0.65;
                                drawH = img.naturalHeight * SCALE * 0.65;
                                drawX = obstacle.x + (obstacle.width - drawW) / 2;
                                drawY = (ground.y - drawH) + drawH * 0.25;
                            } else if (obstacle.type.name === 'birdbath') {
                                const scale = obstacle.height / img.naturalHeight;
                                drawH = img.naturalHeight * scale;
                                drawW = img.naturalWidth * scale;
                                drawX = obstacle.x + (obstacle.width - drawW) / 2;
                                drawY = (obstacle.y + obstacle.height - drawH) + drawH * 0.15; // Increased overlap from 0.1 to 0.15
                            } else {
                                const scale = obstacle.height / img.naturalHeight;
                                drawH = img.naturalHeight * scale;
                                drawW = img.naturalWidth * scale;
                                drawX = obstacle.x + (obstacle.width - drawW) / 2;
                                drawY = (obstacle.y + obstacle.height - drawH) + drawH * OBSTACLE_OVERLAP;
                            }
                            ctx.drawImage(
                                img,
                                drawX,
                                drawY,
                                drawW,
                                drawH
                            );
                        } else {
                            // Fallback: draw a colored rectangle
                            ctx.fillStyle = obstacle.color || '#888';
                            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                        }
                    } else {
                        ctx.fillStyle = obstacle.color;
                        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                    }
                    
                    // Collision detection
                    if (checkCollision(player, obstacle)) {
                        if (!gameOver) {
                            gameOver = true;
                            playGameOverSound();
                        }
                    }
                }
            }
            
            // Draw player
            let chickenDrawW = player.width;
            let chickenDrawH = player.height;
            let chickenY = player.y + player.height * 0.25; // Lower the chicken more (increased from 0.15 to 0.25)
            if (gameState === 'playing') {
                // Idle chicken at start
                chickenIdleAnimTimer += 16;
                if (chickenIdleAnimTimer > CHICKEN_IDLE_ANIM_SPEED) {
                    chickenIdleAnimFrame = (chickenIdleAnimFrame + 1) % CHICKEN_IDLE_FRAMES;
                    chickenIdleAnimTimer = 0;
                }
                ctx.drawImage(
                    chickenIdleSprite,
                    chickenIdleAnimFrame * CHICKEN_IDLE_FRAME_WIDTH, 0, CHICKEN_IDLE_FRAME_WIDTH, CHICKEN_IDLE_FRAME_HEIGHT,
                    player.x, chickenY,
                    chickenDrawW, chickenDrawH
                );
            } else if (isPecking) {
                // Animate chicken peck sprite
                chickenPeckAnimTimer += 16;
                if (chickenPeckAnimTimer > CHICKEN_PECK_ANIM_SPEED) {
                    chickenPeckAnimFrame++;
                    chickenPeckAnimTimer = 0;
                    if (chickenPeckAnimFrame >= CHICKEN_PECK_FRAMES) {
                        chickenPeckAnimFrame = 0;
                        isPecking = false;
                    }
                }
                ctx.drawImage(
                    chickenPeckSprite,
                    chickenPeckAnimFrame * CHICKEN_PECK_FRAME_WIDTH, 0, CHICKEN_PECK_FRAME_WIDTH, CHICKEN_PECK_FRAME_HEIGHT,
                    player.x, chickenY,
                    chickenDrawW, chickenDrawH
                );
            } else if (gameOver) {
                // Animate chicken idle sprite
                chickenIdleAnimTimer += 16;
                if (chickenIdleAnimTimer > CHICKEN_IDLE_ANIM_SPEED) {
                    chickenIdleAnimFrame = (chickenIdleAnimFrame + 1) % CHICKEN_IDLE_FRAMES;
                    chickenIdleAnimTimer = 0;
                }
                ctx.drawImage(
                    chickenIdleSprite,
                    chickenIdleAnimFrame * CHICKEN_IDLE_FRAME_WIDTH, 0, CHICKEN_IDLE_FRAME_WIDTH, CHICKEN_IDLE_FRAME_HEIGHT,
                    player.x, chickenY,
                    chickenDrawW, chickenDrawH
                );
            } else if (player.jumping) {
                // Animate chicken fly sprite
                chickenFlyAnimTimer += 16;
                if (chickenFlyAnimTimer > CHICKEN_FLY_ANIM_SPEED) {
                    chickenFlyAnimFrame = (chickenFlyAnimFrame + 1) % CHICKEN_FLY_FRAMES;
                    chickenFlyAnimTimer = 0;
                }
                ctx.drawImage(
                    chickenFlySprite,
                    chickenFlyAnimFrame * CHICKEN_FLY_FRAME_WIDTH, 0, CHICKEN_FLY_FRAME_WIDTH, CHICKEN_FLY_FRAME_HEIGHT,
                    player.x, chickenY,
                    chickenDrawW, chickenDrawH
                );
            } else {
                // Animate chicken walk sprite
                chickenAnimTimer += 16;
                if (chickenAnimTimer > CHICKEN_ANIM_SPEED) {
                    chickenAnimFrame = (chickenAnimFrame + 1) % CHICKEN_FRAMES;
                    chickenAnimTimer = 0;
                }
                ctx.drawImage(
                    chickenSprite,
                    chickenAnimFrame * CHICKEN_FRAME_WIDTH, 0, CHICKEN_FRAME_WIDTH, CHICKEN_FRAME_HEIGHT,
                    player.x, chickenY,
                    chickenDrawW, chickenDrawH
                );
            }
            
            // Draw chaser
            let bikerDrawW = chaser.width;
            let bikerDrawH = chaser.height;
            let bikerY = chaser.y + chaser.height * 0.1; // Slightly lower the chaser
            if (gameState === 'playing') {
                // Run animation during chase
                bikerRunAnimTimer += 16;
                if (bikerRunAnimTimer > BIKER_RUN_ANIM_SPEED) {
                    bikerRunAnimFrame = (bikerRunAnimFrame + 1) % BIKER_RUN_FRAMES;
                    bikerRunAnimTimer = 0;
                }
                ctx.drawImage(
                    bikerRunSprite,
                    bikerRunAnimFrame * BIKER_RUN_FRAME_WIDTH, 0, BIKER_RUN_FRAME_WIDTH, BIKER_RUN_FRAME_HEIGHT,
                    chaser.x, bikerY,
                    bikerDrawW, bikerDrawH
                );
            }
            
            // Draw score
            ctx.fillStyle = '#000';
            ctx.font = 'bold 24px "Jersey15", monospace';
            ctx.textAlign = 'left';

            // Flash score only when it exceeds high score AND high score exists
            if (score > highScore && highScore > 0) {
                scoreFlashTimer += deltaTime;
                if (scoreFlashTimer > SCORE_FLASH_INTERVAL) {
                    scoreFlashTimer = 0;
                }
                // Alternate between black and orange
                ctx.fillStyle = scoreFlashTimer < SCORE_FLASH_INTERVAL / 2 ? '#000' : '#f4941b';
            }

            ctx.fillText(`Score: ${score}`, 20 * SCALE, 40 * SCALE);
            if (highScore > 0) {
                ctx.fillStyle = '#000'; // Reset color for high score
                ctx.fillText(`High Score: ${highScore}`, 20 * SCALE, 60 * SCALE);
            }
            
            // Update game over state
            if (gameOver) {
                gameState = 'gameOver';
            }
            
            // Draw game over text
            if (gameState === 'gameOver') {
                // Clear the canvas first
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw end screen
                if (endScreenImage.complete) {
                    ctx.drawImage(endScreenImage, 0, 0, canvas.width, canvas.height);
                    
                    // Draw scores in custom color with Jersey15 font
                    ctx.font = 'bold 32px "Jersey15", monospace';
                    ctx.textAlign = 'left';
                    
                    // Position scores next to the text in the image
                    const scoreX = 415;
                    const highScoreX = 415;
                    const scoreY = 220;
                    const highScoreY = 256;
                    
                    // Draw current score
                    ctx.fillStyle = '#fef1df';
                    ctx.fillText("YOUR SCORE: " + score.toString(), scoreX, scoreY);
                    
                    // Update high score if current score is higher
                    if (score > highScore) {
                        highScore = score;
                    }
                    
                    // Check if this is a new high score
                    const isNewHighScore = score === highScore;
                    
                    // Draw high score
                    if (isNewHighScore) {
                        // New high score
                        ctx.fillStyle = '#f4941b';
                        ctx.fillText("NEW HIGH SCORE: " + score.toString(), highScoreX, highScoreY);
                    } else {
                        // Regular high score
                        ctx.fillStyle = '#fef1df';
                        ctx.fillText("HIGH SCORE: " + highScore.toString(), highScoreX, highScoreY);
                    }
                }
            }
            
            // Draw start text
            if (gameState === 'start') {
                ctx.fillStyle = '#000';
                ctx.font = `${32 * SCALE}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('Press Space to Start', canvas.width / 2, canvas.height / 2);
            }
            
            if (gameState === 'playing') {
                // BUG SPAWNING AND MOVEMENT
                // Spawn bug if not active
                bug.spawnTimer += 16;
                if (!bug.active && bug.spawnTimer > bug.spawnInterval) {
                    // Randomly pick bug type
                    let typeIndex = Math.floor(Math.random() * bugTypes.length);
                    // Remove the 70% skip chance for worms so they appear as often as other bugs
                    // if (typeIndex === 3 && Math.random() < 0.7) typeIndex = Math.floor(Math.random() * 3);
                    bug.type = bugTypes[typeIndex];
                    // For worm, ensure it doesn't overlap obstacles
                    if (bug.type.name === 'worm') {
                        // Only spawn if no obstacle is in the worm's path
                        const wormFront = canvas.width + (bug.type.width / 2);
                        let overlap = false;
                        for (const obs of obstacles) {
                            // Check if obstacle is on the ground and in the worm's path
                            if (
                                obs.y + obs.height > ground.y - 2 * SCALE &&
                                obs.x < canvas.width + 100 * SCALE && obs.x + obs.width > canvas.width
                            ) {
                                overlap = true;
                                break;
                            }
                        }
                        if (overlap) {
                            // Delay worm spawn
                            bug.spawnTimer = 0;
                            bug.spawnInterval = 1000 + Math.random() * 2000;
                            return;
                        }
                    }
                    bug.active = true;
                    bug.eaten = false;
                    bug.x = canvas.width + (bug.type.radius || bug.type.width / 2);
                    if (bug.type.name === 'worm') {
                        // Worm is always on the grass, align its center with the player's center on the ground, but lower it a bit
                        bug.y = ground.y - player.height / 2 + 10 * SCALE; // Lowered by 10px, scaled
                        bug.speed = gameSpeed; // Always match canvas speed
                    } else {
                        // Bug can appear anywhere player can reach with double jump
                        const minY = ground.y - player.height * 2.2 * SCALE;
                        const maxY = ground.y - (bug.type.radius || 12 * SCALE);
                        bug.y = minY + Math.random() * (maxY - minY);
                        bug.speed = bug.type.speed;
                    }
                    bug.radius = bug.type.radius || 0;
                    bug.spawnTimer = 0;
                    bug.spawnInterval = 4000 + Math.random() * 4000;
                }
                // Move bug
                if (bug.active) {
                    bug.x -= bug.speed;
                    // Remove bug if off screen
                    if (bug.x + (bug.type.radius || bug.type.width / 2) < 0) {
                        bug.active = false;
                    }
                }
            }
            // Draw bug
            if (bug.active && !bug.eaten) {
                ctx.save();
                if (bug.type.name === 'worm') {
                    // Animate worm from sprite sheet
                    wormAnimTimer += 16;
                    if (wormAnimTimer > WORM_ANIM_SPEED) {
                        wormAnimFrame = (wormAnimFrame + 1) % WORM_FRAMES;
                        wormAnimTimer = 0;
                    }
                    const frameX = (wormAnimFrame % WORM_COLS) * WORM_FRAME_WIDTH;
                    const frameY = Math.floor(wormAnimFrame / WORM_COLS) * WORM_FRAME_HEIGHT;
                    const drawW = WORM_FRAME_WIDTH * SCALE;
                    const drawH = WORM_FRAME_HEIGHT * SCALE;
                    ctx.drawImage(
                        wormSprite,
                        frameX, frameY, WORM_FRAME_WIDTH, WORM_FRAME_HEIGHT,
                        bug.x - drawW / 2,
                        bug.y - drawH / 2,
                        drawW,
                        drawH
                    );
                } else {
                    // Animate dragonfly for all flying bugs
                    dragonflyAnimTimer += 16;
                    if (dragonflyAnimTimer > DRAGONFLY_ANIM_SPEED) {
                        dragonflyAnimFrame = (dragonflyAnimFrame + 1) % DRAGONFLY_FRAMES;
                        dragonflyAnimTimer = 0;
                    }
                    const frameX = (dragonflyAnimFrame % DRAGONFLY_COLS) * DRAGONFLY_FRAME_WIDTH;
                    const drawW = DRAGONFLY_FRAME_WIDTH * SCALE;
                    const drawH = DRAGONFLY_FRAME_HEIGHT * SCALE;
                    ctx.drawImage(
                        dragonflySprite,
                        frameX, 0, DRAGONFLY_FRAME_WIDTH, DRAGONFLY_FRAME_HEIGHT,
                        bug.x - drawW / 2,
                        bug.y - drawH / 2,
                        drawW,
                        drawH
                    );
                }
                ctx.restore();
            }
            // Draw floating +20 if bug was eaten
            if (bug.floatText) {
                bug.floatText.update();
                bug.floatText.draw(ctx);
                if (bug.floatText.alpha <= 0) {
                    bug.floatText = null;
                }
            }
        }
        
        // Start/stop music based on game state
        if (gameState === 'playing') {
            startBgMusic();
        } else {
            stopBgMusic();
        }
        
    } catch (error) {
        console.error('Game loop error:', error);
    }
    
    requestAnimationFrame(gameLoop);
}

// Collision detection
function checkCollision(player, obstacle) {
    // Add a small buffer to the collision detection
    const buffer = 5 * SCALE;
    return player.x + buffer < obstacle.x + obstacle.width &&
           player.x + player.width - buffer > obstacle.x &&
           player.y + buffer < obstacle.y + obstacle.height &&
           player.y + player.height - buffer > obstacle.y;
}

// Start the game loop with timestamp
requestAnimationFrame(gameLoop); 