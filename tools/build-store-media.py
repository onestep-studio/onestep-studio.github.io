"""Optimize the verified October store campaign for the courtyard, without altering game sources."""
import hashlib
import json
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('C:/OneStep/tiny_defense/Build')
OUT = ROOT / 'assets/store-20261002'

def main():
    data = json.loads((OUT/'content.json').read_text(encoding='utf8'))
    video_root = SOURCE/'StoreVideo20261001'
    manifest = json.loads((video_root/'source-manifest-1080.json').read_text())
    clips = {c['clip']: c for c in manifest['clips']}
    records = []
    for name in dict.fromkeys(s['clip'] for s in data['ko']['scenes'] if s['clip']):
        source = video_root/('player-skin' if name == 'berserker' else 'player')/'Screenshots/promo_video_ko_1080x1920'/f'{name}.mp4'
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        assert digest == clips[name]['native_sha256'], f'Store capture mismatch: {name}'
        target = OUT/f'{name}.mp4'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-t','9','-vf','scale=540:960,fps=30','-an','-c:v','libx264','-preset','medium','-crf','27','-pix_fmt','yuv420p','-movflags','+faststart',str(target)],check=True)
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','1','-i',str(target),'-frames:v','1','-quality','85',str(OUT/f'{name}.webp')],check=True)
        records.append({'output':target.name,'source':str(source.relative_to(SOURCE)), 'source_sha256':digest})
    for lang in data:
        (OUT/lang).mkdir(exist_ok=True)
        for entry in data[lang]['gallery']:
            source = next((SOURCE/'StorePromoSkillsFull20261002/google-play'/lang).glob(entry['image']+'.*'))
            im=Image.open(source).convert('RGB');im.thumbnail((720,1280))
            target=OUT/lang/(entry['image']+'.webp');im.save(target,quality=88)
            records.append({'output':f'{lang}/{target.name}','source':str(source.relative_to(SOURCE)), 'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
    (OUT/'provenance.json').write_text(json.dumps({'campaign':'StorePromoSkillsFull20261002','video':'StoreVideo20261001 final 2026-10-02 captures','files':records},indent=2)+'\n',encoding='utf8')
    print(f'Exported 8 silent gameplay clips and 24 localized store images: {sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())/1e6:.1f} MB')

if __name__ == '__main__': main()
