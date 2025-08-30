// ==== インベントリ（現在選択中のブロック）====
let selectedBlock = 1; // デフォルトは土（1）

// キーで切り替え（1=土, 2=石, 3=空/手）
addEventListener("keydown", e => {
  if (e.key === "1") selectedBlock = 1;
  if (e.key === "2") selectedBlock = 2;
  if (e.key === "3") selectedBlock = 0;
});

// ==== 範囲制限の距離（px単位で判定）====
const buildRange = 5 * tileSize; // 5ブロック分の距離

// ==== マウス操作（設置＆破壊）====
canvas.addEventListener("mousedown", e => {
  const { tileX, tileY } = getWorldTileFromMouse(e);
  if (tileX < 0 || tileY < 0 || tileX >= mapWidth || tileY >= mapHeight) return;

  // プレイヤー中心とクリック座標の距離
  const blockCenterX = tileX * tileSize + tileSize / 2;
  const blockCenterY = tileY * tileSize + tileSize / 2;
  const dx = blockCenterX - (player.x + player.w / 2);
  const dy = blockCenterY - (player.y + player.h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // 範囲外なら何もしない
  if (dist > buildRange) return;

  if (e.button === 0) {
    // 左クリック = 破壊
    world[tileY][tileX] = 0;
  } else if (e.button === 2) {
    // 右クリック = 設置（空いてるところのみ）
    if (world[tileY][tileX] === 0 && selectedBlock !== 0) {
      world[tileY][tileX] = selectedBlock;
    }
  }
});

// コンテキストメニュー禁止（右クリック対応用）
canvas.addEventListener("contextmenu", e => e.preventDefault());

// ==== 画面にインベントリ表示 ====
function drawInventory() {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(10, 10, 120, 40);

  const items = [
    { id: 1, name: "土", color: "#8b5a2b" },
    { id: 2, name: "石", color: "#7a7a7a" },
    { id: 0, name: "手", color: "#ffffff" },
  ];

  items.forEach((item, i) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(15 + i * 40, 15, 20, 20);

    if (selectedBlock === item.id) {
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 2;
      ctx.strokeRect(15 + i * 40, 15, 20, 20);
    }
  });
}

// draw() の最後に追加
function draw() {
  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.clearRect(0, 0, viewW(), viewH());

  const minTileX = Math.max(0, Math.floor(cameraX / tileSize) - 1);
  const maxTileX = Math.min(mapWidth, Math.ceil((cameraX + viewW()) / tileSize) + 1);
  const minTileY = Math.max(0, Math.floor(cameraY / tileSize) - 1);
  const maxTileY = Math.min(mapHeight, Math.ceil((cameraY + viewH()) / tileSize) + 1);

  for (let y = minTileY; y < maxTileY; y++) {
    for (let x = minTileX; x < maxTileX; x++) {
      const t = world[y][x];
      if (!t) continue;
      ctx.fillStyle = t === 1 ? "#8b5a2b" : "#7a7a7a";
      ctx.fillRect(
        x * tileSize - cameraX,
        y * tileSize - cameraY,
        tileSize,
        tileSize
      );
    }
  }

  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(
    player.x - cameraX,
    player.y - cameraY,
    player.w,
    player.h
  );

  ctx.restore();

  // インベントリ描画（UIはズーム影響を受けないように外で）
  drawInventory();
}
