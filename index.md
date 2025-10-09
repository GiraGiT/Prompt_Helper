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
    <hr>


<!-- 🧩 GRID HELPER -->
<section class="tool-section card" id="grid-helper">
  <h2>🧩 Grid Helper</h2>
  <p class="description">
    Загрузите изображение и укажите количество столбцов — сетка обновится автоматически.
  </p>

  <div class="grid-helper-controls">
    <label for="colsInput">Количество столбцов:</label>
    <input type="number" id="colsInput" min="1" max="100" value="4">

    <label for="imageLoader">Изображение:</label>
    <input type="file" id="imageLoader" accept="image/*">
  </div>

    <div id="gridInfo" class="grid-info">
        Размер ячейки: —  
    </div>

  <div class="grid-helper-preview">
    <canvas id="gridCanvas"></canvas>
  </div>
</section>


<script src="grid_helper.js"></script>
</body>
</html>
