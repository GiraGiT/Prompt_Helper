<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Prompt Helper</title>
  <link rel="stylesheet" href="style.css?v=1.0">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.8/clipboard.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js"></script>
  <script src="script.js?v=1.1"></script>
  <link rel="icon" type="image/png" href="icon.png">
  <style>
    /* Стили вкладок */
    .tabs {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin: 20px 0;
    }
    .tab-button {
      padding: 8px 16px;
      cursor: pointer;
      background-color: #4CAF50;
      color: #fff;
      border: none;
      border-radius: 4px;
    }
    .tab-button.active {
      background-color: #45a049;
    }
    .tab-iframe {
      width: 100%;
      min-height: 100vh;
      border: none;
      display: none;
    }
  </style>
</head>
<body>
  <h1>Prompt Helper</h1>

  <!-- Вкладки -->
  <div class="tabs">
    <button class="tab-button">Prompt Helper</button>
    <button class="tab-button">Prompt Builder</button>
    <button class="tab-button">Grid Helper</button>
  </div>

  <!-- Iframes -->
  <iframe id="prompt-helper-iframe" class="tab-iframe" src="prompt-helper/index.html"></iframe>
  <iframe id="prompt-builder-iframe" class="tab-iframe" src="prompt-builder/index.html"></iframe>
  <iframe id="grid-helper-iframe" class="tab-iframe" src="grid-helper/index.html"></iframe>
</body>
</html>