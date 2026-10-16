"""Export existing Amhaeng Eosa game art for the website. No game files are changed."""
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from PIL import Image, ImageOps
from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()
p.add_argument('--project', type=Path, default=Path('C:/OneStep/amhaeng-eosa'))
args = p.parse_args()
resources = args.project / 'Assets/Resources/Eosa'
art = resources / 'Art'
out = ROOT / 'assets/amhaeng-eosa'
out.mkdir(parents=True, exist_ok=True)
manifest = []

def export(source, name, width, quality=87):
    src = art / (source + '.png')
    im = Image.open(src).convert('RGBA')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.Resampling.LANCZOS)
    im.save(out / (name + '.webp'), quality=quality, method=6)
    manifest.append({'file': name + '.webp', 'source': 'Assets/Resources/Eosa/Art/' + source + '.png', 'sha256': hashlib.sha256(src.read_bytes()).hexdigest(), 'width': im.width, 'height': im.height})

for src,name,w in [
    ('lobby-night','lobby',1536), ('lobby-night-mobile','lobby-mobile',900),
    ('title-v2','title',1000), ('village','village',627), ('inn-room','room',1200),
    ('river','river',627), ('court','court',1440), ('Maps/journey','journey',1000),
    ('Portraits/yunseo','yunseo',640), ('Portraits/dogyeom','dogyeom',640),
    ('UI/V3/paper','paper',800),
    ('Evidence/receipt','receipt',400), ('Evidence/first-slip','first-slip',400),
    ('Evidence/gate','gate',400), ('Evidence/debt','debt',400),
    ('Evidence/footprints','footprints',400),
]:
    export(src,name,w)

# Preserve both characters' complete heads on the listing image.
im = Image.open(art/'lobby-night.png').convert('RGB')
im = ImageOps.fit(im,(1200,720),method=Image.Resampling.LANCZOS,centering=(.5,.42))
im.save(out/'cover.webp',quality=89,method=6)
im.resize((1200,720)).save(out/'social.jpg',quality=90)
for name in ['cover.webp','social.jpg']:
    manifest.append({'file':name,'source':'Assets/Resources/Eosa/Art/lobby-night.png','sha256':hashlib.sha256((art/'lobby-night.png').read_bytes()).hexdigest(),'transform':'1200x720 crop, centered at 50% x 42%'})

texts = ''.join(f.read_text('utf-8') for f in [ROOT/'tools/build-eosa-pages.py', ROOT/'games/amhaeng-eosa/eosa.js'])
texts += ''.join(chr(i) for i in range(32,127))
texts += '가나다라마바사아자차카타파하0123456789'
for source,name in [('GowunBatang-Regular.ttf','EosaBatang'), ('Pretendard-Regular.ttf','EosaSans')]:
    options = subset.Options()
    options.flavor = 'woff2'
    font = subset.load_font(str(resources/'Fonts'/source),options)
    s = subset.Subsetter(options=options)
    s.populate(text=texts)
    s.subset(font)
    subset.save_font(font,str(out/(name+'.woff2')),options)
    manifest.append({'file':name+'.woff2','source':'Assets/Resources/Eosa/Fonts/'+source,'sha256':hashlib.sha256((resources/'Fonts'/source).read_bytes()).hexdigest(),'transform':'WOFF2 subset for the three localized website pages'})

license_text=(resources/'Licenses/Fonts-OFL.txt').read_text('utf-8')
(out/'Fonts-OFL.txt').write_text('\n'.join(line.rstrip() for line in license_text.splitlines()).rstrip()+'\n','utf-8')
audio=resources/'Audio/title.wav'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(audio),'-codec:a','libmp3lame','-b:a','160k',str(out/'title.mp3')],check=True)
manifest.append({'file':'title.mp3','source':'Assets/Resources/Eosa/Audio/title.wav','sha256':hashlib.sha256(audio.read_bytes()).hexdigest(),'transform':'MP3, 160 kbps; original game title theme, no new audio generated'})

(out/'sources.json').write_text(json.dumps({'project':'amhaeng-eosa','note':'Existing game assets, resized for the website. Source hashes identify the exported revision.','assets':manifest},ensure_ascii=False,indent=2)+'\n','utf-8')
print(f'Exported {len(manifest)} existing game asset records to {out}')
