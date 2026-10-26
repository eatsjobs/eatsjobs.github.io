// WGSL for js/hero-smoke.js. Every pass draws one fullscreen triangle into a
// grid texture and reads its inputs from t0/t1. The maths follows Jos Stam's
// "Stable Fluids" as adapted in Pavel Dobryakov's WebGL fluid simulation.
//
// Grid coordinates have y pointing down, like the page. "Up" on screen is
// therefore negative y, which is why buoyancy subtracts.
//
// The Uniforms layout must match UNIFORM_OFFSETS in js/hero-smoke.js.
export const SMOKE_SHADER = /* wgsl */ `
struct Uniforms {
  texel: vec2f,
  velocityTexel: vec2f,
  splatFrom: vec2f,
  splatTo: vec2f,
  dt: f32,
  dissipation: f32,
  aspect: f32,
  splatRadius: f32,
  swirl: f32,
  rise: f32,
  aging: f32,
  scale: f32,
  splatValue: vec4f,
  agedColor: vec4f,
};

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var linearSampler: sampler;
@group(0) @binding(2) var t0: texture_2d<f32>;
@group(0) @binding(3) var t1: texture_2d<f32>;

@vertex
fn fullscreen(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  var corners = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(corners[index], 0.0, 1.0);
}

fn read0(uv: vec2f) -> vec4f {
  return textureSampleLevel(t0, linearSampler, uv, 0.0);
}

fn read1(uv: vec2f) -> vec4f {
  return textureSampleLevel(t1, linearSampler, uv, 0.0);
}

// Adds splatValue along the segment the mouse covered since the last frame,
// so a fast flick leaves a continuous trail rather than separate puffs.
@fragment
fn splat(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let uv = position.xy * u.texel;
  var toPixel = uv - u.splatFrom;
  var path = u.splatTo - u.splatFrom;
  toPixel.x *= u.aspect;
  path.x *= u.aspect;
  let along = clamp(dot(toPixel, path) / max(dot(path, path), 1e-8), 0.0, 1.0);
  let offset = toPixel - path * along;
  return read0(uv) + u.splatValue * exp(-dot(offset, offset) / u.splatRadius);
}

@fragment
fn curl(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let uv = position.xy * u.texel;
  let dx = vec2f(u.texel.x, 0.0);
  let dy = vec2f(0.0, u.texel.y);
  let value = (read0(uv + dx).y - read0(uv - dx).y) - (read0(uv + dy).x - read0(uv - dy).x);
  return vec4f(0.5 * value, 0.0, 0.0, 1.0);
}

// Vorticity confinement: feeds back the small eddies the coarse grid would
// otherwise smooth away. This is what makes it curl like smoke.
@fragment
fn vorticity(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let uv = position.xy * u.texel;
  let dx = vec2f(u.texel.x, 0.0);
  let dy = vec2f(0.0, u.texel.y);
  let left = read1(uv - dx).x;
  let right = read1(uv + dx).x;
  let below = read1(uv + dy).x;
  let above = read1(uv - dy).x;
  var force = 0.5 * vec2f(abs(below) - abs(above), abs(right) - abs(left));
  force = force / (length(force) + 1e-4) * u.swirl * read1(uv).x;
  force.y = -force.y;
  let velocity = read0(uv).xy + force * u.dt;
  return vec4f(clamp(velocity, vec2f(-1000.0), vec2f(1000.0)), 0.0, 1.0);
}

// Thicker smoke drifts upward.
@fragment
fn buoyancy(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let uv = position.xy * u.texel;
  let velocity = read0(uv).xy;
  return vec4f(velocity.x, velocity.y - u.rise * read1(uv).a * u.dt, 0.0, 1.0);
}

@fragment
fn divergence(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let uv = position.xy * u.texel;
  let dx = vec2f(u.texel.x, 0.0);
  let dy = vec2f(0.0, u.texel.y);
  let value = 0.5 * (read0(uv + dx).x - read0(uv - dx).x + read0(uv + dy).y - read0(uv - dy).y);
  return vec4f(value, 0.0, 0.0, 1.0);
}

@fragment
fn scale(@builtin(position) position: vec4f) -> @location(0) vec4f {
  return read0(position.xy * u.texel) * u.scale;
}

// One Jacobi iteration towards the pressure that cancels the divergence.
@fragment
fn pressure(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let uv = position.xy * u.texel;
  let dx = vec2f(u.texel.x, 0.0);
  let dy = vec2f(0.0, u.texel.y);
  let neighbours = read0(uv - dx).x + read0(uv + dx).x + read0(uv + dy).x + read0(uv - dy).x;
  return vec4f((neighbours - read1(uv).x) * 0.25, 0.0, 0.0, 1.0);
}

@fragment
fn subtractGradient(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let uv = position.xy * u.texel;
  let dx = vec2f(u.texel.x, 0.0);
  let dy = vec2f(0.0, u.texel.y);
  let gradient = vec2f(read0(uv + dx).x - read0(uv - dx).x, read0(uv + dy).x - read0(uv - dy).x);
  return vec4f(read1(uv).xy - gradient, 0.0, 1.0);
}

// Moves t1 along the velocity in t0 and fades it. For the dye, the colour
// also drifts from the accent toward agedColor as it travels.
@fragment
fn advect(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let uv = position.xy * u.texel;
  let origin = uv - u.dt * read0(uv).xy * u.velocityTexel;
  let carried = read1(origin) / (1.0 + u.dissipation * u.dt);
  let aging = clamp(u.aging * u.dt, 0.0, 1.0);
  return vec4f(mix(carried.rgb, u.agedColor.rgb * carried.a, aging), carried.a);
}

fn noise(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453);
}

// The dye stores colour premultiplied by density in rgb and density in a.
// Opacity eases out with density and is capped by scale, so even thick smoke
// leaves the hero copy readable. The noise dithers away banding.
@fragment
fn display(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let dye = read0(position.xy * u.texel);
  let density = max(dye.a, 0.0);
  let alpha = (1.0 - exp(-density * 1.5)) * u.scale;
  let color = clamp(dye.rgb / max(density, 1e-4), vec3f(0.0), vec3f(1.0));
  let dither = (noise(position.xy) - 0.5) / 255.0;
  return vec4f((color + dither) * alpha, alpha);
}
`;
