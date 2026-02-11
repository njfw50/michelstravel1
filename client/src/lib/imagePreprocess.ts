export function preprocessForMRZ(file: File): Promise<{ original: Blob; enhanced: Blob; mrzCropped: Blob }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const original = imageToBlob(img, img.width, img.height, false, false);
        const enhanced = imageToBlob(img, img.width, img.height, true, false);
        const mrzCropped = imageToBlob(img, img.width, img.height, true, true);
        resolve({ original, enhanced, mrzCropped });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

function imageToBlob(
  img: HTMLImageElement,
  width: number,
  height: number,
  enhance: boolean,
  cropMRZ: boolean
): Blob {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  let srcX = 0;
  let srcY = 0;
  let srcW = width;
  let srcH = height;

  if (cropMRZ) {
    srcY = Math.floor(height * 0.65);
    srcH = height - srcY;
  }

  const scale = Math.min(2000 / srcW, 2000 / srcH, 2);
  const outW = Math.round(srcW * scale);
  const outH = Math.round(srcH * scale);

  canvas.width = outW;
  canvas.height = outH;

  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

  if (enhance) {
    const imageData = ctx.getImageData(0, 0, outW, outH);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      gray = ((gray - 128) * 1.8) + 128;
      gray = Math.max(0, Math.min(255, gray));

      const threshold = gray > 140 ? 255 : 0;

      data[i] = threshold;
      data[i + 1] = threshold;
      data[i + 2] = threshold;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  const dataUrl = canvas.toDataURL("image/png");
  const binary = atob(dataUrl.split(",")[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: "image/png" });
}

export function createPreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
