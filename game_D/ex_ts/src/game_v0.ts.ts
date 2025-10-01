// Récupération du canvas
const canvas = document.getElementById("game") as HTMLCanvasElement;   // Cherche l’élément <canvas id="game"> et dit à TS que c’est un canvas
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;       // Demande le contexte 2D : l’API qui permet de dessiner

// Types du jeu
interface Paddle {                                                      // Déclare un type (interface) pour structurer un paddle
  x: number;                                                            // position horizontale (coin haut-gauche)
  y: number;                                                            // position verticale (coin haut-gauche)
  width: number;                                                        // largeur du paddle
  height: number;                                                       // hauteur du paddle
  dy: number;                                                           // vitesse verticale (optionnel ici, pratique si on veut inertie)
}

interface Ball {                                                        // Déclare un type (interface) pour la balle
  x: number;                                                            // centre X de la balle
  y: number;                                                            // centre Y de la balle
  radius: number;                                                       // rayon de la balle
  dx: number;                                                           // vitesse horizontale (pixels par frame)
  dy: number;                                                           // vitesse verticale (pixels par frame)
}

//Score compteurs
let scoreLeft = 0;
let scoreRight = 0;

const MAX_SCORE = 10;
let winner: string | null = null;  // null = pas encore de gagnant

// Création des entités
const paddleWidth = 10, paddleHeight = 100;                             // Constantes dimension des paddles
const leftPaddle: Paddle = {                                            // Paddle gauche
  x: 20,                                                                // à 20px du bord gauche
  y: canvas.height/2 - 50,                                              // centré verticalement (600/2 - 50 = 250)
  width: paddleWidth,
  height: paddleHeight,
  dy: 0                                                                 // vitesse verticale initiale
};
const rightPaddle: Paddle = {                                           // Paddle droit
  x: canvas.width - 30,                                                 // 30px du bord droit (10px de largeur + 20px de marge)
  y: canvas.height/2 - 50,                                              // centré verticalement
  width: paddleWidth,
  height: paddleHeight,
  dy: 0
};

const ball: Ball = {                                                    // Balle initiale au centre
  x: canvas.width/2,                                                    // centre horizontal (800/2 = 400)
  y: canvas.height/2,                                                   // centre vertical (600/2 = 300)
  radius: 10,                                                           // rayon 10
  dx: 4,                                                                // vitesse horizontale 4 px/frame (vers la droite)
  dy: 4                                                                 // vitesse verticale 4 px/frame (vers le bas)
};

// Contrôles clavier
const keys: Record<string, boolean> = {};                               // Dictionnaire des touches enfoncées : "clé" = nom de la touche, valeur = true/false
window.addEventListener("keydown", e => keys[e.key] = true);            // Quand on appuie, on marque la touche comme active
window.addEventListener("keyup", e => keys[e.key] = false);             // Quand on relâche, on la marque comme inactive

function resetBall() {
  if (winner) return;
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx = (Math.random() > 0.5 ? 4 : -4); // Repart aléatoirement à gauche ou à droite
  ball.dy = (Math.random() > 0.5 ? 4 : -4); // Et un peu vers le haut ou bas
}

// Update du jeu
function update() {                                                     // Fonction appelée à chaque frame pour faire évoluer l’état du jeu
  // Déplacement paddles
  if (keys["w"]) leftPaddle.y -= 5;                                     // Si 'w' pressée → paddle gauche monte (y diminue)
  if (keys["s"]) leftPaddle.y += 5;                                     // Si 's' pressée → paddle gauche descend (y augmente)
  if (keys["ArrowUp"]) rightPaddle.y -= 5;                              // Flèche haut → paddle droit monte
  if (keys["ArrowDown"]) rightPaddle.y += 5;                            // Flèche bas → paddle droit descend

  // Empêcher de sortir du canvas (clamping)
  leftPaddle.y = Math.max(0, Math.min(canvas.height - paddleHeight, leftPaddle.y));   // Clamp du Y entre 0 et (hauteur - paddleHeight)
  rightPaddle.y = Math.max(0, Math.min(canvas.height - paddleHeight, rightPaddle.y)); // Idem pour le paddle droit

  // Déplacement de la balle
  ball.x += ball.dx;                                                    // Avance en X selon sa vitesse horizontale
  ball.y += ball.dy;                                                    // Avance en Y selon sa vitesse verticale

  // Collision avec murs haut/bas
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) { // Si le bord de la balle dépasse en haut ou en bas
    ball.dy *= -1;                                                      // On inverse la direction verticale (rebond)
  }

  // Collision paddle gauche (test AABB simplifié : on regarde si X de la balle touche la zone du paddle et Y est dans sa hauteur)
  if (ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&         // Le bord gauche de la balle a atteint le bord droit du paddle gauche
      ball.y > leftPaddle.y &&                                          // Le centre Y de la balle est sous le haut du paddle
      ball.y < leftPaddle.y + leftPaddle.height) {                      // … et au-dessus du bas du paddle
    ball.dx *= -1;                                                      // Inverse la direction horizontale (rebond)
    ball.x = leftPaddle.x + leftPaddle.width + ball.radius;             // Repositionne la balle juste à côté du paddle pour éviter de rester coincée
  }

  // Collision paddle droit
  if (ball.x + ball.radius > rightPaddle.x &&                           // Le bord droit de la balle atteint le bord gauche du paddle droit
      ball.y > rightPaddle.y &&                                         // Centre Y dans la zone verticale du paddle
      ball.y < rightPaddle.y + rightPaddle.height) {
    ball.dx *= -1;                                                      // Inverse direction horizontale
    ball.x = rightPaddle.x - ball.radius;                               // Repositionne juste avant le paddle
  }

  // Reset si sortie de l’écran
  if (ball.x < 0) {                 // Sortie côté gauche
    scoreRight++;
    if (scoreRight >= MAX_SCORE) {
      winner = "Joueur Droite";
    }
    resetBall();
  }
  if (ball.x > canvas.width) {      // Sortie côté droit
    scoreLeft++;
    if (scoreLeft >= MAX_SCORE) {
      winner = "Joueur Gauche";
    }
    resetBall();
  }

}

// Dessin du jeu
function draw() {                                                       // Fonction appelée à chaque frame pour dessiner la scène
  ctx.clearRect(0, 0, canvas.width, canvas.height);                     // Efface tout le canvas (sinon on verrait des traînées)

    // Ligne centrale pointillée
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.setLineDash([10, 15]);                // 10px trait, 15px espace
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);                      // Reset pour que les paddles ne soient pas affectés

    // Score
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText(scoreLeft.toString(), canvas.width / 2 - 50, 50);  // Score gauche
  ctx.fillText(scoreRight.toString(), canvas.width / 2 + 50, 50); // Score droit


  // Paddles
  ctx.fillStyle = "white";                                              // Couleur blanche pour les paddles et la balle
  ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height); // Dessine le paddle gauche (rectangle plein)
  ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height); // Dessine le paddle droit

  // Balle
  ctx.beginPath();                                                      // Démarre un nouveau chemin de dessin
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);                 // Ajoute un arc complet (cercle) au chemin
  ctx.fill();                                                           // Remplit le cercle avec la couleur courante (blanc)

  //victoire message
  if (winner) {
  ctx.fillStyle = "yellow";
  ctx.font = "50px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${winner} a gagné !`, canvas.width / 2, canvas.height / 2);
}
}

// Boucle principale
function loop() {                                                       // La boucle de jeu : update → draw → replanifier
  update();                                                             // 1) Met à jour la logique (inputs, physique, collisions)
  draw();                                                               // 2) Dessine l’état courant
  requestAnimationFrame(loop);                                          // 3) Demande au navigateur d’appeler 'loop' à la prochaine frame (~60 FPS)
}

loop();                                                                 // Premier appel pour lancer la boucle
