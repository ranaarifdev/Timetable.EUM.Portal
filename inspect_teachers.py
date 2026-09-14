import json

with open('timetable_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

entries = data['schedule_entries']
catalog = data.get('course_catalog', [])

def show_t(name):
    print(f"\n=== TEACHER: {name} ===")
    matches = [e for e in entries if e.get('teacher') == name]
    print(f"Found {len(matches)} entries:")
    for e in matches:
        print(f"  {e['section']} ({e['shift']}) | {e['day']} {e['time']} | {e['course_code']} - {e['subject']} | {e['room']}")
    
    cat_matches = [c for c in catalog if c.get('instructor') == name]
    print(f"Catalog entries ({len(cat_matches)}):")
    for c in cat_matches:
        print(f"  {c['section']} ({c['shift']}) | {c['code']} - {c['title']}")

show_t('Rabia')
show_t('Rabia Tariq')
show_t('Farzeen khan')
show_t('Muhammad Aqib')
show_t('Malik Muhammad Aqib')
show_t('Wajahat')
show_t('Sadia Parveen')
show_t('Sadia Ramzan')
show_t('Zia Ur Rehman Zia')
