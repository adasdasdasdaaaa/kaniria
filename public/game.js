const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 40;
const worldWidth = 50;
const worldHeight = 20;

// ワールド生成（下に土ブロック）
let world = Array.from({ length: worldHeight }, (_, y) =>
  Array.from({ length: worldWidth }, (_, x) => y >= 15 ? 1 : 0)
);

// プレイヤー
let player = {
  x: 100,
  y: 100,
  width: 30,
  height: 40,
  vx: 0,
  vy: 0
};

// キー入力
const keys = {};
window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

// カメラ
let camera = { x: 0, y: 0 };

// ブロック操作（左クリック設置・右クリック破壊）
canvas.addEventListener("mousedown", (e) => {
  const worldX = Math.floor((e.offsetX + camera.x) / tileSize);
  const worldY = Math.floor((e.offsetY + camera.y) / tileSize);

  // プレイヤー中心から1タイル以内
  const px = player.x + player.width / 2;
  const py = player.y + player.height / 2;
  if (Math.abs(px - (worldX * tileSize + tileSize/2)) > tileSize*1.5) return;
  if (Math.abs(py - (worldY * tileSize + tileSize/2)) > tileSize*1.5) return;

  if (e.button === 0 && world[worldY][worldX] === 0) world[worldY][worldX] = 1;
  if (e.button === 2 && world[worldY][worldX] === 1) world[worldY][worldX] = 0;
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

// プレイヤー更新（重力 + 簡易衝突）
function updatePlayer() {
  // 横移動
  player.vx = 0;
  if (keys["a"]) player.vx = -3;
  if (keys["d"]) player.vx = 3;

  // 縦移動（重力）
  player.vy += 0.5;
  if (keys["w"]) player.vy = -5; // ジャンプキーで上に移動

  // 次の位置
  let nextX = player.x + player.vx;
  let nextY = player.y + player.vy;

  // 衝突判定
  const leftTile = Math.floor(nextX / tileSize);
  const rightTile = Math.floor((nextX + player.width) / tileSize);
  const topTile = Math.floor(nextY / tileSize);
  const bottomTile = Math.floor((nextY + player.height) / tileSize);

  // 横方向
  for (let y = topTile; y <= bottomTile; y++) {
    if (world[y]?.[leftTile] === 1) nextX = leftTile * tileSize + tileSize;
    if (world[y]?.[rightTile] === 1) nextX = rightTile * tileSize - player.width;
  }

  // 縦方向
  for (let x = leftTile; x <= rightTile; x++) {
    if (player.vy > 0 && world[bottomTile]?.[x] === 1) {
      nextY = bottomTile * tileSize - player.height;
      player.vy = 0;
    }
    if (player.vy < 0 && world[topTile]?.[x] === 1) {
      nextY = (topTile+1) * tileSize;
      player.vy = 0;
    }
  }

  player.x = nextX;
  player.y = nextY;

  // カメラ追尾
  camera.x = player.x - canvas.width/2;
  camera.y = player.y - canvas.height/2;
}

// 描画
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ワールド
  for (let y=0; y<worldHeight; y++) {
    for (let x=0; x<worldWidth; x++) {
      if (world[y][x] === 1) {
        ctx.fillStyle = "#8b4513";
        ctx.fillRect(x*tileSize - camera.x, y*tileSize - camera.y, tileSize, tileSize);
      }
    }
  }

  // プレイヤー
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
