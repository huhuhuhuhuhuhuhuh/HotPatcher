const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const healthBar = document.getElementById('health');
const healthText = document.getElementById('healthText');
const gameStatus = document.getElementById('gameStatus');
const levelText = document.getElementById('level');
const restartBtn = document.getElementById('restartBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const cooldownEye = document.getElementById('cooldownEye');
const cooldownTransform = document.getElementById('cooldownTransform');
const cooldownDog = document.getElementById('cooldownDog');

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;
const GROUND_HEIGHT = 80;

class ErlangShen {
    constructor() {
        this.x = 100;
        this.y = CANVAS_HEIGHT - GROUND_HEIGHT - 80;
        this.width = 60;
        this.height = 80;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 6;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpForce = -18;
        this.gravity = 0.9;
        this.isAttacking = false;
        this.attackFrame = 0;
        this.facingRight = true;
        this.animationFrame = 0;
        this.attackCooldown = 0;
        
        this.isFlying = false;
        this.flyTimer = 0;
        
        this.skillEyeCooldown = 0;
        this.skillTransformCooldown = 0;
        this.skillDogCooldown = 0;
        
        this.isTransforming = false;
        this.transformTimer = 0;
        this.transformed = false;
        
        this.dog = null;
        this.eyeBeams = [];
    }

    update(keys) {
        this.velocityX = 0;
        
        if (!this.isAttacking) {
            if (keys['ArrowLeft']) {
                this.velocityX = -this.speed;
                this.facingRight = false;
            }
            if (keys['ArrowRight']) {
                this.velocityX = this.speed;
                this.facingRight = true;
            }
            if (keys['ArrowUp']) {
                if (this.isFlying) {
                    this.velocityY = -4;
                } else if (!this.isJumping) {
                    this.velocityY = this.jumpForce;
                    this.isJumping = true;
                    this.isFlying = true;
                    this.flyTimer = 60;
                }
            }
            if (keys['KeyJ'] && this.attackCooldown <= 0) {
                this.attack();
            }
            if (keys['KeyK'] && this.skillEyeCooldown <= 0) {
                this.useEye();
            }
            if (keys['KeyL'] && this.skillTransformCooldown <= 0) {
                this.useTransform();
            }
            if (keys['Space'] && this.skillDogCooldown <= 0) {
                this.summonDog();
            }
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

        if (this.isFlying) {
            this.flyTimer--;
            if (this.flyTimer <= 0) {
                this.isFlying = false;
            }
        }

        if (this.isAttacking) {
            this.attackFrame++;
            if (this.attackFrame >= 12) {
                this.isAttacking = false;
                this.attackFrame = 0;
            }
        }

        if (this.isTransforming) {
            this.transformTimer++;
            if (this.transformTimer >= 30) {
                this.isTransforming = false;
                this.transformed = true;
                this.transformTimer = 600;
            }
        }

        if (this.transformed) {
            this.transformTimer--;
            if (this.transformTimer <= 0) {
                this.transformed = false;
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.skillEyeCooldown > 0) this.skillEyeCooldown--;
        if (this.skillTransformCooldown > 0) this.skillTransformCooldown--;
        if (this.skillDogCooldown > 0) this.skillDogCooldown--;

        this.animationFrame = (this.animationFrame + 0.1) % 4;

        this.eyeBeams = this.eyeBeams.filter(beam => {
            beam.x += beam.vx;
            return beam.x > -50 && beam.x < CANVAS_WIDTH + 50;
        });

        if (this.dog) {
            this.dog.update();
            if (this.dog.health <= 0) this.dog = null;
        }
    }

    attack() {
        this.isAttacking = true;
        this.attackCooldown = 20;
        
        const attackRange = this.transformed ? 100 : 70;
        const attackDamage = this.transformed ? 30 : 15;
        
        const attackBox = {
            x: this.facingRight ? this.x + this.width : this.x - attackRange + this.width,
            y: this.y + 10,
            width: attackRange,
            height: this.height - 20
        };

        enemies.forEach(enemy => {
            const enemyBox = {
                x: enemy.x,
                y: enemy.y,
                width: enemy.width,
                height: enemy.height
            };
            
            if (this.checkCollision(attackBox, enemyBox)) {
                enemy.takeDamage(attackDamage);
                createHitEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 'hit');
            }
        });
    }

    useEye() {
        this.skillEyeCooldown = 120;
        
        this.eyeBeams.push({
            x: this.facingRight ? this.x + this.width : this.x - 10,
            y: this.y + 25,
            vx: this.facingRight ? 15 : -15,
            width: 10,
            height: 6,
            damage: this.transformed ? 25 : 15
        });
    }

    useTransform() {
        this.isTransforming = true;
        this.transformTimer = 0;
        this.skillTransformCooldown = 300;
    }

    summonDog() {
        this.dog = new XiaotianQuan(this.x + (this.facingRight ? this.width : -50), this.y + 30, this.facingRight);
        this.skillDogCooldown = 240;
    }

    takeDamage(damage) {
        if (!this.transformed) {
            this.health -= damage;
            if (this.health < 0) this.health = 0;
            this.updateHealthBar();
        }
    }

    updateHealthBar() {
        healthBar.style.width = `${(this.health / this.maxHealth) * 100}%`;
        healthText.textContent = `${Math.floor(this.health)}/${this.maxHealth}`;
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
        const size = this.transformed ? 1.3 : 1;
        
        ctx.scale(size, size);
        const drawX = size > 1 ? px - this.width * 0.15 : px;
        const drawY = size > 1 ? py - this.height * 0.15 : py;

        if (this.isTransforming) {
            ctx.globalAlpha = 0.5 + Math.sin(this.transformTimer * 0.3) * 0.5;
        }

        if (this.transformed) {
            ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
            ctx.fillRect(drawX - 10, drawY - 10, this.width + 20, this.height + 20);
        }

        ctx.fillStyle = '#c9a227';
        ctx.fillRect(drawX + 10, drawY, 40, 5);
        
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(drawX + 15, drawY - 8, 30, 12);
        
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(drawX + 22, drawY - 5, 16, 6);
        
        ctx.fillStyle = '#4a3728';
        ctx.beginPath();
        ctx.arc(drawX + 20, drawY + 25, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(drawX + 15, drawY + 35, 30, 35);
        
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(drawX + 18, drawY + 38, 24, 8);
        
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(drawX + 12, drawY + 68, 12, 15);
        ctx.fillRect(drawX + 36, drawY + 68, 12, 15);
        
        if (!this.isAttacking) {
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(drawX + 35, drawY + 25, 35, 6);
            ctx.fillRect(drawX + 65, drawY + 20, 4, 16);
            ctx.fillRect(drawX + 68, drawY + 15, 4, 8);
        } else {
            const armAngle = Math.sin(this.attackFrame * 0.5) * 0.5;
            ctx.save();
            ctx.translate(drawX + 50, drawY + 40);
            ctx.rotate(this.facingRight ? armAngle : -armAngle);
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(0, -3, 40, 6);
            ctx.fillRect(35, -8, 6, 18);
            ctx.fillRect(38, -12, 6, 8);
            ctx.restore();
        }

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(drawX + 30, drawY - 2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(drawX + 16, drawY + 22, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(drawX + 24, drawY + 22, 3, 0, Math.PI * 2);
        ctx.fill();

        if (this.isFlying) {
            ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
            ctx.fillRect(drawX + 5, drawY + 60, 10, 10);
            ctx.fillRect(drawX + 45, drawY + 60, 10, 10);
        }

        ctx.restore();

        this.eyeBeams.forEach(beam => {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(beam.x, beam.y, beam.width, beam.height);
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(beam.x + 2, beam.y + 1, beam.width - 4, beam.height - 2);
        });

        if (this.dog) {
            this.dog.draw();
        }
    }
}

class XiaotianQuan {
    constructor(x, y, facingRight) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.health = 50;
        this.speed = 8;
        this.facingRight = facingRight;
        this.target = null;
        this.barkTimer = 0;
    }

    update() {
        if (!this.target || this.target.health <= 0) {
            this.target = enemies.find(e => e.health > 0 && 
                (this.facingRight ? e.x > this.x : e.x < this.x));
        }

        if (this.target) {
            if (this.target.x > this.x + this.width) {
                this.x += this.speed;
                this.facingRight = true;
            } else if (this.target.x + this.target.width < this.x) {
                this.x -= this.speed;
                this.facingRight = false;
            }

            const attackRange = 30;
            const dx = Math.abs(this.target.x - this.x);
            if (dx < attackRange + this.width) {
                this.barkTimer++;
                if (this.barkTimer >= 30) {
                    this.target.takeDamage(10);
                    createHitEffect(this.target.x + this.target.width/2, this.target.y + this.target.height/2, 'hit');
                    this.barkTimer = 0;
                }
            }
        }

        if (this.y < CANVAS_HEIGHT - GROUND_HEIGHT - this.height) {
            this.y += 5;
        }
    }

    draw() {
        const px = this.x;
        const py = this.y;

        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.ellipse(px + 20, py + 15, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#d2691e';
        ctx.fillRect(px + 5, py + 5, 8, 8);
        ctx.fillRect(px + 27, py + 5, 8, 8);
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px + 14, py + 12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + 26, py + 12, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(px + 14, py + 12, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + 26, py + 12, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff69b4';
        ctx.fillRect(px + 8, py + 20, 5, 3);
        ctx.fillRect(px + 27, py + 20, 5, 3);
        
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(px + 8, py + 24, 6, 5);
        ctx.fillRect(px + 26, py + 24, 6, 5);
    }
}

class Enemy {
    constructor(x, type = 'normal') {
        this.x = x;
        this.y = CANVAS_HEIGHT - GROUND_HEIGHT - 60;
        this.type = type;
        this.width = type === 'boss' ? 100 : 50;
        this.height = type === 'boss' ? 90 : 55;
        
        if (type === 'boss') {
            this.health = 300;
            this.maxHealth = 300;
            this.speed = 2;
            this.damage = 20;
            this.color = '#8b0000';
        } else if (type === 'elite') {
            this.health = 80;
            this.maxHealth = 80;
            this.speed = 3;
            this.damage = 12;
            this.color = '#9400d3';
        } else {
            this.health = 40;
            this.maxHealth = 40;
            this.speed = 4;
            this.damage = 8;
            this.color = '#4a4a4a';
        }
        
        this.attackFrame = 0;
        this.attackTimer = 0;
        this.facingRight = false;
        this.animationFrame = 0;
    }

    update(player) {
        if (this.x > player.x + player.width) {
            this.x -= this.speed;
            this.facingRight = false;
        } else if (this.x + this.width < player.x) {
            this.x += this.speed;
            this.facingRight = true;
        }

        this.attackTimer++;
        const attackInterval = this.type === 'boss' ? 60 : 45;
        
        if (this.attackTimer >= attackInterval) {
            this.attack(player);
            this.attackTimer = 0;
        }

        if (this.isAttacking) {
            this.attackFrame++;
            if (this.attackFrame >= 15) {
                this.isAttacking = false;
                this.attackFrame = 0;
            }
        }

        this.animationFrame = (this.animationFrame + 0.1) % 4;
    }

    attack(player) {
        this.isAttacking = true;
        
        const attackRange = this.type === 'boss' ? 80 : 40;
        const attackBox = {
            x: this.facingRight ? this.x + this.width : this.x - attackRange + this.width,
            y: this.y + 5,
            width: attackRange,
            height: this.height - 10
        };

        const playerBox = {
            x: player.x,
            y: player.y,
            width: player.width,
            height: player.height
        };

        if (player.checkCollision(attackBox, playerBox)) {
            player.takeDamage(this.damage);
            createHitEffect(player.x + player.width/2, player.y + player.height/2, 'hit');
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }

    draw() {
        const px = this.x;
        const py = this.y;
        const c = this.color;

        ctx.fillStyle = c;
        ctx.fillRect(px + 5, py + 5, this.width - 10, this.height - 10);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(px + 10, py, this.width - 20, 8);
        
        ctx.fillStyle = '#666';
        ctx.fillRect(px + 8, py + 15, 8, this.height - 25);
        ctx.fillRect(px + this.width - 16, py + 15, 8, this.height - 25);
        
        ctx.fillStyle = '#fff';
        const eyeOffset = Math.floor(this.animationFrame) % 2;
        ctx.fillRect(px + 15, py + 10 + eyeOffset, 6, 6);
        ctx.fillRect(px + this.width - 27, py + 10 + eyeOffset, 6, 6);
        
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(px + this.width/2 - 5, py + 25, 10, 8);

        if (this.isAttacking) {
            ctx.fillStyle = '#ff6600';
            if (this.facingRight) {
                ctx.fillRect(px + this.width, py + 15, 25, 6);
            } else {
                ctx.fillRect(px - 25, py + 15, 25, 6);
            }
        }

        if (this.type !== 'normal') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(px, py, this.width, this.height);
        }

        ctx.fillStyle = '#333';
        ctx.fillRect(px, py + this.height - 5, this.width, 5);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(px, py + this.height - 5, (this.health / this.maxHealth) * this.width, 5);
    }
}

let particles = [];

function createHitEffect(x, y, type) {
    const colors = type === 'hit' ? ['#ff4444', '#ff8844', '#ffcc44'] : ['#4488ff', '#88ccff', '#ffffff'];
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            size: Math.random() * 3 + 2
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        p.vy += 0.15;
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

    for (let i = 0; i < 60; i++) {
        const x = (i * 83 + Date.now() * 0.008) % CANVAS_WIDTH;
        const y = (i * 47) % (CANVAS_HEIGHT - GROUND_HEIGHT);
        const size = (i % 3) + 1;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + (i % 5) * 0.1})`;
        ctx.fillRect(x, y, size, size);
    }

    ctx.fillStyle = '#1a4a2a';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    
    ctx.fillStyle = '#2a6a3a';
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
        ctx.fillRect(i, CANVAS_HEIGHT - GROUND_HEIGHT, 25, 5);
        ctx.fillRect(i + 40, CANVAS_HEIGHT - GROUND_HEIGHT + 25, 15, 8);
    }

    ctx.fillStyle = '#3a8a4a';
    for (let i = 0; i < CANVAS_WIDTH; i += 100) {
        ctx.fillRect(i, CANVAS_HEIGHT - GROUND_HEIGHT + 45, 80, 12);
    }

    ctx.fillStyle = '#2a5a3a';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT - 2, CANVAS_WIDTH, 2);
}

const keys = {};
let player;
let enemies = [];
let gameOver = false;
let level = 1;
let levelComplete = false;
let enemiesDefeated = 0;
let totalEnemies = 5;

function initLevel(levelNum) {
    enemies = [];
    enemiesDefeated = 0;
    
    const enemyTypes = ['normal', 'normal', 'normal', 'elite', 'boss'];
    const count = Math.min(3 + levelNum, 8);
    
    for (let i = 0; i < count; i++) {
        const type = i === count - 1 && levelNum > 1 ? 'boss' : 
                     i >= count - 2 && levelNum > 1 ? 'elite' : 'normal';
        enemies.push(new Enemy(CANVAS_WIDTH - 100 - i * 100, type));
    }
    
    totalEnemies = count;
    levelComplete = false;
    nextLevelBtn.style.display = 'none';
}

function initGame() {
    player = new ErlangShen();
    level = 1;
    levelText.textContent = level;
    gameOver = false;
    gameStatus.textContent = '第 1 关 - 迎战小妖!';
    gameStatus.classList.remove('pulse');
    restartBtn.style.display = 'none';
    nextLevelBtn.style.display = 'none';
    particles = [];
    initLevel(1);
}

function gameLoop() {
    drawBackground();
    
    if (!gameOver && !levelComplete) {
        player.update(keys);
        
        enemies.forEach(enemy => {
            enemy.update(player);
        });

        player.eyeBeams.forEach(beam => {
            enemies.forEach(enemy => {
                const beamBox = {
                    x: beam.x,
                    y: beam.y,
                    width: beam.width,
                    height: beam.height
                };
                const enemyBox = {
                    x: enemy.x,
                    y: enemy.y,
                    width: enemy.width,
                    height: enemy.height
                };
                if (player.checkCollision(beamBox, enemyBox)) {
                    enemy.takeDamage(beam.damage);
                    createHitEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 'hit');
                    beam.x = -100;
                }
            });
        });

        enemies = enemies.filter(e => e.health > 0);
        enemiesDefeated = totalEnemies - enemies.length;

        if (enemies.length === 0) {
            levelComplete = true;
            gameStatus.textContent = '关卡通过!';
            gameStatus.classList.add('pulse');
            nextLevelBtn.style.display = 'block';
        }

        if (player.health <= 0) {
            gameOver = true;
            gameStatus.textContent = '游戏结束!';
            gameStatus.classList.add('pulse');
            restartBtn.style.display = 'block';
        }
    }

    player.draw();
    
    enemies.forEach(enemy => {
        enemy.draw();
    });
    
    updateParticles();
    drawParticles();

    cooldownEye.textContent = player.skillEyeCooldown > 0 ? Math.ceil(player.skillEyeCooldown / 60) : '';
    cooldownTransform.textContent = player.skillTransformCooldown > 0 ? Math.ceil(player.skillTransformCooldown / 60) : '';
    cooldownDog.textContent = player.skillDogCooldown > 0 ? Math.ceil(player.skillDogCooldown / 60) : '';
    
    requestAnimationFrame(gameLoop);
}

function nextLevel() {
    level++;
    levelText.textContent = level;
    player.health = Math.min(player.health + 30, player.maxHealth);
    player.updateHealthBar();
    gameStatus.textContent = `第 ${level} 关 - 强敌来袭!`;
    gameStatus.classList.remove('pulse');
    nextLevelBtn.style.display = 'none';
    initLevel(level);
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
nextLevelBtn.addEventListener('click', nextLevel);

initGame();
gameLoop();