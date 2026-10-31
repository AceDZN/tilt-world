# Tilt World — עולם נטוי — build handoff

Read `../COMMON.md` first. Repo `/Users/acedzn/dev/AceDZN-exp/tilt-world` → public `AceDZN/tilt-world`, port 5242 (preview 4242).

## Promise

A pocket-sized Earth, Super Mario Galaxy / Outer Wilds style: you can sprint around it in under a minute. Real continents and oceans, a real Sun throwing a sharp day/night line (the terminator) across it, and a Moon swinging by. You're **צילה**, a solar-powered photographer robot with a big lens and a bigger ego, collecting the most spectacular sky shots in the solar system: the first sunrise over Mount Fuji, the midnight sun in Lapland, the noon Sun straight overhead on the Tropic of Cancer, a double birthday across the date line, the tide-pool path that only opens at spring tide, a total solar eclipse. Your panels charge in sunlight and drain in the night; dawn gives a speed boost; polar night freezes you solid. The Earth spins west→east at its fixed rate and you can never spin it, drag it or move it along its orbit. Time only goes forward, and you move through it by committing: sleep a number of hours, or take one ticket on the calendar train to a chosen date. Running fast never wins a level. You win by working out **where and when** the event happens, committing to it, and getting there: longitude → time, date + latitude → day length and Sun angle, days since the new moon → phase and tide.

**Not like the existing games.** Workbook's own module sims already cover these topics by direct manipulation. **DayNightSpinExplorer** spins the Earth disk by dragging. **SeasonTiltOrbitLab** drags Earth around the Sun to the solstice/equinox stations. **MoonPhaseTideLab** drags the Moon around the Earth. **AlbedoBalanceLab** paints surface tiles to balance temperature. **ClimatographDetectiveLab** identifies a climate from a graph. Tilt World must never use those verbs: no spinning or dragging the Earth, the Sun or the Moon, no orbit or Moon dials, no scrubbing time, no tile painting, no reading climographs. Also stay clear of Rooftop Radio's courier glider (`~/dev/AceDZN-exp/rooftop-radio`): no cloth glider and no delivery loop. You photograph; you never carry things.

Map evidence: Outer Wilds × Solar Ash (related, density 0.617), the second-emptiest pair measured; Outer Wilds × Astroneer (0.677) and KSP × Outer Wilds (0.679) are alternatives. It's not a runner or a courier loop: each level is a single spatial-temporal puzzle on a planet you move around in 3D, with platforming in between.

## Curriculum (Workbook grade 8, chapters 2 and 3)

Grade 8 ch. 2: [earth-rotation](https://geography.workbook.co.il/grade-8/chapter-2/earth-rotation), [earth-revolution](https://geography.workbook.co.il/grade-8/chapter-2/earth-revolution), [moon-and-tides](https://geography.workbook.co.il/grade-8/chapter-2/moon-and-tides).
Grade 8 ch. 3: [sun-energy](https://geography.workbook.co.il/grade-8/chapter-3/sun-energy) (radiation angle, albedo, radiation balance), [climate-zones](https://geography.workbook.co.il/grade-8/chapter-3/climate-zones) (why the equator is hot all year). Optional link: [solar-system](https://geography.workbook.co.il/grade-8/chapter-1/solar-system).
Snapshots are in `/Users/acedzn/idea-plotter/reports/geography-games-2026-10-31/curriculum/`.

Rules, from the modules (pure TS astronomy; render only reads it):
- **Rotation:** Earth turns west→east about once in 24 h, **15° per hour**. That gives day and night, the twilight zone (אזור דמדומים), and the Sun's apparent motion (תנועה מדומה): it rises in the east and sets in the west. If the spin were reversed, the Sun would rise in the west (a module question; make it a "mirror world" level).
- **Time zones:** 24 zones, 1 hour per 15° of longitude, with the **international date line** near 180° in the Pacific (it runs through ocean so it doesn't split land). Model: local solar time = UTC + longitude/15. Civil zones are simplified 15° bands, with real offsets stated per level. **DST caveat:** Workbook's module says Tel Aviv–Tokyo is "about 6 hours" (Israeli summer time); standard time is 7. Any level using real cities states the season and the offset rule on screen, and the solver uses the same rule.
- **Revolution and tilt:** the axis is tilted **≈ 23.5°**. Seasons come from the tilt (the radiation angle and day length), **not** from distance. Workbook's evidence: the hemispheres have opposite seasons at the same time, and Earth is closer to the Sun in January. Solar declination: +23.5° at the June solstice (~21 June), 0 at the March/September equinoxes (12:12 everywhere), −23.5° at the December solstice (~22 Dec). Tropic of Cancer/Capricorn at ±23.5°. Israel is at about 31–33° N: ~14 h of light at the June solstice, Oslo ~18 h, and the sun doesn't set near the Arctic Circle in June. Day length comes from the standard sunrise-equation (cos H = −tan φ · tan δ), clamped for polar day and night. Noon Sun elevation = 90° − |φ − δ|.
- **Radiation angle and energy:** a vertical beam concentrates on a small area and heats strongly, an oblique beam spreads and heats less (the flashlight analogy in the module). **Albedo:** snow and ice reflect, dark asphalt and forest absorb; cities are warmer than the countryside (urban heat island). **Radiation balance:** absorbed short-wave vs. emitted long-wave; if more is absorbed than emitted, temperature rises (the greenhouse link). Panel charge = f(sun elevation, surface albedo, cloud) from one pure module.
- **Moon:** the phases come from seeing different parts of the Moon's lit half (not Earth's shadow), about a 29.5-day cycle, from new moon (מולד) to full and back. Eclipses need alignment, and the Moon's orbit is tilted **≈ 5°**, so they don't happen every month. Solar eclipse at a new moon, lunar at a full moon. **Tides:** the Moon's pull makes two bulges; the Mediterranean tide is only ~20–40 cm, and open-ocean coasts get metres (the module says 10–15 m in places). Spring/neap tides (sun–moon alignment): check that the module covers them; otherwise label them העשרה. **The Hebrew calendar** combines Moon and Sun (Rosh Chodesh near the new moon; Pesach stays in spring), a module topic.
- Hebrew terms: סיבוב עצמי, תנועת הקפה, ציר כדור הארץ, נטיית הציר, יום ולילה, אזור דמדומים, תנועה מדומה, אזורי זמן, קו התאריך הבין-לאומי, קו אורך, קו רוחב, קו המשווה, חוג הסרטן, חוג הגדי, חוג הקוטב, יום שוויון, יום היפוך, זווית קרינה, אלבדו, מאזן קרינה, קרינה קצרת גל / ארוכת גל, מופעי הירח, מולד, ירח מלא, ליקוי חמה, ליקוי לבנה, גאות ושפל.

Misconceptions to catch: seasons come from distance to the Sun; it's summer everywhere at once; the Sun "moves" around Earth; time is the same everywhere; going east means going back in time; equinox means the Sun is overhead everywhere; the Moon's phases come from Earth's shadow; there's an eclipse every month; a bright surface heats more.

## Loop and controls

- **Planet run:** third-person platforming on the tiny globe (gravity toward the center, a camera that orbits smoothly), with run, jump, magnetic boots on steep slopes, and grind rails along the latitude lines and the tropics. A lat/long grid can be toggled. North is always "up" on the mini-map and the compass, with east to the right, and a tutorial line says this explicitly.
- **Time, by commitment only:** the **world clock** (UTC, plus local time wherever you stand) is read-only. The **sleep pod** lets you sleep a number of hours or days that you choose *before* you see the result. The **calendar train** stations sell one-way tickets to a date (solstices, equinoxes, a given day of the month), limited per level. You predict, commit, then live with the outcome; there is no scrubbing and no undo except restarting the level. Most levels give you less game-time than a naive "run until you see it" strategy needs.
- **Photo quest:** each level asks for a shot (place + event + constraint). You must be at the right spot, at the right local time, on the right date, then frame and shoot. Stars for the shot's quality (Sun elevation, framing), the dial turns used and hints.
- **Consequences:** wrong longitude → you arrive in darkness and the batteries die (the robot curls up and snores until rescue). Wrong ticket → the midnight sun never shows and a polar bear steals your tripod. Slept the wrong number of days → the tide-pool path is underwater and you get washed off. A replay shows the terminator and the Sun's angle, plus one Hebrew line ("Tokyo is 105° east of you: 7 hours ahead in winter").
- Hint (logged, costs a star): highlights the relevant line on the globe (the terminator, the meridian at the target, the tropic) but never the answer.

## Levels (author exactly; tests prove each; 18 total)

**World 1 — Spin · הסיבוב העצמי** (earth-rotation)
1. **First sunrise:** night side, the dawn line approaching. Run *east* to meet the sunrise sooner and shoot it (tutorial, with arrows).
2. **The sun "moves":** shoot the Sun rising in the east and setting in the west from one hill. Then the mirror-world twist: in a dream level the spin reverses and you have to predict where it will rise.
3. **Surf the twilight:** ride the terminator around the planet, staying in the dawn boost zone; drift into night and you lose power.
4. **15° an hour:** a friend in a city 90° east calls at 08:00 your time. Is it rude to call back now? Be at the friend's city when it's 14:00 there for the shot. (Compute the 6-hour offset, then travel.)
5. **Transfer, the date line:** a birthday on a Pacific island. Celebrate it twice by crossing the date line at the right moment. A different look: ocean, night, fireworks.

**World 2 — Orbit and Tilt · ההקפה ונטיית הציר** (earth-revolution)
6. **It's not the distance:** the magazine wants snow on Hermon and a beach in Sydney on the same day. Choose the one ticket that gives both (January, when Earth is actually *closest* to the Sun). The picture-in-picture orbit view shows where Earth is; you can't move it.
7. **Straight overhead:** melt the ice gate with a vertical noon Sun. Choose the date ticket (21 June) and run to the right latitude (Tropic of Cancer); a wrong date or latitude leaves a long shadow.
8. **Midnight sun:** a Lapland shot at 00:00 with the Sun above the horizon. Choose the ticket. In December you get polar night and the robot freezes.
9. **Equinox:** 12 h light / 12 h dark everywhere. With one ticket, light a stone circle at sunrise and at sunset in two hemispheres on the same day.
10. **Transfer, a year on one hill:** stay in Israel. With four tickets, shoot four noon Suns (two solstices, two equinoxes), reading the shadow length on the town's sundial each time. Day length is shown only as the sundial's shadow.

**World 3 — The Sun as Engine · השמש כמקור אנרגיה** (sun-energy, earth-revolution)
11. **Flashlight:** your panels charge in proportion to how vertical the rays are, and the beam patch on the ground grows as the angle drops. Charge to 100 % before nightfall by choosing which latitude to sprint to on a given date.
12. **Thermal issue:** the magazine wants a thermal-camera shot of the warmest and coolest ground at noon. Predict which surface will be hottest (snowfield, dark lava, forest, city asphalt) and frame it before you switch the thermal view on. Then shoot the urban heat island over Tel Aviv vs. the fields outside it.
13. **Where am I?** You wake up somewhere unknown on a stated date. Measure the noon Sun's height with the camera's sun sight, work out your latitude and climate zone (tropical, temperate or polar, which the tilt creates), pick the right gear (sun hat or parka) and head for the event.
14. **Transfer, polar night escape:** 22 December, the Arctic, batteries low. Choose the direction and the rail that bring you to daylight before the battery dies. Day length by latitude is the only way out.

**World 4 — The Moon · הירח** (moon-and-tides)
15. **Phases:** shoot each phase from the same rooftop in Israel. Between shots, choose how many days to sleep (new → first quarter ≈ 7, → full ≈ 15). Then the magazine asks for a full moon at noon; it's impossible, and the robot sulks.
16. **Tides:** cross an ocean tide-pool causeway at low tide (metres of tide) by choosing the hours to sleep. Then a Mediterranean beach where the tide is only 20–40 cm, so timing barely matters there.
17. **Eclipse:** why not every month? The 5° tilt of the Moon's orbit. With limited tickets, choose the new moon that is also on the Sun–Earth line, and frame the total solar eclipse.
18. **Final, the sky calendar (no hints):** the night before Pesach. Find the full moon of spring, a sunrise shot in Jerusalem, and an eclipse elsewhere on the globe, with limited game-time, sleep and tickets; nothing is labeled.

After the authored levels work, add generated photo quests from a solver (random city pairs, dates and sky events). Verify each is solvable in the time budget, and verify that "run east forever" and "always take the June ticket" fail.

## 3D and art

A jewel-box planet against a deep starfield: oceans with specular glints, cloud wisps, snow caps, city lights on the night side, a crisp terminator with an orange twilight band, and the Moon swinging by. The continents come from public-domain data (Natural Earth for coastlines and NASA Blue Marble-style color, bundled and stylized); keep the geography accurate. Procedural latitude/longitude/tropic/date-line overlays that match the astronomy module exactly. Tripo (search the library and assets first, then generate): **צילה**, a rigged photographer robot (Mixamo: idle, run, jump, grind pose, snap photo, freeze/sulk), a **rigged polar bear** (quadruped), a tripod/camera prop, landmark miniatures (Mount Fuji, a Lapland cabin, Jerusalem walls, the Sydney beach, a stone circle, the greenhouse dome), and the tide-pool causeway, the sleep pod and the calendar-train station.

## Acceptance

In the first 30 seconds: wake on the night side, see the dawn line coming, run east into it with the boost, and snap the first sunrise with a lens flare and a big photo-flash pop. Then in Level 4, call at the wrong offset on purpose and arrive at a dark city, with the robot snoring and the one-line explanation. All sun position, day length, time zone, radiation and Moon/tide results come from the pure modules. Tests cover all 18 levels, the DST rule, that no control can rotate or move the Earth, Sun or Moon, polar day/night, the equinox 12:12, the 5° eclipse condition, and that maximum running speed without the computation fails the time budget.
