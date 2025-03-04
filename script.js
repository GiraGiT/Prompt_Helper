document.addEventListener('DOMContentLoaded', function() {
    var fixButton = document.querySelector('button:nth-of-type(1)');
    var copyButton = document.querySelector('.copy-button');

    fixButton.addEventListener('click', fixText);
    copyButton.addEventListener('click', copyToClipboard);
});

function fixText() {
    var inputText = document.getElementById("input-text").value;

    // 1. Очистка и подготовка данных: удаляем знаки препинания, разделяем на теги и числа
    var tags = inputText.replace(/[?+–]/g, '').split('\n'); // Предполагаем, что каждый тег с новой строки

    // 2. Создаем массив объектов, где храним тег и его число
    var tagObjects = [];
    for (var i = 0; i < tags.length; i++) {
        var parts = tags[i].trim().split(' '); // Разделяем тег и число пробелом
        var tag = parts.slice(0, parts.length - 1).join(' '); // Собираем все части тега обратно, кроме последнего элемента (числа)
        var count = parseInt(parts[parts.length - 1]); // Преобразуем число в целое
        if (tag && !isNaN(count)) { // Проверяем, что тег не пустой и число корректное
            tagObjects.push({tag: tag, count: count});
        }
    }

    // 3. Сортируем массив объектов по убыванию числа
    tagObjects.sort(function(a, b) {
        return b.count - a.count;
    });

    // 4. Извлекаем отсортированные теги
    var sortedTags = [];
    for (var i = 0; i < tagObjects.length; i++) {
        sortedTags.push(tagObjects[i].tag);
    }

    // 5. Соединяем теги в строку, разделяя запятыми
    var outputText = sortedTags.join(', ');
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
