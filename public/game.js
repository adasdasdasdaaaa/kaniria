// ==== 基本設定 ====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

const tileSize = 32;
const mapWidth = 100;
const mapHeight = 50;

let zoom = 1.5;

// ==== プレイヤー ====
const player = { x: 100, y: 100, w: 28, h: 28, vx: 0, vy: 0, onGround: false };
let cameraX = 0, cameraY = 0;

// ==== マップ生成 ====
let world = [];
for (let y = 0; y < mapHeight; y++) {
  world[y] = [];
  for (let x = 0; x < mapWidth; x++) {
    if (y > 35) world[y][x] = 1; // 土
    else if (y === 35) world[y][x] = 2; // 石
    else world[y][x] = 0;
  }
}

// ==== インベントリ ====
let inventory = {
  blocks: { 1: 20, 2: 10 }, // 土と石
  items: { geode: 0, gold: 0, diamond: 0, trash: 0 }
};
let selectedBlock = 1; // 初期は土

// ==== 入力 ====
const keys = {};
addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === "1") selectedBlock = 1;
  if (e.key === "2") selectedBlock = 2;
  if (e.key === "3") selectedBlock = 0;
});
addEventListener("keyup", e => keys[e.key] = false);

// ==== カメラ追尾 ====
function updateCamera() {
  cameraX = player.x + player.w / 2 - canvas.width / (2 * zoom);
  cameraY = player.y + player.h / 2 - canvas.height / (2 * zoom);
}

// ==== 物理処理 ====
function updatePlayer() {
  player.vx = 0;
  if (keys["a"]) player.vx = -3;
  if (keys["d"]) player.vx = 3;
  if (keys["w"] && player.onGround) { player.vy = -10; player.onGround = false; }

  player.vy += 0.5; // 重力
  if (player.vy > 10) player.vy = 10;

  player.x += player.vx;
  player.y += player.vy;

  // 当たり判定
  player.onGround = false;
  let px1 = Math.floor(player.x / tileSize);
  let py1 = Math.floor(player.y / tileSize);
  let px2 = Math.floor((player.x + player.w) / tileSize);
  let py2 = Math.floor((player.y + player.h) / tileSize);

  for (let y = py1; y <= py2; y++) {
    for (let x = px1; x <= px2; x++) {
      if (world[y] && world[y][x]) {
        let bx = x * tileSize;
        let by = y * tileSize;
        if (player.vy > 0 && player.y + player.h > by && player.y < by) {
          player.y = by - player.h;
          player.vy = 0;
          player.onGround = true;
        }
      }
    }
  }
}

// ==== 設置・破壊 ====
const buildRange = 5 * tileSize;

canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / zoom + cameraX;
  const my = (e.clientY - rect.top) / zoom + cameraY;
  const tileX = Math.floor(mx / tileSize);
  const tileY = Math.floor(my / tileSize);

  if (tileX < 0 || tileY < 0 || tileX >= mapWidth || tileY >= mapHeight) return;

  const blockCenterX = tileX * tileSize + tileSize / 2;
  const blockCenterY = tileY * tileSize + tileSize / 2;
  const dx = blockCenterX - (player.x + player.w / 2);
  const dy = blockCenterY - (player.y + player.h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > buildRange) return;

  if (e.button === 0) {
    // 破壊
    if (world[tileY][tileX] !== 0) {
      world[tileY][tileX] = 0;
      // ドロップ（ジオードのチャンス）
      if (Math.random() < 0.1) inventory.items.geode++;
    }
  } else if (e.button === 2) {
    // 設置
    if (world[tileY][tileX] === 0 && selectedBlock !== 0) {
      if (inventory.blocks[selectedBlock] > 0) {
        world[tileY][tileX] = selectedBlock;
        inventory.blocks[selectedBlock]--;
      }
    }
  }
});

canvas.addEventListener("contextmenu", e => e.preventDefault());

// ==== ジオードを開ける ====
function openGeode() {
  if (inventory.items.geode > 0) {
    inventory.items.geode--;
    let r = Math.random() * 100;
    if (r < 1) inventory.items.diamond++;
    else if (r < 6) inventory.items.gold++;
    else inventory.items.trash++;
  }
}

// ==== 描画 ====
function draw() {
  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // マップ
  const minTileX = Math.max(0, Math.floor(cameraX / tileSize) - 1);
  const maxTileX = Math.min(mapWidth, Math.ceil((cameraX + canvas.width) / tileSize) + 1);
  const minTileY = Math.max(0, Math.floor(cameraY / tileSize) - 1);
  const maxTileY = Math.min(mapHeight, Math.ceil((cameraY + canvas.height) / tileSize) + 1);

  for (let y = minTileY; y < maxTileY; y++) {
    for (let x = minTileX; x < maxTileX; x++) {
      const t = world[y][x];
      if (!t) continue;
      ctx.fillStyle = t === 1 ? "#8b5a2b" : "#7a7a7a";
      ctx.fillRect(x * tileSize - cameraX, y * tileSize - cameraY, tileSize, tileSize);
    }
  }

  // プレイヤー
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(player.x - cameraX, player.y - cameraY, player.w, player.h);

  ctx.restore();

  // ==== UI ====
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(10, 10, 250, 80);

  ctx.fillStyle = "#fff";
  ctx.font = "14px sans-serif";
  ctx.fillText("インベントリ:", 20, 30);
  ctx.fillText(`土:${inventory.blocks[1]} 石:${inventory.blocks[2]}`, 20, 50);
  ctx.fillText(`ジオード:${inventory.items.geode} 金:${inventory.items.gold} ダイヤ:${inventory.items.diamond}`, 20, 70);
}

// ==== メインループ ====
function loop() {
  updatePlayer();
  updateCamera();
  draw();
  requestAnimationFrame(loop);
}
loop();

// ==== ジオード開封ボタン ====
document.getElementById("openGeode").addEventListener("click", openGeode);
