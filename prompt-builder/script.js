document.addEventListener("DOMContentLoaded", () => {
  const liveContainer = document.getElementById("live-fields-container");
  const editContainer = document.getElementById("edit-fields-container");
  const editModeBtn = document.getElementById("edit-mode-btn");
  const resultArea = document.getElementById("result");

  let defaultFields = [];
  let fieldsData = [];

  // ------------------- Автоподстройка textarea -------------------
  const autoResizeTextarea = (textarea) => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  const initAutoResizeAll = () => {
    document.querySelectorAll("textarea").forEach(textarea => {
      textarea.removeEventListener("input", textarea._autoResizeHandler || (() => {}));
      const handler = () => autoResizeTextarea(textarea);
      textarea._autoResizeHandler = handler;
      textarea.addEventListener("input", handler);
      autoResizeTextarea(textarea);
    });
  };

  // ------------------- Сохранение -------------------
  const saveFields = () => localStorage.setItem("promptBuilderFields", JSON.stringify(fieldsData));

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
        fieldsData[index][2] = e.target.value; // сохраняем только текст пользователя
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

      const lines = f[2].split(/\r?\n/);
      const processedLines = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        return trimmed.endsWith(",") ? trimmed : trimmed + ",";
      });

      if (f[3]) {
        result += processedLines.join("\n") + "\n";
      } else {
        const nonEmpty = processedLines.filter(l => l !== "");
        result += nonEmpty.join(" ") + " ";
      }
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
      fieldsData = JSON.parse(JSON.stringify(defaultFields));
      renderEditFields();
      renderLiveFields();
      updatePrompt();
      saveFields();
      initAutoResizeAll();
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
    importFileInput.addEventListener("change", e => {
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
          <textarea placeholder="${f[1]}">${f[2]}</textarea>
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
      textarea.addEventListener("input", e => { f[2] = e.target.value; saveFields(); autoResizeTextarea(e.target); });
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
          const newFieldsData = [];
          [...fieldsWrapper.querySelectorAll(".field-edit")].forEach(div => {
            const input = div.querySelector("input[type=text]");
            const textarea = div.querySelector("textarea");
            const checkboxNewLine = div.querySelectorAll("input[type=checkbox]")[0];
            const checkboxInclude = div.querySelectorAll("input[type=checkbox]")[1];
            newFieldsData.push([
              input.value,
              textarea.placeholder, // подсказка остаётся
              textarea.value,       // пользовательский текст сохраняется
              checkboxNewLine.checked,
              checkboxInclude.checked
            ]);
          });
          fieldsData = newFieldsData;
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

  // ------------------- Загрузка default JSON -------------------
  fetch("prompt-builder-template-default.json")
    .then(r => r.json())
    .then(data => {
      defaultFields = JSON.parse(JSON.stringify(data));
      fieldsData = JSON.parse(localStorage.getItem("promptBuilderFields")) || JSON.parse(JSON.stringify(defaultFields));
      renderLiveFields();
      updatePrompt();
      initAutoResizeAll();
    })
    .catch(() => {
      alert("Ошибка загрузки default JSON. Проверьте файл в папке.");
    });
});