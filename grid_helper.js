const gridCanvas = document.getElementById("gridCanvas");
const gctx = gridCanvas.getContext("2d");
const imageLoader = document.getElementById("imageLoader");
const colsInput = document.getElementById("colsInput");
const gridInfo = document.getElementById("gridInfo");

let gridImage = new Image();
let gridColumns = parseInt(colsInput.value, 10);

imageLoader.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    gridImage.onload = () => {
      const maxWidth = 700;
      const scale = gridImage.width > maxWidth ? maxWidth / gridImage.width : 1;
      gridCanvas.width = gridImage.width * scale;
      gridCanvas.height = gridImage.height * scale;
      drawGrid();
    };
    gridImage.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

colsInput.addEventListener("input", () => {
  const val = parseInt(colsInput.value, 10);
  if (!isNaN(val) && val > 0) {
    gridColumns = val;
    drawGrid();
  }
});

function drawGrid() {
  if (!gridImage.src) return;

  gctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  gctx.drawImage(gridImage, 0, 0, gridCanvas.width, gridCanvas.height);

  const tileW = gridCanvas.width / gridColumns;
  const rows = Math.round(gridCanvas.height / tileW);
  const tileH = gridCanvas.height / rows;

  gctx.strokeStyle = "rgba(255, 100, 0, 0.8)";
  gctx.lineWidth = 1.5;

  // Вертикальные линии
  for (let i = 1; i < gridColumns; i++) {
    const x = i * tileW;
    gctx.beginPath();
    gctx.moveTo(x, 0);
    gctx.lineTo(x, gridCanvas.height);
    gctx.stroke();
  }

  // Горизонтальные линии
  for (let j = 1; j < rows; j++) {
    const y = j * tileH;
    gctx.beginPath();
    gctx.moveTo(0, y);
    gctx.lineTo(gridCanvas.width, y);
    gctx.stroke();
  }

  updateGridInfo(tileW, tileH, rows);
}

function updateGridInfo(tileW, tileH, rows) {
  const w = Math.round(tileW);
  const h = Math.round(tileH);
  gridInfo.textContent = `Размер ячейки: ${w} × ${h} px  |  Строк: ${rows}`;
}