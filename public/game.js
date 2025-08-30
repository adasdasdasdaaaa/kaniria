const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 40;
const worldWidth = 100;
const worldHeight = 30;

// ワールド生成
let world = Array.from({ length: worldHeight }, (_, y) =>
  Array.from({ length: worldWidth }, (_, x) => y > 20 ? 1 : 0)
);

// プレイヤー
let player = {
  x: 100,
  y: 100,
  vx: 0,
  vy: 0,
  width: 30,
  height: 40,
  onGround: false
};

// キー入力
const keys = {};
window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

// マウス位置
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener("mousemove", (e) => {
  mouseX = e.offsetX;
  mouseY = e.offsetY;
});

// カメラ
let camera = { x: 0, y: 0 };

// 設置・破壊（ブロック厚み考慮）
canvas.addEventListener("mousedown", (e) => {
  const worldX = Math.floor((mouseX + camera.x) / tileSize);
  const worldY = Math.floor((mouseY + camera.y) / tileSize);
  if (!world[worldY] || !world[worldY][worldX] !== 0) return;

  const blockLeft = worldX * tileSize;
  const blockRight = blockLeft + tileSize;
  const blockTop = worldY * tileSize;
  const blockBottom = blockTop + tileSize;

  const playerLeft = player.x;
  const playerRight = player.x + player.width;
  const playerTop = player.y;
  const playerBottom = player.y + player.height;

  const dx = Math.max(blockLeft - playerRight, playerLeft - blockRight, 0);
  const dy = Math.max(blockTop - playerBottom, playerTop - blockBottom, 0);
  const dist = Math.sqrt(dx*dx + dy*dy);

  if (dist <= 120) {
    if (e.button === 0 && world[worldY][worldX] === 0) world[worldY][worldX] = 1;
    if (e.button === 2 && world[worldY][worldX] === 1) world[worldY][worldX] = 0;
  }
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

// プレイヤー更新（衝突判定込み）
function updatePlayer() {
  // 横移動
  let nextX = player.x;
  if (keys["a"]) nextX -= 3;
  else if (keys["d"]) nextX += 3;

  // 横方向衝突判定
  const leftTile = Math.floor(nextX / tileSize);
  const rightTile = Math.floor((nextX + player.width) / tileSize);
  const topTile = Math.floor(player.y / tileSize);
  const bottomTile = Math.floor((player.y + player.height) / tileSize);

  let collisionX = false;
  for (let y = topTile; y <= bottomTile; y++) {
    if ((world[y][leftTile] === 1 && keys["a"]) ||
        (world[y][rightTile] === 1 && keys["d"])) {
      collisionX = true;
      break;
    }
  }
  if (!collisionX) player.x = nextX;

  // ジャンプ
  if (keys["w"] && player.onGround) {
    player.vy = -10;
    player.onGround = false;
  }

  // 重力
  player.vy += 0.5;
  let nextY = player.y + player.vy;

  // 縦方向衝突判定
  const leftTileX = Math.floor(player.x / tileSize);
  const rightTileX = Math.floor((player.x + player.width) / tileSize);
  const topTileY = Math.floor(nextY / tileSize);
  const bottomTileY = Math.floor((nextY + player.height) / tileSize);

  let collisionY = false;
  for (let x = leftTileX; x <= rightTileX; x++) {
    if (player.vy > 0 && world[bottomTileY][x] === 1) {
      nextY = bottomTileY * tileSize - player.height;
      player.vy = 0;
      player.onGround = true;
      collisionY = true;
      break;
    }
    if (player.vy < 0 && world[topTileY][x] === 1) {
      nextY = (topTileY + 1) * tileSize;
      player.vy = 0;
      collisionY = true;
      break;
    }
  }
  if (!collisionY) player.onGround = false;
  player.y = nextY;

  // カメラ追尾
  camera.x = player.x - canvas.width / 2;
  camera.y = player.y - canvas.height / 2;
}

// 描画
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ワールド
  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      if (world[y][x] === 1) {
        ctx.fillStyle = "#8b4513";
        ctx.fillRect(
          x * tileSize - camera.x,
          y * tileSize - camera.y,
          tileSize,
          tileSize
        );
      }
    }
  }

  // プレイヤー
  ctx.fillStyle = "blue";
  ctx.fillRect(
    player.x - camera.x,
    player.y - camera.y,
    player.width,
    player.height
  );
}

// ゲームループ
function gameLoop() {
  updatePlayer();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
