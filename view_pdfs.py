import json

with open('pdf_extracted.json','r',encoding='utf-8') as f:
    data = json.load(f)

# Show all PDFs page by page
for pdf_name, pages in data.items():
    for pg in pages:
        print(f'=== {pdf_name} PAGE {pg["page"]} ===')
        print(pg['text'][:4000])
        print()
