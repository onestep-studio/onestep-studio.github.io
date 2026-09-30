"""Localized, progressively enhanced courtyard encounters."""
import json
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]

def familiar(lang):
    copy = json.loads((ROOT / 'assets/world/courtyard-life.json').read_text(encoding='utf-8'))[lang]
    return f'<button type="button" class="world-familiar" data-familiar data-spirit-greet aria-label="{escape(copy["greet"])} — {escape(copy["spirit"])}" hidden><span class="familiar-orbit"><span class="familiar-sprite" aria-hidden="true"></span></span><span class="familiar-spark" aria-hidden="true"></span></button>'

def encounters(lang):
    copy = json.loads((ROOT / 'assets/world/courtyard-life.json').read_text(encoding='utf-8'))[lang]
    day = json.loads((ROOT / 'assets/world/cast/dialogue.json').read_text(encoding='utf-8'))[lang]
    base = '' if lang == 'ko' else '/' + lang
    residents = ''.join(
        f'<button type="button" class="resident-choice" data-resident="{ident}" data-name="{escape(name)}" data-day="{escape(day[ident])}" data-night="{escape(copy["night"][ident])}" aria-pressed="false"><span class="resident-portrait" style="background-image:url(/assets/world/cast/{ident}-idle.webp?v=2)" aria-hidden="true"></span><span>{escape(name)}</span></button>'
        for ident, name in copy['names'].items())
    scenes = ['v2.springstone', 'v2.summerstone', 'v2.autumnstone', 'v2.winterstone']
    seasons = ''.join(
        f'<button type="button" class="waystone waystone-{season}" data-season-choice="{season}" data-scene="{scene}" data-chapter="{chapter}" data-hint="{escape(info["hint"])}" data-read="{escape(info["read"])}" aria-pressed="false"><span class="waystone-carving" aria-hidden="true"></span><span>{escape(info["name"])}</span></button>'
        for chapter, ((season, info), scene) in enumerate(zip(copy['season'].items(), scenes), 1))
    replies = ''.join(f' data-reply-{i}="{escape(reply)}"' for i, reply in enumerate(copy['spiritReply']))
    return f'''<section class="courtyard-life" data-courtyard-life aria-label="{escape(copy['label'])}" hidden>
      <div class="spirit-encounter"><h2>{escape(copy['spirit'])}</h2><button type="button" class="life-greeting" data-spirit-greet>{escape(copy['greet'])}<span aria-hidden="true"> ✧</span></button><p class="life-response" data-spirit-response role="status"{replies}>{escape(copy['spiritHint'])}</p></div>
      <div class="resident-encounter"><details class="resident-meeting"><summary>{escape(copy['residents'])}</summary><div class="resident-choices">{residents}</div></details><p class="life-response resident-response" role="status"><strong data-resident-name hidden></strong><span data-resident-response>{escape(copy['residentHint'])}</span></p></div>
      <div class="season-encounter"><fieldset class="season-waystones"><legend>{escape(copy['seasons'])}</legend><div class="waystone-row">{seasons}</div></fieldset><p class="life-response" data-season-response role="status" data-default="{escape(copy['seasonHint'])}">{escape(copy['seasonHint'])}</p><div class="season-links"><a class="life-story-link" data-season-story data-open-story href="{base}/story/" hidden></a><button type="button" class="season-reset" data-season-reset hidden>{escape(copy['reset'])}</button></div></div>
    </section>'''
