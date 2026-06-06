const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 16;

const hpBar = document.getElementById('hpBar');
const hpText = document.getElementById('hpText');
const mpBar = document.getElementById('mpBar');
const mpText = document.getElementById('mpText');
const levelText = document.getElementById('level');
const goldText = document.getElementById('gold');
const locationName = document.getElementById('locationName');
const mapSelect = document.getElementById('mapSelect');

const MAPS = {
    huaguo: { name: '花果山', bgColor: '#1a3a2a', groundColor: '#2a5a3a', enemyLevel: [1, 3], dropTable: ['herb', 'feather'] },
    qitian: { name: '齐云洞', bgColor: '#2a2a4a', groundColor: '#4a4a6a', enemyLevel: [5, 8], dropTable: ['jade', 'bone'] },
    nuvo: { name: '火焰山', bgColor: '#3a2a2a', groundColor: '#6a4a3a', enemyLevel: [10, 13], dropTable: ['fire', 'gem'] },
    water: { name: '龙宫', bgColor: '#1a2a3a', groundColor: '#3a5a6a', enemyLevel: [15, 18], dropTable: ['pearl', 'scale'] },
    heaven: { name: '天庭', bgColor: '#3a3a5a', groundColor: '#6a6a8a', enemyLevel: [20, 25], dropTable: ['nimbus', 'feather'] }
};

const ENEMY_TYPES = [
    { name: '小猴', emoji: '🐒', hp: 20, attack: 3, exp: 10, gold: 5 },
    { name: '狼妖', emoji: '🐺', hp: 35, attack: 6, exp: 18, gold: 12 },
    { name: '狐妖', emoji: '🦊', hp: 45, attack: 8, exp: 25, gold: 18 },
    { name: '蛇妖', emoji: '🐍', hp: 55, attack: 10, exp: 35, gold: 25 },
    { name: '蜘蛛精', emoji: '🕷️', hp: 70, attack: 12, exp: 45, gold: 35 },
    { name: '牛魔王', emoji: '🐂', hp: 120, attack: 18, exp: 80, gold: 60 },
    { name: '孙悟空', emoji: '🐵', hp: 200, attack: 25, exp: 150, gold: 100 }
];

const EQUIPMENT = {
    weapons: [
        { name: '铁剑', emoji: '🗡️', atk: 5 },
        { name: '三尖刀', emoji: '⚔️', atk: 12 },
        { name: '方天戟', emoji: '🔱', atk: 20 },
        { name: '宣花斧', emoji: '🪓', atk: 30 },
        { name: '混天绫', emoji: '🧣', atk: 45 }
    ],
    armors: [
        { name: '布甲', emoji: '👘', def: 3 },
        { name: '皮甲', emoji: '🥋', def: 8 },
        { name: '锁甲', emoji: '🛡️', def: 15 },
        { name: '银甲', emoji: '⛓️', def: 25 },
        { name: '金甲', emoji: '🏅', def: 40 }
    ],
    accessories: [
        { name: '护符', emoji: '📿', crit: 5 },
        { name: '天眼', emoji: '👁️', crit: 12 },
        { name: '哮天牙', emoji: '🦷', crit: 20 },
        { name: '金刚圈', emoji: '💍', all: 10 }
    ]
};

const DROPS = {
    herb: { name: '灵草', emoji: '🌿', sell: 5 },
    feather: { name: '羽毛', emoji: '🪶', sell: 8 },
    jade: { name: '玉石', emoji: '💎', sell: 15 },
    bone: { name: '灵骨', emoji: '🦴', sell: 20 },
    fire: { name: '火种', emoji: '🔥', sell: 30 },
    gem: { name: '宝石', emoji: '💠', sell: 50 },
    pearl: { name: '珍珠', emoji: '🔮', sell: 40 },
    scale: { name: '鳞片', emoji: '🐟', sell: 35 },
    nimbus: { name: '祥云', emoji: '☁️', sell: 80 }
};

let gameMap = [];
let currentMap = 'huaguo';

let player = {
    x: 400,
    y: 280,
    width: 40,
    height: 60,
    speed: 5,
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
    attack: 15,
    defense: 5,
    crit: 10,
    gold: 0,
    weapon: null,
    armor: null,
    accessory: null,
    isAttacking: false,
    attackTimer: 0,
    skillCooldowns: { eye: 0, transform: 0, summon: 0 },
    invincible: false,
    invincibleTimer: 0,
    transformed: false,
    transformTimer: 0
};

let enemies = [];
let particles = [];
let floatingTexts = [];
let drops = [];
let cameraX = 0;
let cameraY = 0;

const keys = {};

function generateMap() {
    gameMap = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        gameMap[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
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
    const mapData = MAPS[currentMap];
    const [minLv, maxLv] = mapData.enemyLevel;
    
    const count = 8 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < count; i++) {
        let x, y, attempts = 0;
        do {
            x = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
            y = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
            attempts++;
        } while (gameMap[y][x] !== 0 && attempts < 30);
        
        if (gameMap[y][x] === 0) {
            const lvRange = maxLv - minLv + 1;
            const typeIndex = Math.min(Math.floor(Math.random() * lvRange) + minLv - 1, ENEMY_TYPES.length - 1);
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
                takeDamage: function(amount, direction) {
                    this.currentHp -= amount;
                }
            });
        }
    }
}

function changeMap(mapKey) {
    currentMap = mapKey;
    locationName.textContent = MAPS[mapKey].name;
    generateMap();
    spawnEnemies();
    player.x = 400;
    player.y = 280;
    mapSelect.style.display = 'none';
}

function initGame() {
    generateMap();
    spawnEnemies();
    updateUI();
    gameLoop();
}

function updateUI() {
    hpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
    hpText.textContent = `${Math.floor(player.hp)}/${player.maxHp}`;
    mpBar.style.width = `${(player.mp / player.maxMp) * 100}%`;
    mpText.textContent = `${Math.floor(player.mp)}/${player.maxMp}`;
    levelText.textContent = player.level;
    goldText.textContent = player.gold;
    
    document.getElementById('weaponIcon').textContent = player.weapon ? player.weapon.emoji : '⚔️';
    document.getElementById('armorIcon').textContent = player.armor ? player.armor.emoji : '🛡️';
    document.getElementById('accessoryIcon').textContent = player.accessory ? player.accessory.emoji : '💍';
}

function getTotalAttack() {
    let atk = player.attack;
    if (player.weapon) atk += player.weapon.atk;
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
    if (player.accessory && player.accessory.all) crit += player.accessory.all;
    return crit;
}

function updatePlayer() {
    let dx = 0, dy = 0;
    
    if (keys['ArrowLeft'] || keys['KeyA']) dx = -1;
    if (keys['ArrowRight'] || keys['KeyD']) dx = 1;
    if (keys['ArrowUp'] || keys['KeyW']) dy = -1;
    if (keys['ArrowDown'] || keys['KeyS']) dy = 1;
    
    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
        
        if (dx !== 0) player.direction = dx > 0 ? 1 : -1;
        
        const newX = player.x + dx * player.speed;
        const newY = player.y + dy * player.speed;
        
        const tileX = Math.floor(newX / TILE_SIZE);
        const tileY = Math.floor(newY / TILE_SIZE);
        
        let canMoveX = true, canMoveY = true;
        
        for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
                const tx1 = Math.floor((newX + (player.direction > 0 ? player.width : 0)) / TILE_SIZE);
                const tx2 = Math.floor((newX + (player.direction > 0 ? 0 : player.width)) / TILE_SIZE);
                const ty1 = Math.floor((newY + player.height - 5) / TILE_SIZE);
                const ty2 = Math.floor((newY + 5) / TILE_SIZE);
                
                if (gameMap[ty1] && gameMap[ty1][tx1] === 1) canMoveX = false;
                if (gameMap[ty1] && gameMap[ty1][tx2] === 1) canMoveX = false;
                if (gameMap[ty2] && gameMap[ty2][tx1] === 1) canMoveX = false;
                if (gameMap[ty2] && gameMap[ty2][tx2] === 1) canMoveX = false;
                
                const tx3 = Math.floor((newX + 5) / TILE_SIZE);
                const tx4 = Math.floor((newX + player.width - 5) / TILE_SIZE);
                const ty3 = Math.floor((newY + (player.direction > 0 ? player.height : 0)) / TILE_SIZE);
                const ty4 = Math.floor((newY + (player.direction > 0 ? 0 : player.height)) / TILE_SIZE);
                
                if (gameMap[ty3] && gameMap[ty3][tx3] === 1) canMoveY = false;
                if (gameMap[ty3] && gameMap[ty3][tx4] === 1) canMoveY = false;
                if (gameMap[ty4] && gameMap[ty4][tx3] === 1) canMoveY = false;
                if (gameMap[ty4] && gameMap[ty4][tx4] === 1) canMoveY = false;
            }
        }
        
        if (canMoveX) player.x = Math.max(TILE_SIZE, Math.min(MAP_WIDTH * TILE_SIZE - TILE_SIZE - player.width, newX));
        if (canMoveY) player.y = Math.max(TILE_SIZE, Math.min(MAP_HEIGHT * TILE_SIZE - TILE_SIZE - player.height, newY));
        
        player.animTimer++;
        if (player.animTimer > 6) {
            player.animTimer = 0;
            player.animFrame = (player.animFrame + 1) % 4;
        }
    }
    
    if (player.isAttacking) {
        player.attackTimer++;
        if (player.attackTimer > 15) {
            player.isAttacking = false;
            player.attackTimer = 0;
        }
    }
    
    for (let key in player.skillCooldowns) {
        if (player.skillCooldowns[key] > 0) player.skillCooldowns[key]--;
    }
    
    if (player.invincible) {
        player.invincibleTimer--;
        if (player.invincibleTimer <= 0) player.invincible = false;
    }
    
    if (player.transformed) {
        player.transformTimer--;
        if (player.transformTimer <= 0) player.transformed = false;
    }
    
    checkEnemyCollisions();
    checkDropCollection();
}

function checkEnemyCollisions() {
    for (let enemy of enemies) {
        const dist = Math.hypot(enemy.x - player.x - player.width/2, enemy.y - player.y - player.height/2);
        
        if (dist < 60) {
            enemy.takeDamage(getTotalAttack(), player.direction);
            floatingTexts.push({
                x: enemy.x,
                y: enemy.y - 20,
                text: `-${getTotalAttack()}`,
                color: '#ffff00',
                life: 30
            });
            
            if (enemy.currentHp <= 0) {
                handleEnemyDeath(enemy);
            }
        }
    }
}

function handleEnemyDeath(enemy) {
    const expGain = Math.floor(enemy.exp * (player.transformed ? 2 : 1));
    const goldGain = Math.floor(enemy.gold * (player.transformed ? 2 : 1));
    
    player.exp += expGain;
    player.gold += goldGain;
    
    floatingTexts.push({
        x: enemy.x,
        y: enemy.y - 40,
        text: `+${expGain}exp +${goldGain}金`,
        color: '#00ff00',
        life: 60
    });
    
    const mapData = MAPS[currentMap];
    if (Math.random() < 0.3) {
        const dropKey = mapData.dropTable[Math.floor(Math.random() * mapData.dropTable.length)];
        const drop = DROPS[dropKey];
        drops.push({
            x: enemy.x,
            y: enemy.y,
            ...drop,
            life: 300
        });
    }
    
    if (Math.random() < 0.05) {
        const equipType = ['weapons', 'armors', 'accessories'][Math.floor(Math.random() * 3)];
        const equip = EQUIPMENT[equipType][Math.min(player.level - 1, EQUIPMENT[equipType].length - 1)];
        drops.push({
            x: enemy.x,
            y: enemy.y,
            isEquip: true,
            equip: equip,
            equipType: equipType,
            life: 300
        });
    }
    
    enemies = enemies.filter(e => e !== enemy);
    
    if (player.exp >= player.expToLevel) {
        levelUp();
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
    player.crit += 2;
    
    floatingTexts.push({
        x: player.x + player.width/2,
        y: player.y - 30,
        text: `升级! Lv.${player.level}`,
        color: '#ffcc00',
        life: 90
    });
    
    updateUI();
}

function checkDropCollection() {
    for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i];
        drop.life--;
        
        const dist = Math.hypot(drop.x - player.x - player.width/2, drop.y - player.y - player.height/2);
        if (dist < 40) {
            if (drop.isEquip) {
                equipItem(drop.equip, drop.equipType);
            } else {
                player.gold += drop.sell;
                floatingTexts.push({
                    x: player.x + player.width/2,
                    y: player.y - 20,
                    text: `+${drop.name}`,
                    color: '#88ff88',
                    life: 30
                });
            }
            drops.splice(i, 1);
            updateUI();
        } else if (drop.life <= 0) {
            drops.splice(i, 1);
        }
    }
}

function equipItem(equip, type) {
    if (type === 'weapons') {
        player.weapon = equip;
    } else if (type === 'armors') {
        player.armor = equip;
    } else if (type === 'accessories') {
        player.accessory = equip;
    }
    
    floatingTexts.push({
        x: player.x + player.width/2,
        y: player.y - 20,
        text: `获得 ${equip.name}!`,
        color: '#ff88ff',
        life: 60
    });
}

function updateEnemies() {
    for (let enemy of enemies) {
        enemy.moveTimer++;
        
        const distToPlayer = Math.hypot(enemy.x - player.x - player.width/2, enemy.y - player.y - player.height/2);
        
        if (distToPlayer < 150) {
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
            
            if (distToPlayer < 35 && !player.invincible) {
                const damage = Math.max(1, enemy.attack - getTotalDefense() / 2);
                player.hp -= damage;
                player.invincible = true;
                player.invincibleTimer = 30;
                
                floatingTexts.push({
                    x: player.x + player.width/2,
                    y: player.y - 20,
                    text: `-${Math.floor(damage)}`,
                    color: '#ff4444',
                    life: 30
                });
                
                createHitParticles(player.x + player.width/2, player.y + player.height/2, '#ff4444');
                
                if (player.hp <= 0) {
                    player.hp = player.maxHp;
                    player.x = 400;
                    player.y = 280;
                    player.exp = Math.floor(player.exp * 0.5);
                    floatingTexts.push({
                        x: player.x + player.width/2,
                        y: player.y - 40,
                        text: '复活! 损失50%经验',
                        color: '#ff0000',
                        life: 90
                    });
                }
                
                updateUI();
            }
        } else {
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
    if (player.skillCooldowns[skill] > 0) return;
    
    switch(skill) {
        case 'attack':
            player.isAttacking = true;
            player.attackTimer = 0;
            enemies.forEach(enemy => {
                const dist = Math.hypot(enemy.x - player.x - player.width/2, enemy.y - player.y - player.height/2);
                if (dist < 80) {
                    const damage = getTotalAttack();
                    enemy.currentHp -= damage;
                    createHitParticles(enemy.x, enemy.y, '#ffff00');
                }
            });
            break;
            
        case 'eye':
            if (player.mp >= 10) {
                player.mp -= 10;
                player.skillCooldowns.eye = 60;
                
                const beamX = player.x + (player.direction > 0 ? player.width : 0);
                const beamY = player.y + 20;
                
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        enemies.forEach(enemy => {
                            const dist = Math.hypot(enemy.x - beamX, enemy.y - beamY);
                            if (dist < 150) {
                                const damage = 25 + player.level * 3;
                                enemy.currentHp -= damage;
                                createHitParticles(enemy.x, enemy.y, '#ff0000');
                            }
                        });
                    }, i * 50);
                }
                
                floatingTexts.push({
                    x: player.x + player.width/2,
                    y: player.y - 30,
                    text: '天眼发射!',
                    color: '#ff0000',
                    life: 30
                });
            }
            break;
            
        case 'transform':
            if (player.mp >= 20) {
                player.mp -= 20;
                player.skillCooldowns.transform = 300;
                player.transformed = true;
                player.transformTimer = 180;
                player.invincible = true;
                player.invincibleTimer = 180;
                
                floatingTexts.push({
                    x: player.x + player.width/2,
                    y: player.y - 30,
                    text: '八九玄功! 攻击翻倍',
                    color: '#ff8800',
                    life: 60
                });
            }
            break;
            
        case 'summon':
            if (player.mp >= 25) {
                player.mp -= 25;
                player.skillCooldowns.summon = 180;
                
                enemies.forEach(enemy => {
                    const damage = 15 + player.level * 2;
                    enemy.currentHp -= damage;
                    createHitParticles(enemy.x, enemy.y, '#8b4513');
                });
                
                floatingTexts.push({
                    x: player.x + player.width/2,
                    y: player.y - 30,
                    text: '哮天犬出击!',
                    color: '#8b4513',
                    life: 30
                });
            }
            break;
    }
    
    updateUI();
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
            size: Math.random() * 4 + 2
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life -= 0.04;
        return p.life > 0;
    });
    
    floatingTexts = floatingTexts.filter(t => {
        t.y -= 1;
        t.life--;
        return t.life > 0;
    });
}

function drawMap() {
    const mapData = MAPS[currentMap];
    ctx.fillStyle = mapData.bgColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
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
                ctx.fillStyle = (x + y) % 2 === 0 ? mapData.groundColor : adjustColor(mapData.groundColor, -10);
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            } else if (tile === 1) {
                ctx.fillStyle = '#3a3a5a';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#5a5a7a';
                ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                
                ctx.fillStyle = '#4a4a6a';
                ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            }
        }
    }
}

function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `rgb(${r},${g},${b})`;
}

function drawPlayer() {
    const screenX = player.x - cameraX;
    const screenY = player.y - cameraY;
    
    ctx.save();
    
    if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    
    if (player.transformed) {
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 20;
    }
    
    const flip = player.direction < 0;
    if (flip) {
        ctx.translate(screenX + player.width, screenY);
        ctx.scale(-1, 1);
    } else {
        ctx.translate(screenX, screenY);
    }
    
    const bobY = Math.sin(player.animFrame * 0.8) * 2;
    const size = player.transformed ? 1.2 : 1;
    
    ctx.scale(size, size);
    
    // 披风
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.moveTo(15, 20 + bobY);
    ctx.lineTo(35, 25 + bobY);
    ctx.lineTo(30, 55 + bobY);
    ctx.lineTo(15, 50 + bobY);
    ctx.closePath();
    ctx.fill();
    
    // 身体
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(12, 18 + bobY, 26, 32);
    
    // 金色铠甲纹路
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(15, 22 + bobY, 20, 4);
    ctx.fillRect(15, 30 + bobY, 20, 4);
    ctx.fillRect(15, 38 + bobY, 20, 4);
    
    // 头盔 - 三山帽
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(10, 5 + bobY, 30, 15);
    
    // 帽檐
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(8, 12 + bobY, 34, 5);
    
    // 帽子装饰
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(12, 8 + bobY, 26, 3);
    
    // 天眼
    ctx.fillStyle = player.transformed ? '#ff0000' : '#ff4444';
    ctx.beginPath();
    ctx.arc(25, 2 + bobY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(25, 2 + bobY, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 头部
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.arc(25, 25 + bobY, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 23 + bobY, 3, 3);
    ctx.fillRect(27, 23 + bobY, 3, 3);
    
    // 嘴巴
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(23, 28 + bobY, 4, 2);
    
    // 腿
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(14, 48 + bobY, 8, 12);
    ctx.fillRect(28, 48 + bobY, 8, 12);
    
    // 脚
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(12, 58 + bobY, 10, 4);
    ctx.fillRect(28, 58 + bobY, 10, 4);
    
    // 三尖两刃刀
    if (!player.isAttacking) {
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(35, 15 + bobY, 25, 4);
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(55, 10 + bobY);
        ctx.lineTo(65, 17 + bobY);
        ctx.lineTo(55, 24 + bobY);
        ctx.closePath();
        ctx.fill();
    } else {
        const attackAngle = Math.sin(player.attackTimer * 0.3) * 0.5;
        ctx.save();
        ctx.translate(35, 25 + bobY);
        ctx.rotate(-0.3 + attackAngle);
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(0, -2, 30, 4);
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(25, -8);
        ctx.lineTo(35, 0);
        ctx.lineTo(25, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    ctx.restore();
}

function drawEnemies() {
    for (let enemy of enemies) {
        const screenX = enemy.x - cameraX;
        const screenY = enemy.y - cameraY;
        
        if (screenX < -50 || screenX > CANVAS_WIDTH + 50 ||
            screenY < -50 || screenY > CANVAS_HEIGHT + 50) continue;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        
        ctx.font = '32px Arial';
        ctx.fillText(enemy.emoji, -16, 10);
        
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-20, 20, 40, 6);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(-20, 20, 40 * (enemy.currentHp / enemy.maxHp), 6);
        
        ctx.restore();
    }
}

function drawDrops() {
    for (let drop of drops) {
        const screenX = drop.x - cameraX;
        const screenY = drop.y - cameraY;
        
        if (screenX < -30 || screenX > CANVAS_WIDTH + 30 ||
            screenY < -30 || screenY > CANVAS_HEIGHT + 30) continue;
        
        ctx.save();
        ctx.translate(screenX, screenY + Math.sin(Date.now() * 0.005) * 3);
        
        if (drop.isEquip) {
            ctx.font = '28px Arial';
            ctx.fillText(drop.equip.emoji, -14, 10);
        } else {
            ctx.font = '24px Arial';
            ctx.fillText(drop.emoji, -12, 8);
        }
        
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

function drawFloatingTexts() {
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    
    for (let t of floatingTexts) {
        ctx.globalAlpha = t.life / 60;
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x - cameraX, t.y - cameraY);
    }
    
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
}

function gameLoop() {
    updatePlayer();
    updateEnemies();
    updateParticles();
    
    cameraX = player.x - CANVAS_WIDTH / 2 + player.width / 2;
    cameraY = player.y - CANVAS_HEIGHT / 2 + player.height / 2;
    cameraX = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - CANVAS_WIDTH, cameraX));
    cameraY = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - CANVAS_HEIGHT, cameraY));
    
    drawMap();
    drawDrops();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawFloatingTexts();
    
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
        mapSelect.style.display = mapSelect.style.display === 'none' ? 'block' : 'none';
    }
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

document.querySelectorAll('.map-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const mapKey = btn.dataset.map;
        const mapData = MAPS[mapKey];
        const minLevel = mapData.enemyLevel[0];
        
        if (player.level >= minLevel) {
            changeMap(mapKey);
        } else {
            alert(`等级不足! 需要 ${minLevel} 级才能进入 ${mapData.name}`);
        }
    });
});

window.closeMapSelect = function() {
    mapSelect.style.display = 'none';
};

initGame();