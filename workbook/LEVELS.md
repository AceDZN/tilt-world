# Tilt World · עולם נטוי: workbook catalog entry

- **Slug:** `tilt-world`
- **Hebrew title:** עולם נטוי
- **English title:** Tilt World
- **Tagline (he):** צילה, רובוטית צילום סולארית, לא יכולה להזיז את כדור הארץ, את השמש או את הירח — רק לרוץ, לישון ולקנות כרטיס לתאריך. כל הזמנת צילום היא חידה: להיות במקום הנכון כשהשמיים נכונים.
- **Grades:** 8
- **Orientation:** any (plays on a portrait phone: a touch stick, a shutter button and action chips; checked at 390×844)
- **Levels:** 18 authored levels; `?level=N` opens level N's intro card directly, even when locked.

Module paths come only from `acedzn-tools/packages/catalog-geography/src` (`ids.ts`, `grade-8.ts`). The per-level reasoning and source quotes are in [../CURRICULUM.md](../CURRICULUM.md).

| n | Level title | Skill | Modules |
|---|---|---|---|
| 1 | הזריחה הראשונה | כדור הארץ מסתובב ממערב למזרח | `grade-8/chapter-2/earth-rotation` |
| 2 | השמש "זזה" | תנועת השמש המדומה בשמיים | `grade-8/chapter-2/earth-rotation` |
| 3 | גלישה על הדמדומים | מהירות קו היום והלילה | `grade-8/chapter-2/earth-rotation` |
| 4 | ‏15° לשעה | קווי אורך והפרשי שעות | `grade-8/chapter-2/earth-rotation` |
| 5 | יום הולדת פעמיים | קו התאריך הבין־לאומי | `grade-8/chapter-2/earth-rotation` |
| 6 | זה לא המרחק | העונות נובעות מנטיית הציר | `grade-8/chapter-2/earth-revolution` |
| 7 | בדיוק מעל הראש | קרני שמש אנכיות וחוגי המהפך | `grade-8/chapter-2/earth-revolution` |
| 8 | שמש חצות | יום קוטבי ולילה קוטבי | `grade-8/chapter-2/earth-revolution` |
| 9 | יום שוויון | יום שוויון: יום ולילה שווים | `grade-8/chapter-2/earth-revolution` |
| 10 | שנה על גבעה אחת | גובה השמש בצהריים לאורך השנה | `grade-8/chapter-2/earth-revolution` |
| 11 | פנס | זווית הקרינה ואנרגיה לשטח | `grade-8/chapter-3/sun-energy`, `grade-8/chapter-2/earth-revolution` |
| 12 | גיליון תרמי | אלבדו, קו רוחב ואי חום עירוני | `grade-8/chapter-3/sun-energy` |
| 13 | איפה אני? | אזורי אקלים לפי גובה השמש | `grade-8/chapter-3/climate-zones`, `grade-8/chapter-2/earth-revolution` |
| 14 | בריחה מהלילה הקוטבי | חוג הקוטב והלילה הקוטבי | `grade-8/chapter-2/earth-revolution`, `grade-8/chapter-2/earth-rotation` |
| 15 | מופעי הירח | מופעי הירח | `grade-8/chapter-2/moon-and-tides` |
| 16 | גאות ושפל | גאות ושפל, גאות שיא וגאות שפל | `grade-8/chapter-2/moon-and-tides` |
| 17 | ליקוי חמה | מתי מתרחש ליקוי חמה | `grade-8/chapter-2/moon-and-tides` |
| 18 | לוח השמיים | ירח מלא, ליקוי ירח ולוח עברי | `grade-8/chapter-2/moon-and-tides`, `grade-8/chapter-2/earth-rotation`, `grade-8/chapter-2/earth-revolution` |

## Host notes

- Bridge: `src/host.ts` matches pie-duel's file. `ready` is posted after the first rendered frame (textures, models and fonts loaded), then `level-start` when an authored level opens (deep link, level select, next or restart), and `level-complete` `{level, stars, durationMs}` once per won run. Random photo quests (menu 🎲, ids from 100 up) post nothing. `durationMs` is wall time since the level opened, including the intro card and pauses.
- `?level=N` skips the menu and opens the level's intro card (title, brief, keys). One click or Enter starts play; the intro is not skipped. No level has another story beat before play.
- Poster: `npm run poster` (needs `npm run dev`) writes a real 1600×900 L8 midnight-sun frame to `workbook/poster.jpg`, about 180 KB. It is git-ignored, like every capture in this repo, so pass it to the release with `--poster`.
- Check: `npm run build && npm run test:embed` (serves `dist/` with `vite preview` on :4242, iframes it at `?level=1` from a :4999 parent, wins L1 through the game's input hook, and checks a standalone `?level=12` posts nothing).
