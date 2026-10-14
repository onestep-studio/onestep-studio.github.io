"""Export the adopted October 14 Tiny Defense brand (original A: guardian boy and stone troll) for the web."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GAME = Path('C:/OneStep/tiny_defense')
SOURCES = {
    'lobby': GAME/'Assets/Resources/TinyDefense/UI/LobbyBackground.png',
    'title': GAME/'Assets/Resources/TinyDefense/UI/LobbyTitle.png',
    'icon': GAME/'Assets/TinyDefense/AppIcon.png',
    'wide': GAME/'docs/art/sources/brand-exploration-20261014/renders/a-original-wide.png',
}
OUT = ROOT/'assets/brand-20261014'

def cover(image, size, anchor_y=0.5):
    """Scale to fill size, cropping the overflow around anchor_y (0 top, 1 bottom)."""
    w, h = size
    scale = max(w/image.width, h/image.height)
    resized = image.resize((round(image.width*scale), round(image.height*scale)), Image.LANCZOS)
    x = (resized.width-w)//2
    y = round((resized.height-h)*anchor_y)
    return resized.crop((x, y, x+w, y+h))

def main():
    OUT.mkdir(exist_ok=True)
    lobby = Image.open(SOURCES['lobby']).convert('RGB')
    title = Image.open(SOURCES['title']).convert('RGBA')
    icon = Image.open(SOURCES['icon']).convert('RGB')
    wide = Image.open(SOURCES['wide']).convert('RGB')
    title = title.crop(title.getbbox())
    outputs = {}
    def save(image, path, **options):
        image.save(path, **options)
        outputs[str(path.relative_to(ROOT)).replace('\\', '/')] = list(image.size)
    for width in (1080, 720):
        save(lobby.resize((width, width*16//9), Image.LANCZOS), OUT/f'lobby-{width}.webp', quality=84)
    for width in (1200, 640):
        save(title.resize((width, round(title.height*width/title.width)), Image.LANCZOS), OUT/f'title-{width}.webp', quality=90)
    save(wide, OUT/'keyart-wide.webp', quality=88)
    # Existing brand slots keep their file names so every page and the play demo pick them up.
    save(icon.resize((512, 512), Image.LANCZOS), ROOT/'assets/app-icon.webp', quality=90)
    save(icon.resize((180, 180), Image.LANCZOS), ROOT/'assets/apple-touch-icon.png', optimize=True)
    save(icon.resize((48, 48), Image.LANCZOS), ROOT/'assets/favicon.png', optimize=True)
    # The logo sits top-left in the key art; crop only the stone wall at the bottom.
    save(cover(wide, (1024, 500), anchor_y=0.15), ROOT/'assets/hero-wide.webp', quality=88)
    save(cover(wide, (1200, 630), anchor_y=0.15), ROOT/'assets/og-image.jpg', quality=88, optimize=True)
    provenance = {'brand': 'tiny_defense original A brand, adopted 2026-10-14',
                  'sources': {name: {'path': str(path.relative_to(GAME)).replace('\\', '/'),
                                     'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for name, path in SOURCES.items()},
                  'outputs': outputs}
    (OUT/'provenance.json').write_text(json.dumps(provenance, indent=2)+'\n', encoding='utf-8')
    print(f'Exported {len(outputs)} brand images.')

if __name__ == '__main__':
    main()
