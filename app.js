let selectedFile;

document.getElementById('ticketInput').addEventListener('change', function (e) {
  selectedFile = e.target.files[0];
  if (selectedFile) {
    document.getElementById('status').textContent = "🕵️‍♂️ Reading ticket...";
    
    const img = new Image();
    img.onload = function () {
      const enhancedDataURL = enhanceImage(img);

      Tesseract.recognize(enhancedDataURL, 'eng', {
        logger: m => console.log(m)
      }).then(({ data: { text } }) => {
        document.getElementById('status').textContent = "✅ Scan complete!";
        document.getElementById('output').textContent = text;
      }).catch(err => {
        document.getElementById('status').textContent = "❌ Error reading image.";
        console.error(err);
      });
    };
    img.src = URL.createObjectURL(selectedFile);
  }
});

function enhanceImage(imageElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  ctx.drawImage(imageElement, 0, 0);

  // Convert to grayscale
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
    imageData.data[i]     = avg; // red
    imageData.data[i + 1] = avg; // green
    imageData.data[i + 2] = avg; // blue
  }
  ctx.putImageData(imageData, 0, 0);

  // Boost contrast
 ctx.filter = 'blur(0.5px) contrast(125%)';
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(canvas, 0, 0);

  return canvas.toDataURL();
}
