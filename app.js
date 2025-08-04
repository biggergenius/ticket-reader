const cv = require('opencv4nodejs');
const Tesseract = require('tesseract.js');

// === CONFIG ===
const imagePath = 'ticket.jpg'; // Your input image
const enhancedPath = 'enhanced.jpg';
const boxedPath = 'text-boxes.jpg';

// === Deskew ===
function deskewImage(img) {
  const gray = img.bgrToGray();
  const edges = gray.canny(50, 150);
  const lines = edges.houghLinesP(1, Math.PI / 180, 100, 50, 10);

  let angle = 0;
  if (lines.length > 0) {
    const pt1 = lines[0].getPoints()[0];
    const pt2 = lines[0].getPoints()[1];
    angle = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x) * (180 / Math.PI);
  }

  const center = new cv.Point2(img.cols / 2, img.rows / 2);
  const rotationMatrix = cv.getRotationMatrix2D(center, angle, 1);
  return img.warpAffine(rotationMatrix, new cv.Size(img.cols, img.rows));
}

// === Enhance ===
function enhanceImage(img) {
  const contrast = img.convertTo(cv.CV_8U, 1.3, 20);
  const sharpen = new cv.Mat([
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ], cv.CV_32F);
  return contrast.filter2D(-1, sharpen);
}

// === Draw Bounding Boxes ===
function drawTextBoxes(img, outPath) {
  const gray = img.bgrToGray();
  const thresh = gray.threshold(120, 255, cv.THRESH_BINARY_INV);
  const contours = thresh.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  contours.forEach(c => {
    const r = c.boundingRect();
    img.drawRectangle(
      new cv.Point2(r.x, r.y),
      new cv.Point2(r.x + r.width, r.y + r.height),
      new cv.Vec(0, 255, 0),
      2
    );
  });

  cv.imwrite(outPath, img);
}

// === Clean OCR Text ===
function cleanText(text) {
  return text
    .replace(/Yalid/g, 'Valid')
    .replace(/froa/g, 'from')
    .replace(/Sinale/g, 'Single')
    .replace(/Semior/g, 'Senior')
    .replace(/et s Date of travel/g, 'Date of Travel')
    .trim();
}

// === MAIN PROCESS ===
function run() {
  const raw = cv.imread(imagePath);
  const deskewed = deskewImage(raw);
  const enhanced = enhanceImage(deskewed);

  cv.imwrite(enhancedPath, enhanced);
  drawTextBoxes(enhanced.copy(), boxedPath);

  Tesseract.recognize(enhancedPath, 'eng').then(({ data: { text } }) => {
    console.log('\n📃 Raw OCR Output:\n', text);
    console.log('\n🧹 Cleaned Up Text:\n', cleanText(text));
  }).catch(err => {
    console.error('OCR error:', err);
  });
}

// === Trigger Automatically ===
run();
