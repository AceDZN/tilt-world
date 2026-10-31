# Tilt World — progress

Original prompt: build **Tilt World — עולם נטוי**, a real 3D web geography game for Hebrew-speaking grade 8 students (earth's motions, grade 8 ch. 2; sun as energy source, ch. 3), per `docs/handoff/BUILD_HANDOFF.md` (18 levels) and `docs/handoff/COMMON.md`. Gameplay mockups before scene code, Tripo models (rigged where they move), visual review against the mockups, tests, public repo AceDZN/tilt-world.

## 2026-10-31

- Repo scaffolded (Vite + TS + Three.js, ports 5242/4242 strict). Handoff and curriculum snapshots copied into `docs/`.
- GAME_IDENTITY.md and docs/VISUAL_PROMPTS.md written.
- `gh repo create AceDZN/tilt-world --public --source=. --remote=origin --push` was refused by auto mode's permission check ("Create Public Surface"). Committing locally on `main` until the user creates the repo.

## 2026-10-31 (later)

- Mechanics rewritten to the moved handoff: no dials, scrubbing or moving bodies. Time only moves forward, by the sleep pod (hours, or days in World 4) and one-way calendar-train tickets. Rails with magnetic boots replace the glider.
- 18 levels rebuilt, each with a scripted solution and wrong strategies in `tests/levels.test.ts`. QA helper fixes merged; CURRICULUM.md links every module.
- Playable 3D client: planet shader, Tripo models (Tzila rigged), HUD, sleep pod and train panels, PiP orbit inset, Polaroid win card.
- Replay: solver-verified random photo quests (menu 🎲). "Always June" and "run east forever" both fail.
- Visual review: `npm run shots` captures real frames into `docs/visual-review/`. Fixes from it: Sun against the true limb, landmarks stepping aside, bear only after sunset, buried mountain plinth, menu badges, closer framing under panels, Zzz for a dead battery and sleeping cities.
- README, LEVELS.md and docs/VISUAL_REVIEW.md written.
- Independent playtest (PLAYTEST.md): every P1 and P2 fixed. Changes: the clock freezes in dialogs, the eclipse text knows when the eclipse comes, waypoint chips for places and the Moon's shadow, L1 key teaching, RTL numbers, Hebrew counts, sorted ticket cards, the camera looks up at a high Moon, a better sleep picker, phone layout, and the L16 tide gauge.
- Open (from PLAYTEST P3): 15-minute sleep steps or a faster idle clock, fireworks in L5, clock/inset date agreement at midnight, a finale closing card, moon azimuth and local date in `render_game_to_text`, bigger ticket diagrams, more quest kinds.
