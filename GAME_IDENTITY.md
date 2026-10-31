# Tilt World — עולם נטוי — game identity

A pocket-sized Earth you can sprint around in under a minute. You are **צילה** (Tzila), a solar-powered photographer robot with a big lens and a bigger ego. The galaxy's sky-photo magazine sends you photo orders: the first sunrise, the midnight sun, a noon Sun straight overhead, a birthday celebrated twice, a tide-pool path that opens only at low tide, a total eclipse. Running fast never wins. You win by working out **where and when**.

## First minute

1. **0–5 s.** Black screen, a lens shutter opens. You're standing on the night side of a tiny glowing Earth: city lights, stars, and a thin orange line, the dawn, on the horizon to your right (east). The battery icon blinks low. One Hebrew line: "השחר מגיע ממזרח. רוצי לקראתו!" ("The dawn comes from the east. Run to meet it!") and an arrow pointing east.
2. **5–20 s.** You run (WASD or arrows, or the left thumb on touch). The planet rolls under you, the sky lightens and the twilight band sweeps toward you. Crossing into the orange band gives the **dawn boost** (speed trail, panels hum, battery fills).
3. **20–30 s.** The Sun breaks the horizon. A frame appears; you press **E / the shutter button**. Flash pop, lens flare, a Polaroid slides into the album with stars. One line explains: "רצת 20° מזרחה, אז הזריחה הגיעה אלייך שעה ורבע מוקדם יותר."

## Controls

| Action | Keyboard (event.code) | Touch |
|---|---|---|
| Run | WASD / arrows | left virtual stick |
| Jump / glide (hold in air) | **Space** | jump button |
| Shoot photo | **E** or **Enter** | big shutter button |
| Fast-forward time (hold) | **T** | clock button (hold) |
| Orbit dial (date) | **[** and **]** (BracketLeft/Right) | orbit dial widget |
| Moon dial | **,** and **.** (Comma/Period) | moon dial widget |
| Plant tripod (aim + wait) | **P** | tripod button |
| Lat/long grid toggle | **G** | grid button |
| Hint (costs a star) | **H** | bulb button |
| Pause / mute / fullscreen / restart | **Escape**, **M**, **F**, **R** | top bar |
| Camera orbit | mouse drag / two-finger drag | — |

North is always "up" on the mini-map and the compass, east is to the right. Level 1 says so on screen.

## The decision

Every level is one photo order: **place + sky event + constraint**. The player decides **where to stand** (latitude, longitude, surface), **when** (local time, by running or fast-forwarding), and from World 2 on **what date** (orbit dial) and from World 4 **which night of the month** (Moon dial). The budget is game-hours (a film-light ribbon) plus a few dial turns, and it's always smaller than "run around until you see it".

## What changes

- The Sun's direction, the terminator and the twilight band move 15° per game-hour, computed by the pure astronomy module.
- The orbit dial moves Earth around the Sun in a picture-in-picture view; the tilted axis leans toward or away from the Sun, and on the globe the lit cap, snow and day length change.
- The Moon swings around; its phase, rise time and the tides follow the Moon dial and the clock.
- Battery charge = f(Sun elevation, surface albedo, cloud). Night drains it.

## Mistake and retry

The world plays the consequence, never a red X:
- wrong longitude/time → you arrive in darkness, the battery dies, Tzila curls up and snores until a rescue drone arrives;
- wrong date → the midnight sun never shows and a polar bear steals your tripod;
- wrong Moon phase/time → the causeway is underwater and a wave washes you off.

Then a **replay** card: the globe from space with the terminator and the Sun angle, and one Hebrew line explaining the rule ("Dhaka is 90° east of you: 6 hours ahead"). Retry restarts the level instantly (R), keeping what you learned. Hints (H) highlight the relevant line (terminator, target meridian, a tropic) but never the answer, and cost a star.

## Win

The shot: a flash pop, the photo slides into the album, and stars for shot quality (Sun elevation/framing), dial turns used and hints used. Each world ends with a transfer level where the environment changes and the labels disappear.

## Replay

Star ratings and best-time per level; an album of every shot; after a world is cleared, **generated photo orders** from the solver (random city pairs, dates and sky events), each verified solvable in its budget, where "run east forever" and "always set June" fail.

## Camera

Third-person chase camera above and behind Tzila, with gravity toward the planet's centre (Mario Galaxy style). The horizon curves; you can see about a third of the planet. During a dial turn the camera pulls back to space so you see the whole globe, the terminator and the orbit inset. The photo frame is a first-person viewfinder.

## Art

A jewel-box planet against a deep starfield: oceans with specular glints, cloud wisps, snow caps that grow with the season, city lights on the night side, a crisp terminator with an orange twilight band, a Moon swinging by. Continents from Natural Earth (public domain), stylized but accurate. Tripo models: Tzila (rigged), polar bear (rigged), tripod, landmark miniatures. Rubik font, chunky rounded HUD, RTL.

## Sound

Procedural WebAudio: a soft hum when panels charge, a rising chord at dawn, a shutter click and flash pop, a snore loop when frozen, wave crash, fireworks. Mute with M.

## Not this

No quiz gates, no delivery loop, no glowing answer path. The dials are the verbs; the sky is the feedback.
