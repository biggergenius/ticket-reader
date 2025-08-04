let selectedFile;

document.getElementById('ticketInput').addEventListener('change', function (e) {
  selectedFile = e.target.files[0];
});

document.getElementById('scanBtn').addEventListener('click', function () {
  if (!selectedFile) return;
  document.getElementById('status').textContent = "🕵️‍♂️ Reading ticket...";

  Tesseract.recognize(selectedFile, 'eng', {
    logger: m => console.log(m)
  }).then(({ data: { text } }) => {
    document.getElementById('status').textContent = "✅ Scan complete!";
    document.getElementById('output').textContent = text;
  }).catch(err => {
    document.getElementById('status').textContent = "❌ Error reading image.";
    console.error(err);
  });
});
