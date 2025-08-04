const cv = require('opencv4nodejs');
const Tesseract = require('tesseract.js');

const express = require('express');
const multer = require('multer');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('ticket'), (req, res) => {
  const uploadedPath = req.file.path;
  processTicket(uploadedPath);
  res.send('Processing started!');
});

app.listen(3000, () => console.log('🎯 Ready at http://localhost:3000'));


// === 🧾 Config ===
const imagePath = 'ticket.jpg';
const enhancedPath = 'enhanced_preview.jpg';
const boxedPath = 'text_zones_preview.jpg';

// === 📐 Deskewing ===
function deskewImage(img) {
  const gray = img.bgrToGray();
  const edges = gray.canny(50, 150);
  const lines = edges.houghLinesP(1, Math.PI / 180, 100, 50, 10);

  let angle = 0;
  if (lines.length > 0) {
    const points = lines[0].getPoints();
    const [x1, y1, x2, y2] = [points[0].x, points[0].y, points[1].x, points[1].y];
    angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  }

  const center = new cv.Point2(img.cols / 2, img.rows / 2);
  const rotationMatrix = cv.getRotationMatrix2D(center, angle, 1);
  return img.warpAffine(rotationMatrix, new cv.Size(img.cols, img.rows));
}

// === ✨ Enhancement ===
function enhanceImage(img) {
  const contrast = img.convertTo(cv.CV_8U, 1.2, 15); // brightness + contrast boost
  const sharpenKernel = new cv.Mat([
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ], cv.CV_32F);
  return contrast.filter2D(-1, sharpenKernel);
}

// === 🟩 Bounding Boxes Preview ===
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

// === 🧹 OCR Cleanup ===
function postProcessText(text) {
  return text
    .replace(/Sinale/g, 'Single')
    .replace(/Yalid/g, 'Valid')
    .replace(/froa/g, 'from')
    .replace(/Semior/g, 'Senior')
    .replace(/et s Date of travel/g, 'Date of Travel')
    // Add other frequent fixes here
    .trim();
}

// === 🚀 Main Pipeline ===
function processTicket(imagePath) {
  const raw = cv.imread(imagePath);
  const deskewed = deskewImage(raw);
  const enhanced = enhanceImage(deskewed);

  cv.imwrite(enhancedPath, enhanced);
  drawBoundingBoxes(enhanced.copy(), boxedPath);

  Tesseract.recognize(enhancedPath, 'eng')
    .then(({ data: { text } }) => {
      console.log('\n🎯 Raw OCR Output:\n');
      console.log(text);
      console.log('\n🧹 Cleaned Text:\n');
      console.log(postProcessText(text));
    })
    .catch(err => console.error('OCR error:', err));
}

// 🏁 Go!
processTicket(imagePath);
