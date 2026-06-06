const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const health1 = document.getElementById('health1');
const health2 = document.getElementById('health2');
const healthText1 = document.getElementById('healthText1');
const healthText2 = document.getElementById('healthText2');
const gameStatus = document.getElementById('gameStatus');
const restartBtn = document.getElementById('restartBtn');

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const GROUND_HEIGHT = 60;

class Mech {
    constructor(x, y, color, isPlayer1) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 80;
        this.color = color;
        this.isPlayer1 = isPlayer1;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 5;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpForce = -15;
        this.gravity = 0.8;
        this.isAttacking = false;
        this.attackFrame = 0;
        this.isBlocking = false;
        this.blockTimer = 0;
        this.facingRight = !isPlayer1;
        this.animationFrame = 0;
        this.attackCooldown = 0;
        this.blockCooldown = 0;
    }

    update(keys, otherMech) {
        this.velocityX = 0;
        
        if (!this.isAttacking && !this.isBlocking) {
            if (this.isPlayer1) {
                if (keys['ArrowLeft']) this.velocityX = -this.speed;
                if (keys['ArrowRight']) this.velocityX = this.speed;
                if (keys['ArrowUp'] && !this.isJumping) {
                    this.velocityY = this.jumpForce;
                    this.isJumping = true;
                }
                if (keys['KeyJ'] && this.attackCooldown <= 0) {
                    this.attack(otherMech);
                }
                if (keys['KeyK'] && this.blockCooldown <= 0) {
                    this.block();
                }
            } else {
                if (keys['KeyA']) this.velocityX = -this.speed;
                if (keys['KeyD']) this.velocityX = this.speed;
                if (keys['KeyW'] && !this.isJumping) {
                    this.velocityY = this.jumpForce;
                    this.isJumping = true;
                }
                if (keys['KeyF'] && this.attackCooldown <= 0) {
                    this.attack(otherMech);
                }
                if (keys['KeyG'] && this.blockCooldown <= 0) {
                    this.block();
                }
            }
        }

        if (this.velocityX !== 0) {
            this.facingRight = this.velocityX > 0;
        }

        this.x += this.velocityX;
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        if (this.y >= CANVAS_HEIGHT - GROUND_HEIGHT - this.height) {
            this.y = CANVAS_HEIGHT - GROUND_HEIGHT - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }

        if (this.x < 0) this.x = 0;
        if (this.x > CANVAS_WIDTH - this.width) this.x = CANVAS_WIDTH - this.width;

        if (this.isAttacking) {
            this.attackFrame++;
            if (this.attackFrame >= 15) {
                this.isAttacking = false;
                this.attackFrame = 0;
            }
        }

        if (this.isBlocking) {
            this.blockTimer++;
            if (this.blockTimer >= 30) {
                this.isBlocking = false;
                this.blockTimer = 0;
                this.blockCooldown = 60;
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.blockCooldown > 0) this.blockCooldown--;

        this.animationFrame = (this.animationFrame + 0.1) % 4;
    }

    attack(otherMech) {
        this.isAttacking = true;
        this.attackCooldown = 40;
        
        const attackRange = 80;
        const attackBox = {
            x: this.facingRight ? this.x + this.width : this.x - attackRange + this.width,
            y: this.y + 10,
            width: attackRange,
            height: this.height - 20
        };

        const otherBox = {
            x: otherMech.x,
            y: otherMech.y,
            width: otherMech.width,
            height: otherMech.height
        };

        if (this.checkCollision(attackBox, otherBox)) {
            if (otherMech.isBlocking) {
                createHitEffect(otherMech.x + otherMech.width/2, otherMech.y + otherMech.height/2, 'block');
            } else {
                const damage = 15 + Math.random() * 10;
                otherMech.takeDamage(damage);
                createHitEffect(otherBox.x + otherBox.width/2, otherBox.y + otherBox.height/2, 'hit');
            }
        }
    }

    block() {
        this.isBlocking = true;
        this.blockTimer = 0;
    }

    takeDamage(damage) {
        if (!this.isBlocking) {
            this.health -= damage;
            if (this.health < 0) this.health = 0;
            this.updateHealthBar();
        }
    }

    updateHealthBar() {
        if (this.isPlayer1) {
            health1.style.width = `${(this.health / this.maxHealth) * 100}%`;
            healthText1.textContent = `${Math.floor(this.health)}/${this.maxHealth}`;
        } else {
            health2.style.width = `${(this.health / this.maxHealth) * 100}%`;
            healthText2.textContent = `${Math.floor(this.health)}/${this.maxHealth}`;
        }
    }

    checkCollision(box1, box2) {
        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    }

    draw() {
        ctx.save();
        
        const px = this.x;
        const py = this.y;
        const c = this.color;

        ctx.fillStyle = '#333';
        ctx.fillRect(px + 5, py + 5, 50, 70);
        
        ctx.fillStyle = c;
        ctx.fillRect(px + 8, py + 8, 12, 12);
        ctx.fillRect(px + 40, py + 8, 12, 12);
        
        ctx.fillStyle = '#666';
        ctx.fillRect(px + 10, py + 25, 10, 35);
        ctx.fillRect(px + 40, py + 25, 10, 35);
        
        ctx.fillStyle = '#555';
        ctx.fillRect(px + 20, py + 20, 20, 45);
        
        ctx.fillStyle = c;
        ctx.fillRect(px + 22, py + 22, 16, 15);
        
        ctx.fillStyle = '#444';
        ctx.fillRect(px + 15, py + 50, 30, 18);
        
        ctx.fillStyle = '#888';
        ctx.fillRect(px + 8, py + 60, 12, 15);
        ctx.fillRect(px + 40, py + 60, 12, 15);

        if (this.isAttacking) {
            const armOffset = Math.sin(this.attackFrame * 0.5) * 10;
            if (this.facingRight) {
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(px + 50, py + 25 + armOffset, 25, 8);
                ctx.fillStyle = '#ff3300';
                ctx.fillRect(px + 70, py + 20 + armOffset, 12, 18);
            } else {
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(px - 15, py + 25 + armOffset, 25, 8);
                ctx.fillStyle = '#ff3300';
                ctx.fillRect(px - 27, py + 20 + armOffset, 12, 18);
            }
        }

        if (this.isBlocking) {
            if (this.facingRight) {
                ctx.fillStyle = 'rgba(100, 150, 255, 0.7)';
                ctx.fillRect(px + 55, py, 15, this.height);
                ctx.fillStyle = 'rgba(150, 200, 255, 0.5)';
                ctx.fillRect(px + 50, py, 10, this.height);
            } else {
                ctx.fillStyle = 'rgba(100, 150, 255, 0.7)';
                ctx.fillRect(px - 5, py, 15, this.height);
                ctx.fillStyle = 'rgba(150, 200, 255, 0.5)';
                ctx.fillRect(px, py, 10, this.height);
            }
        }

        ctx.fillStyle = '#fff';
        const eyeOffset = Math.floor(this.animationFrame) % 2;
        ctx.fillRect(px + 10, py + 10 + eyeOffset, 6, 6);
        ctx.fillRect(px + 44, py + 10 + eyeOffset, 6, 6);

        ctx.restore();
    }
}

let particles = [];

function createHitEffect(x, y, type) {
    const colors = type === 'hit' ? ['#ff4444', '#ff8844', '#ffcc44'] : ['#4488ff', '#88ccff', '#ffffff'];
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            size: Math.random() * 4 + 2
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        p.vy += 0.2;
        return p.life > 0;
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
}

function drawBackground() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let i = 0; i < 50; i++) {
        const x = (i * 73 + Date.now() * 0.01) % CANVAS_WIDTH;
        const y = (i * 37) % (CANVAS_HEIGHT - GROUND_HEIGHT);
        const size = (i % 3) + 1;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (i % 5) * 0.1})`;
        ctx.fillRect(x, y, size, size);
    }

    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    
    ctx.fillStyle = '#3a3a5a';
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.fillRect(i, CANVAS_HEIGHT - GROUND_HEIGHT, 20, 5);
        ctx.fillRect(i + 30, CANVAS_HEIGHT - GROUND_HEIGHT + 20, 10, 5);
    }

    ctx.fillStyle = '#4a4a6a';
    for (let i = 0; i < CANVAS_WIDTH; i += 80) {
        ctx.fillRect(i, CANVAS_HEIGHT - GROUND_HEIGHT + 40, 60, 10);
    }

    ctx.fillStyle = '#555';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT - 2, CANVAS_WIDTH, 2);
}

const keys = {};
let player1, player2;
let gameOver = false;
let winner = null;

function initGame() {
    player1 = new Mech(100, CANVAS_HEIGHT - GROUND_HEIGHT - 80, '#ff4444', true);
    player2 = new Mech(640, CANVAS_HEIGHT - GROUND_HEIGHT - 80, '#4444ff', false);
    gameOver = false;
    winner = null;
    gameStatus.textContent = '战斗开始!';
    gameStatus.classList.remove('pulse');
    restartBtn.style.display = 'none';
    particles = [];
}

function gameLoop() {
    drawBackground();
    
    if (!gameOver) {
        player1.update(keys, player2);
        player2.update(keys, player1);
        
        if (player1.health <= 0) {
            gameOver = true;
            winner = '玩家 2';
            gameStatus.textContent = winner + ' 胜利!';
            gameStatus.classList.add('pulse');
            restartBtn.style.display = 'block';
        } else if (player2.health <= 0) {
            gameOver = true;
            winner = '玩家 1';
            gameStatus.textContent = winner + ' 胜利!';
            gameStatus.classList.add('pulse');
            restartBtn.style.display = 'block';
        }
    }

    player1.draw();
    player2.draw();
    
    updateParticles();
    drawParticles();
    
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

restartBtn.addEventListener('click', initGame);

initGame();
gameLoop();