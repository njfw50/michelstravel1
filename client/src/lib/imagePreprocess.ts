export interface PreprocessedScanImages {
  original: Blob;
  enhanced: Blob;
  mrzCropped: Blob;
  mrzWide: Blob;
  analysisPreview: Blob;
  analysisMrzPreview: Blob;
}

interface ImageBlobOptions {
  enhance?: boolean;
  cropTop?: number;
  cropHeight?: number;
  maxDimension?: number;
  format?: "image/png" | "image/jpeg";
  quality?: number;
}

export function preprocessForMRZ(file: File): Promise<PreprocessedScanImages> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      try {
        resolve({
          original: imageToBlob(img, { maxDimension: 2000, format: "image/png" }),
          enhanced: imageToBlob(img, { enhance: true, maxDimension: 2000, format: "image/png" }),
          mrzCropped: imageToBlob(img, {
            enhance: true,
            cropTop: 0.65,
            cropHeight: 0.35,
            maxDimension: 2000,
            format: "image/png",
          }),
          mrzWide: imageToBlob(img, {
            enhance: true,
            cropTop: 0.55,
            cropHeight: 0.45,
            maxDimension: 2200,
            format: "image/png",
          }),
          analysisPreview: imageToBlob(img, {
            maxDimension: 1400,
            format: "image/jpeg",
            quality: 0.88,
          }),
          analysisMrzPreview: imageToBlob(img, {
            cropTop: 0.52,
            cropHeight: 0.48,
            maxDimension: 1400,
            format: "image/jpeg",
            quality: 0.9,
          }),
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

function imageToBlob(img: HTMLImageElement, options: ImageBlobOptions): Blob {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context unavailable");
  }

  const width = img.width;
  const height = img.height;
  const cropTop = options.cropTop ?? 0;
  const cropHeight = options.cropHeight ?? 1;

  const srcX = 0;
  const srcY = Math.floor(height * cropTop);
  const srcW = width;
  const srcH = Math.max(1, Math.floor(height * cropHeight));

  const maxDimension = options.maxDimension ?? 2000;
  const scale = Math.min(maxDimension / srcW, maxDimension / srcH, 2);
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));

  canvas.width = outW;
  canvas.height = outH;
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

  if (options.enhance) {
    const imageData = ctx.getImageData(0, 0, outW, outH);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = (0.299 * data[i]) + (0.587 * data[i + 1]) + (0.114 * data[i + 2]);
      const contrasted = Math.max(0, Math.min(255, ((gray - 128) * 2.1) + 128));
      const threshold = contrasted > 138 ? 255 : 0;
      data[i] = threshold;
      data[i + 1] = threshold;
      data[i + 2] = threshold;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  const format = options.format ?? "image/png";
  const quality = options.quality ?? 0.92;
  const dataUrl = canvas.toDataURL(format, quality);
  const binary = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: format });
}

export function createPreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
