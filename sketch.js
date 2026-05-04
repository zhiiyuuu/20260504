let capture;
let facemesh;
let predictions = [];
let faceMask;
let stars = [];

// 臉部最外層輪廓點位編號 (依序串接可繞臉部一圈)
const faceOutline = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.size(640, 480);
  capture.hide();

  // 建立遮罩層
  faceMask = createGraphics(640, 480);

  // 初始化星星 (比例座標)
  for (let i = 0; i < 100; i++) {
    stars.push({ x: random(1), y: random(1), s: random(1, 3), b: random(150, 255) });
  }

  facemesh = ml5.facemesh(capture, () => console.log("Facemesh Ready!"));
  facemesh.on("predict", results => predictions = results);
}

function draw() {
  // 1. 最底層背景：全螢幕淡藍色
  background(173, 216, 230);

  let targetW = width * 0.5;
  let targetH = height * 0.5;
  let xOffset = (width - targetW) / 2;
  let yOffset = (height - targetH) / 2;

  // 2. 繪製中間 50% 的容器
  push();
  translate(xOffset, yOffset);
  
  // 容器底色：深藍色
  fill(10, 20, 45);
  noStroke();
  rect(0, 0, targetW, targetH);
  
  // 在容器內畫星星
  for (let star of stars) {
    fill(255, 255, 255, star.b);
    circle(star.x * targetW, star.y * targetH, star.s);
  }

  if (predictions.length > 0) {
    let keypoints = predictions[0].scaledMesh;

    // --- 製作遮罩：只保留臉部區域 ---
    faceMask.clear();
    faceMask.fill(255);
    faceMask.noStroke();
    faceMask.beginShape();
    for (let index of faceOutline) {
      let p = keypoints[index];
      faceMask.vertex(p[0], p[1]);
    }
    faceMask.endShape(CLOSE);

    // --- 準備影像 ---
    let maskedImg = capture.get();
    maskedImg.mask(faceMask); // 將攝影機影像套用臉部遮罩

    // --- 繪製擷取畫面 ---
    push();
    translate(targetW, 0); // 處理鏡像
    scale(-1, 1);
    
    // 顯示「只有臉部」的攝影機畫面
    image(maskedImg, 0, 0, targetW, targetH);

    // --- 繪製最外層輪廓線 (紅色) ---
    stroke(255, 0, 0);
    strokeWeight(2);
    noFill();
    beginShape();
    for (let index of faceOutline) {
      let p = keypoints[index];
      let mx = map(p[0], 0, 640, 0, targetW);
      let my = map(p[1], 0, 480, 0, targetH);
      vertex(mx, my);
    }
    endShape();
    pop();
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}