// Decorative QR-style code generated from a string (demo only)
export function QrCode({ value, size = 160 }: { value: string; size?: number }) {
  const n = 21;
  let h = 2166136261;
  const bits: boolean[] = [];
  for (let i = 0; i < n * n; i++) {
    h ^= value.charCodeAt(i % value.length) + i; h = Math.imul(h, 16777619) >>> 0;
    bits.push((h & 7) < 3);
  }
  const finder = (x: number, y: number) => {
    for (const [fx, fy] of [[0, 0], [n - 7, 0], [0, n - 7]] as [number, number][]) {
      const dx = x - fx, dy = y - fy;
      if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) {
        return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0;
      }
    }
    return -1;
  };
  const cell = size / (n + 2);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-md bg-foreground">
      {Array.from({ length: n * n }).map((_, i) => {
        const x = i % n, y = Math.floor(i / n); const f = finder(x, y);
        const on = f === -1 ? bits[i] : f === 1;
        return on ? <rect key={i} x={(x + 1) * cell} y={(y + 1) * cell} width={cell} height={cell} className="fill-background" /> : null;
      })}
    </svg>
  );
}
