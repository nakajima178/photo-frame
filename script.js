/* ======================
   HTML取得
====================== */

const video           = document.getElementById("video");
const frame           = document.getElementById("frame");
const character       = document.getElementById("character");
const charCtx         = character.getContext("2d");
const captureBtn      = document.getElementById("captureBtn");
const changeCameraBtn = document.getElementById("changeCameraBtn");
const canvas          = document.getElementById("canvas");
const ctx             = canvas.getContext("2d");
const modal           = document.getElementById("modal");
const result          = document.getElementById("result");
const closeBtn        = document.getElementById("closeBtn");

/* ======================
   変数宣言
====================== */

let cameraMode        = "user";
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
characterImage.src =
  "https://res.cloudinary.com/dmiqfgyfs/image/upload/v1780277422/character_zemeqs.png";

characterImage.onload = () => {
  drawCharacterCanvas();
};

characterImage.onerror = () => {
  console.warn("character画像の読み込みに失敗しました");
};

frame.addEventListener("error", () => {
  console.warn("frame.png の読み込みに失敗しました");
});

/* ======================
   characterをcanvasに描画
====================== */

function drawCharacterCanvas(){

  character.width  = currentSize;
  character.height = Math.round(
    currentSize *
    (characterImage.naturalHeight / characterImage.naturalWidth)
  );

  charCtx.clearRect(0, 0, character.width, character.height);
  charCtx.drawImage(
    characterImage,
    0, 0,
    character.width,
    character.height
  );

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

    video.style.transform =
      cameraMode === "user" ? "scaleX(-1)" : "scaleX(1)";

    /* ✅ loadedmetadata と loadeddata 両方で待つ（どちらか早い方） */
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

    if(
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ){
      alert("カメラの使用が許可されていません。\nブラウザの設定からカメラを許可してください。");
    } else {
      alert(
        "カメラが起動できません。\n" +
        "・カメラが接続されているか確認してください。\n" +
        "・HTTPS環境が必要な場合があります。"
      );
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

  cameraMode =
    cameraMode === "user" ? "environment" : "user";

  startCamera();

});

/* ======================
   キャラ移動
====================== */

/* 初期位置 */
character.style.left = posX + "px";
character.style.top  = posY + "px";

/* キャラが画面外に出ないようにクランプ */
function clampPosition(x, y){

  const area = document.querySelector(".camera-area")
                 .getBoundingClientRect();

  return {
    x: Math.min(Math.max(0, x), area.width  - character.width),
    y: Math.min(Math.max(0, y), area.height - character.height)
  };

}

/* タッチ開始 */
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

/* 移動 */
document.addEventListener(
  "touchmove",
  (e) => {

    if(e.touches.length === 2){

      e.preventDefault();

      const distance = getDistance(e.touches);

      if(lastDistance){

        const diff = distance - lastDistance;

        currentSize = Math.min(300, Math.max(50,
          currentSize + diff * 0.3
        ));

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

/* タッチ終了 */
document.addEventListener("touchend", (e) => {

  isDragging = false;

  if(e.touches.length < 2){
    lastDistance = null;
  }

});

/* ======================
   2点間の距離を計算
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

  /* ✅ videoWidth で簡易チェック（isCameraReady フラグ廃止） */
  if(video.videoWidth === 0 || video.videoHeight === 0){
    alert("カメラの準備ができていません。少し待ってから撮影してください。");
    return;
  }

  if(isCapturing)       return;
  if(isCameraSwitching) return;

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

  const scaleX = canvas.width  / videoRect.width;
  const scaleY = canvas.height / videoRect.height;

  const relX = charRect.left - videoRect.left;
  const relY = charRect.top  - videoRect.top;

  ctx.drawImage(
    character,
    relX * scaleX,
    relY * scaleY,
    charRect.width  * scaleX,
    charRect.height * scaleY
  );

  /* フレーム描画 */
  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

  /* 画像化・表示 */
  result.src = canvas.toDataURL("image/png");

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

/* ======================
   result の長押し保存防止
====================== */

result.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});
