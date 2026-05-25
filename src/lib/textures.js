import * as THREE from 'three';

/**
 * Procedural texture generators for RoomForge 3D visualizer.
 * Creates CanvasTextures locally to avoid network delays, CORS, or missing asset errors.
 */

// Simple seeded random to keep procedural textures consistent across renders
function createRandom(seed) {
  let h = 1779033703 ^ seed;
  return function() {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Generates a herringbone wood parquet texture (color map & roughness map).
 * @param {string} baseColorHex - Base color of the wood
 * @param {number} seed - Random seed
 * @returns {{ map: THREE.CanvasTexture, roughnessMap: THREE.CanvasTexture }}
 */
export function generateHerringboneWood(baseColorHex = '#d8b589', seed = 42) {
  if (typeof document === 'undefined') {
    return { map: null, roughnessMap: null };
  }

  const canvasSize = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');

  const rCanvas = document.createElement('canvas');
  rCanvas.width = canvasSize;
  rCanvas.height = canvasSize;
  const rCtx = rCanvas.getContext('2d');

  const rand = createRandom(seed);

  // Convert hex to RGB for fine shading
  const baseColor = new THREE.Color(baseColorHex);
  const r = Math.floor(baseColor.r * 255);
  const g = Math.floor(baseColor.g * 255);
  const b = Math.floor(baseColor.b * 255);

  // Fill background
  ctx.fillStyle = `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  rCtx.fillStyle = '#f0f0f0'; // Highly rough seams (matte)
  rCtx.fillRect(0, 0, canvasSize, canvasSize);

  // Plank parameters
  const plankWidth = 48;
  const plankLength = plankWidth * 4;

  ctx.lineWidth = 1;
  rCtx.lineWidth = 1;

  ctx.save();
  rCtx.save();
  
  // Rotate by 45 degrees
  ctx.translate(canvasSize / 2, canvasSize / 2);
  ctx.rotate(Math.PI / 4);
  rCtx.translate(canvasSize / 2, canvasSize / 2);
  rCtx.rotate(Math.PI / 4);

  const startX = -canvasSize * 1.5;
  const endX = canvasSize * 1.5;
  const startY = -canvasSize * 1.5;
  const endY = canvasSize * 1.5;

  const w = plankWidth;
  const l = plankLength;

  // Draw herringbone columns
  for (let x = startX; x < endX; x += w) {
    const isOdd = Math.abs(Math.floor(x / w)) % 2 === 1;
    for (let y = startY; y < endY; y += l) {
      const yOffset = isOdd ? l / 2 : 0;
      const py = y + yOffset;

      // Draw a plank
      ctx.save();
      rCtx.save();
      ctx.translate(x + w / 2, py + l / 2);
      rCtx.translate(x + w / 2, py + l / 2);

      // Rotate interlocking side by 90 degrees if odd column
      if (isOdd) {
        ctx.rotate(Math.PI / 2);
        rCtx.rotate(Math.PI / 2);
      }

      // Plank color variation
      const tint = rand() * 0.15 - 0.075;
      const pr = Math.min(255, Math.max(0, Math.floor(r * (1 + tint))));
      const pg = Math.min(255, Math.max(0, Math.floor(g * (1 + tint * 0.8))));
      const pb = Math.min(255, Math.max(0, Math.floor(b * (1 + tint * 0.6))));

      // Draw plank body
      ctx.fillStyle = `rgb(${pr}, ${pg}, ${pb})`;
      ctx.fillRect(-w / 2 + 1, -l / 2 + 1, w - 2, l - 2);

      // Draw subtle wood grain inside plank
      ctx.strokeStyle = `rgba(${Math.max(0, pr - 25)}, ${Math.max(0, pg - 25)}, ${Math.max(0, pb - 25)}, 0.22)`;
      ctx.lineWidth = 1;
      const grainCount = 6 + Math.floor(rand() * 6);
      for (let gIdx = 0; gIdx < grainCount; gIdx++) {
        const gx = -w / 2 + rand() * w;
        ctx.beginPath();
        ctx.moveTo(gx, -l / 2 + 2);
        ctx.bezierCurveTo(
          gx + (rand() * 6 - 3), -l / 4,
          gx + (rand() * 6 - 3), l / 4,
          gx + (rand() * 4 - 2), l / 2 - 2
        );
        ctx.stroke();
      }

      // Draw plank outline (seams)
      ctx.strokeStyle = `rgba(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)}, 0.45)`;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-w / 2 + 0.6, -l / 2 + 0.6, w - 1.2, l - 1.2);

      // Roughness Map: Planks are semi-shiny (roughness 0.35 - 0.45), seams are matte (0.85)
      const plankRoughness = Math.floor((0.32 + rand() * 0.1) * 255);
      rCtx.fillStyle = `rgb(${plankRoughness}, ${plankRoughness}, ${plankRoughness})`;
      rCtx.fillRect(-w / 2 + 1, -l / 2 + 1, w - 2, l - 2);

      // Seam in roughness
      rCtx.strokeStyle = '#cccccc';
      rCtx.lineWidth = 1.2;
      rCtx.strokeRect(-w / 2 + 0.6, -l / 2 + 0.6, w - 1.2, l - 1.2);

      ctx.restore();
      rCtx.restore();
    }
  }

  ctx.restore();
  rCtx.restore();

  // Create THREE textures
  const mapTexture = new THREE.CanvasTexture(canvas);
  mapTexture.wrapS = THREE.RepeatWrapping;
  mapTexture.wrapT = THREE.RepeatWrapping;
  mapTexture.repeat.set(1.4, 1.4);

  const roughnessTexture = new THREE.CanvasTexture(rCanvas);
  roughnessTexture.wrapS = THREE.RepeatWrapping;
  roughnessTexture.wrapT = THREE.RepeatWrapping;
  roughnessTexture.repeat.set(1.4, 1.4);

  return { map: mapTexture, roughnessMap: roughnessTexture };
}

/**
 * Generates a fine grain plaster bump texture for walls.
 * @returns {THREE.CanvasTexture}
 */
export function generatePlasterBump() {
  if (typeof document === 'undefined') {
    return null;
  }

  const canvasSize = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');

  // Fill with medium gray (neutral bump)
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Draw fine granular plaster texture
  const imgData = ctx.getImageData(0, 0, canvasSize, canvasSize);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const val = 128 + (Math.random() * 20 - 10);
    data[i] = val;     // R
    data[i + 1] = val; // G
    data[i + 2] = val; // B
  }

  ctx.putImageData(imgData, 0, 0);

  // Soft blur slightly to avoid sharp noise
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  ctx.globalAlpha = 1.0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/**
 * Generates a boucle/linen fabric bump texture for furniture.
 * @returns {THREE.CanvasTexture}
 */
export function generateFabricBump() {
  if (typeof document === 'undefined') {
    return null;
  }

  const canvasSize = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');

  // Neutral bump fill
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Draw interlocking weave lines
  ctx.strokeStyle = '#909090';
  ctx.lineWidth = 1.8;
  for (let x = 0; x < canvasSize; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasSize);
    ctx.stroke();
  }

  ctx.strokeStyle = '#707070';
  ctx.lineWidth = 1.8;
  for (let y = 0; y < canvasSize; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasSize, y);
    ctx.stroke();
  }

  // Add random organic slubs for boucle feel
  ctx.fillStyle = '#a0a0a0';
  for (let i = 0; i < 180; i++) {
    const cx = Math.random() * canvasSize;
    const cy = Math.random() * canvasSize;
    const cr = 1.5 + Math.random() * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  return texture;
}

/**
 * Generates a polished white marble texture with grey veins.
 * @param {string} baseColorHex
 * @returns {THREE.CanvasTexture}
 */
export function generateMarble(baseColorHex = '#f8f8f9') {
  if (typeof document === 'undefined') {
    return null;
  }

  const canvasSize = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');

  // Base white marble color
  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Draw elegant veins
  const rand = createRandom(101);

  ctx.strokeStyle = 'rgba(120, 120, 128, 0.18)';
  ctx.lineWidth = 2.4;

  const drawVein = (sx, sy, segments = 6) => {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    let cx = sx;
    let cy = sy;
    for (let s = 0; s < segments; s++) {
      const nxtX = cx + (rand() * 180 - 70);
      const nxtY = cy + (rand() * 240 + 80);
      ctx.bezierCurveTo(
        cx + (rand() * 60 - 30), cy + 40,
        nxtX - (rand() * 60 - 30), nxtY - 40,
        nxtX, nxtY
      );
      cx = nxtX;
      cy = nxtY;
    }
    ctx.stroke();

    // Subtle side branches
    if (segments > 3 && rand() > 0.4) {
      ctx.save();
      ctx.strokeStyle = 'rgba(120, 120, 128, 0.08)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx - 100, cy - 200);
      ctx.bezierCurveTo(cx - 50, cy - 100, cx + 50, cy - 50, cx + 120, cy);
      ctx.stroke();
      ctx.restore();
    }
  };

  // Draw several veins across the texture
  drawVein(100, -100, 7);
  drawVein(500, -100, 6);
  drawVein(-200, 100, 8);
  drawVein(800, 200, 5);

  // Extra fine detailed veins
  ctx.strokeStyle = 'rgba(80, 80, 88, 0.07)';
  ctx.lineWidth = 0.9;
  drawVein(250, -50, 4);
  drawVein(650, 400, 5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
