"""Keep analytics on every generated source page and staged static page."""
from pathlib import Path
import re

TAG = '<script defer src="/analytics.js?v=1"></script>'


def add_analytics(source):
    if re.search(r'<script\b[^>]*\bsrc=[\"\']/analytics\.js(?:[?\"\'])', source):
        return source
    return source.replace('</head>', '  ' + TAG + '\n</head>', 1)


def install(root):
    pages = [root / 'index.html', root / '404.html']
    for directory in ['games', 'en', 'ja', 'story']:
        pages.extend((root / directory).rglob('*.html'))
    for page in pages:
        source = page.read_text('utf-8')
        updated = add_analytics(source)
        if updated != source:
            page.write_text(updated, 'utf-8')
    return len(pages)


if __name__ == '__main__':
    count = install(Path(__file__).resolve().parents[1])
    print(f'Analytics included on {count} source pages.')
