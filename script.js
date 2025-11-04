document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-button");
  const iframes = document.querySelectorAll(".tab-iframe");

  // Открытая вкладка по умолчанию или последняя
  let activeTab = localStorage.getItem("activeTab") || 0;
  activateTab(activeTab);

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      activateTab(index);
      localStorage.setItem("activeTab", index);
    });
  });

  function activateTab(index) {
    tabs.forEach((t, i) => t.classList.toggle("active", i == index));
    iframes.forEach((f, i) => f.style.display = i == index ? "block" : "none");
  }

  // Авто-подстройка высоты iframe
  const setupIframeAutoHeight = (iframe) => {
    const adjustHeight = () => {
      try {
        iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 20 + "px";
      } catch(e) {}
    };

    iframe.addEventListener("load", () => {
      adjustHeight();

      // MutationObserver для динамического контента
      const doc = iframe.contentWindow.document;
      const observer = new MutationObserver(adjustHeight);
      observer.observe(doc.body, { childList: true, subtree: true, characterData: true });

      // Подстройка при вводе текста
      doc.addEventListener('input', adjustHeight);
      doc.addEventListener('change', adjustHeight);
    });
  };

  iframes.forEach(iframe => setupIframeAutoHeight(iframe));
});