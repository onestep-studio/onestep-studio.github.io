"""Export the game's six-frame movement strips for the website courtyard."""
import argparse
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'pawn': 'PawnRun.png',
    'boy': 'GathererBoy/PawnRun.png',
    'girl': 'GathererGirl/PawnRun.png',
    'berserker': 'NightSkins/berserker/Run.png',
    'guardian': 'NightSkins/guardian/Run.png',
    'duelist': 'NightSkins/duelist/Run.png',
    'mage': 'HeroMage/Run.png',
    'dark-knight': 'NightSkins/dark-knight/Run.png',
}

def export(game_root):
    source = game_root / 'Assets/Resources/TinyDefense/Units/Characters'
    output = ROOT / 'assets/world/cast'
    output.mkdir(exist_ok=True)
    manifest = []
    for ident, relative in SOURCES.items():
        sheet = Image.open(source / relative).convert('RGBA')
        size = sheet.height
        assert sheet.width == size * 6, relative
        frames = [sheet.crop((i*size, 0, (i+1)*size, size)) for i in range(6)]
        boxes = [frame.getbbox() for frame in frames]
        bounds = (min(b[0] for b in boxes), min(b[1] for b in boxes),
                  max(b[2] for b in boxes), max(b[3] for b in boxes))
        width, height = bounds[2]-bounds[0], bounds[3]-bounds[1]
        scale = min(108/width, 96/height)
        target = (round(width*scale), round(height*scale))
        atlas = Image.new('RGBA', (128*6, 128))
        for i, frame in enumerate(frames):
            # Use one bounding box for all frames: retain the original foot motion.
            resized = frame.crop(bounds).resize(target, Image.Resampling.LANCZOS)
            atlas.paste(resized, (i*128+(128-target[0])//2, 116-target[1]))
        atlas.save(output / f'{ident}.webp', lossless=True)
        manifest.append({'id': ident, 'source': relative, 'frames': 6, 'frameSize': 128})
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
    print(f'Exported {len(manifest)} courtyard characters.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--game-root', type=Path, required=True)
    export(parser.parse_args().game_root)
