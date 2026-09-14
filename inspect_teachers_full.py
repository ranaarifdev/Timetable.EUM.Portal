import json

with open('timetable_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

entries = data['schedule_entries']
catalog = data.get('course_catalog', [])

print("=== ALL UNIQUE TEACHERS IN ENTRIES ===")
teachers = sorted(set(e.get('teacher') for e in entries if e.get('teacher')))
for t in teachers:
    count = sum(1 for e in entries if e.get('teacher') == t)
    print(f"  {repr(t)}: {count}")

print("\n=== ALL UNIQUE INSTRUCTORS IN CATALOG ===")
instructors = sorted(set(c.get('instructor') for c in catalog if c.get('instructor')))
for i in instructors:
    count = sum(1 for c in catalog if c.get('instructor') == i)
    print(f"  {repr(i)}: {count}")
