# October 12, 2026 courtyard media

Uses the October 12 latest-UI store refresh (`tiny_defense/docs/store/promo-refresh-20261012.md`): wood-and-parchment UI, automatic gathering (the gathering puzzles were removed from the game on October 8), troop/hero training and tower top upgrades.

- Images: `Build/Work/generated/store-promo-20261012/google-play/{ko,en,ja}` (8 images per language).
- Clips: native Korean 1080x1920 captures in the `store-refresh-20261012` worktree (`Build/StorePlayer/Screenshots/promo_video_ko_1080x1920`). Each source must match `store-video-20261012/source-manifest-1080.json` SHA256. The stale `wood`/`iron` puzzle captures in that folder are not in the manifest and are not used.

All captures come from the Windows portrait verification player, not iOS/Android devices. This website uses short silent loops of the gameplay captures, not the edited store videos, and makes no claim about what each store currently shows.

Run `python tools/build-store-media.py` then `python tools/build-world-pages.py`. Source files remain read-only. Outputs: 540x960 H.264, up to 9 seconds (Berserker 12 seconds for both spinning attacks), muted with no audio track, faststart; 720x1280 WebP campaign images. `provenance.json` records source hashes. `content.json` owns localized guide copy; each panel (`kind` day/night) keeps five scenes to match the five-column guide index.

Only map dialogs instantiate media. The former scrolling details are an inert HTML template retained for existing source metadata; the main page has no secondary content menu.
