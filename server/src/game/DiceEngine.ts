/** PRNG deterministico (mulberry32): stesso seed -> stessa sequenza. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class DiceEngine {
  private rng: () => number;

  constructor(seed: number) {
    this.rng = createRng(seed);
  }

  roll(): [number, number] {
    const d1 = 1 + Math.floor(this.rng() * 6);
    const d2 = 1 + Math.floor(this.rng() * 6);
    return [d1, d2];
  }
}
