let selectedFile;

document.getElementById('ticketInput').addEventListener('change', function (e) {
  selectedFile = e.target.files[0];
  if (!selectedFile) return;

  document.getElementById('status').textContent = "🧠 Preprocessing with OpenCV...";

  const img = new Image();
  img.onload = function () {
    enhanceWithOpenCV(img, function (enhancedDataURL) {
      document.getElementById('status').textContent = "🔍 Running OCR...";
      Tesseract.recognize(enhancedDataURL, 'eng', {
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
