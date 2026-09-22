# Tiny Defense courtyard & storybook assets

## Sketchbook reader revision

The reading surface now uses a cloth-colored binding, inset illustrations, a central gutter and a animated paper leaf. Interaction reference: https://github.com/MengTo/sketchbook (Meng To; its README credits Matthew Yu's original concept). `book-turn.js` is an independent implementation for live HTML dialogue rather than image-only spreads; no reference artwork or fonts are bundled.

Each illustration appears only on its first story spread. Repeated illustrations become text-only spreads that divide complete dialogue paragraphs between the left and right leaves, preserving speaker and reading order. On narrow screens the two leaves flow vertically. The text-only routes apply the same first-occurrence rule. Tap the left/right page (or the left/right half on mobile) to navigate; vertical scrolling does not turn pages. Keyboard arrows, contents, sound, spoiler consent and saved progress are preserved; reduced motion skips the curl.

Created 2026-09-22. Courtyard artwork uses the built-in image_gen tool with game illustrations and sprites as references. Active web assets are courtyard-day-v2.webp and courtyard-night-v2.webp (1536 × 1024); see the revision notes below. Generated PNG originals remain in the Codex generated_images directory.

## Existing game illustrations and text

Exported by tools/build-world-assets.py from C:/OneStep/tiny_defense; source game files are read-only.
- prologue.webp: UI/Prologue/prologue_panel_1.png
- supplies.webp: UI/Story/story_supplies.png
- troll.webp: UI/Story/story_troll.png
- spring.webp: UI/Story/story_spring.png
- routes.webp: UI/Story/story_routes.png
- home.webp: UI/Story/story_home.png
- resident-run.webp: Units/Characters/GathererBoy/PawnRun.png (six original frames, lossless WebP). Courtyard resident animation reuses the actual game sprite.
- story.json: Loc.Story.cs, plus prologue.cut1 through prologue.cut5 from Loc.Season.cs. KO/EN/JA are the actual game translations. All current dialogue lines retained, including supplies.3 and supplies.4.
- Chapters 1–3 now follow the implemented StorySequence.cs: 8 + 5 + 5 scenes, plus all five prologue cuts (26 spreads, 26 illustrations, 64 narration/dialogue entries per language). Scene order and speakers come from the game arrays; per-line illustrations follow ArtFor(scene, page). Three scenes split at an illustration change without duplicating or dropping dialogue. Ring now includes all five lines.
- ring/summer/autumn/winter/records.webp: corresponding UI/Story/story_*.png. Chapter 2/3 use the latest dedicated game illustrations, including spirit_gift, seal_watch, mars_breaks_seal and together.
- Refresh only story content with --story-only to preserve existing audio encodes.

## Audio provenance and spotting

| Output | Trigger | Source | Rights |
|---|---|---|---|
| ../audio/lobby-theme.mp3 | Courtyard, daytime | Secret of Beautiful Forest | Existing website self-produced track; ../audio/lobby-theme-license.txt |
| audio/night.mp3 | Courtyard, nighttime | Crossing the Chasm — Kevin MacLeod | CC BY 4.0; visible credit included on each homepage |
| audio/story.mp3 | Book open | The Path of the Goblin King — Kevin MacLeod | CC BY 4.0; visible credit included on each homepage |
| audio/book-open.mp3 | Book opens | Kenney RPG Audio/bookOpen.ogg | CC0 |
| audio/book-close.mp3 | Book closes | Kenney RPG Audio/bookClose.ogg | CC0 |
| audio/page-1.mp3 ... page-3.mp3 | Page turn variations | Kenney RPG Audio/bookFlip1/2/3.ogg | CC0 |

Verified source pages on 2026-09-22:
- https://kenney.nl/assets/rpg-audio — CC0. Local pack License.txt retained at C:/OneStep/Assets/Sounds/Kenney/rpg-audio.
- https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100873 — CC BY 4.0.
- https://creativecommons.org/licenses/by/4.0/

Required attribution: “The Path of the Goblin King” Kevin MacLeod (incompetech.com), licensed under Creative Commons Attribution 4.0. Web copy re-encoded and loudness adjusted.

Music exported at 44.1 kHz / 128 kbps MP3 using ffmpeg loudnorm I=-23, TP=-3, LRA=11. Foley gain reduced by 6 dB and re-encoded. Runtime master defaults to 35%, with additional music/FX gain and 900 ms music crossfades. Playback begins only by a sound-button click. Hidden-tab and page-exit playback stops; settings remain off on a new visit. These are web listening levels, not a claimed broadcast delivery master.

## 2026-09-22 art and music revision

Active backgrounds: courtyard-day-v2.webp and courtyard-night-v2.webp. The original v1 images are retained for comparison. Castle.png supplied the teal stone palette and chunky architecture reference. All painted guards were removed; the website overlays the actual Units/Characters/LancerIdle.png as lancer-idle.webp (12 original 320 × 320 frames, lossless). Each guard holds one spear. Night uses the same sprites with lighting adjustment. Background remains a storybook interpretation rather than a gameplay screenshot.

Day now uses ../audio/lobby-theme.mp3 (Secret of Beautiful Forest), matching LoadingScreen.cs. Night uses audio/night.mp3 exported from Audio/bgm_nemesis_night.ogg, matching GameManager.cs: Crossing the Chasm by Kevin MacLeod, CC BY 4.0. Source: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700026 . Attribution is visible on all three homepages. Night conversion uses constant -8.3 dB gain, 44.1 kHz / 128 kbps MP3, preserving dynamics. The older audio/day.mp3 is unused.

### Adopted day revision prompt
Edit Image 1, the DAY courtyard artwork used by the Tiny Defense website. Images 2 and 3 are actual game sprite art-direction references: Image 2 is the Castle asset, Image 3 is the Lancer idle animation strip (many frames of ONE character, not many characters). Preserve Image 1's exact wide 1536x1024 composition, camera and clickable landmark positions: woodcutting stump/axe left, open gate center, campfire lower center, closed blue book and lantern on table lower right. Do not redesign the layout.
Correct the art to belong to this specific game: slightly chunkier, friendlier architecture with broad readable warm cream stone blocks and teal-blue stone trim/crenellations inspired by Image 2, squat rounded towers; organized color shapes and crisp controlled contours, restrained pixel-inspired illustration, much less speckled stone/foliage microtexture. Retain golden afternoon light, cozy welcoming atmosphere, blue banners, pines, vines, and depth. It should bridge a clean mobile game environment and its storybook, not photoreal medieval concept art or flat vector art. No artificial huge pixel stair-steps or global blur.
CRITICAL anatomy/equipment correction: replace BOTH gate sentries with tiny chibi LANCERS matching Image 3: large round teal/silver helmet, small dark-blue tunic/body, short legs, simple face. Each guard has EXACTLY ONE vertical spear total, gripped by just ONE hand; spear butt rests on the ground on the OUTER side away from the gate opening. Each guard's OTHER HAND is empty, relaxed at their side and visibly separate from their spear. Two guards = two spears in the entire scene, never four. No shield, no second shaft, no sword, no weapon held in the empty hand. A single simple silver spearhead per guard. Keep them at their current small positions flanking the gate, no enlarged foreground soldiers.
All other props maintain coherent construction and single functional tools. Book/axe/gate/fire/lantern positions unchanged so existing UI hotspots align. No lettering, text, UI, watermark.

### Final guard removal prompt
Remove BOTH soldiers completely from this castle courtyard artwork. Remove EVERY spear, spearhead, shaft, helmet, face, body, arm, hand and foot belonging to those two guards. They will be replaced later with real game sprites in the website, so the gate must have ZERO CHARACTERS AND ZERO WEAPONS around it.
Erase the entire left guard AND BOTH of his spears in rectangle x=680..785, y=435..590. Fill with the clean teal stone gate trim / cream wall and cobblestones that belong behind him. Erase the entire right guard and his spear in rectangle x=1025..1115, y=435..590. Fill with the matching cream wall, teal trim and ground. Both areas should be completely EMPTY, just architecture and ground. Do not replace the guards with other characters or props.
Preserve the rest of the courtyard exactly: scene size 1536x1024, book on table lower right, campfire lower center, axe on stump at left, all building outlines, sunny lighting, clean chunky illustration style. No UI/text. Empty gate sentry positions are the required result.

### Adopted night revision prompt
Create the NIGHT lighting version of the supplied empty Tiny Defense courtyard. Keep this exact 1536x1024 scene and all geometry, outlines, prop positions and clean chunky game-art rendering perfectly aligned for a website day/night crossfade. Only replace golden daylight with cool deep navy moonlight, a starry sky and soft silver moon; warmly lit amber windows, lanterns and campfire. Teal castle crenellations and cream stone remain recognizable, shadows blue not black. Preserve the simplified broad color shapes without adding noisy microtextures or photorealism. CRITICAL: gate sentry positions must remain EMPTY. There must be NO soldiers, people, spears, spearheads or weapons beside the gate. The real game soldiers will be composited at runtime. The axe on the left stump remains. Book, table, trees, doorway, fire, and lamps remain at exactly the same coordinates. No text or UI.

## Original day illustration prompt (v1)
Create a finished wide 1536x1024 storybook pixel-art illustration for the Tiny Defense interactive website, using the attached images as art-direction and architecture references only. A welcoming lived-in medieval castle courtyard seen from an elevated gentle three-quarter view, late afternoon golden sunlight, blue slate roofs and blue-and-gold heraldic banners, ivy and small wildflowers, forest beyond the walls. Composition for clickable scenery: on the LEFT third a woodland exit and a chopping stump with axe and stacked timber; CENTER midground an open stone castle gateway leading to sunlit pine woods; on the RIGHT foreground a wooden reading table with a prominent CLOSED deep blue leather storybook with a small gold tree emblem, beside a warm lantern; near lower center a small contained campfire with a kettle and stone seats. Spacious cobblestone courtyard, quiet homecoming mood, intimate handcrafted game world. A couple of tiny distant guards only, no large foreground characters. Beautiful detailed pixel-textured storybook art matching reference, crisp readable shapes and cinematic light. Artwork fills entire frame, no vignette, no words, no text, no UI, no watermark. Keep all three main landmarks within central 80 percent for responsive cropping. This is a scene asset, not a website screenshot.

## Night illustration prompt
Edit the supplied Tiny Defense castle courtyard image into its NIGHT version for an exact aligned website day/night crossfade. Preserve ALL architecture, object positions, perspective, crop, book, table, axe, tree, soldiers, fire, and lanterns exactly. Change ONLY lighting, sky, atmosphere: deep navy and indigo moonlit sky with delicate stars, cool blue shadows over the courtyard and forest, warm amber luminous lanterns/windows and campfire, soft moonlight tracing slate roofs and stone walls. The blue leather book is still visible from lantern light. Magical quiet nighttime sanctuary, distant forest a little mysterious, never horror. Preserve the detailed pixel-textured storybook art. No words, no UI, no new foreground objects. 1536x1024 landscape, composition matches reference perfectly.

## Mobile layout and font

Do Hyeon is exported losslessly to WOFF2 from the game's Fonts/DoHyeon.ttf. The original SIL OFL license is included at ../fonts/DoHyeon-OFL.txt. The website serves the font locally; Japanese glyphs use the existing system fallback.

The mobile reader keeps its toolbar and navigation visible while the book contents scroll independently. Browser layout checks covered 360×740, 390×844, 430×932 and 844×390. Horizontal overflow was absent at those sizes; left/right taps and the loaded font were checked in the browser. This is responsive browser QA, not a claim of testing physical iOS/Android hardware.

Latest sync: all 26 illustrations re-exported from the current game sources. Saved reading positions migrate by stable scene ID. The preview includes all five prologue cuts and supplies; the remainder remains behind the spoiler prompt.


## Mobile layout and audio transition update

The game courtyard now uses `courtyard-audio.js`: media sources feed separate Web Audio GainNodes. A three-second equal-power fade starts after the incoming audio playback promise resolves; the outgoing track is paused only when its gain reaches zero. New selections continue from current levels, and page hiding / explicit mute cancels pending work. This avoids depending on HTML media volume support on iOS ([Apple media notes](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html)); gain automation follows the [AudioParam API](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/linearRampToValueAtTime).

At widths below 700px the map is scenery, with a full-width story button and a two-column destination menu below it. The reader uses 20px body text and fixed, separate navigation controls; text taps do not turn pages on phones. Game-description panels use full-screen sheets and two-column scene selection. Desktop keeps the map hotspots and book interaction.

Verified: real browser GainNode readings during the day/night transition (day 0.280 → 0.201 → 0.000, night 0.000 → 0.195 → 0.280), delayed playback and rapid reversal unit tests, 320px and 355px responsive browser layouts in KO/EN/JA. Native iPhone/Safari hardware playback was not tested.

## 2026-09-22 illustrated reading overlay and cinematic prose

Illustrated spreads now fill the reader width; the dimmed text overlay can be collapsed without turning the page. Long passages scroll within the overlay. Text-only spreads keep their two-leaf reading order. Touch devices no longer receive persistent hover colors; keyboard focus outlines remain available.

Website-only prose lives in story-narration.json and is merged into story.json by build-world-assets.py. Existing game dialogue, IDs, scene ordering and save positions remain intact. KO/EN/JA adaptations cover the prologue duel (PrologueDuelCinematic.cs and Loc.Season.cs), ring forging (AwakenCutscene.cs), discovery and seasonal transitions (SeasonGateSequence*.cs), castle collapse (CastleFallSequence.cs), the spirit's last light and regression (IntroSequence.cs and AwakenSequence.cs), and narrative transitions through the historical scenes in StorySequence.cs / Loc.Story.cs. Conditional defeat and awakening events are described as recurring possibilities, not as a mandatory defeat at a fixed chapter. The original game sources are unchanged.

## UI review with frontend-design + web-design-guidelines

Reviewed all 11 HTML routes (KO/EN/JA home, game and text story; minigame; 404). The reader preserves full-width artwork at its natural ratio, with a sticky dimmed reading panel and persistent navigation; prose uses a separate readable system-font stack. Text editions have chapter anchors and intrinsic image dimensions. Shared touch targets, mobile menu overflow, dark native controls and homepage spacing were refined. Language links now navigate normally instead of opening map panels; story/store hash entry points open their corresponding views, and the minigame's store link preserves the chosen language.

Validation: all 11 routes inspected at a narrow browser viewport without horizontal document overflow; KO/EN/JA reader footers remain inside the viewport. Story navigation, fold/unfold, spoiler consent, chapter jumps, language switching, day/night guide navigation and minigame start/result were exercised in Chrome. Physical iOS/Android devices were not used. No deployment was performed.
