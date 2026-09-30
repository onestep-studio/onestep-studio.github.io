"""Export website story assets from the approved Tiny Defense sources.

Run with --game-root and --sound-root to refresh game text/audio. No game files are modified.
"""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def separate_speakers(line, names):
    """Split localized speaker prefixes, preserving ordinary colons and line breaks."""
    aliases = {name: int(voice) for voice, name in names.items()}
    prefix = re.compile(r'^\s*(' + '|'.join(re.escape(name) for name in sorted(aliases, key=len, reverse=True)) + r')\s*[:：]\s*')
    if not any(prefix.match(text) for text in line['text'].split('\n')):
        return [line]
    result = []
    for text in line['text'].split('\n'):
        match = prefix.match(text)
        if match:
            result.append({'speaker':aliases[match[1]], 'text':text[match.end():]})
        elif result:
            result[-1]['text'] += '\n' + text
        else:
            result.append({'speaker':line['speaker'], 'text':text})
    return result


def export(game, sounds, story_only=False):
    out = ROOT / 'assets/world'
    out.mkdir(parents=True, exist_ok=True)
    ui = game / 'Assets/Resources/TinyDefense/UI'
    source = game / 'Assets/Scripts/TinyDefense'
    definitions = (source / 'StorySequence.Definitions.cs').read_text(encoding='utf-8-sig')
    rewind = (source / 'StorySequence.Rewind.cs').read_text(encoding='utf-8-sig')
    prologue_source = (source / 'PrologueSequence.cs').read_text(encoding='utf-8-sig')
    duel_source = (source / 'PrologueDuelCinematic.cs').read_text(encoding='utf-8-sig')
    duel_source = re.sub(r'/\*.*?\*/|//[^\n]*', '', duel_source, flags=re.S)
    duel_dialogues = re.findall(r'PlayDialogue\(BuildLines\("prologue\.(talk\d+)"', duel_source)
    defs = re.findall(r'new\("([^"\n]+)", "(UI/[^"\n]+)", ([^)]*)\)', definitions)
    if not defs:
        raise ValueError('No story definitions found')
    defs = [(ident, art, list(map(int, numbers.split(',')))) for ident, art, numbers in defs]
    order = list(map(int, re.search(r'DisplayOrder = \{([^}]+)', rewind)[1].split(',')))
    if sorted(order) != list(range(len(defs))):
        raise ValueError('Display order does not cover every scene exactly once')
    prologue_art = re.findall(r'"(UI/[^"\n]+)"', re.search(r'ArtPaths = \{(.*?)\};', prologue_source, re.S)[1])
    panel_count = int(re.search(r'const int PanelCount\s*=\s*(\d+)', prologue_source)[1])
    assert len(prologue_art) == panel_count
    method = re.search(r'static string RewindArtFor.*?\{(.*?)\n        \}', rewind, re.S)[1]
    art_root = re.search(r'const string root = "([^"]+)";', method)[1]
    rules = dict((int(scene), expression.strip()) for scene, expression in
                 re.findall(r'if \(scene == (\d+)\) return root \+ (.*?);', method))
    remainder = re.sub(r'const string root = "[^"]+";', '', method)
    remainder = re.sub(r'if \(scene == \d+\) return root \+ .*?;', '', remainder).strip()
    if remainder != 'return Defs[scene].art;':
        raise ValueError('Unsupported RewindArtFor logic; update exporter before publishing')
    def art_for(scene, page):
        if scene not in rules:
            return defs[scene][1]
        expression = rules[scene].strip('()')
        while '?' in expression:
            match = re.fullmatch(r'page (==|<) (\d+) \? "([^"]+)" : (.*)', expression)
            if not match:
                raise ValueError('Unsupported art expression: ' + expression)
            op, n, yes, expression = match.groups()
            if (page == int(n)) if op == '==' else (page < int(n)):
                return art_root + yes
        if not re.fullmatch(r'"[^";]+"', expression):
            raise ValueError('Unsupported art fallback: ' + expression)
        return art_root + expression.strip('"')
    strings = {}
    pattern = r'\["([^"]+)"\]\s*=\s*new\[\]\s*\{\s*((?:"(?:[^"\\]|\\.)*"\s*,?\s*)+)\}'
    for file in sorted(source.glob('Loc*.cs')):
        text = file.read_text(encoding='utf-8-sig')
        strings.update({k: json.loads('[' + v.rstrip().rstrip(',') + ']') for k,v in re.findall(pattern,text)})
    mapping = {}
    def asset(path):
        name = 'revised_' + Path(path).name
        if name in mapping and mapping[name] != path:
            raise ValueError('Conflicting art names: ' + name)
        mapping[name] = path
        return name
    speaker_keys = {1:'story.boy', 2:'guide.name', 3:'story.v2.mars.name',
                    4:'story.v2.youngguardian.name', 5:'story.v2.guardian.name',
                    6:'prologue.knight.name', 7:'story.future.name', 8:'story.soldier.name', 9:'mon.ElderTroll'}
    morning_voices = list(map(int,re.search(r'MorningVoices = \{([^}]+)',definitions)[1].split(',')))
    data = {}
    for lang,col in [('ko',0),('en',1),('ja',3)]:
        pages = [{'id':f'rewind.prologue.{i+1}', 'sourceId':'prologue', 'chapter':1,
                  'scene':0,'part':i+1,'parts':panel_count,'art':asset(art),
                  'title':{'ko':'프롤로그','en':'Prologue','ja':'プロローグ'}[lang],
                  'lines':[{'speaker':0,'text':strings[f'prologue.cut{i+1}'][col]}]}
                 for i,art in enumerate(prologue_art)]
        # The actual prologue inserts the duel between cuts 2 and 3.
        for offset, section in enumerate(duel_dialogues):
            pages.insert(2+offset, {'id':f'rewind.prologue.{section}', 'sourceId':'prologue',
                         'chapter':1,'scene':0,'part':3+offset,'parts':panel_count+2,
                         'art':asset(art_root+('last_warning' if offset==0 else 'last_defeat')),
                         'title':{'ko':'성문 앞의 결투','en':'The Duel at the Gate','ja':'城門の決闘'}[lang],
                         'lines':[{'speaker':9 if suffix.startswith('t') else 6,
                                   'text':strings[f'prologue.{section}.{suffix}'][col]}
                                  for suffix in ('t1','o1','t2','o2')]})
        for i,page in enumerate(pages):
            page['part'],page['parts'] = i+1,len(pages)
        pages.append({'id':'rewind.morning','sourceId':'morning','chapter':1,'scene':0,
                      'part':1,'parts':1,'art':asset(art_root+'morning'),
                      'title':{'ko':'첫 아침','en':'The First Morning','ja':'最初の朝'}[lang],
                      'lines':[{'speaker':v,'text':strings[f'story.morning.{i}'][col]} for i,v in enumerate(morning_voices)]})
        chapter_scenes = {}
        for scene in order:
            ident,default_art,numbers = defs[scene]
            chapter, tier, night, *voices = numbers
            chapter_scenes[chapter] = chapter_scenes.get(chapter,0)+1
            groups = []
            for n,speaker in enumerate(voices):
                art = asset(art_for(scene,n))
                if not groups or groups[-1]['art'] != art:
                    groups.append({'art':art,'lineStart':n,'lines':[]})
                groups[-1]['lines'].append({'speaker':speaker,'text':strings[f'story.rewind.{ident}.{n}'][col]})
            for part,group in enumerate(groups,1):
                pages.append({'id':ident if part==1 else f'{ident}.part{part}', 'sourceId':ident,
                              'chapter':chapter,'scene':chapter_scenes[chapter],'part':part,'parts':len(groups),
                              'title':strings[f'story.rewind.{ident}.title'][col],**group})
        data[lang] = {'title':strings['story.title'][col],
                      'boy':strings['story.boy'][col], 'speakers':{str(k):strings[v][col] for k,v in speaker_keys.items()},
                      'books':{str(i):strings[f'story.book.{i}'][col] for i in range(1,6)}, 'previewCount':panel_count+4,'pages':pages}
    for story in data.values():
        for page in story['pages']:
            page['lines'] = [part for line in page['lines'] for part in separate_speakers(line, story['speakers'])]
    interludes = json.loads((out / 'story-interludes.json').read_text(encoding='utf-8'))
    for lang, story in data.items():
        for entry in interludes:
            target = next((i for i,p in enumerate(story['pages']) if p['id'] == entry['before']), None)
            if target is None:
                raise ValueError('Missing interlude insertion target: ' + entry['before'])
            following = story['pages'][target]
            story['pages'].insert(target, {'id':entry['id'],'sourceId':entry['id'],
                'chapter':following['chapter'],'scene':following['scene'],'part':1,'parts':1,
                'kind':'interlude','visual':entry['visual'],'art':entry['art'],'title':entry[lang]['title'],
                'lines':[{'speaker':0,'text':text} for text in entry[lang]['lines']]})
        story['previewCount'] = next(i for i,p in enumerate(story['pages']) if p['id']=='v2.smallhands') + 1
    # Text, scene order and source art share a version, so cached editions cannot mix.
    digest = hashlib.sha256(json.dumps(data, ensure_ascii=False, sort_keys=True).encode('utf-8'))
    for name, path in sorted(mapping.items()):
        digest.update((game / 'Assets/Resources/TinyDefense' / (path+'.png')).read_bytes())
    revision = 'rewind-' + digest.hexdigest()[:12]
    for story in data.values():
        story['revision'] = revision
    forge_root = game / 'Assets/Resources/TinyDefense/UI'
    for name, path in [('anvil','Forge/SharedAnvil.png'),('hammer','Tools/ToolHammer.png')]:
        im = Image.open(forge_root / path).convert('RGBA')
        im.save(out / f'interlude-{name}.webp',lossless=True)
    layout = json.loads((forge_root / 'Forge/HeroRing.json').read_text(encoding='utf-8'))
    ring = Image.open(forge_root / 'Forge/HeroRing.png').convert('RGBA')
    ring.crop((0,0,ring.width//layout['columns'],ring.height//layout['rows'])).save(out/'interlude-ring.webp',lossless=True)
    # Revised dialogue is authoritative. Legacy web narration would reveal the twist early.
    for name,path in mapping.items():
        im = Image.open(game / 'Assets/Resources/TinyDefense' / (path+'.png')).convert('RGB')
        im.thumbnail((1400,1500))
        im.save(out / f'{name}.webp', quality=88)
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
