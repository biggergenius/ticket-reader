document.getElementById('ticketInput').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById('status').textContent = "🕵️‍♂️ Reading ticket...";

  Tesseract.recognize(file, 'eng', {
    logger: m => console.log(m)
  }).then(({ data: { text } }) => {
    document.getElementById('status').textContent = "✅ Scan complete!";
    document.getElementById('output').textContent = text;
  }).catch(err => {
    document.getElementById('status').textContent = "❌ Error reading image.";
    console.error(err);
  });
});
