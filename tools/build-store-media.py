"""Optimize the verified October 12 store refresh for the courtyard, without altering game sources."""
import hashlib
import json
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('C:/OneStep/tiny_defense')
GENERATED = SOURCE/'Build/Work/generated'
CLIPS = SOURCE/'Build/Work/scratch/store-refresh-20261012/Build/StorePlayer/Screenshots/promo_video_ko_1080x1920'
SCREENS = GENERATED/'store-promo-20261012/google-play'
OUT = ROOT / 'assets/store-20261012'
# Long enough to include the second spinning attack (capture frame 306 = 10.2 s).
SECONDS = {'berserker': 12}

def main():
    data = json.loads((OUT/'content.json').read_text(encoding='utf8'))
    manifest = json.loads((GENERATED/'store-video-20261012/source-manifest-1080.json').read_text(encoding='utf8'))
    clips = {c['clip']: c for c in manifest['clips']}
    records = []
    for name in dict.fromkeys(s['clip'] for s in data['ko']['scenes'] if s['clip']):
        source = CLIPS/f'{name}.mp4'
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        assert digest == clips[name]['native_sha256'], f'Store capture mismatch: {name}'
        seconds = min(SECONDS.get(name, 9), clips[name]['seconds'])
        target = OUT/f'{name}.mp4'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-t',str(seconds),'-vf','scale=540:960,fps=30','-an','-c:v','libx264','-preset','medium','-crf','27','-pix_fmt','yuv420p','-movflags','+faststart',str(target)],check=True)
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(seconds/2),'-i',str(target),'-frames:v','1','-quality','85',str(OUT/f'{name}.webp')],check=True)
        records.append({'output':target.name,'source':str(source.relative_to(SOURCE)), 'source_sha256':digest})
    for lang in data:
        (OUT/lang).mkdir(exist_ok=True)
        for entry in data[lang]['gallery']:
            source = SCREENS/lang/(entry['image']+'.png')
            im=Image.open(source).convert('RGB');im.thumbnail((720,1280))
            target=OUT/lang/(entry['image']+'.webp');im.save(target,quality=88)
            records.append({'output':f'{lang}/{target.name}','source':str(source.relative_to(SOURCE)), 'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
    (OUT/'provenance.json').write_text(json.dumps({'campaign':'store-promo-20261012 (google-play)','video':'store-video-20261012 native 1080x1920 captures','files':records},indent=2)+'\n',encoding='utf8')
    videos = sum(1 for r in records if r['output'].endswith('.mp4'))
    print(f'Exported {videos} silent gameplay clips and {len(records)-videos} localized store images: {sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())/1e6:.1f} MB')

if __name__ == '__main__': main()
