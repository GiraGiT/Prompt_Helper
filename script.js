document.addEventListener('DOMContentLoaded', function() {
    var fixButton = document.querySelector('button:nth-of-type(1)');
  
    fixButton.addEventListener('click', fixText);
   
});

function fixText() {
    var inputText = document.getElementById("input-text").value;

    // 1. Очистка и подготовка данных
    var tags = inputText.replace(/[?+–]/g, '').split('?'); // Разделяем по символу "?"
    var tagObjects = [];

    // 2. Создание массива объектов с тегами и числами
    for (var i = 0; i < tags.length; i++) {
        var tag = tags[i].trim();
        if (tag) { // Проверяем, что тег не пустой
            var parts = tag.split(' ');
            var count = parseInt(parts[parts.length - 1]); // Извлекаем число

            if (!isNaN(count)) {
                var tagName = parts.slice(0, parts.length - 1).join(' '); // Извлекаем имя тега
                tagObjects.push({tag: tagName, count: count});
            }
        }
    }

    // 3. Сортировка массива объектов по убыванию числа
    tagObjects.sort(function(a, b) {
        return b.count - a.count;
    });

    // 4. Формирование выходной строки
    var outputText = tagObjects.map(function(item) {
        return item.tag;
    }).join(', ');

    document.getElementById("output-text").value = outputText;
}
