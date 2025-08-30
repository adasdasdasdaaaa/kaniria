const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 450;

const tileSize = 40;
const worldWidth = 50;
const worldHeight = 20;

// ワールド生成（背景・地形）
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

// キー入力
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ホットバー（ブロック種類）
const hotbar = ["dirt","grass","stone"];
let selectedBlock = 0;
window.addEventListener("keydown", e => {
  if(["1","2","3"].includes(e.key)) selectedBlock = parseInt(e.key)-1;
});

// カメラ
let camera = {x:0, y:0};

// ブロック操作
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

// 重力と衝突判定（簡易AABB）
function resolveCollision(nextX,nextY){
  let x=nextX,y=nextY,onGround=false;
  const left=Math.floor(x/tileSize);
  const right=Math.floor((x+player.width)/tileSize);
  const top=Math.floor(y/tileSize);
  const bottom=Math.floor((y+player.height)/tileSize);

  // 縦方向
  for(let i=left;i<=right;i++){
    for(let j=top;j<=bottom;j++){
      if(world[j]?.[i]){
        if(player.vy>0){y=j*tileSize-player.height; onGround=true; player.vy=0; player.jumpsLeft=2;}
        if(player.vy<0){y=(j+1)*tileSize; player.vy=0;}
      }
    }
  }
  // 横方向
  for(let i=top;i<=bottom;i++){
    for(let j=left;j<=right;j++){
      if(world[i]?.[j]){
        if(player.vx>0)x=j*tileSize-player.width;
        if(player.vx<0)x=(j+1)*tileSize;
        player.vx=0;
      }
    }
  }
  return {x,y,onGround};
}

// 更新
function updatePlayer(){
  // 横移動慣性
  const accel=0.3,friction=0.8,maxSpeed=5;
  if(keys["a"]) player.vx -= accel;
  if(keys["d"]) player.vx += accel;
  if(!keys["a"]&&!keys["d"]) player.vx*=friction;
  player.vx=Math.max(Math.min(player.vx,maxSpeed),-maxSpeed);

  // ジャンプ
  if((keys["w"]||keys[" "]) && player.jumpsLeft>0){
    player.vy=-8; player.jumpsLeft--;
  }

  // 重力
  player.vy+=0.5;
  if(player.vy>12) player.vy=12;

  // 衝突
  const {x,y,onGround}=resolveCollision(player.x+player.vx,player.y+player.vy);
  player.x=x; player.y=y; player.onGround=onGround;

  // カメラ
  camera.x=player.x-canvas.width/2;
  camera.y=player.y-canvas.height/2;
}

// 描画
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // ワールド
  for(let y=0;y<worldHeight;y++){
    for(let x=0;x<worldWidth;x++){
      const block=world[y][x];
      if(block){
        ctx.fillStyle = block==="dirt"?"#8b4513": block==="grass"?"#228B22":"#888";
        ctx.fillRect(x*tileSize-camera.x, y*tileSize-camera.y, tileSize, tileSize);
      }
    }
  }

  // プレイヤー
  ctx.fillStyle="blue";
  ctx.fillRect(player.x-camera.x,player.y-camera.y,player.width,player.height);

  // ホットバー
  hotbar.forEach((b,i)=>{
    ctx.fillStyle=i===selectedBlock?"yellow":"grey";
    ctx.fillRect(10+i*50,canvas.height-50,40,40);
    ctx.fillStyle="black";
    ctx.fillText(b,12+i*50,canvas.height-20);
  });
}

// ループ
function gameLoop(){
  updatePlayer();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
