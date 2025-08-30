const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 450;

const tileSize = 40;
const worldWidth = 50;
const worldHeight = 20;

// ワールド生成（簡易地形）
let world = Array.from({length: worldHeight}, (_, y) =>
  Array.from({length: worldWidth}, (_, x) => {
    if(y >= 16) return "dirt";
    if(y === 15) return "grass";
    return null;
  })
);

// プレイヤー
let player = {
  x: 100, y: 100, width: 30, height: 40,
  vx: 0, vy: 0, onGround: false,
  jumpsLeft: 2, health: 100
};

// カメラ
let camera = {x:0, y:0};

// キー入力
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ホットバー
const hotbar = ["dirt","grass","stone"];
let selectedBlock = 0;
window.addEventListener("keydown", e => {
  if(["1","2","3"].includes(e.key)) selectedBlock = parseInt(e.key)-1;
});

// マウスでブロック操作
canvas.addEventListener("mousedown", e => {
  const worldX = Math.floor((e.offsetX + camera.x)/tileSize);
  const worldY = Math.floor((e.offsetY + camera.y)/tileSize);

  const px = player.x + player.width/2;
  const py = player.y + player.height/2;
  if(Math.abs(px - (worldX*tileSize + tileSize/2))>tileSize*2) return;
  if(Math.abs(py - (worldY*tileSize + tileSize/2))>tileSize*2) return;

  if(e.button === 0) world[worldY][worldX] = hotbar[selectedBlock]; //設置
  if(e.button === 2) world[worldY][worldX] = null; //破壊
});
canvas.addEventListener("contextmenu", e => e.preventDefault());

// 衝突判定（縦横分離 + マージン追加）
function resolveCollision(nextX,nextY){
  let x=nextX,y=nextY,onGround=false;
  const margin = 0.1;

  // 縦判定
  let topTile=Math.floor(y/tileSize);
  let bottomTile=Math.floor((y+player.height)/tileSize);
  let leftTile=Math.floor(x/tileSize);
  let rightTile=Math.floor((x+player.width)/tileSize);

  for(let j=topTile;j<=bottomTile;j++){
    for(let i=leftTile;i<=rightTile;i++){
      if(world[j]?.[i]){
        if(player.vy>0){ //落下
          y = j*tileSize - player.height - margin;
          player.vy=0;
          onGround=true;
          player.jumpsLeft=2;
        } else if(player.vy<0){ //上昇
          y = (j+1)*tileSize + margin;
          player.vy=0;
        }
      }
    }
  }

  // 横判定
  topTile=Math.floor(y/tileSize);
  bottomTile=Math.floor((y+player.height)/tileSize);
  leftTile=Math.floor(x/tileSize);
  rightTile=Math.floor((x+player.width)/tileSize);

  for(let j=topTile;j<=bottomTile;j++){
    for(let i=leftTile;i<=rightTile;i++){
      if(world[j]?.[i]){
        if(player.vx>0) x = i*tileSize - player.width - margin;
        if(player.vx<0) x = (i+1)*tileSize + margin;
        player.vx=0;
      }
    }
  }

  return {x,y,onGround};
}

// プレイヤー更新
function updatePlayer(){
  const accel=0.3, friction=0.8, maxSpeed=5, gravity=0.5, jumpSpeed=-8;

  // 横移動
  if(keys["a"]) player.vx -= accel;
  if(keys["d"]) player.vx += accel;
  if(!keys["a"]&&!keys["d"]) player.vx *= friction;
  player.vx = Math.max(Math.min(player.vx,maxSpeed), -maxSpeed);

  // 重力
  player.vy += gravity;
  if(player.vy>12) player.vy=12;

  // 衝突
  let {x,y,onGround} = resolveCollision(player.x+player.vx, player.y+player.vy);
  player.x = x;
  player.y = y;
  player.onGround = onGround;

  // ジャンプ
  if((keys["w"]||keys[" "]) && player.jumpsLeft>0 && (player.onGround || player.jumpsLeft===2)){
    player.vy = -8;
    player.jumpsLeft--;
  }

  // カメラ追尾
  camera.x = player.x - canvas.width/2;
  camera.y = player.y - canvas.height/2;
}

// 描画
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // ワールド
  for(let y=0;y<worldHeight;y++){
    for(let x=0;x<worldWidth;x++){
      const block = world[y][x];
      if(block){
        ctx.fillStyle = block==="dirt"?"#8b4513": block==="grass"?"#228B22":"#888";
        ctx.fillRect(x*tileSize-camera.x, y*tileSize-camera.y, tileSize, tileSize);
      }
    }
  }

  // プレイヤー
  ctx.fillStyle="blue";
  ctx.fillRect(player.x-camera.x, player.y-camera.y, player.width, player.height);

  // ホットバー
  hotbar.forEach((b,i)=>{
    ctx.fillStyle=i===selectedBlock?"yellow":"grey";
    ctx.fillRect(10+i*50, canvas.height-50, 40, 40);
    ctx.fillStyle="black";
    ctx.fillText(b, 12+i*50, canvas.height-20);
  });
}

// ループ
function gameLoop(){
  updatePlayer();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
