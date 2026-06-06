console.log("Game starting...");

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 550;
const TILE_SIZE = 40;
const MAP_WIDTH = 23;
const MAP_HEIGHT = 14;

// 游戏状态
let gameMap = [];
let currentMap = 'huaguo';
let player = {
    x: 450,
    y: 300,
    width: 65,
    height: 85,
    speed: 4,
    direction: 1,
    hp: 680,
    maxHp: 680,
    mp: 340,
    maxMp: 340,
    level: 30,
    exp: 0,
    expToLevel: 10000,
    gold: 1000,
    attack: 160,
    defense: 63,
    isAttacking: false,
    attackTimer: 0,
    invincible: false,
    invincibleTimer: 0,
    transformed: false,
    transformTimer: 0,
    cooldowns: {
        eye: 0,
        transform: 0,
        summon: 0
    },
    animFrame: 0,
    animTimer: 0,
    isMoving: false
};

let enemies = [];
let particles = [];
let drops = [];
let keys = {};
let cameraX = 0;
let cameraY = 0;

// 初始化
function generateMap() {
    gameMap = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        gameMap[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (y === 0 || y === MAP_HEIGHT - 1 || x === 0 || x === MAP_WIDTH - 1) {
                gameMap[y][x] = 1;
            } else if (Math.random() < 0.08) {
                gameMap[y][x] = 1;
            } else {
                gameMap[y][x] = 0;
            }
        }
    }
}

function spawnEnemies() {
    enemies = [];
    const count = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
        let x, y;
        let attempts = 0;
        do {
            x = Math.floor(Math.random() * (MAP_WIDTH - 6) + 3) * TILE_SIZE + TILE_SIZE/2;
            y = Math.floor(Math.random() * (MAP_HEIGHT - 4) + 2) * TILE_SIZE + TILE_SIZE/2;
            attempts++;
        } while (gameMap[Math.floor(y/TILE_SIZE)] && 
                 gameMap[Math.floor(y/TILE_SIZE)][Math.floor(x/TILE_SIZE)] === 1 && 
                 attempts < 30);
        
        const types = ['🐒', '🐺', '🦊', '🐍'];
        enemies.push({
            x: x,
            y: y,
            emoji: types[Math.floor(Math.random() * types.length)],
            hp: 100 + player.level * 8,
            maxHp: 100 + player.level * 8,
            attack: 10 + player.level * 3,
            moveSpeed: 1.5 + Math.random() * 1.5,
            attackCooldown: 0
        });
    }
}

function updateUI() {
    document.getElementById('hpBar').style.width = (player.hp / player.maxHp * 100) + '%';
    document.getElementById('hpText').textContent = Math.floor(player.hp) + '/' + player.maxHp;
    document.getElementById('mpBar').style.width = (player.mp / player.maxMp * 100) + '%';
    document.getElementById('mpText').textContent = Math.floor(player.mp) + '/' + player.maxMp;
    document.getElementById('level').textContent = player.level;
    document.getElementById('gold').textContent = player.gold;
}

// 绘制函数
function drawMap() {
    ctx.fillStyle = '#1a3a2a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    cameraX = player.x - CANVAS_WIDTH/2 + player.width/2;
    cameraY = player.y - CANVAS_HEIGHT/2 + player.height/2;
    cameraX = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - CANVAS_WIDTH, cameraX));
    cameraY = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - CANVAS_HEIGHT, cameraY));
    
    const startX = Math.floor(cameraX / TILE_SIZE);
    const startY = Math.floor(cameraY / TILE_SIZE);
    const endX = Math.min(startX + Math.ceil(CANVAS_WIDTH/TILE_SIZE) + 2, MAP_WIDTH);
    const endY = Math.min(startY + Math.ceil(CANVAS_HEIGHT/TILE_SIZE) + 2, MAP_HEIGHT);
    
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            if (y < 0 || y >= MAP_HEIGHT || x < 0 || x >= MAP_WIDTH) continue;
            const screenX = x * TILE_SIZE - cameraX;
            const screenY = y * TILE_SIZE - cameraY;
            const tile = gameMap[y][x];
            
            if (tile === 0) {
                ctx.fillStyle = (x + y) % 2 === 0 ? '#2a5a3a' : '#254a35';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#3a3a5a';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#5a5a7a';
                ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            }
        }
    }
}

function drawPlayer() {
    const screenX = player.x - cameraX;
    const screenY = player.y - cameraY;
    
    ctx.save();
    
    if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.6;
    }
    if (player.transformed) {
        ctx.shadowColor = '#FF8C00';
        ctx.shadowBlur = 40;
    }
    
    // 计算动画偏移
    let legOffset = 0;
    let bodyBob = 0;
    let capeWave = 0;
    if (player.isMoving) {
        legOffset = Math.sin(player.animFrame * 0.8) * 5;
        bodyBob = Math.abs(Math.sin(player.animFrame * 0.8)) * 2;
        capeWave = Math.sin(player.animFrame * 0.6 + Date.now() * 0.01) * 3;
    }
    
    if (player.direction < 0) {
        ctx.translate(screenX + player.width, screenY);
        ctx.scale(-1, 1);
    } else {
        ctx.translate(screenX, screenY);
    }
    
    const scale = player.transformed ? 1.3 : 1.1;
    ctx.scale(scale, scale);
    
    // ============ 绘制二郎神，带完整动画 ====================
    
    // 1. 红色披风（带飘动动画）
    ctx.fillStyle = '#8B2222';
    ctx.beginPath();
    ctx.moveTo(22, 15 + bodyBob);
    ctx.quadraticCurveTo(55 + capeWave, 30 + bodyBob, 52 + capeWave * 0.7, 85);
    ctx.quadraticCurveTo(47 + capeWave * 0.5, 93, 22, 80);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#B32424';
    ctx.beginPath();
    ctx.moveTo(25, 17 + bodyBob);
    ctx.quadraticCurveTo(52 + capeWave * 0.8, 32 + bodyBob, 49 + capeWave * 0.6, 82);
    ctx.quadraticCurveTo(44 + capeWave * 0.4, 88, 25, 77);
    ctx.closePath();
    ctx.fill();
    
    // 2. 双腿（带行走动画）
    ctx.fillStyle = '#2A2020';
    ctx.fillRect(18, 58 + legOffset, 11, 22 - legOffset);
    ctx.fillRect(36, 58 - legOffset, 11, 22 + legOffset);
    
    // 3. 靴子
    ctx.fillStyle = '#4A3A30';
    ctx.fillRect(15, 76 + legOffset, 16, 8);
    ctx.fillRect(34, 76 - legOffset, 16, 8);
    
    // 4. 身体铠甲（带轻微上下起伏）
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(15, 23 + bodyBob, 35, 38);
    
    ctx.fillStyle = '#C99E37';
    ctx.fillRect(18, 26 + bodyBob, 29, 10);
    ctx.fillRect(18, 44 + bodyBob, 29, 12);
    
    ctx.fillStyle = '#E6C247';
    ctx.fillRect(21, 28 + bodyBob, 23, 6);
    ctx.fillRect(21, 46 + bodyBob, 23, 6);
    
    // 5. 肩膀护肩
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.moveTo(12, 22 + bodyBob);
    ctx.quadraticCurveTo(5, 18 + bodyBob, 10, 32 + bodyBob);
    ctx.lineTo(15, 35 + bodyBob);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(53, 22 + bodyBob);
    ctx.quadraticCurveTo(60, 18 + bodyBob, 55, 32 + bodyBob);
    ctx.lineTo(50, 35 + bodyBob);
    ctx.closePath();
    ctx.fill();
    
    // 6. 手臂
    ctx.fillStyle = '#2A2020';
    ctx.fillRect(9, 30 + bodyBob, 8, 18);
    ctx.fillRect(48, 30 + bodyBob, 8, 18);
    
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(8, 43 + bodyBob, 10, 10);
    ctx.fillRect(47, 43 + bodyBob, 10, 10);
    
    // 7. 头冠（三山冠）
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(12, 0 + bodyBob, 41, 20);
    
    ctx.beginPath();
    ctx.moveTo(32, -8 + bodyBob);
    ctx.lineTo(21, 3 + bodyBob);
    ctx.lineTo(43, 3 + bodyBob);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(32, 4 + bodyBob, 8, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#E6C247';
    ctx.fillRect(15, 2 + bodyBob, 35, 8);
    ctx.fillRect(18, 12 + bodyBob, 29, 5);
    
    // 8. 天眼（发光动画）
    const eyeGlow = player.transformed ? 0.3 + Math.sin(Date.now() * 0.01) * 0.2 : 0;
    ctx.fillStyle = player.transformed ? '#FF3333' : '#CC2222';
    ctx.beginPath();
    ctx.ellipse(32, 7 + bodyBob, 8, 10, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(32, 9 + bodyBob, 5, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(32, 9 + bodyBob, 2.5, 0, Math.PI*2);
    ctx.fill();
    
    if (player.transformed) {
        ctx.strokeStyle = '#FF6600';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(32, 9 + bodyBob, 13, 0, Math.PI*2);
        ctx.stroke();
        
        // 天眼发光效果
        ctx.fillStyle = `rgba(255, 150, 0, ${eyeGlow})`;
        ctx.beginPath();
        ctx.arc(32, 9 + bodyBob, 20, 0, Math.PI*2);
        ctx.fill();
    }
    
    // 9. 头发
    ctx.fillStyle = '#3D2817';
    ctx.beginPath();
    ctx.ellipse(32, 26 + bodyBob, 15, 13, 0, 0, Math.PI*2);
    ctx.fill();
    
    // 10. 脸
    ctx.fillStyle = '#E8C89C';
    ctx.beginPath();
    ctx.arc(32, 30 + bodyBob, 11, 0, Math.PI*2);
    ctx.fill();
    
    // 11. 眉毛
    ctx.strokeStyle = '#3D2817';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(23, 27 + bodyBob);
    ctx.lineTo(28, 26 + bodyBob);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(36, 26 + bodyBob);
    ctx.lineTo(41, 27 + bodyBob);
    ctx.stroke();
    
    // 12. 眼睛（眨眼睛动画）
    const blinkFrame = Math.floor(Date.now() / 2000) % 50;
    if (blinkFrame < 3) {
        ctx.fillStyle = '#E8C89C';
        ctx.fillRect(22, 26 + bodyBob, 8, 6);
        ctx.fillRect(34, 26 + bodyBob, 8, 6);
    } else {
        ctx.fillStyle = '#111';
        ctx.fillRect(24, 28 + bodyBob, 4, 4);
        ctx.fillRect(36, 28 + bodyBob, 4, 4);
        
        ctx.fillStyle = '#FFF';
        ctx.fillRect(24, 28 + bodyBob, 1.5, 1.5);
        ctx.fillRect(36, 28 + bodyBob, 1.5, 1.5);
    }
    
    // 13. 鼻子
    ctx.fillStyle = '#D8B088';
    ctx.fillRect(31, 32 + bodyBob, 2.5, 4);
    
    // 14. 胡须
    ctx.fillStyle = '#3D2817';
    ctx.fillRect(29, 36 + bodyBob, 5, 4);
    ctx.fillRect(27, 36 + bodyBob, 3, 3);
    ctx.fillRect(34, 36 + bodyBob, 3, 3);
    
    // 15. 腰带
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(12, 56 + bodyBob, 41, 6);
    
    ctx.fillStyle = '#CC9900';
    ctx.beginPath();
    ctx.arc(32, 59 + bodyBob, 8, 0, Math.PI*2);
    ctx.fill();
    
    // 16. 武器：三尖两刃刀（攻击动画）
    ctx.save();
    let weaponAngle = -0.35;
    let weaponX = 58;
    let weaponY = 32 + bodyBob;
    
    if (player.isAttacking) {
        const attackProgress = player.attackTimer / 25;
        const swingCurve = Math.sin(attackProgress * Math.PI);
        weaponAngle = -0.35 - swingCurve * 1.2;
        weaponX = 56 + Math.cos(attackProgress * Math.PI * 2) * 10;
        weaponY = 40 + bodyBob + Math.sin(attackProgress * Math.PI * 2) * 8;
    }
    
    ctx.translate(weaponX, weaponY);
    ctx.rotate(weaponAngle);
    
    // 刀柄
    ctx.fillStyle = '#5C3A1D';
    ctx.fillRect(0, -4, 55, 8);
    
    // 武器装饰
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(-3, -5, 7, 10);
    
    // 刀刃
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.moveTo(50, -12);
    ctx.lineTo(72, 0);
    ctx.lineTo(50, 12);
    ctx.lineTo(58, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#D8D8D8';
    ctx.beginPath();
    ctx.moveTo(53, -8);
    ctx.lineTo(67, 0);
    ctx.lineTo(53, 8);
    ctx.closePath();
    ctx.fill();
    
    // 攻击特效
    if (player.isAttacking && player.attackTimer > 5 && player.attackTimer < 15) {
        ctx.fillStyle = `rgba(255, 200, 0, ${(1 - Math.abs(player.attackTimer - 10)/10) * 0.5})`;
        ctx.beginPath();
        ctx.arc(75, 0, 25, 0, Math.PI*2);
        ctx.fill();
    }
    
    ctx.restore();
    
    ctx.restore();
}

function drawEnemies() {
    for (let enemy of enemies) {
        const screenX = enemy.x - cameraX;
        const screenY = enemy.y - cameraY;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.emoji, 0, 0);
        
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-25, 25, 50, 8);
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(-25, 25, 50 * (enemy.hp / enemy.maxHp), 8);
        
        ctx.restore();
    }
}

function drawParticles() {
    for (let p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - cameraX - p.size/2, p.y - cameraY - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

function drawDrops() {
    for (let drop of drops) {
        const screenX = drop.x - cameraX;
        const screenY = drop.y - cameraY;
        
        ctx.save();
        ctx.translate(screenX, screenY + Math.sin(Date.now() * 0.005) * 4);
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(drop.emoji, 0, 0);
        ctx.restore();
    }
}

function createHitParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5)*8, vy: (Math.random() - 0.5)*8,
            color: color, life: 1, size: Math.random()*4 + 2
        });
    }
}

function createFloatingText(x, y, text, color) {
    const container = document.getElementById('floatingTexts');
    const div = document.createElement('div');
    div.className = 'floating-text';
    div.textContent = text;
    div.style.color = color;
    div.style.left = (x - cameraX) + 'px';
    div.style.top = (y - cameraY) + 'px';
    container.appendChild(div);
    setTimeout(() => div.remove(), 1000);
}

// 更新
function updatePlayer() {
    let dx = 0, dy = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
    if (keys['KeyD'] || keys['ArrowRight']) dx = 1;
    if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
    if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
    
    player.isMoving = (dx !== 0 || dy !== 0);
    
    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len; dy /= len;
        if (dx !== 0) player.direction = dx > 0 ? 1 : -1;
        
        const newX = player.x + dx * player.speed;
        const newY = player.y + dy * player.speed;
        
        let canMoveX = true, canMoveY = true;
        const checkX = Math.floor(newX / TILE_SIZE);
        const checkY = Math.floor(newY / TILE_SIZE);
        if (gameMap[checkY] && gameMap[checkY][checkX] === 1) canMoveX = false;
        if (gameMap[Math.floor((newY + player.height)/TILE_SIZE)] && 
            gameMap[Math.floor((newY + player.height)/TILE_SIZE)][checkX] === 1) canMoveY = false;
        
        if (canMoveX) player.x = Math.max(TILE_SIZE, Math.min(MAP_WIDTH*TILE_SIZE - TILE_SIZE - player.width, newX));
        if (canMoveY) player.y = Math.max(TILE_SIZE, Math.min(MAP_HEIGHT*TILE_SIZE - TILE_SIZE - player.height, newY));
    }
    
    // 更新动画帧
    if (player.isMoving || player.isAttacking) {
        player.animTimer++;
        if (player.animTimer > 5) {
            player.animTimer = 0;
            player.animFrame = (player.animFrame + 1) % 8;
        }
    }
    
    if (player.isAttacking) {
        player.attackTimer++;
        if (player.attackTimer > 25) {
            player.isAttacking = false;
            player.attackTimer = 0;
        }
    }
    
    if (player.invincible) {
        player.invincibleTimer--;
        if (player.invincibleTimer <= 0) player.invincible = false;
    }
    if (player.transformed) {
        player.transformTimer--;
        if (player.transformTimer <= 0) player.transformed = false;
    }
    
    for (let key in player.cooldowns) {
        if (player.cooldowns[key] > 0) player.cooldowns[key]--;
    }
    
    if (player.mp < player.maxMp) player.mp += 0.02;
}

function updateEnemies() {
    for (let enemy of enemies) {
        const dx = player.x + player.width/2 - enemy.x;
        const dy = player.y + player.height/2 - enemy.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 250 && dist > 50) {
            enemy.x += (dx / dist) * enemy.moveSpeed;
            enemy.y += (dy / dist) * enemy.moveSpeed;
        }
        
        if (enemy.attackCooldown > 0) {
            enemy.attackCooldown--;
        }
        
        if (dist < 60 && !player.invincible && enemy.attackCooldown <= 0) {
            const damage = Math.max(5, enemy.attack - player.defense/2);
            player.hp -= damage;
            player.invincible = true;
            player.invincibleTimer = 30;
            enemy.attackCooldown = 40;
            createFloatingText(player.x, player.y, '-' + Math.floor(damage), '#FF4444');
            createHitParticles(player.x, player.y, '#FF4444');
            
            if (player.hp <= 0) {
                player.hp = player.maxHp;
                player.x = 450;
                player.y = 300;
            }
            updateUI();
        }
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.03;
        return p.life > 0;
    });
}

function checkDeadEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].hp <= 0) {
            const exp = 15;
            const gold = 10;
            player.exp += exp;
            player.gold += gold;
            createFloatingText(enemies[i].x, enemies[i].y - 20, '+' + exp + ' EXP', '#00FF00');
            
            if (Math.random() < 0.15) {
                drops.push({ x: enemies[i].x, y: enemies[i].y, emoji: '💰', type: 'gold', value: 20, life: 300 });
            }
            enemies.splice(i, 1);
            
            if (player.exp >= player.expToLevel) {
                player.level++;
                player.exp -= player.expToLevel;
                player.expToLevel = Math.floor(player.expToLevel * 1.5);
                player.maxHp += 20;
                player.maxMp += 10;
                player.hp = player.maxHp;
                player.mp = player.maxMp;
                player.attack += 5;
                player.defense += 2;
                createFloatingText(player.x, player.y - 30, '升级! Lv.' + player.level, '#FFD700');
            }
            updateUI();
        }
    }
}

function checkDropCollection() {
    for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i];
        drop.life--;
        const dist = Math.sqrt((drop.x - player.x - player.width/2) ** 2 + 
                               (drop.y - player.y - player.height/2) ** 2);
        if (dist < 50) {
            if (drop.type === 'gold') {
                player.gold += drop.value;
                createFloatingText(player.x, player.y, '+' + drop.value, '#FFD700');
            }
            drops.splice(i, 1);
            updateUI();
        } else if (drop.life <= 0) {
            drops.splice(i, 1);
        }
    }
}

function useSkill(skill) {
    switch (skill) {
        case 'attack':
            player.isAttacking = true;
            player.attackTimer = 0;
            for (let enemy of enemies) {
                const dist = Math.sqrt((enemy.x - player.x - player.width/2) ** 2 + 
                                       (enemy.y - player.y - player.height/2) ** 2);
                if (dist < 80) {
                    const damage = player.attack * (player.transformed ? 2 : 1);
                    enemy.hp -= damage;
                    createHitParticles(enemy.x, enemy.y, '#FFD700');
                    createFloatingText(enemy.x, enemy.y - 20, '-' + damage, '#FFD700');
                }
            }
            break;
        case 'eye':
            if (player.cooldowns.eye <= 0 && player.mp >= 10) {
                player.cooldowns.eye = 180;
                player.mp -= 10;
                for (let enemy of enemies) {
                    const dist = Math.sqrt((enemy.x - player.x - player.width/2) ** 2 + 
                                           (enemy.y - player.y - player.height/2) ** 2);
                    if (dist < 200) {
                        const damage = 30 + player.level * 4;
                        enemy.hp -= damage;
                        createHitParticles(enemy.x, enemy.y, '#FF0000');
                        createFloatingText(enemy.x, enemy.y - 20, '-' + damage, '#FF0000');
                    }
                }
                createFloatingText(player.x, player.y - 20, '天眼!', '#FF0000');
                updateUI();
            }
            break;
        case 'transform':
            if (player.cooldowns.transform <= 0 && player.mp >= 20) {
                player.cooldowns.transform = 300;
                player.mp -= 20;
                player.transformed = true;
                player.transformTimer = 180;
                player.invincible = true;
                player.invincibleTimer = 180;
                createFloatingText(player.x, player.y - 30, '八九玄功!', '#FF8C00');
                updateUI();
            }
            break;
        case 'summon':
            if (player.cooldowns.summon <= 0 && player.mp >= 25) {
                player.cooldowns.summon = 180;
                player.mp -= 25;
                for (let enemy of enemies) {
                    const damage = 20 + player.level * 3;
                    enemy.hp -= damage;
                    createHitParticles(enemy.x, enemy.y, '#8B4513');
                    createFloatingText(enemy.x, enemy.y - 20, '-' + damage, '#8B4513');
                }
                createFloatingText(player.x, player.y - 30, '啸天犬!', '#8B4513');
                updateUI();
            }
            break;
    }
}

function updateCooldowns() {
    const cd2 = document.getElementById('cd2');
    const cd3 = document.getElementById('cd3');
    const cd4 = document.getElementById('cd4');
    cd2.style.height = (player.cooldowns.eye / 180 * 100) + '%';
    cd3.style.height = (player.cooldowns.transform / 300 * 100) + '%';
    cd4.style.height = (player.cooldowns.summon / 180 * 100) + '%';
}

function gameLoop() {
    updatePlayer();
    updateEnemies();
    updateParticles();
    checkDeadEnemies();
    checkDropCollection();
    updateCooldowns();
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawMap();
    drawDrops();
    drawEnemies();
    drawPlayer();
    drawParticles();
    
    requestAnimationFrame(gameLoop);
}

function initGame() {
    console.log("Initializing game...");
    generateMap();
    spawnEnemies();
    updateUI();
    console.log("Game initialized! Starting loop...");
    gameLoop();
}

// 事件
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyJ') useSkill('attack');
    if (e.code === 'KeyK') useSkill('eye');
    if (e.code === 'KeyL') useSkill('transform');
    if (e.code === 'Space') {
        e.preventDefault();
        useSkill('summon');
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
});

document.addEventListener('keyup', (e) => keys[e.code] = false);

document.getElementById('mapBtn').addEventListener('click', () => {
    const mapSelect = document.getElementById('mapSelect');
    mapSelect.classList.toggle('active');
    
    const mapList = document.getElementById('mapList');
    const maps = [
        {key: 'huaguo', name: '花果山', emoji: '🌸', level: 1},
        {key: 'qitian', name: '齐云洞', emoji: '⛰️', level: 5},
        {key: 'huoshan', name: '火焰山', emoji: '🔥', level: 10},
        {key: 'longgong', name: '龙宫', emoji: '🌊', level: 15},
        {key: 'tianting', name: '天庭', emoji: '☁️', level: 20}
    ];
    
    mapList.innerHTML = maps.map(m => `
        <div class="map-card" data-map="${m.key}">
            <div class="map-info">
                <span class="map-emoji">${m.emoji}</span>
                <div>
                    <div class="map-name">${m.name}</div>
                    <div class="map-level">Lv.${m.level}+</div>
                </div>
            </div>
        </div>
    `).join('');
    
    mapList.querySelectorAll('.map-card').forEach(card => {
        card.addEventListener('click', () => {
            currentMap = card.dataset.map;
            generateMap();
            spawnEnemies();
            player.x = 450; player.y = 300;
            document.getElementById('mapSelect').classList.remove('active');
            document.getElementById('locationName').textContent = maps.find(m => m.key === currentMap).name;
            updateUI();
        });
    });
});

document.getElementById('closeMapBtn').addEventListener('click', () => {
    document.getElementById('mapSelect').classList.remove('active');
});

// 启动
initGame();
