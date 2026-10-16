"""Build the three localized, buildless Amhaeng Eosa introduction pages."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSET = '/assets/amhaeng-eosa/'
ORIGIN = 'https://onestep-studio.github.io'
COPY = {
 'ko': {
  'name':'암행어사: 먹으로 남긴 이름','subtitle':'먹으로 남긴 이름',
  'description':'암행어사 윤서와 서리 도겸의 조선 수사극. 잠행으로 단서를 모으고, 증언의 모순을 밝혀 직접 판결하세요. 출시 예정.',
  'home':'게임 목록','stores':'출시 안내','skip':'본문 바로가기','languages':'언어 선택',
  'lead':'남루한 차림, 숨겨 둔 마패.<br>거짓말 뒤의 사정을 듣다.',
  'intro':'신분을 숨긴 암행어사가 되어 사람들의 말을 듣고, 작은 증거에서 사건의 진실을 찾으세요.',
  'enter':'잠행 시작하기','release':'출시 예정','genre':'조선 수사극 · 추리 어드벤처',
  'introTitle':'사라진 열 닢.<br>그 너머에 숨은 이름.',
  'introBody':'주막에서 돈주머니가 사라지고, 한 소년이 범인으로 몰립니다. 작은 도둑질로 시작한 사건은 굶주린 창고와 빼앗긴 땅, 그 뒤에 숨은 사람들에게 이어집니다.',
  'experienceTitle':'눈에 보이는 것이 전부는 아니니.',
  'experienceBody':'장소를 고르고, 표시된 단서를 눌러 살펴보세요.',
  'locationLabel':'조사 장소','notebook':'잠행 수첩','notebookHint':'그림 속 단서를 눌러 기록을 펼치세요.','progress':'살펴본 단서','reset':'기록 처음부터','preview':'본편 도입부를 바탕으로 구성한 웹 미리보기입니다.',
  'journeyTitle':'작은 단서가<br>마지막 재판에 닿을 때까지.',
  'journeyBody':'잠행하며 모은 기록은 증인의 말을 되짚는 근거가 됩니다. 준비가 되면 마패를 꺼내 재판을 열고, 책임자와 죄목, 핵심 증거 두 가지를 직접 고르세요.',
  'mapAlt':'한양에서 여러 고을과 나루를 잇는 암행어사의 여정 지도','mapCaption':'한양에서 청운까지, 두 사람의 잠행길',
  'cases':['사라진 돈주머니','돌아오지 않은 서리','굶주린 창고','지워진 경계','만들어진 범인','먹으로 남긴 이름'],
  'castTitle':'길 위에서, 서로의 곁을 지키는 두 사람.',
  'castBody':'하나는 사정을 듣고, 하나는 그 말을 놓치지 않습니다.',
  'yunseo':'윤서','yunseoRole':'신분을 숨긴 암행어사','yunseoDescription':'차가운 판단 뒤에 따뜻한 마음을 품은 어사. 종이에 적힌 말보다 사람의 사정을 끝까지 듣고자 합니다.',
  'dogyeom':'도겸','dogyeomRole':'윤서를 따르는 수행 서리','dogyeomDescription':'사람을 향한 호기심과 솔직한 웃음을 가진 서리. 기록을 챙기고, 곁에서 윤서의 생각을 붙잡아 줍니다.',
  'quote':'거짓말을 했다는 이유만으로<br>죄를 정하지 마세요.',
  'judgment':'모순을 찾는 일과 책임을 입증하는 일은 다릅니다. 마지막 판결은 어사의 몫입니다. 잘못 내린 판결은 임무를 끝내지만, 재심에서는 모아 둔 기록으로 다시 판단할 수 있습니다.',
  'storeTitle':'다음 여정을 준비하고 있습니다.',
  'storeBody':'암행어사: 먹으로 남긴 이름은 개발 중입니다. 스토어가 열리면 이곳에서 안내하겠습니다.',
  'platforms':[('Steam','출시 예정'),('모바일','출시 예정')],
  'storeNote':'출시일과 스토어 링크는 아직 공개되지 않았습니다. · 게임 언어: 한국어',
  'contact':'스튜디오에 문의','soundOn':'음악 켜기','soundOff':'음악 끄기','soundError':'음악을 불러오지 못했습니다. 다시 눌러 주세요.',
  'sceneAlt':['가을빛이 드는 초가 주막의 마당','창문으로 햇빛이 드는 주막의 작은 뒷방','버드나무 아래 배가 정박한 나루'],
  'locations':[
   {'name':'월선의 주막','image':'village','ambient':'부엌에서 따뜻한 밥 냄새가 납니다. 사라진 돈주머니의 행방을 찾기 전, 아침부터 있었던 일을 살펴봅니다.','spots':[
    {'name':'아침 계산 쪽지','image':'receipt','text':'솔이가 물을 길으러 마당으로 나간 뒤, 월선은 엽전 열 닢을 직접 셌습니다.\n\n돈이 없어진 때는 이 계산보다 뒤입니다.'},
    {'name':'물 심부름 기록','image':'gate','text':'솔이는 계산이 끝나기 전부터 우물에서 물을 길었습니다.\n\n주막 품꾼이 물통을 받은 때를 적어 두었습니다. 다른 기록과 견주면 순서를 알 수 있습니다.'}]},
   {'name':'주막 뒷방','image':'room','ambient':'창문 아래에서 밥상 모서리가 흔들립니다. 조용한 방에도 사람들의 말과 대조해 볼 흔적이 남아 있습니다.','spots':[
    {'name':'주막 열쇠 대장','image':'debt','text':'뒷방 열쇠는 손님용과 주인용, 두 개입니다.\n\n손님용은 김연이 지녔고, 주인용은 조리대 못에 걸려 있었습니다. 누가 열쇠에 손댈 수 있었을까요?'},
    {'name':'짐방 빗장 흔적','image':'footprints','text':'빗장은 안에서 걸리지 않았습니다. 바깥 열쇠로 열 수 있는 문입니다.\n\n문이 잠겼다는 말만으로 드나든 사람이 한 명뿐이라고 할 수는 없습니다.'}]},
   {'name':'나루 장터','image':'river','ambient':'강아지가 솔이의 신발 옆에서 잠들었습니다. 주막 밖에서 있었던 일에도 귀를 기울여 봅니다.','spots':[
    {'name':'장터 생선값 쪽지','image':'first-slip','text':'솔이는 강아지가 건드린 생선값을 외상으로 적었습니다.\n\n이 쪽지는 생선값 때문에 쓴 것입니다. 주막의 돈 열 닢을 건넸다는 기록은 없습니다.'},
    {'name':'우물가 목격 메모','image':'gate','text':'생선 장수는 솔이가 강아지를 씻기는 동안 빈손이었다고 확인했습니다.\n\n목격한 것은 하루의 일부분입니다. 한 사람의 말만으로 모든 일을 알 수 있을까요?'}]}
  ]
 },
 'en': {
  'name':'Amhaeng Eosa: A Name Written in Ink','subtitle':'A Name Written in Ink',
  'description':'Go undercover with royal inspector Yunseo and his clerk Dogyeom. Investigate, challenge testimony with evidence, and deliver your own verdict. Coming soon.',
  'home':'All games','stores':'Release news','skip':'Skip to content','languages':'Choose language',
  'lead':'Plain clothes. A hidden royal seal.<br>A story behind every lie.',
  'intro':'Become an undercover royal inspector. Listen to the people, follow the evidence, and uncover the truth.',
  'enter':'Begin the investigation','release':'Coming soon','genre':'A Joseon mystery adventure',
  'introTitle':'Ten missing coins.<br>A name hidden beyond them.',
  'introBody':'A purse disappears from an inn, and a boy takes the blame. What begins as a small theft leads to empty granaries, stolen land, and the people behind it all.',
  'experienceTitle':'There is more than meets the eye.',
  'experienceBody':'Choose a place, then select a marked clue to examine it.',
  'locationLabel':'Investigation locations','notebook':'Field notes','notebookHint':'Select a clue in the scene to open its record.','progress':'Clues examined','reset':'Reset the notes','preview':'A web preview adapted from the opening investigation.',
  'journeyTitle':'Follow a small clue<br>to the final hearing.',
  'journeyBody':'Use the records you gather to challenge testimony. When you are ready, reveal your royal seal and hold court. Choose who is responsible, their crime, and two pieces of evidence that prove it.',
  'mapAlt':'A painted map connecting Hanyang with the towns and river crossings of the investigation','mapCaption':'From Hanyang to Cheongun, an undercover journey',
  'cases':['The missing purse','The clerk who never returned','The hungry granary','The erased boundary','The fabricated culprit','A name written in ink'],
  'castTitle':'Two companions on the same road.',
  'castBody':'One listens closely. The other makes sure no word is lost.',
  'yunseo':'Yunseo','yunseoRole':'An undercover royal inspector','yunseoDescription':'A clear mind and a warm heart. Yunseo wants to hear the whole story, beyond what is written on paper.',
  'dogyeom':'Dogyeom','dogyeomRole':"Yunseo’s accompanying clerk",'dogyeomDescription':'Curious, earnest, and quick to smile. Dogyeom keeps the records and helps Yunseo think things through.',
  'quote':'A lie alone<br>does not prove a crime.',
  'judgment':'Finding a contradiction and proving responsibility are different tasks. A wrongful final verdict ends your mission. On retrial, keep your investigation and testimony records to reconsider the case.',
  'storeTitle':'The next journey is taking shape.',
  'storeBody':'Amhaeng Eosa: A Name Written in Ink is in development. Store links will appear here when they are available.',
  'platforms':[('Steam','Coming soon'),('Mobile','Coming soon')],
  'storeNote':'Release date and store links have not been announced. · Game language: Korean',
  'contact':'Contact the studio','soundOn':'Music on','soundOff':'Music off','soundError':'The music could not load. Select the button to try again.',
  'sceneAlt':['An autumn courtyard outside a thatched inn','Sunlight entering a small room behind the inn','A boat moored at a willow-lined river crossing'],
  'locations':[
   {'name':"Wolseon’s inn",'image':'village','ambient':'Warm food scents the kitchen. Before tracing the missing purse, take a closer look at what happened that morning.','spots':[
    {'name':'Morning tally','image':'receipt','text':'After Soli went to fetch water, Wolseon counted ten coins herself.\n\nThe money disappeared after this count.'},
    {'name':'Water-carrying log','image':'gate','text':'Soli was fetching water before the count was finished.\n\nA worker recorded when the buckets arrived. Compare the records to establish the order of events.'}]},
   {'name':'The back room','image':'room','ambient':'A low table wobbles beneath the window. Even a quiet room holds traces to compare against what people say.','spots':[
    {'name':'Key register','image':'debt','text':'There are two keys to the back room: one for the guest and one for the owner.\n\nGimyeon had the guest key. The other hung by the kitchen counter. Who could have reached it?'},
    {'name':'Door-bolt marks','image':'footprints','text':'The bolt was not fastened from inside. The door could be opened with a key from outside.\n\nA locked door does not prove that only one person could enter.'}]},
   {'name':'Riverside market','image':'river','ambient':"A puppy sleeps beside Soli’s shoes. Listen for what happened beyond the inn, too.",'spots':[
    {'name':'Fish debt note','image':'first-slip','text':'Soli recorded a debt for fish that the puppy had disturbed.\n\nThis note concerns the fish. It does not record a payment of the ten missing coins.'},
    {'name':'A witness by the well','image':'gate','text':'The fish seller saw Soli empty-handed while he washed the puppy.\n\nThat witness saw only part of the day. Can one account explain everything?'}]}
  ]
 },
 'ja': {
  'name':'暗行御史：墨に残した名','subtitle':'墨に残した名',
  'description':'身分を隠した暗行御史ユンソと書吏トギョムの朝鮮推理劇。証拠を集め、証言の矛盾を見抜き、自ら判決を下す。発売予定。',
  'home':'ゲーム一覧','stores':'発売情報','skip':'本文へ移動','languages':'言語を選択',
  'lead':'粗末な身なり、隠した馬牌。<br>嘘の裏にある事情を聞く。',
  'intro':'身分を隠した暗行御史となり、人々の話に耳を傾け、小さな証拠から事件の真実を探りましょう。',
  'enter':'潜行を始める','release':'発売予定','genre':'朝鮮を舞台にした推理アドベンチャー',
  'introTitle':'消えた十枚の銭。<br>その先に隠された名。',
  'introBody':'宿で銭袋が消え、一人の少年に疑いがかかります。小さな盗みから始まった事件は、空の穀倉と奪われた土地、そして背後の人々へとつながっていきます。',
  'experienceTitle':'目に見えるものが、すべてではない。',
  'experienceBody':'場所を選び、印のついた手がかりを押して調べましょう。',
  'locationLabel':'調査する場所','notebook':'潜行の手帳','notebookHint':'場面の手がかりを押すと記録が開きます。','progress':'調べた手がかり','reset':'記録をリセット','preview':'本編冒頭の調査をもとにしたウェブプレビューです。',
  'journeyTitle':'小さな手がかりが、<br>最後の裁きに届くまで。',
  'journeyBody':'潜行で集めた記録が、証言を問い直す根拠になります。用意ができたら馬牌を掲げ、裁きを開きましょう。責任を負う人物と罪名、そして立証する二つの証拠を選ぶのはあなたです。',
  'mapAlt':'漢陽から各地の村や渡し場へと続く暗行御史の旅の地図','mapCaption':'漢陽から青雲へ、二人の潜行の道',
  'cases':['消えた銭袋','帰らぬ書吏','飢えた穀倉','消された境界','仕立てられた犯人','墨に残した名'],
  'castTitle':'旅の道で、互いを支える二人。',
  'castBody':'一人は事情を聞き、一人はその言葉を記します。',
  'yunseo':'ユンソ','yunseoRole':'身分を隠した暗行御史','yunseoDescription':'冷静な判断の奥に、温かな心を持つ御史。紙に書かれたことだけでなく、人の事情を最後まで聞こうとします。',
  'dogyeom':'トギョム','dogyeomRole':'ユンソに仕える随行の書吏','dogyeomDescription':'人への好奇心と素直な笑顔を持つ書吏。記録を整え、そばでユンソの考えを支えます。',
  'quote':'嘘をついたというだけで、<br>罪を決めてはいけません。',
  'judgment':'矛盾を見つけることと、責任を証明することは別です。誤った最終判決は任務を終わらせます。再審では調査と尋問の記録を残したまま、改めて判断できます。',
  'storeTitle':'次の旅を、準備しています。',
  'storeBody':'「暗行御史：墨に残した名」は開発中です。ストア公開の際は、こちらでご案内します。',
  'platforms':[('Steam','発売予定'),('モバイル','発売予定')],
  'storeNote':'発売日とストアリンクは未公開です。 · ゲーム内言語：韓国語',
  'contact':'スタジオへのお問い合わせ','soundOn':'音楽をオン','soundOff':'音楽をオフ','soundError':'音楽を読み込めませんでした。もう一度押してください。',
  'sceneAlt':['秋の光に包まれた茅葺きの宿の庭','窓から日が差す宿の小さな裏部屋','柳の下に舟が泊まる渡し場'],
  'locations':[
   {'name':'ウォルソンの宿','image':'village','ambient':'台所から温かいご飯の匂いがします。消えた銭袋を追う前に、朝からの出来事を調べてみましょう。','spots':[
    {'name':'朝の勘定メモ','image':'receipt','text':'ソリが水汲みに出たあと、ウォルソンは自分で十枚の銭を数えました。\n\n銭が消えたのは、この勘定よりあとです。'},
    {'name':'水汲みの記録','image':'gate','text':'勘定が終わる前から、ソリは井戸で水を汲んでいました。\n\n働き手が水桶を受け取った時刻を記しています。ほかの記録と比べれば、出来事の順序が分かります。'}]},
   {'name':'宿の裏部屋','image':'room','ambient':'窓の下で食卓ががたついています。静かな部屋にも、人の話と照らし合わせる痕跡が残っています。','spots':[
    {'name':'鍵の台帳','image':'debt','text':'裏部屋の鍵は、客用と主人用の二つです。\n\n客用はキムヨンが持ち、主人用は台所の釘に掛かっていました。誰が手に取れたのでしょうか。'},
    {'name':'かんぬきの痕跡','image':'footprints','text':'かんぬきは内側から掛かっていませんでした。外から鍵で開けられる戸です。\n\n施錠されていたというだけでは、出入りできた人が一人とは限りません。'}]},
   {'name':'渡し場の市','image':'river','ambient':'ソリの履物のそばで子犬が眠っています。宿の外での出来事にも耳を傾けてみましょう。','spots':[
    {'name':'魚代の掛けメモ','image':'first-slip','text':'子犬が触った魚の代金を、ソリは掛けにしていました。\n\nこれは魚代についてのメモです。宿の十枚の銭を渡した記録はありません。'},
    {'name':'井戸端の目撃メモ','image':'gate','text':'魚売りは、子犬を洗っていたソリが何も持っていなかったと話しました。\n\n目撃したのは一日の一部です。一人の話だけですべてが分かるのでしょうか。'}]}
  ]
 }
}

def route(lang):
    return ('/' if lang=='ko' else '/'+lang+'/')+'games/amhaeng-eosa/'

def esc(s): return html.escape(str(s), quote=True)

def build(lang, c):
    home='/' if lang=='ko' else '/'+lang+'/'
    url=ORIGIN+route(lang)
    locale={'ko':'ko_KR','en':'en_US','ja':'ja_JP'}[lang]
    alternates='\n'.join(f'<link rel="alternate" hreflang="{x}" href="{ORIGIN+route(x)}">' for x in COPY)
    switches=''.join(f'<a href="{route(x)}" lang="{x}"'+(' aria-current="page"' if x==lang else '')+f'>{label}</a>' for x,label in [('ko','KO'),('en','EN'),('ja','日本語')])
    places=''.join(f'<button type="button" data-location="{i}" aria-pressed="{str(i==0).lower()}" aria-controls="investigation-view">{esc(l["name"])}</button>' for i,l in enumerate(c['locations']))
    cases=''.join(f'<li><span>{i+1:02d}</span>{esc(title)}</li>' for i,title in enumerate(c['cases']))
    stores=''.join(f'<li><strong>{esc(name)}</strong><span>{esc(state)}</span></li>' for name,state in c['platforms'])
    data=json.dumps({k:c[k] for k in ['locations','sceneAlt','notebook','notebookHint','progress','soundOn','soundOff','soundError']},ensure_ascii=False).replace('<','\\u003c')
    schema=json.dumps({'@context':'https://schema.org','@type':'VideoGame','name':c['name'],'description':c['description'],'url':url,'image':ORIGIN+ASSET+'social.jpg','genre':['Adventure','Mystery'],'inLanguage':'ko','publisher':{'@type':'Organization','name':'OneStep Studio','url':ORIGIN+'/'}},ensure_ascii=False)
    result=f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>{esc(c['name'])} | OneStep Studio</title>
  <meta name="description" content="{esc(c['description'])}">
  <meta name="theme-color" content="#081c27">
  <meta name="color-scheme" content="dark light">
  <link rel="canonical" href="{url}">
  {alternates}
  <link rel="alternate" hreflang="x-default" href="{ORIGIN+route('ko')}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="{locale}">
  <meta property="og:site_name" content="OneStep Studio">
  <meta property="og:title" content="{esc(c['name'])}">
  <meta property="og:description" content="{esc(c['description'])}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{ORIGIN+ASSET}social.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="720">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(c['name'])}">
  <meta name="twitter:description" content="{esc(c['description'])}">
  <meta name="twitter:image" content="{ORIGIN+ASSET}social.jpg">
  <link rel="icon" href="/assets/onestep-favicon.png" type="image/png">
  <link rel="preload" as="image" href="{ASSET}lobby.webp" media="(min-width:701px)">
  <link rel="preload" as="image" href="{ASSET}lobby-mobile.webp" media="(max-width:700px)">
  <link rel="preload" as="font" href="{ASSET}EosaBatang.woff2" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/styles.css?v=eosa-1">
  <link rel="stylesheet" href="/games/amhaeng-eosa/eosa.css?v=1">
  <script defer src="/games/amhaeng-eosa/eosa.js?v=1"></script>
  <script type="application/ld+json">{schema}</script>
</head>
<body class="eosa-page">
  <a class="skip-link" href="#main">{c['skip']}</a>
  <header class="eosa-nav">
    <a class="wordmark" href="{home}" aria-label="OneStep Studio"><img class="wordmark-logo" src="/assets/onestep-logo.webp" width="32" height="32" alt=""><span>onestep</span></a>
    <nav aria-label="{c['home']}">
      <a href="{home}#games">{c['home']}</a><a class="nav-release" href="#release">{c['stores']}</a>
      <span class="eosa-languages" role="group" aria-label="{c['languages']}">{switches}</span>
    </nav>
  </header>
  <main id="main">
    <section class="eosa-hero" aria-labelledby="game-title">
      <picture class="eosa-hero-art"><source media="(max-width:700px)" srcset="{ASSET}lobby-mobile.webp"><img src="{ASSET}lobby.webp" width="1536" height="1024" alt="" fetchpriority="high"></picture>
      <div class="eosa-hero-copy">
        <h1 class="eosa-title" id="game-title"><img src="{ASSET}title.webp" width="1000" height="375" alt="{esc(c['name'])}"></h1>
        <p class="eosa-subtitle" aria-hidden="true">{c['subtitle']}</p>
        <p class="eosa-hero-lead">{c['lead']}</p>
        <p class="eosa-hero-description">{c['intro']}</p>
        <div class="eosa-actions"><a class="eosa-button" href="#investigation">{c['enter']} <span aria-hidden="true">↓</span></a><a class="eosa-text-link" href="#release">{c['stores']}</a></div>
      </div>
      <div class="eosa-hero-bottom"><span class="eosa-release-tag">{c['release']}</span><span>{c['genre']}</span></div>
    </section>
    <section class="eosa-intro" aria-labelledby="story-title"><h2 id="story-title">{c['introTitle']}</h2><p>{c['introBody']}</p></section>
    <section class="eosa-section eosa-experience" id="investigation" aria-labelledby="investigation-title">
      <div class="experience-heading"><h2 id="investigation-title">{c['experienceTitle']}</h2><p>{c['experienceBody']}</p></div>
      <div class="eosa-location-nav" role="group" aria-label="{c['locationLabel']}">{places}</div>
      <div class="eosa-scene-layout" id="investigation-view">
        <div class="eosa-scene">
          <img data-scene-image src="{ASSET}village.webp" width="627" height="627" alt="{c['sceneAlt'][0]}" loading="lazy">
          <span class="eosa-scene-caption" data-scene-name>{c['locations'][0]['name']}</span>
          <button class="eosa-hotspot" type="button" style="--x:31%;--y:69%" data-spot="0" aria-pressed="false" aria-controls="field-notes" hidden>{c['locations'][0]['spots'][0]['name']}</button>
          <button class="eosa-hotspot" type="button" style="--x:67%;--y:80%" data-spot="1" aria-pressed="false" aria-controls="field-notes" hidden>{c['locations'][0]['spots'][1]['name']}</button>
        </div>
        <div class="eosa-notebook" id="field-notes" role="region" aria-label="{c['notebook']}">
          <div class="eosa-note-status"><span>{c['notebook']}</span><span data-note-count>{c['progress']} 0 / 6</span></div>
          <div aria-live="polite" aria-atomic="true"><h3 data-note-title>{c['locations'][0]['name']}</h3><p class="eosa-note-body" data-note-body>{c['locations'][0]['ambient']}</p></div>
          <img class="eosa-evidence-art" data-note-image src="{ASSET}receipt.webp" alt="" width="180" height="140" hidden>
          <p class="eosa-note-footer"><span data-note-hint>{c['notebookHint']}</span> <button type="button" data-reset hidden>{c['reset']}</button></p>
        </div>
      </div>
      <p class="eosa-preview-note">{c['preview']}</p>
      <noscript><p>{c['experienceBody']} · JavaScript</p></noscript>
    </section>
    <section class="eosa-section eosa-path" aria-labelledby="journey-title">
      <figure class="eosa-map"><img src="{ASSET}journey.webp" width="1000" height="1000" alt="{c['mapAlt']}" loading="lazy"><figcaption>{c['mapCaption']}</figcaption></figure>
      <div class="eosa-path-copy"><h2 id="journey-title">{c['journeyTitle']}</h2><p>{c['journeyBody']}</p><ol class="eosa-case-list" aria-label="{c['name']}">{cases}</ol></div>
    </section>
    <section class="eosa-cast" aria-labelledby="cast-title">
      <div class="eosa-cast-heading"><h2 id="cast-title">{c['castTitle']}</h2><p>{c['castBody']}</p></div>
      <div class="eosa-cast-grid">
        <article class="eosa-character"><div class="eosa-character-copy"><h3>{c['yunseo']}</h3><p class="eosa-character-role">{c['yunseoRole']}</p><p class="eosa-character-description">{c['yunseoDescription']}</p></div><img src="{ASSET}yunseo.webp" width="640" height="680" alt="{c['yunseo']}" loading="lazy"></article>
        <article class="eosa-character"><div class="eosa-character-copy"><h3>{c['dogyeom']}</h3><p class="eosa-character-role">{c['dogyeomRole']}</p><p class="eosa-character-description">{c['dogyeomDescription']}</p></div><img src="{ASSET}dogyeom.webp" width="640" height="680" alt="{c['dogyeom']}" loading="lazy"></article>
      </div>
    </section>
    <section class="eosa-judgment" aria-label="{c['cases'][-1]}"><img src="{ASSET}court.webp" width="1440" height="960" alt="" loading="lazy"><blockquote>{c['quote']}</blockquote><p>{c['judgment']}</p></section>
    <section class="eosa-stores" id="release" aria-labelledby="release-title"><h2 id="release-title">{c['storeTitle']}</h2><p>{c['storeBody']}</p><ul class="eosa-store-list" aria-label="{c['stores']}">{stores}</ul><p class="eosa-store-note">{c['storeNote']}</p></section>
  </main>
  <footer class="eosa-footer"><a href="{home}#games">{c['home']}</a><p>© 2026 OneStep Studio</p><a href="mailto:contact@onestep-games.com">{c['contact']}</a></footer>
  <button class="eosa-sound" data-sound type="button" aria-pressed="false" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13M9 8l12-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="18" cy="16" rx="3" ry="2.5"/></svg><span>{c['soundOn']}</span></button>
  <p class="eosa-sound-message" role="status" data-sound-message></p>
  <audio data-music src="{ASSET}title.mp3" preload="none" loop></audio>
  <script type="application/json" id="eosa-content">{data}</script>
</body>
</html>
'''
    target=ROOT/route(lang).strip('/')/'index.html'
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(result,encoding='utf-8')
    print('Built',target.relative_to(ROOT))

def integrate_home(lang,c):
    target=ROOT/('index.html' if lang=='ko' else lang+'/index.html')
    source=target.read_text('utf-8')
    label={'ko':'게임 페이지 보기','en':'View game','ja':'ゲームページへ'}[lang]
    desc={
      'ko':'신분을 숨기고 사건을 조사해, 증거로 거짓을 가리고 직접 판결하는 조선 수사극.',
      'en':'Go undercover in Joseon, follow the evidence, uncover lies, and deliver your own verdict.',
      'ja':'身分を隠して事件を調べ、証拠で嘘を見抜き、自ら判決を下す朝鮮推理劇。'
    }[lang]
    alt={'ko':'밤의 주막에서 기록을 살피는 암행어사 윤서와 수행 서리 도겸','en':'Royal inspector Yunseo and clerk Dogyeom at an inn after dark','ja':'夜の宿で記録を調べる暗行御史ユンソと書吏トギョム'}[lang]
    card=f'''          <a class="game-card game-card-eosa reveal" href="{route(lang)}" aria-label="{esc(c['name'])}, {label}">
            <div class="game-card-media game-card-eosa-media">
              <img class="game-card-eosa-art" src="{ASSET}cover.webp" alt="{alt}" width="1200" height="720" loading="lazy">
              <img class="game-card-eosa-title" src="{ASSET}title.webp" alt="" width="1000" height="375" loading="lazy">
            </div>
            <div class="game-card-body">
              <div class="game-card-meta"><span>02</span><span class="game-status is-coming"><span aria-hidden="true"></span>{c['release']}</span></div>
              <h3>{esc(c['name'])}</h3>
              <p>{desc}</p>
              <span class="game-card-link">{label}<span aria-hidden="true">&rarr;</span></span>
            </div>
          </a>'''
    if 'game-card-eosa reveal' in source:
        source=re.sub(r'          <a class="game-card game-card-eosa reveal".*?</a>',lambda _:card,source,flags=re.S)
    else:
        marker=re.search(r'(<div class="game-grid">.*?</a>)',source,re.S)
        if not marker: raise ValueError(f'Missing game list in {target}')
        source=source[:marker.end()]+'\n'+card+source[marker.end():]
    def update_schema(match):
        data=json.loads(match.group(1))
        listing=next(x for x in data['@graph'] if x['@type']=='ItemList')
        listing['itemListElement']=[x for x in listing['itemListElement'] if 'amhaeng-eosa' not in x['url']]
        listing['itemListElement'].append({'@type':'ListItem','position':2,'url':ORIGIN+route(lang),'name':c['name']})
        listing['numberOfItems']=len(listing['itemListElement'])
        return '<script type="application/ld+json">\n'+json.dumps(data,ensure_ascii=False,indent=2)+'\n  </script>'
    source=re.sub(r'<script type="application/ld\+json">(.*?)</script>',update_schema,source,flags=re.S)
    summaries={
      'ko':('Tiny Defense의 세계를 차근차근 완성하며, 짧은 순간에도 분명한 선택과 오래 이어지는 도전을 담고 있습니다.','Tiny Defense의 작은 성에서 암행어사의 잠행길까지, 저마다의 선택과 이야기가 살아 있는 세계를 차근차근 만들고 있습니다.'),
      'en':('We are building the world of Tiny Defense one step at a time, with meaningful choices in every short session and challenges that keep unfolding.','From the small castle of Tiny Defense to the hidden roads of Amhaeng Eosa, we build worlds shaped by your choices and the stories they leave behind.'),
      'ja':('『Tiny Defense』の世界を一歩ずつ形にしながら、短い時間の中にも手応えのある選択と、長く続く挑戦を詰め込んでいます。','『Tiny Defense』の小さな城から『暗行御史』の潜行の道まで、それぞれの選択と物語が息づく世界を、一歩ずつ形にしています。')
    }
    source=source.replace(*summaries[lang]).replace('/styles.css?v=ui-2','/styles.css?v=eosa-1')
    target.write_text(source,'utf-8')

def integrate_sitemap():
    target=ROOT/'sitemap.xml'
    source=target.read_text('utf-8')
    source=re.sub(r'^[ \t]*<url>\s*<loc>[^<]*games/amhaeng-eosa/</loc>.*?</url>\n?','',source,flags=re.S|re.M)
    alternates='\n'.join(f'    <xhtml:link rel="alternate" hreflang="{lang}" href="{ORIGIN+route(lang)}" />' for lang in COPY)
    blocks=''.join(f'  <url>\n    <loc>{ORIGIN+route(lang)}</loc>\n    <lastmod>2026-10-17</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n{alternates}\n    <xhtml:link rel="alternate" hreflang="x-default" href="{ORIGIN+route("ko")}" />\n  </url>\n' for lang in COPY)
    target.write_text(source.replace('</urlset>',blocks+'</urlset>'),'utf-8')

if __name__=='__main__':
    for lang,c in COPY.items():
        build(lang,c)
        integrate_home(lang,c)
    integrate_sitemap()
