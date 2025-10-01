// Récupération du canvas
const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

// Types du jeu
interface Paddle {
    x: number;
    y: number;
    width: number;
    height: number;
    dy: number;
}

interface Ball {
    x: number;
    y: number;
    radius: number;
    dx: number;
    dy: number;
}

interface Particle {
    x: number;
    y: number;
    dx: number;
    dy: number;
    size: number;
    life: number;
    maxLife: number;
    color?: string;
}

type Difficulty = "Facile" | "Normal" | "Difficile";

// Variables de jeu
let scoreLeft: number = 0;
let scoreRight: number = 0;
let MAX_SCORE: number = 10;
let winner: string | null = null;
let gameStartTime: number = Date.now();
let rallies: number = 0;
let currentRally: number = 0;
let isPaused: boolean = false;
let difficulty: Difficulty = "Normal";
let ballBaseSpeed: number = 4;
let paddleSpeed: number = 5;
let visualEffects: boolean = true;
let particles: Particle[] = [];

// Création des entités
const paddleWidth: number = 10;
const paddleHeight: number = 100;

const leftPaddle: Paddle = {
    x: 20,
    y: canvas.height / 2 - 50,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0
};

const rightPaddle: Paddle = {
    x: canvas.width - 30,
    y: canvas.height / 2 - 50,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0
};

const ball: Ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    dx: ballBaseSpeed,
    dy: ballBaseSpeed
};

// Contrôles clavier
const keys: Record<string, boolean> = {};

window.addEventListener("keydown", (e: KeyboardEvent) => {
    keys[e.key] = true;
    if (e.key === " ") {
        e.preventDefault();
        isPaused = !isPaused;
    }
});

window.addEventListener("keyup", (e: KeyboardEvent) => {
    keys[e.key] = false;
});

// Système de particules
function createParticles(x: number, y: number, color: string = "white"): void {
    if (!visualEffects) return;
    
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 10,
            dy: (Math.random() - 0.5) * 10,
            size: Math.random() * 4 + 2,
            life: 30,
            maxLife: 30,
            color: color
        });
    }
}

function updateParticles(): void {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.dx *= 0.98;
        p.dy *= 0.98;
        p.life--;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles(): void {
    particles.forEach((p: Particle) => {
        const alpha = p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color || "white";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function resetBall(): void {
    if (winner) return;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? ballBaseSpeed : -ballBaseSpeed);
    ball.dy = (Math.random() > 0.5 ? ballBaseSpeed : -ballBaseSpeed);
    currentRally = 0;
}

function update(): void {
    if (isPaused || winner) return;

    // Déplacement paddles
    if (keys["w"]) leftPaddle.y -= paddleSpeed;
    if (keys["s"]) leftPaddle.y += paddleSpeed;
    if (keys["ArrowUp"]) rightPaddle.y -= paddleSpeed;
    if (keys["ArrowDown"]) rightPaddle.y += paddleSpeed;

    // IA simple pour la difficulté "Facile" (joueur droit assisté)
    if (difficulty === "Facile") {
        const paddleCenter = rightPaddle.y + rightPaddle.height / 2;
        const diff = ball.y - paddleCenter;
        if (Math.abs(diff) > 5) {
            rightPaddle.y += diff > 0 ? 2 : -2;
        }
    }

    // Empêcher de sortir du canvas
    leftPaddle.y = Math.max(0, Math.min(canvas.height - paddleHeight, leftPaddle.y));
    rightPaddle.y = Math.max(0, Math.min(canvas.height - paddleHeight, rightPaddle.y));

    // Déplacement de la balle
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Collision avec murs haut/bas
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy *= -1;
        createParticles(ball.x, ball.y, "#ffff00");
    }

    // Collision paddle gauche
    if (ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&
        ball.y > leftPaddle.y &&
        ball.y < leftPaddle.y + leftPaddle.height &&
        ball.dx < 0) {
        
        ball.dx *= -1;
        ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
        
        // Effet de "spin" selon où la balle touche le paddle
        const hitPos = (ball.y - leftPaddle.y) / leftPaddle.height - 0.5;
        ball.dy += hitPos * 2;
        
        currentRally++;
        createParticles(ball.x, ball.y, "#00ff00");
    }

    // Collision paddle droit
    if (ball.x + ball.radius > rightPaddle.x &&
        ball.y > rightPaddle.y &&
        ball.y < rightPaddle.y + rightPaddle.height &&
        ball.dx > 0) {
        
        ball.dx *= -1;
        ball.x = rightPaddle.x - ball.radius;
        
        const hitPos = (ball.y - rightPaddle.y) / rightPaddle.height - 0.5;
        ball.dy += hitPos * 2;
        
        currentRally++;
        createParticles(ball.x, ball.y, "#00ff00");
    }

    // Augmentation progressive de la vitesse
    const speedMultiplier = 1 + (currentRally * 0.05);
    ball.dx = ball.dx > 0 ? ballBaseSpeed * speedMultiplier : -ballBaseSpeed * speedMultiplier;

    // Reset si sortie de l'écran
    if (ball.x < 0) {
        scoreRight++;
        rallies += currentRally;
        createParticles(0, ball.y, "#ff0000");
        if (scoreRight >= MAX_SCORE) {
            winner = "Joueur Droite";
            showGameOver();
        }
        resetBall();
    }
    if (ball.x > canvas.width) {
        scoreLeft++;
        rallies += currentRally;
        createParticles(canvas.width, ball.y, "#ff0000");
        if (scoreLeft >= MAX_SCORE) {
            winner = "Joueur Gauche";
            showGameOver();
        }
        resetBall();
    }

    updateParticles();
}

function draw(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ligne centrale pointillée
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.setLineDash([10, 15]);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Score avec style amélioré
    ctx.fillStyle = "white";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText(scoreLeft.toString(), canvas.width / 2 - 50, 60);
    ctx.fillText(scoreRight.toString(), canvas.width / 2 + 50, 60);

    // Affichage du rally actuel
    if (currentRally > 5) {
        ctx.fillStyle = "#ffff00";
        ctx.font = "20px Arial";
        ctx.fillText(`Rally: ${currentRally}`, canvas.width / 2, 100);
    }

    // Paddles avec gradient
    const gradient1 = ctx.createLinearGradient(leftPaddle.x, leftPaddle.y, leftPaddle.x + leftPaddle.width, leftPaddle.y);
    gradient1.addColorStop(0, "#ffffff");
    gradient1.addColorStop(1, "#cccccc");
    ctx.fillStyle = gradient1;
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);

    const gradient2 = ctx.createLinearGradient(rightPaddle.x, rightPaddle.y, rightPaddle.x + rightPaddle.width, rightPaddle.y);
    gradient2.addColorStop(0, "#cccccc");
    gradient2.addColorStop(1, "#ffffff");
    ctx.fillStyle = gradient2;
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    // Balle avec effet de glow
    ctx.save();
    if (visualEffects) {
        ctx.shadowColor = "white";
        ctx.shadowBlur = 10;
    }
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Particules
    drawParticles();

    // Message de pause
    if (isPaused) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.font = "48px Arial";
        ctx.textAlign = "center";
        ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);
        ctx.font = "20px Arial";
        ctx.fillText("Appuyez sur ESPACE pour reprendre", canvas.width / 2, canvas.height / 2 + 40);
    }
}

function showGameOver(): void {
    const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    
    const winnerElement = document.getElementById("winnerText");
    const finalScoreElement = document.getElementById("finalScore");
    const gameStatsElement = document.getElementById("gameStats");
    const gameOverPanel = document.getElementById("gameOverPanel");
    
    if (winnerElement) winnerElement.textContent = `${winner} Gagne!`;
    if (finalScoreElement) finalScoreElement.textContent = `${scoreLeft} - ${scoreRight}`;
    if (gameStatsElement) {
        gameStatsElement.innerHTML = `
            Durée: ${minutes}:${seconds.toString().padStart(2, '0')}<br>
            Échanges totaux: ${rallies}<br>
            Difficulté: ${difficulty}
        `;
    }
    if (gameOverPanel) gameOverPanel.classList.remove("hidden");
}

function restartGame(): void {
    // Reset de toutes les variables
    scoreLeft = 0;
    scoreRight = 0;
    winner = null;
    gameStartTime = Date.now();
    rallies = 0;
    currentRally = 0;
    isPaused = false;
    particles = [];
    
    // Reset positions
    leftPaddle.y = canvas.height / 2 - 50;
    rightPaddle.y = canvas.height / 2 - 50;
    resetBall();
    
    // Cacher le panneau
    const gameOverPanel = document.getElementById("gameOverPanel");
    if (gameOverPanel) gameOverPanel.classList.add("hidden");
}

function showSettings(): void {
    const settingsPanel = document.getElementById("settingsPanel");
    const gameOverPanel = document.getElementById("gameOverPanel");
    
    if (settingsPanel) settingsPanel.classList.remove("hidden");
    if (gameOverPanel) gameOverPanel.classList.add("hidden");
}

function hideSettings(): void {
    const settingsPanel = document.getElementById("settingsPanel");
    const gameOverPanel = document.getElementById("gameOverPanel");
    
    if (settingsPanel) settingsPanel.classList.add("hidden");
    if (winner && gameOverPanel) gameOverPanel.classList.remove("hidden");
}

function applySettings(): void {
    const ballSpeedElement = document.getElementById("ballSpeed") as HTMLInputElement;
    const paddleSpeedElement = document.getElementById("paddleSpeed") as HTMLInputElement;
    const maxScoreElement = document.getElementById("maxScore") as HTMLInputElement;
    const visualEffectsElement = document.getElementById("visualEffects") as HTMLInputElement;
    
    if (ballSpeedElement) ballBaseSpeed = parseInt(ballSpeedElement.value);
    if (paddleSpeedElement) paddleSpeed = parseInt(paddleSpeedElement.value);
    if (maxScoreElement) MAX_SCORE = parseInt(maxScoreElement.value);
    if (visualEffectsElement) visualEffects = visualEffectsElement.checked;
    
    hideSettings();
}

function changeDifficulty(): void {
    const difficulties: Difficulty[] = ["Facile", "Normal", "Difficile"];
    const currentIndex = difficulties.indexOf(difficulty);
    difficulty = difficulties[(currentIndex + 1) % difficulties.length];
    
    if (difficulty === "Difficile") {
        ballBaseSpeed = Math.min(ballBaseSpeed * 1.3, 8);
        paddleSpeed = Math.max(paddleSpeed * 0.8, 3);
    } else if (difficulty === "Normal") {
        ballBaseSpeed = 4;
        paddleSpeed = 5;
    } else { // Facile
        ballBaseSpeed = Math.max(ballBaseSpeed * 0.8, 2);
        paddleSpeed = Math.min(paddleSpeed * 1.2, 8);
    }
    
    const difficultyBtn = document.querySelector('.difficulty-btn') as HTMLElement;
    if (difficultyBtn) difficultyBtn.textContent = `Difficulté: ${difficulty}`;
}

// Event listeners pour les paramètres
function initializeEventListeners(): void {
    const ballSpeedSlider = document.getElementById("ballSpeed") as HTMLInputElement;
    const paddleSpeedSlider = document.getElementById("paddleSpeed") as HTMLInputElement;
    const maxScoreSlider = document.getElementById("maxScore") as HTMLInputElement;
    
    if (ballSpeedSlider) {
        ballSpeedSlider.addEventListener("input", function() {
            const ballSpeedValue = document.getElementById("ballSpeedValue");
            if (ballSpeedValue) ballSpeedValue.textContent = this.value;
        });
    }

    if (paddleSpeedSlider) {
        paddleSpeedSlider.addEventListener("input", function() {
            const paddleSpeedValue = document.getElementById("paddleSpeedValue");
            if (paddleSpeedValue) paddleSpeedValue.textContent = this.value;
        });
    }

    if (maxScoreSlider) {
        maxScoreSlider.addEventListener("input", function() {
            const maxScoreValue = document.getElementById("maxScoreValue");
            if (maxScoreValue) maxScoreValue.textContent = this.value;
        });
    }
}

// Boucle principale
function loop(): void {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Fonction d'initialisation
function init(): void {
    // Initialisation des event listeners
    initializeEventListeners();
    
    // Configuration initiale de la difficulté
    const difficultyBtn = document.querySelector('.difficulty-btn') as HTMLElement;
    if (difficultyBtn) difficultyBtn.textContent = `Difficulté: ${difficulty}`;
    
    // Démarrer la boucle de jeu
    loop();
}

// Exposer les fonctions globalement pour les boutons HTML
(window as any).restartGame = restartGame;
(window as any).showSettings = showSettings;
(window as any).hideSettings = hideSettings;
(window as any).applySettings = applySettings;
(window as any).changeDifficulty = changeDifficulty;

// Démarrer le jeu quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}