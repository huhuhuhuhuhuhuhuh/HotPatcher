// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const TILE_SIZE = 40;
const MAP_WIDTH = 30;
const MAP_HEIGHT = 20;

// 关卡配置
const MAP_CONFIG = {
    huaguo: {
        name: '花果山',
        ground: ['#3a6b4a', '#2d5a3a'],
        wall: '#5a4a3a',
        wallTop: '#7a6a5a',
        accent: '#8bc34a',
        particles: ['🌸', '🍃', '🌺'],
        bgGradient: ['#1a4a2a', '#0a2a1a'],
        bgImage: 'forest'
    },
    qitian: {
        name: '齐云洞',
        ground: ['#4a4a6a', '#3a3a5a'],
        wall: '#6a6a8a',
        wallTop: '#8a8aaa',
        accent: '#9a8aca',
        particles: ['💎', '✨', '💜'],
        bgGradient: ['#2a2a4a', '#1a1a3a'],
        bgImage: 'cave'
    },
    huoshan: {
        name: '火焰山',
        ground: ['#6a3a2a', '#5a2a1a'],
        wall: '#8a4a3a',
        wallTop: '#aa5a4a',
        accent: '#ff6a3a',
        particles: ['🔥', '💨', '🌋'],
        bgGradient: ['#4a1a1a', '#2a0a0a'],
        bgImage: 'fire'
    },
    longgong: {
        name: '龙宫',
        ground: ['#2a4a6a', '#1a3a5a'],
        wall: '#3a5a7a',
        wallTop: '#4a6a8a',
        accent: '#4ae0e0',
        particles: ['🌊', '✨', '🐚'],
        bgGradient: ['#0a2a4a', '#0a1a3a'],
        bgImage: 'water'
    },
    tianting: {
        name: '天庭',
        ground: ['#5a4a8a', '#4a3a7a'],
        wall: '#7a6aaa',
        wallTop: '#9a8aca',
        accent: '#ffd700',
        particles: ['☁️', '✨', '🌟'],
        bgGradient: ['#3a2a6a', '#2a1a5a'],
        bgImage: 'sky'
    }
};

// 怪物配置
const ENEMY_CONFIG = {
    huaguo: {
        types: ['monkey', 'wolf', 'fox', 'snake'],
        name: '猴妖',
        baseHp: 150,
        baseAttack: 15,
        colors: ['#8B4513', '#A0522D', '#CD853F']
    },
    qitian: {
        types: ['ghost', 'bat', 'spider', 'skull'],
        name: '妖魔',
        baseHp: 250,
        baseAttack: 25,
        colors: ['#4a4a6a', '#6a6a8a', '#8a8aaa']
    },
    huoshan: {
        types: ['fire', 'lava', 'imp', 'demon'],
        name: '火怪',
        baseHp: 400,
        baseAttack: 40,
        colors: ['#8B0000', '#FF4500', '#FF6347']
    },
    longgong: {
        types: ['fish', 'shark', 'octopus', 'mermaid'],
        name: '海妖',
        baseHp: 550,
        baseAttack: 55,
        colors: ['#1E90FF', '#4169E1', '#6495ED']
    },
    tianting: {
        types: ['angel', 'seraph', 'knight', 'king'],
        name: '天神',
        baseHp: 800,
        baseAttack: 80,
        colors: ['#FFD700', '#FFA500', '#FF8C00']
    }
};

// Game state
let gameMap = [];
let currentMap = 'huaguo';
let player = {
    x: 450,
    y: 300,
    width: 80,
    height: 110,
    speed: 4.5,
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
    isMoving: false,
    breathPhase: 0,
    blinkTimer: 0,
    attackDirection: 1
};
let enemies = [];
let particles = [];
let drops = [];
let keys = {};
let cameraX = 0;
let cameraY = 0;
let specialEffects = [];

// 初始化
function generateMap() {
    gameMap = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        gameMap[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (y === 0 || y === MAP_HEIGHT - 1 || x === 0 || x === MAP_WIDTH - 1) {
                gameMap[y][x] = 1;
            } else if (Math.random() < 0.06) {
                gameMap[y][x] = 1;
            } else {
                gameMap[y][x] = 0;
            }
        }
    }
}

function spawnEnemies() {
    enemies = [];
    const config = ENEMY_CONFIG[currentMap] || ENEMY_CONFIG.huaguo;
    const difficultyMultiplier = {huaguo: 1, qitian: 1.5, huoshan: 2, longgong: 2.5, tianting: 3}[currentMap] || 1;
    const count = 6 + Math.floor(Math.random() * 4);
    
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
        
        const typeIndex = Math.floor(Math.random() * config.types.length);
        const colorIndex = Math.floor(Math.random() * config.colors.length);
        
        enemies.push({
            x: x,
            y: y,
            type: config.types[typeIndex],
            name: config.name,
            color: config.colors[colorIndex],
            hp: Math.floor(config.baseHp * difficultyMultiplier + player.level * 10),
            maxHp: Math.floor(config.baseHp * difficultyMultiplier + player.level * 10),
            attack: Math.floor(config.baseAttack * difficultyMultiplier + player.level * 5),
            moveSpeed: 1.2 + Math.random() * 1.3,
            attackCooldown: 0,
            animFrame: 0,
            animTimer: 0,
            attackAnim: 0,
            deathTimer: 0,
            isDead: false,
            movePhase: Math.random() * Math.PI * 2
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
    
    document.getElementById('skill1').style.opacity = player.cooldowns.eye > 0 ? 0.4 : 1;
    document.getElementById('skill2').style.opacity = player.cooldowns.transform > 0 ? 0.4 : 1;
    document.getElementById('skill3').style.opacity = player.cooldowns.summon > 0 ? 0.4 : 1;
}

// 绘制函数
function drawMap() {
    const config = MAP_CONFIG[currentMap] || MAP_CONFIG.huaguo;
    
    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, config.bgGradient[0]);
    bgGradient.addColorStop(1, config.bgGradient[1]);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    cameraX = player.x - CANVAS_WIDTH/2 + player.width/2;
    cameraY = player.y - CANVAS_HEIGHT/2 + player.height/2;
    cameraX = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - CANVAS_WIDTH, cameraX));
    cameraY = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - CANVAS_HEIGHT, cameraY));
    
    drawBackgroundEffects(config);
    
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
                const groundColor = (x + y) % 2 === 0 ? config.ground[0] : config.ground[1];
                ctx.fillStyle = groundColor;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                
                if (Math.random() < 0.02) {
                    const particle = config.particles[Math.floor(Math.random() * config.particles.length)];
                    ctx.font = '14px Arial';
                    ctx.globalAlpha = 0.5 + Math.random() * 0.4;
                    ctx.fillText(particle, screenX + Math.random() * 25, screenY + Math.random() * 25);
                    ctx.globalAlpha = 1;
                }
                
                drawTileEffects(screenX, screenY, config);
            } else {
                const wallGradient = ctx.createLinearGradient(screenX, screenY, screenX + TILE_SIZE, screenY + TILE_SIZE);
                wallGradient.addColorStop(0, config.wallTop);
                wallGradient.addColorStop(1, config.wall);
                ctx.fillStyle = wallGradient;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                
                ctx.fillStyle = config.wallTop;
                ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 6);
                ctx.fillRect(screenX + 2, screenY + 2, 6, TILE_SIZE - 4);
            }
        }
    }
}

function drawBackgroundEffects(config) {
    const time = Date.now() * 0.001;
    
    if (config.bgImage === 'fire') {
        for (let i = 0; i < 15; i++) {
            const x = (Math.sin(time * 0.3 + i * 0.5) * 0.5 + 0.5) * CANVAS_WIDTH;
            const y = (Math.cos(time * 0.2 + i * 0.7) * 0.5 + 0.5) * CANVAS_HEIGHT;
            const size = 20 + Math.sin(time * 0.5 + i) * 10;
            const emberGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            emberGradient.addColorStop(0, 'rgba(255, 150, 50, 0.6)');
            emberGradient.addColorStop(0.5, 'rgba(255, 80, 0, 0.3)');
            emberGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = emberGradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI*2);
            ctx.fill();
        }
    } else if (config.bgImage === 'water') {
        for (let i = 0; i < 20; i++) {
            const x = (Math.sin(time * 0.4 + i * 0.3) * 0.5 + 0.5) * CANVAS_WIDTH;
            const y = (Math.cos(time * 0.3 + i * 0.5) * 0.5 + 0.5) * CANVAS_HEIGHT;
            ctx.fillStyle = `rgba(74, 224, 224, ${0.1 + Math.sin(time + i) * 0.05})`;
            ctx.beginPath();
            ctx.arc(x, y, 30 + Math.sin(time * 2 + i) * 10, 0, Math.PI*2);
            ctx.fill();
        }
    } else if (config.bgImage === 'sky') {
        for (let i = 0; i < 8; i++) {
            const x = (Math.sin(time * 0.1 + i * 0.8) * 0.5 + 0.5) * CANVAS_WIDTH;
            const y = (Math.cos(time * 0.15 + i * 0.6) * 0.3 + 0.2) * CANVAS_HEIGHT;
            const size = 40 + Math.sin(time * 0.3 + i) * 20;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time + i) * 0.05})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI*2);
            ctx.fill();
        }
    }
}

function drawTileEffects(screenX, screenY, config) {
    if (config.bgImage === 'fire' && Math.random() < 0.1) {
        const time = Date.now() * 0.003;
        const emberGradient = ctx.createRadialGradient(
            screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, 0,
            screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, 15
        );
        emberGradient.addColorStop(0, 'rgba(255, 120, 60, 0.9)');
        emberGradient.addColorStop(0.4, 'rgba(255, 60, 0, 0.5)');
        emberGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = emberGradient;
        ctx.beginPath();
        ctx.arc(screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, 12 + Math.sin(time) * 4, 0, Math.PI*2);
        ctx.fill();
    } else if (config.bgImage === 'water' && Math.random() < 0.08) {
        ctx.fillStyle = 'rgba(74, 224, 224, 0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + TILE_SIZE/2 + Math.sin(Date.now() * 0.002) * 5, 
                    screenY + TILE_SIZE/2, 8, 4, 0, 0, Math.PI*2);
        ctx.fill();
    }
}

function drawPlayer() {
    const screenX = player.x - cameraX;
    const screenY = player.y - cameraY;
    
    ctx.save();
    
    if (player.invincible && Math.floor(Date.now() / 80) % 2 === 0) {
        ctx.globalAlpha = 0.4;
    }
    
    player.breathPhase += 0.025;
    const breathOffset = Math.sin(player.breathPhase) * 1.8;
    
    let legOffset = 0;
    let bodyBob = 0;
    let capeWave = 0;
    let armSwing = 0;
    let headBob = 0;
    
    if (player.isMoving) {
        player.animTimer++;
        if (player.animTimer > 8) {
            player.animTimer = 0;
            player.animFrame = (player.animFrame + 1) % 8;
        }
        const walkPhase = player.animFrame * Math.PI / 4;
        legOffset = Math.sin(walkPhase) * 8;
        bodyBob = Math.abs(Math.sin(walkPhase)) * 4;
        capeWave = Math.sin(walkPhase * 0.8 + Date.now() * 0.006) * 6;
        armSwing = Math.sin(walkPhase + Math.PI) * 5;
        headBob = Math.sin(walkPhase * 0.5) * 2;
    }
    
    if (player.direction < 0) {
        ctx.translate(screenX + player.width, screenY);
        ctx.scale(-1, 1);
    } else {
        ctx.translate(screenX, screenY);
    }
    
    const scale = player.transformed ? 1.35 : 1.15;
    ctx.scale(scale, scale);
    
    const baseY = bodyBob + breathOffset;
    
    drawTransformationAura(baseY);
    
    drawCape(baseY, capeWave);
    
    drawLegs(baseY, legOffset);
    
    drawArmor(baseY);
    
    drawArms(baseY, armSwing);
    
    drawHead(baseY, headBob);
    
    drawWeapon(baseY);
    
    ctx.restore();
}

function drawTransformationAura(baseY) {
    if (player.transformed) {
        const glowSize = 75 + Math.sin(Date.now() * 0.007) * 12;
        const outerGlow = ctx.createRadialGradient(40, 55, 0, 40, 55, glowSize);
        outerGlow.addColorStop(0, 'rgba(255, 215, 100, 0.8)');
        outerGlow.addColorStop(0.3, 'rgba(255, 160, 50, 0.5)');
        outerGlow.addColorStop(0.6, 'rgba(255, 100, 0, 0.25)');
        outerGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(40, 55, glowSize, 0, Math.PI*2);
        ctx.fill();
        
        ctx.shadowColor = '#FFAA00';
        ctx.shadowBlur = 90;
        
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 16; i++) {
            const angle = i * Math.PI/8 + Date.now() * 0.0025;
            const innerR = 25 + Math.sin(Date.now() * 0.004 + i) * 4;
            const outerR = 40 + Math.sin(Date.now() * 0.004 + i) * 4;
            ctx.beginPath();
            ctx.arc(40, 55, innerR, angle, angle + 0.35);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(40, 55, outerR, angle + 0.2, angle + 0.5);
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
    }
}

function drawCape(baseY, capeWave) {
    const capeBackGradient = ctx.createLinearGradient(30, 15, 55, 100);
    capeBackGradient.addColorStop(0, '#C01010');
    capeBackGradient.addColorStop(0.4, '#A00A0A');
    capeBackGradient.addColorStop(1, '#700505');
    ctx.fillStyle = capeBackGradient;
    
    ctx.beginPath();
    ctx.moveTo(28, 20 + baseY);
    ctx.quadraticCurveTo(70 + capeWave * 1.3, 40 + baseY, 65 + capeWave, 100);
    ctx.quadraticCurveTo(58 + capeWave * 0.7, 112, 28, 95);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#5A0505';
    ctx.beginPath();
    ctx.moveTo(32, 22 + baseY);
    ctx.quadraticCurveTo(65 + capeWave, 42 + baseY, 60 + capeWave * 0.85, 95);
    ctx.quadraticCurveTo(55 + capeWave * 0.6, 105, 32, 90);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(26, 18 + baseY);
    ctx.quadraticCurveTo(72 + capeWave * 1.4, 38 + baseY, 66 + capeWave, 105);
    ctx.stroke();
    
    const innerCapeWave = capeWave * 0.4;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(38, 25 + baseY);
    ctx.quadraticCurveTo(45 + innerCapeWave, 50 + baseY, 40 + innerCapeWave, 80 + baseY);
    ctx.stroke();
}

function drawLegs(baseY, legOffset) {
    const legGradient = ctx.createLinearGradient(22, 60, 22, 90);
    legGradient.addColorStop(0, '#3A2820');
    legGradient.addColorStop(0.5, '#2A1810');
    legGradient.addColorStop(1, '#1A0A05');
    ctx.fillStyle = legGradient;
    
    ctx.beginPath();
    ctx.moveTo(20, 60 + baseY + legOffset);
    ctx.lineTo(35, 60 + baseY + legOffset);
    ctx.lineTo(38, 82 + baseY + legOffset * 0.4);
    ctx.lineTo(17, 82 + baseY + legOffset * 0.4);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(43, 60 + baseY - legOffset);
    ctx.lineTo(58, 60 + baseY - legOffset);
    ctx.lineTo(61, 82 + baseY - legOffset * 0.4);
    ctx.lineTo(40, 82 + baseY - legOffset * 0.4);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 62 + baseY + legOffset);
    ctx.lineTo(24, 78 + baseY + legOffset * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(54, 62 + baseY - legOffset);
    ctx.lineTo(54, 78 + baseY - legOffset * 0.4);
    ctx.stroke();
    
    const bootGradient = ctx.createLinearGradient(15, 78, 15, 95);
    bootGradient.addColorStop(0, '#5A4030');
    bootGradient.addColorStop(1, '#3A2010');
    ctx.fillStyle = bootGradient;
    ctx.fillRect(15, 80 + baseY + legOffset * 0.4, 22, 14);
    ctx.fillRect(41, 80 + baseY - legOffset * 0.4, 22, 14);
    
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(16, 81 + baseY + legOffset * 0.4, 7, 5);
    ctx.fillRect(42, 81 + baseY - legOffset * 0.4, 7, 5);
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(20, 88 + baseY + legOffset * 0.4, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(46, 88 + baseY - legOffset * 0.4, 3, 0, Math.PI*2);
    ctx.fill();
}

function drawArmor(baseY) {
    const armorGradient = ctx.createLinearGradient(18, 25, 62, 68);
    armorGradient.addColorStop(0, '#FFE080');
    armorGradient.addColorStop(0.2, '#FFD700');
    armorGradient.addColorStop(0.5, '#DAA520');
    armorGradient.addColorStop(0.8, '#B8860B');
    armorGradient.addColorStop(1, '#8B6914');
    ctx.fillStyle = armorGradient;
    
    ctx.beginPath();
    ctx.moveTo(18, 28 + baseY);
    ctx.lineTo(62, 28 + baseY);
    ctx.lineTo(66, 38 + baseY);
    ctx.lineTo(66, 58 + baseY);
    ctx.lineTo(60, 65 + baseY);
    ctx.lineTo(20, 65 + baseY);
    ctx.lineTo(14, 58 + baseY);
    ctx.lineTo(14, 38 + baseY);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFE4B5';
    ctx.beginPath();
    ctx.ellipse(40, 38 + baseY, 18, 14, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.ellipse(40, 38 + baseY, 14, 10, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, 32 + baseY);
    ctx.lineTo(40, 60 + baseY);
    ctx.stroke();
    
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(25, 45 + baseY);
    ctx.lineTo(55, 45 + baseY);
    ctx.moveTo(30, 52 + baseY);
    ctx.lineTo(50, 52 + baseY);
    ctx.stroke();
    
    ctx.fillStyle = '#E6C247';
    ctx.fillRect(18, 62 + baseY, 44, 5);
    
    const shoulderGradient = ctx.createRadialGradient(12, 25, 0, 12, 25, 18);
    shoulderGradient.addColorStop(0, '#FFD700');
    shoulderGradient.addColorStop(0.6, '#DAA520');
    shoulderGradient.addColorStop(1, '#B8860B');
    ctx.fillStyle = shoulderGradient;
    
    ctx.beginPath();
    ctx.moveTo(10, 23 + baseY);
    ctx.quadraticCurveTo(-3, 18 + baseY, 5, 38 + baseY);
    ctx.lineTo(20, 41 + baseY);
    ctx.lineTo(17, 28 + baseY);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(70, 23 + baseY);
    ctx.quadraticCurveTo(83, 18 + baseY, 75, 38 + baseY);
    ctx.lineTo(60, 41 + baseY);
    ctx.lineTo(63, 28 + baseY);
    ctx.closePath();
    ctx.fill();
    
    const gemGradient = ctx.createRadialGradient(14, 28 + baseY, 0, 14, 28 + baseY, 5);
    gemGradient.addColorStop(0, '#FFFFFF');
    gemGradient.addColorStop(0.4, '#FF6347');
    gemGradient.addColorStop(1, '#CC0000');
    ctx.fillStyle = gemGradient;
    ctx.beginPath();
    ctx.arc(14, 28 + baseY, 5, 0, Math.PI*2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(66, 28 + baseY, 5, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(15, 63 + baseY, 50, 12);
    
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(15, 63 + baseY, 50, 3);
    ctx.fillRect(15, 72 + baseY, 50, 3);
    
    const buckleGradient = ctx.createRadialGradient(40, 68, 0, 40, 68, 15);
    buckleGradient.addColorStop(0, '#FFE080');
    buckleGradient.addColorStop(1, '#DAA520');
    ctx.fillStyle = buckleGradient;
    ctx.fillRect(28, 65 + baseY, 24, 14);
    
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(31, 67 + baseY, 18, 8);
}

function drawArms(baseY, armSwing) {
    const armGradient = ctx.createLinearGradient(10, 35, 10, 55);
    armGradient.addColorStop(0, '#3A2820');
    armGradient.addColorStop(1, '#1A0A05');
    ctx.fillStyle = armGradient;
    
    ctx.beginPath();
    ctx.moveTo(10, 35 + baseY + armSwing);
    ctx.lineTo(22, 35 + baseY + armSwing);
    ctx.lineTo(24, 56 + baseY + armSwing * 1.3);
    ctx.lineTo(8, 56 + baseY + armSwing * 1.3);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(58, 35 + baseY - armSwing);
    ctx.lineTo(70, 35 + baseY - armSwing);
    ctx.lineTo(72, 56 + baseY - armSwing * 1.3);
    ctx.lineTo(56, 56 + baseY - armSwing * 1.3);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#DAA520';
    ctx.fillRect(7, 53 + baseY + armSwing * 1.3, 16, 9);
    ctx.fillRect(57, 53 + baseY - armSwing * 1.3, 16, 9);
    
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(8, 54 + baseY + armSwing * 1.3, 6, 4);
    ctx.fillRect(58, 54 + baseY - armSwing * 1.3, 6, 4);
}

function drawHead(baseY, headBob) {
    const crownGradient = ctx.createLinearGradient(15, 0, 65, 28);
    crownGradient.addColorStop(0, '#FFE080');
    crownGradient.addColorStop(0.5, '#FFD700');
    crownGradient.addColorStop(1, '#DAA520');
    ctx.fillStyle = crownGradient;
    
    ctx.fillRect(15, 2 + baseY, 50, 25);
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(40, -15 + baseY + headBob);
    ctx.lineTo(18, 8 + baseY + headBob);
    ctx.lineTo(33, 15 + baseY + headBob);
    ctx.lineTo(40, 10 + baseY + headBob);
    ctx.lineTo(47, 15 + baseY + headBob);
    ctx.lineTo(62, 8 + baseY + headBob);
    ctx.closePath();
    ctx.fill();
    
    const orbPulse = 12 + Math.sin(Date.now() * 0.005) * 3;
    const orbGradient = ctx.createRadialGradient(40, 0 + baseY + headBob, 0, 40, 0 + baseY + headBob, orbPulse);
    orbGradient.addColorStop(0, '#FFFFFF');
    orbGradient.addColorStop(0.25, '#FF8060');
    orbGradient.addColorStop(0.6, '#FF4500');
    orbGradient.addColorStop(1, '#CC0000');
    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(40, 0 + baseY + headBob, orbPulse, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = `rgba(255, 120, 60, ${0.35 + Math.sin(Date.now() * 0.005) * 0.2})`;
    ctx.beginPath();
    ctx.arc(40, 0 + baseY + headBob, orbPulse + 10, 0, Math.PI*2);
    ctx.fill();
    
    drawThirdEye(baseY, headBob);
    
    ctx.fillStyle = '#1A0F0A';
    ctx.beginPath();
    ctx.ellipse(40, 32 + baseY + headBob, 19, 16, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#2D1A0A';
    ctx.beginPath();
    ctx.ellipse(40, 30 + baseY + headBob, 16, 14, 0, 0, Math.PI*2);
    ctx.fill();
    
    const faceGradient = ctx.createRadialGradient(40, 35, 0, 40, 35, 16);
    faceGradient.addColorStop(0, '#FFE4B5');
    faceGradient.addColorStop(0.7, '#DEB887');
    faceGradient.addColorStop(1, '#D2B48C');
    ctx.fillStyle = faceGradient;
    ctx.beginPath();
    ctx.arc(40, 35 + baseY + headBob, 16, 0, Math.PI*2);
    ctx.fill();
    
    ctx.strokeStyle = '#2D1A0A';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(22, 30 + baseY + headBob);
    ctx.quadraticCurveTo(30, 26 + baseY + headBob, 38, 29 + baseY + headBob);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(58, 30 + baseY + headBob);
    ctx.quadraticCurveTo(50, 26 + baseY + headBob, 42, 29 + baseY + headBob);
    ctx.stroke();
    
    player.blinkTimer++;
    const blinkFrame = Math.floor(player.blinkTimer / 280) % 60;
    const eyeWidth = 5;
    const eyeHeight = blinkFrame < 6 ? 1.5 : 4.5;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(27, 33 + baseY + headBob, eyeWidth, eyeHeight, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(53, 33 + baseY + headBob, eyeWidth, eyeHeight, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(27, 33 + baseY + headBob, 2.8, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(53, 33 + baseY + headBob, 2.8, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(26, 32 + baseY + headBob, 1.3, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(52, 32 + baseY + headBob, 1.3, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.moveTo(40, 38 + baseY + headBob);
    ctx.lineTo(36, 44 + baseY + headBob);
    ctx.lineTo(44, 44 + baseY + headBob);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(40, 46 + baseY + headBob, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    ctx.fillStyle = '#2D1A0A';
    ctx.beginPath();
    ctx.moveTo(40, 47 + baseY + headBob);
    ctx.lineTo(32, 55 + baseY + headBob);
    ctx.lineTo(36, 51 + baseY + headBob);
    ctx.lineTo(44, 51 + baseY + headBob);
    ctx.lineTo(48, 55 + baseY + headBob);
    ctx.closePath();
    ctx.fill();
}

function drawThirdEye(baseY, headBob) {
    const eyeGlow = player.transformed ? 0.7 + Math.sin(Date.now() * 0.01) * 0.25 : 0.28;
    const eyeGradient = ctx.createRadialGradient(40, 12 + baseY + headBob, 0, 40, 12 + baseY + headBob, 22);
    eyeGradient.addColorStop(0, `rgba(255, 60, 60, ${eyeGlow})`);
    eyeGradient.addColorStop(0.4, `rgba(255, 20, 20, ${eyeGlow * 0.6})`);
    eyeGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = eyeGradient;
    ctx.beginPath();
    ctx.arc(40, 12 + baseY + headBob, 22, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = player.transformed ? '#FF2020' : '#AA1515';
    ctx.beginPath();
    ctx.ellipse(40, 12 + baseY + headBob, 11, 16, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(40, 14 + baseY + headBob, 8, 10, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(40, 14 + baseY + headBob, 4.5, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(39, 13 + baseY + headBob, 1.8, 0, Math.PI*2);
    ctx.fill();
}

function drawWeapon(baseY) {
    ctx.save();
    let weaponAngle = -0.38;
    let weaponX = 70;
    let weaponY = 42 + baseY;
    
    if (player.isAttacking) {
        const attackProgress = player.attackTimer / 30;
        weaponAngle = -0.38 - Math.sin(attackProgress * Math.PI) * 1.7;
        weaponX = 68 + Math.cos(attackProgress * Math.PI * 2) * 18;
        weaponY = 48 + baseY + Math.sin(attackProgress * Math.PI * 2) * 14;
    }
    
    ctx.translate(weaponX, weaponY);
    ctx.rotate(weaponAngle);
    
    const handleGradient = ctx.createLinearGradient(0, -7, 70, 7);
    handleGradient.addColorStop(0, '#5D3A1A');
    handleGradient.addColorStop(0.3, '#9B6A3B');
    handleGradient.addColorStop(0.7, '#9B6A3B');
    handleGradient.addColorStop(1, '#5D3A1A');
    ctx.fillStyle = handleGradient;
    ctx.fillRect(0, -7, 72, 14);
    
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(-4, -9, 12, 18);
    ctx.fillRect(22, -8, 5, 16);
    ctx.fillRect(44, -8, 5, 16);
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(68, -18);
    ctx.lineTo(78, -6);
    ctx.lineTo(72, 0);
    ctx.lineTo(78, 6);
    ctx.lineTo(68, 18);
    ctx.lineTo(62, 0);
    ctx.closePath();
    ctx.fill();
    
    const bladeGradient = ctx.createLinearGradient(72, -22, 105, 0);
    bladeGradient.addColorStop(0, '#C8C8C8');
    bladeGradient.addColorStop(0.35, '#FFFFFF');
    bladeGradient.addColorStop(0.6, '#E0E0E0');
    bladeGradient.addColorStop(1, '#A8A8A8');
    ctx.fillStyle = bladeGradient;
    
    ctx.beginPath();
    ctx.moveTo(72, -20);
    ctx.quadraticCurveTo(88, -8, 105, 0);
    ctx.quadraticCurveTo(88, 8, 72, 20);
    ctx.lineTo(76, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(82, -8);
    ctx.quadraticCurveTo(94, -18, 105, -14);
    ctx.lineTo(96, -5);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(82, 8);
    ctx.quadraticCurveTo(94, 18, 105, 14);
    ctx.lineTo(96, 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(88, 0, 7, 18, -0.08, 0, Math.PI*2);
    ctx.fill();
    
    if (player.isAttacking && player.attackTimer > 5 && player.attackTimer < 18) {
        const effectAlpha = (1 - Math.abs(player.attackTimer - 11.5) / 12) * 0.95;
        const slashGradient = ctx.createRadialGradient(112, 0, 0, 112, 0, 55);
        slashGradient.addColorStop(0, `rgba(255, 255, 220, ${effectAlpha})`);
        slashGradient.addColorStop(0.25, `rgba(255, 220, 120, ${effectAlpha * 0.85})`);
        slashGradient.addColorStop(0.55, `rgba(255, 160, 60, ${effectAlpha * 0.55})`);
        slashGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = slashGradient;
        ctx.beginPath();
        ctx.arc(112, 0, 55 + Math.sin(Date.now() * 0.06) * 12, 0, Math.PI*2);
        ctx.fill();
        
        for (let i = 0; i < 7; i++) {
            const px = 105 + Math.random() * 25;
            const py = (Math.random() - 0.5) * 35;
            const particleGlow = ctx.createRadialGradient(px, py, 0, px, py, 5);
            particleGlow.addColorStop(0, `rgba(255, 255, 255, ${effectAlpha})`);
            particleGlow.addColorStop(1, `rgba(255, 200, 100, 0)`);
            ctx.fillStyle = particleGlow;
            ctx.beginPath();
            ctx.arc(px, py, 4 + Math.random() * 5, 0, Math.PI*2);
            ctx.fill();
        }
    }
    
    ctx.restore();
}

function drawEnemies() {
    for (let enemy of enemies) {
        if (enemy.isDead) {
            enemy.deathTimer++;
            if (enemy.deathTimer > 80) continue;
            ctx.globalAlpha = 1 - enemy.deathTimer / 80;
        }
        
        if (enemy.moveSpeed > 0.1 && !enemy.isDead) {
            enemy.movePhase += 0.05;
            enemy.animTimer++;
            if (enemy.animTimer > 5) {
                enemy.animTimer = 0;
                enemy.animFrame = (enemy.animFrame + 1) % 6;
            }
        }
        
        const screenX = enemy.x - cameraX;
        const screenY = enemy.y - cameraY;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        
        const bobY = Math.sin(enemy.movePhase) * 3;
        const scale = enemy.isDead ? 1 - enemy.deathTimer / 160 : 1;
        const rotation = enemy.isDead ? (enemy.deathTimer / 80) * Math.PI / 4 : 0;
        ctx.scale(scale, scale);
        ctx.rotate(rotation);
        
        drawEnemyByType(enemy, bobY);
        
        const barWidth = 50;
        const barHeight = 9;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(-barWidth/2, 38, barWidth, barHeight);
        
        const hpGradient = ctx.createLinearGradient(-barWidth/2, 0, barWidth/2, 0);
        hpGradient.addColorStop(0, '#FF3333');
        hpGradient.addColorStop(0.4, '#FFAA00');
        hpGradient.addColorStop(1, '#33FF33');
        ctx.fillStyle = hpGradient;
        ctx.fillRect(-barWidth/2, 38, barWidth * (enemy.hp / enemy.maxHp), barHeight);
        
        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

function drawEnemyByType(enemy, bobY) {
    ctx.fillStyle = enemy.color;
    
    switch(enemy.type) {
        case 'monkey':
            drawMonkey(enemy, bobY);
            break;
        case 'wolf':
            drawWolf(enemy, bobY);
            break;
        case 'fox':
            drawFox(enemy, bobY);
            break;
        case 'snake':
            drawSnake(enemy, bobY);
            break;
        case 'ghost':
            drawGhost(enemy, bobY);
            break;
        case 'bat':
            drawBat(enemy, bobY);
            break;
        case 'spider':
            drawSpider(enemy, bobY);
            break;
        case 'skull':
            drawSkull(enemy, bobY);
            break;
        case 'fire':
            drawFireElemental(enemy, bobY);
            break;
        case 'lava':
            drawLavaSlime(enemy, bobY);
            break;
        case 'imp':
            drawImp(enemy, bobY);
            break;
        case 'demon':
            drawDemon(enemy, bobY);
            break;
        case 'fish':
            drawFish(enemy, bobY);
            break;
        case 'shark':
            drawShark(enemy, bobY);
            break;
        case 'octopus':
            drawOctopus(enemy, bobY);
            break;
        case 'mermaid':
            drawMermaid(enemy, bobY);
            break;
        case 'angel':
            drawAngel(enemy, bobY);
            break;
        case 'seraph':
            drawSeraph(enemy, bobY);
            break;
        case 'knight':
            drawKnight(enemy, bobY);
            break;
        case 'king':
            drawKing(enemy, bobY);
            break;
        default:
            drawDefaultEnemy(enemy, bobY);
    }
}

function drawMonkey(enemy, bobY) {
    const armSwing = Math.sin(enemy.animFrame * 0.8) * 5;
    
    ctx.beginPath();
    ctx.ellipse(0, bobY + 12, 20, 22, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, bobY - 12, 18, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFE4B5';
    ctx.beginPath();
    ctx.arc(0, bobY - 8, 12, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-7, bobY - 13, 5, 0, Math.PI*2);
    ctx.arc(7, bobY - 13, 5, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-7, bobY - 13, 2.5, 0, Math.PI*2);
    ctx.arc(7, bobY - 13, 2.5, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-6.5, bobY - 13.5, 1.2, 0, Math.PI*2);
    ctx.arc(6.5, bobY - 13.5, 1.2, 0, Math.PI*2);
    ctx.fill();
    
    ctx.strokeStyle = '#3D2817';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, bobY - 5, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(-15, bobY - 15, 7, 0, Math.PI*2);
    ctx.arc(15, bobY - 15, 7, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFE4B5';
    ctx.beginPath();
    ctx.arc(-15, bobY - 15, 4, 0, Math.PI*2);
    ctx.arc(15, bobY - 15, 4, 0, Math.PI*2);
    ctx.fill();
    
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-18, bobY + 8);
    ctx.quadraticCurveTo(-32, bobY + 22, -22, bobY + 35);
    ctx.stroke();
    
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.moveTo(-15, bobY + 2, -20 + armSwing, bobY + 25);
    ctx.lineTo(-15, bobY + 5);
    ctx.lineTo(-22 + armSwing, bobY + 28);
    ctx.lineTo(-12 + armSwing, bobY + 25);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(15, bobY + 5);
    ctx.lineTo(22 - armSwing, bobY + 28);
    ctx.lineTo(12 - armSwing, bobY + 25);
    ctx.closePath();
    ctx.fill();
}

function drawWolf(enemy, bobY) {
    const legOffset = Math.sin(enemy.animFrame * 0.6) * 4;
    
    ctx.beginPath();
    ctx.ellipse(0, bobY + 10, 22, 18, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(0, bobY - 10, 16, 14, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.moveTo(-11, bobY - 18);
    ctx.lineTo(-16, bobY - 35);
    ctx.lineTo(-6, bobY - 28);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(11, bobY - 18);
    ctx.lineTo(16, bobY - 35);
    ctx.lineTo(6, bobY - 28);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-13, bobY - 28, 4, 0, Math.PI*2);
    ctx.arc(13, bobY - 28, 4, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(-6, bobY - 12, 4, 5, 0, 0, Math.PI*2);
    ctx.ellipse(6, bobY - 12, 4, 5, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-6, bobY - 12, 2.5, 0, Math.PI*2);
    ctx.arc(6, bobY - 12, 2.5, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-5.5, bobY - 12.5, 1, 0, Math.PI*2);
    ctx.arc(5.5, bobY - 12.5, 1, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, bobY - 3, 4, 0, Math.PI*2);
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, bobY - 1);
    ctx.lineTo(0, bobY + 2);
    ctx.lineTo(4, bobY - 1);
    ctx.stroke();
    
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.moveTo(-12, bobY + 8);
    ctx.lineTo(-14, bobY + 8 + legOffset);
    ctx.lineTo(-16, bobY + 25);
    ctx.lineTo(-10, bobY + 25);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(12, bobY + 8);
    ctx.lineTo(14, bobY + 8 - legOffset);
    ctx.lineTo(16, bobY + 25);
    ctx.lineTo(10, bobY + 25);
    ctx.closePath();
    ctx.fill();
}

function drawFox(enemy, bobY) {
    const tailWave = Math.sin(enemy.animFrame * 0.4) * 8;
    
    ctx.beginPath();
    ctx.ellipse(0, bobY + 10, 20, 17, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, bobY - 10, 15, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(-10, bobY - 16);
    ctx.lineTo(-14, bobY - 35);
    ctx.lineTo(-6, bobY - 25);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(10, bobY - 16);
    ctx.lineTo(14, bobY - 35);
    ctx.lineTo(6, bobY - 25);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-11, bobY - 28, 4, 0, Math.PI*2);
    ctx.arc(11, bobY - 28, 4, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFE4B5';
    ctx.beginPath();
    ctx.ellipse(0, bobY - 7, 11, 9, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-6, bobY - 10, 3, 0, Math.PI*2);
    ctx.arc(6, bobY - 10, 3, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-5.5, bobY - 10.5, 1.2, 0, Math.PI*2);
    ctx.arc(5.5, bobY - 10.5, 1.2, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.arc(0, bobY - 3, 2.5, 0, Math.PI*2);
    ctx.fill();
    
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(18, bobY + 5);
    ctx.quadraticCurveTo(35 + tailWave, bobY - 5, 28 + tailWave * 0.8, bobY - 28);
    ctx.stroke();
    
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.arc(25 + tailWave * 0.8, bobY - 25, 6, 0, Math.PI*2);
    ctx.fill();
}

function drawSnake(enemy, bobY) {
    const wave = Math.sin(enemy.animFrame * 0.6) * 6;
    const wave2 = Math.sin(enemy.animFrame * 0.6 + Math.PI/2) * 4;
    
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-25, bobY);
    ctx.quadraticCurveTo(-15, bobY + wave, -5, bobY);
    ctx.quadraticCurveTo(5, bobY - wave, 15, bobY + wave2);
    ctx.stroke();
    
    ctx.strokeStyle = '#FFE4B5';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-23, bobY - 4);
    ctx.quadraticCurveTo(-13, bobY + wave - 4, -3, bobY - 4);
    ctx.quadraticCurveTo(7, bobY - wave - 4, 17, bobY + wave2 - 4);
    ctx.stroke();
    
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(20, bobY + wave2, 11, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(24, bobY + wave2 - 3, 4.5, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(25, bobY + wave2 - 3, 2.5, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(24.5, bobY + wave2 - 3.5, 1, 0, Math.PI*2);
    ctx.fill();
    
    const tongueWave = Math.sin(Date.now() * 0.015) * 2;
    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.moveTo(30, bobY + wave2);
    ctx.lineTo(39 + tongueWave, bobY + wave2 - 4);
    ctx.lineTo(39 + tongueWave, bobY + wave2 + 4);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFAA00';
    ctx.beginPath();
    ctx.arc(