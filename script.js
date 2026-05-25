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

/* フロントカメラなら左右反転 */
video.style.transform =
cameraMode === "user"
? "scaleX(-1)"
: "scaleX(1)";

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

/* 指2本の時はドラッグしない */
if(e.touches.length === 2) return;

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
video.clientHeight;

/* カメラ描画（フロントカメラなら反転） */

ctx.save();

if(cameraMode === "user"){
ctx.translate(canvas.width, 0);
ctx.scale(-1, 1);
}

ctx.drawImage(
video,
0,
0,
canvas.width,
canvas.height
);

ctx.restore();

/* キャラ描画 */

const scaleX = canvas.width / video.clientWidth;
const scaleY = canvas.height / video.clientHeight;

ctx.drawImage(
character,
posX * scaleX,
posY * scaleY,
character.width * scaleX,
character.height * scaleY
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

/* ======================
   ピンチでサイズ変更
====================== */

let lastDistance = null;
let currentSize = 120;

document.addEventListener(
"touchstart",
(e)=>{

if(e.touches.length === 2){
lastDistance = getDistance(e.touches);
}

}
);

document.addEventListener(
"touchmove",
(e)=>{

if(e.touches.length === 2){

e.preventDefault();

const distance =
getDistance(e.touches);

if(lastDistance){

const diff =
distance - lastDistance;

currentSize =
Math.min(300,
Math.max(50,
currentSize + diff * 0.3
));

character.style.width =
currentSize + "px";

}

lastDistance = distance;

}

},
{ passive:false }
);

document.addEventListener(
"touchend",
(e)=>{

if(e.touches.length < 2){
lastDistance = null;
}

}
);

/* 2点間の距離を計算 */

function getDistance(touches){

const dx =
touches[0].clientX -
touches[1].clientX;

const dy =
touches[0].clientY -
touches[1].clientY;

return Math.sqrt(
dx * dx + dy * dy
);

}
