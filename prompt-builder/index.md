<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>🧠 Prompt Builder</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>🧠 Prompt Builder</h1>
  <p class="desc">Заполняйте поля для генерации промпта. Нажмите "Редактировать поля", чтобы управлять структурой.</p>

  <div class="builder-container">
    <div class="toolbar">
      <button id="edit-mode-btn">✏️ Редактировать поля</button>
      <button id="copy-btn">📋 Копировать результат</button>
    </div>

    <!-- Live режим -->
    <div id="live-fields-container"></div>

    <!-- Режим редактирования -->
    <div id="edit-fields-container" class="hidden"></div>

    
    <div class="field-live">
      <label for="result">Итоговый промпт:</label>
      <textarea id="result" readonly></textarea>
    </div>
  </div>

    <div class="builder-container">
    <div class="toolbar">
      <button id="copy-btn">📋 Копировать результат</button>
    </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.8/clipboard.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
  <script src="script.js"></script>
</body>
</html>