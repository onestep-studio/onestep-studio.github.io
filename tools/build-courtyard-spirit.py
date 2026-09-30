"""Reuse all 64 frames of the game's small-light idle animation, without changing game files."""
import argparse
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def export(game):
    source = game / 'Assets/Resources/TinyDefense/Units/PersonalSpirit/small-light'
    layout = json.loads((source / 'Idle.json').read_text(encoding='utf-8-sig'))
    image = Image.open(source / 'Idle.png').convert('RGBA')
    columns, count = layout['columns'], layout['frames']
    rows = (count + columns - 1) // columns
    if image.width % columns or image.height % rows:
        raise ValueError('Sprite cells do not divide the source atlas')
    width, height = image.width // columns, image.height // rows
    size = (72, round(height * 72 / width))
    strip = Image.new('RGBA', (size[0] * count, size[1]))
    for frame in range(count):
        x, y = (frame % columns) * width, (frame // columns) * height
        cell = image.crop((x, y, x + width, y + height)).resize(size, Image.Resampling.NEAREST)
        strip.paste(cell, (frame * size[0], 0))
    target = ROOT / 'assets/world'
    strip.save(target / 'small-light-idle.webp', lossless=True)
    (target / 'small-light.json').write_text(json.dumps({
        'source': 'Units/PersonalSpirit/small-light/Idle.png', 'frames': count,
        'frameWidth': size[0], 'frameHeight': size[1], 'duration': count / layout['fps']
    }, indent=2) + '\n', encoding='utf-8')
    print(f'Exported the small light: {count} original frames.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--game-root', type=Path, required=True)
    export(parser.parse_args().game_root)
