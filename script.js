/* ======================
   HTML取得
====================== */

const video          = document.getElementById("video");
const frame          = document.getElementById("frame");
const character      = document.getElementById("character");
const captureBtn     = document.getElementById("captureBtn");
const changeCameraBtn= document.getElementById("changeCameraBtn");
const canvas         = document.getElementById("canvas");
const ctx            = canvas.getContext("2d");
const modal          = document.getElementById("modal");
const result         = document.getElementById("result");
const closeBtn       = document.getElementById("closeBtn");

/* ======================
   変数宣言（まとめて先頭に）
====================== */

let cameraMode   = "user";
let stream;

let posX         = 100;
let posY         = 200;
let isDragging   = false;
let offsetX      = 0;
let offsetY      = 0;

let lastDistance = null;   /* ✅ 先頭で宣言（二重宣言バグ解消） */
let currentSize  = 120;

let isCameraReady  = false;  /* ✅ カメラ準備フラグ */
let isCapturing    = false;  /* ✅ 撮影中フラグ（連打防止） */
let isCameraSwitching = false; /* ✅ 切替中フラグ */

/* ======================
   画像読み込みエラーハンドリング
====================== */

/* ✅ character.png / frame.png が見つからない場合に警告 */

character.addEventListener("error", () => {
  console.warn("character.png の読み込みに失敗しました");
});

frame.addEventListener("error", () => {
  console.warn("frame.png の読み込みに失敗しました");
});

/* ======================
   カメラ起動
====================== */

async function startCamera(){

  isCameraReady    = false;
  isCameraSwitching = true;

  /* ✅ 切替中は撮影ボタンを無効化 */
  captureBtn.disabled = true;

  if(stream){
    stream.getTracks().forEach(track => track.stop());
  }

  try{

    stream = await navigator.mediaDevices.getUserMedia({
      video:{ facingMode: cameraMode }
    });

    video.srcObject = stream;

    /* フロントカメラなら左右反転 */
    video.style.transform =
      cameraMode === "user" ? "scaleX(-1)" : "scaleX(1)";

    /* ✅ 映像が実際に流れ始めてからフラグを立てる */
    video.onloadedmetadata = () => {
      isCameraReady     = true;
      isCameraSwitching = false;
      captureBtn.disabled = false;
    };

  }catch(error){

    isCameraSwitching = false;
    captureBtn.disabled = false;

    /* ✅ HTTPS 必須の案内を追加 */
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

  /* ✅ 切替中は二重実行しない */
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

/* ✅ キャラが画面外に出ないようにクランプする関数 */
function clampPosition(x, y){

  const area   = document.querySelector(".camera-area")
                   .getBoundingClientRect();
  const charW  = character.clientWidth;
  const charH  = character.clientHeight;

  return {
    x: Math.min(Math.max(0, x), area.width  - charW),
    y: Math.min(Math.max(0, y), area.height - charH)
  };

}

/* タッチ開始
   character は pointer-events:none のため camera-area で検知 */

const cameraArea =
  document.querySelector(".camera-area");

cameraArea.addEventListener("touchstart", (e) => {

  /* ピンチ開始時に lastDistance を初期化 */
  if(e.touches.length === 2){
    lastDistance = getDistance(e.touches);
    isDragging   = false;
    return;
  }

  /* タッチ座標がキャラの範囲内かチェック */
  const tx = e.touches[0].clientX;
  const ty = e.touches[0].clientY;

  const charRect = character.getBoundingClientRect();

  const inChar =
    tx >= charRect.left &&
    tx <= charRect.right &&
    ty >= charRect.top  &&
    ty <= charRect.bottom;

  if(!inChar) return;

  isDragging = true;

  offsetX = tx - posX;
  offsetY = ty - posY;

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

        character.style.width = currentSize + "px";

      }

      lastDistance = distance;
      return;

    }

    if(!isDragging) return;

    e.preventDefault();

    const rawX = e.touches[0].clientX - offsetX;
    const rawY = e.touches[0].clientY - offsetY;

    /* ✅ 画面外クランプ */
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

  /* ✅ カメラ未準備・撮影中・切替中はスキップ */
  if(!isCameraReady){
    alert("カメラの準備ができていません。少し待ってから撮影してください。");
    return;
  }
  if(isCapturing)    return;
  if(isCameraSwitching) return;

  isCapturing = true;
  captureBtn.disabled = true;

  /* canvas サイズ */
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;

  /* カメラ描画（フロントカメラなら反転） */
  ctx.save();

  if(cameraMode === "user"){
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  ctx.restore();

  /* キャラ描画
     ✅ getBoundingClientRect() で正確な表示サイズを取得 */

  const videoRect = video.getBoundingClientRect();
  const charRect  = character.getBoundingClientRect();

  const scaleX = canvas.width  / videoRect.width;
  const scaleY = canvas.height / videoRect.height;

  /* videoRect 内でのキャラの相対座標 */
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

  /* ✅ フラグ解除 */
  isCapturing = false;
  captureBtn.disabled = false;

});

/* ======================
   閉じる
====================== */

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

/* ======================
   長押し保存防止
====================== */

result.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});
