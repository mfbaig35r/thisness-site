// Scattered marks at the edges that settle into lines toward the middle: observations becoming
// entities. Deterministic, with rounded coordinates, so server and client render the same SVG.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function PixelField({ side, rows = 46, width = 360, seed = 7 }: { side: "left" | "right"; rows?: number; width?: number; seed?: number }) {
  const rand = rng(seed);
  const rects: { x: number; y: number; w: number; o: number }[] = [];
  const rowH = 8;
  for (let r = 0; r < rows; r++) {
    let x = 0;
    while (x < width) {
      const t = x / width; // 0 at the outer edge, 1 toward the page's middle
      const solid = t > 0.62 && rand() < 0.55 + 0.4 * t;
      const w = solid ? Math.round(18 + rand() * 60) : Math.round(2 + rand() * 9);
      const gap = solid ? Math.round(2 + rand() * 4) : Math.round(4 + rand() * (26 - 18 * t));
      if (rand() < 0.35 + 0.6 * t) rects.push({ x, y: r * rowH, w: Math.min(w, width - x), o: Math.round((0.25 + 0.75 * t) * 100) / 100 });
      x += w + gap;
    }
  }
  return (
    <svg className={`pixel-field ${side}`} width={width} height={rows * rowH} viewBox={`0 0 ${width} ${rows * rowH}`} aria-hidden="true">
      <g transform={side === "right" ? `translate(${width} 0) scale(-1 1)` : undefined}>
        {rects.map((p, i) => <rect key={i} x={p.x} y={p.y} width={p.w} height={4} opacity={p.o} />)}
      </g>
    </svg>
  );
}
