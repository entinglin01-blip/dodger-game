// 遊戲變數
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 玩家物件
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    speedX: 0,
    speedY: 0,
    jumping: false,
    jumpPower: 15,
    gravity: 0.6,
    maxSpeed: 7,
    color: '#FFD700'
};

// 遊戲變數
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let lives = 3;
let gameRunning = true;
let obstacles = [];
let stars = [];
let gameSpeed = 1;
let spawnRate = 100;
let frameCount = 0;

// 按鍵狀態
const keys = {};

// 事件監聽
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if ((e.key === 'ArrowUp' || e.key === ' ') && !player.jumping) {
        player.jumping = true;
        player.speedY = -player.jumpPower;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// 初始化高分
function initHighScore() {
    document.getElementById('highScore').textContent = highScore;
}

// 障礙物類別
class Obstacle {
    constructor() {
        this.width = 50 + Math.random() * 30;
        this.height = 40 + Math.random() * 20;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speedY = 3 + gameSpeed * 0.5;
        this.color = '#FF4444';
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 添加邊框
        ctx.strokeStyle = '#CC0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y += this.speedY;
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
}

// 星星類別
class Star {
    constructor() {
        this.width = 20;
        this.height = 20;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speedY = 2 + gameSpeed * 0.3;
        this.color = '#FFD700';
        this.rotation = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // 繪製星星
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * 10;
            const y = Math.sin(angle) * 10;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    update() {
        this.y += this.speedY;
        this.rotation += 0.1;
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
}

// 繪製玩家
function drawPlayer() {
    // 身體
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // 邊框
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 3;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    
    // 眼睛
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 10, player.y + 8, 6, 6);
    ctx.fillRect(player.x + 24, player.y + 8, 6, 6);
    
    // 嘴巴
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y + 20, 5, 0, Math.PI);
    ctx.stroke();
}

// 碰撞檢測
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// 更新玩家
function updatePlayer() {
    // 水平移動
    if (keys['ArrowLeft'] || keys['a']) {
        player.speedX = -player.maxSpeed;
    } else if (keys['ArrowRight'] || keys['d']) {
        player.speedX = player.maxSpeed;
    } else {
        player.speedX *= 0.8; // 摩擦力
    }

    player.x += player.speedX;

    // 邊界檢測
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // 重力
    if (player.jumping) {
        player.speedY += player.gravity;
    }

    player.y += player.speedY;

    // 著地檢測
    if (player.y + player.height >= canvas.height - 10) {
        player.y = canvas.height - player.height - 10;
        player.jumping = false;
        player.speedY = 0;
    }
}

// 遊戲更新
function update() {
    if (!gameRunning) return;

    frameCount++;

    updatePlayer();

    // 生成障礙物
    if (frameCount % spawnRate === 0) {
        obstacles.push(new Obstacle());
    }

    // 生成星星（較少）
    if (frameCount % (spawnRate * 2) === 0 && Math.random() > 0.5) {
        stars.push(new Star());
    }

    // 更新障礙物
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();

        // 碰撞檢測
        if (checkCollision(player, obstacles[i])) {
            lives--;
            document.getElementById('lives').textContent = lives;
            obstacles.splice(i, 1);

            if (lives <= 0) {
                endGame();
            }
        }

        // 移除離開螢幕的障礙物
        if (obstacles[i].isOffScreen()) {
            obstacles.splice(i, 1);
            score += 5; // 躲避獎勵
            document.getElementById('score').textContent = score;
        }
    }

    // 更新星星
    for (let i = stars.length - 1; i >= 0; i--) {
        stars[i].update();

        // 碰撞檢測
        if (checkCollision(player, stars[i])) {
            score += 10;
            document.getElementById('score').textContent = score;
            stars.splice(i, 1);
        }

        // 移除離開螢幕的星星
        if (stars[i].isOffScreen()) {
            stars.splice(i, 1);
        }
    }

    // 提高難度
    if (frameCount % 500 === 0) {
        gameSpeed += 0.2;
        spawnRate = Math.max(50, spawnRate - 5);
    }
}

// 繪製遊戲
function draw() {
    // 清空畫布
    ctx.fillStyle = 'rgba(135, 206, 235, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 繪製地面
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

    // 繪製星星和障礙物
    stars.forEach(star => star.draw());
    obstacles.forEach(obstacle => obstacle.draw());

    // 繪製玩家
    drawPlayer();

    // 難度指示
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.fillText(`難度: ${(gameSpeed).toFixed(1)}x`, 10, 25);
}

// 遊戲迴圈
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 結束遊戲
function endGame() {
    gameRunning = false;

    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }

    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalHighScore').textContent = highScore;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// 重新開始遊戲
function restartGame() {
    score = 0;
    lives = 3;
    gameRunning = true;
    gameSpeed = 1;
    spawnRate = 100;
    frameCount = 0;
    obstacles = [];
    stars = [];
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 50;
    player.speedX = 0;
    player.speedY = 0;
    player.jumping = false;

    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('gameOverScreen').classList.add('hidden');

    gameLoop();
}

// 初始化遊戲
initHighScore();
gameLoop();
