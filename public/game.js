const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 450;

const tileSize = 40;
const worldWidth = 100;
const worldHeight = 30;

// ワールド生成（簡易バイオーム）
let world = Array.from({length: worldHeight}, (_, y) =>
  Array.from({length: worldWidth}, (_, x) => {
    if(y >= worldHeight - 4) return "dirt";
    if(y === worldHeight -5) return "grass";
    return null;
  })
);

// プレイヤー
let player = {x:100, y:100, width:30, height:40, vx:0, vy:0, onGround:false, jumpsLeft:2, health:100};

// カメラ
let camera = {x:0, y:0};

// キー入力
const keys = {};
window.addEventListener("keydown", e=>keys[e.key.toLowerCase()]=true);
window.addEventListener("keyup", e=>keys[e.key.toLowerCase()]=false);

// ホットバー / インベントリ
const hotbar = ["dirt","grass","stone"];
let inventory = {"dirt":0,"grass":0,"stone":0};
let selectedBlock = 0;
window.addEventListener("keydown", e=>{
  if(["1","2","3"].includes(e.key)) selectedBlock=parseInt(e.key)-1;
});

// マウスでブロック操作（近く制限 + 採掘）
canvas.addEventListener("mousedown", e=>{
  const worldX = Math.floor((e.offsetX+camera.x)/tileSize);
  const worldY = Math.floor((e.offsetY+camera.y)/tileSize);
  const px = player.x + player.width/2;
  const py = player.y + player.height/2;
  if(Math.abs(px-(worldX*tileSize+tileSize/2))>tileSize*2) return;
  if(Math.abs(py-(worldY*tileSize+tileSize/2))>tileSize*2) return;

  if(e.button === 0){ // 設置
    const blockType = hotbar[selectedBlock];
    if(inventory[blockType] > 0){
      world[worldY][worldX] = blockType;
      inventory[blockType]--;
    }
  }
  if(e.button === 2){ // 採掘
    const block = world[worldY][worldX];
    if(block){
      world[worldY][worldX] = null;
      inventory[block] = (inventory[block]||0) + 1;
    }
  }
});
canvas.addEventListener("contextmenu", e=>e.preventDefault());

// 衝突判定
function resolveCollision(nextX,nextY){
  let x=nextX,y=nextY,onGround=false;
  const margin=0.1;
  let topTile=Math.floor(y/tileSize);
  let bottomTile=Math.floor((y+player.height)/tileSize);
  let leftTile=Math.floor(x/tileSize);
  let rightTile=Math.floor((x+player.width)/tileSize);

  // 縦判定
  for(let j=topTile;j<=bottomTile;j++){
    for(let i=leftTile;i<=rightTile;i++){
      if(world[j]?.[i]){
        if(player.vy>0){ //落下
          y=j*tileSize-player.height-margin;
          player.vy=0;
          onGround=true;
          player.jumpsLeft=2;
        } else if(player.vy<0){ //上昇
          y=(j+1)*tileSize+margin;
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
        if(player.vx>0) x=i*tileSize-player.width-margin;
        if(player.vx<0) x=(i+1)*tileSize+margin;
        player.vx=0;
      }
    }
  }

  return {x,y,onGround};
}

// プレイヤー更新
let prevY = 0;
function updatePlayer(){
  const accel=0.3, friction=0.8, maxSpeed=5, gravity=0.5, jumpSpeed=-8;

  if(keys["a"]) player.vx-=accel;
  if(keys["d"]) player.vx+=accel;
  if(!keys["a"]&&!keys["d"]) player.vx*=friction;
  player.vx=Math.max(Math.min(player.vx,maxSpeed),-maxSpeed);

  player.vy+=gravity;
  if(player.vy>12) player.vy=12;

  let {x,y,onGround}=resolveCollision(player.x+player.vx,player.y+player.vy);

  // 落下ダメージ
  if(player.onGround && !onGround){
    prevY = player.y;
  }
  if(!player.onGround && onGround){
    const fallDist = y - prevY;
    if(fallDist > 100) player.health -= Math.floor((fallDist-100)/5);
    if(player.health < 0) player.health = 0;
  }

  player.x = x;
  player.y = y;
  player.onGround = onGround;

  if((keys["w"]||keys[" "]) && player.jumpsLeft>0 && (player.onGround||player.jumpsLeft===2)){
    player.vy=jumpSpeed;
    player.jumpsLeft--;
  }

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
        switch(block){
          case "dirt": ctx.fillStyle="#8b4513"; break;
          case "grass": ctx.fillStyle="#228B22"; break;
          case "stone": ctx.fillStyle="#888"; break;
        }
        ctx.fillRect(x*tileSize-camera.x,y*tileSize-camera.y,tileSize,tileSize);
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
    ctx.fillText(b+"("+inventory[b]+")",12+i*50,canvas.height-20);
  });

  // HP表示
  ctx.fillStyle="red";
  ctx.fillRect(10,10,player.health*2,20);
  ctx.strokeStyle="black";
  ctx.strokeRect(10,10,200,20);
}

// ループ
function gameLoop(){updatePlayer(); draw(); requestAnimationFrame(gameLoop);}
gameLoop();
