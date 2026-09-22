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

def export(game, sounds, story_only=False):
    out = ROOT / 'assets/world'
    out.mkdir(parents=True, exist_ok=True)
    ui = game / 'Assets/Resources/TinyDefense/UI'
    source = game / 'Assets/Scripts/TinyDefense'
    sequence = (source / 'StorySequence.cs').read_text(encoding='utf-8-sig')
    prologue_source = (source / 'PrologueSequence.cs').read_text(encoding='utf-8-sig')
    panel_count = int(re.search(r'const int PanelCount\s*=\s*(\d+)', prologue_source)[1])
    mapping = {('prologue' if i == 1 else f'prologue_{i}'): f'Prologue/prologue_panel_{i}.png'
               for i in range(1, panel_count + 1)}
    def array(name):
        match = re.search(r'\b' + name + r'\s*=\s*\{(.*?)\};', sequence, re.S)
        if not match:
            raise ValueError(f'Missing story array: {name}')
        return match.group(1)
    ids = re.findall(r'"([^"]+)"', array('Chapters'))
    art_paths = re.findall(r'"UI/([^"]+)"', array('Art'))
    voices = [list(map(int, re.findall(r'\d+', row))) for row in re.findall(r'new\[\]\s*\{([^}]+)\}', array('Speakers'))]
    if not ids or len(ids) != len(art_paths) or len(ids) != len(voices):
        raise ValueError('Story scene, art and speaker arrays do not match')
    # Mirror the game's per-dialogue overrides, and fail loudly if its grammar changes.
    art_method = re.search(r'ArtFor\(int scene, int page\)\s*\{(.*?)\}', sequence, re.S)[1]
    art_method = re.sub(r'//[^\n]*', '', art_method).strip()
    rule_pattern = r'if\s*\((scene\s*==\s*\d+(?:\s*&&\s*page\s*(?:==|<)\s*\d+)?)\)\s*return\s*"UI/([^"]+)"\s*;'
    rules = re.findall(rule_pattern, art_method)
    remainder = re.sub(rule_pattern, '', art_method).strip()
    if remainder != 'return Art[scene];':
        raise ValueError('Unsupported ArtFor logic; update exporter before publishing')
    def art_for(scene, line):
        for condition, path in rules:
            parts = re.fullmatch(r'scene\s*==\s*(\d+)(?:\s*&&\s*page\s*(==|<)\s*(\d+))?', condition)
            if scene == int(parts[1]) and (not parts[2] or
                    (line == int(parts[3]) if parts[2] == '==' else line < int(parts[3]))):
                return path
        return art_paths[scene]
    scene_arts = [[art_for(scene, line) for line in range(len(speakers))]
                  for scene, speakers in enumerate(voices)]
    for path in dict.fromkeys(path for scene in scene_arts for path in scene):
        name = Path(path).name.removeprefix('story_')
        mapping[name] = path + '.png'
    for name, path in mapping.items():
        im = Image.open(ui / path).convert('RGB')
        im.thumbnail((1100, 1500))
        im.save(out / f'{name}.webp', quality=86)
    Image.open(game/'Assets/Resources/TinyDefense/Units/Characters/GathererBoy/PawnRun.png').save(out/'resident-run.webp',lossless=True)
    Image.open(game/'Assets/Resources/TinyDefense/Units/Characters/LancerIdle.png').save(out/'lancer-idle.webp',lossless=True)
    def table(file):
        text = (source / file).read_text(encoding='utf-8-sig')
        pattern = r'\["([^"]+)"\]\s*=\s*new\[\]\s*\{\s*((?:"(?:[^"\\]|\\.)*"\s*,?\s*)+)\}'
        return {k: json.loads('[' + v.rstrip().rstrip(',') + ']') for k, v in re.findall(pattern, text)}
    strings = table('Loc.Story.cs')
    prologue = table('Loc.Season.cs')
    data = {}
    for lang, col in [('ko',0), ('en',1), ('ja',3)]:
        pages = [{'id':'prologue' if i == 1 else f'prologue.{i}', 'sourceId':'prologue',
                  'chapter':1, 'scene':0, 'part':i, 'parts':panel_count,
                  'art':'prologue' if i == 1 else f'prologue_{i}',
                  'title':{'ko':'프롤로그', 'en':'Prologue', 'ja':'プロローグ'}[lang],
                  'lines':[{'speaker':0,'text':prologue[f'prologue.cut{i}'][col]}]}
                 for i in range(1, panel_count + 1)]
        chapter_scenes = {}
        for ident, speakers, arts in zip(ids, voices, scene_arts):
            chapter = int(ident[2]) if re.match(r'ch\d\.', ident) else 1
            chapter_scenes[chapter] = chapter_scenes.get(chapter, 0) + 1
            groups = []
            for n, (speaker, art) in enumerate(zip(speakers, arts)):
                if not groups or groups[-1]['art'] != Path(art).name.removeprefix('story_'):
                    groups.append({'art':Path(art).name.removeprefix('story_'), 'lineStart':n, 'lines':[]})
                groups[-1]['lines'].append({'speaker':speaker, 'text':strings[f'story.{ident}.{n}'][col]})
            for part, group in enumerate(groups, 1):
                pages.append({'id':ident if part == 1 else f'{ident}.part{part}', 'sourceId':ident,
                              'chapter':chapter, 'scene':chapter_scenes[chapter], 'part':part, 'parts':len(groups),
                              'title':strings[f'story.{ident}.title'][col], **group})
        data[lang] = {'title':strings['story.title'][col], 'boy':strings['story.boy'][col],
                      'previewCount':panel_count + 1, 'pages':pages}
    (out / 'story.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if story_only:
        print(f'Exported {len(mapping)} illustrations and {len(pages)} spreads in 3 languages.')
        return
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
    parser.add_argument('--story-only',action='store_true',help='Refresh story art/text without re-encoding audio')
    args=parser.parse_args()
    export(args.game_root,args.sound_root,args.story_only)
