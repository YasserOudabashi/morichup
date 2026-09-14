import { test } from "node:test";
import assert from "node:assert/strict";
import { CardEngine } from "../CardEngine";

test("stesso seed -> stesso ordine di mescolamento", () => {
  const a = new CardEngine(99);
  const b = new CardEngine(99);
  for (let i = 0; i < 8; i++) {
    assert.deepEqual(a.draw("fortune"), b.draw("fortune"));
  }
});

test("le carte normali tornano in fondo al mazzo e si ripescano nei cicli successivi", () => {
  const engine = new CardEngine(1);
  const counts = new Map<string, number>();
  // Pesca molte più carte delle 8 del mazzo Fortune: ogni carta normale deve
  // ricomparire più volte (prova che viene rimessa in fondo, non scartata).
  for (let i = 0; i < 40; i++) {
    const card = engine.draw("fortune");
    counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
  }
  for (const [id, count] of counts) {
    if (id !== "fortune-jail-free") {
      assert.ok(count > 1, `la carta ${id} dovrebbe ricomparire più volte, vista ${count}`);
    }
  }
});

test("una carta 'get out of jail free' resta fuori dal mazzo finché non viene restituita", () => {
  const engine = new CardEngine(1);
  const drawn: string[] = [];
  let jailCard: ReturnType<CardEngine["draw"]> | undefined;
  for (let i = 0; i < 8; i++) {
    const card = engine.draw("fortune");
    drawn.push(card.id);
    if (card.effect.kind === "getOutOfJailFree") jailCard = card;
  }
  assert.ok(jailCard, "il mazzo Fortune deve contenere una carta get out of jail free");
  // Non deve ricomparire in un secondo giro completo del mazzo (7 carte restanti).
  const secondRound = Array.from({ length: 7 }, () => engine.draw("fortune").id);
  assert.ok(!secondRound.includes(jailCard!.id));

  engine.returnCard("fortune", jailCard!);
  // Ora deve tornare a far parte del ciclo.
  const thirdRound = Array.from({ length: 8 }, () => engine.draw("fortune").id);
  assert.ok(thirdRound.includes(jailCard!.id));
});
