import os, re, fitz
out=[]
for fn in sorted(os.listdir('.')):
    if not fn.lower().endswith('.pdf'):
        continue
    try:
        doc = fitz.open(fn)
        txt = doc[0].get_text('text') if doc else ''
        lines = re.sub(r'\s+', ' ', txt[:500]).strip()
        out.append(f'{fn}\tpages={len(doc)}\t{lines[:200]}')
    except Exception as e:
        out.append(f'{fn}\tERROR\t{e}')
with open('pdf_scan.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
print('WROTE pdf_scan.txt')
