# Visual review — real captures vs. mockups

Real frames are captured locally into `scratch/visual-review/` (git-ignored: screenshots are never committed) by `npm run shots` (`scripts/shots.mjs`, Playwright + headless Chromium/SwiftShader at 1672×941, the mockups' size). Every frame is a reachable game state: the script drives the live sim with the same scripted player the tests use (`tests/bot.ts`), only through `Input` (run, turn, sleep, ticket). The mockups are in `docs/visual-targets/` (provenance in `PROMPTS.md`). They are mood targets from an image model, not specs; the game's astronomy wins where they disagree.

| # | Mockup | Real frame | Level / state |
|---|--------|------------|---------------|
| 01 | `visual-targets/01-first-sunrise.png` | `visual-review/01-first-sunrise.png` | L1, running east, Sun 1° below the horizon at 05:56 |
| 02 | `visual-targets/02-midnight-sun.png` | `visual-review/02-midnight-sun.png` | L8, June ticket, cabin at 69°N, 23:58, Sun +2° due north |
| 03 | `visual-targets/03-wrong-offset.png` | `visual-review/03-wrong-offset.png` | L4, slept 8 h on the home clock, Dhaka at 21:30 |
| 03b | (same) | `visual-review/03b-wrong-offset-fail.png` | L4, the battery runs out in dark Dhaka: the fail card |
| 04 | `visual-targets/04-eclipse.png` | `visual-review/04-eclipse.png` | L17, node new-moon ticket, inside the Moon's shadow |
| 05 | `visual-targets/05-world-map.png` | `visual-review/05-world-map.png` | Menu with some stars earned |
| 06 | `visual-targets/06-sleep-pod.png` | `visual-review/06-sleep-pod.png` | L15 rooftop, sleep pod panel open |
| 08, 09 | (phone) | `visual-review/08-phone-l12.png`, `09-phone-l15.png` | 390×844 touch: waypoint chips, chips over the shutter, checklist-only order card |
| 07 | `visual-targets/07-calendar-train.png` | `visual-review/07-calendar-train.png` | L6 station, calendar-train panel open |

## What matches

- **Tzila** is the model target: white rounded body, coral bands, orange-tipped antenna, blue solar panels. She is a few hundred km tall on a small planet, which is the scale fix the mockup notes asked for (01 showed her as a satellite).
- **HUD layout** follows the mockups: pause and mute circles top left, the mini compass with N and `מזרח →`, battery, clock with a Sun or Moon icon and the date, film counter, level pill with three stars top right, photo-order card under it, round shutter bottom right, and key chips at the bottom. Numbers sit in `<bdi>`, so `שלב 8: שמש חצות` reads correctly. The mockups' bidi flips (`שלב :8`) do not occur.
- **Night side** has warm city lights that fade out past the terminator (01, 03), with cloud wisps and a lat/long grid on the levels that need one.
- **PiP orbit inset** (02, 04, 06, 07) is a plain circle with the Sun at its centre. At the June position the axis top leans *toward* the Sun, which corrects the error noted on mockup 02. It also shows the Moon's tilted ring on World 4.
- **Wrong offset (03, 03b):** Dhaka is dark, with a `Z z z` over the sleeping city and a one-line reason ("בדאקה עכשיו לילה…"), red-outlined with an ✖ icon, not color alone. When the battery runs out, Tzila lies down snoring under her own `Z z z`, and the fail card does the arithmetic (UTC+0 vs UTC+6) and states the rule.
- **Eclipse (04):** the Moon's umbra is a dark disc on the dayside. Inside it the light dims, and the camera drops low behind Tzila and looks up past her head at the black Sun with its corona, the mockup's composition.
- **Sleep pod and calendar train panels (06, 07):** same structure as the mockups: hours/days toggle, stepper, big `לישון!` and `אי אפשר לבטל`; ticket cards with a date, an orbit picture with a season icon, and `כרטיסים: 1 · כרטיס לכיוון אחד`. Following the revision notes, there are no dials anywhere.

## Fixed during this review

1. **Midnight Sun hidden behind the planet.** The old "dip" approximation put a +2° Sun below the visible limb. `skyDir` in `src/scene/world.ts` now computes the true tangent ray from the camera to the limb toward the body, so elevation 0 sits exactly on the limb and +2° clears it (02).
2. **Landmarks hid Tzila.** At the cabin she stood inside the cabin model, and the station's locomotive and its big label stood between the camera and her. Landmarks and labels now step aside when she has arrived, or when they are on the camera's line to her. The zone ring stays (02, 07).
3. **Bear in daylight.** It showed while the Sun was +2° (threshold `dot < 0.05`). It now appears only below the horizon and stands beside the cabin, not on the photo spot.
4. **Mountain plinth.** The Tripo mountain mesh stands on a blue square slab; it is now sunk into the ground (07).
5. **Menu badges.** Level numbers were stretched ovals covering the titles (a `.num` rule from the sleep stepper leaked in). Fixed (05).
6. **Panels covered Tzila.** With the sleep or train panel open, the camera frames her closer and higher, so she stays visible above it, like the mockups (06, 07).
7. `1 כרטיסים` in the intro card now reads `כרטיס אחד`.
8. **Snoring was audio only.** A `Z z z` now floats over Tzila when her battery dies and over city places while it is night there. The result card sits high, so she stays visible below it (03b).
9. **Eclipse framing.** With totality about 50° up, the ground-level chase camera never showed the black Sun. Inside the shadow it now pitches up by about half the Sun's elevation (04).
10. **Dawn silhouette and bubble.** A stronger camera-side fill keeps a backlit Tzila white and coral (01), and the tutorial bubble hides while a panel is open (07).

## Still different (honest gaps)

- **Rendering richness.** The mockups are painterly, with dense props (Jerusalem rooftops, cat, telescope, snowy pines, station building, conductor). The game shows the planet, one landmark per place and Tzila. That is right for readability on a phone, but it is visibly simpler.
- **Midnight-sun gap.** At 69°N on 21 June the midnight Sun is only about 2° up, so it sits just above the limb. That is physically right; the mockup's big gap is not.
- **World map (05).** The mockup is an illustrated four-world map; the game uses a four-column level list over the slowly orbiting planet. It works, but it is less charming.
