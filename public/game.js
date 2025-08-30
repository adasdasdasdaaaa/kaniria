const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 40;
const worldWidth = 50;
const worldHeight = 20;

// ワールド生成
let world = Array.from({ length: worldHeight }, (_, y) =>
  Array.from({ length: worldWidth }, (_, x) => y >= 15 ? 1 : 0)
);

// プレイヤー
let player = { x: 100, y: 100, width: 30, height: 40, vx: 0, vy: 0 };

// キー入力
const keys = {};
window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

// カメラ
let camera = { x: 0, y: 0 };

// マウス操作で設置/破壊
canvas.addEventListener("mousedown", (e) => {
  const worldX = Math.floor((e.offsetX + camera.x) / tileSize);
  const worldY = Math.floor((e.offsetY + camera.y) / tileSize);

  const px = player.x + player.width/2;
  const py = player.y + player.height/2;
  if (Math.abs(px - (worldX*tileSize + tileSize/2)) > tileSize*1.5) return;
  if (Math.abs(py - (worldY*tileSize + tileSize/2)) > tileSize*1.5) return;

  if (e.button === 0 && world[worldY][worldX] === 0) world[worldY][worldX] = 1;
  if (e.button === 2 && world[worldY][worldX] === 1) world[worldY][worldX] = 0;
});
canvas.addEventListener("contextmenu", e => e.preventDefault());

// 衝突判定（AABBスムーズ）
function resolveCollision(nextX, nextY) {
  let x = nextX, y = nextY;

  // 縦の衝突
  const topTile = Math.floor(y / tileSize);
  const bottomTile = Math.floor((y + player.height) / tileSize);
  const leftTile = Math.floor(x / tileSize);
  const rightTile = Math.floor((x + player.width) / tileSize);

  for (let i = topTile; i <= bottomTile; i++) {
    for (let j = leftTile; j <= rightTile; j++) {
      if (world[i]?.[j] === 1) {
        // 上から落下中
        if (player.vy > 0) y = i*tileSize - player.height;
        // 上方向
        if (player.vy < 0) y = (i+1)*tileSize;
        player.vy = 0;
      }
    }
  }

  // 横の衝突
  for (let i = topTile; i <= bottomTile; i++) {
    for (let j = leftTile; j <= rightTile; j++) {
      if (world[i]?.[j] === 1) {
        if (player.vx > 0) x = j*tileSize - player.width;
        if (player.vx < 0) x = (j+1)*tileSize;
        player.vx = 0;
      }
    }
  }

  return { x, y };
}

// プレイヤー更新
function updatePlayer() {
  player.vx = 0;
  if (keys["a"]) player.vx = -3;
  if (keys["d"]) player.vx = 3;

  if (keys["w"]) player.vy = -7; // 上移動（ジャンプ）

  player.vy += 0.5; // 重力

  // 滑らか衝突判定
  const { x, y } = resolveCollision(player.x + player.vx, player.y + player.vy);
  player.x = x;
  player.y = y;

  // カメラ追尾
  camera.x = player.x - canvas.width/2;
  camera.y = player.y - canvas.height/2;
}

// 描画
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for (let y=0; y<worldHeight; y++) {
    for (let x=0; x<worldWidth; x++) {
      if (world[y][x] === 1) {
        ctx.fillStyle = "#8b4513";
        ctx.fillRect(x*tileSize - camera.x, y*tileSize - camera.y, tileSize, tileSize);
      }
    }
  }

  ctx.fillStyle = "blue";
  ctx.fillRect(player.x - camera.x, player.y - camera.y, player.width, player.height);
}

// ゲームループ
function gameLoop() {
  updatePlayer();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
