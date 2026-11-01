import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLevelParam } from '../src/host';
import { LEVELS } from '../src/game/levels';

test('parseLevelParam: ?level=N is a 0-based index into the authored levels', () => {
  const n = LEVELS.length;
  assert.equal(parseLevelParam('?level=1', n), 0);
  assert.equal(parseLevelParam('?level=18', n), 17);
  assert.equal(parseLevelParam('?all&level=7', n), 6);
});

test('parseLevelParam: missing, malformed or out-of-range values open the menu', () => {
  const n = LEVELS.length;
  for (const q of ['', '?level=', '?level=0', '?level=19', '?level=-2', '?level=3.5', '?level=abc', '?lvl=3']) assert.equal(parseLevelParam(q, n), null, q);
});
