import { useRef, useEffect, useMemo } from 'react';

const N = 16;

function hashSeed(str) {
  const s = String(str);
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGrid(seed) {
  const rng = mulberry32(hashSeed(seed));
  const rand = (a, b) => a + rng() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));

  const hue = Math.floor(rand(0, 360));
  const sat = Math.floor(rand(55, 80));
  const C = {
    body: `hsl(${hue}, ${sat}%, 58%)`,
    bodyDark: `hsl(${hue}, ${sat}%, 44%)`,
    belly: `hsl(${hue}, ${Math.max(20, sat - 20)}%, 85%)`,
    outline: `hsl(${hue}, 45%, 16%)`,
    eyeWhite: '#ffffff',
    pupil: `hsl(${hue}, 45%, 14%)`,
  };

  const grid = Array.from({ length: N }, () => Array(N).fill(null));
  const set = (x, y, c) => { if (x >= 0 && x < N && y >= 0 && y < N) grid[y][x] = c; };
  const cx = 7.5;

  const type = rng();
  let rx, ry, cy;
  if (type < 0.34) { rx = rand(5.2, 6.2); ry = rand(5.5, 6.5); cy = 8.5; }
  else if (type < 0.67) { rx = rand(4.2, 5.0); ry = rand(6.0, 7.0); cy = 8.0; }
  else { rx = rand(6.0, 6.8); ry = rand(4.2, 5.2); cy = 9.0; }

  for (let y = 0; y < N; y++) {
    const dy = (y - cy) / ry;
    if (dy > 1 || dy < -1) continue;
    const hw = rx * Math.sqrt(1 - dy * dy) + rand(-0.3, 0.3);
    for (let x = 0; x < N; x++) if (Math.abs(x - cx) <= hw) set(x, y, C.body);
  }

  const filled = (x, y) => x >= 0 && x < N && y >= 0 && y < N && grid[y][x] !== null;
  const hasRow = (y) => { for (let x = 0; x < N; x++) if (grid[y][x]) return true; return false; };
  const minY = (() => { for (let y = 0; y < N; y++) if (hasRow(y)) return y; return 0; })();
  const maxY = (() => { for (let y = N - 1; y >= 0; y--) if (hasRow(y)) return y; return N - 1; })();

  const top = rng();
  if (top < 0.4) {
    const ex = randInt(2, 4);
    const h = randInt(2, 4);
    for (let i = 0; i < h; i++) {
      const yy = minY - 1 - i;
      const off = Math.floor(i / 2);
      set(Math.round(cx - ex) - off, yy, C.body);
      set(Math.round(cx + ex) + off, yy, C.body);
    }
  } else if (top < 0.7) {
    const ex = randInt(2, 3);
    const h = randInt(2, 3);
    for (let i = 0; i < h; i++) {
      const yy = minY - 1 - i;
      set(Math.round(cx - ex), yy, C.bodyDark);
      set(Math.round(cx + ex), yy, C.bodyDark);
    }
  }

  if (maxY + 1 < N) {
    const footX = randInt(2, 3);
    set(Math.round(cx - footX), maxY + 1, C.bodyDark);
    set(Math.round(cx + footX), maxY + 1, C.bodyDark);
  }

  const bcy = (maxY + minY) / 2 + 1.5;
  const brx = rx * 0.5, bry = ry * 0.45;
  for (let y = 0; y < N; y++) {
    const dy = (y - bcy) / bry;
    if (dy > 1 || dy < -1) continue;
    const hw = brx * Math.sqrt(1 - dy * dy);
    for (let x = 0; x < N; x++) if (Math.abs(x - cx) <= hw && grid[y][x] === C.body) grid[y][x] = C.belly;
  }

  const spots = randInt(0, 3);
  for (let s = 0; s < spots; s++) {
    const sy = randInt(minY + 1, maxY - 1);
    const sx = randInt(2, N - 3);
    if (grid[sy][sx] === C.body || grid[sy][sx] === C.belly) {
      set(sx, sy, C.bodyDark);
      set(sx + 1, sy, C.bodyDark);
    }
  }

  const out = grid.map(r => r.slice());
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (grid[y][x] !== null) {
        let border = false;
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          if (!filled(x + dx, y + dy)) { border = true; break; }
        }
        if (border) out[y][x] = C.outline;
      }
    }
  }

  const eyeY = Math.max(minY + 1, Math.round((minY + maxY) / 2) - 1);
  const eyeGap = randInt(2, 3);
  const eyeSize = rng() < 0.5 ? 1 : 2;
  for (const side of [-1, 1]) {
    const exC = Math.round(cx + side * eyeGap);
    for (let yy = eyeY; yy <= eyeY + 1; yy++) {
      if (!out[yy]) continue;
      for (let xx = exC - eyeSize; xx <= exC + eyeSize; xx++) {
        if (out[yy][xx] !== null && out[yy][xx] !== C.outline) out[yy][xx] = C.eyeWhite;
      }
    }
    const pY = eyeY + 1;
    if (out[pY] && out[pY][exC] !== null) out[pY][exC] = C.pupil;
  }

  const mouthY = Math.round((maxY + minY) / 2 + 2);
  if (mouthY < N && mouthY > eyeY && out[mouthY]) {
    const mw = randInt(1, 2);
    for (let xx = Math.round(cx - mw); xx <= Math.round(cx + mw); xx++) {
      if (out[mouthY][xx] !== null && out[mouthY][xx] !== C.outline) out[mouthY][xx] = C.outline;
    }
  }

  return out;
}

export default function Avatar({ seed, size = 64, className = '' }) {
  const ref = useRef(null);
  const grid = useMemo(() => (seed ? buildGrid(seed) : null), [seed]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, N, N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const c = grid[y][x];
        if (c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
      }
    }
  }, [grid]);

  if (!seed || !grid) return null;
  return (
    <canvas
      ref={ref}
      width={N}
      height={N}
      className={`pixel-avatar ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
