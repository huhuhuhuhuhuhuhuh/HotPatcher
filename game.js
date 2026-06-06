const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mapCanvas = document.getElementById('mapCanvas');
const mapCtx = mapCanvas.getContext('2d');

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 450;
const MAP_SCALE = 0.15;

const TILE_SIZE = 32;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 30;

const hpBar = document.getElementById('hpBar');
const hpText = document.getElementById('hpText');
const expBar = document.getElementById('expBar');
const expText = document.getElementById('expText');
const mpBar = document.getElementById('mpBar');
const mpText = document.getElementById('mpText');
const levelText = document.getElementById('level');
const goldText = document.getElementById('gold');
const battleOverlay = document.getElementById('battleOverlay');
const battleMessage = document.getElementById('battleMessage');
const skillPanel = document.getElementById('skillPanel');
const invItems = document.getElementById('invItems');

const ENEMY_TYPES = [
    { name: '小妖', emoji: '👺', hp: 30, attack: 5, exp: 15, gold: 10 },
    { name: '狼妖', emoji: '🐺', hp: 45, attack: 8, exp: 20, gold: 15 },
    { name: '狐妖', emoji: '🦊', hp: 35, attack: 10, exp: 25, gold: 20 },
    { name: '蛇妖', emoji: '🐍', hp: 50, attack: 12, exp: 30, gold: 25 },
    { name: '蜘蛛精', emoji: '🕷️', hp: 60, attack: 15, exp: 40, gold: 30 },
    { name: '牛魔王', emoji: '🐂', hp: 150, attack: 25, exp: 100, gold: 80 },
];

const ITEMS = [
    { name: '生命药水', emoji: '🧪', effect: 'hp', value: 30 },
    { name: '魔法药水', emoji: '🧬', effect: 'mp', value: 20 },
    { name: '灵石', emoji: '💎', effect: 'gold', value: 50 },
];

let gameMap = [];
let player = {
    x: 400,
    y: 300,
    width: 24,
    height: 24,
    speed: 4,
    direction: 0,
    animFrame: 0,
    animTimer: 0,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    exp: 0,
    expToLevel: 100,
    level: 1,
    attack: 15,
    defense: 5,
    gold: 0,
    items: [
        { ...ITEMS[0], count: 3 },
        { ...ITEMS[2], count: 5 }
    ]
};

let enemies = [];
let npcs = [];
let particles = [];
let inBattle = false;
let currentEnemy = null;
let battleTurn = 'player';
let battleActionQueue = [];
let gameStarted = false;

const keys = {};

function generateMap() {
    gameMap = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        gameMap[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (y === 0 || y === MAP_HEIGHT - 1 || x === 0 || x === MAP_WIDTH - 1) {
                gameMap[y][x] = 2;
            } else if (Math.random() < 0.02) {
                gameMap[y][x] = 1;
            } else {
                gameMap[y][x] = 0;
            }
        }
    }
    for (let i = 0; i < 8; i++) {
        const x = Math.floor(Math.random() * (MAP_WIDTH - 10)) + 5;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 6)) + 3;
        if (gameMap[y][x] === 0) {
            gameMap[y][x] = 3;
            npcs.push({
                x: x * TILE_SIZE + TILE_SIZE / 2,
                y: y * TILE_SIZE + TILE_SIZE / 2,
                type: 'shop',
                emoji: '🏪'
            });
        }
    }
}

function spawnEnemies() {
    enemies = [];
    const count = 5 + Math.floor(player.level / 2);
    for (let i = 0; i < count; i++) {
        let x, y, attempts = 0;
        do {
            x = Math.floor(Math.random() * (MAP_WIDTH - 10)) + 5;
            y = Math.floor(Math.random() * (MAP_HEIGHT - 6)) + 3;
            attempts++;
        } while (gameMap[y][x] !== 0 && attempts < 50);
        
        if (gameMap[y][x] === 0) {
            const typeIndex = Math.min(
                Math.floor(Math.random() * (1 + player.level / 3)),
                ENEMY_TYPES.length - 1
            );
            const type = ENEMY_TYPES[typeIndex];
            enemies.push({
                x: x * TILE_SIZE + TILE_SIZE / 2,
                y: y * TILE_SIZE + TILE_SIZE / 2,
                ...type,
                maxHp: type.hp + player.level * 5,
                currentHp: type.hp + player.level * 5,
                moveTimer: 0,
                direction: Math.random() * Math.PI * 2
            });
        }
    }
}

function initGame() {
    generateMap();
    spawnEnemies();
    updateUI();
    gameStarted = true;
    gameLoop();
}

function updateUI() {
    hpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
    hpText.textContent = `${player.hp}/${player.maxHp}`;
    mpBar.style.width = `${(player.mp / player.maxMp) * 100}%`;
    mpText.textContent = `${player.mp}/${player.maxMp}`;
    expBar.style.width = `${(player.exp / player.expToLevel) * 100}%`;
    expText.textContent = `${player.exp}/${player.expToLevel}`;
    levelText.textContent = player.level;
    goldText.textContent = player.gold;
    
    invItems.innerHTML = player.items
        .filter(item => item.count > 0)
        .map(item => `<div class="inv-item">${item.emoji} ${item.name} x${item.count}</div>`)
        .join('');
}

function updatePlayer() {
    if (inBattle) return;
    
    let dx = 0, dy = 0;
    
    if (keys['ArrowUp'] || keys['KeyW']) dy = -1;
    if (keys['ArrowDown'] || keys['KeyS']) dy = 1;
    if (keys['ArrowLeft'] || keys['KeyA']) dx = -1;
    if (keys['ArrowRight'] || keys['KeyD']) dx = 1;
    
    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
        
        if (dy < 0) player.direction = 0;
        else if (dy > 0) player.direction = 2;
        if (dx < 0) player.direction = 3;
        if (dx > 0) player.direction = 1;
        
        const newX = player.x + dx * player.speed;
        const newY = player.y + dy * player.speed;
        
        const tileX = Math.floor(newX / TILE_SIZE);
        const tileY = Math.floor(newY / TILE_SIZE);
        
        let canMove = true;
        for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
                const tx = tileX + ox;
                const ty = tileY + oy;
                if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                    if (gameMap[ty][tx] === 2 || gameMap[ty][tx] === 1) {
                        canMove = false;
                    }
                }
            }
        }
        
        if (canMove) {
            player.x = Math.max(TILE_SIZE, Math.min(MAP_WIDTH * TILE_SIZE - TILE_SIZE, newX));
            player.y = Math.max(TILE_SIZE, Math.min(MAP_HEIGHT * TILE_SIZE - TILE_SIZE, newY));
        }
        
        player.animTimer++;
        if (player.animTimer > 8) {
            player.animTimer = 0;
            player.animFrame = (player.animFrame + 1) % 4;
        }
    }
    
    for (let enemy of enemies) {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist < 40) {
            startBattle(enemy);
            break;
        }
    }
    
    for (let npc of npcs) {
        const dist = Math.hypot(npc.x - player.x, npc.y - player.y);
        if (dist < 40 && keys['KeyE']) {
            openShop(npc);
        }
    }
}

function updateEnemies() {
    if (inBattle) return;
    
    for (let enemy of enemies) {
        enemy.moveTimer++;
        if (enemy.moveTimer > 60) {
            enemy.moveTimer = 0;
            enemy.direction = Math.random() * Math.PI * 2;
        }
        
        const dx = Math.cos(enemy.direction) * 1;
        const dy = Math.sin(enemy.direction) * 1;
        const newX = enemy.x + dx;
        const newY = enemy.y + dy;
        const tileX = Math.floor(newX / TILE_SIZE);
        const tileY = Math.floor(newY / TILE_SIZE);
        
        if (tileX > 0 && tileX < MAP_WIDTH - 1 && tileY > 0 && tileY < MAP_HEIGHT - 1) {
            if (gameMap[tileY][tileX] !== 2 && gameMap[tileY][tileX] !== 1) {
                enemy.x = newX;
                enemy.y = newY;
            } else {
                enemy.direction = Math.random() * Math.PI * 2;
            }
        }
    }
}

function startBattle(enemy) {
    inBattle = true;
    currentEnemy = enemy;
    battleOverlay.classList.add('active');
    document.getElementById('enemySprite').textContent = enemy.emoji;
    document.getElementById('enemyName').textContent = enemy.name;
    updateEnemyHP();
    battleMessage.textContent = `${enemy.name}出现了！`;
    battleTurn = 'player';
    skillPanel.style.display = 'none';
}

function updateEnemyHP() {
    const hpPercent = (currentEnemy.currentHp / currentEnemy.maxHp) * 100;
    document.getElementById('enemyHpBar').style.width = `${hpPercent}%`;
    document.getElementById('enemyHpText').textContent = `${Math.max(0, currentEnemy.currentHp)}/${currentEnemy.maxHp}`;
}

function playerAction(action, skill = null) {
    if (battleTurn !== 'player') return;
    
    skillPanel.style.display = 'none';
    
    if (action === 'attack') {
        const damage = Math.max(1, player.attack + Math.floor(Math.random() * 10) - 5);
        currentEnemy.currentHp -= damage;
        battleMessage.textContent = `你造成了 ${damage} 点伤害！`;
        document.getElementById('playerBattleSprite').classList.add('shake');
        setTimeout(() => document.getElementById('playerBattleSprite').classList.remove('shake'), 300);
        createBattleParticles(CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.35, '#ff4444');
    } else if (action === 'skill' && skill) {
        if (skill === 'eye') {
            if (player.mp >= 10) {
                player.mp -= 10;
                const damage = 25 + player.level * 5;
                currentEnemy.currentHp -= damage;
                battleMessage.textContent = `天眼发射！造成 ${damage} 点伤害！`;
                createBattleParticles(CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.35, '#ffff00');
            } else {
                battleMessage.textContent = '魔法值不足！';
                return;
            }
        } else if (skill === 'transform') {
            if (player.mp >= 20) {
                player.mp -= 20;
                const damage = 40 + player.level * 10;
                currentEnemy.currentHp -= damage;
                battleMessage.textContent = `八九玄功！造成 ${damage} 点伤害！`;
                createBattleParticles(CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.35, '#ff8800');
            } else {
                battleMessage.textContent = '魔法值不足！';
                return;
            }
        } else if (skill === 'summon') {
            if (player.mp >= 25) {
                player.mp -= 25;
                const damage = 20 + player.level * 3;
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        currentEnemy.currentHp -= damage;
                        createBattleParticles(CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.35, '#8b4513');
                    }, i * 200);
                }
                battleMessage.textContent = `哮天犬出击！连续攻击造成 ${damage * 3} 点伤害！`;
            } else {
                battleMessage.textContent = '魔法值不足！';
                return;
            }
        }
    } else if (action === 'defend') {
        battleMessage.textContent = '你进入防御姿态！';
    } else if (action === 'item') {
        const hpItem = player.items.find(i => i.effect === 'hp' && i.count > 0);
        const mpItem = player.items.find(i => i.effect === 'mp' && i.count > 0);
        if (hpItem) {
            hpItem.count--;
            const heal = Math.min(hpItem.value, player.maxHp - player.hp);
            player.hp += heal;
            battleMessage.textContent = `使用了${hpItem.name}，恢复了 ${heal} 点生命！`;
            createBattleParticles(CANVAS_WIDTH * 0.3, CANVAS_HEIGHT * 0.6, '#00ff00');
        } else if (mpItem) {
            mpItem.count--;
            const restore = Math.min(mpItem.value, player.maxMp - player.mp);
            player.mp += restore;
            battleMessage.textContent = `使用了${mpItem.name}，恢复了 ${restore} 点魔法！`;
            createBattleParticles(CANVAS_WIDTH * 0.3, CANVAS_HEIGHT * 0.6, '#00ffff');
        } else {
            battleMessage.textContent = '没有可用的道具！';
            return;
        }
    }
    
    updateEnemyHP();
    updateUI();
    
    if (currentEnemy.currentHp <= 0) {
        setTimeout(() => endBattle(true), 500);
    } else {
        battleTurn = 'enemy';
        setTimeout(enemyTurn, 1000);
    }
}

function enemyTurn() {
    let damage = currentEnemy.attack;
    if (damage < 1) damage = 1;
    player.hp -= damage;
    battleMessage.textContent = `${currentEnemy.name}攻击了你，造成 ${damage} 点伤害！`;
    document.getElementById('enemySprite').classList.add('shake');
    setTimeout(() => document.getElementById('enemySprite').classList.remove('shake'), 300);
    createBattleParticles(CANVAS_WIDTH * 0.3, CANVAS_HEIGHT * 0.6, '#ff0000');
    updateUI();
    
    if (player.hp <= 0) {
        setTimeout(() => endBattle(false), 500);
    } else {
        battleTurn = 'player';
    }
}

function endBattle(victory) {
    inBattle = false;
    battleOverlay.classList.remove('active');
    
    if (victory) {
        const expGain = currentEnemy.exp;
        const goldGain = currentEnemy.gold;
        player.exp += expGain;
        player.gold += goldGain;
        battleMessage.textContent = `胜利！获得 ${expGain} 经验，${goldGain} 金币！`;
        
        enemies = enemies.filter(e => e !== currentEnemy);
        
        if (player.exp >= player.expToLevel) {
            levelUp();
        }
    } else {
        player.hp = Math.floor(player.maxHp * 0.5);
        player.exp = Math.floor(player.exp * 0.8);
        battleMessage.textContent = '战败...损失了一半经验，生命恢复一半。';
    }
    
    updateUI();
}

function levelUp() {
    player.level++;
    player.exp -= player.expToLevel;
    player.expToLevel = Math.floor(player.expToLevel * 1.5);
    player.maxHp += 20;
    player.maxMp += 10;
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.attack += 5;
    player.defense += 2;
    battleMessage.textContent = `升级！现在是 ${player.level} 级！`;
    updateUI();
}

function createBattleParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            color: color,
            life: 1,
            size: Math.random() * 6 + 3
        });
    }
}

function openShop(npc) {
    const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    if (player.gold >= item.value) {
        player.gold -= item.value;
        const existingItem = player.items.find(i => i.name === item.name);
        if (existingItem) {
            existingItem.count++;
        } else {
            player.items.push({ ...item, count: 1 });
        }
        battleMessage.textContent = `购买了 ${item.name}！`;
        updateUI();
    } else {
        battleMessage.textContent = '金币不足！';
    }
}

function drawMap() {
    const offsetX = player.x - CANVAS_WIDTH / 2;
    const offsetY = player.y - CANVAS_HEIGHT / 2;
    
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const screenX = x * TILE_SIZE - offsetX;
            const screenY = y * TILE_SIZE - offsetY;
            
            if (screenX < -TILE_SIZE || screenX > CANVAS_WIDTH ||
                screenY < -TILE_SIZE || screenY > CANVAS_HEIGHT) continue;
            
            const tile = gameMap[y][x];
            
            if (tile === 0) {
                ctx.fillStyle = (x + y) % 2 === 0 ? '#2a4a2a' : '#2a5a2a';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            } else if (tile === 1) {
                ctx.fillStyle = '#3a6a3a';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#4a8a4a';
                ctx.beginPath();
                ctx.arc(screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, 8, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === 2) {
                ctx.fillStyle = '#4a4a6a';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#5a5a7a';
                ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else if (tile === 3) {
                ctx.fillStyle = '#4a4a2a';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function drawPlayer() {
    const offsetX = player.x - CANVAS_WIDTH / 2;
    const offsetY = player.y - CANVAS_HEIGHT / 2;
    const screenX = player.x - offsetX;
    const screenY = player.y - offsetY;
    
    ctx.save();
    ctx.translate(screenX, screenY);
    
    const bobY = player.animTimer > 0 ? Math.sin(player.animFrame * 0.5) * 2 : 0;
    
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(-12, -14 + bobY, 24, 28);
    
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(-10, -16 + bobY, 20, 8);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-6, -14 + bobY, 12, 4);
    
    ctx.fillStyle = '#4a3728';
    ctx.beginPath();
    ctx.arc(0, -4 + bobY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(-8, 4 + bobY, 16, 16);
    
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(-6, 6 + bobY, 12, 4);
    
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(-10, 18 + bobY, 6, 8);
    ctx.fillRect(4, 18 + bobY, 6, 8);
    
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(10, -2 + bobY, 20, 4);
    ctx.fillRect(26, -6 + bobY, 4, 12);
    ctx.fillRect(28, -10 + bobY, 4, 6);
    
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(0, -18 + bobY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawEnemies() {
    const offsetX = player.x - CANVAS_WIDTH / 2;
    const offsetY = player.y - CANVAS_HEIGHT / 2;
    
    for (let enemy of enemies) {
        const screenX = enemy.x - offsetX;
        const screenY = enemy.y - offsetY;
        
        if (screenX < -50 || screenX > CANVAS_WIDTH + 50 ||
            screenY < -50 || screenY > CANVAS_HEIGHT + 50) continue;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        
        ctx.font = '28px Arial';
        ctx.fillText(enemy.emoji, -14, 10);
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-15, 15, 30, 4);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(-15, 15, 30 * (enemy.currentHp / enemy.maxHp), 4);
        
        ctx.restore();
    }
}

function drawNPCs() {
    const offsetX = player.x - CANVAS_WIDTH / 2;
    const offsetY = player.y - CANVAS_HEIGHT / 2;
    
    for (let npc of npcs) {
        const screenX = npc.x - offsetX;
        const screenY = npc.y - offsetY;
        
        if (screenX < -50 || screenX > CANVAS_WIDTH + 50 ||
            screenY < -50 || screenY > CANVAS_HEIGHT + 50) continue;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        
        ctx.font = '28px Arial';
        ctx.fillText(npc.emoji, -14, 10);
        
        ctx.fillStyle = '#ffcc00';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('E', -4, -15);
        
        ctx.restore();
    }
}

function drawParticles() {
    for (let p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life -= 0.03;
        return p.life > 0;
    });
}

function drawMinimap() {
    mapCtx.fillStyle = '#1a1a2e';
    mapCtx.fillRect(0, 0, 150, 100);
    
    const scaleX = 150 / (MAP_WIDTH * TILE_SIZE);
    const scaleY = 100 / (MAP_HEIGHT * TILE_SIZE);
    
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = gameMap[y][x];
            if (tile === 2) {
                mapCtx.fillStyle = '#4a4a6a';
                mapCtx.fillRect(x * TILE_SIZE * scaleX, y * TILE_SIZE * scaleY, 
                               TILE_SIZE * scaleX, TILE_SIZE * scaleY);
            } else if (tile === 1) {
                mapCtx.fillStyle = '#3a6a3a';
                mapCtx.fillRect(x * TILE_SIZE * scaleX, y * TILE_SIZE * scaleY,
                               TILE_SIZE * scaleX, TILE_SIZE * scaleY);
            }
        }
    }
    
    for (let enemy of enemies) {
        mapCtx.fillStyle = '#ff4444';
        mapCtx.beginPath();
        mapCtx.arc(enemy.x * scaleX, enemy.y * scaleY, 3, 0, Math.PI * 2);
        mapCtx.fill();
    }
    
    for (let npc of npcs) {
        mapCtx.fillStyle = '#ffcc00';
        mapCtx.beginPath();
        mapCtx.arc(npc.x * scaleX, npc.y * scaleY, 3, 0, Math.PI * 2);
        mapCtx.fill();
    }
    
    mapCtx.fillStyle = '#00ff00';
    mapCtx.beginPath();
    mapCtx.arc(player.x * scaleX, player.y * scaleY, 4, 0, Math.PI * 2);
    mapCtx.fill();
}

function gameLoop() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (!inBattle) {
        updatePlayer();
        updateEnemies();
    }
    updateParticles();
    
    drawMap();
    drawNPCs();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawMinimap();
    
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

document.querySelectorAll('.battle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'skill') {
            skillPanel.style.display = skillPanel.style.display === 'none' ? 'flex' : 'none';
        } else {
            playerAction(action);
        }
    });
});

document.querySelectorAll('.skill-btn-item').forEach(btn => {
    btn.addEventListener('click', () => {
        playerAction('skill', btn.dataset.skill);
    });
});

window.hideSkillPanel = function() {
    skillPanel.style.display = 'none';
};

initGame();