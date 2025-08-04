let selectedFile;

document.getElementById('ticketInput').addEventListener('change', function (e) {
  selectedFile = e.target.files[0];
  if (!selectedFile) return;

  document.getElementById('status').textContent = "🧠 Preprocessing with OpenCV...";

const img = new Image();
img.onload = function () {
  deskewImage(img, function (deskewedDataURL) {
    document.getElementById('status').textContent = "🔍 Running OCR...";
    Tesseract.recognize(deskewedDataURL, 'eng', {
      logger: m => console.log(m)
    }).then(({ data: { text } }) => {
      document.getElementById('status').textContent = "✅ Scan complete!";
      document.getElementById('output').textContent = text;
    }).catch(err => {
      document.getElementById('status').textContent = "❌ Error reading image.";
      console.error(err);
    });
  });
};
img.src = URL.createObjectURL(selectedFile);
});

function enhanceWithOpenCV(imageElement, callback) {
  let canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  let ctx = canvas.getContext('2d');
  ctx.drawImage(imageElement, 0, 0);
  
  let src = cv.imread(canvas); // Read canvas into OpenCV Mat
  let gray = new cv.Mat();
  let thresholded = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY); // Convert to grayscale
  cv.threshold(gray, thresholded, 120, 255, cv.THRESH_BINARY); // Binarize

  cv.imshow(canvas, thresholded); // Display result back to canvas

  // Cleanup
  src.delete(); gray.delete(); thresholded.delete();

  // Return result as DataURL
  callback(canvas.toDataURL());
}

function deskewImage(imageElement, callback) {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageElement, 0, 0);

  // Read image into OpenCV Mat
  let src = cv.imread(canvas);
  let gray = new cv.Mat();
  let binary = new cv.Mat();
  let rotated = new cv.Mat();

  // Convert to grayscale and threshold
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

  // Invert colors (black background, white text)
  cv.bitwise_not(binary, binary);

  // Find contours
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(binary, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  // Get largest contour and minimum rotated rectangle
  let maxArea = 0;
  let largestContour;
  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const area = cv.contourArea(cnt);
    if (area > maxArea) {
      maxArea = area;
      largestContour = cnt;
    }
  }

  const rect = cv.minAreaRect(largestContour);
  const angle = rect.angle;

  // Calculate rotation matrix and apply deskew
  const center = new cv.Point(src.cols / 2, src.rows / 2);
  const rotMat = cv.getRotationMatrix2D(center, angle, 1);
  cv.warpAffine(src, rotated, rotMat, new cv.Size(src.cols, src.rows), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

  // Show result on canvas and cleanup
  cv.imshow(canvas, rotated);
  src.delete(); gray.delete(); binary.delete(); rotated.delete();
  contours.delete(); hierarchy.delete();

  callback(canvas.toDataURL());
}
