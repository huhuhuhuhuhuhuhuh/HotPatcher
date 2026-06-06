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
        particles: ['🌸', '🍃']
    },
    qitian: {
        name: '齐云洞',
        ground: ['#4a4a6a', '#3a3a5a'],
        wall: '#6a6a8a',
        wallTop: '#8a8aaa',
        accent: '#9a8aca',
        particles: ['💎', '✨']
    },
    huoshan: {
        name: '火焰山',
        ground: ['#6a3a2a', '#5a2a1a'],
        wall: '#8a4a3a',
        wallTop: '#aa5a4a',
        accent: '#ff6a3a',
        particles: ['🔥', '💨']
    },
    longgong: {
        name: '龙宫',
        ground: ['#2a4a6a', '#1a3a5a'],
        wall: '#3a5a7a',
        wallTop: '#4a6a8a',
        accent: '#4ae0e0',
        particles: ['🌊', '✨']
    },
    tianting: {
        name: '天庭',
        ground: ['#5a4a8a', '#4a3a7a'],
        wall: '#7a6aaa',
        wallTop: '#9a8aca',
        accent: '#ffd700',
        particles: ['☁️', '✨']
    }
};

// 怪物配置
const ENEMY_CONFIG = {
    huaguo: {
        types: ['🐒', '🐺', '🦊', '🐍'],
        name: '猴妖',
        baseHp: 150,
        baseAttack: 15,
        colors: ['#8B4513', '#A0522D', '#CD853F']
    },
    qitian: {
        types: ['👻', '🦇', '🕷️', '💀'],
        name: '妖魔',
        baseHp: 250,
        baseAttack: 25,
        colors: ['#4a4a6a', '#6a6a8a', '#8a8aaa']
    },
    huoshan: {
        types: ['🔥', '🌋', '💥', '👹'],
        name: '火怪',
        baseHp: 400,
        baseAttack: 40,
        colors: ['#8B0000', '#FF4500', '#FF6347']
    },
    longgong: {
        types: ['🐟', '🦈', '🐙', '🧜'],
        name: '海妖',
        baseHp: 550,
        baseAttack: 55,
        colors: ['#1E90FF', '#4169E1', '#6495ED']
    },
    tianting: {
        types: ['👼', '🔥', '⚔️', '👑'],
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
    const config = ENEMY_CONFIG[currentMap] || ENEMY_CONFIG.huaguo;
    const difficultyMultiplier = {huaguo: 1, qitian: 1.5, huoshan: 2, longgong: 2.5, tianting: 3}[currentMap] || 1;
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
            moveSpeed: 1.5 + Math.random() * 1.5,
            attackCooldown: 0,
            animFrame: 0,
            animTimer: 0
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
    const config = MAP_CONFIG[currentMap] || MAP_CONFIG.huaguo;
    
    ctx.fillStyle = config.ground[0];
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
                ctx.fillStyle = (x + y) % 2 === 0 ? config.ground[0] : config.ground[1];
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                
                if (Math.random() < 0.02) {
                    const particle = config.particles[Math.floor(Math.random() * config.particles.length)];
                    ctx.font = '16px Arial';
                    ctx.fillText(particle, screenX + Math.random() * 30, screenY + Math.random() * 30);
                }
            } else {
                ctx.fillStyle = config.wall;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = config.wallTop;
                ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                
                if (currentMap === 'huoshan' && Math.random() < 0.1) {
                    ctx.fillStyle = 'rgba(255, 100, 50, 0.5)';
                    ctx.beginPath();
                    ctx.arc(screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, 8, 0, Math.PI*2);
                    ctx.fill();
                }
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
    
    // 角色基础位置
    const baseY = bodyBob;
    
    // 发光光环（八九玄功时）
    if (player.transformed) {
        const glowSize = 60 + Math.sin(Date.now() * 0.01) * 10;
        const gradient = ctx.createRadialGradient(32, 45, 0, 32, 45, glowSize);
        gradient.addColorStop(0, 'rgba(255, 165, 0, 0.6)');
        gradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(32, 45, glowSize, 0, Math.PI*2);
        ctx.fill();
        
        ctx.shadowColor = '#FF8C00';
        ctx.shadowBlur = 60;
    }
    
    // 红色披风（带渐变和飘带细节）
    const capeGradient = ctx.createLinearGradient(20, 10 + baseY, 55, 90 + baseY);
    capeGradient.addColorStop(0, '#9A1A1A');
    capeGradient.addColorStop(0.5, '#7A1414');
    capeGradient.addColorStop(1, '#5A0F0F');
    ctx.fillStyle = capeGradient;
    ctx.beginPath();
    ctx.moveTo(22, 15 + baseY);
    ctx.quadraticCurveTo(55 + capeWave, 30 + baseY, 52 + capeWave * 0.7, 88);
    ctx.quadraticCurveTo(47 + capeWave * 0.5, 98, 22, 85);
    ctx.closePath();
    ctx.fill();
    
    // 披风内层（深色阴影）
    ctx.fillStyle = '#6B1010';
    ctx.beginPath();
    ctx.moveTo(25, 18 + baseY);
    ctx.quadraticCurveTo(52 + capeWave * 0.8, 34 + baseY, 49 + capeWave * 0.6, 84);
    ctx.quadraticCurveTo(44 + capeWave * 0.4, 92, 25, 80);
    ctx.closePath();
    ctx.fill();
    
    // 双腿（带裤子纹理）
    ctx.fillStyle = '#1A1414';
    ctx.fillRect(17, 58 + legOffset, 13, 23 - legOffset);
    ctx.fillRect(35, 58 - legOffset, 13, 23 + legOffset);
    
    // 靴子（带金属扣装饰）
    ctx.fillStyle = '#3A2A20';
    ctx.fillRect(14, 77 + legOffset, 18, 10);
    ctx.fillRect(33, 77 - legOffset, 18, 10);
    
    // 身体铠甲（带层次感和金属光泽）
    const armorGradient = ctx.createLinearGradient(15, 20 + baseY, 50, 60 + baseY);
    armorGradient.addColorStop(0, '#FFD700');
    armorGradient.addColorStop(0.3, '#DAA520');
    armorGradient.addColorStop(0.6, '#B8860B');
    armorGradient.addColorStop(1, '#8B7355');
    ctx.fillStyle = armorGradient;
    ctx.fillRect(14, 22 + baseY, 37, 39);
    
    // 铠甲装饰
    ctx.fillStyle = '#E6C247';
    ctx.fillRect(17, 25 + baseY, 31, 9);
    ctx.fillRect(17, 43 + baseY, 31, 11);
    
    // 肩膀护肩
    ctx.fillStyle = '#DAA520';
    ctx.beginPath();
    ctx.moveTo(10, 21 + baseY);
    ctx.quadraticCurveTo(3, 16 + baseY, 10, 33 + baseY);
    ctx.lineTo(16, 36 + baseY);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(54, 21 + baseY);
    ctx.quadraticCurveTo(61, 16 + baseY, 55, 33 + baseY);
    ctx.lineTo(48, 36 + baseY);
    ctx.closePath();
    ctx.fill();
    
    // 头冠（三山冠，豪华版）
    const crownGradient = ctx.createLinearGradient(10, 0 + baseY, 54, 20 + baseY);
    crownGradient.addColorStop(0, '#FFD700');
    crownGradient.addColorStop(0.5, '#DAA520');
    crownGradient.addColorStop(1, '#B8860B');
    ctx.fillStyle = crownGradient;
    ctx.fillRect(11, 0 + baseY, 43, 21);
    
    // 三山冠山峰
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(32, -12 + baseY);
    ctx.lineTo(18, 2 + baseY);
    ctx.lineTo(32, 8 + baseY);
    ctx.lineTo(46, 2 + baseY);
    ctx.closePath();
    ctx.fill();
    
    // 中央宝珠（带闪烁效果）
    const pulseSize = 9 + Math.sin(Date.now() * 0.008) * 2;
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(32, 3 + baseY, pulseSize, 0, Math.PI*2);
    ctx.fill();
    
    // 天眼（超豪华版）
    const eyeGlow = player.transformed ? 0.5 + Math.sin(Date.now() * 0.015) * 0.3 : 0.2;
    ctx.fillStyle = `rgba(255, 0, 0, ${eyeGlow})`;
    ctx.beginPath();
    ctx.arc(32, 7 + baseY, 18, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = player.transformed ? '#FF2222' : '#AA1A1A';
    ctx.beginPath();
    ctx.ellipse(32, 7 + baseY, 9, 12, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(32, 9 + baseY, 6, 7, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(32, 9 + baseY, 3, 0, Math.PI*2);
    ctx.fill();
    
    // 眼睛周围符文（八九玄功时）
    if (player.transformed) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI/4 + Date.now() * 0.002;
            ctx.beginPath();
            ctx.arc(32, 7 + baseY, 15, angle, angle + 0.3);
            ctx.stroke();
        }
    }
    
    // 头发
    ctx.fillStyle = '#2D1A0A';
    ctx.beginPath();
    ctx.ellipse(32, 26 + baseY, 15, 13, 0, 0, Math.PI*2);
    ctx.fill();
    
    // 脸（精致版）
    const faceGradient = ctx.createRadialGradient(32, 30 + baseY, 0, 32, 30 + baseY, 12);
    faceGradient.addColorStop(0, '#FFE4B5');
    faceGradient.addColorStop(1, '#DEB887');
    ctx.fillStyle = faceGradient;
    ctx.beginPath();
    ctx.arc(32, 30 + baseY, 12, 0, Math.PI*2);
    ctx.fill();
    
    // 眉毛
    ctx.strokeStyle = '#2D1A0A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 27 + baseY);
    ctx.quadraticCurveTo(24, 25 + baseY, 28, 26 + baseY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(44, 27 + baseY);
    ctx.quadraticCurveTo(40, 25 + baseY, 36, 26 + baseY);
    ctx.stroke();
    
    // 眼睛（有眼神！）
    const blinkFrame = Math.floor(Date.now() / 2000) % 50;
    if (blinkFrame >= 2) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(25, 29 + baseY, 4, 3.5, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(39, 29 + baseY, 4, 3.5, 0, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(25, 29 + baseY, 2, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(39, 29 + baseY, 2, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(24, 28 + baseY, 1, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(38, 28 + baseY, 1, 0, Math.PI*2);
        ctx.fill();
    }
    
    // 鼻子
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.moveTo(32, 31 + baseY);
    ctx.lineTo(30, 35 + baseY);
    ctx.lineTo(34, 35 + baseY);
    ctx.closePath();
    ctx.fill();
    
    // 胡须
    ctx.fillStyle = '#2D1A0A';
    ctx.beginPath();
    ctx.moveTo(32, 36 + baseY);
    ctx.lineTo(28, 42 + baseY);
    ctx.lineTo(32, 40 + baseY);
    ctx.lineTo(36, 42 + baseY);
    ctx.closePath();
    ctx.fill();
    
    // 腰带
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(11, 55 + baseY, 43, 7);
    
    ctx.fillStyle = '#DAA520';
    ctx.fillRect(11, 55 + baseY, 43, 2);
    ctx.fillRect(11, 60 + baseY, 43, 2);
    
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(24, 54 + baseY, 16, 9);
    
    // 武器：三尖两刃刀（超级精美版）
    ctx.save();
    let weaponAngle = -0.35;
    let weaponX = 60;
    let weaponY = 32 + baseY;
    
    if (player.isAttacking) {
        const attackProgress = player.attackTimer / 25;
        weaponAngle = -0.35 - Math.sin(attackProgress * Math.PI) * 1.5;
        weaponX = 58 + Math.cos(attackProgress * Math.PI * 2) * 12;
        weaponY = 40 + baseY + Math.sin(attackProgress * Math.PI * 2) * 10;
    }
    
    ctx.translate(weaponX, weaponY);
    ctx.rotate(weaponAngle);
    
    const handleGradient = ctx.createLinearGradient(0, -5, 55, 5);
    handleGradient.addColorStop(0, '#5D3A1A');
    handleGradient.addColorStop(0.5, '#8B5A2B');
    handleGradient.addColorStop(1, '#5D3A1A');
    ctx.fillStyle = handleGradient;
    ctx.fillRect(0, -5, 58, 10);
    
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(-5, -7, 8, 14);
    
    const bladeGradient = ctx.createLinearGradient(50, -15, 80, 15);
    bladeGradient.addColorStop(0, '#A0A0A0');
    bladeGradient.addColorStop(0.5, '#E8E8E8');
    bladeGradient.addColorStop(1, '#A0A0A0');
    ctx.fillStyle = bladeGradient;
    ctx.beginPath();
    ctx.moveTo(55, -16);
    ctx.quadraticCurveTo(65, -8, 82, 0);
    ctx.quadraticCurveTo(65, 8, 55, 16);
    ctx.quadraticCurveTo(62, 0, 55, -16);
    ctx.closePath();
    ctx.fill();
    
    if (player.isAttacking && player.attackTimer > 5 && player.attackTimer < 15) {
        const effectAlpha = (1 - Math.abs(player.attackTimer - 10) / 10) * 0.8;
        const slashGradient = ctx.createRadialGradient(80, 0, 0, 80, 0, 40);
        slashGradient.addColorStop(0, `rgba(255, 215, 0, ${effectAlpha})`);
        slashGradient.addColorStop(0.5, `rgba(255, 165, 0, ${effectAlpha * 0.6})`);
        slashGradient.addColorStop(1, `rgba(255, 69, 0, 0)`);
        ctx.fillStyle = slashGradient;
        ctx.beginPath();
        ctx.arc(80, 0, 40, 0, Math.PI*2);
        ctx.fill();
    }
    
    ctx.restore();
    ctx.restore();
}

function drawEnemies() {
    for (let enemy of enemies) {
        if (enemy.moveSpeed > 0.1) {
            enemy.animTimer++;
            if (enemy.animTimer > 8) {
                enemy.animTimer = 0;
                enemy.animFrame = (enemy.animFrame + 1) % 4;
            }
        }
        
        const screenX = enemy.x - cameraX;
        const screenY = enemy.y - cameraY;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        
        const bobY = Math.sin(enemy.animFrame * 0.5) * 3;
        
        ctx.fillStyle = enemy.color;
        
        if (enemy.type === '👻') {
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.ellipse(0, bobY, 20, 25, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-20, bobY);
            ctx.quadraticCurveTo(-15, bobY + 20, -10, bobY + 15);
            ctx.quadraticCurveTo(-5, bobY + 25, 0, bobY + 15);
            ctx.quadraticCurveTo(5, bobY + 25, 10, bobY + 15);
            ctx.quadraticCurveTo(15, bobY + 20, 20, bobY);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (enemy.type === '🔥') {
            const flicker = Math.random() * 5;
            ctx.beginPath();
            ctx.moveTo(0, bobY - 30 - flicker);
            ctx.quadraticCurveTo(25, bobY - 10, 20, bobY + 15);
            ctx.quadraticCurveTo(10, bobY + 25, 0, bobY + 20);
            ctx.quadraticCurveTo(-10, bobY + 25, -20, bobY + 15);
            ctx.quadraticCurveTo(-25, bobY - 10, 0, bobY - 30 - flicker);
            ctx.fill();
            
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.ellipse(0, bobY, 12, 18, 0, 0, Math.PI*2);
            ctx.fill();
        } else if (enemy.type === '👼') {
            ctx.beginPath();
            ctx.ellipse(0, bobY, 15, 20, 0, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.ellipse(-18, bobY - 5, 15, 8, -0.3, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(18, bobY - 5, 15, 8, 0.3, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(0, bobY - 25, 8, 0, Math.PI*2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, bobY, 22, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-8, bobY - 5, 6, 0, Math.PI*2);
            ctx.arc(8, bobY - 5, 6, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-8, bobY - 5, 3, 0, Math.PI*2);
            ctx.arc(8, bobY - 5, 3, 0, Math.PI*2);
            ctx.fill();
        }
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(-25, 30, 50, 10);
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(-25, 30, 50 * (enemy.hp / enemy.maxHp), 10);
        
        ctx.restore();
    }
}

function drawParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= 0.03;
        return p.life > 0;
    });
    
    for (let p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - cameraX - p.size/2, p.y - cameraY - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

function drawDrops() {
    for (let drop of drops) {
        drop.life--;
        const screenX = drop.x - cameraX;
        const screenY = drop.y - cameraY + Math.sin(Date.now() * 0.005) * 4;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(drop.emoji, 0, 0);
        ctx.restore();
    }
    
    drops = drops.filter(d => d.life > 0);
}

function createHitParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: color,
            size: 4 + Math.random() * 4,
            life: 1
        });
    }
}

function createFloatingText(x, y, text, color) {
    const div = document.createElement('div');
    div.className = 'floating-text';
    div.textContent = text;
    div.style.left = (x - cameraX + CANVAS_WIDTH/2) + 'px';
    div.style.top = (y - cameraY + CANVAS_HEIGHT/2 - 20) + 'px';
    div.style.color = color;
    document.getElementById('floatingTexts').appendChild(div);
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
        const dist = Math.sqrt((drop.x - player.x - player.width/2) ** 2 + 
                               (drop.y - player.y - player.height/2) ** 2);
        if (dist < 50) {
            if (drop.type === 'gold') {
                player.gold += drop.value;
                createFloatingText(player.x, player.y, '+' + drop.value, '#FFD700');
            }
            drops.splice(i, 1);
            updateUI();
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
                    createFloatingText(enemy.x, enemy.y - 20, '-' + Math.floor(damage), '#FFD700');
                    createHitParticles(enemy.x, enemy.y, '#FFD700');
                }
            }
            break;
        case 'eye':
            if (player.cooldowns.eye > 0 || player.mp < 20) return;
            player.cooldowns.eye = 60;
            player.mp -= 20;
            for (let enemy of enemies) {
                const dist = Math.sqrt((enemy.x - player.x - player.width/2) ** 2 + 
                                       (enemy.y - player.y - player.height/2) ** 2);
                if (dist < 150) {
                    const damage = player.attack * 1.5 * (player.transformed ? 2 : 1);
                    enemy.hp -= damage;
                    createFloatingText(enemy.x, enemy.y - 20, '-' + Math.floor(damage), '#FF6600');
                    createHitParticles(enemy.x, enemy.y, '#FF6600');
                }
            }
            updateUI();
            break;
        case 'transform':
            if (player.cooldowns.transform > 0 || player.mp < 50) return;
            player.cooldowns.transform = 240;
            player.mp -= 50;
            player.transformed = true;
            player.transformTimer = 180;
            player.invincible = true;
            player.invincibleTimer = 60;
            updateUI();
            break;
        case 'summon':
            if (player.cooldowns.summon > 0 || player.mp < 30) return;
            player.cooldowns.summon = 120;
            player.mp -= 30;
            for (let enemy of enemies) {
                const dist = Math.sqrt((enemy.x - player.x - player.width/2) ** 2 + 
                                       (enemy.y - player.y - player.height/2) ** 2);
                if (dist < 200) {
                    const damage = player.attack * 0.8 * (player.transformed ? 2 : 1);
                    enemy.hp -= damage;
                    createFloatingText(enemy.x, enemy.y - 20, '-' + Math.floor(damage), '#00A0FF');
                    createHitParticles(enemy.x, enemy.y, '#00A0FF');
                }
            }
            updateUI();
            break;
    }
}

function updateCooldowns() {
    const cd2 = document.getElementById('cd2');
    const cd3 = document.getElementById('cd3');
    const cd4 = document.getElementById('cd4');
    
    if (player.cooldowns.eye > 0) {
        cd2.style.height = (player.cooldowns.eye / 60 * 100) + '%';
    } else {
        cd2.style.height = '0%';
    }
    
    if (player.cooldowns.transform > 0) {
        cd3.style.height = (player.cooldowns.transform / 240 * 100) + '%';
    } else {
        cd3.style.height = '0%';
    }
    
    if (player.cooldowns.summon > 0) {
        cd4.style.height = (player.cooldowns.summon / 120 * 100) + '%';
    } else {
        cd4.style.height = '0%';
    }
}

// 游戏循环
function gameLoop() {
    updatePlayer();
    updateEnemies();
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
