const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

// マップサイズ
const mapWidth = 100;
const mapHeight = 30;
const tileSize = 20;

// ワールド生成（0=空,1=土,2=石）
let world = Array.from({ length: mapHeight }, (_, y) =>
  Array.from({ length: mapWidth }, (_, x) => {
    if (y > 20) return 1; // 土
    if (y > 25) return 2; // 石
    return 0; // 空
  })
);

// プレイヤー
let player = {
  x: 50,
  y: 10,
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

  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ワールド描画
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      if (world[y][x] === 1) {
        ctx.fillStyle = "brown"; // 土
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
      if (world[y][x] === 2) {
        ctx.fillStyle = "gray"; // 石
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }

  // プレイヤー
  ctx.fillStyle = "red";
  ctx.fillRect(player.x, player.y, player.w, player.h);
}

update();
