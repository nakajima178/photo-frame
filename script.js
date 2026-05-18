/* ======================
   HTML取得
====================== */

const video =
document.getElementById("video");

const frame =
document.getElementById("frame");

const character =
document.getElementById("character");

const captureBtn =
document.getElementById("captureBtn");

const changeCameraBtn =
document.getElementById("changeCameraBtn");

const canvas =
document.getElementById("canvas");

const ctx =
canvas.getContext("2d");

const modal =
document.getElementById("modal");

const result =
document.getElementById("result");

const closeBtn =
document.getElementById("closeBtn");

/* ======================
   カメラ設定
====================== */

let cameraMode = "user";

let stream;

/* ======================
   カメラ起動
====================== */

async function startCamera(){

if(stream){

stream.getTracks().forEach(
track => track.stop()
);

}

try{

stream =
await navigator.mediaDevices
.getUserMedia({

video:{
facingMode:cameraMode
}

});

video.srcObject = stream;

}catch(error){

alert("カメラが起動できません");

}

}

/* 最初に起動 */

startCamera();

/* ======================
   カメラ切替
====================== */

changeCameraBtn
.addEventListener(
"click",
()=>{

cameraMode =
cameraMode === "user"
? "environment"
: "user";

startCamera();

}
);

/* ======================
   キャラ移動
====================== */

let posX = 100;
let posY = 200;

let isDragging = false;

let offsetX = 0;
let offsetY = 0;

/* 初期位置 */

character.style.left =
posX + "px";

character.style.top =
posY + "px";

/* タッチ開始 */

character.addEventListener(
"touchstart",
(e)=>{

isDragging = true;

offsetX =
e.touches[0].clientX - posX;

offsetY =
e.touches[0].clientY - posY;

}
);

/* 移動 */

document.addEventListener(
"touchmove",
(e)=>{

if(!isDragging) return;

posX =
e.touches[0].clientX - offsetX;

posY =
e.touches[0].clientY - offsetY;

character.style.left =
posX + "px";

character.style.top =
posY + "px";

}
);

/* タッチ終了 */

document.addEventListener(
"touchend",
()=>{

isDragging = false;

}
);

/* ======================
   撮影
====================== */

captureBtn
.addEventListener(
"click",
()=>{

/* canvasサイズ */

canvas.width =
video.videoWidth;

canvas.height =
video.videoHeight;

/* カメラ描画 */

ctx.drawImage(
video,
0,
0,
canvas.width,
canvas.height
);

/* キャラ描画 */

ctx.drawImage(
character,
posX,
posY,
character.width,
character.height
);

/* フレーム描画 */

ctx.drawImage(
frame,
0,
0,
canvas.width,
canvas.height
);

/* 画像化 */

const image =
canvas.toDataURL("image/png");

/* 表示 */

result.src = image;

/* モーダル表示 */

modal.style.display = "flex";

}
);

/* ======================
   閉じる
====================== */

closeBtn
.addEventListener(
"click",
()=>{

modal.style.display = "none";

}
);
