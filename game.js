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
    width: 50,
    height: 70,
    speed: 4,
    direction: 1,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    level: 1,
    exp: 0,
    expToLevel: 100,
    gold: 0,
    attack: 15,
    defense: 5,
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
    }
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
    const count = 6 + Math.floor(Math.random() * 3);
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
            hp: 30 + player.level * 5,
            maxHp: 30 + player.level * 5,
            attack: 5 + player.level * 2,
            moveSpeed: 1 + Math.random()
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
        ctx.shadowBlur = 25;
    }
    
    if (player.direction < 0) {
        ctx.translate(screenX + player.width, screenY);
        ctx.scale(-1, 1);
    } else {
        ctx.translate(screenX, screenY);
    }
    
    if (player.transformed) ctx.scale(1.2, 1.2);
    
    // 绘制二郎神
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(15, 25);
    ctx.quadraticCurveTo(40, 30, 35, 65);
    ctx.quadraticCurveTo(30, 70, 15, 60);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(10, 20, 30, 40);
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(13, 25, 24, 6);
    ctx.fillRect(13, 38, 24, 6);
    
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(8, 8, 34, 15);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(10, 10, 30, 4);
    ctx.beginPath();
    ctx.arc(25, 5, 5, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = player.transformed ? '#FF0000' : '#FF4444';
    ctx.beginPath();
    ctx.arc(25, 3, 3, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#F5DEB3';
    ctx.beginPath();
    ctx.arc(25, 28, 10, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 26, 3, 3);
    ctx.fillRect(27, 26, 3, 3);
    
    ctx.fillStyle = '#4A3728';
    ctx.fillRect(12, 58, 8, 12);
    ctx.fillRect(30, 58, 8, 12);
    
    ctx.fillStyle = '#8B7355';
    if (player.isAttacking) {
        ctx.save();
        ctx.translate(40, 30);
        ctx.rotate(-0.4 + Math.sin(player.attackTimer * 0.3) * 0.6);
        ctx.fillRect(0, -3, 35, 6);
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(30, -10);
        ctx.lineTo(45, 0);
        ctx.lineTo(30, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    } else {
        ctx.fillRect(40, 20, 30, 5);
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(65, 15);
        ctx.lineTo(75, 22.5);
        ctx.lineTo(65, 30);
        ctx.closePath();
        ctx.fill();
    }
    
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
    
    if (player.isAttacking) {
        player.attackTimer++;
        if (player.attackTimer > 20) {
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
        
        if (dist < 180 && dist > 40) {
            enemy.x += (dx / dist) * enemy.moveSpeed;
            enemy.y += (dy / dist) * enemy.moveSpeed;
        }
        
        if (dist < 50 && !player.invincible) {
            const damage = Math.max(1, enemy.attack - player.defense/2);
            player.hp -= damage;
            player.invincible = true;
            player.invincibleTimer = 40;
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
        <div class="map-card ${player.level < m.level ? 'locked' : ''}" data-map="${m.key}">
            <div class="map-info">
                <span class="map-emoji">${m.emoji}</span>
                <div>
                    <div class="map-name">${m.name}</div>
                    <div class="map-level">Lv.${m.level}+</div>
                </div>
            </div>
        </div>
    `).join('');
    
    mapList.querySelectorAll('.map-card:not(.locked)').forEach(card => {
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
