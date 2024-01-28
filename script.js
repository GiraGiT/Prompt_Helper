document.addEventListener('DOMContentLoaded', function() {
    var fixButton = document.querySelector('button:nth-of-type(1)');
    var copyButton = document.querySelector('.copy-button');

    fixButton.addEventListener('click', fixText);
    copyButton.addEventListener('click', copyToClipboard);
});

function fixText() {
    var inputText = document.getElementById("input-text").value;
    var tags = inputText.replace(/[?+–]/g, '').replace(/\b\d+\b/g, ',').replace(/ ,/g, ',').split(',');
    
    // Удаление лишних пробелов перед каждым тегом
    for (var i = 0; i < tags.length; i++) {
        tags[i] = tags[i].trim();
    }
    
    var outputText = tags.join(', ');
    document.getElementById("output-text").value = outputText;
}

function copyToClipboard() {
    var outputText = document.getElementById('output-text').value;
    var clipboard = new ClipboardJS('.copy-button', {
        text: function() {
            return outputText;
        }
    });

    clipboard.on('success', function(e) {
        console.log('Text copied to clipboard: ' + e.text);
        clipboard.destroy();
    });

    clipboard.on('error', function(e) {
        console.error('Failed to copy text to clipboard');
        clipboard.destroy();
    });
}