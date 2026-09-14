import json

with open('timetable_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

catalog = data.get('course_catalog', [])

print("=== CORRUPTED INSTRUCTOR FIELDS IN COURSE CATALOG ===")
corrupted = []
for idx, c in enumerate(catalog):
    inst = c.get('instructor', '')
    if '–' in inst or '-' in inst or 'CLab' in inst or 'CTB' in inst or len(inst) > 35:
        corrupted.append((idx, c))
        print(f"[{idx}] Section: {c.get('section')} | Code: {c.get('code')} | Title: {c.get('title')} | Instructor: {repr(inst)}")

print(f"\nTotal corrupted: {len(corrupted)} out of {len(catalog)}")
