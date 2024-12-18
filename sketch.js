let facemesh, handpose;
let video;
let facePredictions = [];
let handPredictions = [];
let emojiSize = 32; // 初始眼睛 emoji 大小
let targetSize = 32; // 目标大小
let rotationAngle = 0; // 手部旋转角度
let mouthEmoji = '👄'; // 默认嘴部 emoji

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);

  // 初始化 FaceMesh 和 Handpose 模型
  facemesh = ml5.facemesh(video, modelReady);
  handpose = ml5.handpose(video, modelReady);

  facemesh.on("predict", results => {
    facePredictions = results;
  });

  handpose.on("predict", results => {
    handPredictions = results;
  });

  video.hide();
}

function modelReady() {
  console.log("Model ready!");
}

function draw() {
  image(video, 0, 0, width, height);

  // 检测手势并调整 emoji 大小
  detectHandGesture();

  // 检测嘴巴张开状态并更新 emoji
  detectMouthState();

  // 绘制眼睛上的旋转 emoji
  drawEyeEmojis();

  // 绘制嘴巴的 emoji
  drawMouthEmoji();
}

// 检测嘴巴的张开状态
function detectMouthState() {
  if (facePredictions.length > 0) {
    const keypoints = facePredictions[0].scaledMesh;

    // 获取上嘴唇和下嘴唇的中心点
    const mouthUpperLip = keypoints[13];
    const mouthLowerLip = keypoints[14];

    // 计算嘴巴的垂直张开距离
    const mouthOpenDistance = dist(mouthUpperLip[0], mouthUpperLip[1], mouthLowerLip[0], mouthLowerLip[1]);

    // 如果嘴巴张开的距离超过一定阈值，则切换 emoji 为 👅
    if (mouthOpenDistance > 20) {
      mouthEmoji = '👅';
    } else {
      mouthEmoji = '👄';
    }
  }
}

// 绘制嘴巴的 emoji
function drawMouthEmoji() {
  if (facePredictions.length > 0) {
    const keypoints = facePredictions[0].scaledMesh;

    // 获取嘴巴中心点
    const mouthUpperLip = keypoints[13];
    const mouthLowerLip = keypoints[14];
    const mouthX = (mouthUpperLip[0] + mouthLowerLip[0]) / 2;
    const mouthY = (mouthUpperLip[1] + mouthLowerLip[1]) / 2;

    // 绘制嘴巴 emoji
    textSize(80);
    textAlign(CENTER, CENTER);
    text(mouthEmoji, mouthX, mouthY);
  }
}

// 检测手势：根据手掌状态调整眼睛 emoji 大小和旋转角度
function detectHandGesture() {
  if (handPredictions.length > 0) {
    const landmarks = handPredictions[0].landmarks;

    // 计算手掌旋转角度（食指根部与小指根部的向量）
    const indexBase = landmarks[5];
    const pinkyBase = landmarks[17];
    const deltaX = pinkyBase[0] - indexBase[0];
    const deltaY = pinkyBase[1] - indexBase[1];
    rotationAngle = atan2(deltaY, deltaX); // 计算旋转角度（弧度）

    // 计算手掌展开程度
    const thumbTip = landmarks[4];
    const pinkyTip = landmarks[20];
    const handWidth = dist(thumbTip[0], thumbTip[1], pinkyTip[0], pinkyTip[1]);

    // 根据手掌宽度动态设置目标 emoji 大小
    targetSize = map(handWidth, 50, 300, 22, 150, true);

    // 平滑过渡到目标大小
    emojiSize = lerp(emojiSize, targetSize, 0.1);
  }
}

// 绘制动态旋转的眼睛 emoji
function drawEyeEmojis() {
  if (facePredictions.length > 0) {
    const keypoints = facePredictions[0].scaledMesh;

    // 左眼和右眼的坐标
    const leftEye = keypoints[159];
    const rightEye = keypoints[386];

    // 绘制左眼的 emoji
    push(); // 保存当前绘图状态
    translate(leftEye[0], leftEye[1]); // 将绘图原点移动到左眼
    rotate(rotationAngle); // 根据手掌旋转角度旋转
    textSize(emojiSize);
    textAlign(CENTER, CENTER);
    text('👁️', 0, 0); // 绘制 emoji
    pop(); // 恢复绘图状态

    // 绘制右眼的 emoji
    push();
    translate(rightEye[0], rightEye[1]);
    rotate(rotationAngle);
    textSize(emojiSize);
    textAlign(CENTER, CENTER);
    text('👁️', 0, 0);
    pop();
  }
}
