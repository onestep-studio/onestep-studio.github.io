"""Build the three localized courtyard entry points into the existing static homes."""
import json
import re
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
COPY = {
 'ko': dict(kicker='TINY DEFENSE · 작은 세계로의 초대',title='잠시, 성 안에 머물러요.',intro='숲에서 나무를 모으고, 밤에는 함께 성을 지키는 곳.',day='낮',night='밤',sound='소리 켜기',motion='움직임 멈추기',book='이야기 읽기',forest='도끼질 체험',gate='게임 만나기',hint='빛나는 표식을 눌러 둘러보세요.',chapter='CHAPTER 01–03',booktitle='돌아올 성',bookdesc='소년과 노인, 그리고 돌아갈 곳을 지키는 사람들의 이야기.',open='책 펼치기',resume='이어서 읽기',close='책 덮기',contents='목차',prev='이전 장',next='다음 장',volume='음량',credits='음악과 리소스',home='성 안으로',old='노인',read='글로 읽기'),
 'en': dict(kicker='TINY DEFENSE · A SMALL WORLD AWAITS',title='Stay a while, within the walls.',intro='Gather wood in the forest. Stand together when night falls.',day='Day',night='Night',sound='Sound on',motion='Pause motion',book='Read the story',forest='Try woodcutting',gate='Discover the game',hint='Follow the glowing markers to explore.',chapter='CHAPTER 01–03',booktitle='A Castle to Come Home To',bookdesc='A boy, an old man, and the people who keep a home worth returning to.',open='Open the book',resume='Continue reading',close='Close book',contents='Contents',prev='Previous page',next='Next page',volume='Volume',credits='Music & assets',home='Courtyard',old='Old man',read='Read as text'),
 'ja': dict(kicker='TINY DEFENSE · 小さな世界へ',title='城の中で、ひと休み。',intro='森で木を集め、夜にはみんなで城を守る場所。',day='昼',night='夜',sound='音をオン',motion='動きを止める',book='物語を読む',forest='薪割り体験',gate='ゲームを見る',hint='光る目印を押して、城を巡ってみましょう。',chapter='CHAPTER 01–03',booktitle='帰る場所',bookdesc='少年と老人、そして帰る場所を守る人々の物語。',open='本を開く',resume='続きから読む',close='本を閉じる',contents='目次',prev='前のページ',next='次のページ',volume='音量',credits='音楽と素材',home='城の中へ',old='老人',read='文章で読む'),
}

def render(lang, c):
    base = '' if lang=='ko' else '/'+lang
    game = base+'/games/tiny-defense/'
    return f'''<!-- WORLD EXPERIENCE START -->
    <section class="world" id="top" aria-labelledby="world-title" data-world data-time="day">
      <div class="world-heading">
        <div><p class="world-eyebrow">{c['kicker']}</p><h1 id="world-title">{c['title']}</h1><p class="world-intro">{c['intro']}</p></div>
        <div class="world-controls" data-world-controls hidden>
          <div class="time-switch" role="group" aria-label="{c['day']} / {c['night']}"><button type="button" data-time-choice="day" aria-pressed="true">☀ <span>{c['day']}</span></button><button type="button" data-time-choice="night" aria-pressed="false">☾ <span>{c['night']}</span></button></div>
          <button class="quiet-button" type="button" data-sound aria-pressed="false">♫ <span>{c['sound']}</span></button>
          <button class="quiet-button motion-button" type="button" data-motion aria-pressed="false" aria-label="{c['motion']}">Ⅱ</button>
        </div>
      </div>
      <div class="world-stage">
        <div class="world-landscape">
          <img class="courtyard courtyard-day" src="/assets/world/courtyard-day-v2.webp" width="1536" height="1024" alt="{c['intro']}" fetchpriority="high">
          <img class="courtyard courtyard-night" src="/assets/world/courtyard-night-v2.webp" width="1536" height="1024" alt="" loading="lazy">
          <div class="courtyard-actors" aria-hidden="true" hidden><div class="gate-guard guard-left"><div class="lancer-sprite"></div></div><div class="gate-guard guard-right"><div class="lancer-sprite"></div></div></div>
          <div class="world-dust" aria-hidden="true"></div><div class="fire-glow" aria-hidden="true"></div><div class="lantern-glow" aria-hidden="true"></div>
          <div class="courtyard-resident" aria-hidden="true"><div class="resident-sprite"></div></div>
          <div class="world-motes" aria-hidden="true">{''.join(f'<i style="--i:{i}"></i>' for i in range(14))}</div>
          <a class="world-marker marker-forest" href="/games/tiny-defense/play/"><span class="marker-point" aria-hidden="true">↗</span><span class="marker-label">{c['forest']}</span></a>
          <a class="world-marker marker-gate" href="{game}#stores"><span class="marker-point" aria-hidden="true">↗</span><span class="marker-label">{c['gate']}</span></a>
          <a class="world-marker marker-book" href="#storybook" data-open-story><span class="marker-point" aria-hidden="true">＋</span><span class="marker-label">{c['book']}</span></a>
        </div>
        <div class="world-caption"><span class="world-place">TINY DEFENSE <span aria-hidden="true">/</span> ONESTEP STUDIO</span><span>{c['hint']}</span></div>
      </div>
      <div class="world-bottom"><a href="#storybook">01 <span>{c['book']}</span> ↓</a><a href="/games/tiny-defense/play/">02 <span>{c['forest']}</span> ↗</a><a href="{game}#stores">03 <span>{c['gate']}</span> ↗</a></div>
      <p class="world-notice" data-world-notice role="status"></p>
    </section>
    <section class="story-invitation" id="storybook" aria-labelledby="invitation-title">
      <div class="invitation-art"><img src="/assets/world/supplies.webp?v=story-3" alt="" loading="lazy" width="1024" height="1024"></div>
      <div class="invitation-copy"><p class="world-eyebrow">{c['chapter']} <span aria-hidden="true">—</span> STORYBOOK</p><h2 id="invitation-title">{c['booktitle']}</h2><p>{c['bookdesc']}</p><a class="book-cta" href="{base}/story/" data-open-story>{c['open']} <span aria-hidden="true">↗</span></a><button class="resume-link" data-resume-story hidden>{c['resume']}</button></div>
    </section>
    <dialog class="story-reader" id="story-reader" aria-labelledby="reader-title">
      <div class="reader-shell">
        <header class="reader-toolbar"><div><span class="reader-kicker">TINY DEFENSE / CHAPTER 01</span><h2 id="reader-title">{c['booktitle']}</h2></div><div class="reader-actions"><button type="button" class="reader-sound" data-sound aria-pressed="false">♫ <span>{c['sound']}</span></button><button type="button" data-contents aria-expanded="false" aria-controls="story-contents">{c['contents']}</button><button type="button" data-close-story aria-label="{c['close']}">✕</button></div></header>
        <nav class="story-contents" id="story-contents" aria-label="{c['contents']}" hidden></nav>
        <div class="book-spread" data-book-spread>
          <div class="book-left" data-book-left><div class="book-illustration"><img data-story-art src="/assets/world/prologue.webp" alt=""><div class="story-art-shade"></div><span class="art-chapter">CHAPTER <b>01</b></span></div><article class="book-page left-page" data-left-page hidden><p class="page-eyebrow" data-left-kicker></p><h3 data-left-title></h3><div class="story-lines" data-left-lines></div></article><span class="folio" data-folio-left></span></div>
          <article class="book-page" data-book-page tabindex="-1"><p class="page-eyebrow" data-page-kicker></p><h3 data-page-title></h3><div class="story-lines" data-story-lines></div><div class="story-gate" data-story-gate hidden></div><div class="page-ornament" aria-hidden="true">✦</div><span class="folio" data-folio-right></span></article>
        </div>
        <p class="book-gesture-hint">{ {'ko':'페이지 가장자리를 끌거나 화살표로 넘겨 보세요.', 'en':'Drag a page edge or use the arrows to turn.', 'ja':'ページの端をドラッグするか、矢印でめくれます。'}[lang] }</p>
        <footer class="reader-footer"><button type="button" data-story-prev>← <span>{c['prev']}</span></button><span class="page-progress" data-page-progress role="status" aria-live="polite"></span><button type="button" data-story-next><span>{c['next']}</span> →</button></footer>
        <div class="reader-settings"><label>♫ {c['volume']} <input data-volume aria-label="{c['volume']}" type="range" min="0" max="100" value="35"></label><a href="{base}/story/">{c['read']}</a></div>
      </div>
    </dialog>
    <details class="world-credits"><summary>{c['credits']}</summary><p>“The Path of the Goblin King” — <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100873">Kevin MacLeod (incompetech.com)</a>, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.<br>“Crossing the Chasm” — <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700026">Kevin MacLeod (incompetech.com)</a>, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Web versions: re-encoded, loudness adjusted.<br>Book sounds — <a href="https://kenney.nl/assets/rpg-audio">Kenney RPG Audio</a>, CC0.<br>“Secret of Beautiful Forest” — OneStep Studio. Illustrations and characters — Tiny Defense / OneStep Studio. Courtyard art — AI-generated for OneStep Studio.</p></details>
    <!-- WORLD EXPERIENCE END -->'''

def main():
    stories=json.loads((ROOT/'assets/world/story.json').read_text(encoding='utf-8'))
    for lang,c in COPY.items():
        base=ROOT if lang=='ko' else ROOT/lang
        file=base/'index.html'
        text=file.read_text(encoding='utf-8')
        world=render(lang,c)
        if '<!-- WORLD EXPERIENCE START -->' in text:
            text=re.sub(r'<!-- WORLD EXPERIENCE START -->.*?<!-- WORLD EXPERIENCE END -->',lambda _:world,text,flags=re.S)
        else:
            text=re.sub(r'<section class="studio-intro".*?</section>',lambda _:world,text,flags=re.S)
        if '/world.css' not in text:
            text=text.replace('</head>','  <link rel="stylesheet" href="/world.css?v=world-1">\n  <script defer src="/world.js?v=world-1"></script>\n</head>')
        text=text.replace('content="#f9f8f3"','content="#0b1720"').replace('content="light"','content="dark light"')
        text=text.replace('as="image" href="/assets/onestep-logo.webp"','as="image" href="/assets/world/courtyard-day.webp"')
        text=text.replace('/assets/world/courtyard-day.webp','/assets/world/courtyard-day-v2.webp')
        text=text.replace('/world.css?v=world-1','/world.css?v=world-2').replace('/world.js?v=world-1','/world.js?v=world-2')
        text=re.sub(r'/world\.(css|js)\?v=world-\d+', r'/world.\1?v=world-4', text)
        if '/book-turn.js' not in text:
            text=text.replace('<script defer src="/world.js', '<script defer src="/book-turn.js?v=1"></script>\n  <script defer src="/world.js')
        file.write_text(text,encoding='utf-8')
        story=stories[lang]
        content=''
        chapter = None
        seen_art = set()
        for page in story['pages']:
            if page['chapter'] != chapter:
                chapter = page['chapter']
                content += f'<h2 class="text-chapter">CHAPTER {chapter:02d}</h2>'
            lines=''.join('<p>'+('<strong>'+escape(story['boy'] if line['speaker']==1 else c['old'])+'</strong><br>' if line['speaker'] else '')+escape(line['text'])+'</p>' for line in page['lines'])
            repeated = page['art'] in seen_art
            seen_art.add(page['art'])
            illustration = '' if repeated else f'<img src="/assets/world/{page["art"]}.webp?v=story-3" alt="" loading="lazy">'
            layout = ' class="text-only"' if repeated else ''
            content+=f'<section{layout}>{illustration}<div><h2>{escape(page["title"])}</h2><div class="text-dialogue">{lines}</div></div></section>'
        prefix='' if lang=='ko' else '/'+lang
        route=base/'story'
        route.mkdir(exist_ok=True)
        (route/'index.html').write_text(f'''<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{c['booktitle']} | Tiny Defense</title><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/world.css?v=world-4"><meta name="robots" content="noindex"></head><body class="story-text-page"><header><a href="{prefix}/#storybook">← {c['home']}</a><p>CHAPTER 01–03 · TINY DEFENSE</p><h1>{c['booktitle']}</h1></header><main>{content}</main><footer><a href="{prefix}/#storybook">← {c['home']}</a></footer></body></html>''',encoding='utf-8')
        game=base/'games/tiny-defense/index.html'
        html=game.read_text(encoding='utf-8')
        if '#storybook' not in html:
            html=html.replace('<a href="#features">',f'<a href="{prefix}/#storybook">{c["book"]}</a>\n        <a href="#features">',1)
            game.write_text(html,encoding='utf-8')
    print('Built KO/EN/JA courtyard, reader and accessible story text pages.')

if __name__=='__main__': main()
