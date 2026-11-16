import fitz
import glob
import json
import os


OUTPUT_PATH = 'pdf_extracted.json'
MS_SOURCE = 'MS or  m -phill  classes  TT.pdf'

previous_data = {}
if os.path.exists(OUTPUT_PATH):
    with open(OUTPUT_PATH, 'r', encoding='utf-8') as source_file:
        previous_data = json.load(source_file)

all_data = {}
for pdf_path in sorted(glob.glob('*.pdf')):
    doc = fitz.open(pdf_path)
    pages = [
        {'page': page_number + 1, 'text': page.get_text('text')}
        for page_number, page in enumerate(doc)
    ]
    all_data[pdf_path] = pages
    print(f'OK: {pdf_path} ({len(doc)} pages)')

# The revised PDF set does not include an MS timetable. Preserve the previous
# MS source text until an updated MS document is supplied.
if MS_SOURCE not in all_data and MS_SOURCE in previous_data:
    all_data[MS_SOURCE] = previous_data[MS_SOURCE]

with open(OUTPUT_PATH, 'w', encoding='utf-8', newline='\n') as output_file:
    json.dump(all_data, output_file, ensure_ascii=False, indent=2)

print(f'Done - saved {OUTPUT_PATH}')
