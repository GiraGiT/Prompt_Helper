<!DOCTYPE html>
<html>
<head>
    <title>Исправление Промпта</title>
    <link rel="stylesheet" type="text/css" href="style.css?v=1.0">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.8/clipboard.min.js"></script>
    <script src="script.js?v=1.0"></script>
     <link rel="icon" type="image/png" href="icon.png">
</head>
<body>
    <h1>Исправление тегов скопированных с сайтов ***booru для составления промптов для stable diffusion</h1>
    <div class="container">
        <label for="input-text">Введите текст:</label><br>
        <textarea id="input-text"></textarea><br>
        <label for="output-text">Результат:</label><br>
        <textarea id="output-text" readonly></textarea><br>
        <button onclick="fixText()">Исправить</button>
        <button class="copy-button">Копировать</button>
    </div>
</body>
</html>
