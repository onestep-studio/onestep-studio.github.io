"""Render the studio homepage in its three existing languages.

Game detail pages have their own visual worlds. This file owns only the studio
entrance, preserving the existing head metadata and links when regenerating.
"""
from pathlib import Path
import html
import re
from site_analytics import add_analytics

ROOT = Path(__file__).resolve().parents[1]
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>'
DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6"/></svg>'
COPY = {
 'ko': {
  'skip':'본문 바로가기','home':'OneStep Studio 홈','nav':'주요 메뉴','games':'게임','studio':'스튜디오','contact':'문의','languages':'언어 선택','open':'메뉴 열기','close':'메뉴 닫기',
  'intro':'조금 느리더라도,<br>더 나은 게임을 향해<br>꾸준히 한 걸음씩 나아갑니다.',
  'explore':'게임 둘러보기','gamesHeading':'우리의 게임','gameLink':'게임 페이지 보기',
  'tinyStatus':'지금 플레이 가능','tinyGenre':'생존 디펜스','tinyText':'낮에는 모으고, 밤에는 지킨다.<br>작은 성에서 시작되는 끝없는 도전.',
  'tinyAlt':'성을 지키는 소년 영웅과 정령, 거대한 돌 트롤이 있는 Tiny Defense의 밤',
  'eosaName':'암행어사','eosaSub':'먹으로 남긴 이름','eosaStatus':'출시 예정','eosaGenre':'조선 추리 어드벤처',
  'eosaText':'신분을 숨기고, 사람들의 말을 듣다.<br>작은 증거로 밝혀내는 사건의 진실.',
  'eosaAlt':'마패를 든 윤서와 기록을 품은 도겸, 관아의 인물이 함께 그려진 암행어사 전체 키아트',
  'studioHeading':'한 걸음씩,<br>오래 남을 세계로.',
  'studioLead':'OneStep Studio는 작은 선택이<br>큰 이야기가 되는 게임을 만듭니다.',
  'studioText':'Tiny Defense의 작은 성에서 암행어사의 잠행길까지. 저마다의 선택과 이야기가 살아 있는 세계를 차근차근 만들고 있습니다.',
  'contactLead':'게임과 스튜디오에 관해 이야기 나눠요.',
  'top':'맨 위로','legal':'법적 고지','privacy':'Tiny Defense 개인정보처리방침','terms':'Tiny Defense 이용약관',
 },
 'en': {
  'skip':'Skip to content','home':'OneStep Studio home','nav':'Main navigation','games':'Games','studio':'Studio','contact':'Contact','languages':'Choose language','open':'Open menu','close':'Close menu',
  'intro':'Even if it takes a little longer,<br>we keep moving toward better games.',
  'explore':'Explore our games','gamesHeading':'Our games','gameLink':'View game',
  'tinyStatus':'Available now','tinyGenre':'Survival defense','tinyText':'Gather by day. Defend by night.<br>An endless challenge in a little castle.',
  'tinyAlt':'A young hero and spirit defend a castle against a giant stone troll in Tiny Defense',
  'eosaName':'Amhaeng Eosa','eosaSub':'A Name Written in Ink','eosaStatus':'Coming soon','eosaGenre':'A Joseon mystery adventure',
  'eosaText':'Hide your identity. Listen closely.<br>Follow small clues to uncover the truth.',
  'eosaAlt':'The complete Amhaeng Eosa key art, with Yunseo holding his royal seal, Dogyeom carrying records, and a county official',
  'studioHeading':'One step closer.<br>A world that stays.',
  'studioLead':'At OneStep Studio, small choices<br>become stories worth remembering.',
  'studioText':'From the little castle of Tiny Defense to the undercover roads of Amhaeng Eosa, we build worlds shaped by your choices and the stories they leave behind.',
  'contactLead':'Let’s talk about our games and studio.',
  'top':'Back to top','legal':'Legal information','privacy':'Tiny Defense privacy policy','terms':'Tiny Defense terms of service',
 },
 'ja': {
  'skip':'本文へ移動','home':'OneStep Studio ホーム','nav':'メインメニュー','games':'ゲーム','studio':'スタジオ','contact':'お問い合わせ','languages':'言語を選択','open':'メニューを開く','close':'メニューを閉じる',
  'intro':'少しゆっくりでも、<br>よりよいゲームを目指して、<br>一歩ずつ進み続けます。',
  'explore':'ゲームを見る','gamesHeading':'私たちのゲーム','gameLink':'ゲームページへ',
  'tinyStatus':'配信中','tinyGenre':'サバイバルディフェンス','tinyText':'昼は集め、夜は守る。<br>小さな城から始まる、終わりなき挑戦。',
  'tinyAlt':'城を守る少年の英雄と精霊、巨大な岩のトロールがいる Tiny Defense の夜',
  'eosaName':'暗行御史','eosaSub':'墨に残した名','eosaStatus':'発売予定','eosaGenre':'朝鮮を舞台にした推理アドベンチャー',
  'eosaText':'身分を隠し、人々の話を聞く。<br>小さな証拠から、事件の真実を探る。',
  'eosaAlt':'馬牌を掲げるユンソ、記録を抱えるトギョム、役人を描いた暗行御史のキービジュアル全景',
  'studioHeading':'一歩ずつ、<br>心に残る世界へ。',
  'studioLead':'小さな選択が、<br>大きな物語になるゲームを。',
  'studioText':'『Tiny Defense』の小さな城から『暗行御史』の潜行の道まで。それぞれの選択と物語が息づく世界を、一歩ずつ形にしています。',
  'contactLead':'ゲームやスタジオについて、お話ししましょう。',
  'top':'ページの先頭へ','legal':'法的情報','privacy':'Tiny Defense プライバシーポリシー','terms':'Tiny Defense 利用規約',
 }
}

def esc(value): return html.escape(value,quote=True)

def build(lang,c):
    base='/' if lang=='ko' else '/'+lang+'/'
    target=ROOT/base.lstrip('/')/'index.html'
    source=target.read_text('utf-8')
    head=source.split('<body',1)[0]
    head=re.sub(r'<meta name="theme-color" content="[^"]*">','<meta name="theme-color" content="#0b1218">',head)
    head=re.sub(r'<meta name="color-scheme" content="[^"]*">','<meta name="color-scheme" content="dark">',head)
    head=re.sub(r'\s*<link[^>]+href="/home\.css[^>]*>','',head)
    head=re.sub(r'\s*<link[^>]+href="/assets/studio/StudioSans[^>]*>','',head)
    head=head.replace('</head>','  <link rel="preload" as="font" href="/assets/studio/StudioSans-Semibold.woff2?v=studio-voice-5" type="font/woff2" crossorigin>\n  <link rel="stylesheet" href="/home.css?v=studio-voice-5">\n</head>')
    switches=''.join(f'<a href="{url}" lang="{code}"'+(' aria-current="page"' if lang==code else '')+f'>{label}</a>' for code,url,label in [('ko','/','KO'),('en','/en/','EN'),('ja','/ja/','日本語')])
    eosaFull=c['eosaName']+': '+c['eosaSub']
    body=f'''<body class="home-page" data-studio-home="2">
  <a class="skip-link" href="#main">{c['skip']}</a>
  <header class="site-header" data-header>
    <div class="header-inner">
      <a class="wordmark" href="{base}" aria-label="{c['home']}"><img class="wordmark-logo" src="/assets/onestep-logo.webp" alt="" width="512" height="512"><span>onestep<span class="wordmark-studio"> studio</span></span></a>
      <div class="studio-header-actions">
        <nav class="primary-nav" id="primary-nav" aria-label="{c['nav']}"><a href="#games">{c['games']}</a><a href="#studio">{c['studio']}</a><a href="mailto:contact@onestep-games.com">{c['contact']}</a></nav>
        <span class="studio-languages" role="group" aria-label="{c['languages']}">{switches}</span>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="{c['open']}" data-label-open="{c['open']}" data-label-close="{c['close']}"><span></span><span></span><span></span></button>
      </div>
    </div>
  </header>
  <main id="main">
    <section class="studio-intro" id="top" aria-labelledby="studio-home-title">
      <div class="container studio-intro-inner">
        <h1 id="studio-home-title"><span>Better games,</span><span>one step <br class="studio-mobile-break">at a time.</span></h1>
        <div class="studio-intro-note"><p>{c['intro']}</p><a class="studio-explore" href="#games"><span class="studio-explore-text">{c['explore']}</span><span class="studio-explore-icon">{DOWN}</span></a></div>
      </div>
    </section>
    <section class="game-library" id="games" aria-labelledby="games-title">
      <div class="container">
        <h2 class="sr-only" id="games-title">{c['gamesHeading']}</h2>
        <div class="game-grid">
          <a class="game-card reveal" href="{base}games/tiny-defense/" aria-label="{c['gameLink']}, Tiny Defense">
            <div class="game-card-media">
              <img src="/assets/brand-20261014/keyart-wide.webp" alt="{c['tinyAlt']}" width="1007" height="578" fetchpriority="high">
              <span class="game-status is-live"><span aria-hidden="true"></span>{c['tinyStatus']}</span>
              <span class="studio-art-enter" aria-hidden="true">{ARROW}</span>
            </div>
            <div class="game-card-body">
              <p class="studio-game-genre">{c['tinyGenre']}</p>
              <h3>Tiny Defense</h3>
              <p class="studio-game-description">{c['tinyText']}</p>
              <span class="game-card-link">{c['gameLink']} {ARROW}</span>
            </div>
          </a>
          <a class="game-card game-card-eosa reveal" href="{base}games/amhaeng-eosa/" aria-label="{esc(eosaFull)}, {c['gameLink']}">
            <div class="game-card-media game-card-eosa-media">
              <img class="game-card-eosa-art" src="/assets/amhaeng-eosa/manager-keyart-original.webp" alt="{c['eosaAlt']}" width="1536" height="1024">
              <span class="game-status is-coming"><span aria-hidden="true"></span>{c['eosaStatus']}</span>
              <span class="studio-art-enter" aria-hidden="true">{ARROW}</span>
            </div>
            <div class="game-card-body">
              <p class="studio-game-genre">{c['eosaGenre']}</p>
              <h3>{c['eosaName']}<span class="studio-game-subtitle">{c['eosaSub']}</span></h3>
              <p class="studio-game-description">{c['eosaText']}</p>
              <span class="game-card-link">{c['gameLink']} {ARROW}</span>
            </div>
          </a>
        </div>
      </div>
    </section>
    <section class="studio-summary" id="studio" aria-labelledby="studio-summary-title">
      <div class="container studio-summary-grid">
        <div><img class="studio-summary-mark" src="/assets/onestep-logo.webp" alt="" width="512" height="512" loading="lazy"><h2 id="studio-summary-title">{c['studioHeading']}</h2></div>
        <div class="studio-summary-copy"><p class="lead">{c['studioLead']}</p><p>{c['studioText']}</p><div class="studio-contact"><p>{c['contactLead']}</p><a href="mailto:contact@onestep-games.com">contact@onestep-games.com {ARROW}</a></div></div>
      </div>
    </section>
  </main>
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="studio-footer-brand"><a class="wordmark wordmark-footer" href="#top" aria-label="{c['top']}"><img class="wordmark-logo" src="/assets/onestep-logo.webp" alt="" width="512" height="512" loading="lazy"><span>onestep studio</span></a><p>Better games, one step at a time.</p></div>
      <div class="studio-footer-meta"><nav aria-label="{c['legal']}"><a href="https://notedays.github.io/tinydefense-legal/privacy-policy.html">{c['privacy']}</a><a href="https://notedays.github.io/tinydefense-legal/terms-of-service.html">{c['terms']}</a></nav><p>© <span data-year>2026</span> OneStep Studio. All rights reserved.</p></div>
    </div>
  </footer>
</body>
</html>
'''
    target.write_text(add_analytics(head+body),'utf-8')
    print('Built',target.relative_to(ROOT))

if __name__=='__main__':
    for lang,c in COPY.items(): build(lang,c)
