# Tilt World — curriculum map

Every authored level maps to the Workbook grade 8 geography modules (Israeli curriculum as published by Workbook). Scope authority: the snapshots in `docs/curriculum/`. Module URLs are exactly the ones in those snapshots. None are invented.

| Module | URL | Snapshot |
|---|---|---|
| earth-rotation (הסיבוב העצמי) | https://geography.workbook.co.il/grade-8/chapter-2/earth-rotation | `docs/curriculum/grade-8_chapter-2_earth-rotation.md` |
| earth-revolution (תנועת ההקפה ועונות השנה) | https://geography.workbook.co.il/grade-8/chapter-2/earth-revolution | `docs/curriculum/grade-8_chapter-2_earth-revolution.md` (and its duplicate `g8-seasons.md`) |
| moon-and-tides (הירח: מופעים, ליקויים וגאות ושפל) | https://geography.workbook.co.il/grade-8/chapter-2/moon-and-tides | `docs/curriculum/grade-8_chapter-2_moon-and-tides.md` |
| sun-energy (השמש כמקור אנרגיה ומאזן הקרינה) | https://geography.workbook.co.il/grade-8/chapter-3/sun-energy | `docs/curriculum/grade-8_chapter-3_sun-energy.md` (and its duplicate `g8-sun.md`) |
| climate-zones (אזורי אקלים בעולם) | https://geography.workbook.co.il/grade-8/chapter-3/climate-zones | `docs/curriculum/grade-8_chapter-3_climate-zones.md` |
| solar-system (optional background) | https://geography.workbook.co.il/grade-8/chapter-1/solar-system | `docs/curriculum/grade-8_chapter-1_solar-system.md` |

**What we don't claim.** We don't claim Ministry of Education approval and we don't claim learning gains: no student evaluation has been run. Levels, numbers and tuning values are ours. "Transfer evidence" below means what a level *asks the player to do* in a changed situation, not measured learning.

**Distinctness (EXISTING.md).** Workbook's module sims already teach these topics by direct manipulation (DayNightSpinExplorer spins the Earth, SeasonTiltOrbitLab drags it round the orbit, MoonPhaseTideLab drags the Moon, AlbedoBalanceLab paints tiles, ClimatographDetectiveLab reads climographs). In Tilt World the player never rotates or moves the Earth, Sun or Moon and never scrubs time. They change only **where they stand** (running on the planet) and **when they are**, by committing forward through the sleep pod (N hours/days chosen before seeing the result) or a one-way calendar-train ticket. The model then computes the sky.

**Status.** All 18 levels are mapped against `src/game/levels.ts` at commit bae0bdd plus the World 1 string fixes from `docs/curriculum/REVIEW.md` Part C. Hebrew feedback is quoted verbatim. Where REVIEW.md Part E recommends a change to a quoted line, the row says so (e.g. "→ E7b"). Structural facts (worlds, transfer levels, hints, budgets, ticket rules, coordinates) are checked by `tests/curriculum.test.ts`.

Column key: **State/action:** what the player changes → what the model changes. **Feedback:** Hebrew lines the student sees, quoted from `levels.ts`. **Transfer:** what is new compared with the earlier levels.

---

## World 1 — הסיבוב העצמי (earth-rotation)

Module: https://geography.workbook.co.il/grade-8/chapter-2/earth-rotation

### 1. הזריחה הראשונה — First sunrise
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/earth-rotation
- **Skill:** the Earth turns west → east at 15° per hour. The dawn (אזור הדמדומים) moves west, so running east meets the sunrise sooner.
- **Scenario:** tropical night side (20° N, 0°), the battery at 18 %, a dawn band approaching. Shoot the first sunrise before the battery dies.
- **State/action:** the player changes longitude by running. The model gives local solar time = UTC + lon/15, the Sun's elevation from `sunPosition`, and battery drain at night and charge in light.
- **Feedback:**
  - Tutorial: „צפון תמיד למעלה במצפן ובמפה, ומזרח מימין." / „השחר מגיע ממזרח. רוצי לקראתו! (W או ↑)"
  - Misses: „השמש עוד מתחת לאופק — עוד לא זריחה." / „זו שקיעה, לא זריחה!"
  - Hint: „הרצועה הכתומה היא אזור הדמדומים. היא זזה מערבה — לכיוונך."
  - Failure: „השחר זז רק 15° בשעה, והסוללה נגמרה לפני שהגיע אלייך. ריצה מזרחה, לקראתו, מקדימה את הזריחה."
  - Rule card: „בסיבוב העצמי כדור הארץ מסתובב ממערב למזרח, 15° בשעה. ריצה מזרחה מקדימה את הזריחה."
- **Misconception:** the Sun "comes up" by itself at a fixed time everywhere (time is the same everywhere).
- **Transfer evidence:** none (tutorial). It sets up the east = earlier-sunrise relationship used in level 4.

### 2. השמש "זזה" — The Sun "moves" (and the mirror dream)
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/earth-rotation
- **Skill:** apparent motion (תנועה מדומה). The Sun rises in the east and sets in the west because the Earth turns west → east. With a reversed spin it would rise in the west (Workbook's own question).
- **Scenario:** one hill in Jerusalem on the equinox. Shoot the sunrise and the sunset, then in a dream the spin reverses and the player plants a tripod facing where the Sun will rise.
- **State/action:** the player chooses a facing and the moment of the shot. The model gives the Sun's azimuth/elevation, and with `spin = −1` in the dream the subsolar point moves east.
- **Feedback:**
  - Tutorial: „תא השינה (Z): בחרי כמה שעות לישון — ואז אין חרטות." / „אחרי שני הצילומים תחלמי: כדור הארץ יסתובב הפוך. הציבי חצובה (P) לכיוון שבו לדעתך תזרח השמש."
  - Misses: „זה לא רגע זריחה או שקיעה." / „השמש לא בפריים — לאן הסתכלת?"
  - Dream miss: „בעולם ההפוך השמש זרחה במערב — והחצובה הסתכלה לכיוון אחר."
  - Success: „בעולם ההפוך הסיבוב התהפך — והשמש זרחה במערב!"
  - Rule card: „השמש לא זזה: כדור הארץ מסתובב ממערב למזרח, ולכן השמש נראית עולה במזרח ושוקעת במערב (תנועה מדומה)."
- **Misconception:** the Sun moves around the Earth.
- **Transfer evidence:** the dream reverses the cause (the spin direction), so a remembered fact ("east") fails. Only the causal rule predicts west.

### 3. גלישה על הדמדומים — Surf the twilight
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/earth-rotation
- **Skill:** the twilight zone is the moving boundary between day and night. It moves west 15° of longitude per hour.
- **Scenario:** a rail along 50° N. Eight film tokens develop only inside the twilight band (Sun between −6° and +6°). Run ahead into the night and the battery dies; fall behind and the band leaves you.
- **State/action:** the player sets their pace and direction along the rail. The model gives the light class (`lightAt`), the battery, and the dawn boost while the Sun rises through the band.
- **Feedback:**
  - Failure (ran ahead): „גלשת אל הלילה: ממערב לאזור הדמדומים עדיין לילה. הקו זז 15° בשעה — חכי לו, אל תברחי ממנו."
  - Failure (too slow): „הדמדומים התרחקו ממך. הם זזים מערבה 15° בשעה — צריך לשמור על הקצב."
  - Rule card: „אזור הדמדומים נע מערבה 15° אורך בשעה. כדי להישאר בו צריך לנוע מערבה באותו קצב."
- **Misconception:** day and night switch everywhere at once, or "the dark comes down from the sky".
- **Transfer evidence:** the same 15°/h rule, now as a pace to match instead of a direction to run.

### 4. ‏15° לשעה — Fifteen degrees an hour
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/earth-rotation
- **Skill:** time zones: 1 hour per 15° of longitude, east is later. Compute the offset, then act on it.
- **Scenario:** at 06:00 in Accra (0°), a friend in Dhaka (90° E) asks for a photo "at 14:00 my time". The player's clock shows only Accra time.
- **State/action:** the player chooses when to travel and when to shoot. The model gives local solar time at the player's position and the Sun's elevation (night in Dhaka if the player waits for 14:00 on their own clock).
- **Feedback:**
  - Misses: „בדאקה עכשיו לילה. השוק סגור והחבר הלך לישון." / „השעה בדאקה עכשיו ‎${hh:mm}‎, לא 14:00."
  - Failure: „דאקה נמצאת 90° מזרחה ממך: השעון שם מקדים ב-6 שעות. כשבשעון שלך 14:00, בדאקה כבר 20:00 — לילה." (times computed from the moment of failure)
  - Rule card: „כל 15° מזרחה השעון מקדים בשעה אחת: 90° = 6 שעות. (במשחק כל אזור זמן הוא רצועה של 15° בדיוק; גם במציאות אקרה UTC+0 ודאקה UTC+6.)"
- **Misconception:** time is the same everywhere.
- **Note:** this mirrors Workbook's Tel Aviv–Tokyo call question, but uses a pair whose 6 h gap holds all year (UTC+0 / UTC+6). Workbook's "about 6 hours" for Israel–Japan is summer time only; see the DST rule below.
- **Transfer evidence:** the player must convert between two clocks rather than just run east.

### 5. יום הולדת פעמיים — Transfer: the date line
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/earth-rotation
- **Skill:** the international date line (קו התאריך הבין-לאומי). Crossing it eastward sets the *date* back one day but doesn't move you back in time.
- **Scenario:** a birthday on 31 October. Fireworks at 20:00 in Fiji (178.5° E), then cross to American Samoa (170.7° W) and celebrate again at 20:00 on the same date. Ocean, night and fireworks: a changed look.
- **State/action:** the player crosses the 180° meridian and commits to a sleep duration. The model gives `localDayIndex(utc, lon)` (date) and local time.
- **Feedback:**
  - Miss: „כאן עכשיו 30 באוקטובר — יום לפני יום ההולדת: חצית את קו התאריך מזרחה, והתאריך חזר ביום. מתי יגיע לכאן הערב של 31 באוקטובר?"
  - Miss: „כאן כבר 1 בנובמבר — יום ההולדת נגמר."
  - Failure: „חציית קו התאריך מזרחה מחזירה את התאריך ביום — אבל את לא חוזרת בזמן. צריך לחכות שהערב של 31 באוקטובר יגיע לסמואה."
  - Rule card: „קו התאריך הבין-לאומי עובר באוקיינוס (במשחק: בדיוק לאורך קו אורך 180°; במציאות הוא מתעקל סביב איים). מי שחוצה אותו מזרחה מחזירה את התאריך ביום — אבל לא חוזרת בזמן."
- **Misconception:** going east means going back in time. Also "the date is the same everywhere".
- **Transfer evidence:** no hint needed for the hour rule. The player meets a *date* change (a new variable), and "run east forever" doesn't win (tested in `tests/levels.test.ts`).

---

## World 2 — ההקפה ונטיית הציר (earth-revolution)

Every World 2 level: https://geography.workbook.co.il/grade-8/chapter-2/earth-revolution. Time moves only through the sleep pod (up to 24 h) and one-way calendar-train tickets bought at a station. A ticket keeps the time of day.

### 6. זה לא המרחק — It's not the distance
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/earth-revolution (background contrast: https://geography.workbook.co.il/grade-8/chapter-1/solar-system, where planet temperature does follow distance)
- **Skill:** seasons come from the axial tilt, not from distance. Workbook's two pieces of evidence: the hemispheres have opposite seasons, and Earth is closest to the Sun in January.
- **Scenario:** snow on Hermon and a summer beach in Sydney on the same date. One ticket (21 Mar, 21 Jun, 23 Sep, 22 Dec or 20 Jan).
- **State/action:** the player picks one date ticket and runs between the two places → the model gives `monthlyTemperature` at 33.4° N and 33.9° S, and the Sun's elevation.
- **Feedback:**
  - Brief: „צלמי שלג על החרמון וחוף קיצי בסידני — באותו תאריך. בתחנה יש כרטיס אחד לרכבת הלוח."
  - Misses: „ב-‎${date}‎ אין שלג על החרמון." / „ב-‎${date}‎ בסידני לא קיץ — החוף ריק וקר." / „שתי התמונות צריכות להיות מאותו תאריך."
  - Hint: „הנקודה שבה השמש בדיוק מעל הראש מסומנת. באיזה חצי כדור היא בינואר?" (→ E6b: names the month)
  - Rule card: „העונות נובעות מנטיית הציר, לא מהמרחק: בינואר כדור הארץ הכי קרוב לשמש — וזה חורף בחצי הצפוני וקיץ בחצי הדרומי."
- **Misconception:** seasons come from distance; it's summer everywhere at once.
- **Transfer evidence:** none (first World 2 level). Note: the 21 March ticket currently passes too (→ E6a).

### 7. בדיוק מעל הראש — Right overhead
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/earth-revolution
- **Skill:** the Sun is at the zenith only between the tropics: over the equator on the equinox, over the Tropic of Cancer on 21 June.
- **Scenario:** ice gates at 0°, 23.5° N and a 40° N decoy. A vertical noon Sun (≥ 87°) melts a gate. The level starts on 21 March; one ticket.
- **State/action:** latitude by running + one date ticket + sleep to noon → noon elevation and shadow.
- **Feedback:**
  - Brief: „המיסי שני שערי קרח בקרן שמש אנכית (בלי צל): השער במשווה והשער בחוג הסרטן. כרטיס אחד."
  - Miss: „השמש כאן ‎${elev}‎° מעל האופק. גם בצהריים של ‎${date}‎ היא תגיע רק ל-‎${noon}‎° — הקרניים אלכסוניות, הצל ארוך והקרח לא נמס."
  - Decoy: „ב-40° צפון השמש אף פעם לא מגיעה לזנית — גם לא ב-21 ביוני. הצל נשאר." (→ E7a: leaks the date)
  - Hint: „הנקודה שבה השמש בזנית מסומנת. היא זזה עם התאריך — לא עם השעה." (→ E7b: false, the point moves west every hour)
  - Rule card: „השמש עומדת בזנית רק בין חוג הסרטן לחוג הגדי: ביום השוויון מעל קו המשווה, ב-21 ביוני מעל חוג הסרטן (23.5° צפון)."
- **Misconception:** the Sun is overhead everywhere on the equinox, or overhead in Israel in summer.
- **Transfer evidence:** none.

### 8. שמש חצות — Midnight Sun
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/earth-revolution
- **Skill:** polar day north of the Arctic Circle in June, polar night in December.
- **Scenario:** a Lapland cabin at 69° N at 00:00 with the Sun above the horizon. One ticket. In the dark, a polar bear steals the tripod.
- **State/action:** a date ticket + sleep to midnight → `dayKind`, midnight Sun elevation (+2.5° in June).
- **Feedback:**
  - Misses: „השעה כאן ‎${hh:mm}‎ — זו לא חצות." / „בחצות של ‎${date}‎ השמש ‎${deg}‎° מתחת לאופק." (→ E8a: prints "-0°") / „השמש לא בפריים. בחצות היא בצפון."
  - Bear: „ב-‎${date}‎ יש בלפלנד לילה קוטבי: השמש לא עולה כלל. בחושך, דב הקוטב גנב את החצובה."
  - Hint: „חוג הקוטב הצפוני מסומן. מתי הוא כולו בצד המואר?"
  - Rule card: „ביוני הקוטב הצפוני נוטה אל השמש: מצפון לחוג הקוטב (66.5°) השמש לא שוקעת. בדצמבר יש שם לילה קוטבי."
- **Misconception:** every place has a day and a night every day.
- **Transfer evidence:** none.

### 9. יום שוויון — Equinox
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/earth-revolution
- **Skill:** on the equinox there are 12 h of light and 12 h of dark everywhere, in both hemispheres.
- **Scenario:** stone circles in England (51° N) and South Africa (26° S). Light one at sunrise and the other at sunset on the same day. One ticket (21 Mar, 21 Jun or 23 Sep; the level starts on 22 Dec).
- **State/action:** a ticket + travel between hemispheres → `dayLength` at each circle (must be 12 h ± 15 min).
- **Feedback:**
  - Miss: „האור כאן נמשך היום ‎${h}‎ שעות. האבנים נדלקות רק ביום של 12 שעות אור ו-12 שעות חושך."
  - Misses: „שני הצילומים צריכים להיות באותו יום." / „הצילום השני צריך להיות בחצי הכדור השני."
  - Hint: „הסתכלי על קו הדמדומים מהחלל: מתי הוא עובר בדיוק דרך שני הקטבים?"
  - Rule card: „ביום השוויון (21 במרץ, 23 בספטמבר) קו הדמדומים עובר דרך שני הקטבים: 12 שעות אור ו-12 שעות חושך בכל מקום."
- **Misconception:** it's summer everywhere at once; the equinox means "the Sun overhead".
- **Transfer evidence:** none.

### 10. שנה על גבעה אחת — A year on one hill (transfer)
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/earth-revolution
- **Skill:** the noon shadow through the year: shortest at the June solstice (0.15 × the stick), longest in December (1.44 ×), in between at the equinoxes (0.62 ×).
- **Scenario:** one hill in Jerusalem. Five unlabeled monthly tickets for four shots, no clock, no month names: only the sundial's shadow.
- **State/action:** forward-only tickets (arriving at 11:24 local) → the noon shadow length.
- **Feedback:**
  - Brief: „בלי לעזוב את הגבעה: צלמי את צל הצהריים בשני ימי ההיפוך ובשני ימי השוויון. 5 כרטיסים, בלי שעון ובלי שמות חודשים — רק הצל."
  - Misses: „הצל עוד מתקצר — זה לא הצהריים." / „צל הצהריים באורך ‎${x}‎ — זה לא אחד מארבעת הימים המיוחדים." (→ E10a: add the unit)
  - Hint: „בתמונה מהחלל: מתי הציר נוטה אל השמש, מתי הרחק ממנה, ומתי הצידה?"
  - Rule card: „צל הצהריים הכי קצר ביום ההיפוך של יוני והכי ארוך ביום ההיפוך של דצמבר. בימי השוויון הוא באמצע."
- **Misconception:** the noon Sun is equally high all year.
- **Transfer evidence:** a changed environment: `clock: 'sundial'` instead of a local clock, and unlabeled tickets instead of named dates (asserted in `tests/curriculum.test.ts`). Ticket order is forward-only, so the player must plan the four key days in calendar order from the instrument alone.

## World 3 — השמש כמקור אנרגיה (sun-energy, earth-revolution, climate-zones)

### 11. פנס — Flashlight
- **Module:** https://geography.workbook.co.il/grade-8/chapter-3/sun-energy (radiation angle); the December subsolar latitude comes from https://geography.workbook.co.il/grade-8/chapter-2/earth-revolution
- **Skill:** radiation angle (זווית קרינה): a vertical beam concentrates, an oblique beam spreads (Workbook's flashlight).
- **Scenario:** 22 December in Finland, battery at 25 %, 7 game-hours. Charge to 100 % and photograph the light patch as a perfect circle (Sun ≥ 86°). No tickets.
- **State/action:** latitude and longitude by running → `insolationFactor`, `beamSpread`, battery rate, Sun elevation.
- **Feedback:**
  - Brief: „22 בדצמבר, פינלנד. טעני את הסוללה עד הסוף לפני רדת הלילה, וצלמי את כתם האור שלך כשהוא עיגול מושלם — קרן אנכית."
  - Miss: „הקרניים פוגעות כאן בזווית ‎${deg}‎° — הכתם מתמרח לאליפסה ארוכה פי ‎${k}‎." (→ E11b: say „זווית הקרינה")
  - Failure (time): „בפינלנד בדצמבר השמש נמוכה: האור מתפזר והטעינה איטית. ב-22 בדצמבר הקרניים אנכיות מעל חוג הגדי."
  - Hint: „הנקודה שבה השמש אנכית מסומנת." + subsolar overlay (→ E11a: gives the target)
  - Rule card: „קרן אנכית מתרכזת בשטח קטן ומחממת חזק. קרן אלכסונית מתפזרת על שטח גדול. ב-22 בדצמבר השמש אנכית מעל חוג הגדי."
- **Misconception:** it's hot where it's "closer to the Sun"; the northern summer is hotter because we're closer.
- **Transfer evidence:** none (first World 3 level), but it reuses World 2's December subsolar latitude as a means, not as the question.

### 12. גיליון תרמי — Thermal issue
- **Module:** https://geography.workbook.co.il/grade-8/chapter-3/sun-energy
- **Skill:** albedo (אלבדו) and the urban heat island; albedo alone doesn't decide the temperature (Sun angle, air temperature and evaporation matter too).
- **Scenario:** 21 June, noon. Predict and photograph the hottest and the coolest of four surfaces (Alpine snow, Icelandic lava, Galilee forest, Tel Aviv asphalt); the thermal camera only switches on after the shot. Then Tel Aviv vs. the fields (≥ 6 °C cooler).
- **State/action:** a choice of surface, place and time → `surfaceTemperature` (model noon values: asphalt 57.6, forest 41.2, lava 31.0, snow 6.1 °C).
- **Feedback:**
  - Brief: „21 ביוני, צהריים: צלמי את המשטח הכי חם ואת הכי קר מבין ארבעה (שלג, לבה כהה, יער, אספלט). המצלמה התרמית נדלקת רק אחרי הצילום! ואחר כך: אי החום של תל אביב מול השדות."
  - Misses: „המצלמה התרמית: ‎${t}‎°C. יש משטח חם יותר. הלבה כהה — אבל השמש באיסלנד נמוכה יותר." (→ E12a: air temperature is the bigger cause) / „השדות ‎${t}‎°C — רק ‎${d}‎° פחות מהעיר."
  - Hint: „שני דברים קובעים: כמה גבוהה השמש במקום, וכמה מהאור המשטח בולע."
  - Rule card: „משטח בהיר מחזיר אור (אלבדו גבוה) ומשטח כהה בולע. אבל הטמפרטורה תלויה גם בזווית הקרינה: לבה כהה תחת שמש נמוכה מתחממת פחות מאספלט תחת שמש גבוהה."
- **Misconception:** a dark surface is always the hottest; albedo alone makes the heat island.
- **Transfer evidence:** predict-then-observe: the commitment comes before the reading.

### 13. איפה אני? — Where am I?
- **Module:** https://geography.workbook.co.il/grade-8/chapter-3/climate-zones and https://geography.workbook.co.il/grade-8/chapter-2/earth-revolution (the three belts bounded by the tropics and the polar circles)
- **Skill:** climate belts (טרופי / ממוזג / קוטבי) and the noon Sun's height and direction vs. latitude.
- **Scenario:** 21 June, three rounds under a cloud deck that hides the continents (10° N, 72° N, 34° S). Measure the noon Sun with the sun sight (Q), deduce the belt, choose gear (sun hat / coat / parka).
- **State/action:** sleep to noon + the sun sight → noon elevation and azimuth (76.5° north, 41.5° south, 32.5° north) → gear.
- **Feedback:**
  - Brief: „21 ביוני. התעוררת במקום לא מוכר מתחת לעננים. מדדי את גובה שמש הצהריים בכוונת השמש (Q), הסיקי באיזה אזור אקלים את — ובחרי ציוד. שלוש פעמים."
  - Wrong gear (sim.ts): „לבשת ‎${gear}‎ — אבל זה ‎${zone}‎. צילה קפאה." (→ E13b: „בחרת") + „קו הרוחב כאן ‎${lat}‎° צפון."
  - Hint: „בצהריים השמש בגובה המרבי שלה. לאיזה כיוון היא — צפון או דרום?"
  - Rule card: „גובה שמש הצהריים = 90° − (המרחק מקו הרוחב שבו השמש אנכית). ב-21 ביוני השמש אנכית מעל 23.5° צפון. בין החוגים — טרופי; מעבר לחוגי הקוטב — קוטבי; ביניהם — ממוזג."
- **Misconception:** the equator is hot because it's "closer to the Sun"; a lower noon Sun always means a colder belt (round 3 at 32.5° is temperate while round 2 at 41.5° is polar: the direction decides).
- **Transfer evidence:** inverse reasoning, from the sky to the place.
- **העשרה flag:** the noon-height formula isn't in any Workbook module. The level can be solved qualitatively; the rule card should label the formula העשרה (→ E13a).

### 14. בריחה מהלילה הקוטבי — Polar-night escape (transfer)
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/earth-revolution (polar night, day length by latitude) and https://geography.workbook.co.il/grade-8/chapter-2/earth-rotation (noon comes first in the east)
- **Skill:** day length depends on latitude; north of 66.5° on 22 December the Sun doesn't rise.
- **Scenario:** 22 December, Svalbard (76° N), battery at 55 %, deep snow (`groundSpeed` 0.35), rails at 70° (0 h of light) and 62° (4.7 h). Reach daylight and photograph the first light.
- **State/action:** direction and choice of rail → `dayLength`, `dayKind`, battery.
- **Feedback:**
  - Brief: „22 בדצמבר, שפיצברגן. לילה קוטבי והסוללה נגמרת. מצאי את הכיוון ואת המסילה שיביאו אותך לאור יום — וצלמי את האור הראשון."
  - Failure: „נשארת מצפון לחוג הקוטב (‎${lat}‎°): ב-22 בדצמבר השמש לא עולה שם בכלל." / „הגעת דרומה מחוג הקוטב, אבל הצהריים — הרגע היחיד של אור כאן בדצמבר — עוד לא הגיעו. המסילה מזרחה מקדימה אותם." (→ E14a: false, 4.7 h of light)
  - Hint: „המסילות הן קווי רוחב. על איזו מהן השמש עולה היום?"
  - Rule card: „ב-22 בדצמבר הקוטב הצפוני נוטה הרחק מהשמש: מצפון לחוג הקוטב (66.5°) השמש לא עולה. דרומה ממנו היום מתארך, והצהריים מגיעים קודם למי שבמזרח."
- **Misconception:** night is the same length everywhere; polar night covers the whole north.
- **Transfer evidence:** a changed environment (asserted in tests): it starts in polar night, with slow ground and survival instead of a photo brief. Two modules' rules combine (latitude for light, longitude for noon).

## World 4 — הירח (moon-and-tides)

Every World 4 level: https://geography.workbook.co.il/grade-8/chapter-2/moon-and-tides. The sleep pod also offers whole days.

### 15. מופעי הירח — Moon phases
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/moon-and-tides
- **Skill:** the phases come from seeing different parts of the lit half (≈ 29.5 days); the full moon is opposite the Sun and rises at sunset.
- **Scenario:** one Jerusalem rooftop, 7 visible phases, sleep in hours or days between shots, then the request "a full moon at noon", which the player must declare impossible.
- **State/action:** sleep days → moon age → `phaseIndex`, Moon position.
- **Feedback:**
  - Brief: „מגג אחד בירושלים: צלמי את 7 המופעים הנראים של הירח. בין הצילומים — תא השינה, עכשיו גם לימים. ובקשה אחרונה: "ירח מלא בצהריים"."
  - Misses: „זה לא המופע הזה." / „הירח מתחת לאופק עכשיו." / „השמיים בהירים מדי — חכי לחושך."
  - Sulk: „הירח המלא נמצא מול השמש: כשהשמש בשמיים, הוא מתחת לאופק. צילה מתבאסת."
  - Hint: „הירח מואר מצד השמש. רבע ראשון: כשבוע אחרי המולד, נראה בשקיעה. מלא: כשבועיים, עולה בשקיעה." (→ E15c)
  - Rule card: „הירח מואר תמיד מצד השמש. מופעי הירח נובעים מהזווית שבה אנחנו רואים את חצי הירח המואר — לא מצל כדור הארץ. מחזור שלם ≈ 29.5 ימים; ירח מלא נמצא מול השמש ולכן עולה בשקיעה."
- **Misconception:** the phases come from Earth's shadow; the Moon "grows".
- **Transfer evidence:** none. The impossible request is a near-transfer check (→ E15b: currently free).

### 16. גאות ושפל — Tides
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/moon-and-tides
- **Skill:** two bulges, about two highs and two lows a day; metres on some ocean coasts vs. 20–40 cm in the Mediterranean.
- **Scenario:** a tidal causeway near Saint-Malo (the whole tidal flat floods); cross to the island at a low tide, choosing hours or days to sleep. Then two Tel Aviv beach shots ≥ 3 h apart that show the tide barely changes.
- **State/action:** sleep → `tideHeight` (6 m half-range on the causeway coast, 0.15 m at Tel Aviv).
- **Feedback:**
  - Brief: „חצי את שביל הגאות אל אי המצודה וצלמי ממנו. אחר כך: שתי תמונות של החוף בתל אביב, בהפרש 3 שעות לפחות." (→ E16a)
  - Success note: „מד הגאות: ‎${cm}‎ ס"מ — הבדל של ‎${d}‎ ס"מ בלבד"
  - Failure (wave): „הגאות כיסתה את השביל. בחוף אוקיינוס המים עולים ויורדים מטרים, פעמיים ביום. בשפל של ירח מלא או מולד המים יורדים הכי נמוך." (→ E16b: needs the העשרה label)
  - Hint: „מד הגאות ליד השביל מראה את גובה המים. השפל העמוק ביותר בחודש מגיע סביב המולד והירח המלא (העשרה: גאות שיא)."
  - Rule card: „משיכת הירח יוצרת שתי בליטות מים: פעמיים ביום גאות ופעמיים שפל. בחופי האוקיינוס ההפרש מטרים; בים התיכון רק 20–40 ס"מ." (→ E16c)
- **Misconception:** one tide a day; the tide is the same everywhere.
- **Transfer evidence:** none. **Spring/neap = העשרה** (see below).

### 17. ליקוי חמה — Solar eclipse
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/moon-and-tides
- **Skill:** a solar eclipse needs a new moon *and* alignment; the Moon's orbit is tilted 5°, so not every month.
- **Scenario:** two tickets among the next 6 new moons (23 Jun, 23 Jul, 21 Aug, 20 Sep, 19 Oct, 18 Nov; only 19 Oct has an eclipse). Pick the right one and run into the shadow.
- **State/action:** a ticket (arriving 0–24 h before the new moon) + sleep + running → `solarEclipseCenter`, `moonEclipticLatitude`.
- **Feedback:**
  - Brief: „צלמי ליקוי חמה מלא. ברכבת הלוח יש כרטיסים ל-6 המולדים הבאים — יש לך שניים. איזה מולד נמצא על הקו?" (→ E17b)
  - Misses: „הירח לא בין השמש לכדור הארץ — ליקוי חמה קורה רק במולד." / „מולד — אבל הירח עובר מעלשמש: מסלולו נטוי 5° והצל מפספס את כדור הארץ החודש." (→ E17a: broken word) / „יש ליקוי — אבל הצל נופל במקום אחר על הכדור. רוצי אליו!"
  - Hint: „בתמונת המסלול מסומן קו הצמתים — שם מסלול הירח חוצה את מסלול כדור הארץ."
  - Rule card: „ליקוי חמה קורה במולד, כשהירח בין השמש לכדור הארץ. מסלול הירח נטוי 5°, ולכן ברוב החודשים הירח עובר מעל השמש או מתחתיה ואין ליקוי."
- **Misconception:** there's an eclipse every month.
- **Transfer evidence:** none.

### 18. לוח השמיים — The sky calendar (final transfer, no hints)
- **Module:** https://geography.workbook.co.il/grade-8/chapter-2/moon-and-tides (lunar eclipse; the Hebrew calendar follows the Moon and the Sun), with https://geography.workbook.co.il/grade-8/chapter-2/earth-rotation (sunrise) and https://geography.workbook.co.il/grade-8/chapter-2/earth-revolution (spring)
- **Skill:** the Hebrew calendar is lunisolar (Pesach at the spring full moon); a lunar eclipse happens at full moon and is visible from the whole night half.
- **Scenario:** the night of the Seder: the spring full moon over Jerusalem, a Jerusalem sunrise, and an eclipse "somewhere". Two unlabeled full-moon tickets (6 options) bought in Jerusalem, sleep up to 24 h.
- **State/action:** tickets + sleep + travel → moon age, `lunarEclipse`, Moon elevation by place.
- **Feedback:**
  - Brief: „ליל הסדר: (1) הירח המלא של האביב מעל ירושלים, (2) זריחה בירושלים, (3) ליקוי — איפשהו על הכדור. בלי רמזים ובלי שמות על הכרטיסים."
  - Misses: „עכשיו ‎${date}‎ — זה לא אביב." (→ E18a: a June full moon passes) / „ירח מלא — אבל הוא עובר מעל או מתחת לצל של כדור הארץ." / „הליקוי קורה — אבל כאן הירח מתחת לאופק. הוא נראה מהצד הלילי של הכדור."
  - Hint: none (`hint: null`).
  - Rule card: „הלוח העברי משלב ירח ושמש: פסח חל בירח המלא (ט"ו בניסן) של האביב. ליקוי לבנה קורה בירח מלא, כשכדור הארץ בין השמש לירח — ונראה מכל מקום שבו הירח בשמיים."
- **Misconception:** Pesach could fall in any season; an eclipse can be seen from anywhere on Earth.
- **Transfer evidence:** no hint, no hint overlay, unlabeled tickets, and three modules' rules combined (asserted in tests).

---

## Stated simplifications (all are on purpose; schematic, not GIS)

- **Time:** local solar time = UTC + longitude/15. Civil zones are simplified 15° bands centred on multiples of 15° (`civilZone`). Real offsets are stated per level when real cities are used.
- **DST rule:** Israel UTC+2, UTC+3 in summer time. Israel–Japan is 7 h in standard time and 6 h in Israeli summer time. Workbook's "about 6 hours" is the summer value, so any real-city level states the season on screen (`civilTimeDifference`, tested in `tests/astro.test.ts`).
- **Date line** = exactly the 180° meridian (the real line bends round island groups).
- **No equation of time, no atmospheric refraction**, Sun treated as a point at its centre. So the equinox gives exactly 12:00 everywhere (Workbook's 12:12 idealization), and polar day starts exactly at 66.5°.
- **Orbit:** declination δ = asin(sin 23.5° · sin L). The date ↔ L calendar is piecewise-linear through Workbook's anchors (21 March, 21 June, 23 September, 22 December), so the named dates match the text exactly; between anchors the days are spread evenly. The Earth–Sun distance (e = 0.0167, perihelion ~3 January) is used only for the distance readout and the insolation factor.
- **Moon:** a circular orbit at 60 Earth radii; synodic month 29.53 days; inclination 5°, with **lunar nodes fixed at L = 30° and 210° in the game year** (real nodes regress over 18.6 years). The eclipse window is ±11° of L around a node. The solar-eclipse **totality zone is a toy circle of 9° radius** on the pocket planet (real paths are ~100–270 km wide). A lunar eclipse = the full moon within ~1° of the anti-Sun point.
- **Tides:** an equilibrium **two-bulge cosine** under the Moon and opposite it, with no tidal lag, multiplied by a **spring/neap factor** (1.0 at new/full moon → 0.3 at the quarters). Each coast's half-range is a level value (Mediterranean 0.15 m, giving a ~30 cm spring range; the causeway coast 6 m, giving ~11 m).
- **Climate:** a schematic monthly temperature driven by daily top-of-atmosphere insolation with a one-month lag (`monthlyTemperature`). No oceans, winds, altitude or rain. Curves are qualitative (equator flat and warm, mid-latitudes seasonal, the south inverted). Absolute values are not station data (REVIEW.md A2).
- **Surface temperature:** air temperature + 30 °C × (1 − albedo) × sin(elevation) − evaporative cooling. A toy energy model that keeps "albedo alone doesn't decide temperature" true.
- **Radiation balance (dome):** a one-box model, ΔT ∝ absorbed short-wave − emitted long-wave.
- **Places** are schematic zones (a centre and a radius in degrees) on a planet you can circle in under a minute. Positions are rounded real coordinates; distances and travel times are compressed. Political borders are not drawn.
- **Time compression:** game-hours pass faster than real time, and sleep and tickets jump forward. This applies only to daily and yearly astronomical cycles; no geological processes are compressed.

## Spring and neap tides: coverage check

The moon-and-tides snapshot explains the two bulges (the Moon's pull plus inertia), two highs and two lows a day, and why the Mediterranean range is small (20–40 cm) while some ocean coasts reach metres. **It doesn't mention spring or neap tides, or the Sun's part in tides, anywhere.** So in Tilt World the idea that the causeway opens only at the deepest lows near new and full moon is **העשרה**. Any level text, hint or replay line that relies on it must carry an in-game "העשרה" label, and no shot may be scored on knowing it without that label. Current state: the level 16 hint carries the label („העשרה: גאות שיא"); the wave failure line doesn't yet (REVIEW.md E16b, pinned as a `todo` test).

Other enrichment beyond the snapshots: the noon-height formula as a calculation (level 13's rule card; the level is solvable qualitatively, see REVIEW.md E13a), and the urban-heat-island evaporation term (the module mentions evaporation qualitatively).
