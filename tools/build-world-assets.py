"""Export website story assets from the approved Tiny Defense sources.

Run with --game-root and --sound-root to refresh game text/audio. No game files are modified.
"""
import argparse
import json
import re
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def export(game, sounds):
    out = ROOT / 'assets/world'
    out.mkdir(parents=True, exist_ok=True)
    ui = game / 'Assets/Resources/TinyDefense/UI'
    mapping = {
        'prologue': 'Prologue/prologue_panel_1.png',
        'supplies': 'Prologue/prologue_panel_4.png',
        'troll': 'Prologue/prologue_panel_3.png',
        'spring': 'Ascension/season_gate_discovery.png',
        'routes': 'Story/story_routes.png',
        'home': 'Story/story_home.png',
    }
    for name, path in mapping.items():
        im = Image.open(ui / path).convert('RGB')
        im.thumbnail((1100, 1500))
        im.save(out / f'{name}.webp', quality=86)
    Image.open(game/'Assets/Resources/TinyDefense/Units/Characters/GathererBoy/PawnRun.png').save(out/'resident-run.webp',lossless=True)
    Image.open(game/'Assets/Resources/TinyDefense/Units/Characters/LancerIdle.png').save(out/'lancer-idle.webp',lossless=True)
    source = game / 'Assets/Scripts/TinyDefense'
    def table(file):
        text = (source / file).read_text(encoding='utf-8-sig')
        pattern = r'\["([^"]+)"\]\s*=\s*new\[\]\s*\{\s*((?:"(?:[^"\\]|\\.)*"\s*,?\s*)+)\}'
        return {k: json.loads('[' + v.rstrip().rstrip(',') + ']') for k, v in re.findall(pattern, text)}
    strings = table('Loc.Story.cs')
    prologue = table('Loc.Season.cs')
    ids = ['supplies', 'ring', 'troll', 'spring', 'summer', 'autumn', 'winter', 'home']
    voices = [[0,1,2,2,1], [1,2,2], [0,1,2], [1,2,1], [0,2,1], [0,2,1], [0,2,1], [0,1,2,0]]
    arts = ['supplies', 'supplies', 'troll', 'spring', 'routes', 'routes', 'routes', 'home']
    data = {}
    for lang, col in [('ko',0), ('en',1), ('ja',3)]:
        pages = [{'id':'prologue', 'art':'prologue', 'title':{'ko':'봉인 위에 세운 성', 'en':'A Castle Above the Seal', 'ja':'封印の上に築いた城'}[lang],
                  'lines':[{'speaker':0,'text':prologue[f'prologue.cut{i}'][col]} for i in [1,2]]}]
        for ident, speakers, art in zip(ids, voices, arts):
            pages.append({'id':ident, 'art':art, 'title':strings[f'story.{ident}.title'][col],
                          'lines':[{'speaker':speaker, 'text':strings[f'story.{ident}.{n}'][col]} for n,speaker in enumerate(speakers)]})
        data[lang] = {'title':strings['story.title'][col], 'boy':strings['story.boy'][col], 'pages':pages}
    (out / 'story.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    audio = out / 'audio'
    audio.mkdir(exist_ok=True)
    files = {'night':game/'Assets/Resources/TinyDefense/Audio/bgm_nemesis_night.ogg',
             'story':sounds/'Kevin MacLeod/The Path of the Goblin King.mp3',
             'book-open':sounds/'Kenney/rpg-audio/Audio/bookOpen.ogg',
             'book-close':sounds/'Kenney/rpg-audio/Audio/bookClose.ogg',
             'page-1':sounds/'Kenney/rpg-audio/Audio/bookFlip1.ogg',
             'page-2':sounds/'Kenney/rpg-audio/Audio/bookFlip2.ogg',
             'page-3':sounds/'Kenney/rpg-audio/Audio/bookFlip3.ogg'}
    for name, src in files.items():
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(src),
                        '-af',('volume=-8.3dB' if name=='night' else 'loudnorm=I=-23:TP=-3:LRA=11' if name=='story' else 'volume=0.5'),
                        '-ar','44100','-codec:a','libmp3lame','-b:a','128k',str(audio/f'{name}.mp3')],check=True)
    print(f'Exported {len(mapping)} illustrations, 3 story languages, {len(files)} audio files.')

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--game-root',type=Path,required=True)
    parser.add_argument('--sound-root',type=Path,required=True)
    args=parser.parse_args()
    export(args.game_root,args.sound_root)
