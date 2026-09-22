# Tiny Defense courtyard & storybook assets

Created 2026-09-22. New courtyard artwork uses the built-in image_gen tool, with the game's approved story illustrations as references. Final web assets are courtyard-day.webp and courtyard-night.webp (1536 × 1024). Generated PNG originals remain in the Codex generated_images directory.

## Existing game illustrations and text

Exported by tools/build-world-assets.py from C:/OneStep/tiny_defense; source game files are read-only.
- prologue.webp: UI/Prologue/prologue_panel_1.png
- supplies.webp: UI/Prologue/prologue_panel_4.png
- troll.webp: UI/Prologue/prologue_panel_3.png
- spring.webp: UI/Ascension/season_gate_discovery.png
- routes.webp: UI/Story/story_routes.png
- home.webp: UI/Story/story_home.png
- resident-run.webp: Units/Characters/GathererBoy/PawnRun.png (six original frames, lossless WebP). Courtyard resident animation reuses the actual game sprite.
- story.json: Loc.Story.cs, plus prologue.cut1 / prologue.cut2 from Loc.Season.cs. KO/EN/JA are the actual game translations. All current dialogue lines retained, including supplies.3 and supplies.4.
- Chapter grouping follows docs/story-chapter-plan.md: Chapter 1 is the eight existing scenes, not eight future chapters. No proposed Chapter 2/3 lore is published.

## Audio provenance and spotting

| Output | Trigger | Source | Rights |
|---|---|---|---|
| audio/day.mp3 | Courtyard, daytime | AI Custom/hopeful_daylight.mp3 | Project self-produced; asset-credits.md |
| ../audio/lobby-theme.mp3 | Courtyard, nighttime | Secret of Beautiful Forest | Existing website self-produced track; ../audio/lobby-theme-license.txt |
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

## Day illustration prompt
Create a finished wide 1536x1024 storybook pixel-art illustration for the Tiny Defense interactive website, using the attached images as art-direction and architecture references only. A welcoming lived-in medieval castle courtyard seen from an elevated gentle three-quarter view, late afternoon golden sunlight, blue slate roofs and blue-and-gold heraldic banners, ivy and small wildflowers, forest beyond the walls. Composition for clickable scenery: on the LEFT third a woodland exit and a chopping stump with axe and stacked timber; CENTER midground an open stone castle gateway leading to sunlit pine woods; on the RIGHT foreground a wooden reading table with a prominent CLOSED deep blue leather storybook with a small gold tree emblem, beside a warm lantern; near lower center a small contained campfire with a kettle and stone seats. Spacious cobblestone courtyard, quiet homecoming mood, intimate handcrafted game world. A couple of tiny distant guards only, no large foreground characters. Beautiful detailed pixel-textured storybook art matching reference, crisp readable shapes and cinematic light. Artwork fills entire frame, no vignette, no words, no text, no UI, no watermark. Keep all three main landmarks within central 80 percent for responsive cropping. This is a scene asset, not a website screenshot.

## Night illustration prompt
Edit the supplied Tiny Defense castle courtyard image into its NIGHT version for an exact aligned website day/night crossfade. Preserve ALL architecture, object positions, perspective, crop, book, table, axe, tree, soldiers, fire, and lanterns exactly. Change ONLY lighting, sky, atmosphere: deep navy and indigo moonlit sky with delicate stars, cool blue shadows over the courtyard and forest, warm amber luminous lanterns/windows and campfire, soft moonlight tracing slate roofs and stone walls. The blue leather book is still visible from lantern light. Magical quiet nighttime sanctuary, distant forest a little mysterious, never horror. Preserve the detailed pixel-textured storybook art. No words, no UI, no new foreground objects. 1536x1024 landscape, composition matches reference perfectly.
