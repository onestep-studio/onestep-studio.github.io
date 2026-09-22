"""Map popup content, reusing the published KO/EN/JA game descriptions."""
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LABELS = {
    'ko': dict(day='낮의 준비', night='밤의 수비', stores='나가기', storetitle='모험을 이어갈 곳', storeintro='Tiny Defense를 스토어에서 만나보세요.', close='맵으로 돌아가기', game='도끼질 체험', studio='OneStep Studio', prev='이전 장면', next='다음 장면', reset='닫으면 이번 도전은 끝나고 최고 기록은 남아요.'),
    'en': dict(day='Prepare by day', night='Defend at night', stores='Leave the gate', storetitle='Continue your adventure', storeintro='Find Tiny Defense in your app store.', close='Back to the courtyard', game='Try woodcutting', studio='OneStep Studio', prev='Previous scene', next='Next scene', reset='Closing ends this attempt. Your best score stays saved.'),
    'ja': dict(day='昼の備え', night='夜の守り', stores='城の外へ', storetitle='冒険の続きへ', storeintro='ストアでTiny Defenseを見つけよう。', close='城の中へ戻る', game='薪割り体験', studio='OneStep Studio', prev='前の場面', next='次の場面', reset='閉じると今回の挑戦は終了します。最高記録は残ります。'),
}

def panels(lang):
    c = LABELS[lang]
    base = ROOT if lang == 'ko' else ROOT / lang
    source = (base / 'games/tiny-defense/index.html').read_text(encoding='utf-8')
    scenes = re.findall(r'<li class="daynight-item">(.*?)</li>', source, re.S)
    if len(scenes) != 10:
        raise ValueError(f'{lang}: expected ten game description scenes')
    result = []
    for kind, rows in [('day', scenes[:5]), ('night', scenes[5:])]:
        buttons, articles = [], []
        for i, row in enumerate(rows):
            title = re.search(r'<h3>(.*?)</h3>', row, re.S).group(1)
            body = re.search(r'<p>(.*?)</p>', row, re.S).group(1)
            poster = re.search(r'poster="([^"]+)"', row).group(1)
            video = re.search(r'\bsrc="([^"]+)"', row).group(1)
            buttons.append(f'<button type="button" data-guide-jump="{i}" aria-pressed="{str(i == 0).lower()}"><span>{i+1:02d}</span> {title}</button>')
            articles.append(f'<article class="guide-scene" data-guide-scene {"hidden" if i else ""}><video controls muted loop playsinline preload="none" poster="{poster}" data-src="{video}" aria-label="{escape(title, quote=True)}"></video><div><p class="world-eyebrow">TINY DEFENSE / {kind.upper()} {i+1:02d}</p><h3>{title}</h3><p>{body}</p></div></article>')
        result.append(f'''<template data-map-template="{kind}" data-title="{c[kind]}">
          <div class="guide-tabs"><button type="button" data-map-switch="day" aria-pressed="{str(kind == 'day').lower()}">☀ {c['day']}</button><button type="button" data-map-switch="night" aria-pressed="{str(kind == 'night').lower()}">☾ {c['night']}</button></div>
          <div class="guide-scenes">{''.join(articles)}</div>
          <nav class="guide-index" aria-label="{c[kind]}">{''.join(buttons)}</nav>
          <div class="guide-navigation"><button type="button" data-guide-prev>← {c['prev']}</button><span data-guide-progress role="status">1 / 5</span><button type="button" data-guide-next>{c['next']} →</button></div>
        </template>''')
    stores = re.search(r'<ul class="store-grid">.*?</ul>', source, re.S).group(0)
    result.append(f'''<template data-map-template="stores" data-title="{c['storetitle']}"><div class="store-banner"><img src="/assets/app-icon.webp" width="96" height="96" alt=""><div><p class="world-eyebrow">TINY DEFENSE</p><p>{c['storeintro']}</p></div></div>{stores}</template>''')
    result.append(f'''<template data-map-template="game" data-title="{c['game']}"><p class="mini-note">{c['reset']}</p><iframe class="map-minigame" title="{c['game']}" data-src="/games/tiny-defense/play/?embed=1&amp;courtyard=1&amp;lang={lang}&amp;v=map-1" allow="autoplay; web-share; clipboard-write"></iframe></template>''')
    home = (base/'index.html').read_text(encoding='utf-8')
    studio = re.search(r'<section class="studio-summary.*?</section>', home, re.S).group(0)
    studio = re.sub(r'\s(?:id|aria-labelledby)="[^"]*"', '', studio).replace(' reveal', '')
    result.append(f'<template data-map-template="studio" data-title="{c["studio"]}">{studio}</template>')
    return f'''<dialog class="map-popup" data-map-dialog aria-labelledby="map-panel-title"><div class="map-panel-shell"><header class="map-panel-toolbar"><div><p class="world-eyebrow">TINY DEFENSE</p><h2 id="map-panel-title"></h2></div><button type="button" data-map-close aria-label="{c['close']}">✕ <span>{c['close']}</span></button></header><div class="map-panel-content" data-map-content></div></div></dialog>''' + ''.join(result)
