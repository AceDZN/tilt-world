// Replay quests are verified by playing them through the sim: one ticket wins, and the two naive
// strategies ("always take the June ticket", "run east forever") lose.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeQuest, verifiedQuest, verifyQuest } from '../src/game/quests';

test('replay: every generated quest the game serves is solvable and beats both naive strategies', () => {
  for (let seed = 1; seed <= 40; seed += 3) {
    const { level, verdict } = verifiedQuest(seed);
    assert.ok(verdict.solvable, `seed ${seed}`);
    assert.ok(verdict.juneFails, `seed ${seed}: June ticket must fail`);
    assert.ok(verdict.eastFails, `seed ${seed}: running east must fail`);
    assert.equal(level.tickets?.count, 1);
  }
});

test('replay: quests differ by seed and the answer slot moves around', () => {
  const answers = new Set<number>();
  const labels = new Set<string>();
  for (let seed = 1; seed <= 30; seed++) {
    const q = makeQuest(seed);
    labels.add(q.shots[0].label);
    const v = verifyQuest(q);
    if (v.solvable) answers.add(v.answer);
  }
  assert.ok(labels.size >= 6, `only ${labels.size} distinct quests`);
  assert.ok(answers.size >= 3, `answer slots ${[...answers]}`);
});
