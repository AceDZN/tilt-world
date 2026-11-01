# Tilt World — עולם נטוי

A 3D web game for Hebrew-speaking grade 8 geography (Earth's motions, ch. 2; the Sun as an energy source and climate zones, ch. 3). You play **Tzila (צילה)**, a small solar-powered photo robot on a tiny planet. The planet never moves for you, and neither do the Sun or the Moon. You can only run, ride the latitude rails in magnetic boots, sleep in a pod for a chosen time, and buy one-way calendar-train tickets. Every photo order is a geography problem: be at the right place when the sky is right.

- 18 levels in 4 worlds (`LEVELS.md` has each level's geography and its verified solution).
- 🎲 random photo quests, each one solver-verified before it is served.
- Hebrew RTL UI with the bundled Rubik font. North is always up and east to the right. No political borders.
- Fully offline static build; Vercel-ready.

Read next: `GAME_IDENTITY.md` (what makes it this game and not another), `CURRICULUM.md` (Workbook modules and links), `ASSETS.md` (models, textures, licenses), `docs/VISUAL_REVIEW.md` (real frames vs. mockups), `PLAYTEST.md` (independent playtest), `progress.md` (log).

## Run

```bash
npm install
```

```bash
npm run dev
```

The dev server runs at http://localhost:5242 (strict port). Other scripts:

```bash
npm test
```

Runs the unit and solver tests (sim, astronomy, curriculum, all 18 levels and the replay quests).

```bash
npm run build
```

Type-checks and builds to `dist/` with base `./`, so `dist/` works from any folder or sub-path.

```bash
npm run preview
```

Serves the build at http://localhost:4242.

```bash
npm run shots
```

Recaptures the review frames into `scratch/visual-review/` (local only, git-ignored; needs the dev server).

```bash
npm run smoke
```

Browser smoke test (needs the dev server). It opens every level and a random quest in headless Chromium, checks that the sleep and train panels freeze the clock, plays three levels to the win card with the test bot, and fails on any console error. Frames go to the git-ignored `scratch/smoke/`.

URL options: `?level=N` opens level N directly (even when locked); `?all` unlocks every level.

## Workbook embed

The game ships in the workbook geography games app (catalog entry: `workbook/LEVELS.md`).

- **Bridge:** `src/host.ts` posts `ready`, `level-start` and `level-complete` to a `*.workbook.co.il` parent; it posts nothing when the game runs on its own.
- **Embed test:** run `npm run build`, then `npm run test:embed`.
- **Poster:** `npm run poster` writes `workbook/poster.jpg`, which is git-ignored.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Run forward/back | `W`/`S` or `↑`/`↓` | left stick |
| Turn | `A`/`D` or `←`/`→` | left stick |
| Jump (onto/off a rail) | `Space` | jump button |
| Shoot | `E` | shutter button |
| Sleep pod (pick hours, or days plus hours; cannot be cancelled; the world waits while you choose) | `Z`, then `+`/`−` and `Enter` | chip |
| Calendar train (at a station; the world waits while you choose) | `C`, then `1`–`9` | chip |
| Plant the tripod (L2) | `P` | chip |
| Sun sight (L13) | `Q` | chip |
| Declare "impossible" (L15) | `X` | chip |
| Gear 1/2/3 (L13) | `1` `2` `3` | buttons |
| Hint | `H` | chip |
| Space view / chase view | `V` | chip |
| Lat/long grid | `G` | — |
| Restart | `R` | button |
| Pause / mute / fullscreen | `Esc` / `M` / `F` | top-left buttons |

The Hebrew-layout letters on the same keys also work (ש/ד/ג/', ק, ז, ב…). The game pauses when the tab is hidden. Reduced motion and mute are on the menu and are remembered.

## Implemented

- **Simulation** (`src/game/`, `src/astro/`): pure TS, unit-tested.
  - A single forward-only clock; Sun and Moon positions, a piecewise calendar through the solstices and equinoxes, and the Moon's 5° tilted orbit with nodes.
  - Solar and lunar eclipses, tides (spring/neap), and climate zones and monthly temperatures.
  - Battery, sleep pod, one-way tickets, rails, hazards (the polar bear, waves on the tidal flat), and photo checks with a one-line explanation for every hit and miss.
- **All 18 levels**, each with a scripted solution, its wrong strategies in `tests/levels.test.ts`, and curriculum checks in `tests/curriculum.test.ts`.
- **3D client** (`src/scene/`):
  - Three.js, one WebGL canvas. The planet shader has day/night, city lights past the terminator, clouds and atmosphere, an eclipse shadow, hint overlays (terminator, meridian, latitude) and a grid.
  - Sun and Moon are drawn against the limb the camera actually sees.
  - Tripo-generated models; Tzila is rigged and animated (idle, run, jump, cheer, sulk, fall).
  - The PiP orbit inset shows the Earth's axis and the Moon's ring.
- **HUD** (`src/ui/`):
  - Compass with N and `מזרח →`, battery, local clock and date, film counter, photo-order card, sleep and train panels.
  - Win Polaroid captured from the real frame, a fail card with the rule and an icon for the cause, and a closing card after the finale.
  - Sleep pod in 15-minute steps below 2 hours; fireworks over Fiji and Samoa at 20:00 local in L5.
  - Waypoint chips (direction and distance) to every target place and to the Moon's shadow during an eclipse; a tide gauge in L16.
  - Numbers sit in `<bdi>`; feedback never relies on color alone (icons and words too).
- **Replay:** solver-verified random photo quests (`src/game/quests.ts`, `tests/quests.test.ts`). "Always take the June ticket" and "run east forever" both fail.
- **Test hooks:** `window.render_game_to_text()` returns the state as JSON; `window.advanceTime(ms)` steps the game deterministically.
- **Procedural WebAudio:** shutter, grind, snore, wake and more; no audio files.

## Planned / not done

- More replay quest kinds (polar night, equinox pairs, tides).
- A richer world map and props closer to the painterly mockups.
- Teacher view and progress export.

## Deploy to Vercel (not deployed)

The app is a static Vite build; nothing server-side.

1. Import the GitHub repo `AceDZN/tilt-world` in Vercel, or run `vercel` from this folder.
2. Framework preset **Vite**, build command `npm run build`, output directory `dist`.
3. No environment variables are needed.

Because `base` is `./`, the same `dist/` also works on any static host or from a USB stick (open it through any local static server, since browsers block module scripts on `file://`).

## Credits

3D models were generated with Tripo for this project (`ASSETS.md`); Earth textures are NASA Blue Marble, Black Marble 2012 and the Blue Marble cloud layer (NASA imagery, no copyright; sources in `ASSETS.md`). Font: Rubik (OFL), via `@fontsource/rubik`.
