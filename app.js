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
