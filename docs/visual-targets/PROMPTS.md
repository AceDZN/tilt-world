# Visual targets — prompts and provenance

These are **gameplay design targets generated before any scene code**, not captures of the implemented game. Copy the camera, silhouettes, scene occupancy, lighting mood and HUD hierarchy; do not copy the generated text, numbers or astronomy, which are often wrong (see each checklist).

- **Route:** ChatGPT in the user's Chrome (Route A, claude-in-chrome extension, own tab), ChatGPT image generation, **one chat for all seven images** (01–05 first, then 06–07 from the revision section of `VISUAL_PROMPTS.md`). Composer model selector showed "Instant"; image generation ran inside it.
- **Chat URL:** https://chatgpt.com/c/6ae5df6f-d450-83ed-898d-a8a61e618f30
- **Date:** 2026-10-31
- **Output size:** 1672 × 941 PNG (ChatGPT's 16:9 output).
- **Prompt rule:** each prompt = the image's text from `docs/VISUAL_PROMPTS.md` with `[+ shared style line]` replaced by the shared style line, verbatim, one prompt per image, sent in order.
- **Downloaded via** the image viewer's download button, then moved from `~/Downloads` (original download filenames listed per image).

| File | Attempts | SHA-256 |
| --- | --- | --- |
| `01-first-sunrise.png` | 1 | `99fc9641b91ad7f36078d27dd278be439d428118b9bfc12d2888532716319b05` |
| `02-midnight-sun.png` | 1 | `5505b2336888671c8667a2bb6a9909e80a7dc0f262146cca89a27bfb0ea12122` |
| `03-wrong-offset.png` | 1 | `73e589a17813b67816ed06a3899353d219ee85654613b8014e8d8a0ecefb3cad` |
| `04-eclipse.png` | 1 | `259eceb1ce2f90a4c4f9df5e0f9e26b694aaabd971af9cc9ca7e859fac9e8edb` |
| `05-world-map.png` | 1 | `ae404b85f47f6f7706da85a242b8a362c851142bcc733ca69f9c59c9986abaa6` |
| `06-sleep-pod.png` | 1 | `fd053735e8d574dff77724353fde79a119d297150b60d87f56707049b6714334` |
| `07-calendar-train.png` | 1 | `b11be64ca4861cc677d56794745d4c04910f2253522eaa05699d45d6cd8e2849` |

> **Revision (2026-10-31): there are no orbit or Moon dials and no time scrubbing in the game.** The bottom-centre dial widgets in **02** and **04** (the orbit dial with month ring, `סיבובי חוגה` counter, and the `שלב הירח` / `מיקום במסלול` dials) are **OBSOLETE** — do not build them. Time moves forward only, via the sleep pod (06) and the calendar train (07). Everything else in 02/04 (scene, PiP inset, level pill, photo card, viewfinder, shutter) is still a valid target.

Shared style line (appended to every prompt):

> Polished premium 3D indie game look, like Super Mario Galaxy meets Outer Wilds and Solar Ash: a tiny jewel-box planet with real 3D depth, curved horizon, crisp lighting, rim light, soft bloom. NOT flat vector art, NOT a worksheet. Hebrew right-to-left game HUD with chunky rounded panels, Rubik-like font, readable at a glance. Exciting, something a 13-year-old would want to play.

---

## 01-first-sunrise.png

- Route: ChatGPT in user's Chrome. Chat URL above. Date 2026-10-31. Attempts: 1. Download name: `Robot’s First Sunrise Run.png`.

**Prompt (exact):**

> Generate an image, landscape 16:9: an in-game screenshot of a polished 3D browser game called "Tilt World" (Hebrew title עולם נטוי). Third-person chase camera slightly above and behind a small cute solar-powered photographer robot named Tzila: a rounded white-and-coral robot body, one huge camera lens for a face with a glowing iris, two folding solar-panel wings on her back, little antenna, stubby legs, a camera strap. She runs across the night side of a tiny planet Earth whose horizon curves sharply (the planet is small, like Mario Galaxy). Real continents visible on the surface, dark blue ocean with faint specular glints, warm yellow city lights dotting the night-side land, a lat/long grid faintly glowing. Ahead of her, on the right (east), a crisp glowing orange-pink dawn line, the terminator, sweeps across the planet's surface toward her; beyond it the day side is bright. Deep starfield with a small Moon. A speed trail behind the robot. Hebrew RTL HUD: top right a rounded panel with the level name 'שלב 1: הזריחה הראשונה' and three empty stars; top left round pause and mute buttons; a small round compass/mini-globe with N up and an arrow 'מזרח →' pointing right; a battery icon blinking low red; a world clock showing '04:40' with a sun icon; a single tutorial line in a speech bubble 'השחר מגיע ממזרח. רוצי לקראתו!'; bottom right a big round camera shutter button. Polished premium 3D indie game look, like Super Mario Galaxy meets Outer Wilds and Solar Ash: a tiny jewel-box planet with real 3D depth, curved horizon, crisp lighting, rim light, soft bloom. NOT flat vector art, NOT a worksheet. Hebrew right-to-left game HUD with chunky rounded panels, Rubik-like font, readable at a glance. Exciting, something a 13-year-old would want to play.

**What to copy:**
- Tzila's design: white rounded body with coral bands, single big lens face, orange-tipped antenna, two blue solar panels on short arms from the back, a small camera on a strap, a sun emblem on the back. This is the model target.
- Chase camera above/behind, horizon curving across the upper third, Moon top-centre, warm sunrise glow upper right, starfield + Milky Way.
- Night land with warm city-light clusters, faint lat/long grid lines, cloud wisps casting depth.
- HUD layout: level pill top right (name + 3 stars), pause/mute circles top left, mini-globe compass with N and `מזרח →` under them, battery pill, clock pill `04:40` with sun icon, speech bubble with Tzila's avatar, big round shutter button bottom right. Dark translucent navy panels with white outlines.
- Speed-trail streaks of sparks behind her feet.

**What's off:**
- **Scale:** the robot is gigantic relative to the planet and reads as flying in orbit over Europe, not running on the surface. In the game she stands on the ground; the planet should be "tiny" but she should be a few hundred km tall at most visually (keep the curve, not the satellite view).
- The Sun is already up on the horizon; the prompt wanted the terminator still approaching. In-game the dawn band should be a visible line sweeping the surface, with the Sun just below the horizon at 04:40.
- City lights continue onto the sunlit side at the right edge; in-game, city lights fade out past the terminator.
- Level pill renders as `שלב :1 הזריחה הראשונה` — the colon jumped to the wrong side of the number (bidi). Wrap the number in `<bdi>` / LTR span.
- The compass's "east" arrow is fine, but the orientation of the visible geography (Mediterranean/Arabia) doesn't match "east = right" exactly. The game's geography is authoritative.

## 02-midnight-sun.png

- Route: ChatGPT in user's Chrome. Chat URL above. Date 2026-10-31. Attempts: 1. Download name: `Midnight Sun Polar Adventure.png`.

**Prompt (exact):**

> Same game, same art style, landscape 16:9: an in-game screenshot from World 2. Tzila stands with her tripod on a snowy hill in Lapland beside a cozy red wooden cabin, far north on the tiny planet; it is midnight and the Sun hangs low but ABOVE the horizon, painting everything gold, long shadows; a curious polar bear peeks from behind a snowy rock. The planet's tilted axis is visible as a faint line through the north pole. Picture-in-picture in the top-left corner: a round inset view from space showing the Sun in the centre and the Earth on its orbit at the June position, the axis tilted 23.5° toward the Sun, the northern cap fully lit. Bottom centre: a chunky circular 'orbit dial' widget with month ticks and the label '21 ביוני' on it, two arrow buttons, and a small counter 'סיבובי חוגה: 2/3'. Top right: level name 'שלב 8: שמש חצות' and stars; world clock reading '00:00' with a sun-above-horizon icon; a photo order card 'צלמי: השמש מעל האופק בחצות'. A viewfinder frame overlay centred on the Sun with the camera shutter button glowing ready. Polished premium 3D indie game look, like Super Mario Galaxy meets Outer Wilds and Solar Ash: a tiny jewel-box planet with real 3D depth, curved horizon, crisp lighting, rim light, soft bloom. NOT flat vector art, NOT a worksheet. Hebrew right-to-left game HUD with chunky rounded panels, Rubik-like font, readable at a glance. Exciting, something a 13-year-old would want to play.

**What to copy:**
- Character consistency: same Tzila (white/coral, lens face, solar panels) — confirms the model target.
- Ground-level scene composition: robot + tripod left of centre, red snow-roofed log cabin far left (chimney smoke, glowing windows, a little sled), snowy pines, a white **cartoon polar bear cub** peeking from behind a snowy dark rock on the right. Golden low Sun with reflection on water, curved horizon beyond fjords/islands.
- HUD: oval PiP orbit inset top left; level pill + stars top right; clock pill `00:00` with sun icon below it; photo-order card with icon and a sample photo; viewfinder brackets around the Sun; glowing shutter button bottom right; ~~big circular orbit dial bottom centre with a mini Earth, month labels around it, an orange marker and a date tab `21 ביוני`, round arrow buttons left/right, counter pill.~~ **OBSOLETE — no dials (see revision note).**
- Warm gold vs. deep blue twilight palette.

**What's off:**
- (Obsolete widget, kept for the record.) **Orbit dial month ring is broken:** `מאי` and `יולי` appear twice, `יוני` is missing from the ring, and the `21 ביוני` tab sits between דצמבר and ינואר. The real dial must place 12 months correctly with June under the marker.
- **PiP inset astronomy is wrong:** at the June position the axis top leans **away** from the Sun; it must lean toward it. The orbit is drawn as an off-centre ellipse with an extra white dot; keep it simple (circle, Sun centre).
- The "axis" line rises from a mountain peak mid-planet, labelled `ציר כדור הארץ (23.5°)`, not through the north pole. The game draws the axis from model state.
- Bidi flips: `שלב :8 שמש חצות` and `2/3 :סיבובי חוגה` (colon on the wrong side). Use `<bdi>` around numbers/fractions.
- The Sun sits on the horizon rather than clearly above it; the midnight-sun shot should show a clear gap between Sun and horizon.
- The polar bear is a cub/plush toy; acceptable for tone, but the Tripo model can be a chunkier adult.

## 03-wrong-offset.png

- Route: ChatGPT in user's Chrome. Chat URL above. Date 2026-10-31. Attempts: 1. Download name: `Sleepy Robot Under Starlit Temple Skies.png`.

**Prompt (exact):**

> Same game, same art style, landscape 16:9: an in-game screenshot of a failure moment. On the night side of the tiny planet, in a small stylized Asian city with dark streets and only a few lit windows, Tzila has curled up on the ground with her lens dimmed, a little 'Z z z' snore bubble floating above her and a dead red battery icon; a small rescue drone with a blinking light is flying in. The dawn line is far away. A rounded Hebrew replay card on the right side shows a mini globe with the terminator, a meridian highlighted and text 'דאקה נמצאת 90° מזרחה ממך: השעה שם מאוחרת ב-6 שעות.' with two big buttons 'נסי שוב' and 'הסבר'. Polished premium 3D indie game look, like Super Mario Galaxy meets Outer Wilds and Solar Ash: a tiny jewel-box planet with real 3D depth, curved horizon, crisp lighting, rim light, soft bloom. NOT flat vector art, NOT a worksheet. Hebrew right-to-left game HUD with chunky rounded panels, Rubik-like font, readable at a glance. Exciting, something a 13-year-old would want to play.

**What to copy:**
- Failure tone: Tzila face-down/curled on a cobbled street with her lens showing sleepy closed "eyes", `zzz` thought bubble, dead red battery icon floating above her; funny, not harsh.
- Rescue drone design: white/coral quad-rotor with one big eye-lens and a searchlight cone, matching Tzila's palette. Good candidate for a simple procedural or Tripo prop later.
- Night city with warm windows, paper lantern, river with reflections, curved planet beyond, a sunrise glow far at the upper-right horizon.
- Replay card hierarchy (right side): title row with battery icon, mini globe with a dashed meridian, two pins with time chips (`את 06:00`, `דאקה 12:00`), a 90° arc labelled `90° מזרחה`, Sun with `אור שמש` arrows, one explanation line in a grey box, then big primary `נסי שוב` (blue, retry icon) and secondary outlined `הסבר` (book icon).

**What's off:**
- The card title `אזלת הסוללה!` is not natural Hebrew; use e.g. `הסוללה נגמרה!`.
- The city is clearly Tokyo/Japan (Tokyo-tower-like spire, pagoda, a lantern with 東), not Dhaka. The game's city dressing should match the level's actual place.
- On the mini globe the two pins are only ~45° apart although labelled 90°, and the "you" pin sits over Arabia/Africa. The game draws pins and arcs from the real longitudes.
- The time chips contradict the scene: Dhaka shows 12:00 on the lit side while Tzila lies in a night city. In the game the card must show the player's actual arrival time and place.
- The dawn glow is fairly close on the horizon; the prompt asked for the dawn line to be far away.
- HUD is reduced to pause/mute; no level pill, clock or shutter (acceptable for a failure overlay).

## 04-eclipse.png

- Route: ChatGPT in user's Chrome. Chat URL above. Date 2026-10-31. Attempts: 1. Download name: `Robot Photographer Witnesses a Total Eclipse.png`.

**Prompt (exact):**

> Same game, same art style, landscape 16:9: an in-game screenshot of the climax of the eclipse level. Daytime on the tiny planet, but a dark round shadow spot with a soft edge sweeps across the ocean and a coastline; Tzila stands inside the shadow on a rocky headland with her tripod pointed up; the sky has turned deep twilight blue, stars appear, and the Sun is a black disk with a bright white corona and a diamond-ring flare. Bottom centre: a circular Moon dial widget showing the 8 moon phases with the 'מולד' (new moon) phase selected, plus the orbit dial beside it. Top-left picture-in-picture: Sun, Earth and the Moon's orbit drawn tilted 5° to Earth's orbit, with the Moon exactly on the crossing line. Top right: 'שלב 17: ליקוי חמה', a photo order card, three stars. Polished premium 3D indie game look, like Super Mario Galaxy meets Outer Wilds and Solar Ash: a tiny jewel-box planet with real 3D depth, curved horizon, crisp lighting, rim light, soft bloom. NOT flat vector art, NOT a worksheet. Hebrew right-to-left game HUD with chunky rounded panels, Rubik-like font, readable at a glance. Exciting, something a 13-year-old would want to play.

**What to copy:**
- The Moon's umbra as a large dark soft-edged ellipse lying on the sunlit ocean/coastline: exactly the look we want for the shadow spot.
- Black Sun disk with white corona and diamond-ring flare high in the sky; stars only near the top.
- Tzila on a rocky headland at left with her tripod and camera (same character again), ruined stone tower behind her.
- ~~Two side-by-side round dials bottom centre~~ **(dials OBSOLETE — no dials, see revision note; the photo card and PiP in this line still apply)**: `שלב הירח` with 8 phase icons and `מולד` highlighted (orange ring), and `מיקום במסלול` with months around an Earth; shared arrow buttons outside. Photo-order card top right with sample photo; PiP top left with Sun–Earth–Moon, a 5° tilted Moon orbit and `נקודת החציה (ליקוי אפשרי)` label.

**What's off:**
- (Obsolete widget.) The orbit dial ring is broken again (`יולי` and `מאי` twice; no `יוני`, `ספטמבר`).
- Phase labels are partly mismatched to their icons (e.g. the first-quarter/last-quarter halves). Draw phases from the model.
- Sky near the horizon stays bright daylight blue; during totality it should go deep twilight all around, with a sunset-coloured ring at the horizon.
- The Moon in the PiP is not on the crossing (node) point; it is drawn between Earth and the node.
- Bidi flip again: `שלב :17 ליקוי חמה`. All three stars are filled (target shows a finished state; at the climax they should still be empty).
- The flag on the ruin is a Greek flag; remove country flags.
- The tripod points at the horizon, not up at the Sun.

## 05-world-map.png

- Route: ChatGPT in user's Chrome. Chat URL above. Date 2026-10-31. Attempts: 1. Download name: `Whimsical Planetary Adventure Menu.png`.

**Prompt (exact):**

> Same game, same art style, landscape 16:9: the level select screen. A floating tiny Earth in space slowly turning, with four glowing ring 'worlds' orbiting around it (Spin, Orbit and Tilt, Sun as Engine, Moon), each ring has numbered photo-pin markers 1–18 on the globe's surface at real places (Mount Fuji, Lapland, Jerusalem, Sydney, a Pacific island), some with a Polaroid thumbnail and stars, others locked. Hebrew titles 'הסיבוב העצמי', 'ההקפה ונטיית הציר', 'השמש כמקור אנרגיה', 'הירח'. Tzila floats in the corner holding up a Polaroid album. Polished premium 3D indie game look, like Super Mario Galaxy meets Outer Wilds and Solar Ash: a tiny jewel-box planet with real 3D depth, curved horizon, crisp lighting, rim light, soft bloom. NOT flat vector art, NOT a worksheet. Hebrew right-to-left game HUD with chunky rounded panels, Rubik-like font, readable at a glance. Exciting, something a 13-year-old would want to play.

**What to copy:**
- Big central globe with numbered pins; unlocked pins carry a Polaroid thumbnail of the place with 1–3 stars, locked ones a grey padlock badge.
- Each world as a themed floating diorama/ring with a title pill and star counter (`7/18` etc.): Spin = snowy mountain + city + aurora, Orbit/Tilt = tilted globe with 23.5° marker + four-season trees, Sun = solar panels/desert, Moon = grey moon surface.
- Tzila bottom left holding an open photo album with a speech bubble; album counter card bottom right (`אלבום התמונות 19/72`); back button top left, settings gear top right.

**What's off:**
- Title typo `ההקפה ננטיית הציר` (should be `ההקפה ונטיית הציר`).
- Pin numbers are incomplete (3, 7, 8, 13 missing) and places are wrong: the Fuji Polaroid (10) sits over Central Asia, Sydney (16) in the Indian Ocean, the island (14) in the South Atlantic, Jerusalem's dome (9) over the Persian Gulf. The game places pins from real lat/long.
- The globe's continents are distorted (Arabia/India merged). Use real Natural Earth geography.
- Worlds are dioramas around the globe rather than rings orbiting it; either is fine, but they must not hide the globe pins.
- The Moon diorama includes a lunar lander with a US flag and the Sun diorama has pyramids; avoid national flags and keep worlds generic or tied to our levels.
- The counter `19/72` implies 4 stars per level; the game uses 3 stars × 18 levels = 54.

## 06-sleep-pod.png

- Route: ChatGPT in user's Chrome, same chat as 01–05. Date 2026-10-31. Attempts: 1. Download name: `Crescent Moon Rooftop Adventure.png`.

**Prompt (exact):**

> Same game, same art style, landscape 16:9: an in-game screenshot. Evening on a flat rooftop in Jerusalem (old stone city, domes and walls below, on the tiny planet with a curved horizon); the Sun has just set, the orange twilight band crosses the planet, a thin crescent Moon low in the west. Tzila has unfolded a cosy egg-shaped sleep pod from her backpack (white shell, coral trim, a round glass hatch, blanket inside) and stands beside it. Bottom centre: a chunky rounded Hebrew panel titled 'תא שינה' with a big number stepper showing '7' and a toggle 'שעות / ימים' set to 'ימים', a big glowing commit button 'לישון!' and a small note 'אי אפשר לבטל'. Top left: a round picture-in-picture inset from space showing the Sun, the Earth and the Moon's orbit (read-only, no handles). Top right: level name 'שלב 15: מופעי הירח', stars, a photo order card with a small strip of 8 moon phase thumbnails, three of them already filled with Polaroids. Bottom right: the big round camera shutter button. Polished premium 3D indie game look, like Super Mario Galaxy meets Outer Wilds and Solar Ash: a tiny jewel-box planet with real 3D depth, curved horizon, crisp lighting, rim light, soft bloom. NOT flat vector art, NOT a worksheet. Hebrew right-to-left game HUD with chunky rounded panels, Rubik-like font, readable at a glance. Exciting, something a 13-year-old would want to play.

**What to copy:**
- The sleep pod: upright-ish white egg shell with coral trim and a coral base ring, one big round glass hatch swung open, coral quilt + pillow + tiny plush inside, warm interior glow. Tzila stands beside it, same model as 01–05. (The Tripo `sleep_pod.glb` matches this closely, hatch facing +Z.)
- The commit panel, bottom centre: title pill `תא שינה` with a bed icon, helper line `בחרי לכמה זמן לישון ולקדם את הזמן בעולם` (good natural Hebrew, usable as-is), a big number stepper `‹ 7 ›`, a two-way toggle `שעות / ימים` with `ימים` lit blue, a big glowing orange `לישון!` button with a bed icon, and the red warning line `אי אפשר לבטל`. This is the HUD target for the sleep pod.
- Evening rooftop in Jerusalem: limestone walls and domes below, cypresses, warm window lights, the orange twilight band along the curved horizon, a thin crescent Moon low over the twilight.
- Photo-order card top right with a strip of 8 phase slots, 3 filled with starred Polaroids, empty dashed slots for the rest.
- PiP top left is a read-only oval inset with no handles, as the revision requires.

**What's off:**
- Level pill renders `שלב :15 מופעי הירח` (bidi colon flip again).
- The PiP draws the Moon on the Earth's orbit around the Sun (Sun–Earth–Moon on one big ellipse). The Moon's orbit must circle the Earth; the inset should show a small Moon orbit around the Earth.
- The 8 phase thumbnails in the strip aren't in a real phase order (several near-identical gibbous icons, the crescents face inconsistently). The game's phase order is authoritative.
- The Dome of the Rock is the dominant landmark. Keep the Old City generic (walls, domes, limestone) and follow the content plan for which landmark is shown.
- Extras not in the brief: a sleeping cat, a telescope on a tripod, coffee mugs. Harmless set dressing, but the telescope can be confused with Tzila's camera tripod.

## 07-calendar-train.png

- Route: ChatGPT in user's Chrome, same chat. Date 2026-10-31. Attempts: 1. Download name: `Midnight Sun Railway Adventure.png`.

**Prompt (exact):**

> Same game, same art style, landscape 16:9: an in-game screenshot. A small whimsical 'calendar train' station on a snowy hill in Lapland on the tiny planet: a little steam locomotive with a calendar-page chimney waits on a ring-shaped track that floats around the planet; Tzila stands at a ticket booth. Bottom centre: a Hebrew timetable board 'רכבת הלוח' listing destination dates as big ticket stubs: '21 במרץ', '21 ביוני', '23 בספטמבר', '22 בדצמבר', each with a tiny Earth-and-Sun icon showing the tilted axis; a counter 'כרטיסים: 1' and a note 'כרטיס לכיוון אחד'. Top left: the round orbit inset showing Earth's current position (read-only). Top right: 'שלב 8: שמש חצות', stars, photo order card 'צלמי: השמש מעל האופק בחצות'. A curious polar bear peeks from behind a snowy rock. Polished premium 3D indie game look, like Super Mario Galaxy meets Outer Wilds and Solar Ash: a tiny jewel-box planet with real 3D depth, curved horizon, crisp lighting, rim light, soft bloom. NOT flat vector art, NOT a worksheet. Hebrew right-to-left game HUD with chunky rounded panels, Rubik-like font, readable at a glance. Exciting, something a 13-year-old would want to play.

**What to copy:**
- The calendar-train ticket board, bottom centre: snowy wooden frame with a `רכבת הלוח` header plaque, helper line, four big ticket stubs read right-to-left `21 במרץ`, `21 ביוני`, `23 בספטמבר`, `22 בדצמבר`, each with a little Earth-and-Sun picture and a season icon (flower, sun, leaf, snowflake), the selected stub outlined in glowing blue, round arrow buttons outside, and a pill `כרטיסים: 1` with the note `כרטיס לכיוון אחד`. This is the HUD target for the train.
- The locomotive: dark steam engine with brass trim, a round `רכבת הלוח` nameplate on the smokebox, red cow-catcher, lamps, and a chimney puffing tear-off calendar pages (`21 יוני`). Red carriages behind it. (The Tripo `locomotive.glb` is a brighter teal/red toy version; its chimney is a plain stack with a steam puff, not calendar pages.)
- Station kiosk at left with a `רכבת הלוח` sign, a big station clock and lanterns; Tzila (with a small suitcase) waits at the counter.
- Polar bear cub peeking from behind a snowy rock at right, same cartoon bear as 02.
- Midnight-sun mood: the Sun on the horizon over water, aurora hints, a curved snowy horizon.
- PiP orbit inset top left, read-only, labelling the four dates with their seasons (`שוויון`, `הקיץ`, `החורף`).

**What's off:**
- Level pill `שלב :8 שמש חצות` (bidi colon flip).
- The track runs along the ground around the hill and out of frame, not as a ring floating around the planet.
- PiP: the Earth icons show no axis tilt, so June and December look identical. Draw the tilted axis (fixed direction in space) at every position.
- The Earth-and-Sun icons on the four tickets are all the same picture; only the season emoji differs. Each ticket should show that date's tilt geometry.
- Not in the brief: a human Santa-like ticket seller in the booth (no human NPCs are planned; the booth can be empty or staffed by a robot), and an extra `מסלול שנתי` signpost.
- Tzila's back shows the two solar panels as a large backpack. That's fine, but they read bigger than in 01.
