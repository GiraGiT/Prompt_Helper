document.addEventListener("DOMContentLoaded", () => {
  const liveContainer = document.getElementById("live-fields-container");
  const editContainer = document.getElementById("edit-fields-container");
  const editModeBtn = document.getElementById("edit-mode-btn");
  const resultArea = document.getElementById("result");

  let fieldsData = [];
  let fieldsDataDefault = [];

  const saveFields = () => localStorage.setItem("promptBuilderFields", JSON.stringify(fieldsData));

  // ------------------- Автоподстройка textarea -------------------
  const autoResizeTextarea = (textarea) => {
    textarea.style.height = "auto";
    const newHeight = textarea.scrollHeight;
    textarea.style.height = `${newHeight}px`;
  };

  const initAutoResizeAll = () => {
    const allTextareas = document.querySelectorAll("textarea");
    allTextareas.forEach(textarea => {
      textarea.style.transition = "height 0.12s ease";
      textarea.removeEventListener("input", textarea._autoResizeHandler || (() => {}));
      const handler = () => autoResizeTextarea(textarea);
      textarea._autoResizeHandler = handler;
      textarea.addEventListener("input", handler);
      autoResizeTextarea(textarea);
    });
  };

  // ------------------- Live-поля -------------------
  const renderLiveFields = () => {
    liveContainer.innerHTML = "";
    fieldsData.forEach((f, index) => {
      const div = document.createElement("div");
      div.className = "field-live";
      div.innerHTML = `
        <label>${f[0]}</label>
        <div class="hint-toggle">Показать подсказку</div>
        <div class="hint-text">${f[1]}</div>
        <textarea placeholder="${f[1]}">${f[2]}</textarea>
      `;
      const textarea = div.querySelector("textarea");
      const toggle = div.querySelector(".hint-toggle");
      const hintText = div.querySelector(".hint-text");

      hintText.style.display = "none";

      textarea.addEventListener("input", e => {
        fieldsData[index][2] = e.target.value;
        updatePrompt();
        saveFields();
        autoResizeTextarea(e.target);
      });

      toggle.addEventListener("click", () => {
        const isHidden = hintText.style.display === "none";
        hintText.style.display = isHidden ? "block" : "none";
        toggle.textContent = isHidden ? "Скрыть подсказку" : "Показать подсказку";
      });

      liveContainer.appendChild(div);
    });

    initAutoResizeAll();
    autoResizeTextarea(resultArea);
  };

  // ------------------- Итоговый промпт -------------------
  const updatePrompt = () => {
    let result = "";
    fieldsData.forEach(f => {
      if (!f[2] || !f[4]) return;
      result += f[2].trim() + ",";
      result += f[3] ? "\n" : " ";
    });
    resultArea.value = result.trim();
    autoResizeTextarea(resultArea);
  };

  // ------------------- Редактируемые поля -------------------
  const renderEditFields = () => {
    editContainer.innerHTML = "";

    const toolbar = document.createElement("div");
    toolbar.className = "edit-toolbar";
    toolbar.innerHTML = `
      <button id="add-field">➕ Добавить поле</button>
      <button id="reset-fields">♻ Сбросить поля</button>
      <button id="export-template">💾 Экспорт шаблона</button>
      <button id="import-template">📂 Импорт шаблона</button>
      <input type="file" id="import-file" style="display:none" accept=".json">
    `;
    editContainer.appendChild(toolbar);

    const addFieldBtn = toolbar.querySelector("#add-field");
    const resetFieldsBtn = toolbar.querySelector("#reset-fields");
    const exportBtn = toolbar.querySelector("#export-template");
    const importBtn = toolbar.querySelector("#import-template");
    const importFileInput = toolbar.querySelector("#import-file");

    const fieldsWrapper = document.createElement("div");
    fieldsWrapper.id = "edit-fields-wrapper";
    editContainer.appendChild(fieldsWrapper);

    // ---------------- Добавление поля ----------------
    addFieldBtn.addEventListener("click", () => {
      fieldsData.push(["Новая категория", "", "", true, true]);
      renderEditFields();
      saveFields();
    });

    // ---------------- Сброс ----------------
    resetFieldsBtn.addEventListener("click", () => {
      if (fieldsDataDefault.length) {
        fieldsData = JSON.parse(JSON.stringify(fieldsDataDefault));
        renderEditFields();
        renderLiveFields();
        updatePrompt();
        saveFields();
        initAutoResizeAll();
      } else {
        alert("Default шаблон не загружен. Перезагрузите страницу и выберите файл JSON.");
      }
    });

    // ---------------- Экспорт ----------------
    exportBtn.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(fieldsData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "prompt-builder-template.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    // ---------------- Импорт ----------------
    importBtn.addEventListener("click", () => importFileInput.click());
    importFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result);
          if (!Array.isArray(imported)) throw new Error("Неверный формат файла");
          fieldsData = imported;
          renderEditFields();
          renderLiveFields();
          updatePrompt();
          saveFields();
          initAutoResizeAll();
        } catch (err) {
          alert("Ошибка при импорте шаблона: " + err.message);
        }
      };
      reader.readAsText(file);
      importFileInput.value = "";
    });

    // ---------------- Генерация полей редактирования ----------------
    fieldsData.forEach((f, index) => {
      const div = document.createElement("div");
      div.className = "field-edit";
      div.innerHTML = `
        <div class="drag-handle">≡≡≡≡</div>
        <div class="field-content">
          <input type="text" value="${f[0]}" placeholder="Название поля">
          <textarea placeholder="Подсказка">${f[1]}</textarea>
          <label style="font-size:0.85rem; margin-top:5px;">
            <input type="checkbox"> Начинать с новой строки
          </label>
          <label style="font-size:0.85rem; margin-top:3px;">
            <input type="checkbox"> Добавлять в итоговый промпт
          </label>
        </div>
        <div class="field-actions">
          <button class="remove-btn">✖</button>
        </div>
      `;
      const input = div.querySelector("input[type=text]");
      const textarea = div.querySelector("textarea");
      const checkboxNewLine = div.querySelectorAll("input[type=checkbox]")[0];
      const checkboxInclude = div.querySelectorAll("input[type=checkbox]")[1];
      const removeBtn = div.querySelector(".remove-btn");

      checkboxNewLine.checked = f[3];
      checkboxInclude.checked = f[4];

      input.addEventListener("input", e => { f[0] = e.target.value; saveFields(); });
      textarea.addEventListener("input", e => { f[1] = e.target.value; saveFields(); autoResizeTextarea(e.target); });
      checkboxNewLine.addEventListener("change", e => { f[3] = e.target.checked; saveFields(); });
      checkboxInclude.addEventListener("change", e => { f[4] = e.target.checked; updatePrompt(); saveFields(); });
      removeBtn.addEventListener("click", () => {
        fieldsData.splice(index, 1);
        renderEditFields();
        renderLiveFields();
        updatePrompt();
        saveFields();
      });

      fieldsWrapper.appendChild(div);
      autoResizeTextarea(textarea);
    });

    // ---------------- Drag & Drop ----------------
    if (!fieldsWrapper.sortable) {
      fieldsWrapper.sortable = new Sortable(fieldsWrapper, {
        handle: ".drag-handle",
        animation: 150,
        onEnd: () => {
          fieldsData = [...fieldsWrapper.querySelectorAll(".field-edit")].map(div => {
            const input = div.querySelector("input[type=text]");
            const textarea = div.querySelector("textarea");
            const checkboxNewLine = div.querySelectorAll("input[type=checkbox]")[0];
            const checkboxInclude = div.querySelectorAll("input[type=checkbox]")[1];
            return [input.value, textarea.value, "", checkboxNewLine.checked, checkboxInclude.checked];
          });
          renderLiveFields();
          updatePrompt();
          saveFields();
          initAutoResizeAll();
        }
      });
    }
  };

  // ------------------- Кнопка редактирования -------------------
  editModeBtn.addEventListener("click", () => {
    if (editContainer.classList.contains("hidden")) {
      editContainer.classList.remove("hidden");
      liveContainer.classList.add("hidden");
      editModeBtn.textContent = "✅ Сохранить и выйти";
      renderEditFields();
    } else {
      editContainer.classList.add("hidden");
      liveContainer.classList.remove("hidden");
      editModeBtn.textContent = "✏️ Редактировать поля";
      renderLiveFields();
      updatePrompt();
      saveFields();
      initAutoResizeAll();
    }
  });

  // ------------------- Clipboard -------------------
  new ClipboardJS("#copy-btn", { text: () => resultArea.value });

  // ------------------- Загрузка default JSON при старте -------------------
  const loadDefaultTemplate = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!Array.isArray(data)) throw new Error("Неверный формат JSON");
          fieldsData = data;
          fieldsDataDefault = JSON.parse(JSON.stringify(data));
          saveFields();
          renderLiveFields();
          updatePrompt();
          initAutoResizeAll();
        } catch (err) {
          alert("Ошибка загрузки default JSON: " + err.message);
        }
      };
      reader.readAsText(file);
      fileInput.remove();
    });

    fileInput.click();
  };

  // ------------------- Инициализация -------------------
  const stored = localStorage.getItem("promptBuilderFields");
  if (stored) {
    fieldsData = JSON.parse(stored);
    fieldsDataDefault = JSON.parse(JSON.stringify(fieldsData));
    renderLiveFields();
    updatePrompt();
    initAutoResizeAll();
  } else {
    loadDefaultTemplate();
  }

  window.addEventListener("load", () => initAutoResizeAll());
});