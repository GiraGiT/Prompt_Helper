document.addEventListener("DOMContentLoaded", () => {
  const liveContainer = document.getElementById("live-fields-container");
  const editContainer = document.getElementById("edit-fields-container");
  const editModeBtn = document.getElementById("edit-mode-btn");
  const resultArea = document.getElementById("result");
  const copyBtn = document.getElementById("copy-btn");
  const defaultTemplateFile = "prompt-builder-template-default.json";

  let defaultFields = [];
  let fieldsData = [];
  let tagList = [];
  let isEdit = false;

  // ------------------- Undo/Redo History -------------------
  let history = [];
  let historyIndex = -1;
  let historyTimeout;

  const pushHistory = () => {
    if (historyIndex < history.length - 1) {
      history = history.slice(0, historyIndex + 1);
    }
    const currentState = JSON.stringify(fieldsData);
    if (history.length > 0 && history[historyIndex] === currentState) {
      return;
    }
    history.push(currentState);
    historyIndex++;
    if (history.length > 50) {
      history.shift();
      historyIndex--;
    }
  };

  const recordHistory = () => {
    clearTimeout(historyTimeout);
    historyTimeout = setTimeout(pushHistory, 500);
  };

  const recordHistoryImmediate = () => {
    clearTimeout(historyTimeout);
    pushHistory();
  };

  const undo = () => {
    if (historyIndex > 0) {
      historyIndex--;
      fieldsData = JSON.parse(history[historyIndex]);
      localStorage.setItem("promptBuilderFields", JSON.stringify(fieldsData));
      if (isEdit) renderEditFields(); else renderLiveFields();
      updatePrompt();
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      fieldsData = JSON.parse(history[historyIndex]);
      localStorage.setItem("promptBuilderFields", JSON.stringify(fieldsData));
      if (isEdit) renderEditFields(); else renderLiveFields();
      updatePrompt();
    }
  };

  document.addEventListener("keydown", e => {
    if (e.ctrlKey && !e.altKey) {
        if (e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                redo();
            } else {
                undo();
            }
        } else if (e.key.toLowerCase() === 'y') {
            e.preventDefault();
            redo();
        }
    }
  });

  // ------------------- CSV parsing -------------------
  function parseCSVLine(line) {
    const tokens = [];
    let cur = "", inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { tokens.push(cur); cur=""; }
      else cur+=ch;
    }
    tokens.push(cur);
    return tokens.map(t=>t.trim());
  }

  // ------------------- Load tags.csv -------------------
  fetch("tags.csv")
    .then(r=>r.text())
    .then(text=>{
      tagList = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
        .map(line=>{
          const parts=parseCSVLine(line);
          const tag=parts[0]||"";
          const popularity=parts[2]?parseInt(parts[2].replace(/\D/g,''))||0:0;
          const aliasesRaw=parts[3]||"";
          const aliases=aliasesRaw.replace(/^"|"$/g,"").split(",").map(a=>a.trim()).filter(Boolean);
          return {tag,popularity,aliases};
        }).filter(Boolean);
      tagList.sort((a,b)=>(b.popularity||0)-(a.popularity||0));
    }).catch(err=>{ console.warn("Не удалось загрузить tags.csv:", err); tagList=[]; });

  // ------------------- Auto-resize -------------------
  const autoResizeTextarea = ta => {
    if(!ta) return;
    ta.style.height="auto";
    ta.style.height=Math.max(40,ta.scrollHeight)+"px";
  };
  const initAutoResizeAll=()=>{document.querySelectorAll("textarea").forEach(ta=>{ta.removeEventListener("input",ta._autoResizeHandler||(()=>{})); const h=()=>autoResizeTextarea(ta); ta._autoResizeHandler=h; ta.addEventListener("input",h); autoResizeTextarea(ta);});};

  // ------------------- Insert Tag (replaces token) -------------------
  function insertTagReplacingToken(textarea, tag) {
    const pos = textarea.selectionStart;
    const val = textarea.value;

    // Найти токен до курсора (от пробела или запятой)
    const beforeCursor = val.slice(0, pos);
    const tokenMatch = beforeCursor.match(/[\s,]*([^\s,]*)$/);
    const tokenStart = tokenMatch ? pos - tokenMatch[1].length : pos;

    const afterCursor = val.slice(pos);

    // Вставляем тег вместо токена
    let insertText = tag + ",";
    if (afterCursor.length && afterCursor[0] !== " " && afterCursor[0] !== ",") insertText += " ";

    textarea.value = val.slice(0, tokenStart) + insertText + afterCursor;
    const newPos = tokenStart + insertText.length;
    textarea.setSelectionRange(newPos, newPos);
    textarea.focus();
  }

  // ------------------- Autocomplete -------------------
  function createAutocompleteFor(textarea){
    const wrapper=textarea.parentElement; wrapper.style.position=wrapper.style.position||"relative";
    let list=wrapper.querySelector(".autocomplete-list");
    if(!list){ list=document.createElement("div"); list.className="autocomplete-list"; wrapper.appendChild(list);}
    let activeIndex=-1, currentMatches=[];

    function formatPop(n){ if(!n) return""; if(n>=1e9)return(n/1e9).toFixed(1).replace(/\.0$/,'')+"B"; if(n>=1e6)return(n/1e6).toFixed(1).replace(/\.0$/,'')+"M"; if(n>=1e3)return(n/1e3).toFixed(1).replace(/\.0$/,'')+"K"; return String(n);}

    function hideList(){ list.style.display="none"; activeIndex=-1; currentMatches=[]; }
    function showList(){ if(currentMatches.length===0){ hideList(); return;} list.style.display="block"; }

    function buildList(query){
      const q=(query||"").toLowerCase();
      if(!q){ currentMatches=[]; buildDOM(); return; }
      currentMatches=tagList.filter(t=>{
        if(!t.tag) return false;
        if(t.tag.toLowerCase().includes(q)) return true;
        for(const a of(t.aliases||[])) if(a.toLowerCase().includes(q)) return true;
        return false;
      }).slice(0,12);
      buildDOM(q);
    }

    function buildDOM(q){
      list.innerHTML="";
      if(!currentMatches||currentMatches.length===0){ hideList(); return; }
      currentMatches.forEach((t,idx)=>{
        const item=document.createElement("div");
        item.className="autocomplete-item"; item.dataset.index=idx;
        let displayTag=t.tag;
        if(q){ const re=new RegExp(`(${escapeRegExp(q)})`,"ig"); displayTag=t.tag.replace(re,'<span class="match">$1</span>');}
        const left=document.createElement("div"); left.className="tag"; left.innerHTML=displayTag;
        const right=document.createElement("div"); right.className="info"; right.textContent=formatPop(t.popularity)||(t.aliases&&t.aliases[0])||"";        item.appendChild(left); item.appendChild(right);
        item.addEventListener("mousedown",ev=>{ev.preventDefault(); insertTagReplacingToken(textarea,currentMatches[idx].tag); hideList(); textarea.dispatchEvent(new Event("input"));});
        list.appendChild(item);
      });
      activeIndex=-1; updateActive(); showList();
    }

    function updateActive(){ const items=list.querySelectorAll(".autocomplete-item"); items.forEach(i=>i.classList.remove("active")); if(activeIndex>=0 && items[activeIndex]) items[activeIndex].classList.add("active"); }

    function escapeRegExp(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

    textarea.addEventListener("input",()=>{
      if (textarea._isPriorityChangeEvent) return;
      const pos = textarea.selectionStart;
      const lastToken = textarea.value.slice(0,pos).match(/([^\s,]*)$/)?.[0] || "";
      buildList(lastToken);
    });

    textarea.addEventListener("keydown",e=>{
      const items=list.querySelectorAll(".autocomplete-item"); if(list.style.display==="none"||items.length===0) return;
      if(e.key==="ArrowDown"){e.preventDefault(); activeIndex=(activeIndex+1)%items.length; updateActive(); scrollActiveIntoView();}
      else if(e.key==="ArrowUp"){e.preventDefault(); activeIndex=(activeIndex-1+items.length)%items.length; updateActive(); scrollActiveIntoView();}
      else if(e.key==="Enter"){ if(activeIndex>=0){e.preventDefault(); insertTagReplacingToken(textarea,currentMatches[activeIndex].tag); hideList(); textarea.dispatchEvent(new Event("input"));}}
      else if(e.key==="Escape"){ hideList(); }
    });

    function scrollActiveIntoView(){ const active=list.querySelector(".autocomplete-item.active"); if(active) active.scrollIntoView({block:"nearest"}); }
    textarea.addEventListener("blur",()=>{ setTimeout(()=>{ hideList(); },180); });
    hideList();
  }

  // ------------------- Priority Change on Keydown -------------------
  function handlePriorityKeydown(e) {
    if (e.ctrlKey && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      let selectedText = textarea.value.substring(start, end);

      if (!selectedText.trim()) return; // Игнорируем, если выделены только пробелы

      const direction = e.key === 'ArrowUp' ? 1 : -1;
      const weightRegex = /^\(([^:]+):([\d.]+)\)$/;
      const match = selectedText.match(weightRegex);

      let newText;

      if (match) {
        // Сценарий 1: Выделен полный взвешенный тег, например `(text:1.0)`
        const text = match[1];
        let weight = parseFloat(match[2]);
        weight += 0.1 * direction;
        weight = Math.max(0, Math.round(weight * 10) / 10);
        newText = `(${text}:${weight.toFixed(1)})`;
        textarea.setRangeText(newText, start, end, 'select');
      } else {
        // Сценарий 2: Выделен только текст ВНУТРИ взвешенного тега
        const textBefore = textarea.value.substring(0, start);
        const textAfter = textarea.value.substring(end);

        // Проверяем, что непосредственно перед выделением стоит '(', а после — конструкция ':вес)'
        const prefixRegex = /\($/;
        const suffixRegex = /^:([\d.]+)\)/;

        const suffixMatch = textAfter.match(suffixRegex);

        if (prefixRegex.test(textBefore) && suffixMatch) {
          // Нашли обрамление, изменяем вес
          let weight = parseFloat(suffixMatch[1]);
          weight += 0.1 * direction;
          weight = Math.max(0, Math.round(weight * 10) / 10);
          
          const newWeightStr = `:${weight.toFixed(1)}`;
          // Заменяем старый вес на новый
          textarea.setRangeText(newWeightStr, end, end + suffixMatch[0].length - 1, 'preserve');
        } else {
          // Сценарий 3: Создание нового взвешенного тега
          if (selectedText.startsWith('(') && selectedText.endsWith(')')) {
              selectedText = selectedText.substring(1, selectedText.length - 1);
          }
          const initialWeight = direction > 0 ? 1.0 : 0.9;
          newText = `(${selectedText}:${initialWeight.toFixed(1)})`;
          textarea.setRangeText(newText, start, end, 'select');
        }
      }

      // Триггерим событие input, чтобы обновить итоговый промпт
      textarea._isPriorityChangeEvent = true;
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      textarea.dispatchEvent(inputEvent);
      delete textarea._isPriorityChangeEvent;
    }
  }

  // ------------------- Bracket Validation -------------------
  function checkBrackets(text) {
    const pairs = { '(': ')', '{': '}', '[': ']', '<': '>', '"' : '"' };
    const openBrackets = Object.keys(pairs);
    const closeBrackets = Object.values(pairs);
    const stack = [];
    const missing = {};
    let inQuotes = false;
  
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
  
      if (char === '"' && (i === 0 || text[i-1] !== '\\')) {
        if (inQuotes && stack[stack.length - 1] === '"') {
          stack.pop();
        } else {
          stack.push(char);
        }
        inQuotes = !inQuotes; // Toggle state
        continue;
      }
  
      if (inQuotes) continue;
  
      if (openBrackets.includes(char)) {
        stack.push(char);
      } else if (closeBrackets.includes(char)) {
        const lastOpen = stack[stack.length - 1];
        if (stack.length > 0 && pairs[lastOpen] === char) {
          stack.pop();
        } else {
          // Unmatched closing bracket, means we are missing an opening one
          const needed = Object.keys(pairs).find(key => pairs[key] === char);
          if (needed) missing[needed] = (missing[needed] || 0) + 1;
        }
      }
    }
  
    // Unmatched opening brackets, means we are missing closing ones
    while (stack.length > 0) {
      const open = stack.pop();
      const needed = pairs[open];
      missing[needed] = (missing[needed] || 0) + 1;
    }
    return missing;
  }

  // ------------------- Render Live Fields -------------------
  const renderLiveFields=()=> {
    liveContainer.innerHTML="";
    fieldsData.forEach(f=> {
      const div=document.createElement("div"); div.className="field-live";
      div.innerHTML=`
        <div class="bracket-warning"></div>
        <label>${escapeHtml(f.name)}</label>
        <div class="hint-toggle">Показать подсказку</div>
        <div class="hint-text">${escapeHtml(f.hint)}</div>
        <textarea placeholder="${escapeHtml(f.hint)}">${escapeHtml(f.liveText)}</textarea>
      `;
      const textarea=div.querySelector("textarea");
      const toggle=div.querySelector(".hint-toggle");
      const hintText=div.querySelector(".hint-text");
      const warningEl = div.querySelector(".bracket-warning");
      hintText.style.display="none";

      const updateBracketWarning = () => {
        const missing = checkBrackets(textarea.value);
        const entries = Object.entries(missing);
        if (entries.length > 0) {
          warningEl.textContent = entries.map(([bracket, count]) => `${bracket} - ${count}`).join(' / ');
          warningEl.style.display = 'block';
        } else {
          warningEl.style.display = 'none';
        }
      };

      textarea.addEventListener("input",e=>{ f.liveText=e.target.value; updatePrompt(); recordHistory(); autoResizeTextarea(e.target); updateBracketWarning(); });
      textarea.addEventListener("keydown", handlePriorityKeydown);
      toggle.addEventListener("click",()=>{ const hidden=hintText.style.display==="none"; hintText.style.display=hidden?"block":"none"; toggle.textContent=hidden?"Скрыть подсказку":"Показать подсказку";});
      createAutocompleteFor(textarea);
      updateBracketWarning(); // Initial check
      liveContainer.appendChild(div);
    });
    initAutoResizeAll();
    autoResizeTextarea(resultArea);
  };

  // ------------------- Update Prompt -------------------
  const updatePrompt = () => {
    let result = "";
    fieldsData.forEach(f => {
      if(!f.liveText || !f.includeInPrompt) return;
      const lines = f.liveText.split(/\r?\n/).map(l => l.trim());
      const processedLines = lines.map(l => l ? (l.endsWith(",") ? l : l + ",") : "");
      if(f.newLine) result += processedLines.join("\n") + "\n\n";
      else result += processedLines.join(" ") + " ";
    });
    resultArea.value = result.trim();
    autoResizeTextarea(resultArea);
  };

  // ------------------- Render Edit Fields -------------------
  const renderEditFields=()=> {
    editContainer.innerHTML="";
    const toolbar=document.createElement("div"); toolbar.className="edit-toolbar";
    toolbar.innerHTML=`
      <button id="add-field">➕ Добавить поле</button>
      <button id="reset-fields">♻️ Сбросить поля</button>
      <button id="export-template">💾 Экспорт шаблона</button>
      <button id="import-template">📂 Импорт шаблона</button>
      <input type="file" id="import-file" class="hidden" accept=".json">
    `;
    editContainer.appendChild(toolbar);

    const addBtn=toolbar.querySelector("#add-field");
    const resetBtn=toolbar.querySelector("#reset-fields");
    const exportBtn=toolbar.querySelector("#export-template");
    const importBtn=toolbar.querySelector("#import-template");
    const importFileInput=toolbar.querySelector("#import-file");

    const wrapper=document.createElement("div"); wrapper.id="edit-fields-wrapper"; wrapper.className="fields-edit";
    editContainer.appendChild(wrapper);

    addBtn.addEventListener("click",()=>{ fieldsData.push({ name:"Новая категория", hint:"", liveText:"", nameText:"Новая категория", editText:"", newLine:true, includeInPrompt:true }); renderEditFields(); recordHistoryImmediate(); });

    resetBtn.addEventListener("click",()=>{ fetch(defaultTemplateFile).then(r=>r.json()).then(data=>{ fieldsData=data.map(f=>({ name:f.name||"", hint:f.hint||"", liveText:f.liveText||"", nameText:f.nameText||f.name||"", editText:f.editText||f.hint||"", newLine:f.newLine!==undefined?f.newLine:true, includeInPrompt:f.includeInPrompt!==undefined?f.includeInPrompt:true })); renderEditFields(); renderLiveFields(); updatePrompt(); recordHistoryImmediate(); }); });

    exportBtn.addEventListener("click",()=>{ const blob=new Blob([JSON.stringify(fieldsData,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="prompt-builder-template.json"; a.click(); URL.revokeObjectURL(url); });

    importBtn.addEventListener("click",()=>importFileInput.click());
    importFileInput.addEventListener("change",e=>{
      const file=e.target.files[0]; if(!file) return;
      const reader=new FileReader();
      reader.onload=()=>{
        try{
          const imported = JSON.parse(reader.result);
          if(!Array.isArray(imported)) throw new Error("Неверный формат файла");
          fieldsData=imported.map(f=>({
            name: f.name || "", hint: f.hint || "", liveText: f.liveText || "",
            nameText: f.nameText || f.name || "", editText: f.editText || f.hint || "",
            newLine: f.newLine !== undefined ? f.newLine : true,
            includeInPrompt: f.includeInPrompt !== undefined ? f.includeInPrompt : true
          }));
          renderEditFields(); renderLiveFields(); updatePrompt(); recordHistoryImmediate();
        } catch(err){ alert("Ошибка при импорте шаблона: "+err.message); }
      };
      reader.readAsText(file); importFileInput.value="";
    });

    wrapper.innerHTML="";
    fieldsData.forEach((f,index)=> {
      const div=document.createElement("div"); div.className="field-edit";
      div.innerHTML=`
        <div class="drag-handle">≡≡≡≡</div>
        <div class="field-content">
          <input type="text" value="${escapeHtml(f.nameText)}" placeholder="Название категории">
          <textarea placeholder="Подсказка">${escapeHtml(f.editText)}</textarea>
          <label><input type="checkbox"${f.newLine?" checked":""}> Начинать с новой строки</label>
          <label><input type="checkbox"${f.includeInPrompt?" checked":""}> Добавлять в итоговый промпт</label>
        </div>
        <div class="field-actions"><button class="remove-btn">✖</button></div>
      `;
      const input=div.querySelector("input[type=text]");
      const textarea=div.querySelector("textarea");
      const checkboxNewLine=div.querySelectorAll("input[type=checkbox]")[0];
      const checkboxInclude=div.querySelectorAll("input[type=checkbox]")[1];
      const removeBtn=div.querySelector(".remove-btn");

      input.addEventListener("input",e=>{ f.nameText=e.target.value; f.name=f.nameText; recordHistory(); renderLiveFields(); });
      textarea.addEventListener("input",e=>{ f.editText=e.target.value; f.hint=f.editText; recordHistory(); renderLiveFields(); });
      checkboxNewLine.addEventListener("change",e=>{ f.newLine=e.target.checked; recordHistoryImmediate(); updatePrompt(); });
      checkboxInclude.addEventListener("change",e=>{ f.includeInPrompt=e.target.checked; updatePrompt(); recordHistoryImmediate(); });
      removeBtn.addEventListener("click",()=>{ fieldsData.splice(index,1); renderEditFields(); renderLiveFields(); updatePrompt(); recordHistoryImmediate(); });

      wrapper.appendChild(div);
      autoResizeTextarea(textarea);
    });

    if(!wrapper.sortable){
      wrapper.sortable=new Sortable(wrapper,{ handle:".drag-handle", animation:150, onEnd:()=>{
        const newData=[];
        [...wrapper.querySelectorAll(".field-edit")].forEach(div=>{
          const input=div.querySelector("input[type=text]");
          const textarea=div.querySelector("textarea");
          const checkboxNewLine=div.querySelectorAll("input[type=checkbox]")[0];
          const checkboxInclude=div.querySelectorAll("input[type=checkbox]")[1];
          const old=fieldsData.find(f=>f.nameText===input.value||f.name===input.value)||{};
          newData.push({ name:old.name, hint:old.hint, liveText:old.liveText, nameText:input.value, editText:textarea.value, newLine:checkboxNewLine.checked, includeInPrompt:checkboxInclude.checked });
        });
        fieldsData=newData; renderLiveFields(); updatePrompt(); recordHistoryImmediate();
      }});
    }
  };

  // ------------------- Edit mode toggle -------------------
  editModeBtn.addEventListener("click",()=> {
    isEdit=!isEdit;
    editContainer.classList.toggle("hidden",!isEdit);
    liveContainer.classList.toggle("hidden",isEdit);
    editModeBtn.textContent=isEdit?"Перейти в Live режим":"Перейти в Режим редактирования";
    if(isEdit) renderEditFields();
    else { renderLiveFields(); updatePrompt(); }
  });

  // ------------------- Initial load -------------------
  fetch(defaultTemplateFile).then(r=>r.json()).then(data=>{
    defaultFields=data;
    const saved=localStorage.getItem("promptBuilderFields");
    if(saved){
      try{ fieldsData=JSON.parse(saved); }
      catch(e){ fieldsData=data.map(f=>({ name:f.name||"", hint:f.hint||"", liveText:f.liveText||"", nameText:f.nameText||f.name||"", editText:f.editText||f.hint||"", newLine:f.newLine!==undefined?f.newLine:true, includeInPrompt:f.includeInPrompt!==undefined?f.includeInPrompt:true })); }
    } else fieldsData=data.map(f=>({ name:f.name||"", hint:f.hint||"", liveText:f.liveText||"", nameText:f.nameText||f.name||"", editText:f.editText||f.hint||"", newLine:f.newLine!==undefined?f.newLine:true, includeInPrompt:f.includeInPrompt!==undefined?f.includeInPrompt:true }));
    renderLiveFields(); updatePrompt();
    pushHistory();
  }).catch(err=>console.error("Не удалось загрузить default template:",err));

  // ------------------- Copy button -------------------
  copyBtn.addEventListener("click",()=>{ resultArea.select(); document.execCommand("copy"); });

  // ------------------- Drag & Drop для импорта шаблонов -------------------
  const dropZone = document.getElementById("drop-zone");

  document.addEventListener("dragover", e => {
    e.preventDefault();
    const hasFiles = e.dataTransfer && e.dataTransfer.types &&
                   (e.dataTransfer.types.includes("Files") ||
                    e.dataTransfer.types.includes("application/x-moz-file"));
    if (hasFiles) {
      dropZone.classList.remove("hidden");
    }
  });

  document.addEventListener("dragleave", e => {
    if (e.relatedTarget === null) {
      dropZone.classList.add("hidden");
    }
  });

  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", e => {
    if (!dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove("drag-over");
    }
  });

  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    dropZone.classList.add("hidden");
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.json')) {
      alert("Поддерживаются только файлы формата JSON");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error("Неверный формат файла");
        fieldsData = imported.map(f => ({
          name: f.name || "", hint: f.hint || "", liveText: f.liveText || "",
          nameText: f.nameText || f.name || "", editText: f.editText || f.hint || "",
          newLine: f.newLine !== undefined ? f.newLine : true,
          includeInPrompt: f.includeInPrompt !== undefined ? f.includeInPrompt : true
        }));
        renderEditFields(); renderLiveFields(); updatePrompt(); recordHistoryImmediate();
        localStorage.setItem("promptBuilderFields", JSON.stringify(fieldsData));
      } catch(err) { alert("Ошибка при импорте шаблона: " + err.message); }
    };
    reader.readAsText(file);
  });

  // ------------------- Helpers -------------------
  function escapeHtml(text){ return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
});