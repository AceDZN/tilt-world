# Levels — geography and verified solutions

18 levels in four worlds, defined in `src/game/levels.ts`. Every solution below is played end to end by the scripted player in `tests/levels.test.ts` (`npm test`). The bot uses only player inputs: run, turn, jump, shoot, sleep a chosen number of hours, buy a ticket. The listed wrong strategies are asserted to fail in the same tests. Curriculum links per module are in `CURRICULUM.md`.

Rules that hold everywhere:

- The Earth, Sun and Moon never move by player input. Time only moves forward: the clock, the **sleep pod** (choose hours in advance, or days in World 4; it cannot be cancelled), and **one-way calendar-train tickets** to a date (a limited number per level).
- North is always up and east is to the right; the tutorial says so.
- No political borders. Places are dots, rings and landmarks.

---

## World 1 — הסיבוב העצמי (Earth's rotation)

### 1. הזריחה הראשונה — The first sunrise
- **Geography:** 20°N 0°, 04:40 local time on the March equinox, battery 18%. The dawn line is east of you.
- **Solution:** run east (`W`; the start heading is east) until the Sun clears the horizon, face it, shoot. The test requires that you end east of 5°E.
- **Fails:** waiting in place. The battery dies before the dawn reaches you.
- **Teaches:** the Earth turns west to east, so the dawn sweeps west across the surface; running toward it brings the sunrise sooner.

### 2. השמש "זזה" — The Sun "moves"
- **Geography:** a hill in Jerusalem (31.8°N 35.2°E), before dawn, March.
- **Solution:** shoot the sunrise (azimuth near 90°, east). Sleep to 17:30, shoot the sunset (near 270°, west). The dream asks where the Sun would rise if the Earth spun the other way: plant the tripod facing **west**.
- **Fails:** the tripod facing east.
- **Teaches:** the Sun's apparent path is the Earth's rotation seen from the ground.

### 3. גלישה על הדמדומים — Surfing the twilight
- **Geography:** the 50°N latitude rail from 2°E, just before dawn. Eight film frames sit westward from −10° to −94°.
- **Solution:** jump onto the rail (magnetic boots snap to 50°N) and grind west, but run only while the Sun is above −1°. Pausing lets the twilight band catch up. You collect all 8 frames.
- **Fails:** sprinting flat out the whole way (you run ahead into the night, so max speed without the computation fails), and waiting (the twilight leaves you behind).
- **Teaches:** the terminator moves about 15° of longitude per hour; at 50°N that is a speed you can match on the rail.

### 4. 15° לשעה — 15° an hour
- **Geography:** Accra (5.6°N 0°), whose clock is the one on your HUD, and Dhaka (23.8°N 90°E). The friend wants a photo at 14:00 Dhaka time.
- **Solution:** compute 90° ÷ 15° = 6 h, so 14:00 in Dhaka is 08:00 in Accra. Run to Dhaka, wait until 13:45 local, shoot.
- **Fails:** sleeping until 14:00 on your own watch. You arrive at 20:00 Dhaka time: the city is dark, the friend is asleep (`Z z z` over the city), Tzila's battery runs out and she lies down snoring, and the fail card explains the 6-hour offset. Rushing there and shooting on arrival also misses, because it is too early.
- **Teaches:** each 15° of longitude is one hour of solar time; time zones round that.

### 5. יום הולדת פעמיים — Two birthdays
- **Geography:** Fiji (17°S 178.5°E) and American Samoa (14.3°S 170.7°W), on either side of the date line, 31 October.
- **Solution:** shoot Fiji's 20:00 fireworks. Run east across the date line to Samoa, where the photo says it is **30 October**. Sleep 23 h, then shoot Samoa's 31 October 20:00 fireworks.
- **Fails:** running east forever; you never win the date back by running.
- **Teaches:** the International Date Line; crossing it eastward sets the calendar back a day.

## World 2 — ההקפה ונטיית הציר (Earth's revolution and the tilted axis)

### 6. זה לא המרחק — It's not the distance
- **Geography:** a station near Jerusalem (31.6°N), Mount Hermon (33.4°N), Sydney (33.9°S). One ticket; the options are 21 Mar, 21 Jun, 23 Sep, 22 Dec, and around 20 Jan.
- **Solution:** take the **~20 January** ticket (perihelion, the Earth closest to the Sun). Shoot snow on the Hermon, then run to Sydney and shoot the summer beach.
- **Fails:** the June ticket ("summer is when we are close to the Sun"): no snow on the Hermon. A second ticket is refused.
- **Teaches:** seasons come from the axial tilt, not the distance to the Sun.

### 7. בדיוק מעל הראש — Straight overhead
- **Geography:** ice gates on the 33°E meridian at the equator, the Tropic of Cancer (23.5°N) and 40°N; a station at 12°N.
- **Solution:** the equator gate melts at noon on the equinox (now, with no ticket used). Then take the **21 June** ticket and stand at the Tropic gate at noon.
- **Fails:** the 40°N gate on any date ("בשום תאריך"): the Sun is never vertical north of the Tropic.
- **Teaches:** where and when the Sun's rays are vertical.

### 8. שמש חצות — Midnight sun
- **Geography:** a station at Helsinki (60.2°N), a cabin in Lapland (69°N 21°E), above the Arctic Circle.
- **Solution:** the **21 June** ticket. Run to the cabin, sleep to 23:36, wait for midnight, face the Sun (due north, about 2° up), shoot.
- **Fails:** the December ticket. It is polar night, and the polar bear comes out of the dark.
- **Teaches:** polar day and polar night beyond 66.5°.

### 9. יום שוויון — Equinox day
- **Geography:** stone circles in southern England (51.2°N 1.8°W) and South Africa (25.6°S 30.6°E). One ticket.
- **Solution:** the **21 March** ticket. Shoot the sunset at the southern circle, then the sunrise at the northern one, on the same day. Both see 12 h of light.
- **Fails:** the June ticket. The northern sunrise comes at about 04:00, and the result says the 12-hour symmetry is gone.
- **Teaches:** on the equinox, day equals night everywhere.

### 10. שנה על גבעה אחת — A year on one hill
- **Geography:** a sundial hill in Jerusalem, starting in May (L 120). 12 **unlabeled** tickets, one per 30° of orbit; 5 to spend.
- **Solution:** read the orbit pictures and ride forward to the June solstice, the September equinox, the December solstice and the March equinox. Shoot the noon shadow each time (4 tickets). June's shadow is the shortest; December's is the longest, and both equinoxes fall in between.
- **Fails:** shooting today's shadow; July is not a key date.
- **Teaches:** the Sun's noon height through the year.

## World 3 — השמש כמקור אנרגיה (The Sun as an energy source, climate zones)

### 11. פנס — Flashlight
- **Geography:** Finland (60°N 25°E) on 22 December, battery 25%. The terminator overlay is the hint.
- **Solution:** run south to the **Tropic of Capricorn** (23.5°S). At noon the solar panel's light spot is a perfect circle (a vertical beam). Shoot it, wait for a full battery, shoot the meter.
- **Fails:** the equator. The battery fills, but the spot is an ellipse. Staying in Finland runs the battery out.
- **Teaches:** the angle of incidence decides the energy per area.

### 12. גיליון תרמי — Thermal sheet
- **Geography:** 21 June, near noon. Tel Aviv asphalt, the fields south of it, the Galilee forest, Icelandic lava (64°N) and an Alpine glacier (46.5°N).
- **Solution:** predict, then shoot (the thermal camera turns on only after the shot). The hottest is the TLV asphalt; the urban heat island shot is the fields, about 6 °C cooler than the city; the coolest is the glacier.
- **Fails:** dark lava as the hottest. It is dark, but under a low northern Sun, "and the air is colder".
- **Teaches:** albedo, latitude and the urban heat island.

### 13. איפה אני? — Where am I?
- **Geography:** fogged rounds at 10°N 100°E, 72°N 40°W (Greenland) and 34°S 19°E, on 21 June.
- **Solution:** at noon, read the Sun's height with the sun sight (`Q`), work out the latitude zone, and pick gear 1, 2 or 3 (hot, temperate, polar).
- **Fails:** sunny gear in Greenland. It has sun all day in June but is polar, and the explanation says Tzila froze.
- **Teaches:** climate zones from the Sun's noon height (latitude).

### 14. בריחה מהלילה הקוטבי — Escape from the polar night
- **Geography:** Svalbard (76°N 15°E) on 22 December at 05:00, battery 55%. Latitude rails at 70° and 62°.
- **Solution:** run south to the **62°** rail, jump on, ride east toward noon until the Sun is up, shoot the first light.
- **Fails:** riding the 70° rail. It is north of the Arctic Circle, where the Sun never rises in December, and the explanation names the circle. Standing on the 62° rail and waiting for noon also fails, because the battery drains first.
- **Teaches:** the polar night ends at the Arctic Circle; east brings noon sooner.

## World 4 — הירח, גאות ושפל (The Moon, tides and eclipses)

### 15. מופעי הירח — Phases of the Moon
- **Geography:** a rooftop in Jerusalem, starting near the new moon. The sleep pod can sleep whole days.
- **Solution:** for each of the 7 visible phases, sleep to a night hour when the Moon is up in that phase, face it, shoot. Then declare "ירח מלא בצהריים" impossible (`X`).
- **Fails:** shooting a full moon while the Sun is up: Tzila sulks. Declaring it impossible counts only after the full moon is in the album.
- **Teaches:** phases come from the Sun–Earth–Moon angle; a full Moon is opposite the Sun.

### 16. גאות ושפל — Tides
- **Geography:** a tidal causeway in Brittany, from the mainland (49.9°N) to the fortress island (47°N 1.5°W). Then the Tel Aviv beach.
- **Solution:** sleep days ahead to a **spring low tide** in daylight (the first one is over 4 days away), walk the causeway, shoot from the island. Shoot the Tel Aviv beach, sleep 3 h, shoot it again. The water level changes by less than 0.4 m.
- **Fails:** walking at a neap tide (a wave), and trying to walk around the causeway (the whole tidal flat floods).
- **Teaches:** spring and neap tides follow the Moon's phase; the Mediterranean's tides are tiny.

### 17. ליקוי חמה — Solar eclipse
- **Geography:** a station at 0° 0°. Tickets to the next 6 new moons; 2 to spend. The orbit pictures show the Moon's tilted ring and its node line.
- **Solution:** choose the one new moon that falls within about 12° of the node line. Sleep to the hour the shadow touches the dayside, then chase the shadow and shoot inside it with the Sun up.
- **Fails:** just taking the next new moon. The Moon passes "above/below the Sun" because its orbit is tilted 5°.
- **Teaches:** an eclipse needs a new moon on the nodes, not every new moon.

### 18. לוח השמיים — The sky calendar (finale)
- **Geography:** Jerusalem around Passover. Unlabeled tickets to the next full moons; no hints.
- **Solution:** pick the first full moon after the spring equinox. Sleep to the lunar eclipse at that full moon and run to the night side where the Moon is high to shoot it. Return to Jerusalem and shoot the full moon at night, then the sunrise.
- **Fails:** the full moon before spring. It is not Passover's moon and has no eclipse.
- **Teaches:** the Hebrew calendar ties Passover to the spring full moon, and a lunar eclipse happens only at full moon.

---

## Random replay quests (menu: 🎲 משימת צילום אקראית)

`src/game/quests.ts` builds a fresh photo quest from a seed, using a named place, one ticket and four dates on the board. There are two kinds:

- **Long day:** a long sunset in the south, which needs the southern summer.
- **Overhead:** a Sun at the zenith somewhere in the tropics, which needs one of that latitude's two zenith dates.

Before a quest is served, it is played through the sim with every ticket. It is kept only if:

- exactly one ticket wins;
- "always take the June ticket" loses;
- "run east forever and shoot at the target" loses.

`tests/quests.test.ts` checks this across seeds. Stars from quests are not saved.
