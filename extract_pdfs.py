import fitz, json, re

def clean(s):
    if not s: return ''
    return re.sub(r'\s+', ' ', str(s).replace('\ufffd','—').replace('\u2013','—').replace('\u2014','—')).strip()

pdfs = [
    'TT BSAI M+E updated.pdf',
    'TT BSCS M+E updated.pdf',
    'TT BSCyberSec M+E.pdf',
    'TT BSDS M+E updated.pdf',
    'TT BSIT M+E updated.pdf',
    'TT BSSE M+E updated.pdf',
    'TT  BS 1st Semester All classes.pdf',
    'MS or  m -phill  classes  TT.pdf',
    'updated BSIT 2yearTT.pdf'
]

all_data = {}
for pdf in pdfs:
    try:
        doc = fitz.open(pdf)
        pages = []
        for i, page in enumerate(doc):
            text = page.get_text('text')
            pages.append({'page': i+1, 'text': text})
        all_data[pdf] = pages
        print(f'OK: {pdf} ({len(doc)} pages)')
    except Exception as e:
        print(f'ERR: {pdf}: {e}')

with open('pdf_extracted.json','w',encoding='utf-8') as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)
print('Done - saved pdf_extracted.json')
