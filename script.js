const BASE_WIDTH = 1668;
const cardCanvas = document.getElementById("cardCanvas");
const textOverlay = document.getElementById("textOverlay");

const nameInput = document.getElementById("nameInput");
const positionInput = document.getElementById("positionInput");
const emailInput = document.getElementById("emailInput");
const phoneInput = document.getElementById("phoneInput");

const cardName = document.getElementById("cardName");
const cardPosition = document.getElementById("cardPosition");
const cardPhone = document.getElementById("cardPhone");
const cardEmail = document.getElementById("cardEmail");

const form = document.getElementById("cardForm");
const downloadBtn = document.getElementById("downloadBtn");
const shareBtn = document.getElementById("shareBtn");
const resetBtn = document.getElementById("resetBtn");
const hintText = document.getElementById("hintText");

function fitOverlayToCard() {
  const scale = cardCanvas.clientWidth / BASE_WIDTH;
  textOverlay.style.transform = `scale(${scale})`;
}

function updatePreview() {
  cardName.textContent = nameInput.value.trim();
  cardPosition.textContent = positionInput.value.trim();
  cardEmail.textContent = emailInput.value.trim();
  const phoneDigits = phoneInput.value.replace(/\D/g, "").slice(0, 9);
  phoneInput.value = phoneDigits;
  cardPhone.textContent = phoneDigits ? `(+966) ${phoneDigits}` : "(+966)";
}

async function renderCardCanvas() {
  cardCanvas.classList.add("exporting");
  try {
    const canvas = await html2canvas(cardCanvas, {
      scale: 4,
      useCORS: true,
      backgroundColor: null
    });
    const context = canvas.getContext("2d");
    if (context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
    }
    return canvas;
  } finally {
    cardCanvas.classList.remove("exporting");
  }
}

function getCardFileBaseName() {
  const rawName = nameInput.value.trim();
  if (!rawName) {
    return "business-card";
  }
  const safe = rawName
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s_-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
  return safe || "business-card";
}

function showHint(message) {
  hintText.textContent = message;
}

async function downloadCard() {
  try {
    const canvas = await renderCardCanvas();
    const link = document.createElement("a");
    link.download = `${getCardFileBaseName()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showHint("Card downloaded successfully.");
  } catch (error) {
    showHint("Could not download card.");
  }
}

async function shareCard() {
  try {
    const canvas = await renderCardCanvas();

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) {
      throw new Error("Canvas blob creation failed");
    }

    const fileName = `${getCardFileBaseName()}.png`;
    const file = new File([blob], fileName, { type: "image/png" });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Business Card"
      });
      showHint("Card shared.");
      return;
    }

    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob
        })
      ]);
      showHint("Sharing not supported here. Card copied to clipboard.");
      return;
    }

    await downloadCard();
    showHint("Sharing unavailable. Card downloaded instead.");
  } catch (error) {
    showHint("Could not share card.");
  }
}

function resetForm() {
  form.reset();
  updatePreview();
  showHint("Card reset.");
}

[nameInput, positionInput, emailInput].forEach((input) => {
  input.addEventListener("input", updatePreview);
});

phoneInput.addEventListener("input", updatePreview);

downloadBtn.addEventListener("click", downloadCard);
shareBtn.addEventListener("click", shareCard);
resetBtn.addEventListener("click", resetForm);

window.addEventListener("resize", fitOverlayToCard);
window.addEventListener("load", () => {
  fitOverlayToCard();
  updatePreview();
});

const observer = new ResizeObserver(fitOverlayToCard);
observer.observe(cardCanvas);
