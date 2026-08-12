import { quantizeFrame } from "./pixel-cam-quantize.js";

let ctx = null;
let width = 0;
let height = 0;
let bufferCanvas = null;
let bufferCtx = null;
let scratchCanvas = null;
let scratchCtx = null;

self.onmessage = (event) => {
  const msg = event.data;

  if (msg.type === "init") {
    width = msg.width;
    height = msg.height;
    ctx = msg.canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    bufferCanvas = new OffscreenCanvas(width, height);
    bufferCtx = bufferCanvas.getContext("2d", { willReadFrequently: true });
    scratchCanvas = new OffscreenCanvas(width, height);
    scratchCtx = scratchCanvas.getContext("2d");
    return;
  }

  if (msg.type === "frame" && ctx) {
    const bitmap = msg.bitmap;
    // Mirror horizontally for a selfie-style view.
    bufferCtx.save();
    bufferCtx.scale(-1, 1);
    bufferCtx.drawImage(bitmap, -width, 0, width, height);
    bufferCtx.restore();
    bitmap.close();

    const srcImageData = bufferCtx.getImageData(0, 0, width, height);
    const quantized = quantizeFrame(srcImageData.data, width, height);
    scratchCtx.putImageData(new ImageData(quantized, width, height), 0, 0);

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(scratchCanvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }
};
