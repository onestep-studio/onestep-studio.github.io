"""Subset the studio's existing Pretendard font for the localized home pages."""
import hashlib
import json
from pathlib import Path
from fontTools import subset

ROOT=Path(__file__).resolve().parents[1]
FONT_ROOT=Path('C:/OneStep/amhaeng-eosa/Assets/Resources/Eosa/Fonts')
out=ROOT/'assets/studio'
out.mkdir(exist_ok=True)
text=(ROOT/'tools/build-home-pages.py').read_text('utf-8')+''.join(chr(i) for i in range(32,127))
manifest=[]
for source,name,weight in [('Pretendard-Regular.ttf','StudioSans-Regular.woff2',400),('Pretendard-SemiBold.ttf','StudioSans-Semibold.woff2',600)]:
    options=subset.Options()
    options.flavor='woff2'
    font=subset.load_font(str(FONT_ROOT/source),options)
    sub=subset.Subsetter(options=options)
    sub.populate(text=text)
    sub.subset(font)
    subset.save_font(font,str(out/name),options)
    manifest.append({'file':name,'family':'Pretendard','weight':weight,'source':'amhaeng-eosa/Assets/Resources/Eosa/Fonts/'+source,'sha256':hashlib.sha256((FONT_ROOT/source).read_bytes()).hexdigest(),'transform':'WOFF2 subset for the localized studio home pages'})
license_text=(ROOT/'assets/fonts/Pretendard-OFL.txt').read_text('utf-8')
(out/'Pretendard-OFL.txt').write_text('\n'.join(x.rstrip() for x in license_text.splitlines()).rstrip()+'\n','utf-8')
(out/'font-sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n','utf-8')
print('Built two studio font subsets with source records and OFL notice.')
