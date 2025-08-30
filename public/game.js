const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 40;
const worldWidth = 100;
const worldHeight = 30;

// ワールド生成
let world = Array.from({ length: worldHeight }, (_, y) =>
  Array.from({ length: worldWidth }, (_, x) =>
    y > 20 ? 1 : 0 // 地面
  )
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

// ブロック設置／破壊
canvas.addEventListener("mousedown", (e) => {
  const worldX = Math.floor((mouseX + camera.x) / tileSize);
  const worldY = Math.floor((mouseY + camera.y) / tileSize);

  const dx = worldX * tileSize + tileSize / 2 - (player.x + player.width / 2);
  const dy = worldY * tileSize + tileSize / 2 - (player.y + player.height / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 120) { // プレイヤー近くのみ
    if (e.button === 0) {
      // 左クリック = 設置
      if (world[worldY] && world[worldY][worldX] === 0) {
        world[worldY][worldX] = 1;
      }
    } else if (e.button === 2) {
      // 右クリック = 破壊
      if (world[worldY] && world[worldY][worldX] === 1) {
        world[worldY][worldX] = 0;
      }
    }
  }
});

// 右クリックメニュー無効化
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

// カメラ
let camera = { x: 0, y: 0 };

// プレイヤー更新
function updatePlayer() {
  // 移動
  if (keys["a"]) player.vx = -3;
  else if (keys["d"]) player.vx = 3;
  else player.vx = 0;

  if (keys["w"] && player.onGround) {
    player.vy = -10;
    player.onGround = false;
  }

  // 重力
  player.vy += 0.5;

  // 移動
  player.x += player.vx;
  player.y += player.vy;

  // 地面との当たり判定
  player.onGround = false;
  const px = Math.floor(player.x / tileSize);
  const py = Math.floor(player.y / tileSize);

  if (py + 1 < worldHeight && world[py + 1][px] === 1) {
    if (player.vy > 0) {
      player.y = py * tileSize;
      player.vy = 0;
      player.onGround = true;
    }
  }

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
