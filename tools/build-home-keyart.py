"""Publish the deployment manager's original Eosa key art without a crop.

The manager manifest selects the illustration. Keep its complete canvas and
encode losslessly; never use the manager's resized HTTP thumbnail as a source.
"""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
GAME=Path('C:/OneStep/amhaeng-eosa')
manifest=json.loads((GAME/'deploy-project.json').read_text('utf-8'))
source=(GAME/manifest['banner']).resolve()
if not source.is_relative_to(GAME.resolve()):
    raise ValueError('The manager banner must belong to the game project.')
image=Image.open(source).convert('RGBA')
if image.size!=(1536,1024):
    raise ValueError('The selected key art changed size; update the home image dimensions and aspect ratio together.')
out=ROOT/'assets/amhaeng-eosa/manager-keyart-original.webp'
image.save(out,lossless=True,exact=True,method=6)
with Image.open(out) as decoded:
    if decoded.convert('RGBA').tobytes()!=image.tobytes():
        raise ValueError('The web export must preserve every original pixel.')
record={
 'file':out.name,
 'project':'amhaeng-eosa',
 'source':str(source.relative_to(GAME)).replace('\\','/'),
 'sourceSelection':'deploy-project.json: banner',
 'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
 'outputSha256':hashlib.sha256(out.read_bytes()).hexdigest(),
 'width':image.width,'height':image.height,
 'processing':'Lossless WebP encoding only; no resize, crop, paint, overlay or colour change.',
 'decodedPixelsEqual':True
}
(out.parent/'manager-keyart-source.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n','utf-8')
print(f'Exported the complete {image.width}x{image.height} manager original; decoded pixels identical.')
