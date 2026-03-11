const moves = document.getElementById("moves");
const container = document.querySelector(".container");
const startButton = document.getElementById("start-button");
const coverScreen = document.querySelector(".cover-screen");
const result = document.getElementById("result");
const uploadInput = document.getElementById("upload-image");
const resetImageButton = document.getElementById("reset-image");
const originalImage = document.querySelector(".original-image img");

let currentElement = "";
let movesCount,
  imagesArr = [];
let isImageReady = false;
let touchStartX = 0;
let touchStartY = 0;

const remoteDefaultBase =
  "https://placeholdpicsum.dev/photo/600?random=";
let tileSources = {};

const IMAGE_SIZE = 600;
const GRID_SIZE = 3;

const isTouchDevice = () => {
  try {
    document.createEvent("TouchEvent");
    return true;
  } catch (e) {
    return false;
  }
};
const randomNumber = () => Math.floor(Math.random() * 8) + 1;

const getCoords = (element) => {
  const [row, col] = element.getAttribute("data-position").split("_");
  return [parseInt(row), parseInt(col)];
};

const checkAdjacent = (row1, row2, col1, col2) => {
  if (row1 == row2) {
    if (col2 == col1 - 1 || col2 == col1 + 1) {
      return true;
    }
  } else if (col1 == col2) {
    if (row2 == row1 - 1 || row2 == row1 + 1) {
      return true;
    }
  }
  return false;
};

const getTileSource = (index) => tileSources[index] || "";

const updateTileImages = () => {
  const images = container.querySelectorAll("img.image");
  images.forEach((img) => {
    const index = parseInt(img.getAttribute("data-index"));
    img.src = getTileSource(index);
  });
};

const createBlankTile = () => {
  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_SIZE / GRID_SIZE;
  canvas.height = IMAGE_SIZE / GRID_SIZE;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
};

const createFallbackTiles = () => {
  const tiles = {};
  const tileSize = IMAGE_SIZE / GRID_SIZE;
  let count = 1;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const tileCanvas = document.createElement("canvas");
      tileCanvas.width = tileSize;
      tileCanvas.height = tileSize;
      const tileCtx = tileCanvas.getContext("2d");
      const hue = (count * 40) % 360;
      tileCtx.fillStyle = `hsl(${hue}, 60%, 75%)`;
      tileCtx.fillRect(0, 0, tileSize, tileSize);
      tileCtx.fillStyle = "rgba(255,255,255,0.6)";
      tileCtx.fillRect(8, 8, tileSize - 16, tileSize - 16);
      tiles[count] = tileCanvas.toDataURL("image/png");
      count += 1;
    }
  }
  tiles[9] = createBlankTile();
  return tiles;
};

const sliceImageToTiles = (img) => {
  const tiles = {};
  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_SIZE;
  canvas.height = IMAGE_SIZE;
  const ctx = canvas.getContext("2d");

  const minSide = Math.min(img.width, img.height);
  const sx = (img.width - minSide) / 2;
  const sy = (img.height - minSide) / 2;

  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, IMAGE_SIZE, IMAGE_SIZE);

  const tileSize = IMAGE_SIZE / GRID_SIZE;
  let count = 1;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const tileCanvas = document.createElement("canvas");
      tileCanvas.width = tileSize;
      tileCanvas.height = tileSize;
      const tileCtx = tileCanvas.getContext("2d");
      tileCtx.drawImage(
        canvas,
        col * tileSize,
        row * tileSize,
        tileSize,
        tileSize,
        0,
        0,
        tileSize,
        tileSize
      );
      tiles[count] = tileCanvas.toDataURL("image/png");
      count += 1;
    }
  }

  tiles[9] = createBlankTile();
  return tiles;
};

const dataUrlFromBlob = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image data."));
    reader.readAsDataURL(blob);
  });

const loadImageFromUrl = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = url;
  });

const loadRemoteDefaultImage = async () => {
  const url = `${remoteDefaultBase}${Date.now()}`;
  startButton.disabled = true;
  startButton.innerText = "Loading game...";
  try {
    const response = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }
    const blob = await response.blob();
    const dataUrl = await dataUrlFromBlob(blob);
    const image = await loadImageFromUrl(dataUrl);
    tileSources = sliceImageToTiles(image);
    originalImage.src = dataUrl;
    updateTileImages();
    isImageReady = true;
  } catch (error) {
    tileSources = createFallbackTiles();
    originalImage.src = "";
    updateTileImages();
    isImageReady = true;
  } finally {
    startButton.disabled = false;
    startButton.innerText = "Start Game";
  }
};

const randomImages = () => {
  while (imagesArr.length < 8) {
    let randomVal = randomNumber();
    if (!imagesArr.includes(randomVal)) {
      imagesArr.push(randomVal);
    }
  }
  imagesArr.push(9);
};

const gridGenerator = () => {
  let count = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let div = document.createElement("div");
      div.setAttribute("data-position", `${i}_${j}`);
      div.addEventListener("click", selectImage);
      div.classList.add("image-container");
      div.innerHTML = `<img src="${getTileSource(imagesArr[count])}" class="image ${
        imagesArr[count] == 9 ? "target" : ""
      }" data-index="${imagesArr[count]}"/>`;
      count += 1;
      container.appendChild(div);
    }
  }
};

const finalizeMove = () => {
  if (imagesArr.join("") == "123456789") {
    setTimeout(() => {
      coverScreen.classList.remove("hide");
      container.classList.add("hide");
      document.body.classList.add("cover-active");
      result.innerText = `Total Moves: ${movesCount}`;
      startButton.innerText = "RestartGame";
    }, 1000);
  }
  movesCount += 1;
  moves.innerText = `Moves: ${movesCount}`;
};

const moveTileElement = (tileImage) => {
  if (!tileImage) {
    return false;
  }
  const targetElement = document.querySelector(".target");
  if (!targetElement) {
    return false;
  }
  const currentParent = tileImage.parentElement;
  const targetParent = targetElement.parentElement;
  const [row1, col1] = getCoords(currentParent);
  const [row2, col2] = getCoords(targetParent);

  if (!checkAdjacent(row1, row2, col1, col2)) {
    return false;
  }

  tileImage.remove();
  targetElement.remove();

  const currentIndex = parseInt(tileImage.getAttribute("data-index"));
  const targetIndex = parseInt(targetElement.getAttribute("data-index"));

  tileImage.setAttribute("data-index", targetIndex);
  targetElement.setAttribute("data-index", currentIndex);

  currentParent.appendChild(targetElement);
  targetParent.appendChild(tileImage);

  const currentArrIndex = imagesArr.indexOf(currentIndex);
  const targetArrIndex = imagesArr.indexOf(targetIndex);
  [imagesArr[currentArrIndex], imagesArr[targetArrIndex]] = [
    imagesArr[targetArrIndex],
    imagesArr[currentArrIndex],
  ];

  finalizeMove();
  return true;
};

const moveTileAt = (row, col) => {
  const tile = container.querySelector(
    `.image-container[data-position="${row}_${col}"] img`
  );
  if (!tile || tile.classList.contains("target")) {
    return false;
  }
  return moveTileElement(tile);
};

const selectImage = (e) => {
  e.preventDefault();
  if (e.target.tagName !== "IMG") {
    return;
  }
  currentElement = e.target;
  moveTileElement(currentElement);
};

const startGame = () => {
  if (!isImageReady) {
    return;
  }
  document.body.classList.remove("cover-active");
  container.classList.remove("hide");
  coverScreen.classList.add("hide");
  container.innerHTML = "";
  imagesArr = [];
  randomImages();
  gridGenerator();
  movesCount = 0;
  moves.innerText = `Moves: ${movesCount}`;
};

const resetPuzzleState = (showBoard) => {
  if (!isImageReady) {
    return;
  }
  if (showBoard) {
    document.body.classList.remove("cover-active");
    container.classList.remove("hide");
    coverScreen.classList.add("hide");
  }
  container.innerHTML = "";
  imagesArr = [];
  randomImages();
  gridGenerator();
  movesCount = 0;
  moves.innerText = `Moves: ${movesCount}`;
};

const handleImageUpload = (file) => {
  if (!file || !file.type.startsWith("image/")) {
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    const image = new Image();
    image.onload = () => {
      tileSources = sliceImageToTiles(image);
      originalImage.src = event.target.result;
      updateTileImages();
      isImageReady = true;
      const isPlaying = coverScreen.classList.contains("hide");
      resetPuzzleState(isPlaying);
    };
    image.src = event.target.result;
  };
  reader.readAsDataURL(file);
};

const resetToDefaultImage = () => {
  uploadInput.value = "";
  isImageReady = false;
  loadRemoteDefaultImage();
};

uploadInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  handleImageUpload(file);
});

resetImageButton.addEventListener("click", () => {
  resetToDefaultImage();
});

startButton.addEventListener("click", () => {
  startGame();
});

container.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length === 0) {
      return;
    }
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  },
  { passive: true }
);

container.addEventListener("touchend", (event) => {
  if (event.changedTouches.length === 0) {
    return;
  }
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const threshold = 20;

  if (absX < threshold && absY < threshold) {
    return;
  }

  const blank = container.querySelector(".target");
  if (!blank) {
    return;
  }
  const blankParent = blank.parentElement;
  const [blankRow, blankCol] = getCoords(blankParent);

  if (absX > absY) {
    if (dx > 0) {
      moveTileAt(blankRow, blankCol + 1);
    } else {
      moveTileAt(blankRow, blankCol - 1);
    }
  } else if (dy > 0) {
    moveTileAt(blankRow + 1, blankCol);
  } else {
    moveTileAt(blankRow - 1, blankCol);
  }
});

window.onload = () => {
  coverScreen.classList.remove("hide");
  container.classList.add("hide");
  document.body.classList.add("cover-active");
  loadRemoteDefaultImage();
};

window.render_game_to_text = () => {
  const payload = {
    mode: coverScreen.classList.contains("hide") ? "playing" : "cover",
    moves: movesCount || 0,
    tiles: imagesArr,
    coords: "origin=top-left, x=column, y=row",
  };
  return JSON.stringify(payload);
};

window.advanceTime = (ms) => {
  void ms;
};
