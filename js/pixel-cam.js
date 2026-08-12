const BUFFER_W = 112;
const BUFFER_H = 84;
const CAPTURE_INTERVAL_MS = 83; // ~12fps

function isPixelCamSupported() {
  return (
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof window.OffscreenCanvas === "function" &&
    typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function"
  );
}

export function initPixelCam({
  toggleElement: toggle,
  heroElement: hero,
  canvasElement: canvas,
  docElement,
} = {}) {
  const build = docElement?.dataset.build;

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
  let isIntersecting = true;
  let isTransitioning = false;

  function computeIsPaused() {
    return !isIntersecting || document.visibilityState !== "visible";
  }

  function ensureWorker() {
    if (worker) {
      return worker;
    }
    worker = new Worker(`./js/pixel-cam-worker.js?v=${build}`, { type: "module" });
    worker.onerror = (event) => {
      console.warn("Pixel cam worker error:", event.message);
      stop();
    };
    const offscreen = canvas.transferControlToOffscreen();
    worker.postMessage({ type: "init", canvas: offscreen, width: BUFFER_W, height: BUFFER_H }, [
      offscreen,
    ]);
    return worker;
  }

  async function captureFrame() {
    if (!video || video.readyState < 2 || !worker) {
      return;
    }
    try {
      const bitmap = await createImageBitmap(video);
      worker.postMessage({ type: "frame", bitmap }, [bitmap]);
    } catch (err) {
      console.warn("Pixel cam frame capture failed:", err);
    }
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
        isIntersecting = entry.isIntersecting;
      }
      isPaused = computeIsPaused();
      syncCaptureLoop();
    },
    { threshold: 0.01 },
  );

  document.addEventListener("visibilitychange", () => {
    if (!isActive) {
      return;
    }
    isPaused = computeIsPaused();
    syncCaptureLoop();
  });

  async function start() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      ensureWorker();
    } catch (err) {
      console.warn("Pixel cam could not start:", err);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      if (video) {
        video.srcObject = null;
        video = null;
      }
      return;
    }

    isActive = true;
    isPaused = computeIsPaused();
    observer.observe(hero);
    syncCaptureLoop();

    hero.classList.add("is-pixel-cam-active");
    toggle.setAttribute("aria-pressed", "true");
  }

  function stop() {
    isActive = false;
    isIntersecting = true;
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

  toggle.addEventListener("click", async () => {
    if (isTransitioning) {
      return;
    }
    isTransitioning = true;
    try {
      if (isActive) {
        stop();
      } else {
        await start();
      }
    } finally {
      isTransitioning = false;
    }
  });

  window.addEventListener("pagehide", () => {
    if (isActive) {
      stop();
    }
  });
}
