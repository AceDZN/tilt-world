# Tilt World — עולם נטוי — game identity

A pocket-sized Earth you can sprint around in under a minute. You are **צילה** (Tzila), a solar-powered photographer robot with a big lens and a bigger ego. The galaxy's sky-photo magazine sends you photo orders: the first sunrise, the midnight sun, a noon Sun straight overhead, a birthday celebrated twice, a tide-pool path that opens only at low tide, a total eclipse. Running fast never wins. You win by working out **where and when**.

## First minute

1. **0–5 s.** Black screen, a lens shutter opens. You're standing on the night side of a tiny glowing Earth: city lights, stars, and a thin orange line, the dawn, on the horizon to your right (east). The battery icon blinks low. One Hebrew line: "השחר מגיע ממזרח. רוצי לקראתו!" ("The dawn comes from the east. Run to meet it!") and an arrow pointing east.
2. **5–20 s.** You run (WASD or arrows, or the left thumb on touch). The planet rolls under you, the sky lightens and the twilight band sweeps toward you. Crossing into the orange band gives the **dawn boost** (speed trail, panels hum, battery fills).
3. **20–30 s.** The Sun breaks the horizon. A frame appears; you press **E / the shutter button**. Flash pop, lens flare, a Polaroid slides into the album with stars. One line explains: "רצת 20° מזרחה, אז הזריחה הגיעה אלייך שעה ו-20 דקות מוקדם יותר."

## Controls

| Action | Keyboard (event.code) | Touch |
|---|---|---|
| Run / turn | W/S or ↑/↓ run, A/D or ←/→ turn | left virtual stick |
| Jump (hop onto a grind rail) | **Space** | jump button |
| Shoot photo | **E** or **Enter** | big shutter button |
| Sleep pod: choose hours/days, then commit | **Z** opens the pod | moon button |
| Calendar train ticket (at a station) | **C** opens the timetable | ticket button |
| Plant tripod / weather station | **P** | tripod button |
| Sun sight (World 3, "Where am I?") | hold **Q** | sight button |
| Lat/long grid toggle | **G** | grid button |
| Hint (costs a star) | **H** | bulb button |
| Pause / mute / fullscreen / restart | **Escape**, **M**, **F**, **R** | top bar |

North is always "up" on the mini-map and the compass, east is to the right. Level 1 says so on screen. Tzila's magnetic boots keep her on the tiny planet; there is no glider.

## The decision

Every level is one photo order: **place + sky event + constraint**. The player decides **where to stand** (latitude, longitude, surface) and **when**. Time only moves forward, and you move through it only by **committing**:
- the world clock runs on its own at a slow, fixed rate (read-only, never scrubbed);
- the **sleep pod** sleeps a number of hours (or, in World 4, days) chosen *before* you see the result;
- **calendar-train** stations sell one-way tickets to a date (a solstice, an equinox, a given new or full moon), a few per level.
The budget is game-hours (a film-light ribbon), film frames and tickets, and it's always smaller than "run around until you see it".

## What changes

- The Sun's direction, the terminator and the twilight band move 15° per game-hour, computed by the pure astronomy module from the clock. Nothing the player does moves the Earth, the Sun or the Moon.
- A ticket moves the date forward; the picture-in-picture orbit view shows (read-only) where Earth now is and how its tilted axis faces the Sun. On the globe the lit cap, snow and day length change.
- Days since the new moon set the Moon's phase, rise time and the tides.
- Battery charge = f(Sun elevation, surface albedo, cloud). Night drains it.

## Mistake and retry

The world plays the consequence, never a red X:
- wrong longitude/time → you arrive in darkness, the battery dies, Tzila curls up and snores until a rescue drone arrives;
- wrong date → the midnight sun never shows and a polar bear steals your tripod;
- wrong Moon phase/time → the causeway is underwater and a wave washes you off.

Then a **replay** card: the globe from space with the terminator and the Sun angle, and one Hebrew line explaining the rule ("Dhaka is 90° east of you: 6 hours ahead"). Retry restarts the level instantly (R), keeping what you learned. Hints (H) highlight the relevant line (terminator, target meridian, a tropic) but never the answer, and cost a star.

## Win

The shot: a flash pop, the photo slides into the album, and stars for shot quality (Sun elevation/framing), tickets and film used, and hints used. Each world ends with a transfer level where the environment changes and the labels disappear.

## Replay

Star ratings and best-time per level; an album of every shot; after a world is cleared, **generated photo orders** from the solver (random city pairs, dates and sky events), each verified solvable in its budget, where "run east forever" and "always set June" fail.

## Camera

Third-person chase camera above and behind Tzila, with gravity toward the planet's centre (Mario Galaxy style). The horizon curves; you can see about a third of the planet. During a sleep or a calendar-train ride the camera pulls back to space so you see the whole globe, the terminator sweeping and the orbit inset. The photo frame is a first-person viewfinder.

## Art

A jewel-box planet against a deep starfield: oceans with specular glints, cloud wisps, snow caps that grow with the season, city lights on the night side, a crisp terminator with an orange twilight band, a Moon swinging by. Continents from Natural Earth (public domain), stylized but accurate. Tripo models: Tzila (rigged), polar bear (rigged), tripod, landmark miniatures. Rubik font, chunky rounded HUD, RTL.

## Sound

Procedural WebAudio: a soft hum when panels charge, a rising chord at dawn, a shutter click and flash pop, a snore loop when frozen, wave crash, fireworks. Mute with M.

## Not this

No quiz gates, no delivery loop, no glider, no glowing answer path. Running, committing to time and framing the shot are the verbs; the sky is the feedback.

## Not like (no-duplicate check, 31 Oct 2026)

Checked against `docs/handoff/EXISTING.md` and the sim sources in `acedzn-tools/apps/geography/components/simulations/geography/`.

| Existing game / sim | Its verb | Tilt World instead |
|---|---|---|
| DayNightSpinExplorer (earth-rotation) | drag the Earth disk to spin it; cities light up | the Earth spins on its own at 15°/h; you can't touch it. You run across its surface toward/away from the terminator and commit sleep hours. (World 1) |
| SeasonTiltOrbitLab (earth-revolution) | drag Earth around the Sun / click solstice stations; heat gauges | no orbit control. You buy a limited one-way calendar-train ticket, live with it, and the orbit inset only *shows* where Earth is. You then run to the latitude where the date's event happens. (World 2) |
| MoonPhaseTideLab (moon-and-tides) | drag the Moon around Earth; phase/tide readout | no Moon control. You sleep a committed number of days; the phase and tide follow from elapsed time; you cross a causeway on foot. (World 4) |
| AlbedoBalanceLab (sun-energy) | paint surface tiles, read temperature | no painting and no live temperature readout. You predict the hottest/coolest surface, stand on it, frame, and only then see the thermal photo. (World 3) |
| ClimatographDetectiveLab (climate-zones) | identify a climate from a climograph | no graphs. You measure the noon Sun with the sun sight where you wake up and pick gear for your climate zone; the consequence is felt (melting/freezing). (World 3) |
| Rooftop Radio | parkour courier with a cloth glider, deliveries | no glider (magnetic boots, grind rails along latitude lines), no carrying: you photograph. |
| Slope Sled | build a line, then ride it | no building, no ride phase. |
| Windshift Riders / Basin Breakers / Rush Hour Israel | sailplane / terrain cutting / drawing transport | none of these verbs. |
