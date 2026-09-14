import { test } from "node:test";
import assert from "node:assert/strict";
import { DiceEngine } from "../DiceEngine";

test("stesso seed produce la stessa sequenza di tiri", () => {
  const a = new DiceEngine(42);
  const b = new DiceEngine(42);
  for (let i = 0; i < 20; i++) {
    assert.deepEqual(a.roll(), b.roll());
  }
});

test("seed diversi producono sequenze diverse", () => {
  const a = new DiceEngine(1);
  const b = new DiceEngine(2);
  const rollsA = Array.from({ length: 10 }, () => a.roll());
  const rollsB = Array.from({ length: 10 }, () => b.roll());
  assert.notDeepEqual(rollsA, rollsB);
});

test("ogni dado è sempre tra 1 e 6", () => {
  const dice = new DiceEngine(7);
  for (let i = 0; i < 500; i++) {
    const [d1, d2] = dice.roll();
    assert.ok(d1 >= 1 && d1 <= 6, `d1=${d1} fuori range`);
    assert.ok(d2 >= 1 && d2 <= 6, `d2=${d2} fuori range`);
  }
});
