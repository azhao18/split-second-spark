// Game state management
class GameState {
    constructor() {
        this.currentScreen = 'start';
        this.score = 0;
        this.lives = 3;
        this.highScore = this.loadHighScore();
        this.gameSpeed = 1;
        this.targets = [];
        this.particles = [];
        this.lastTargetTime = 0;
        this.targetInterval = 1200;
        this.isGameRunning = false;
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.lastFrameTime = 0;
    }

    reset() {
        this.score = 0;
        this.lives = 3;
        this.gameSpeed = 1;
        this.targets = [];
        this.particles = [];
        this.lastTargetTime = 0;
        this.targetInterval = 1200;
        this.isGameRunning = false;
    }

    loadHighScore() {
        try {
            return parseInt(localStorage.getItem('splitSecondSparkHighScore')) || 0;
        } catch (e) {
            return 0;
        }
    }

    saveHighScore() {
        try {
            localStorage.setItem('splitSecondSparkHighScore', this.highScore.toString());
        } catch (e) {
            // Ignore localStorage errors
        }
    }
}

// Target class
class Target {
    constructor(x, y, color, lifetime = 2000) {
        this.x = x;
        this.y = y;
        this.radius = 30;
        this.color = color;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.glowIntensity = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.isHit = false;
    }

    update(deltaTime) {
        this.lifetime -= deltaTime;
        this.glowIntensity = Math.sin(Date.now() * 0.01 + this.pulsePhase) * 0.5 + 0.5;
        return this.lifetime > 0;
    }

    draw(ctx) {
        const progress = 1 - (this.lifetime / this.maxLifetime);
        const currentRadius = this.radius * (1 - progress * 0.3);
        
        // Draw glow effect
        const glowRadius = currentRadius + 20 + this.glowIntensity * 10;
        const gradient = ctx.createRadialGradient(this.x, this.y, currentRadius, this.x, this.y, glowRadius);
        gradient.addColorStop(0, this.color + '80');
        gradient.addColorStop(0.7, this.color + '30');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw main target
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw countdown ring
        const ringProgress = this.lifetime / this.maxLifetime;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius + 5, -Math.PI / 2, -Math.PI / 2 + (ringProgress * Math.PI * 2));
        ctx.stroke();
    }

    contains(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return dx * dx + dy * dy <= this.radius * this.radius;
    }
}

// Particle class for explosion effects
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = 0.02;
        this.size = Math.random() * 4 + 2;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
        this.size *= 0.98;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Main game instance
const game = new GameState();

// Game configuration
const CONFIG = {
    targetColors: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'],
    initialLives: 3,
    targetLifetime: 2000,
    minTargetInterval: 800,
    maxTargetInterval: 1500,
    speedIncreaseRate: 0.02,
    targetRadius: 30,
    explosionParticles: 15
};

// Initialize game
function initGame() {
    console.log('Initializing game...');
    
    // Get canvas and context
    game.canvas = document.getElementById('gameCanvas');
    if (!game.canvas) {
        console.error('Canvas not found');
        return;
    }
    
    game.ctx = game.canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize UI event listeners
    initEventListeners();
    
    // Show start screen
    showScreen('startScreen');
    
    console.log('Game initialized successfully');
}

function resizeCanvas() {
    if (game.canvas) {
        game.canvas.width = window.innerWidth;
        game.canvas.height = window.innerHeight;
    }
}

function initEventListeners() {
    console.log('Setting up event listeners...');
    
    // Menu buttons
    const startButton = document.getElementById('startButton');
    const instructionsButton = document.getElementById('instructionsButton');
    const backToMenuButton = document.getElementById('backToMenuButton');
    const playAgainButton = document.getElementById('playAgainButton');
    const backToMenuFromGameOver = document.getElementById('backToMenuFromGameOver');
    
    if (startButton) {
        startButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Start button clicked');
            startGame();
        });
    } else {
        console.error('Start button not found');
    }
    
    if (instructionsButton) {
        instructionsButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Instructions button clicked');
            showScreen('instructionsScreen');
        });
    } else {
        console.error('Instructions button not found');
    }
    
    if (backToMenuButton) {
        backToMenuButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Back to menu button clicked');
            showScreen('startScreen');
        });
    }
    
    if (playAgainButton) {
        playAgainButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Play again button clicked');
            startGame();
        });
    }
    
    if (backToMenuFromGameOver) {
        backToMenuFromGameOver.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Back to menu from game over clicked');
            showScreen('startScreen');
        });
    }
    
    // Canvas click/touch events
    if (game.canvas) {
        game.canvas.addEventListener('click', handleCanvasClick);
        game.canvas.addEventListener('touchstart', handleCanvasTouch);
        game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    console.log('Event listeners set up successfully');
}

function showScreen(screenId) {
    console.log('Showing screen:', screenId);
    
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        game.currentScreen = screenId;
    } else {
        console.error('Screen not found:', screenId);
    }
}

function startGame() {
    console.log('Starting game...');
    
    game.reset();
    updateLivesDisplay();
    updateScoreDisplay();
    showScreen('gameScreen');
    
    game.isGameRunning = true;
    game.lastTargetTime = Date.now();
    game.lastFrameTime = Date.now();
    
    // Start the game loop
    gameLoop();
}

function gameLoop() {
    if (!game.isGameRunning) {
        console.log('Game loop stopped');
        return;
    }
    
    const currentTime = Date.now();
    const deltaTime = currentTime - game.lastFrameTime;
    game.lastFrameTime = currentTime;
    
    // Clear canvas
    if (game.ctx) {
        game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
    }
    
    // Spawn new targets
    if (currentTime - game.lastTargetTime > game.targetInterval) {
        spawnTarget();
        game.lastTargetTime = currentTime;
        
        // Increase game speed gradually
        game.gameSpeed += CONFIG.speedIncreaseRate;
        game.targetInterval = Math.max(CONFIG.minTargetInterval, CONFIG.maxTargetInterval / game.gameSpeed);
    }
    
    // Update and draw targets
    game.targets = game.targets.filter(target => {
        const isAlive = target.update(deltaTime);
        if (isAlive) {
            target.draw(game.ctx);
        } else if (!target.isHit) {
            // Target expired without being hit
            loseLife();
        }
        return isAlive;
    });
    
    // Update and draw particles
    game.particles = game.particles.filter(particle => {
        const isAlive = particle.update();
        if (isAlive) {
            particle.draw(game.ctx);
        }
        return isAlive;
    });
    
    // Continue game loop
    game.animationId = requestAnimationFrame(gameLoop);
}

function spawnTarget() {
    const margin = 60;
    const hudHeight = 80;
    const x = margin + Math.random() * (game.canvas.width - margin * 2);
    const y = margin + hudHeight + Math.random() * (game.canvas.height - margin * 2 - hudHeight);
    const color = CONFIG.targetColors[Math.floor(Math.random() * CONFIG.targetColors.length)];
    const lifetime = Math.max(1000, CONFIG.targetLifetime / game.gameSpeed);
    
    const target = new Target(x, y, color, lifetime);
    game.targets.push(target);
}

function handleCanvasClick(event) {
    if (!game.isGameRunning) return;
    
    const rect = game.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    checkTargetHit(x, y);
}

function handleCanvasTouch(event) {
    event.preventDefault();
    if (!game.isGameRunning) return;
    
    const rect = game.canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    checkTargetHit(x, y);
}

function checkTargetHit(x, y) {
    for (let i = game.targets.length - 1; i >= 0; i--) {
        const target = game.targets[i];
        if (target.contains(x, y) && !target.isHit) {
            target.isHit = true;
            
            // Calculate score based on reaction time
            const reactionBonus = Math.floor((target.lifetime / target.maxLifetime) * 100);
            const baseScore = 100;
            const scoreGained = baseScore + reactionBonus;
            
            game.score += scoreGained;
            updateScoreDisplay();
            
            // Create explosion effect
            createExplosion(target.x, target.y, target.color);
            
            // Remove target
            game.targets.splice(i, 1);
            
            // Screen flash effect
            createScreenFlash();
            
            break;
        }
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < CONFIG.explosionParticles; i++) {
        game.particles.push(new Particle(x, y, color));
    }
}

function createScreenFlash() {
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    document.body.appendChild(flash);
    
    setTimeout(() => {
        if (document.body.contains(flash)) {
            document.body.removeChild(flash);
        }
    }, 200);
}

function loseLife() {
    game.lives--;
    updateLivesDisplay();
    
    if (game.lives <= 0) {
        gameOver();
    }
}

function gameOver() {
    console.log('Game over');
    game.isGameRunning = false;
    
    if (game.animationId) {
        cancelAnimationFrame(game.animationId);
    }
    
    // Update high score
    if (game.score > game.highScore) {
        game.highScore = game.score;
        game.saveHighScore();
    }
    
    // Show final scores
    const finalScoreElement = document.getElementById('finalScore');
    const highScoreElement = document.getElementById('highScore');
    
    if (finalScoreElement) {
        finalScoreElement.textContent = game.score.toLocaleString();
    }
    
    if (highScoreElement) {
        highScoreElement.textContent = game.highScore.toLocaleString();
    }
    
    // Show game over screen
    setTimeout(() => {
        showScreen('gameOverScreen');
    }, 1000);
}

function updateLivesDisplay() {
    const livesContainer = document.getElementById('livesDisplay');
    if (!livesContainer) return;
    
    livesContainer.innerHTML = '';
    
    for (let i = 0; i < game.lives; i++) {
        const heart = document.createElement('div');
        heart.className = 'life-heart';
        livesContainer.appendChild(heart);
    }
}

function updateScoreDisplay() {
    const scoreElement = document.getElementById('scoreDisplay');
    if (scoreElement) {
        scoreElement.textContent = game.score.toLocaleString();
    }
}

// Handle visibility change to pause game
function handleVisibilityChange() {
    if (document.hidden && game.isGameRunning) {
        game.isGameRunning = false;
        if (game.animationId) {
            cancelAnimationFrame(game.animationId);
        }
    }
}

// Handle escape key to return to menu
function handleKeyDown(event) {
    if (event.key === 'Escape' && game.currentScreen === 'gameScreen' && game.isGameRunning) {
        game.isGameRunning = false;
        if (game.animationId) {
            cancelAnimationFrame(game.animationId);
        }
        showScreen('startScreen');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing game...');
    
    // Small delay to ensure all elements are rendered
    setTimeout(initGame, 100);
    
    // Add other event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
});

// Fallback initialization
window.addEventListener('load', function() {
    if (!game.canvas) {
        console.log('Fallback initialization...');
        initGame();
    }
});

// Export for debugging
window.game = game;
window.CONFIG = CONFIG;