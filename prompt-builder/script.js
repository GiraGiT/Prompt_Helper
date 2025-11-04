document.addEventListener("DOMContentLoaded", () => {
  const liveContainer = document.getElementById("live-fields-container");
  const editContainer = document.getElementById("edit-fields-container");
  const editModeBtn = document.getElementById("edit-mode-btn");
  const resultArea = document.getElementById("result");

  const defaultFields = [
    ["Кто", "Тип персонажа, возраст, гендер", "", true, true],
    ["Внешность / стиль", "Цвет волос, глаза, особенности", "", true, true],
    ["Одежда / аксессуары", "Одежда, украшения, фетиши", "", true, true],
    ["Фон / окружение", "Комната, пейзаж, окружение", "", true, true],
    ["Атмосфера / освещение", "Настроение, тип освещения", "", true, true],
    ["Стилизация / техника", "Аниме стиль, художник, жанр", "", true, true],
    ["Композиция / ракурс", "Камера, фокус, перспектива", "", true, true],
    ["Качество / разрешение", "Детализация, итоговый вид", "", true, true],
    ["Персонаж", "LORA персонажа", "", true, true],
    ["🔞 NSFW теги (опц.)", "Только если нужна NSFW сцена", "", true, true],
    ["Embendings", "Дополнения", "", true, true],
    ["Пакет из LORA", "Все LORA, что могут использоваться в генерации", "", true, true],
    ["Negative prompt", "Что исключить", "lazyneg, worst quality, normal quality, anatomical nonsense, bad anatomy, interlocked fingers, extra fingers, watermark, transparent, low quality, logo,text, signature, missing fingers, extra fingers, extra toes, missing toes, shiny skin, glistening_clothing, shiny clothes, blurry, blurry text, distorted letters, incorrect spelling, latin alphabet, extra words, bad typography, misspelled,", true, false],
    ["ADetailer hands negative", "", "face, eyes, person, extra limbs, mutated hands, extra fingers,", true, false],
    ["ADetailer hands positive", "", "<lora:detailed hand focus style illustriousXL v1.1:0.8>,", true, false],
    ["ADetailer face positive", "", "cute face, perfect face, large magenta eyes, gradient eyes, slit pupils, blush, teeth, fang, glossy lips, parted lips, makeup, <lora:DetailedEyes_V3:1>,", true, false],
  ];

  let fieldsData = JSON.parse(localStorage.getItem("promptBuilderFields")) || JSON.parse(JSON.stringify(defaultFields));

  const saveFields = () => localStorage.setItem("promptBuilderFields", JSON.stringify(fieldsData));

  const autoResizeTextarea = (textarea) => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  // Рендер live-полей
  const renderLiveFields = () => {
    liveContainer.innerHTML = "";
    const textareas = [];

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
        const isHidden = hintText.style.display === "none" || hintText.style.display === "";
        hintText.style.display = isHidden ? "block" : "none";
        toggle.textContent = isHidden ? "Скрыть подсказку" : "Показать подсказку";
      });

      liveContainer.appendChild(div);
      textareas.push(textarea);
    });

    // Подстроить высоту всех textarea после вставки в DOM
    textareas.forEach(autoResizeTextarea);
    autoResizeTextarea(resultArea);
  };

  const updatePrompt = () => {
    let result = "";
    fieldsData.forEach(f => {
      if (!f[2] || !f[4]) return; // игнорируем поле, если галочка "Добавлять в итоговый промпт" отключена
      result += f[2].trim() + ",";
      result += f[3] ? "\n" : " ";
    });
    resultArea.value = result.trim();
    autoResizeTextarea(resultArea);
  };

  // Рендер редактируемых полей
  const renderEditFields = () => {
    editContainer.innerHTML = "";

    // Панель управления полями
    const toolbar = document.createElement("div");
    toolbar.className = "edit-toolbar";
    toolbar.innerHTML = `
      <button id="add-field">➕ Добавить поле</button>
      <button id="reset-fields">♻ Сбросить поля</button>
    `;
    editContainer.appendChild(toolbar);

    const addFieldBtn = toolbar.querySelector("#add-field");
    const resetFieldsBtn = toolbar.querySelector("#reset-fields");

    addFieldBtn.addEventListener("click", () => {
      fieldsData.push(["Новая категория","", "", true, true]);
      renderEditFields();
      saveFields();
    });

    resetFieldsBtn.addEventListener("click", () => {
      fieldsData = JSON.parse(JSON.stringify(defaultFields));
      renderEditFields();
      renderLiveFields();
      updatePrompt();
      saveFields();
    });

    // Поля
    fieldsData.forEach((f, index) => {
      const div = document.createElement("div");
      div.className = "field-edit";
      div.innerHTML = `
        <div class="drag-handle"></div>
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
      textarea.addEventListener("input", e => { f[1] = e.target.value; saveFields(); });
      checkboxNewLine.addEventListener("change", e => { f[3] = e.target.checked; saveFields(); });
      checkboxInclude.addEventListener("change", e => { f[4] = e.target.checked; updatePrompt(); saveFields(); });
      removeBtn.addEventListener("click", () => {
        fieldsData.splice(index, 1);
        renderEditFields();
        renderLiveFields();
        updatePrompt();
        saveFields();
      });

      editContainer.appendChild(div);
    });
  };

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
    }
  });

  // Drag & Drop
  new Sortable(editContainer, {
    handle: ".drag-handle",
    animation: 150,
    onEnd: () => {
      fieldsData = [...editContainer.querySelectorAll(".field-edit")].map(div => {
        const input = div.querySelector("input[type=text]");
        const textarea = div.querySelector("textarea");
        const checkboxNewLine = div.querySelectorAll("input[type=checkbox]")[0];
        const checkboxInclude = div.querySelectorAll("input[type=checkbox]")[1];
        return [input.value, textarea.value, "", checkboxNewLine.checked, checkboxInclude.checked];
      });
      renderLiveFields();
      updatePrompt();
      saveFields();
    }
  });

  new ClipboardJS("#copy-btn", { text: () => resultArea.value });

  renderLiveFields();
  updatePrompt();
});