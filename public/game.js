const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

const mapWidth = 100;
const mapHeight = 30;
const tileSize = 20;

// ワールド生成
let world = Array.from({ length: mapHeight }, (_, y) =>
  Array.from({ length: mapWidth }, (_, x) => {
    if (y > 20) return 1; // 土
    if (y > 25) return 2; // 石
    return 0; // 空
  })
);

// プレイヤー
let player = {
  x: 50 * tileSize, // マス基準からピクセル基準へ
  y: 10 * tileSize,
  w: 18,
  h: 18,
  dx: 0,
  dy: 0,
  onGround: false
};

// キー入力
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// カメラ位置
let cameraX = 0;
let cameraY = 0;

function update() {
  // 重力
  player.dy += 0.5;

  // 横移動
  if (keys["ArrowLeft"]) player.dx = -2;
  else if (keys["ArrowRight"]) player.dx = 2;
  else player.dx = 0;

  // ジャンプ
  if (keys[" "] && player.onGround) {
    player.dy = -8;
    player.onGround = false;
  }

  // 移動
  player.x += player.dx;
  player.y += player.dy;

  // 地面判定
  if (player.y > (mapHeight - 1) * tileSize - player.h) {
    player.y = (mapHeight - 1) * tileSize - player.h;
    player.dy = 0;
    player.onGround = true;
  }

  // カメラ追尾（プレイヤー中心）
  cameraX = player.x - canvas.width / 2 + player.w / 2;
  cameraY = player.y - canvas.height / 2 + player.h / 2;

  // カメラがマップ外に行かないよう制限
  cameraX = Math.max(0, Math.min(cameraX, mapWidth * tileSize - canvas.width));
  cameraY = Math.max(0, Math.min(cameraY, mapHeight * tileSize - canvas.height));

  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ワールド描画（カメラ分ずらす）
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      let tile = world[y][x];
      if (tile !== 0) {
        ctx.fillStyle = tile === 1 ? "brown" : "gray";
        ctx.fillRect(
          x * tileSize - cameraX,
          y * tileSize - cameraY,
          tileSize,
          tileSize
        );
      }
    }
  }

  // プレイヤー（カメラ分ずらす）
  ctx.fillStyle = "red";
  ctx.fillRect(
    player.x - cameraX,
    player.y - cameraY,
    player.w,
    player.h
  );
}

update();
