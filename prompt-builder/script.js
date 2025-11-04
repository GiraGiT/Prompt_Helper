document.addEventListener("DOMContentLoaded", () => {
  const liveContainer = document.getElementById("live-fields-container");
  const editContainer = document.getElementById("edit-fields-container");
  const editModeBtn = document.getElementById("edit-mode-btn");
  const addFieldBtn = document.getElementById("add-field");
  const resultArea = document.getElementById("result");

  // Загружаем поля из localStorage или задаём начальные
  let fieldsData = JSON.parse(localStorage.getItem("promptBuilderFields")) || [
    ["Кто", "Тип персонажа, возраст, гендер", "", true],
    ["Внешность / стиль", "Цвет волос, глаза, особенности", "", true],
    ["Одежда / аксессуары", "Одежда, украшения, фетиши", "", true],
    ["Фон / окружение", "Комната, пейзаж, окружение", "", true]
  ];

  const saveFields = () => {
    localStorage.setItem("promptBuilderFields", JSON.stringify(fieldsData));
  };

  // Отрисовка live-полей
  const renderLiveFields = () => {
    liveContainer.innerHTML = "";
    fieldsData.forEach((f, index) => {
      const div = document.createElement("div");
      div.className = "field-live";
      div.innerHTML = `
        <label>${f[0]}</label>
        <div class="hint-toggle">Показать подсказку</div>
        <div class="hint-text" style="display:none;">${f[1]}</div>
        <textarea placeholder="${f[1]}">${f[2]}</textarea>
      `;
      const textarea = div.querySelector("textarea");
      const toggle = div.querySelector(".hint-toggle");
      const hintText = div.querySelector(".hint-text");

      textarea.addEventListener("input", e => {
        fieldsData[index][2] = e.target.value;
        updatePrompt();
        saveFields();
      });

      toggle.addEventListener("click", () => {
        hintText.style.display = hintText.style.display === "none" ? "block" : "none";
        toggle.textContent = hintText.style.display === "none" ? "Показать подсказку" : "Скрыть подсказку";
      });

      liveContainer.appendChild(div);
    });
  };

  const updatePrompt = () => {
    let result = "";
    fieldsData.forEach(f => {
      if (!f[2]) return;
      result += f[2].trim() + ",";
      result += f[3] ? "\n" : " ";
    });
    resultArea.value = result.trim();
  };

  // Отрисовка редактируемых полей
  const renderEditFields = () => {
    editContainer.querySelectorAll(".field-edit").forEach(e => e.remove());
    fieldsData.forEach((f, index) => {
      const div = document.createElement("div");
      div.className = "field-edit";
      div.innerHTML = `
        <div class="drag-handle"></div>
        <div class="field-content">
          <input type="text" value="${f[0]}" placeholder="Название поля">
          <textarea placeholder="Подсказка">${f[1]}</textarea>
          <label style="font-size: 0.85rem; margin-top:5px;">
            <input type="checkbox" ${f[3] ? "checked" : ""}> Начинать с новой строки
          </label>
        </div>
        <div class="field-actions">
          <button class="remove-btn">✖</button>
        </div>
      `;

      const input = div.querySelector("input");
      const textarea = div.querySelector("textarea");
      const checkbox = div.querySelector("input[type='checkbox']");
      const removeBtn = div.querySelector(".remove-btn");

      input.addEventListener("input", e => { f[0] = e.target.value; saveFields(); });
      textarea.addEventListener("input", e => { f[1] = e.target.value; saveFields(); });
      checkbox.addEventListener("change", e => { f[3] = e.target.checked; saveFields(); });
      removeBtn.addEventListener("click", () => {
        fieldsData.splice(index,1);
        renderEditFields();
        renderLiveFields(); // Обновляем live-поля после удаления
        saveFields();
      });

      editContainer.appendChild(div);
    });
  };

  addFieldBtn.addEventListener("click", () => {
    fieldsData.push(["Новая категория","", "", true]);
    renderEditFields();
    renderLiveFields(); // Обновляем live-поля после добавления
    saveFields();
  });

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
      updatePrompt();
      renderLiveFields(); // Обновляем live-поля после редактирования
      saveFields();
    }
  });

  // Drag & drop для редактирования
  new Sortable(editContainer, {
    handle: ".drag-handle",
    animation: 150,
    onEnd: () => {
      fieldsData = [...editContainer.querySelectorAll(".field-edit")].map(div => {
        const input = div.querySelector("input");
        const textarea = div.querySelector("textarea");
        const checkbox = div.querySelector("input[type='checkbox']");
        return [input.value, textarea.value, "", checkbox.checked];
      });
      updatePrompt();
      renderLiveFields(); // Обновляем live-поля после сортировки
      saveFields();
    }
  });

  // Кнопка копирования
  new ClipboardJS("#copy-btn", { text: () => resultArea.value });

  // Инициализация
  renderLiveFields();
  updatePrompt();
});