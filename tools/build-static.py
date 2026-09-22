"""Stage the existing static website for Sites without changing GitHub Pages routes."""
from pathlib import Path
import shutil

root=Path(__file__).resolve().parents[1]
out=root/'dist'
out.mkdir(exist_ok=True)
for name in ['index.html','404.html','styles.css','script.js','world.css','world.js','book-turn.js','robots.txt','sitemap.xml','app-ads.txt','notice.json','version.json','.nojekyll']:
    shutil.copy2(root/name,out/name)
for name in ['assets','games','en','ja','story']:
    shutil.copytree(root/name,out/name,dirs_exist_ok=True)
print('Static site staged in dist/ (existing routes preserved).')
