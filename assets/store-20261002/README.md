# October 2026 courtyard media

Uses the final October 2 store campaign `StorePromoSkillsFull20261002/google-play/{ko,en,ja}` (8 images per language) and `StoreVideo20261001` native capture clips. Each video source matches `source-manifest-1080.json` SHA256; the Berserker uses the corrected player-skin capture.

The source delivery receipt identifies the 42.5-second Google Play promo as registered. This website uses its underlying gameplay captures as short silent loops, not a claim that all stores have published the same video. Images use the latest full campaign, including the corrected Korean seasons caption.

Run `python tools/build-store-media.py` then `python tools/build-world-pages.py`. Source files remain read-only. Outputs: 540x960 H.264, up to 9 seconds, muted with no audio track, faststart; 720x1280 WebP campaign images. `provenance.json` records source hashes. `content.json` owns localized guide copy.

Only map dialogs instantiate media. The former scrolling details are an inert HTML template retained for existing source metadata; the main page has no secondary content menu. The spirit opens courtyard encounters, and reading progress remains available inside the book.
