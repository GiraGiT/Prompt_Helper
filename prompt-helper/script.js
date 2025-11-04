document.addEventListener('DOMContentLoaded', function() {
  const fixButton = document.getElementById('fix-btn');
  const copyButton = document.querySelector('.copy-button');

  fixButton.addEventListener('click', fixText);
  copyButton.addEventListener('click', copyToClipboard);
});

function fixText() {
  const inputText = document.getElementById("input-text").value;
  const tags = inputText.replace(/[?+–]/g, '')
                        .replace(/\b\d+\b/g, ',')
                        .replace(/ ,/g, ',')
                        .split(',')
                        .map(tag => tag.trim());
  document.getElementById("output-text").value = tags.join(', ');
}

function copyToClipboard() {
  const outputText = document.getElementById('output-text').value;
  const clipboard = new ClipboardJS('.copy-button', {
    text: () => outputText
  });

  clipboard.on('success', e => clipboard.destroy());
  clipboard.on('error', e => clipboard.destroy());
}