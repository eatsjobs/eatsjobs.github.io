import {
  gridSize,
  isSmokeActive,
  parseCssColor,
  pointerToUv,
  splatForce,
} from "./hero-smoke-math.js";
import { SMOKE_SHADER } from "./hero-smoke-shader.js";

// Smoke that trails the mouse across the hero: a small WebGPU fluid sim. Each
// frame the mouse's path is added to a velocity field and a dye field, the
// velocity is made incompressible, and both are carried along by it. Only
// the dye is drawn. With the mouse still, the smoke fades and the sim stops.

// Tuned by eye against the hero. Velocity lives on a coarse grid, which is
// cheap and still swirls convincingly. The dye is finer so the wisps stay
// crisp.
const SIM_RESOLUTION = 128;
const DYE_RESOLUTION = 768;
const PRESSURE_ITERATIONS = 20;
const PRESSURE_RETAIN = 0.8;
const SPLAT_AMOUNT = 0.3;
const SPLAT_SIZE = 0.003;
const SPLAT_PUSH = 5000;
const SMOKE_FADE = 1.4;
const VELOCITY_FADE = 1;
const SWIRL = 25;
const RISE = 15;
// Fresh smoke is the accent colour and greys out as it ages.
const AGING = 0.6;
const AGED_COLOR = [0.45, 0.45, 0.5, 1];
const OPACITY = 0.55;
// A long frame (a tab switch, a GC pause) is treated as a short one, so the
// sim takes a small step instead of blowing up.
const MAX_FRAME_SECONDS = 1 / 30;

// Float offsets into the WGSL Uniforms struct in hero-smoke-shader.js.
const UNIFORM_OFFSETS = {
  texel: 0,
  velocityTexel: 2,
  splatFrom: 4,
  splatTo: 6,
  dt: 8,
  dissipation: 9,
  aspect: 10,
  splatRadius: 11,
  swirl: 12,
  rise: 13,
  aging: 14,
  scale: 15,
  splatValue: 16,
  agedColor: 20,
};
const UNIFORM_FLOATS = 24;

export async function initHeroSmoke({ heroElement: hero, canvasElement: canvas } = {}) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The smoke follows a hovering mouse. On touch screens a drag scrolls the
  // page, so there is nothing to follow.
  const canHover = window.matchMedia("(hover: hover)").matches;

  if (!hero || !canvas || reduceMotion || !canHover || !navigator.gpu) {
    return;
  }

  let smoke;
  let isLost = false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
      return;
    }
    device.lost.then(() => {
      isLost = true;
      canvas.hidden = true;
    });
    smoke = await createSmokeRenderer(device, canvas);
  } catch (err) {
    console.warn("Hero smoke could not start:", err);
    return;
  }

  const rootStyle = getComputedStyle(document.documentElement);
  let accent = parseCssColor(rootStyle.getPropertyValue("--accent")) ?? [1, 1, 1];
  let lastUv = null;
  let stroke = null;
  let lastMoveAt = Number.NEGATIVE_INFINITY;
  let lastFrameAt = 0;
  let frameId = 0;
  let isVisible = true;

  // Read every frame so the smoke follows the picker's 400ms --accent
  // transition rather than snapping to the new colour.
  function readAccent() {
    accent = parseCssColor(rootStyle.getPropertyValue("--accent")) ?? accent;
    return accent;
  }

  function frame(now) {
    if (isLost) {
      return;
    }
    if (!isSmokeActive({ now, lastMoveAt, isVisible })) {
      frameId = 0;
      smoke.clear();
      return;
    }
    const dt = Math.min(Math.max((now - lastFrameAt) / 1000, 0), MAX_FRAME_SECONDS);
    lastFrameAt = now;
    smoke.render({ dt, stroke, accent: readAccent() });
    stroke = null;
    frameId = window.requestAnimationFrame(frame);
  }

  function start() {
    if (frameId || isLost) {
      return;
    }
    lastFrameAt = performance.now();
    frameId = window.requestAnimationFrame(frame);
  }

  // The canvas is sized in CSS pixels: the dye grid is coarser than the
  // screen anyway, so device pixels would only upscale the same blur.
  function syncSize() {
    smoke.resize(Math.max(1, hero.clientWidth), Math.max(1, hero.clientHeight));
  }
  syncSize();
  new ResizeObserver(syncSize).observe(hero);

  new IntersectionObserver((entries) => {
    for (const entry of entries) {
      isVisible = entry.isIntersecting;
    }
  }).observe(hero);

  hero.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") {
      return;
    }
    const uv = pointerToUv(event.clientX, event.clientY, hero.getBoundingClientRect());
    if (lastUv) {
      // Several moves can land between two frames; they're drawn as one
      // straight stroke from where the last frame left off.
      stroke = { from: stroke?.from ?? lastUv, to: uv };
      lastMoveAt = performance.now();
      start();
    }
    lastUv = uv;
  });
  hero.addEventListener("pointerleave", () => {
    lastUv = null;
  });
}

async function createSmokeRenderer(device, canvas) {
  const context = canvas.getContext("webgpu");
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format: canvasFormat, alphaMode: "premultiplied" });

  const module = device.createShaderModule({ code: SMOKE_SHADER });
  const visibility = GPUShaderStage.FRAGMENT;
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility, buffer: { type: "uniform" } },
      { binding: 1, visibility, sampler: { type: "filtering" } },
      { binding: 2, visibility, texture: { sampleType: "float" } },
      { binding: 3, visibility, texture: { sampleType: "float" } },
    ],
  });
  const layout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
  });

  async function createPass(entryPoint, format) {
    const pipeline = await device.createRenderPipelineAsync({
      layout,
      vertex: { module, entryPoint: "fullscreen" },
      fragment: { module, entryPoint, targets: [{ format }] },
      primitive: { topology: "triangle-list" },
    });
    return {
      pipeline,
      uniforms: new Float32Array(UNIFORM_FLOATS),
      buffer: device.createBuffer({
        size: UNIFORM_FLOATS * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      }),
      bindGroups: new Map(),
    };
  }

  // Each pass gets its own uniform buffer: queued writes all land before the
  // frame's commands run, so passes sharing a buffer would all see the last
  // write.
  const passTargets = {
    splatVelocity: ["splat", "rg16float"],
    splatDye: ["splat", "rgba16float"],
    curl: ["curl", "r16float"],
    vorticity: ["vorticity", "rg16float"],
    buoyancy: ["buoyancy", "rg16float"],
    divergence: ["divergence", "r16float"],
    fadePressure: ["scale", "r16float"],
    pressure: ["pressure", "r16float"],
    subtractGradient: ["subtractGradient", "rg16float"],
    advectVelocity: ["advect", "rg16float"],
    advectDye: ["advect", "rgba16float"],
    display: ["display", canvasFormat],
  };
  const passes = Object.fromEntries(
    await Promise.all(
      Object.entries(passTargets).map(async ([name, [entryPoint, format]]) => [
        name,
        await createPass(entryPoint, format),
      ]),
    ),
  );

  let targets = [];
  let nextTargetId = 0;
  let velocity;
  let pressure;
  let divergence;
  let curl;
  let dye;

  function createTarget(width, height, format) {
    const texture = device.createTexture({
      size: [width, height],
      format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    const target = { texture, view: texture.createView(), width, height, id: nextTargetId++ };
    targets.push(target);
    return target;
  }

  // A pass can't read the texture it writes, so fields that update
  // themselves keep two copies and swap after each pass.
  function createPingPong(width, height, format) {
    const pair = {
      read: createTarget(width, height, format),
      write: createTarget(width, height, format),
      swap() {
        [pair.read, pair.write] = [pair.write, pair.read];
      },
    };
    return pair;
  }

  function setUniforms(pass, values) {
    for (const [name, value] of Object.entries(values)) {
      if (typeof value === "number") {
        pass.uniforms[UNIFORM_OFFSETS[name]] = value;
      } else {
        pass.uniforms.set(value, UNIFORM_OFFSETS[name]);
      }
    }
    device.queue.writeBuffer(pass.buffer, 0, pass.uniforms);
  }

  function draw(encoder, pass, targetView, source, secondSource = source) {
    const key = `${source.id}:${secondSource.id}`;
    let bindGroup = pass.bindGroups.get(key);
    if (!bindGroup) {
      bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: pass.buffer } },
          { binding: 1, resource: sampler },
          { binding: 2, resource: source.view },
          { binding: 3, resource: secondSource.view },
        ],
      });
      pass.bindGroups.set(key, bindGroup);
    }
    const renderPass = encoder.beginRenderPass({
      colorAttachments: [{ view: targetView, loadOp: "clear", storeOp: "store" }],
    });
    renderPass.setPipeline(pass.pipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(3);
    renderPass.end();
  }

  function resize(width, height) {
    if (velocity && width === canvas.width && height === canvas.height) {
      return;
    }
    canvas.width = width;
    canvas.height = height;
    for (const target of targets) {
      target.texture.destroy();
    }
    targets = [];
    for (const pass of Object.values(passes)) {
      pass.bindGroups.clear();
    }
    const [simWidth, simHeight] = gridSize(SIM_RESOLUTION, width, height);
    const [dyeWidth, dyeHeight] = gridSize(DYE_RESOLUTION, width, height);
    velocity = createPingPong(simWidth, simHeight, "rg16float");
    pressure = createPingPong(simWidth, simHeight, "r16float");
    divergence = createTarget(simWidth, simHeight, "r16float");
    curl = createTarget(simWidth, simHeight, "r16float");
    dye = createPingPong(dyeWidth, dyeHeight, "rgba16float");
  }

  function render({ dt, stroke, accent }) {
    const aspect = canvas.width / canvas.height;
    const simTexel = [1 / velocity.read.width, 1 / velocity.read.height];
    const dyeTexel = [1 / dye.read.width, 1 / dye.read.height];
    const encoder = device.createCommandEncoder();

    if (stroke) {
      const splat = {
        splatFrom: stroke.from,
        splatTo: stroke.to,
        aspect,
        splatRadius: SPLAT_SIZE * Math.max(aspect, 1),
      };
      const [forceX, forceY] = splatForce(stroke.from, stroke.to, aspect, SPLAT_PUSH);
      setUniforms(passes.splatVelocity, {
        ...splat,
        texel: simTexel,
        splatValue: [forceX, forceY, 0, 0],
      });
      draw(encoder, passes.splatVelocity, velocity.write.view, velocity.read);
      velocity.swap();
      setUniforms(passes.splatDye, {
        ...splat,
        texel: dyeTexel,
        splatValue: [...accent.map((channel) => channel * SPLAT_AMOUNT), SPLAT_AMOUNT],
      });
      draw(encoder, passes.splatDye, dye.write.view, dye.read);
      dye.swap();
    }

    setUniforms(passes.curl, { texel: simTexel });
    draw(encoder, passes.curl, curl.view, velocity.read);
    setUniforms(passes.vorticity, { texel: simTexel, swirl: SWIRL, dt });
    draw(encoder, passes.vorticity, velocity.write.view, velocity.read, curl);
    velocity.swap();
    setUniforms(passes.buoyancy, { texel: simTexel, rise: RISE, dt });
    draw(encoder, passes.buoyancy, velocity.write.view, velocity.read, dye.read);
    velocity.swap();

    setUniforms(passes.divergence, { texel: simTexel });
    draw(encoder, passes.divergence, divergence.view, velocity.read);
    setUniforms(passes.fadePressure, { texel: simTexel, scale: PRESSURE_RETAIN });
    draw(encoder, passes.fadePressure, pressure.write.view, pressure.read);
    pressure.swap();
    setUniforms(passes.pressure, { texel: simTexel });
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      draw(encoder, passes.pressure, pressure.write.view, pressure.read, divergence);
      pressure.swap();
    }
    setUniforms(passes.subtractGradient, { texel: simTexel });
    draw(encoder, passes.subtractGradient, velocity.write.view, pressure.read, velocity.read);
    velocity.swap();

    setUniforms(passes.advectVelocity, {
      texel: simTexel,
      velocityTexel: simTexel,
      dt,
      dissipation: VELOCITY_FADE,
    });
    draw(encoder, passes.advectVelocity, velocity.write.view, velocity.read);
    velocity.swap();
    setUniforms(passes.advectDye, {
      texel: dyeTexel,
      velocityTexel: simTexel,
      dt,
      dissipation: SMOKE_FADE,
      aging: AGING,
      agedColor: AGED_COLOR,
    });
    draw(encoder, passes.advectDye, dye.write.view, velocity.read, dye.read);
    dye.swap();

    setUniforms(passes.display, {
      texel: [1 / canvas.width, 1 / canvas.height],
      scale: OPACITY,
    });
    draw(encoder, passes.display, context.getCurrentTexture().createView(), dye.read);

    device.queue.submit([encoder.finish()]);
  }

  // Empties the fields and the canvas, so smoke left from before the sim
  // stopped can't reappear frozen when it starts again.
  function clear() {
    const encoder = device.createCommandEncoder();
    const views = [
      velocity.read.view,
      pressure.read.view,
      dye.read.view,
      context.getCurrentTexture().createView(),
    ];
    for (const view of views) {
      encoder
        .beginRenderPass({ colorAttachments: [{ view, loadOp: "clear", storeOp: "store" }] })
        .end();
    }
    device.queue.submit([encoder.finish()]);
  }

  return { resize, render, clear };
}
