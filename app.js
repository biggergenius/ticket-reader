// app.js

const cv = require('opencv4nodejs');
const Tesseract = require('tesseract.js');
const fs = require('fs');

// 📸 Load Image
const rawImagePath = 'ticket.jpg';
const raw = cv.imread(rawImagePath);

// 📐 Deskew
function deskewImage(img) {
  // Assume basic deskew logic
  const gray = img.bgrToGray();
  const edges = gray.canny(50, 150);
  const lines = edges.houghLinesP(1, Math.PI / 180, 100, 50, 10);

  let angle = 0;
  if (lines.length > 0) {
    const [x1, y1, x2, y2] = lines[0].getPoints()[0];
    angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  }

  const center = new cv.Point2(img.cols / 2, img.rows / 2);
  const rotationMatrix = cv.getRotationMatrix2D(center, angle, 1);
  return img.warpAffine(rotationMatrix, new cv.Size(img.cols, img.rows));
}

const deskewed = deskewImage(raw);
cv.imwrite('deskewed.jpg', deskewed); // Save deskewed image

// ✨ Enhance
function enhanceImage(img) {
  const contrast = img.convertTo(cv.CV_8U, 1.2, 15); // Contrast + Brightness
  const sharpenKernel = new cv.Mat([
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ], cv.CV_32F);
  return contrast.filter2D(-1, sharpenKernel);
}

const enhanced = enhanceImage(deskewed);

// 🔍 Draw boxes to preview text zones
drawBoundingBoxes(enhanced.copy(), 'text_zones_preview.jpg');

// 🔍 OCR
Tesseract.recognize('enhanced_preview.jpg', 'eng')
  .then(({ data: { text } }) => {
    console.log('🎯 Raw OCR Output:\n', text);
    const cleaned = postProcessText(text);
    console.log('🧹 Cleaned Text:\n', cleaned);
  })
  .catch(err => console.error('OCR error:', err));

// 🧹 Post-processing
function postProcessText(text) {
  return text
    .replace(/Sinale/g, 'Single')
    .replace(/Yalid/g, 'Valid')
    .replace(/froa/g, 'from')
    .replace(/Semior/g, 'Senior')
    // Add more tweaks as needed
    .trim();
}

function drawBoundingBoxes(img, outputPath) {
  const gray = img.bgrToGray();
  const thresh = gray.threshold(120, 255, cv.THRESH_BINARY_INV);
  const contours = thresh.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  contours.forEach(contour => {
    const rect = contour.boundingRect();
    img.drawRectangle(
      new cv.Point2(rect.x, rect.y),
      new cv.Point2(rect.x + rect.width, rect.y + rect.height),
      new cv.Vec(0, 255, 0),
      2
    );
  });

  cv.imwrite(outputPath, img);
}
