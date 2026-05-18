/* HTML取得 */

const video =
document.getElementById("video");

const frame =
document.getElementById("frame");

const captureBtn =
document.getElementById("captureBtn");

const changeCameraBtn =
document.getElementById("changeCameraBtn");

const count =
document.getElementById("count");

const flash =
document.getElementById("flash");

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

/* カメラ設定 */

let cameraMode = "user";

let stream;

/* カメラ起動 */

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

/* カメラ切替 */

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

/* 撮影 */

captureBtn
.addEventListener(
"click",

async ()=>{

count.style.display = "block";

/* 3秒カウント */

for(let i=3;i>=1;i--){

count.textContent = i;

await new Promise(
resolve =>
setTimeout(resolve,1000)
);

}

/* カウント消す */

count.style.display = "none";

/* フラッシュ */

flash.style.opacity = "1";

setTimeout(()=>{

flash.style.opacity = "0";

},100);

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

/* 閉じる */

closeBtn
.addEventListener(
"click",
()=>{

modal.style.display = "none";

}
);

/* ======================
   キャラ移動
====================== */

const character =
document.getElementById("character");

/* 位置 */
let posX = 100;
let posY = 200;

/* ドラッグ中 */
let isDragging = false;

/* 指との差 */
let offsetX = 0;
let offsetY = 0;

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

/* タッチ移動 */

document.addEventListener(
"touchmove",
(e)=>{

if(!isDragging) return;

posX =
e.touches[0].clientX - offsetX;

posY =
e.touches[0].clientY - offsetY;

/* 移動 */
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