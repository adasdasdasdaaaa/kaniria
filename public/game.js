// game.js（追尾＆ズーム対応・そのまま置き換えOK）
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// キャンバスの実サイズ（CSS で width/height を指定しないでOK）
canvas.width = 800;
canvas.height = 600;

// ==== ワールド設定 ====
const mapWidth = 150;   // 横タイル数
const mapHeight = 50;   // 縦タイル数
const tileSize = 16;    // 1タイルの論理ピクセル
let zoom = 3;           // 🔎 ズーム倍率（大きいほど“寄る”=視野が狭くなる）

// ワールド生成（0=空,1=土,2=石）
const world = Array.from({ length: mapHeight }, (_, y) =>
  Array.from({ length: mapWidth }, (_, x) => {
    if (y > 35) return 2;        // 石層
    if (y > 25) return 1;        // 土層
    return 0;                    // 空
  })
);

// ==== プレイヤー ====
const player = {
  x: 50 * tileSize,     // ピクセル座標（タイル×tileSize）
  y: 10 * tileSize,
  w: 12,
  h: 16,
  dx: 0,
  dy: 0,
  onGround: false,
  speed: 2,
  jump: -8
};

// ==== 入力 ====
const keys = {};
addEventListener("keydown", e => (keys[e.key] = true));
addEventListener("keyup",   e => (keys[e.key] = false));

// ==== カメラ（ワールド座標・ピクセル単位）====
let cameraX = 0;
let cameraY = 0;

// ==== 物理パラメータ ====
const gravity = 0.45;
const maxFall = 12;

// ==== 便利: 視口（ズーム考慮後の見える論理サイズ）====
function viewW() { return canvas.width / zoom; }
function viewH() { return canvas.height / zoom; }

// ==== ループ ====
function update() {
  // --- プレイヤー移動入力 ---
  if (keys["ArrowLeft"] || keys["a"])  player.dx = -player.speed;
  else if (keys["ArrowRight"] || keys["d"]) player.dx =  player.speed;
  else player.dx = 0;

  if ((keys[" "] || keys["ArrowUp"] || keys["w"]) && player.onGround) {
    player.dy = player.jump;
    player.onGround = false;
  }

  // --- 重力 ---
  player.dy += gravity;
  if (player.dy > maxFall) player.dy = maxFall;

  // --- 移動適用 ---
  player.x += player.dx;
  player.y += player.dy;

  // 簡易の地面・壁クランプ（本格当たり判定は後で）
  const worldW = mapWidth * tileSize;
  const worldH = mapHeight * tileSize;
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > worldW) player.x = worldW - player.w;

  // 地面
  if (player.y + player.h >= worldH) {
    player.y = worldH - player.h;
    player.dy = 0;
    player.onGround = true;
  } else {
    // 仮: 近辺ブロックで地面に乗る簡易判定（必要最低限）
    const footY = Math.floor((player.y + player.h) / tileSize);
    const leftX = Math.floor(player.x / tileSize);
    const rightX = Math.floor((player.x + player.w - 1) / tileSize);
    if (footY >= 0 && footY < mapHeight) {
      const onBlock =
        (world[footY]?.[leftX] ?? 0) !== 0 ||
        (world[footY]?.[rightX] ?? 0) !== 0;
      if (onBlock && player.dy >= 0) {
        player.y = footY * tileSize - player.h;
        player.dy = 0;
        player.onGround = true;
      } else if (!onBlock) {
        player.onGround = false;
      }
    }
  }

  // --- カメラ追尾（スムーズに追従）---
  const targetCamX = player.x + player.w / 2 - viewW() / 2;
  const targetCamY = player.y + player.h / 2 - viewH() / 2;

  // 補間してヌルっと追従（0.15 を上げるとカメラがキビキビ）
  cameraX += (targetCamX - cameraX) * 0.15;
  cameraY += (targetCamY - cameraY) * 0.15;

  // マップ外に出さない（ズーム考慮）
  cameraX = Math.max(0, Math.min(cameraX, worldW - viewW()));
  cameraY = Math.max(0, Math.min(cameraY, worldH - viewH()));

  draw();
  requestAnimationFrame(update);
}

// ==== 描画 ====
function draw() {
  // ズームを考慮して論理サイズ分だけクリア
  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.clearRect(0, 0, viewW(), viewH());

  // 画面に映るタイル範囲だけ描く（高速化）
  const minTileX = Math.max(0, Math.floor(cameraX / tileSize) - 1);
  const maxTileX = Math.min(mapWidth, Math.ceil((cameraX + viewW()) / tileSize) + 1);
  const minTileY = Math.max(0, Math.floor(cameraY / tileSize) - 1);
  const maxTileY = Math.min(mapHeight, Math.ceil((cameraY + viewH()) / tileSize) + 1);

  for (let y = minTileY; y < maxTileY; y++) {
    for (let x = minTileX; x < maxTileX; x++) {
      const t = world[y][x];
      if (!t) continue;
      ctx.fillStyle = t === 1 ? "#8b5a2b" : "#7a7a7a"; // 土/石
      ctx.fillRect(
        x * tileSize - cameraX,
        y * tileSize - cameraY,
        tileSize,
        tileSize
      );
    }
  }

  // プレイヤー
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(
    player.x - cameraX,
    player.y - cameraY,
    player.w,
    player.h
  );

  ctx.restore();
}

// ==== 便利：ズーム変更（+/- でテスト可能）====
addEventListener("keydown", e => {
  if (e.key === "+") { zoom = Math.min(5, zoom + 0.25); }
  if (e.key === "-") { zoom = Math.max(1, zoom - 0.25); }
});

update();

