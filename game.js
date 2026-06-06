const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 40;
const MAP_WIDTH = 23;
const MAP_HEIGHT = 14;

const MAPS = {
    huaguo: {
        name: '花果山',
        bgColor: '#1a3a2a',
        groundColor: '#2a5a3a',
        minLevel: 1,
        emoji: '🌸'
    },
    qitian: {
        name: '齐云洞',
        bgColor: '#2a2a4a',
        groundColor: '#4a4a6a',
        minLevel: 5,
        emoji: '⛰️'
    },
    huoshan: {
        name: '火焰山',
        bgColor: '#3a2a2a',
        groundColor: '#6a4a3a',
        minLevel: 10,
        emoji: '🔥'
    },
    longgong: {
        name: '龙宫',
        bgColor: '#1a2a4a',
        groundColor: '#3a5a6a',
        minLevel: 15,
        emoji: '🌊'
    },
    tianting: {
        name: '天庭',
        bgColor: '#3a3a5a',
        groundColor: '#6a6a8a',
        minLevel: 20,
        emoji: '☁️'
    }
};

const ENEMY_TYPES = [
    { name: '小猴', emoji: '🐒', hp: 30, attack: 5, exp: 15, gold: 10 },
    { name: '狼妖', emoji: '🐺', hp: 45, attack: 8, exp: 20, gold: 15 },
    { name: '狐妖', emoji: '🦊', hp: 55, attack: 10, exp: 28, gold: 20 },
    { name: '蛇妖', emoji: '🐍', hp: 70, attack: 13, exp: 38, gold: 28 },
    { name: '蜘蛛精', emoji: '🕷️', hp: 85, attack: 15, exp: 48, gold: 38 },
    { name: '牛魔王', emoji: '🐂', hp: 150, attack: 20, exp: 100, gold: 80 },
    { name: '孙悟空', emoji: '🐵', hp: 200, attack: 25, exp: 150, gold: 120 }
];

const EQUIPMENT = {
    weapons: [
        { name: '铁剑', emoji: '⚔️', atk: 5 },
        { name: '三尖枪', emoji: '🔱', atk: 12 },
        { name: '方天戟', emoji: '⚔️', atk: 22 },
        { name: '金箍棒', emoji: '🎋', atk: 35 },
        { name: '开天神斧', emoji: '🪓', atk: 50 }
    ],
    armors: [
        { name: '布甲', emoji: '👘', def: 3 },
        { name: '皮甲', emoji: '🥋', def: 8 },
        { name: '锁子甲', emoji: '🛡️', def: 15 },
        { name: '银鳞甲', emoji: '⚔️', def: 28 },
        { name: '金甲神装', emoji: '🏅', def: 45 }
    ],
    accessories: [
        { name: '护符', emoji: '📿', crit: 5 },
        { name: '天眼珠', emoji: '👁️', crit: 12 },
        { name: '啸天牙', emoji: '🦷', crit: 20 },
        { name: '金刚圈', emoji: '💍', crit: 10, atk: 5 }
    ]
};

let gameMap = [];
let currentMap = 'huaguo';
let player = {
    x: 450,
    y: 300,
    width: 50,
    height: 70,
    speed: 4,
    direction: 1,
    animFrame: 0,
    animTimer: 0,
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
    crit: 10,
    weapon: null,
    armor: null,
    accessory: null,
    isAttacking: false,
    attackTimer: 0,
    attackCooldown: 0,
    invincible: false,
    invincibleTimer: 0,
    transformed: false,
    transformTimer: 0,
    cooldowns: {
        eye: 0,
        transform: 0,
        summon: 0 }
};

let enemies = [];
let particles = [];
let drops = [];
let floatingTexts = [];
let cameraX = 0;
let cameraY = 0;
let keys = {};

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
    const map = MAPS[currentMap];
    const count = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
        let x, y, attempts = 0;
        do {
            x = Math.floor(Math.random() * (MAP_WIDTH - 6) + 3;
            y = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
            attempts++;
        } while (gameMap[y][x] !== 0 && attempts < 30);
        if (gameMap[y][x] === 0) {
            const typeIndex = Math.min(Math.floor(Math.random() * (1 + player.level / 3)), ENEMY_TYPES.length - 1);
            const type = ENEMY_TYPES[Math.max(0, typeIndex)];
            enemies.push({
                x: x * TILE_SIZE + TILE_SIZE / 2,
                y: y * TILE_SIZE + TILE_SIZE / 2,
                ...type,
                maxHp: type.hp * (1 + (player.level - 1) * 0.2),
                currentHp: type.hp * (1 + (player.level - 1) * 0.2),
                moveTimer: 0,
                direction: Math.random() * Math.PI * 2,
                moveSpeed: 1 + Math.random(),
                isAttacking: false,
                attackTimer: 0,
                animFrame: 0,
                animTimer: 0
            });
        }
    }
}

function initGame() {
    generateMap();
    spawnEnemies();
    updateUI();
    renderMapList();
    gameLoop();
}

function updateUI() {
    document.getElementById('hpBar').style.width = `${(player.hp / player.maxHp) * 100}%`;
    document.getElementById('hpText').textContent = `${Math.floor(player.hp)}/${player.maxHp}`;
    document.getElementById('mpBar').style.width = `${(player.mp / player.maxMp) * 100}%`;
    document.getElementById('mpText').textContent = `${Math.floor(player.mp)}/${player.maxMp}`;
    document.getElementById('level').textContent = player.level;
    document.getElementById('gold').textContent = player.gold;
    document.getElementById('weaponIcon').textContent = player.weapon ? player.weapon.emoji : '⚔️';
    document.getElementById('armorIcon').textContent = player.armor ? player.armor.emoji : '🛡️';
    document.getElementById('accessoryIcon').textContent = player.accessory ? player.accessory.emoji : '💍';
    document.getElementById('locationName').textContent = MAPS[currentMap].name;
    updateCooldowns();
}

function updateCooldowns() {
    const cd2 = document.getElementById('cd2');
    const cd3 = document.getElementById('cd3');
    const cd4 = document.getElementById('cd4');
    cd2.style.height = `${(player.cooldowns.eye / 3) * 100}%`;
    cd3.style.height = `${(player.cooldowns.transform / 300) * 100}%`;
    cd4.style.height = `${(player.cooldowns.summon / 180) * 100}%`;
}

function getTotalAttack() {
    let atk = player.attack;
    if (player.weapon) atk += player.weapon.atk;
    if (player.accessory && player.accessory.atk) atk += player.accessory.atk;
    if (player.transformed) atk *= 2;
    return atk;
}

function getTotalDefense() {
    let def = player.defense;
    if (player.armor) def += player.armor.def;
    return def;
}

function getTotalCrit() {
    let crit = player.crit;
    if (player.accessory) crit += player.accessory.crit || 0;
    return crit;
}

function updatePlayer() {
    let dx = 0, dy = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
    if (keys['KeyD'] || keys['ArrowRight']) dx = 1;
    if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
    if (keys['KeyS'] || keys['ArrowDown']) dy = 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
        if (dx !== 0) player.direction = dx > 0 ? 1 : -1;
        const newX = player.x + dx * player.speed;
        const newY = player.y + dy * player.speed;
        const tileX1 = Math.floor(newX / TILE_SIZE);
        const tileY1 = Math.floor((newY + player.height - 10) / TILE_SIZE);
        const tileY2 = Math.floor((newY + 10) / TILE_SIZE);
        let canMove = true;
        for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
                const tx = Math.floor((newX + (player.direction > 0 ? player.width - 5 : 5)) / TILE_SIZE) + ox;
                const ty = Math.floor((newY + player.height / 2) / TILE_SIZE) + oy;
                if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                    if (gameMap[ty][tx] === 1) canMove = false;
                }
            }
        }
        if (canMove) {
            player.x = Math.max(TILE_SIZE, Math.min(MAP_WIDTH * TILE_SIZE - TILE_SIZE - player.width, newX));
            player.y = Math.max(TILE_SIZE, Math.min(MAP_HEIGHT * TILE_SIZE - TILE_SIZE - player.height, newY));
        }
        player.animTimer++;
        if (player.animTimer > 6) {
            player.animTimer = 0;
            player.animFrame = (player.animFrame + 1) % 4;
        }
    }

    if (player.isAttacking) {
        player.attackTimer++;
        if (player.attackTimer > 20) {
            player.isAttacking = false;
            player.attackTimer = 0;
        }
    }
    if (player.attackCooldown > 0) player.attackCooldown--;

    for (let key in player.cooldowns) {
        if (player.cooldowns[key] > 0) player.cooldowns[key]--;
    }

    if (player.invincible) {
        player.invincibleTimer--;
        if (player.invincibleTimer <= 0) player.invincible = false;
    }

    if (player.transformed) {
        player.transformTimer--;
        if (player.transformTimer <= 0) {
            player.transformed = false;
        }
    }

    if (player.mp < player.maxMp) {
        player.mp += 0.02;
    }
}

function updateEnemies() {
    for (let enemy of enemies) {
        enemy.animTimer++;
        if (enemy.animTimer > 8) {
            enemy.animTimer = 0;
            enemy.animFrame = (enemy.animFrame + 1) % 2;
        }
        const distToPlayer = Math.hypot(enemy.x - player.x - player.width / 2, enemy.y - player.y - player.height / 2);
        if (distToPlayer < 180) {
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            enemy.direction = angle;
            const newX = enemy.x + Math.cos(angle) * enemy.moveSpeed;
            const newY = enemy.y + Math.sin(angle) * enemy.moveSpeed;
            const tileX = Math.floor(newX / TILE_SIZE);
            const tileY = Math.floor(newY / TILE_SIZE);
            if (tileX > 0 && tileX < MAP_WIDTH - 1 && tileY > 0 && tileY < MAP_HEIGHT - 1) {
                if (gameMap[tileY][tileX] !== 1) {
                    enemy.x = newX;
                    enemy.y = newY;
                }
            }
            if (distToPlayer < 50 && !player.invincible) {
                const damage = Math.max(1, enemy.attack - getTotalDefense() / 2);
                player.hp -= damage;
                player.invincible = true;
                player.invincibleTimer = 40;
                createFloatingText(player.x + player.width / 2, player.y, `-${Math.floor(damage)}`, '#FF4444');
                createHitParticles(player.x + player.width / 2, player.y + player.height / 2, '#FF4444');
                if (player.hp <= 0) {
                    player.hp = player.maxHp;
                    player.x = 450;
                    player.y = 300;
                    player.exp = Math.floor(player.exp * 0.5);
                    createFloatingText(player.x + player.width / 2, player.y, '复活!', '#FF0000');
                }
                updateUI();
            }
        } else {
            enemy.moveTimer++;
            if (enemy.moveTimer > 60) {
                enemy.moveTimer = 0;
                enemy.direction = Math.random() * Math.PI * 2;
            }
            const newX = enemy.x + Math.cos(enemy.direction) * enemy.moveSpeed * 0.5;
            const newY = enemy.y + Math.sin(enemy.direction) * enemy.moveSpeed * 0.5;
            const tileX = Math.floor(newX / TILE_SIZE);
            const tileY = Math.floor(newY / TILE_SIZE);
            if (tileX > 0 && tileX < MAP_WIDTH - 1 && tileY > 0 && tileY < MAP_HEIGHT - 1) {
                if (gameMap[tileY][tileX] !== 1) {
                    enemy.x = newX;
                    enemy.y = newY;
                } else {
                    enemy.direction = Math.random() * Math.PI * 2;
                }
            }
        }
    }
}

function useSkill(skill) {
    switch (skill) {
        case 'attack':
            if (player.attackCooldown <= 0) {
                player.isAttacking = true;
                player.attackCooldown = 15;
                for (let enemy of enemies) {
                    const dist = Math.hypot(enemy.x - player.x - player.width / 2, enemy.y - player.y - player.height / 2);
                    if (dist < 80) {
                        const damage = getTotalAttack();
                        enemy.currentHp -= damage;
                        createHitParticles(enemy.x, enemy.y, '#FFD700');
                        createFloatingText(enemy.x, enemy.y - 20, `-${damage}`, '#FFD700');
                    }
                }
            }
            break;
        case 'eye':
            if (player.cooldowns.eye <= 0 && player.mp >= 10) {
                player.cooldowns.eye = 180;
                player.mp -= 10;
                const beamX = player.x + (player.direction > 0 ? player.width : 0);
                const beamY = player.y + 25;
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        for (let enemy of enemies) {
                            const dist = Math.hypot(enemy.x - beamX, enemy.y - beamY);
                            if (dist < 200) {
                                const damage = 30 + player.level * 4;
                                enemy.currentHp -= damage;
                                createHitParticles(enemy.x, enemy.y, '#FF0000');
                                createFloatingText(enemy.x, enemy.y - 20, `-${damage}`, '#FF0000');
                            }
                            createEyeBeamParticles(beamX, beamY);
                        }
                    }, i * 40);
                }
                createFloatingText(player.x + player.width / 2, player.y - 20, '天眼!', '#FF0000');
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
                createFloatingText(player.x + player.width / 2, player.y - 30, '八九玄功!', '#FF8C00');
                updateUI();
            }
            break;
        case 'summon':
            if (player.cooldowns.summon <= 0 && player.mp >= 25) {
                player.cooldowns.summon = 180;
                player.mp -= 25;
                for (let enemy of enemies) {
                    const damage = 20 + player.level * 3;
                    enemy.currentHp -= damage;
                    createHitParticles(enemy.x, enemy.y, '#8B4513');
                    createFloatingText(enemy.x, enemy.y - 20, `-${damage}`, '#8B4513');
                }
                createFloatingText(player.x + player.width / 2, player.y - 30, '啸天犬!', '#8B4513');
                updateUI();
            }
            break;
    }
}

function createHitParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: color,
            life: 1,
            size: Math.random() * 4 + 3
        });
    }
}

function createEyeBeamParticles(x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x + Math.random() * 100 - 50,
            y: y + Math.random() * 100 - 50,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: Math.random() > 0.5 ? '#FF0000' : '#FFFF00',
            life: 1,
            size: Math.random() * 6 + 2
        });
    }
}

function createFloatingText(x, y, text, color) {
    const container = document.getElementById('floatingTexts');
    const div = document.createElement('div');
    div.className = 'floating-text';
    div.textContent = text;
    div.style.color = color;
    div.style.left = `${x - cameraX}px`;
    div.style.top = `${y - cameraY}px`;
    container.appendChild(div);
    setTimeout(() => div.remove(), 1000);
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= 0.03;
        return p.life > 0;
    });
}

function checkDeadEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].currentHp <= 0) {
            const expGain = Math.floor(enemies[i].exp * (player.transformed ? 2 : 1));
            const goldGain = Math.floor(enemies[i].gold * (player.transformed ? 2 : 1));
            player.exp += expGain;
            player.gold += goldGain;
            createFloatingText(enemies[i].x, enemies[i].y - 30, `+${expGain} EXP`, '#00FF00');
            createFloatingText(enemies[i].x, enemies[i].y - 50, `+${goldGain} 💰`, '#FFD700');
            const mapData = MAPS[currentMap];
            if (Math.random() < 0.1) {
                drops.push({
                    x: enemies[i].x,
                    y: enemies[i].y,
                    emoji: '💰',
                    type: 'gold',
                    value: 20,
                    life: 300
                });
            }
            if (Math.random() < 0.08) {
                const equipType = ['weapons', 'armors', 'accessories'][Math.floor(Math.random() * 3)];
                const index = Math.min(player.level - 1, EQUIPMENT[equipType].length - 1);
                const equip = EQUIPMENT[equipType][Math.max(0, index)];
                drops.push({
                    x: enemies[i].x,
                    y: enemies[i].y,
                    emoji: equip.emoji,
                    type: 'equip',
                    equipment: equip,
                    equipType: equipType,
                    life: 300
                });
            }
            enemies.splice(i, 1);
            if (player.exp >= player.expToLevel) {
                levelUp();
            }
            updateUI();
        }
    }
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
    player.crit += 2;
    createFloatingText(player.x + player.width / 2, player.y - 30, `升级! Lv.${player.level}`, '#FFD700');
}

function checkDropCollection() {
    for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i];
        drop.life--;
        const dist = Math.hypot(drop.x - player.x - player.width / 2, drop.y - player.y - player.height / 2);
        if (dist < 50) {
            if (drop.type === 'equip') {
                equipItem(drop.equipment, drop.equipType);
            } else if (drop.type === 'gold') {
                player.gold += drop.value;
                createFloatingText(player.x + player.width / 2, player.y, `+${drop.value}`, '#FFD700');
            }
            drops.splice(i, 1);
            updateUI();
        } else if (drop.life <= 0) {
            drops.splice(i, 1);
        }
    }
}

function equipItem(equip, type) {
    if (type === 'weapons') player.weapon = equip;
    else if (type === 'armors') player.armor = equip;
    else if (type === 'accessories') player.accessory = equip;
    createFloatingText(player.x + player.width / 2, player.y, `获得 ${equip.name}!`, '#FF88FF');
    updateUI();
}

function drawMap() {
    const map = MAPS[currentMap];
    ctx.fillStyle = map.bgColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    cameraX = player.x - CANVAS_WIDTH / 2 + player.width / 2;
    cameraY = player.y - CANVAS_HEIGHT / 2 + player.height / 2;
    cameraX = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - CANVAS_WIDTH, cameraX));
    cameraY = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - CANVAS_HEIGHT, cameraY));
    const startX = Math.floor(cameraX / TILE_SIZE);
    const startY = Math.floor(cameraY / TILE_SIZE);
    const endX = Math.min(startX + Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 2, MAP_WIDTH);
    const endY = Math.min(startY + Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 2, MAP_HEIGHT);
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            if (y < 0 || y >= MAP_HEIGHT || x < 0 || x >= MAP_WIDTH) continue;
            const screenX = x * TILE_SIZE - cameraX;
            const screenY = y * TILE_SIZE - cameraY;
            const tile = gameMap[y][x];
            if (tile === 0) {
                ctx.fillStyle = (x + y) % 2 === 0 ? map.groundColor : adjustColor(map.groundColor, -8);
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            } else if (tile === 1) {
                ctx.fillStyle = '#3a3a5a';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#5a5a7a';
                ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                ctx.fillStyle = '#4a4a6a';
                ctx.fillRect(screenX + 8, screenY + 8, TILE_SIZE - 16, TILE_SIZE - 16);
            }
        }
    }
}

function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
    return `rgb(${r}, ${g}, ${b})`;
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
    const flip = player.direction < 0;
    if (flip) {
        ctx.translate(screenX + player.width, screenY);
        ctx.scale(-1, 1);
    } else {
        ctx.translate(screenX, screenY);
    }
    const scale = player.transformed ? 1.2 : 1;
    ctx.scale(scale, scale);
    const bobY = Math.sin(player.animFrame * 0.8) * 3;
    drawErlangShen(bobY);
    ctx.restore();
}

function drawErlangShen(bobY) {
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(15, 25 + bobY);
    ctx.quadraticCurveTo(40, 30 + bobY, 35, 65 + bobY);
    ctx.quadraticCurveTo(30, 70 + bobY, 15, 60 + bobY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(10, 20 + bobY, 30, 40);
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(13, 25 + bobY, 24, 6);
    ctx.fillRect(13, 38 + bobY, 24, 6);
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(8, 8 + bobY, 34, 15);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(10, 10 + bobY, 30, 4);
    ctx.beginPath();
    ctx.arc(25, 5 + bobY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = player.transformed ? '#FF0000' : '#FF4444';
    ctx.beginPath();
    ctx.arc(25, 3 + bobY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(25, 3 + bobY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F5DEB3';
    ctx.beginPath();
    ctx.arc(25, 28 + bobY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 26 + bobY, 3, 3);
    ctx.fillRect(27, 26 + bobY, 3, 3);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(23, 31 + bobY, 4, 2);
    ctx.fillStyle = '#4A3728';
    ctx.fillRect(12, 58 + bobY, 8, 12);
    ctx.fillRect(30, 58 + bobY, 8, 12);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(10, 68 + bobY, 10, 4);
    ctx.fillRect(30, 68 + bobY, 10, 4);
    if (player.isAttacking) {
        const attackAngle = Math.sin(player.attackTimer * 0.3) * 0.6;
        ctx.save();
        ctx.translate(40, 30 + bobY);
        ctx.rotate(-0.4 + attackAngle);
        ctx.fillStyle = '#8B7355';
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
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(40, 20 + bobY, 30, 5);
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(65, 15 + bobY);
        ctx.lineTo(75, 22.5 + bobY);
        ctx.lineTo(65, 30 + bobY);
        ctx.closePath();
        ctx.fill();
    }
}

function drawEnemies() {
    for (let enemy of enemies) {
        const screenX = enemy.x - cameraX;
        const screenY = enemy.y - cameraY;
        if (screenX < -60 || screenX > CANVAS_WIDTH + 60 || screenY < -60 || screenY > CANVAS_HEIGHT + 60) continue;
        ctx.save();
        ctx.translate(screenX, screenY);
        const bobY = Math.sin(enemy.animFrame * 1) * 2;
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.emoji, 0, bobY);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-25, 25, 50, 8);
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(-25, 25, 50 * (enemy.currentHp / enemy.maxHp), 8);
        ctx.restore();
    }
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

function drawParticles() {
    for (let p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - cameraX - p.size / 2, p.y - cameraY - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

function renderMapList() {
    const mapList = document.getElementById('mapList');
    mapList.innerHTML = '';
    for (let key in MAPS) {
        const map = MAPS[key];
        const isLocked = player.level < map.minLevel;
        const card = document.createElement('div');
        card.className = `map-card ${isLocked ? 'locked' : ''}`;
        card.innerHTML = `
            <div class="map-info">
                <span class="map-emoji">${map.emoji}</span>
                <div>
                    <div class="map-name">${map.name}</div>
                    <div class="map-level">Lv.${map.minLevel}+</div>
                </div>
            </div>
        `;
        if (!isLocked) {
            card.addEventListener('click', () => {
                currentMap = key;
                generateMap();
                spawnEnemies();
                player.x = 450;
                player.y = 300;
                document.getElementById('mapSelect').classList.remove('active');
                updateUI();
            });
        }
        mapList.appendChild(card);
    }
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

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyJ') useSkill('attack');
    if (e.code === 'KeyK') useSkill('eye');
    if (e.code === 'KeyL') useSkill('transform');
    if (e.code === 'Space') {
        e.preventDefault();
        useSkill('summon');
    }
    if (e.code === 'KeyM') {
        const mapSelect = document.getElementById('mapSelect');
        mapSelect.classList.toggle('active');
        renderMapList();
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

document.getElementById('mapBtn').addEventListener('click', () => {
    const mapSelect = document.getElementById('mapSelect');
    mapSelect.classList.toggle('active');
    renderMapList();
});

document.getElementById('closeMapBtn').addEventListener('click', () => {
    document.getElementById('mapSelect').classList.remove('active');
});

initGame();
