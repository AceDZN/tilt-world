# Tilt World — 3D assets

All models come from Tripo Studio (studio.tripo3d.ai), used through the user's signed-in Chrome session on 2026-10-31. No API tokens were used, no credits were bought, and no new terms were accepted. Some landmarks are reused from sibling games in this workspace, and their provenance is listed below.

## Budget used

Budget for this game: up to 8 new generations, 3 rig/animation jobs, and at most 600 displayed credits.

- **New generations: 8 of 8.**
  - Characters: Tzila and the polar bear.
  - Props: tripod camera, sleep pod, locomotive, ticket booth, weather mast and stone circle.
  - Free Retries were used on Tzila, the bear, the weather mast and the stone circle. They cost 0 and are not counted as generations.
- **Rig/animation jobs: 2 of 3.** Tzila got a Humanoid/Mixamo rig with 9 preset retargets, and the bear got a Humanoid/Mixamo rig with 4 preset retargets. No AI-animation jobs were used.
- **Gallery exports: 2.** Fuji and the greenhouse, 5 credits each.
- **Reused from sibling repos: 5 files, 0 credits.** Cabin, palm, lighthouse, city gate and stone wall.
- **Credits spent by this crew: about 290.** That is 8 × 30 + 2 × 20 + 2 × 5.

The balance is shared with other crews who were generating at the same time. Deltas are only reliable where they were read just before and after a click.

- Session start: 3080 (Assets page, 14:31).
- Session end: 2480 (15:18).
- Most of the 600 drop between those readings was other crews' work.

| Action | Cost (credits, read before/after) |
| --- | --- |
| HD text-to-3D generation (H3.1) | 30 |
| Free Retry | 0 (keeps the earlier version in model history) |
| Auto Rig | 20 |
| Preset retarget | 0 |
| Own-model export (with or without animations) | 0 |
| Gallery model export | 5 |

Generation settings for every new model:

- Text prompt
- HD Model, AI model "H3.1 – Best Quality"
- Texture on, 2K, PBR on, Remove Lighting on
- Triangle topology, polycount 20000
- Privacy: Private
- The T-Pose toggle was on for Tzila only.

## Processing (all files)

Raw downloads go in `assets-src/tripo/<name>_raw.glb`, and optimized files go in `public/models/<name>.glb`. The tool is @gltf-transform/cli 4.5.1. The default pass is:

```
npx -y @gltf-transform/cli optimize assets-src/tripo/<name>_raw.glb public/models/<name>.glb \
  --compress false --simplify false --texture-compress webp --texture-size 1024
```

- There is no meshopt or Draco compression, so plain `GLTFLoader` loads every file without a decoder.
- Textures are 1024² WebP (`EXT_texture_webp`).
- Some props carry `KHR_materials_volume` from Tripo, which is harmless in three.js.
- Extra steps for some files are listed per model below.

Conventions:

- **Tripo models are Y-up, sit on y = 0, and are about 1 unit at their largest dimension.** Scale them in code.
- **Unless stated otherwise, the front faces +Z.** Facing was checked from the geometry: an orthographic front/side render plus feature positions.

| File | Raw bytes | Optimized bytes | Triangles | sha256 (optimized) |
| --- | ---: | ---: | ---: | --- |
| tzila.glb | 4,287,628 | 2,100,240 | 19,290 | 5585b8989c121f6ff8e207ca07b275f7a45d89e64531040ecdf8142ba3ebd01d |
| polar_bear.glb | 3,518,224 | 1,343,320 | 18,926 | b90e704e35fb39939d745ccb57e5b3e22e4952839dc9d83f047b272ab0c2a866 |
| tripod.glb | 2,308,484 | 556,744 | 18,899 | fd1c4fef4477b5619dec9905803dd8d2cb327c71c065720687acd6e91ddebe9d |
| sleep_pod.glb | 2,280,528 | 556,412 | 19,164 | 0e98302ab9f409e1fbee0308488eefd173be9223faef57dd63e5186fad094bb7 |
| locomotive.glb | 2,505,816 | 650,256 | 18,283 | 32e7eb89cd82ace6ae504c6e685f00e96a6ce645f5d088e45346431149ec9f28 |
| ticket_booth.glb | 2,762,680 | 634,648 | 17,961 | bcc496bc709d87bf6f91e791641011aa2eef7653b71d905b40b10b0947e221b2 |
| weather_mast.glb | 2,683,548 | 623,308 | 19,340 | 14d7133c5877eb15afeacc5b1985dd57a51b721c730b5494664d8031a0412fb4 |
| stone_circle.glb | 3,005,932 | 584,128 | 19,540 | 8fc0e47281c4b7c5b2a607c3b728f86a1fecfea523132b7afa2a17daf0615a98 |
| fuji.glb | 52,069,664 | 311,076 | 17,224 | 342a2195af39903e7f3fe60eae062134afa99d4edaf2daf16734865acc542862 |
| greenhouse.glb | 31,621,280 | 487,952 | 27,723 | c3db5dfd756bb571da2507ad2b42cc5b12b796e9762760c06cf1a54054a5ae3d |
| lapland_cabin.glb | 2,847,932 | 368,320 | 7,545 | 49a6899f83d65af4872324033ea3f58e684e0f5222781f1f4fb3b5be46b06519 |
| palm.glb | 1,372,240 | 836,204 | 19,119 | 6900cae7ee0f8c19fe14ae738354036a354e888d03de39064b29b2da0d5ab022 |
| lighthouse.glb | 816,344 | 704,032 | 19,267 | c3708ed40846ccb5019bb3521be761facfbd5dec1b9aeb6b7b42bda01028e70d |
| city_gate.glb | 184,032 | 283,136 | 5,746 | f0b2304a2a06ff563d8cf79f7d0d1cbe8a6819e510a5c53275575a8c86c41403 |
| stone_wall.glb | 124,124 | 251,172 | 5,861 | 3cf832dd80891689b1b81b2696b39c8fc52b11b30e585c67ad16732968366a08 |

All files are under 3 MB. Raw files for the reused models are in `assets-src/tripo/reused/`. They are meshopt-compressed sources, which is why some optimized files are larger than their raw files.

## Characters (rigged)

### tzila.glb — Tzila, the solar photographer robot (hero)

- **Source:** generated.
- **Task:** https://studio.tripo3d.ai/workspace/generate/ecb0fa89-436a-4c31-ad47-ca5d5b225385. The rig and animate pages use the same id under `/workspace/rigging/` and `/workspace/animate/`.
- **Prompt (T-Pose toggle on):** "Stylized cartoon game character, a cute chunky solar-powered photographer robot girl: rounded glossy white body with coral-orange bands and panels, a single huge round camera lens as her whole face with a glowing blue iris, a small antenna with an orange ball tip on top of her head, two small flat blue solar-panel wings folded on her back, short stubby arms with round mitten hands, short stubby legs with chunky coral boots, a small black camera hanging on a coral strap across her chest, a little orange sun emblem on her back. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Full body, bipedal humanoid proportions, standing in T-pose, symmetrical, arms straight out, legs slightly apart, front view."
- **Credits:**
  - Generation: 3030 → 3000.
  - The first result had a lime-yellow head. Free Retry (0 credits) gave the accepted white/coral version.
  - Rig: 2910 → 2870, of which 20 was ours; another crew was also generating.
- **Rig:** Tripo Auto Rig, Humanoid, skeleton preset **Mixamo**.
  - One skin with 65 joints (`mixamorig:Hips`, …).
  - Scene roots: `Armature` plus the mesh node.
  - Bind pose is a T-pose.
- **Animations:** Tripo presets, exported together in one GLB with "Animation stay in Place" on. Exact clip names and durations:
  - `idle`: 15.333 s loop
  - `run`: 1.25 s loop
  - `walk`: 2.333 s loop
  - `jump`: 2.208 s
  - `cheer`: 12.083 s, the "snap-photo / cheer" beat
  - `defeat_02`: 8.458 s, the sulk/defeat beat. **The clip is named `defeat_02`, not `defeat`.**
  - `fall`: 3.0 s, ends lying on the ground. Hold the last frame for "lying/sleep".
  - `look_around`: 15.583 s
  - `wave_goodbye_02`: 5.875 s
- **Gaps in the preset list:**
  - No grind/balance preset was offered. Use `run` or `idle` with a body lean in code.
  - No dedicated sleep preset was offered. Use the end of `fall`, or `sit`, which was not exported.
  - Other presets seen that could be useful: `sit`, `surf` (a balance stance, possibly usable for grinding), `standing_relax`, `make_a_call_01`, `play_mobile_game`.
- **Bounds:** x ±0.396 (arm span), y 0..1.0, z ±0.240.
- **Facing:** **+Z.** The camera lens and boot toes are at +Z (toe +0.125 vs heel −0.086), and the solar panels and sun emblem are at −Z.

### polar_bear.glb — cartoon polar bear (rigged)

- **Source:** generated.
- **Task:** https://studio.tripo3d.ai/workspace/generate/d3b95b40-2445-4a08-8bcd-ee35369775da
- **Prompt:** "Stylized cartoon game animal, a chunky friendly adult polar bear: thick fluffy cream-white fur, big rounded body, small round ears, black button nose and small black eyes, curious happy expression, big padded paws with dark pads. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Full body, standing on all four legs in a neutral pose, head forward, side three-quarter view, isolated animal."
- **Credits:**
  - Generation: 3000 → 2970.
  - Rig: 2710 → 2690.
- **Deviation from the brief:** both the first result and the Free Retry came out as a **bipedal, upright cartoon bear** (plush-like and cream white), not a four-legged bear. The retry is the version shipped.
  - Because it is bipedal, it was rigged Humanoid/Mixamo instead of quadruped "Other".
  - That gives more usable clips: the quadruped rig only offers `walk`.
  - It reads fine for the "peeks from behind a rock" cameo in mockups 02 and 07.
- **Rig:** Tripo Auto Rig, Humanoid, **Mixamo**. One skin with 65 joints; scene roots are `Armature` plus the mesh node.
- **Animations** (presets, stay-in-place):
  - `idle`: 15.333 s
  - `walk`: 2.333 s
  - `wave_goodbye_02`: 5.875 s
  - `look_around`: 15.583 s
- **Bounds:** x ±0.378, y 0..1.0, z ±0.312.
- **Facing:** **+Z** (snout at +Z).

## Props (generated)

### tripod.glb — retro camera on a tripod (Tzila's photo tripod)

- **Task:** https://studio.tripo3d.ai/workspace/generate/c8aaaea5-85e8-46f0-ab91-276eba954f2b
- **Prompt:** "Stylized cartoon game prop, a vintage camera tripod with a chunky retro box camera mounted on top: three slim wooden legs with brass joints spread wide and standing on the ground, a boxy white and coral-orange camera body with one big round glass lens facing forward, a small flash lamp on top. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Isolated single object, standing upright, front three-quarter view."
- **Credits:** 2690 → 2660.
- **Look:** white/coral boxy camera with a big navy-rimmed lens and an orange flash on top, on three orange-yellow legs. It matches Tzila's palette well.
- **Bounds:** x ±0.313, y 0..1.0, z ±0.342.
- **Facing:** the lens faces **+Z**.

### sleep_pod.glb — egg-shaped sleep pod

- **Task:** https://studio.tripo3d.ai/workspace/generate/9fba0ecd-5938-4fab-acc4-cbe69c75c5b5
- **Prompt:** "Stylized cartoon game prop, a cosy egg-shaped sleep pod for a small robot: smooth glossy white egg-shaped shell lying on its side on a short sturdy base, coral-orange trim bands around it, one big round glass hatch window on the front side, through the glass a soft coral blanket and a small pillow visible inside, a small orange sun emblem on the shell. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Isolated single object, front three-quarter view."
- **Credits:** 2660 → 2630.
- **Look:** a white egg with a coral base ring and a round glass hatch, with a coral blanket and pillow inside and an orange sun emblem on the side.
  - It stands **upright** (taller than wide), not lying on its side as prompted.
  - The hatch is part of the shell; there is no separate door to open. Fake the opening with a glow or a scale pop.
- **Bounds:** x ±0.407, y 0..1.0, z ±0.361.
- **Facing:** the hatch faces **+Z**.

### locomotive.glb — whimsical steam locomotive (calendar train)

- **Task:** https://studio.tripo3d.ai/workspace/generate/16877449-1ada-4406-805b-b01c5ffe1413
- **Prompt:** "Stylized cartoon game vehicle, a small whimsical toy-like steam locomotive: short chunky body, deep teal-blue boiler with brass bands, a bright red cab with round windows, big red spoked wheels, a cow-catcher at the front, a round headlamp, and a tall chimney shaped like a stack of tear-off calendar pages with a puff of white steam on top. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Isolated single object, on rails-ready flat base, side three-quarter view."
- **Credits:** 2630 → 2600.
- **Look:** a toy engine with a teal boiler, brass domes, a red cab and red spoked wheels, and a white steam puff.
  - The chimney is a plain stack, **not calendar pages**. Add a calendar-page sprite or decal in code if wanted.
  - **The mesh includes a short straight rail section under the wheels**, merged into one mesh. Hide it under the track or accept it.
- **Bounds:** x ±0.5 (length), y 0..0.761, z ±0.204.
- **Facing:** **the front (chimney and cow-catcher) points to −X.** Drive it along −X, or rotate it by +90° about Y to face +Z.

### ticket_booth.glb — station ticket booth

- **Task:** https://studio.tripo3d.ai/workspace/generate/1ac9d4d4-d113-436e-93fc-2767533c7273
- **Prompt:** "Stylized cartoon game building prop, a tiny whimsical railway station ticket booth: a small square wooden kiosk painted cream and teal with a red pointed roof covered in a thin layer of snow, one front ticket window with a little arched awning and a small counter shelf, a round station clock above the window, a small lantern hanging at the corner, sitting on a low stone base. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Isolated single object, front three-quarter view."
- **Credits:** 2570 → 2540.
- **Look:** a cream and teal kiosk with a red snowy roof and finial, a clock, a striped awning, an open window and a stone base.
- **Bounds:** x ±0.347, y 0..1.0, z ±0.335.
- **Facing:** the window and clock face **+Z**.

### weather_mast.glb — weather station mast

- **Task:** https://studio.tripo3d.ai/workspace/generate/5af55e94-fa21-43cf-9c13-ea277da79909. The **Free Retry** version is shipped; the first version, with a single horn-like red cup, is in model history.
- **Prompt:** "Stylized cartoon game prop, a small whimsical weather station mast: one tall slim white metal pole on a chunky round concrete base, at the top a spinning cup anemometer with three red cups and a bright orange wind vane arrow, halfway up a small white louvered instrument box and a little round solar panel, a tiny blinking light on top. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Isolated single object, standing upright, front three-quarter view."
- **Credits:** generation 2540 → 2510; retry 0.
- **Look:** a white pole on a stone base with an orange wind-vane arrow at the top, red cup anemometer heads, a louvered box and small instruments.
  - It is all one mesh, so the cups cannot spin separately.
- **Bounds:** x ±0.23 (the vane runs along X), y 0..1.0, z ±0.159.
- **Facing:** the louvered box faces **+Z**.

### stone_circle.glb — small stone circle

- **Task:** https://studio.tripo3d.ai/workspace/generate/9032e730-9cf7-4f40-b2b2-a48db37c3726. The **Free Retry** version is shipped; the first version is in model history.
- **Prompt:** "Stylized cartoon game landmark, a small ancient stone circle monument like a tiny Stonehenge: a ring of eight chunky upright grey standing stones, three pairs topped with flat lintel stones forming arches, a flat round grassy green base disc with a few small flowers, one flat altar stone in the centre. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Isolated single object, three-quarter view from slightly above."
- **Credits:** generation 2510 → 2480; retry 0.
- **Look:** standing stones with lintels and a central block on a round grass-and-earth disc.
  - **The colours are off.** Some stones are lime-green and some glow purple instead of plain grey. Both versions had this.
  - The ring is only partly closed.
  - If it bothers you, override the stone colour in code (for example, multiply by a grey tint) or build the circle procedurally instead.
- **Bounds:** x ±0.498, y 0..0.5, z ±0.5. It is roughly round, so facing doesn't matter.


## Landmarks (gallery and reuse)

### fuji.glb — Mount Fuji (gallery)

- **Source:** community gallery, "low poly mountain 3d model" by kaixinghaibao: https://studio.tripo3d.ai/3d-model/mount-fuji-low-poly-style-clean-mountain-body-snow-on-top-blue-sky-515b0b60-ad77-4f89-9275-ca2d1431b7f3
  - Tripo H3.1.
  - Original prompt: "Mount Fuji, low poly style, clean mountain body, snow on top, blue sky and white clouds, PBR material, complete UV, with diffuse texture, export to glb format, no extra parts, game-ready".
- **Credits:** gallery export, 5 (2810 → 2805).
- **License/terms:** the page shows no license or usage-terms text. Use falls under Tripo's general Terms of Service for community gallery models; confirm before any commercial release.
- **Processing:** the raw mesh is 1,477,664 triangles with heavy UV seams, and plain `simplify` stalled at about 236k. So the file was processed differently from the default pass:
  1. The base-colour texture was baked into **vertex colours** (COLOR_0, sRGB converted to linear).
  2. Vertices were welded by position.
  3. The floating cloud component (41,856 tris) was dropped.
  4. The mesh was simplified with meshoptimizer to 17,224 triangles.
- **As a result, the file has no textures, normals or UVs.** three.js renders it **flat-shaded** with `vertexColors`, which suits the low-poly look. Material: baseColor 1, metallic 0, roughness 0.85.
  - If smooth shading is wanted, call `geometry.computeVertexNormals()`.
- **Bounds:** x ±0.468, y 0..0.573, z −0.5..0.488. The mountain is roughly round, so it has no meaningful facing.

### greenhouse.glb — glass-dome greenhouse (gallery; stands in for the geodesic dome)

- **Source:** community gallery, "greenhouse 3d model" by emersonluizbert: https://studio.tripo3d.ai/3d-model/a-stylized-low-poly-greenhouse-facility-for-cultivating-prehistoric-pl-2ebd6111-8c8c-4f04-9e22-533bf5bd4c2e
  - Original prompt: "A stylized low poly greenhouse facility for cultivating prehistoric plants in a dinosaur theme park, isometric view. Huge glass dome buildings with giant ancient ferns, cycads, and tall paleobotany trees visible inside. Clean concrete base, modern botanical garden aesthetic. Bright vibrant green colors, casual tycoon game 3D asset, clean geometry."
- **Credits:** gallery export, 5 (balance 2805 before, next read 2810 because of shared activity).
- **License/terms:** the page shows no license text (same note as Fuji).
- **Processing:**
  1. The raw mesh (924,616 tris) was baked to vertex colours and welded, the same as Fuji.
  2. It was simplified with `--ratio 0.03 --error 0.003` to 27,723 tris, then pruned.
  3. As with Fuji, there are **no textures, normals or UVs**, and it renders flat-shaded with vertex colours.
- **Look:** glass domes with palms and ferns inside, on a concrete base. It is a domed greenhouse, not a strictly geodesic one.
- **Bounds:** x ±0.434, y 0..0.726, z ±0.5.

### lapland_cabin.glb — red snowy cabin (reused from slope-sled)

- **Source:** slope-sled's `hut_raw.glb`, a byte copy in `assets-src/tripo/lapland_cabin_raw.glb`.
  - Task: https://studio.tripo3d.ai/workspace/generate/abf337b3-d639-4d27-93ed-ac3f7bcb4cd6
  - It is in the account's assets as "stylized ski hut". Its prompt is in `slope-sled/ASSETS.md`.
- **Processing:** default optimize, then `simplify --ratio 0.4 --error 0.004` (18,902 → 7,545 tris).
- **Bounds:** x ±0.488, y 0..1.0, z ±0.487. It is nearly square; facing was not checked, so rotate it to taste.

### palm.glb — palm tree (reused from halfpipe-joule)

- **Source:** `assets-src/tripo/reused/palm_from_halfpipe-joule.glb`.
  - Task: https://studio.tripo3d.ai/workspace/generate/896752c3-1a08-4f00-8c43-7edec4cb9e41 (see `halfpipe-joule/ASSETS.md`).
- **Processing:** default optimize.
- **Bounds:** x ±0.334, y 0..1.0, z ±0.306.

### lighthouse.glb — lighthouse (reused from storm-proof)

- **Source:** `assets-src/tripo/reused/lighthouse_from_storm-proof.glb`.
  - Task: https://studio.tripo3d.ai/workspace/generate/5b9dffc4-f782-47a0-9026-8d5804aed538 (see `storm-proof/ASSETS.md`).
- **Processing:** the source was meshopt-compressed and quantized. Steps:
  1. Optimize (decodes it, no compression).
  2. `dequantize`.
  3. `simplify --ratio 0.25 --error 0.002` (77k → 19,267 tris).
- **Note:** positions are stored normalized (−1..1) with a scale/translation on the node. Use the scene or world bounding box, not raw accessor bounds.
- **World bounds:** x ±0.134, y 0..0.982, z ±0.133. Faces +Z.

### city_gate.glb — stone arch gateway (reused from storm-proof `doorframe`)

- **Source:** `assets-src/tripo/reused/doorframe_from_storm-proof.glb`.
  - Task: https://studio.tripo3d.ai/workspace/generate/3875f0b6-6572-4485-9306-d76d4d6585bf
  - Prompt (from storm-proof): a chunky weathered grey stone doorway with a rounded arch and an empty opening.
- **Processing:** optimize, then `dequantize`. The node carries a scale/translation, the same as the lighthouse.
- **World bounds:** x ±0.452, y 0..1.0, z ±0.146. The opening faces ±Z.
- It stands in for a generic old-city gate; it is not a specific real gate.

### stone_wall.glb — dry-stone wall segment (reused from ph-rangers)

- **Source:** `assets-src/tripo/reused/wall_from_ph-rangers.glb`.
  - Task: https://studio.tripo3d.ai/workspace/generate/0ea89e74-d2cf-4a7b-b1d5-31137315a24b
- **Processing:** optimize, then `dequantize`. The node carries a scale/translation.
- **World bounds:** x ±0.5 (the long axis), y 0..0.325, z ±0.098. Tile it along X.

## Searched and not used

**Own assets** (studio.tripo3d.ai/assets, about 172 models from earlier crews):

- No polar bear, camera tripod, Fuji, geodesic dome, sleep pod or locomotive.
- Looked at and skipped:
  - "brass camera lens": a lens only.
  - "drilling derrick tripod": industrial.
  - "observatory", "stone house", "polar research hut", "colorful wooden cabin": not needed or wrong style.
- **Reused:** the stone arch, stone wall, lighthouse, palm and ski hut, listed above.

**Gallery searches:**

| Search | Result | Why not used |
| --- | --- | --- |
| "camera tripod" | Realistic tripods without a camera | Style, and no camera. Generated instead |
| "polar bear" | Mostly bipedal or plush bears, plus one realistic walking bear | Style. Generated instead |
| "mount fuji" | Green-base Fuji diorama by shigeaki7923 (602k faces) | Gap in the base, and trees at the foot. **The kaixinghaibao Fuji was used instead** |
| "geodesic dome greenhouse" | No results | — |
| "greenhouse" | Dome greenhouse by emersonluizbert | **Used** |
| "stone circle" | Dark realistic rock rings, a wooden fence and a stadium | Style. Generated instead |

## Not done

- No glider (dropped by the brief).
- No grind/balance clip; Tripo has no such preset (see Tzila).
- Rig job 3 of 3 was left unused.

## Earth textures (NASA)

| File in `public/textures/` | Source (downloaded to `assets-src/nasa/`, git-ignored) | Size |
|---|---|---|
| `earth_day.jpg` | NASA Blue Marble Next Generation, December 2004, topography + bathymetry (`world.topo.bathy.200412.3x5400x2700.jpg`) | 5400×2700 |
| `earth_night.jpg` | NASA Earth Observatory Black Marble 2012 (`dnb_land_ocean_ice.2012.3600x1800.jpg`) | 3600×1800 |
| `earth_clouds.jpg` | NASA Blue Marble cloud composite (`cloud_combined_2048.jpg`) | 2048×1024 |

NASA imagery is not copyrighted; NASA asks for credit ("NASA Earth Observatory / Blue Marble"), which the README gives. The images show no political borders; the game draws none.
