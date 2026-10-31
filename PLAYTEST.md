# Tilt World: independent playtest

**Date:** 2026-10-31
**Build:** dev server at `localhost:5242`, `?level=N&all`.
**Method:**
- Playwright drove headless Chromium with real keyboard events (W/A/D/Space/E/Z/C/P/Q/X/1-3, Enter, Esc). I also clicked the train cards and the sleep-picker buttons with the mouse.
- The page ran in real time. I didn't use `advanceTime`.
- Screenshots are at 1280×720, plus a 390×844 phone pass. They're in `docs/playtest/`.
- I read `src/game/levels.ts`, `tests/levels.test.ts` and `docs/curriculum/REVIEW.md` only after honest attempts at L12, L17 and L18. I note below wherever a solve depended on them.

**Caveats:**
- My first runs used SwiftShader at about 9 fps, which made movement coarse (1.2° per frame). All the timings below come from the later Metal runs at 60 fps.
- Other crews edited `src/` during the session, and Vite HMR reloaded the page several times in the middle of a run. I re-ran those runs. A reload, not the game, caused any "level reset" I saw.
- I saw **no console errors or page errors in any level**. The only warnings were WebGL ReadPixels and the AudioContext autoplay notice.

## Summary verdict

The core idea works and is often delightful:
- the night-to-dawn sprint in L1;
- the midnight sun at the Lapland cabin;
- the polar-night rail escape in L14;
- the cycle of moon phases in L15.

Every failure card I saw explains its rule in one or two clear Hebrew lines, and the end-of-level rule cards are good.

**It isn't ready for unsupervised 13-year-olds.** Four kinds of problems block play:

1. **The clock keeps running while a modal is open.** This covers the train and sleep dialogs, and train-card browsing on top of a narrow noon window makes L10 effectively unwinnable for a human.
2. **Failure text misleads on the correct day in L17 and L18.** The game says "the shadow misses the Earth this month" on the one new moon that does have an eclipse, just hours too early.
3. **The player can't find targets.** Place labels are nearly invisible, nothing points to off-screen targets, and L12's surfaces are spread over three continents with no on-screen cue. I couldn't solve L12 or L17 without reading the code.
4. **Level 1 never teaches the keys** and kills the battery after about 6 real seconds of standing still.

**Hebrew:** natural feminine singular throughout, but:
- degree signs and ranges flip in RTL (`°15`, `40–20 ס"מ`, `179+ ימים`);
- several "1 + plural" strings appear;
- one broken letter label (`כרטיס ך`).

**Phone:** the layout has no horizontal overflow, but the HUD column, the order card and the touch chips collide.

## Per-level results

Times are real seconds from pressing Enter to the win card, on the successful run.

| Lvl | Result | Time | Attempts | Top issue |
|---|---|---|---|---|
| 1 הזריחה הראשונה | Solved ★★★ | ~6 s | 3 (idle: fail at 6 s; west: fail at 2.5 s; east: win) | No controls taught. The battery dies about 6 s after Enter, so a first-timer fails before learning that W runs. |
| 2 השמש "זזה" | Solved ★★★ | ~35 s | 3 (overslept sunset with 12 h once) | The dream clock jumps backwards (17:47 → 03:49, then "10:45" at sunrise). End card reads "(1 התחייבויות)". |
| 4 15° לשעה | Solved ★★★ | ~40 s (31 s travel, 9 s wait) | 3 (first two ran past Dhaka) | No marker or pointer for Dhaka, and its label is unreadable. The title renders as `°15 לשעה`. |
| 5 יום הולדת פעמיים | Solved ★★★ | ~58 s | 1 | 16 s of idle waiting for 20:00 at the start. No fireworks are visible, and the place labels are dark-on-dark. |
| 6 זה לא המרחק | Solved ★★★ | ~60 s | 1 | Intro reads "1 כרטיסים לכיוון אחד". `+179 ימים` renders as `179+`. The 21 Jan card is hidden on page 2. |
| 8 שמש חצות | Solved ★★★ | ~45 s | 1 | 12 s of idle waiting for midnight. The inset says 21 June while the HUD says 22 June. `(°69 צפון)`. |
| 10 שנה על גבעה אחת | **Failed** as a human. Solved only by script (picks under 1 s) ★★★ | 45 s (script) | 2 | The clock runs about 3–5 game-min per real second while the train dialog is open, so after one or two tickets noon has passed ("הצל עוד מתארך — זה לא הצהריים"). There's no sleep pod and no way back. |
| 12 גיליון תרמי | Solved ★★★, **only after reading levels.ts** | ~28 s | 3 | Couldn't find the snow or lava: the labels are translucent, and the surfaces are in the Alps and Iceland with no on-screen cue. The 0.3° radii at Tel Aviv and the fields are easy to overshoot. |
| 13 איפה אני? | Solved ★★★ | ~77 s | 1 | Fine. Mostly waiting or sleeping to noon each round. |
| 14 בריחה מהלילה הקוטבי | Solved ★★★ | ~9 s | 3 (70° rail: good failure; then "השמש לא בפריים") | Good level. The failure line "(70°)" reads like the Arctic circle's latitude. |
| 15 מופעי הירח | Solved ★★★ | ~77 s | 3 (dawn sky too bright twice) | The moon at 40–70° elevation is never in the camera frame. The X chip's label gives the answer away. Toast reads "צילה ישנה 1 שעות". |
| 16 גאות ושפל | Solved ★★☆ | ~27 s | 3 (instant tide fail twice) | No tide gauge before crossing. You fail on your first step and restart. The star line reads "(היו 0 פספוסים, 4)", and `20–40` renders as `40–20`. |
| 17 ליקוי חמה | **Failed**: wrong ticket (21 Aug), then the correct ticket (19 Oct) said "misses the Earth this month". Solved **only with code knowledge** ★★★ | ~30 s | 3 | Misleading failure text on the right day. The shadow isn't visible anywhere. The correct card is on page 2. |
| 18 לוח השמיים | Solved ★★★ | ~40 s | 2 | The eclipse shot just before it started said "עובר מעל או מתחת לצל", which is misleading. The moon and the eclipse are out of frame. The final level has no ending. |

**First 30 seconds of L1:** the visuals land. You see the night side, city lights, a thin orange limb, then the sun pops over the horizon while you run east. Shooting it gives a polaroid of the moment, which feels great.

But two things undercut it:
- **Nothing tells you W runs or E shoots.** The only toast is "צפון תמיד למעלה במצפן ובמפה". Controls appear only in the Esc menu, and in L2's second toast.
- **The level is over in about 6 s either way.** It's a win if you guess the controls and a battery death if you don't. Most first-timers will see the fail card first.

## Prioritized issues

### P1: broken or blocking

**P1-1. The world clock runs while the train and sleep dialogs are open, which breaks L10 and drifts every timed shot.**
- Evidence:
  - L10: noon at 11:50, opened the train, picked within 1.4 s and arrived at 11:53. On the second trip, 2.2 s in the dialog cost 5 game-minutes.
  - A human run reading the cards (about 10 s each) arrived at 12:16, 12:44 and 12:59. The December, March and June shots all failed with "הצל עוד מתארך — זה לא הצהריים", and the level has no sleep pod to reach the next noon.
  - L2: the sleep dialog advanced 06:12 → 06:20 while open.
  - L15: each sleep drifted about 30 min, which pushed two shots into the dawn sky.
- REVIEW.md "L10: …every ticket lands before noon … fine" assumes the ticket is instant. A bot with no UI never sees the drift.
- Screenshots: `docs/playtest/l10-train.png`, `docs/playtest/l10-dec.png`, `docs/playtest/l2-sleep-ui.png`
- **Fix:**
  - Freeze the sim while any commitment modal is open. Esc pause already freezes the clock correctly.
  - Land the train at exactly the departure clock time.
  - In L10, also allow the sleep pod, or widen the noon window to ±30 min.

**P1-2. L17 and L18 failure text is wrong on the correct date.**
- Evidence:
  - L17: on 19 Oct, the only eclipse new moon, a shot from the station at 09:18 says "מולד — אבל הירח עובר מעל השמש: מסלולו נטוי 5° והצל מפספס את כדור הארץ החודש."
  - The shadow actually touches the Earth about 14–17 h later, over the Pacific near 10°N 170°E. A student will conclude the ticket was wrong, and with 2 tickets the run is over.
  - L18: on the eclipse night, at UTC about 5.7, just before the eclipse window, the text reads "ירח מלא — אבל הוא עובר מעל או מתחת לצל של כדור הארץ".
  - Cause: `solarEclipseCenter()` and `lunarEclipse()` return null or false, and the code treats "not this instant" as "not this month".
- Screenshots: `docs/playtest/l17-oct19.png`, `docs/playtest/l17-try1.png`
- **Fix:** when |β| is inside the eclipse limit but there's no shadow right now, say so. Suggested lines:
  - "זה המולד הנכון — אבל הצל עוד לא נוגע בכדור הארץ. ישני כמה שעות וחפשי אותו בצד היום."
  - "הליקוי עוד לא התחיל / כבר נגמר."

  Keep the "נטוי 5°" line only for new or full moons that are actually out of season.

**P1-3. L17: the moon's shadow can't be found from the screen.**
- Evidence:
  - The space view (V) always centres on Tzila, so the night side and the far side are never shown.
  - The umbra isn't drawn on the globe or in the orbit inset.
  - H only toggles the latitude/longitude grid.
  - I scanned 36 h in 3-hour steps and saw no shadow (`docs/playtest/l17-scan-*.png`).
  - I solved it only by computing `solarEclipseCenter` from `astro.ts`.
- Screenshots: `docs/playtest/l17-aug21-space.png`, `docs/playtest/l17-hint.png`
- **Fix:**
  - Draw the umbra as a dark disc on the globe whenever it exists.
  - Let V rotate freely, or add a "where is the shadow?" arrow on the compass.
  - Make the L17 hint highlight the node line and the shadow track. The code defines a `nodes` overlay, but on screen only the grid appeared.

**P1-4. Targets you can't see or find (labels, off-screen places, L12 surfaces).**
- Evidence:
  - Place labels are translucent grey pills that disappear against terrain, clouds or space:
    - "דאקה", `docs/playtest/l4-at-dhaka.png`;
    - "סמואה האמריקנית", `docs/playtest/l5-end.png`;
    - "החרמון" and "תחנת רכבת הלוח", `docs/playtest/l6-hermon.png`;
    - "תל אביב: אספלט", `docs/playtest/l12-start.png`;
    - "גבעת המצפה", hidden behind Tzila's head in `docs/playtest/l2-dream.png`.
  - Nothing points to off-screen targets, neither on the compass nor in the space view.
  - In L12 the brief lists "שלג, לבה כהה, יער, אספלט", but the snow is in the Alps and the lava is in Iceland. Nothing on screen says so, and I gave up and read `levels.ts`.
  - One label even overlaps the compass's "מזרח" (`docs/playtest/l12-start.png`).
- **Fix:**
  - Make labels opaque with a 2px outline, always drawn on top, and at least 14px.
  - Add edge-of-screen arrows and a compass tick for every place in the current brief.
  - In L12, name the places in the brief: "שלג באלפים, לבה באיסלנד, יער בגליל, אספלט בתל אביב".

**P1-5. L1 doesn't teach the controls and gives about 6 seconds.**
- Evidence:
  - The intro card and toasts never mention W/E.
  - The battery goes 18% → 0% in about 6 s idle (about 2.5 s if you run the wrong way).
  - The failure line itself is good: "השחר זז רק 15° בשעה, והסוללה נגמרה לפני שהגיע אלייך. ריצה מזרחה, לקראתו, מקדימה את הזריחה."
- Screenshots: `docs/playtest/l1-start.png`, `docs/playtest/l1-fail-idle.png`, `docs/playtest/phone-l1-fail.png`
- **Fix:**
  - Put "W / ↑ ריצה · A/D פנייה · E צילום" on the L1 intro card, and show it as the first toast. On phone, use "ג'ויסטיק לריצה · 📷 לצילום".
  - Start the battery drain on the first movement, or give 15–20 s of reserve.

### P2: confusing

**P2-1. Bidi: degree signs, plus signs and ranges flip in RTL.**
- Examples:
  - `°15 לשעה` (L4 title and order card);
  - `(°90 מזרחה)`, `(°69 צפון)`;
  - `15° בשעה` renders as `°15` (L1 rule);
  - `(66.5°)` breaks across lines as `(°66.5` (L14 failure card);
  - `ב-14°` renders as `ב-°14` (L12);
  - `+179 ימים` renders as `179+ ימים` (all train cards);
  - `20–40 ס"מ` renders as `40–20 ס"מ` (L16 rule).
- I confirmed with a plain Chromium RTL test that the logical string "15° בשעה" renders as "°15". REVIEW D4 couldn't check the renderer, so this answers it.
- Screenshots: `docs/playtest/l4-start.png`, `docs/playtest/l14-end.png`, `docs/playtest/l16-end.png`, `docs/playtest/l6-train-ui.png`
- **Fix:** wrap every number+unit, time, signed number and range in `<bdi dir="ltr">`, or append U+200E after `°`, `+N` and `N–M` in `hud.ts` at render time.

**P2-2. Hebrew agreement errors and broken strings.**
- `🚂 רכבת הלוח (C, בתחנה): 1 כרטיסים לכיוון אחד.` (L6 intro). Should be "כרטיס אחד לכיוון אחד".
- `צילה ישנה 1 שעות…` (sleep toast, `docs/playtest/l15-p4.png`). Should be "שעה אחת".
- `★ תכנון חסכוני (1 התחייבויות)` (L2 end). Should be "התחייבות אחת".
- `☆ כוכב שלישי: … (היו 0 פספוסים, 4)` (L16). The "4" has no noun; should be "4 שינות/כרטיסים".
- `כרטיס ך` (L10 tickets): a final kaf used as the 11th letter, out of order before `כ`. Should be "יא, יב", or plain numbers.
- **Fix:** a `plural(n, one, many)` helper for שעה/יום/כרטיס/התחייבות, and Hebrew numerals that use the standard sequence.
- Screenshot: `docs/playtest/l2-end.png`

**P2-3. Movement is too fast for small targets.**
- Running is about 12° of latitude per second (L12), and a 20 ms tap moves 0.2°.
- The Tel Aviv and fields radii are 0.3°, so the player crosses them in about 50 ms.
- In L4 my first two runs sailed past Dhaka: there's no slow-down, and a great-circle heading drifts.
- **Fix:** auto-decelerate within about 2° of any place in the brief, snap into a place's ring when you release W inside 1°, or raise the radii to 1° or more.

**P2-4. Train ticket cards.**
- Season icons are wrong on some cards:
  - 22 Aug shows ✿;
  - 19 Feb shows 🍂;
  - 18 Mar shows 🍂 (L18).
- Cards aren't chronological. L10's first page is +242, +272, +303, +334, and the near dates are on pages 2–3.
- The page arrows are subtle, and the answers often sit on hidden pages: L6's 21 Jan and L17's 19 Oct are both on page 2.
- The node and sun diagrams in L17 are 64px. I misread 21 Aug as "on the line" and burned a ticket.
- L10 claims "בלי שמות חודשים", but the orbit inset at top-left prints "22 ביולי".
- Screenshots: `docs/playtest/l10-train.png`, `docs/playtest/l17-train.png`, `docs/playtest/l18-train.png`
- **Fix:**
  - Sort the cards by "+days".
  - Show all cards in a scrollable row or grid, with a "1/3" page indicator.
  - Correct the icon mapping.
  - Enlarge the diagram and draw the node line thicker.
  - Hide the inset's date label in L10 and L18.

**P2-5. The camera never looks up, so the moon and the eclipse are out of frame.**
- In L15 and L18 the moon at 40–70° elevation is above the top of the screen while Tzila faces it (`docs/playtest/l15-p4.png`, `docs/playtest/l18-eclipse.png`). The shot is accepted, but the player never sees the phase they photographed.
- In L17 the camera flips to the sky and the eclipsed sun is cut off at the top edge (`docs/playtest/l17-pacific.png`).
- **Fix:** when the camera faces a sky target within about 30°, tilt the camera up to frame it, or show a sky inset (as Q does for the sun) with the moon's phase drawn.

**P2-6. Sleep picker.**
- The `‹ ›` glyphs mirror in RTL, so **both arrows point inward** at the number, and you can't tell + from −.
- Steps are 1 h up to 24 (16 presses for 22 h).
- Days and hours need two separate sleeps, which counts as two commitments.
- The displayed number lags rapid presses.
- Screenshots: `docs/playtest/l15-sleep-ui.png` and the phone version `docs/playtest/phone-l15-sleep.png`
- **Fix:** use `+` / `−` buttons, quick chips (1, 3, 6, 12 h; 1, 3, 7 days), and one "N days and M hours" commit.

**P2-7. L16: no tide information before crossing.**
- Stepping onto the causeway at the wrong time fails within 0.5 s and restarts the level.
- The tide gauge ("מד הגאות") appears only on the Tel Aviv shots.
- Screenshots: `docs/playtest/l16-start.png`, `docs/playtest/l16-blocked.png`
- **Fix:**
  - Show a tide gauge at the mainland ring and draw water visibly over the path.
  - Make the first wet step push Tzila back with "המים עולים!" rather than ending the run. End the run only if she stays.

**P2-8. Answer leaks in the UI.**
- The L15 bottom chip reads `X "ירח מלא בצהריים"? בלתי אפשרי!`, so the quiz answer is printed on the button (see also REVIEW E15b).
- L10's inset date (P2-4).
- **Fix:** label the chip `X הכרזה: "בלתי אפשרי"` and require one tap to choose a reason.

**P2-9. Phone layout collisions (390×844).**
- The order card overlaps the compass and covers its "מזרח →" label. In L15 the 9-line order card covers the whole HUD column.
- The bottom action chips (Z, X, H, V) sit on top of the joystick ring.
- Keyboard letters (Enter, Z, H, V, X) are shown on touch.
- Screenshots: `docs/playtest/phone-l15-hud.png`, `docs/playtest/phone-l12-hud.png`, `docs/playtest/phone-l1-intro.png`
- **Fix:**
  - On narrow screens, collapse the order card to the title plus progress, and tap to expand.
  - Move the chips above the shutter, clear of the joystick.
  - Hide key letters when `pointer: coarse`.

**P2-10. L2 dream breaks "time only moves forward".**
- After the sunset shot the clock shows 03:49 on 21 Mar (earlier than 17:47 that day). After the tripod, 22 Mar "10:45" with the sun on the horizon.
- The banner duplicates the toast, and it covers Tzila and the "גבעת המצפה" label.
- Screenshot: `docs/playtest/l2-dream.png`
- **Fix:** hide the clock during the dream (or show "חלום"), and show only the banner.

### P3: polish

- **P3-1. End and failure cards overlap the order card's right edge, so text is cut off.**
  - Screenshots: `docs/playtest/l12-glacier.png`, `docs/playtest/l14-end.png`
  - **Fix:** hide or dim the order card under modals, or narrow the modal.
- **P3-2. Completed objectives with result notes use red/orange strikethrough**, which reads as an error ("בעולם ההפוך…השמש זרחה במערב!" in `docs/playtest/l2-end.png`).
  - **Fix:** green, no strikethrough on the note.
- **P3-3. The L16 failure card's icon is 💤 for a wave.**
  - Screenshot: `docs/playtest/l16-blocked.png`
  - **Fix:** 🌊.
- **P3-4. The L14 failure line "נשארת מצפון לחוג הקוטב (70°)" reads as if the circle is at 70°.**
  - **Fix:** "נשארת בקו רוחב 70°, מצפון לחוג הקוטב (66.5°)…".
- **P3-5. Idle waits:**
  - L5: 16 s for 20:00;
  - L8: 12 s for midnight;
  - L13: about 25 s per round if you don't sleep;
  - L15: about 15 s for moonrise.

  The sleep pod's 1-hour minimum can't close sub-hour gaps. **Fix:** allow 15-minute sleep steps, or run the clock about 2× when Tzila stands still with nothing to do.
- **P3-6. H in L1, L4 and L17 only shows the grid, with no text.** A 13-year-old won't read the grid as advice.
  - Screenshots: `docs/playtest/l1-hint.png`, `docs/playtest/l4-hint.png`
  - **Fix:** a one-line hint toast with each overlay.
- **P3-7. L5: no fireworks are drawn** at 20:00 in Fiji or Samoa.
  - Screenshot: `docs/playtest/l5-fiji-fireworks.png`
- **P3-8. Clock date and inset date disagree around midnight** (HUD 22 June 00:01, inset 21 June).
  - Screenshot: `docs/playtest/l8-midnight.png`
- **P3-9. End-card bullet list renders both "•" and "★".**
  - Screenshot: `docs/playtest/l1-end.png`
- **P3-10. L18, the finale, ends with only "שוב / לתפריט".** **Fix:** add a closing card or credits.
- **P3-11. Test API: `render_game_to_text().date` disagrees with the HUD date after crossing longitudes** (Samoa: state says 1 Nov, HUD says 31 Oct). It also has no moon azimuth, so testers can't aim at the moon.

## What worked well

- Every failure card has a short reason plus "הכלל". The L1, L10, L14 and L16 failure lines teach the rule in one sentence.
- The feminine singular address is consistent and natural: צלמי, עברי, נסי שוב, בחרי.
- The compass and the "מזרח →" tag help orientation.
- Esc pause freezes the clock and lists every key.
- L13's sun sight (Q) and its compass words ("צפון-מערב") make a neat deduction puzzle.
- L14's rail choice (70° vs 62°) is a real decision with a clear failure.
- L8's midnight sun and the L1 sunrise are the visual highlights.
- I saw no console errors in 18 levels' worth of runs.

## Fixes after this playtest (crew lead)

| Issue | Status | What changed |
|---|---|---|
| P1 clock runs inside the train and sleep dialogs (L10 unwinnable by hand) | **Fixed** | `simStep` returns while either panel is open: browsing costs no game time. Checked in the browser (06:06 stays 06:06 for 5 s with the panel open, then runs again). |
| P1 wrong text on the right new moon (L17) / full moon (L18) | **Fixed** | The checks scan ±40 h. Shooting on the right new moon too early now says "זה המולד הנכון — יש ליקוי, אבל בעוד כ-14 שעות…"; L18 says when the lunar eclipse comes. There is a test in `tests/levels.test.ts` (L17). |
| P1 L17's shadow can't be found | **Fixed** | While the shadow is on the Earth, an orange waypoint chip "🌑 צל הירח" with a direction arrow and distance points to it. The camera looks up at the black Sun inside totality. |
| P1 targets you can't see or find | **Fixed** | Waypoint chips around Tzila for every place you are not at, with a direction arrow (relative to facing) and distance in km (L4 Dhaka, L12 Alps and Iceland, …). Labels no longer fade when they sit on the camera line. |
| P1 L1 never teaches the keys; the battery dies about 6 s after Enter | **Fixed** | The intro card shows the keys (or touch controls on a phone). The first tutorial line is the run key. The L1 clock is slower (0.15 h/s), so waiting dies in about 9 s instead of 6. Running east is still the only solution (tests). |
| P2 numbers flip in RTL | **Fixed** | Every escaped HUD string wraps signed numbers, ranges, ° and % in LTR `bdi` ("15° לשעה", "+179 ימים"). A Hebrew prefix like "ב-6°C" is kept on one line and is not read as a minus. |
| P2 Hebrew errors | **Fixed** | "שעה אחת / שעתיים / יומיים", "כרטיס אחד", counted end-card lines ("פספוס אחד", "התחייבות אחת"). Ticket letters skip the final forms (no "כרטיס ך"). |
| P2 ticket cards | **Fixed** (diagram size unchanged) | Cards sorted soonest first, as many per page as fit (up to 6), and number keys follow the card order. Season icons go by orbit quadrant (Aug–Oct 🍂, Nov–Jan ❄, Feb–Apr ✿, May–Jul ☀). The page arrows no longer mirror. The L10 inset shows no date. |
| P2 camera never tilts up | **Fixed** | World 4: standing still and facing a Moon more than 22° up, the camera looks up at it. Totality: it looks up at the eclipsed Sun. |
| P2 sleep picker | **Fixed** | − / + and −6 / +6 buttons (forced LTR, so the labels don't mirror). In days mode, "ועוד N שעות" makes days plus hours one commitment. |
| P2 phone layout | **Fixed** | Action chips stack on the right above the shutter, clear of the joystick. The order card keeps only the checklist (the brief was on the intro card) and stays out of the compass column. Waypoint chips stay inside the screen. See `docs/visual-review/08-phone-l12.png` and `09-phone-l15.png`. |
| P2 L16 no tide reading | **Fixed** | The clock pill shows a tide gauge: "🌊 −3.1 מ' ✔ השביל יבש" or "✖ השביל מוצף (נפתח מתחת ל--2.5)". |
| P3-6 H shows only the grid | **Fixed** | H also shows the level's hint sentence for 6 s. |
| P3-9 end card shows "•" and "★" | **Fixed** | The list has no bullets. |
| P3-1…5, 7, 8, 10, 11 | Open | Listed in `progress.md` as follow-ups. |
