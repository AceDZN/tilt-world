# Tilt World — geography and Hebrew review

Reviewer: geography/gameplay QA helper. Date: 31 October 2026.
Sources: the Workbook snapshots in `docs/curriculum/` (grade 8 ch. 1 solar-system, ch. 2 earth-rotation / earth-revolution / moon-and-tides, ch. 3 sun-energy / climate-zones), `docs/handoff/BUILD_HANDOFF.md` (the post-"no duplicate" contract: no dials, no fast-forward, sleep pod + one-way calendar tickets), `src/astro/astro.ts`, `src/game/levels.ts`.

**Status of this review.** Revised against commit bae0bdd (the new contract: no dials, no fast-forward, sleep pod + one-way calendar tickets, new World 3) plus the World 1 string fixes applied in `src/game/levels.ts` alongside this review. Part A is updated (A1 and A3 fixed by the lead). Part C lists the World 1 findings; all of its replacements are now applied except where noted. Part E is a full review of the new Worlds 2–4. The four remaining P1/P2 string bugs that a test can see are pinned as `todo` tests in `tests/curriculum.test.ts` (IDs E8a, E16a, E16b, E17a), so they turn into normal tests when fixed.

Conventions: the robot is **צילה** and the player is addressed in the **feminine singular** throughout. I checked this for every imperative and past-tense verb. Severity: **P1** = factually wrong, or broken text a student will see. **P2** = answer leak, solvability gap or wrong term. **P3** = wording polish.

---

## A. Astronomy module (`src/astro/astro.ts`): findings from `tests/astro.test.ts`

All rule tests pass. The A1 test, previously `todo`, is now a normal test.

| # | Sev | Finding | Recommended fix |
|---|---|---|---|
| A1 | **Fixed** (bae0bdd) | **Calendar labels were 1–3 days early at the key dates.** `dayOfYearFromL` spreads L uniformly over 365.25 days from 21 March, so `dateLabel(90)` = "20 ביוני", `dateLabel(180)` = "19 בספטמבר" and `dateLabel(270)` = "19 בדצמבר". Level text and Workbook say 21 June, 23 September and 22 December ("ב-21 ביוני מעל חוג הסרטן", "21 במרץ, 23 בספטמבר", "21 בדצמבר"). The real seasons are unequal (Kepler), and that is why the uniform map drifts. With the calendar-train tickets now *named by date*, a ticket labelled "20 ביוני" next to a rule saying "21 ביוני" is a visible contradiction. | Make the date ↔ L map piecewise-linear through Workbook's anchors. In `dayOfYearFromL`/`lFromDayOfYear`, use anchors `[[0, 79], [90, 171], [180, 265], [270, 355], [360, 444]]` (day-of-year, 0 = 1 Jan: 21 Mar, 21 Jun, 23 Sep, 22 Dec, 21 Mar + 365) and interpolate linearly inside each quarter (mod 365). Then the `todo` test in `tests/astro.test.ts` can become a normal test. `sunDistanceAU` and `dailyInsolation` stay valid, because they only need day-of-year. |
| A2 | P2 | **`monthlyTemperature` doesn't match its own doc comment, and the climate it gives for Israel is too cold.** The comment says "Israel ≈ 10–27, polar circle ≈ −20..+12". The model gives 4.9–24.2 °C at 31.8° N and −26..+9 at 66.5° N (equator 23.4–27.2 is fine). Workbook's card says Jerusalem is 9 °C in winter and 26 °C in summer. If a level shows these curves with numbers and the label "ישראל", a 5 °C January is wrong for the curriculum. | Either drop absolute °C from any card that names Israel and call the curves schematic, or recalibrate. For example, `return -38 + 72 * mean + 24 * (q - mean)` and re-check `yearlyCurve(31.8)` ≈ 10–27 and the equator ≈ 25–28 (re-run the climate test in `astro.test.ts`). Fix the doc comment either way. Note: the old `hermonSnow` (< 10 °C at 33.4°) depends on this calibration, so re-check it if it survives the rewrite. |
| A3 | **Fixed** (bae0bdd) | `civilZone(-0.2)` returned `-0` (Math.round of a small negative). It's harmless in arithmetic, but it prints as "UTC-0" if formatted with a sign, and `assert.equal(-0, 0)` fails. | `return Math.round(wrap180(lon) / DEG_PER_HOUR) \|\| 0;` |
| A4 | P3 | `moonPosition` has no `spin` parameter, so in the level 2 mirror dream the Moon still moves the real way while the Sun moves the mirrored way. Nobody photographs the Moon in the dream, so this is invisible today. | Add `spin` to `moonPosition` and pass it through to `moonDirection`, if the dream ever shows the Moon. |
| A5 | — | Simplifications confirmed by tests (state them, don't fix): the equinox gives exactly 12:00 at every latitude (no refraction, Sun centre); high tide sits exactly under the Moon and opposite it (no tidal lag); the tide cycle is the lunar day (~24 h 50 min, where Workbook says "24 שעות"); spring/neap factor is 1.0 → 0.3 (the real ratio is about 0.4–0.5); the eclipse window is ±11° of L around the nodes (real solar eclipse limits are ~±15–18°); the Moon's nodes are fixed at L = 30°/210° (real nodes regress over 18.6 years). |

Everything else matched the curriculum in tests: 15°/h and local solar time; sunrise in the eastern half and sunset in the western half at four dates and three latitudes, mirrored with spin −1; δ = ±23.5 / 0; polar day/night at ≥ 67° and reversed in the south; Israel 14.1 h and Oslo 18.5 h on 21 June; noon elevation formula = 3D geometry; perihelion in January with short northern days; hemispheres exactly complementary (day lengths sum to 24 h); the DST rule (7 h standard, 6 h Israeli summer time); the date line (same clock time, one day apart); the flashlight rule; the albedo/temperature split; the radiation balance and its equilibrium; climate curves; phases and moonrise times; the 5° eclipse condition (never more than 2 of 12 consecutive new moons); tides 2+2 per lunar day, spring > 2× neap, Tel Aviv range 0.29 m.

---

## B. Simplifications and inconsistencies inside the Workbook source modules (don't assess these as fact)

| Module | Source statement | Problem | What the game does |
|---|---|---|---|
| earth-rotation | Tel Aviv–Tokyo "בהפרש של כ-6 שעות … כשבתל אביב 8:00, בטוקיו כבר 14:00" | True only in Israeli summer time (UTC+3 vs UTC+9). Standard time gives 7 h. | `civilTimeDifference` takes the season. Any level with real cities states the season on screen. Level 4 sidesteps it with Accra (UTC+0) → Dhaka (UTC+6), which is 6 h all year and in reality too. |
| earth-rotation | The callout: a pilot leaves New York and "טס ישירות מזרחה מעל האוקיינוס השקט" to land in Tokyo on Wednesday | Flying east from New York doesn't cross the Pacific. Flying west over the Pacific to Tokyo is what skips a day forward. | Never used. Don't quote it. |
| earth-rotation | The date-line explanation: "כשמסתובבים ממזרח למערב וחוזרים הביתה, הרווחנו שעה בכל אזור זמן … היינו חוזרים ביום מוקדם יותר" | The direction words are muddled (circling westward you set clocks back, so you'd come home one day *behind*, i.e. you need to *add* a day). The rule lines in the same module (east = date back, west = date forward) are correct. | Level 5 uses only the correct rule ("מזרחה … חוזר יום אחד בתאריך"). |
| earth-rotation | "קו התאריך … בערך מול קו האורך ה-180" | Correct as "בערך". | The game uses exactly 180°, stated as "כאן: קו אורך 180°". |
| earth-revolution | "ישראל נמצאת בין קו המשווה לחוג הסרטן, כ-31-33 מעלות צפון" | **Factual error in the source:** at 31–33° N, Israel is *north* of the Tropic of Cancer (23.5° N), between the Tropic and the Arctic Circle (the temperate belt, which the same module says correctly). | Never repeat it. Level text should say "צפונית לחוג הסרטן" if it comes up (the new level 13 "Where am I?" might). |
| earth-revolution | Equinox "12 שעות אור ו-12 שעות חושך, בכל מקום בעולם" | Idealized (refraction and the Sun's disk make the real day a few minutes longer). | Same idealization, stated in CURRICULUM.md. |
| earth-revolution | "בשבדיה (קרוב לחוג הקוטב הצפוני), בחודש יוני השמש לא שוקעת בכלל" | Only north of 66.5° (the answer text says this). Southern Sweden has ~18 h. | The game uses Lapland at 69° N. |
| earth-revolution | "הנטייה של 23.5 מעלות היא תוצאה של ההתנגשות הענקית שיצרה את הירח" | A hypothesis, not established fact. | Not used. |
| earth-revolution | "כשחצי הכדור הצפוני פונה יותר אל השמש (יוני-ספטמבר) - הוא חווה קיץ … (דצמבר-מרץ) חורף" | Schematic seasons. | Fine. |
| moon-and-tides | "פעמיים ביום … כל אזור עובר במהלך 24 שעות בשתי הבליטות" | The tidal day is ~24 h 50 min. | The model uses the lunar day, so high tide comes ~50 min later each day. If a level text says "פעמיים ביום", keep the "בערך". |
| moon-and-tides | "בחופי האוקיינוס האטלנטי ובים הצפוני הגאות עלולה להגיע לגובה של 10-15 מטרים" | Only in a few funnel bays (Bay of Fundy, Gulf of Saint-Malo). Most of the North Sea has 1–4 m. | The causeway sits at about 1.5° W, near Saint-Malo, where a ~12 m spring range is real. Level text should say "בחופים מסוימים", not "בחופי האוקיינוס". |
| moon-and-tides | The Mediterranean tide is small because "הגלים הגדולים שמגיעים מהאוקיינוס האטלנטי מגיעים מוחלשים" | Confuses wind waves with the tide. The first explanation (an almost-closed sea, a narrow strait) is the right one. | Use only "ים כמעט סגור". |
| moon-and-tides | **Spring/neap tides** | **Not in the module at all.** It never mentions alignment with the Sun or bigger tides at new/full moon. | Anything about spring/neap must be labelled **העשרה** in-game (see CURRICULUM.md). |
| moon-and-tides | "ב-29 במרץ 2006 … ליקוי חמה חלקי שנצפה בישראל … ב-10 בבוקר" | Maximum in Israel was around midday local time, not 10:00 (totality in Turkey ~10:55 UTC). I couldn't verify the exact local time offline. | Not used. |
| moon-and-tides | "ממדינה כישראל ניתן לצפות בכ-3-4 ליקויים בשנה" | Doubtful (the world average is 4–7 eclipses a year *in total*, and each is visible from only part of the Earth). Unverified. | Not used. |
| sun-energy | "הכרמל סופג יותר חום ולח יותר" (because of lower albedo) | Albedo doesn't explain humidity. The forest is more humid because of rain and evapotranspiration. | Not used. |
| sun-energy | The car-greenhouse analogy: "האטמוספרה פועלת בדיוק כך" | A car warms mostly because it blocks convection. The atmosphere is "similar", not "exactly the same". | The dome level should say "כמו" or "בדומה", not "בדיוק כמו". |
| sun-energy | City vs. countryside: "הצמחייה מחזירה יותר אור ומאדה מים" | Partly. Vegetation albedo (0.15–0.25) is only slightly above asphalt's. Evaporation is the bigger factor, plus building and traffic heat. | The model includes evaporation (`EVAPORATION`). The game must not claim albedo alone makes the heat island (COMMON: "albedo alone does not determine actual surface temperature"). |
| climate-zones | Tel Aviv and Eilat "שתיהן אמנם ים תיכוניות-סוב-טרופיות", Eilat "רחוקה מים התיכון … ויותר פנים-יבשתית" | Contradictory: Eilat is desert, and it sits on the Red Sea coast. | Not used. |
| solar-system | Planet temperature follows distance from the Sun | Correct for planets, but it is exactly the seed of the "seasons come from distance" misconception. | Level 6 should name this contrast explicitly: distance explains why Mercury is hot, not why July is hot. |

---

## C. World 1 strings, string by string

**Applied.** Every replacement in this part is now in `src/game/levels.ts` (strings only; no mechanics changed; all tests green), including the L2 dream instruction as a tutorial line and `DEFAULT_FAIL.time` (D2). Not applied, because the text lives elsewhere: the GAME_IDENTITY.md arithmetic (lead's file), the L4 brief rewording (the lead had already rewritten it to „השעון שלך מראה רק את השעה באקרה", which is fine), and the `<bdi>`/quote-mark items (D3, D4, render-time). The "Current" column below shows the text *before* the fix.

Gender check: every imperative is feminine (צלמי, רוצי, הסתובבי, הריצי, החליפי, קפצי, הישארי, חכי, אל תברחי, מצאי, חגגי). Past-tense forms (חיכית, גלשת, עברת, הסתכלת) and "את לא בדאקה" are consistent. Generic masculine shows up only in impersonal rules ("מי שרץ", "מי שחוצה"). That's acceptable, but impersonal phrasing reads better (below).

### Level 1 — הזריחה הראשונה

| Field | Current | Issue | Replacement |
|---|---|---|---|
| rule | כדור הארץ מסתובב ממערב למזרח, 15° בשעה. מי שרץ מזרחה פוגש את הזריחה מוקדם יותר. | Correct. It's missing the module term **סיבוב עצמי**, and the subject switches to generic masculine. P3. | `בסיבוב העצמי כדור הארץ מסתובב ממערב למזרח, 15° בשעה. ריצה מזרחה מקדימה את הזריחה.` |
| hint | האור מגיע מהקו הכתום. הוא זז מערבה — לכיוונך. | Correct. Use the module term for the band. P3. | `הרצועה הכתומה היא אזור הדמדומים. היא זזה מערבה — לכיוונך.` |
| explain.battery | חיכית לשחר במקום: הוא זז רק 15° בשעה… | **P2:** this fires on *any* battery death, including a player who ran west, so "חיכית במקום" can be false. | `השחר זז רק 15° בשעה, והסוללה נגמרה לפני שהגיע אלייך. ריצה מזרחה, לקראתו, מקדימה את הזריחה.` |
| tutorial | צפון תמיד למעלה במצפן ובמפה, ומזרח מימין. / השחר מגיע ממזרח. רוצי לקראתו! (W או ↑) / כשהשמש מציצה — E לצילום. | Good. This is the required north-up/east-right line. Wrap "W", "↑" and "E" in LTR `<bdi>` in the UI. | Keep. |
| shot lines | השמש עוד מתחת לאופק… / השמש כבר גבוהה מדי… / זו שקיעה, לא זריחה! / השמש לא בפריים. הסתובבי אליה. | Fine. | Keep. |
| GAME_IDENTITY.md (lead's file) | "רצת 20° מזרחה, אז הזריחה הגיעה אלייך שעה ורבע מוקדם יותר" | **P1 arithmetic:** 20° ÷ 15°/h = 1 h **20** min, not 1 h 15 min. If the game builds this line, build it from the computed value. | `רצת 20° מזרחה, אז הזריחה הגיעה אלייך שעה ועשרים דקות מוקדם יותר.` (or `${fmt(deg)}° = ${minutes} דקות`) |

Solvable from the screen: yes (tutorial arrows, dawn band visible).

### Level 2 — השמש "זזה"

| Field | Current | Issue | Replacement |
|---|---|---|---|
| brief | מאותה גבעה: צלמי את הזריחה ואת השקיעה. לאן פונה השמש בכל אחת? | "לאן פונה השמש" is unnatural (the Sun doesn't "face" anywhere). P3. | `מאותה גבעה: צלמי את הזריחה ואת השקיעה. באיזה כיוון נמצאת השמש בכל אחת?` |
| tutorial | T — הריצי את הזמן קדימה. | **P1 under the new contract:** fast-forward is gone. Time moves only by the sleep pod. | `תא השינה: בחרי מראש כמה שעות לישון — ורק אז תראי מה קרה.` |
| tutorial | החליפי כיוון עם A/D, וצלמי עם E. | Fine. "הסתובבי" is more natural for turning in place. P3. | `הסתובבי עם A/D, וצלמי עם E.` |
| dream (no string) | — | **P2 solvability:** nothing in `levels.ts` tells the player that in the dream they must plant the tripod (P) facing their prediction *before* dawn. No tutorial line mentions P. Unless the UI shows it, a student can't know what to do. | Add to the dream event text or the tutorial: `חלום: כדור הארץ מסתובב הפוך! הציבי חצובה (P) לכיוון שבו לדעתך תזרח השמש.` |
| mirror miss | בעולם ההפוך השמש זרחה ${dir} — והחצובה הסתכלה לכיוון אחר. | Good. | Keep. |
| explain.tripod | ${lastWhy} אם כדור הארץ מסתובב הפוך — ממזרח למערב — השמש נראית עולה במערב. | Fine as a post-failure line. "כש" fits better than "אם" after the fact. P3. | `${lastWhy} כשכדור הארץ מסתובב הפוך — ממזרח למערב — השמש נראית עולה במערב.` |
| rule / hint | …(תנועה מדומה). / עקבי אחרי הקו הכתום: הוא תמיד מגיע מהצד שאליו כדור הארץ מסתובב. | Correct, uses the module term, and the hint is not an answer. | Keep. |

### Level 3 — גלישה על הדמדומים

| Field | Current | Issue | Replacement |
|---|---|---|---|
| brief | אספי 8 פריימים של "שעת זהב" לאורך קו רוחב 50°. כל פריים מתפתח רק באור הדמדומים. | "שעת זהב" is photo jargon next to the module term. P3. | `אספי 8 פריימים לאורך קו רוחב 50°. כל פריים מתפתח רק באזור הדמדומים — הרצועה הכתומה.` |
| rule | אזור הדמדומים נע מערבה 15° בשעה… | At 50° N the band moves 15° *of longitude* an hour (≈ 9.6° of arc). Say so, because the rail runs along a latitude line. P3. | `אזור הדמדומים נע מערבה 15° אורך בשעה. כדי להישאר בו צריך לנוע מערבה באותו קצב.` |
| hint | הדמדומים זזים 15° בשעה. רוצי מערבה על המסילה — לא מהר מדי ולא לאט מדי. | **P2 mild leak:** it gives the direction (west), which is half the answer. | `הדמדומים זזים 15° אורך בשעה. לאיזה כיוון? התאימי את הקצב שלך לשלהם.` |
| tutorial | קפצי (רווח) ונחתי על המסילה — קו רוחב 50° — כדי לגלוש מהר. | **P2 ambiguity:** unvocalized "נחתי" also reads as past tense "נָחַתִּי" ("I landed"). | `קפצי (רווח) אל המסילה שעל קו רוחב 50° כדי לגלוש מהר.` |
| explain.battery | גלשת אל הלילה: מערבה מהדמדומים עוד חושך… | "מערבה מהדמדומים" is awkward. P3. | `גלשת אל הלילה: ממערב לאזור הדמדומים עדיין לילה. הקו זז 15° בשעה — חכי לו, אל תברחי ממנו.` |
| explain.time | הדמדומים התרחקו ממך. הם זזים מערבה 15° בשעה — צריך לשמור על הקצב. | Fine. | Keep. |

### Level 4 — 15° לשעה

| Field | Current | Issue | Replacement |
|---|---|---|---|
| brief | חבר מדאקה (90° מזרחה) מבקש: "צלמי אותי בשוק ב-14:00 שלי!" בשעון שלך — שעון אקרה. | The last clause is a fragment. "ב-14:00 שלי" is colloquial but OK in a quote. P3. | `חבר בדאקה (90° מזרחה ממך) מבקש: „צלמי אותי בשוק ב-14:00 לפי השעון שלי!" השעון שלך מראה את השעה באקרה.` |
| rule | כל 15° מזרחה השעה מאוחרת בשעה. 90° = 6 שעות. (בעולם הזה כל אזור זמן הוא 15° בדיוק.) | "השעה מאוחרת בשעה" is clumsy. Workbook says "מקדימה". It's worth saying that this pair is also true in reality. P3. | `כל 15° מזרחה השעון מקדים בשעה אחת: 90° = 6 שעות. (במשחק כל אזור זמן הוא רצועה של 15° בדיוק; גם במציאות אקרה UTC+0 ודאקה UTC+6.)` |
| shot miss | השעה בדאקה עכשיו היא לא 14:00. החבר עוד לא בשוק. | **P1 factual:** if the player arrives after 14:30, "עוד לא בשוק" is false. | `` `השעה בדאקה עכשיו ${hhmm(c.localTime)}, לא 14:00.` `` |
| explain.battery | …השעה שם מאוחרת ב-6 שעות… | Same term issue. P3. Keep the words "6 שעות" and "לילה" (`levels.test.ts` asserts them). | `דאקה נמצאת 90° מזרחה ממך: השעון שם מקדים ב-6 שעות. כשבשעון שלך ${hhmm(f.utc)}, בדאקה כבר ${hhmm(f.utc + 6)} — ${...}.` |
| explain.film | דאקה 90° מזרחה = 6 שעות קדימה… | **P2:** never shown. See D1: `lastWhy` overrides the custom film text. | Fix D1. |
| hint | מצאי את קו האורך של דאקה. כמה שעות הפרש יש בין 0° ל-90°? | Good. A question, not the answer. | Keep. |

### Level 5 — יום הולדת פעמיים (transfer)

| Field | Current | Issue | Replacement |
|---|---|---|---|
| brief | יום ההולדת שלך: 31 באוקטובר. צלמי את הזיקוקים של 20:00 בפיג'י — ואז חגגי שוב, באי אחר, באותו תאריך. | Good. Make the second time explicit. P3. | `…ואז חגגי שוב, באי אחר, באותו תאריך וגם שם ב-20:00.` |
| rule | קו התאריך הבין-לאומי (כאן: קו אורך 180°) עובר באוקיינוס. מי שחוצה אותו מזרחה חוזר יום אחד בתאריך — אבל לא בזמן. | Correct, and it targets the "east = back in time" misconception well. Optional realism note. | `…(במשחק: בדיוק לאורך קו אורך 180°; במציאות הקו מתעקל סביב איים.) מי שחוצה אותו מזרחה מחזיר את התאריך ביום — אבל לא חוזר בזמן.` |
| shot miss (day < 0) | …עברת את קו התאריך מזרחה, אז התאריך ירד ביום. החגיגה תגיע — צריך לחכות לה. | **P2:** "צריך לחכות לה" tells the solution. Under the new contract the player also has to choose how long to sleep, so the line should leave that decision to them. | `כאן עכשיו 30 באוקטובר — יום לפני יום ההולדת: חצית את קו התאריך מזרחה, והתאריך חזר ביום. מתי יגיע לכאן הערב של 31 באוקטובר?` |
| places | פיג'י 178.5° E, סמואה האמריקנית −170.7° | Correct and careful. American Samoa is east of the line, while independent Samoa moved west of it in 2011. The model's gap is 23.3 h; the real one is 23 h (UTC+12 vs UTC−11). | Keep "האמריקנית" in every mention. |

Solvable: yes. Fiji → cross → the Samoa message → sleep about 23 h. Under the new contract, check that the sleep pod is reachable at the Samoa end (place one on the island).

---

## D. Cross-cutting text and logic

| # | Status | Finding | Fix |
|---|---|---|---|
| D1 | **Fixed** by the lead | `explainWith` used to append an empty `rule` and hide the custom film line. It now returns the custom line first, then `${lastWhy} ${DEFAULT_FAIL.film}`. | — |
| D2 | **Applied** | `DEFAULT_FAIL.time` "אור הסרט נגמר." was unclear. | Now `הזמן נגמר. התכנון חשוב יותר מהריצה: איפה ומתי זה קורה?` |
| D3 | P3, open | Quotation marks and gershayim inside Hebrew strings are ASCII `"`: the L4 brief („צלמי אותי…"), L15 brief („ירח מלא בצהריים"), L18 rule (ט"ו), L16 (ס"מ). | Use „…" for quotes and ״ (U+05F4) for gershayim: `ט״ו בניסן`, `ס״מ`. |
| D4 | P3, open (UI) | `hhmm` output ("08:00"), degrees ("90°"), percentages and °C appear mid-sentence. | Wrap them in `<bdi dir="ltr">` at render time (COMMON requirement), or the colon and the degree sign can flip in RTL. I couldn't check the renderer from here. |

---

## E. Worlds 2–4 (new `levels.ts`, bae0bdd), string by string and check by check

Numbers below come from the model (`src/astro/astro.ts`) via scratch probes, not estimates. "Current" quotes `src/game/levels.ts` at bae0bdd. IDs marked † are pinned as `todo` tests in `tests/curriculum.test.ts`.

### P1: factually wrong or broken text a student will see

| ID | Lvl | Current | Problem | Replacement |
|---|---|---|---|---|
| E7b | 7 | hint: `הנקודה שבה השמש בזנית מסומנת. היא זזה עם התאריך — לא עם השעה.` | **False.** The subsolar point moves 15° west every hour. Only its *latitude* depends on the date. A student watching the marker race west while the hint says it doesn't move with the hour learns to distrust either the hint or the screen. | `הנקודה שבה השמש בזנית מסומנת. קו הרוחב שלה תלוי בתאריך; במשך היום היא רק נעה מערבה לאורכו.` |
| E8a† | 8 | `` `בחצות של ${dateLabel(c.L)} השמש ${fmt(-c.sun.elevation)}° מתחת לאופק.` `` | For 0 < elevation ≤ 0.3 (the check is `<= 0.3`) it prints "השמש -0° מתחת לאופק", and for elevation 0.1 it says "below the horizon" while the Sun is above it. | `` c.sun.elevation > -0.5 ? `בחצות של ${dateLabel(c.L)} השמש נוגעת באופק — אבל לא מעליו.` : `בחצות של ${dateLabel(c.L)} השמש ${fmt(-c.sun.elevation)}° מתחת לאופק.` `` |
| E14a | 14 | explain.battery (south of 66.5°): `…אבל הצהריים — הרגע היחיד של אור כאן בדצמבר — עוד לא הגיעו. המסילה מזרחה מקדימה אותם.` | **False.** At the 62° rail on 22 December the model gives 4.7 h of daylight (noon Sun 4.5°), not one moment. It also seeds a "polar night = no light anywhere in the north" misconception on the very level that teaches the opposite. | `הגעת דרומה מחוג הקוטב, אבל השעות הספורות של אור כאן בדצמבר — סביב הצהריים — עוד לא הגיעו. המסילה מזרחה מקדימה אותן.` |
| E16a† | 16 | brief: `חצי את שביל הגאות אל אי המצודה…` | Unvocalized "חצי" reads first as the noun "half" (חֲצִי). | `עברי בשביל הגאות אל אי המצודה וצלמי ממנו. אחר כך: שתי תמונות של החוף בתל אביב, בהפרש 3 שעות לפחות.` |
| E17a† | 17 | `` `מולד — אבל הירח עובר ${beta > 0 ? 'מעל' : 'מתחת ל'}שמש: …` `` | Renders **"עובר מעלשמש"** (no space, no ה) when β > 0, on the most common miss in the level. | `` `מולד — אבל הירח עובר ${beta > 0 ? 'מעל השמש' : 'מתחת לשמש'}: מסלולו נטוי 5° והצל מפספס את כדור הארץ החודש.` `` |
| E13b | 13 (sim.ts) | `` `לבשת ${GEAR_NAMES[gear]} — …` `` | "לבשת כובע שמש" is the wrong verb (a hat is חובשים). The line is in `sim.ts` (lead's file); I didn't touch it. P1 only because every student who picks the hat wrongly sees it. | `` `בחרת ${GEAR_NAMES[gear]} — אבל זה ${ZONE_NAMES[zone]}. …` `` (both branches) |

### P2: answer leak, solvability gap, wrong acceptance or wrong term

| ID | Lvl | Current | Problem | Replacement / fix |
|---|---|---|---|---|
| E6a | 6 | `hermonSnow = monthlyTemperature(33.4, L) < 10`, `sydneySummer = monthlyTemperature(-33.9, L) > 21`; tickets `[0, 90, 180, 270, 300]` | **The 21 March ticket passes both shots** (Hermon 9.9 °C < 10, Sydney 21.4 °C > 21). So a student can "photograph a summer beach in Sydney" on the March equinox, which Workbook frames as the start of autumn in the south. It also skips the level's point (January, the closest day, is northern winter). Both margins are 0.1–0.4 °C, so any recalibration (A2) flips them. | `sydneySummer = (L) => monthlyTemperature(-33.9, L) > 22` (Dec 25.0, 20 Jan 26.5, Feb 25.2 pass; Mar 21.4, Jun 4.5, Sep 9.1 fail), or drop `L: 0` from L6's ticket list. Re-check both thresholds if A2 is applied. |
| E6b | 6 | hint: `…באיזה חצי כדור היא בינואר?` | Names the month. The level also never *shows* the Earth–Sun distance, so the "not distance" contrast is never made in play. | Hint: `הנקודה שבה השמש מעל הראש מסומנת. מתי היא הכי רחוקה מהחרמון?` Add a success note on the second shot: `` `${dateLabel(c.L)}: כדור הארץ במרחק ${fmt(sunDistanceAU(c.L), 3)} יח' אסטרונומיות — הכי קרוב לשמש בשנה, ובכל זאת חורף בחרמון.` `` (only for L in Dec–Feb). |
| E7a | 7 | `ב-40° צפון השמש אף פעם לא מגיעה לזנית — גם לא ב-21 ביוני. הצל נשאר.` | The decoy line **leaks the date** the tropic gate needs, before the player spends the only ticket. | `ב-40° צפון השמש אף פעם לא מגיעה לזנית, בשום תאריך. הצל נשאר.` (keep "40° צפון": `levels.test.ts` asserts it). |
| E11a | 11 | hint: `הנקודה שבה השמש אנכית מסומנת.` + overlay `subsolar` | The overlay is the exact target (the shot needs elevation ≥ 86°). The hint replaces the reasoning (December → southern hemisphere → Tropic of Capricorn). | `בדצמבר, איזה חצי כדור נוטה אל השמש? שם הקרניים הכי ישרות.` with overlay `{ kind: 'terminator' }` (or `{ kind: 'latitude', lat: -23.5 }` as a softer cue). |
| E12a | 12 | lava miss: `הלבה כהה — אבל השמש באיסלנד נמוכה יותר.` / rule: `…לבה כהה תחת שמש נמוכה מתחממת פחות מאספלט תחת שמש גבוהה.` | Half true in our own model. Asphalt 57.6 °C vs lava 31.0 °C: the lower Sun accounts for 6 °C of the 27 °C gap, the colder Icelandic air (10 vs 30 °C) for 20 °C. Under the same Sun and air, lava (57.3) ≈ asphalt (57.6). The line teaches the wrong dominant cause. | Miss: `הלבה כהה — אבל באיסלנד השמש נמוכה יותר והאוויר קר יותר.` Rule: `משטח בהיר מחזיר אור (אלבדו גבוה) ומשטח כהה בולע. אבל האלבדו לבדו לא קובע: לבה כהה באיסלנד, תחת שמש נמוכה ובאוויר קר, חמה פחות מאספלט בתל אביב.` (keep "לבה": asserted by the tests). |
| E13a | 13 | rule: `גובה שמש הצהריים = 90° − (המרחק מקו הרוחב שבו השמש אנכית)…` | The formula is in no Workbook module (CURRICULUM.md), so it needs the העשרה label. The level is solvable without it: on 21 June the three rounds give 76.5° (Sun to the north), 41.5° (south) and 32.5° (north). The key cue is the Sun's *direction*, and the hint asks exactly that. Good design. | `בין החוגים — טרופי; מעבר לחוגי הקוטב — קוטבי; ביניהם — ממוזג. ב-21 ביוני השמש אנכית מעל חוג הסרטן (23.5° צפון); ככל שמתרחקים ממנו, שמש הצהריים נמוכה יותר. (העשרה: גובה שמש הצהריים = 90° פחות המרחק מקו הרוחב הזה.)` |
| E13c | 13 | `fogged: true` | Unverified UI risk: any lat/lon grid labels, minimap or coordinate readout would give the latitude away. | Hide graticule labels, the minimap and coordinates while `fogged`. The hint overlay (the 23.5° line) is fine. |
| E15a | 15 | `PHASE_LABELS`: `רבע ראשון`, `רבע אחרון` | Students read "רבע" as a quarter of the disc. Workbook says "חצי ירח". | `רבע ראשון (חצי ירח)`, `רבע אחרון (חצי ירח)`. |
| E15b | 15 | `declareImpossible` accepted at any time (`sim.ts` line ~469) | The final request reduces to pressing a button. | Accept it only after the player has been on the roof at local noon with the moon age 13–16 days, or ask for a one-tap reason (`הירח המלא מול השמש` / `הירח קטן מדי` / `עננים`) and accept only the first. |
| E16b† | 16 | explain.wave: `…בשפל של ירח מלא או מולד המים יורדים הכי נמוך.` | Spring/neap is not in the module. The hint now carries "(העשרה: גאות שיא)", but the failure line doesn't. | `הגאות כיסתה את השביל. בחוף אוקיינוס המים עולים ויורדים מטרים, פעמיים ביום. (העשרה: בירח מלא ובמולד השפל הכי עמוק.)` |
| E16c | 16 | rule: `…בחופי האוקיינוס ההפרש מטרים…` | Overgeneralizes (see B: metres only in some funnel coasts; most ocean coasts have 1–4 m). | `…בחופים מסוימים של האוקיינוס ההפרש מטרים רבים; בים התיכון רק 20–40 ס״מ.` |
| E16d | 16 | Tel Aviv part: two shots ≥ 3 h apart, always accepted | No decision, only observation. | Give the Tel Aviv part a short time budget, so a player who waits for a low tide there runs out of time, while a player who knows the range is 20–40 cm shoots and leaves. |
| E17b | 17 | brief: `…איזה מולד נמצא על הקו?` / tickets: `upcoming: 6`, 2 tickets | "על הקו" is vague without the hint (which line?). Of the 6 new moons (23 Jun, 23 Jul, 21 Aug, 20 Sep, **19 Oct**, 18 Nov), only 19 Oct has an eclipse. Unless the timetable pictures draw the Moon's tilted orbit and its node line, the no-hint choice is luck (2 tickets give ~1/3). | Brief: `…באיזה מולד הירח יעבור בדיוק בין השמש לכדור הארץ?` Always draw the Moon's orbit and its crossing points in the ticket pictures (a world cue, not an answer); the hint then highlights the node line. |
| E18a | 18 | `wrap180(c.L) >= 0 && wrap180(c.L) < 90` (in both the full-moon and the sunrise checks) | The six full-moon tickets land at 18 Mar, **15 Apr (with the lunar eclipse)**, **16 May** and **14 Jun** (plus two winter ones). The check accepts May and June full moons as Pesach's. | Use `wrap180(c.L) >= 0 && wrap180(c.L) <= 35` (21 Mar–25 Apr) in both checks, with the message `ניסן חל באביב: הירח המלא של פסח הוא בין סוף מרץ לסוף אפריל.` |

### P3: wording polish

| ID | Lvl | Current | Replacement |
|---|---|---|---|
| E10a | 10 | `` `צל הצהריים באורך ${fmt(shadow, 2)} — …` `` | No unit. `` `צל הצהריים ארוך פי ${fmt(shadow, 2)} מגובה המקל — …` `` (model values: June 0.15, equinoxes 0.62, December 1.44). |
| E11b | 11 | `` `הקרניים פוגעות כאן בזווית ${…}° — הכתם מתמרח לאליפסה ארוכה פי ${…}.` `` | Use the module term: `` `זווית הקרינה כאן ${…}° — הכתם מתמרח לאליפסה ארוכה פי ${…}.` `` (keep "אליפסה"). |
| E12b | 12 | not-noon miss: `` `המגזין רוצה צילום צהריים. (המצלמה התרמית: ${t}°C)` `` | A cheap off-noon shot reveals temperatures before the player commits, which weakens predict-then-observe. Drop the parenthesis from this miss. |
| E12c | 12 | title `גיליון תרמי` | "גיליון" reads as "sheet" before "magazine issue". `צילום תרמי` or `המגזין התרמי`. |
| E15c | 15 | hint: `…רבע ראשון: כשבוע אחרי המולד… מלא: כשבועיים…` | Gives the sleep durations outright. `הירח מואר מצד השמש. כמה ימים לוקח לו להגיע מהמולד לצד שמול השמש? (מחזור שלם ≈ 29.5 ימים)` |

### Checked and fine

- **L8:** only the June ticket gives a midnight Sun at 69° N (+2.5°). The December ticket brings polar night and the bear. The hint (`חוג הקוטב הצפוני מסומן. מתי הוא כולו בצד המואר?`) is a question, not the answer.
- **L9:** the 12 h ± 0.25 h test only passes within a day of the equinox, and the hint (the terminator through both poles) is the module's own picture.
- **L10:** tickets keep the time of day and the level starts at 11:24 local, so every ticket lands before noon. The ±0.4 h window is ≈ 8 real seconds at rate 0.1: fine. That fixes the old E10 finding.
- **L14:** the rails at 70° (polar night, 0 h) and 62° (4.7 h) make the latitude choice real, and the rule's "הצהריים מגיעים קודם למי שבמזרח" makes the east ride the second decision.
- **L15:** "7 המופעים הנראים" correctly excludes the new moon, and the noon-full-moon sulk line teaches the cause.
- **L18:** `hint: null`, unlabeled tickets, three modules combined. The 15 April full moon is the eclipse one, so the intended route exists.
- Source-module errors from B are not repeated anywhere in Worlds 2–4 ("Israel between the equator and the tropic", "10–15 m on all ocean coasts" apart from E16c, waves vs. tides, "בדיוק" for the greenhouse).

---

## F. Solvability and weak-design summary

The lead's `tests/levels.test.ts` drives a scripted bot through all 18 levels (one winning route and at least one losing route each), so every level is solvable *by a player who already knows the answer*. The question here is whether it is solvable *from the screen* and whether brute force wins.

- **L1–L5:** as before. L2's dream instruction is now a tutorial line. The third star should still need a prediction made *before* the dream (a 50/50 east/west guess otherwise). L5: a "sleep 24 h" guess lands at 20:42 and misses the ±0.5 h window. Good.
- **L6:** brute force works with 1 ticket because 3 of 5 tickets pass (E6a). After E6a, 2 of 5 (Dec, Jan).
- **L7:** one ticket, and the level starts on 21 March, so the equator gate is "now" and the ticket must be June. Good, once E7a stops leaking it.
- **L8:** 1 of 4 tickets works, with immediate consequences (the bear). Good.
- **L9, L10:** good.
- **L11:** solvable from the screen only with the hint overlay. Without it, the student must reason December → southern tropic (good), but the overlay hands it over (E11a).
- **L12:** good predict-then-shoot, apart from the off-noon thermal readout (E12b).
- **L13:** good. Elevation alone misleads (Cape Town 32.5° is lower than Greenland 41.5°), and the Sun's direction resolves it.
- **L14:** good.
- **L15:** the "impossible" step is free (E15b).
- **L16:** the causeway is a real decision. The Tel Aviv part isn't (E16d).
- **L17:** a guess unless the node line is visible in the ticket pictures (E17b).
- **L18:** E18a lets a June full moon pass as Pesach's.

Unverifiable from code (UI): `<bdi>` wrapping; graticule/minimap in fogged L13; what the timetable pictures draw for L10, L17 and L18; whether the L2 dream event text appears at the right moment.
