"""Subset the OFL font for all three storybook languages; rename the derivative."""
import json
from pathlib import Path
from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'output/fonts/PretendardJPVariable-v1.3.9.woff2'
TARGET = ROOT / 'assets/fonts/StorySans-v1.woff2'

def main():
    text = json.dumps(json.loads((ROOT/'assets/world/story.json').read_text(encoding='utf-8')), ensure_ascii=False)
    text += (ROOT/'world.js').read_text(encoding='utf-8')
    text += (ROOT/'tools/build-world-pages.py').read_text(encoding='utf-8')
    codepoints = {ord(c) for c in text} | set(range(32,127))
    options = subset.Options()
    options.flavor = 'woff2'
    options.name_IDs = ['*']
    options.name_languages = ['*']
    options.name_legacy = True
    font = subset.load_font(str(SOURCE), options)
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=codepoints)
    worker.subset(font)
    # Pretendard is a Reserved Font Name. Preserve copyright and OFL records,
    # but give every derivative family/instance/PostScript record its own name.
    for record in font['name'].names:
        if record.nameID in {0,13,14}: continue
        value = record.toUnicode()
        if 'Pretendard' in value:
            value = value.replace('Pretendard JP','Story Sans').replace('PretendardJP','StorySans').replace('Pretendard','StorySans')
            record.string = value.encode(record.getEncoding())
    subset.save_font(font, str(TARGET), options)
    print(f'Story Sans: {TARGET.stat().st_size:,} bytes, {len(font.getBestCmap()):,} codepoints; source {SOURCE.stat().st_size:,} bytes.')

if __name__ == '__main__': main()
