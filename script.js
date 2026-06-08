/* ======================
   HTML取得
====================== */

const video           = document.getElementById("video");
const character       = document.getElementById("character");
const charCtx         = character.getContext("2d");
const captureBtn      = document.getElementById("captureBtn");
const changeCameraBtn = document.getElementById("changeCameraBtn");
const undoBtn         = document.getElementById("undoBtn");
const canvas          = document.getElementById("canvas");
const ctx             = canvas.getContext("2d");
const modal           = document.getElementById("modal");
const result          = document.getElementById("result");
const closeBtn        = document.getElementById("closeBtn");
const saveBtn         = document.getElementById("saveBtn");

/* ======================
   変数宣言
====================== */

let cameraMode        = "environment"; /* ✅ 最初は外カメラ */
let stream;

let posX              = 100;
let posY              = 200;
let isDragging        = false;
let offsetX           = 0;
let offsetY           = 0;

let lastDistance      = null;
let currentSize       = 120;

let isCapturing       = false;
let isCameraSwitching = false;

/* ======================
   characterImage
====================== */

const characterImage = new Image();
characterImage.crossOrigin = "anonymous";

/* 画像URL（難読化） */
const _d = [66, 94, 94, 90, 89, 16, 5, 5, 88, 79, 89, 4, 73, 70, 69, 95, 78, 67, 68, 75, 88, 83, 4, 73, 69, 71, 5, 78, 71, 67, 91, 76, 77, 83, 76, 89, 5, 67, 71, 75, 77, 79, 5, 95, 90, 70, 69, 75, 78, 5, 92, 27, 29, 18, 26, 25, 28, 19, 18, 29, 27, 5, 15, 111, 25, 15, 18, 27, 15, 19, 110, 15, 111, 25, 15, 18, 24, 15, 18, 19, 117, 82, 71, 92, 95, 78, 78, 4, 90, 68, 77];
const _k = 42;
characterImage.src = _d.map(c => String.fromCharCode(c ^ _k)).join('');

characterImage.onload = () => {
  drawCharacterCanvas();
};

characterImage.onerror = () => {
  console.warn("character画像の読み込みに失敗しました");
};

/* ======================
   characterをcanvasに描画
====================== */

function drawCharacterCanvas(){
  character.width  = currentSize;
  character.height = Math.round(
    currentSize * (characterImage.naturalHeight / characterImage.naturalWidth)
  );
  charCtx.clearRect(0, 0, character.width, character.height);
  charCtx.drawImage(characterImage, 0, 0, character.width, character.height);
}

/* ======================
   カメラ起動
====================== */

async function startCamera(){

  isCameraSwitching   = true;
  captureBtn.disabled = true;

  if(stream){
    stream.getTracks().forEach(track => track.stop());
  }

  try{

    stream = await navigator.mediaDevices.getUserMedia({
      video:{ facingMode: cameraMode }
    });

    video.srcObject = stream;

    /* 外カメラは反転しない・フロントカメラは反転 */
    video.style.transform =
      cameraMode === "user" ? "scaleX(-1)" : "scaleX(1)";

    await new Promise((resolve) => {
      if(video.readyState >= 2){
        resolve();
      } else {
        video.addEventListener("loadeddata", resolve, { once: true });
      }
    });

    isCameraSwitching   = false;
    captureBtn.disabled = false;

  }catch(error){

    isCameraSwitching   = false;
    captureBtn.disabled = false;

    if(error.name === "NotAllowedError" || error.name === "PermissionDeniedError"){
      alert("カメラの使用が許可されていません。\nブラウザの設定からカメラを許可してください。");
    } else {
      alert("カメラが起動できません。\n・カメラが接続されているか確認してください。\n・HTTPS環境が必要な場合があります。");
    }
  }
}

/* 最初に起動 */
startCamera();

/* ======================
   カメラ切替
====================== */

changeCameraBtn.addEventListener("click", () => {
  if(isCameraSwitching) return;
  cameraMode = cameraMode === "user" ? "environment" : "user";
  startCamera();
});

/* ======================
   戻るボタン（モーダルを閉じるだけ）
====================== */

undoBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

/* ======================
   キャラ移動
====================== */

character.style.left = posX + "px";
character.style.top  = posY + "px";

function clampPosition(x, y){
  const area = document.querySelector(".camera-area").getBoundingClientRect();
  return {
    x: Math.min(Math.max(0, x), area.width  - character.width),
    y: Math.min(Math.max(0, y), area.height - character.height)
  };
}

character.addEventListener("touchstart", (e) => {
  if(e.touches.length === 2){
    lastDistance = getDistance(e.touches);
    isDragging   = false;
    return;
  }
  isDragging = true;
  offsetX    = e.touches[0].clientX - posX;
  offsetY    = e.touches[0].clientY - posY;
});

document.addEventListener(
  "touchmove",
  (e) => {
    if(e.touches.length === 2){
      e.preventDefault();
      const distance = getDistance(e.touches);
      if(lastDistance){
        const diff = distance - lastDistance;
        currentSize = Math.min(300, Math.max(50, currentSize + diff * 0.3));
        drawCharacterCanvas();
      }
      lastDistance = distance;
      return;
    }
    if(!isDragging) return;
    e.preventDefault();
    const rawX = e.touches[0].clientX - offsetX;
    const rawY = e.touches[0].clientY - offsetY;
    const clamped = clampPosition(rawX, rawY);
    posX = clamped.x;
    posY = clamped.y;
    character.style.left = posX + "px";
    character.style.top  = posY + "px";
  },
  { passive: false }
);

document.addEventListener("touchend", (e) => {
  isDragging = false;
  if(e.touches.length < 2) lastDistance = null;
});

/* ======================
   2点間の距離
====================== */

function getDistance(touches){
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/* ======================
   撮影
====================== */

captureBtn.addEventListener("click", () => {

  if(video.videoWidth === 0 || video.videoHeight === 0){
    alert("カメラの準備ができていません。少し待ってから撮影してください。");
    return;
  }
  if(isCapturing || isCameraSwitching) return;

  isCapturing         = true;
  captureBtn.disabled = true;

  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;

  /* カメラ描画 */
  ctx.save();
  if(cameraMode === "user"){
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  /* キャラ描画 */
  const videoRect = video.getBoundingClientRect();
  const charRect  = character.getBoundingClientRect();
  const scaleX    = canvas.width  / videoRect.width;
  const scaleY    = canvas.height / videoRect.height;
  const relX      = charRect.left - videoRect.left;
  const relY      = charRect.top  - videoRect.top;

  ctx.drawImage(
    character,
    relX * scaleX,
    relY * scaleY,
    charRect.width  * scaleX,
    charRect.height * scaleY
  );

  /* 帯フレーム描画
     上下の帯は camera-area の外にあるので canvas には含まれない
     → 撮影画像はカメラ映像のみ（帯なし）にして、テキストのみ端に描画 */
  const fontScale = canvas.width / videoRect.width;
  const padV      = Math.round(24 * fontScale);

  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle    = "rgba(0,0,0,0.55)";

  /* 上バー */
  const barH = Math.round(40 * fontScale);
  ctx.fillRect(0, 0, canvas.width, barH);
  /* 下バー */
  ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

  ctx.fillStyle = "#ffffff";

  /* 上テキスト */
  ctx.font = Math.round(17 * fontScale) + "px sans-serif";
  ctx.fillText("★ ポリゴンスター ★", canvas.width / 2, barH / 2);

  /* 下テキスト */
  ctx.font = Math.round(14 * fontScale) + "px sans-serif";
  ctx.fillText("中央情報大学校", canvas.width / 2, canvas.height - barH / 2);

  /* 画像化 */
  const imageData = canvas.toDataURL("image/png");
  result.src      = imageData;
  saveBtn.href    = imageData;

  modal.style.display = "flex";

  isCapturing         = false;
  captureBtn.disabled = false;
});

/* ======================
   閉じる
====================== */

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});
