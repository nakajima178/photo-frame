/* ======================
   HTML取得
====================== */

const video           = document.getElementById("video");
const preview         = document.getElementById("preview");
const character       = document.getElementById("character");
const charCtx         = character.getContext("2d");
const captureBtn      = document.getElementById("captureBtn");
const changeCameraBtn = document.getElementById("changeCameraBtn");
const undoBtn         = document.getElementById("undoBtn");
const saveBtn         = document.getElementById("saveBtn");
const canvas          = document.getElementById("canvas");
const ctx             = canvas.getContext("2d");
const modal           = document.getElementById("modal");
const result          = document.getElementById("result");
const closeBtn        = document.getElementById("closeBtn");
const modalSaveBtn    = document.getElementById("modalSaveBtn");

/* ======================
   変数宣言
====================== */

let cameraMode        = "environment"; /* 最初は外カメラ */
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
let isPreviewMode     = false; /* 撮影後の静止画表示中フラグ */

/* ======================
   characterImage
====================== */

const characterImage = new Image();
characterImage.crossOrigin = "anonymous";

const _d = [66, 94, 94, 90, 89, 16, 5, 5, 88, 79, 89, 4, 73, 70, 69, 95, 78, 67, 68, 75, 88, 83, 4, 73, 69, 71, 5, 78, 71, 67, 91, 76, 77, 83, 76, 89, 5, 67, 71, 75, 77, 79, 5, 95, 90, 70, 69, 75, 78, 5, 92, 27, 29, 18, 26, 25, 28, 19, 18, 29, 27, 5, 15, 111, 25, 15, 18, 27, 15, 19, 110, 15, 111, 25, 15, 18, 24, 15, 18, 19, 117, 82, 71, 92, 95, 78, 78, 4, 90, 68, 77];
const _k = 42;
characterImage.src = _d.map(c => String.fromCharCode(c ^ _k)).join('');

characterImage.onload  = () => drawCharacterCanvas();
characterImage.onerror = () => console.warn("character画像の読み込みに失敗しました");

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
    video.style.transform = cameraMode === "user" ? "scaleX(-1)" : "scaleX(1)";

    await new Promise((resolve) => {
      if(video.readyState >= 2) resolve();
      else video.addEventListener("loadeddata", resolve, { once: true });
    });

    isCameraSwitching   = false;
    captureBtn.disabled = false;

  }catch(error){

    isCameraSwitching   = false;
    captureBtn.disabled = false;

    if(error.name === "NotAllowedError" || error.name === "PermissionDeniedError"){
      alert("カメラの使用が許可されていません。\nブラウザの設定からカメラを許可してください。");
    } else {
      alert("カメラが起動できません。\n・HTTPS環境が必要な場合があります。");
    }

  }

}

startCamera();

/* ======================
   カメラ切替
====================== */

changeCameraBtn.addEventListener("click", () => {
  if(isCameraSwitching || isPreviewMode) return;
  cameraMode = cameraMode === "user" ? "environment" : "user";
  startCamera();
});

/* ======================
   戻るボタン
   → プレビューを閉じてカメラに戻る＋キャラをリセット
====================== */

undoBtn.addEventListener("click", () => {

  if(isPreviewMode){

    /* プレビュー非表示・カメラ再開 */
    preview.style.display = "none";
    preview.src           = "";
    video.style.display   = "block";

    /* キャラをカメラの上に再表示 */
    character.style.display = "block";

    /* キャラ初期位置リセット */
    posX        = 100;
    posY        = 200;
    currentSize = 120;
    character.style.left = posX + "px";
    character.style.top  = posY + "px";
    drawCharacterCanvas();

    /* ボタン状態リセット */
    captureBtn.style.display  = "block";
    saveBtn.style.display     = "none";
    changeCameraBtn.disabled  = false;

    isPreviewMode = false;

  }

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
  if(isPreviewMode) return;
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
    if(isPreviewMode) return;
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
    const clamped = clampPosition(
      e.touches[0].clientX - offsetX,
      e.touches[0].clientY - offsetY
    );
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

  ctx.drawImage(
    character,
    (charRect.left - videoRect.left) * scaleX,
    (charRect.top  - videoRect.top)  * scaleY,
    charRect.width  * scaleX,
    charRect.height * scaleY
  );

  /* 上下バー描画 */
  const fontScale = canvas.width / videoRect.width;
  const barH      = Math.round(40 * fontScale);

  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.fillRect(0, 0, canvas.width, barH);
  ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle    = "#ffffff";

  ctx.font = Math.round(17 * fontScale) + "px sans-serif";
  ctx.fillText("★ ポリゴンスター ★", canvas.width / 2, barH / 2);

  ctx.font = Math.round(14 * fontScale) + "px sans-serif";
  ctx.fillText("中央情報大学校", canvas.width / 2, canvas.height - barH / 2);

  /* 画像データ生成 */
  const imageData = canvas.toDataURL("image/png");

  /* ✅ プレビュー表示（モーダルではなくカメラエリアに直接表示） */
  preview.src           = imageData;
  preview.style.display = "block";

  /* ビデオとキャラを隠す */
  video.style.display      = "none";
  character.style.display  = "none";

  /* ボタン切替：撮影ボタン非表示・保存ボタン表示 */
  captureBtn.style.display = "none";
  saveBtn.href             = imageData;
  saveBtn.style.display    = "flex";

  /* カメラ切替を無効化 */
  changeCameraBtn.disabled = true;

  isPreviewMode   = true;
  isCapturing     = false;

});

/* ======================
   モーダル閉じる
====================== */

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});
