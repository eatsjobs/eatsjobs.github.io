const BUFFER_W = 64;
const BUFFER_H = 48;
const CAPTURE_INTERVAL_MS = 83; // ~12fps

function isPixelCamSupported() {
  return (
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof window.OffscreenCanvas === "function" &&
    typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function"
  );
}

export function initPixelCam() {
  const toggle = document.getElementById("pixelCamToggle");
  const hero = document.querySelector(".hero");
  const canvas = document.querySelector(".hero-pixel-canvas");
  const build = document.documentElement.dataset.build;

  if (!toggle || !hero || !canvas || !isPixelCamSupported()) {
    return;
  }

  toggle.hidden = false;

  let stream = null;
  let video = null;
  let worker = null;
  let captureTimer = null;
  let isActive = false;
  let isPaused = false;

  function ensureWorker() {
    if (worker) {
      return worker;
    }
    worker = new Worker(`./js/pixel-cam-worker.js?v=${build}`, { type: "module" });
    const offscreen = canvas.transferControlToOffscreen();
    worker.postMessage(
      { type: "init", canvas: offscreen, width: BUFFER_W, height: BUFFER_H },
      [offscreen]
    );
    return worker;
  }

  async function captureFrame() {
    if (!video || video.readyState < 2 || !worker) {
      return;
    }
    const bitmap = await createImageBitmap(video);
    worker.postMessage({ type: "frame", bitmap }, [bitmap]);
  }

  function syncCaptureLoop() {
    if (!isActive) {
      return;
    }
    if (isPaused && captureTimer) {
      window.clearInterval(captureTimer);
      captureTimer = null;
    } else if (!isPaused && !captureTimer) {
      captureTimer = window.setInterval(captureFrame, CAPTURE_INTERVAL_MS);
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        isPaused = !entry.isIntersecting || document.visibilityState !== "visible";
      }
      syncCaptureLoop();
    },
    { threshold: 0.01 }
  );

  document.addEventListener("visibilitychange", () => {
    if (!isActive) {
      return;
    }
    isPaused = document.visibilityState !== "visible";
    syncCaptureLoop();
  });

  async function start() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
    } catch {
      return;
    }

    video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();

    ensureWorker();

    isActive = true;
    isPaused = document.visibilityState !== "visible";
    observer.observe(hero);
    syncCaptureLoop();

    hero.classList.add("is-pixel-cam-active");
    toggle.setAttribute("aria-pressed", "true");
  }

  function stop() {
    isActive = false;
    if (captureTimer) {
      window.clearInterval(captureTimer);
      captureTimer = null;
    }
    observer.unobserve(hero);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    if (video) {
      video.srcObject = null;
      video = null;
    }

    hero.classList.remove("is-pixel-cam-active");
    toggle.setAttribute("aria-pressed", "false");
  }

  toggle.addEventListener("click", () => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  });

  window.addEventListener("pagehide", () => {
    if (isActive) {
      stop();
    }
  });
}
