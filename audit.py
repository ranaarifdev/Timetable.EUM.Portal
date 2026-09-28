"""
Comprehensive Audit of Timetable Portal Data vs Official PDFs
Identifies all discrepancies in:
- Course codes
- Teacher names
- Rooms
- Sections
- MS timetable data
- 2-year BSIT data
- 1st semester data
- Missing sections (BSDS-6A, BSIT-5C/5D/5E, BSIT-8A)
"""
import json

with open('timetable_data.json','r',encoding='utf-8') as f:
    data = json.load(f)

entries = data['schedule_entries']
catalog = data['course_catalog']

print("=== SECTION AUDIT ===")
sections = sorted(set(f"{e['department']} | {e['section']} | {e['shift']}" for e in entries))
for s in sections:
    count = sum(1 for e in entries if f"{e['department']} | {e['section']} | {e['shift']}" == s)
    print(f"  {s}: {count} entries")

print(f"\nTotal unique sections: {len(sections)}")
print(f"Total entries: {len(entries)}")

print("\n=== KEY ISSUES IDENTIFIED FROM PDF ===")

# 1. BSAI-5A Morning: PDF shows ARIT-4155/4151 codes, but build_dataset uses ARIT-3152/3148
bsai5a_m = [e for e in entries if e['section']=='BSAI-5A' and e['shift']=='Morning Shift']
codes_5a = set(e['course_code'] for e in bsai5a_m if e.get('course_code') and e['course_code'] != 'BREAK')
print(f"\n1. BSAI-5A Morning course codes in dataset: {sorted(codes_5a)}")
print("   PDF Catalog shows: ARIT-4155 (Control Eng), ARIT-4151 (Fuzzy Systems)")
print("   Dataset likely has: ARIT-3152, ARIT-3148")

# 2. BSAI-5A Morning Linear Algebra instructor
la_5a = [e for e in bsai5a_m if 'Linear Algebra' in e.get('subject','')]
print(f"\n2. BSAI-5A Linear Algebra: {[(e['teacher'], e['room']) for e in la_5a[:3]]}")
print("   PDF shows: Ruqia Ghafoor, CTB2-15")

# 3. BSAI-5B Morning instructor check
bsai5b_m = [e for e in entries if e['section']=='BSAI-5B' and e['shift']=='Morning Shift']
la_5b = [e for e in bsai5b_m if 'Linear Algebra' in e.get('subject','')]
print(f"\n3. BSAI-5B Linear Algebra: {[(e['teacher'], e['room']) for e in la_5b[:3]]}")
print("   PDF shows: Muhammad Naeem, CTB3-16")

# 4. BSAI-3A Morning - Lab rooms
bsai3a_m = [e for e in entries if e['section']=='BSAI-3A' and e['shift']=='Morning Shift']
lab_3a = [e for e in bsai3a_m if e.get('type')=='lab']
print(f"\n4. BSAI-3A Morning labs: {[(e['course_code'],e['room']) for e in lab_3a]}")
print("   PDF PAGE 1 shows: ARIT-2131 lab in CLab-03 (not CLab-05)")
print("   PDF shows: COSC-2111 lab in CLab-05 (not CLab-05)")

# 5. BSCS-3A Morning - Data Structures code
bscs3a_m = [e for e in entries if e['section']=='BSCS-3A' and e['shift']=='Morning Shift']
ds = [e for e in bscs3a_m if 'Data' in e.get('subject','')]
print(f"\n5. BSCS-3A Data Structures: {[(e['course_code'],e['teacher'],e['room']) for e in ds[:3]]}")

# 6. BSCybSec courses codes (note: PDF uses "Data Structure" not "Data Structures")
cys3a_m = [e for e in entries if e['section']=='BSCybSec-3A' and e['shift']=='Morning Shift']
ds_cys = [e for e in cys3a_m if 'Data' in e.get('subject','')]
print(f"\n6. BSCybSec-3A Data: {[(e['course_code'],e['teacher'],e['room']) for e in ds_cys]}")

# 7. Check CYSE codes
cys5a = [e for e in entries if e['section']=='BSCybSec-5A' and e['shift']=='Morning Shift']
print(f"\n7. BSCybSec-5A codes: {sorted(set(e['course_code'] for e in cys5a if e.get('course_code') and e['course_code'] != 'BREAK'))}")
print("   PDF shows: CYSE-3143 (Hardware Security), CYSE-3141 (VA&RE), CYSE-3133 (Network Sec), CYSE-3132 (Info Assurance)")

# 8. BSIT-5A has extra sections in PDF
bsit_sections = sorted(set(f"{e['section']}" for e in entries if e['department']=='Information Technology'))
print(f"\n8. BSIT sections in dataset: {bsit_sections}")
print("   PDF shows sections: 3A,5A,5B,5C,5D,5E,7A morning + 3A,4A,5A,5B,7A,8A evening")

# 9. Check MS sections
ms_secs = [e for e in entries if 'MS' in e.get('section','') or 'MS' in e.get('semester','')]
ms_unique = sorted(set(e['section'] for e in ms_secs))
print(f"\n9. MS sections in dataset: {ms_unique}")

# 10. Check BSDS-6A 
bsds_secs = sorted(set(f"{e['section']}|{e['shift']}" for e in entries if e['department']=='Data Science'))
print(f"\n10. BSDS sections: {bsds_secs}")
print("    PDF shows: 3A,5A,5B morning + 3A,4A,5A,7A evening + BSDS-6A morning")

# 11. BSSE sections
bsse_secs = sorted(set(f"{e['section']}|{e['shift']}" for e in entries if e['department']=='Software Engineering'))
print(f"\n11. BSSE sections: {bsse_secs}")

# 12. Check teacher name corrections
teachers = sorted(set(e['teacher'] for e in entries if e.get('teacher') and e['teacher'] != 'TO BE ASSIGNED'))
xyz_teachers = [t for t in teachers if 'xyz' in t.lower() or t in ['xyz','XYZ']]
print(f"\n12. Teachers with xyz: {xyz_teachers}")

print("\n=== COURSE CODE AUDIT ===")
# Check BSAI 7th sem codes
bsai7a_m = [e for e in entries if e['section']=='BSAI-7A' and e['shift']=='Morning Shift']
codes_7a = sorted(set(e['course_code'] for e in bsai7a_m if e.get('course_code') and e['course_code'] != 'BREAK'))
print(f"BSAI-7A Morning: {codes_7a}")
print("PDF shows: COSC-4113, ARIT-4135, FLNG-41xx, ARIT-4154, ARIT-4136, ARAB-4101")

bsai7a_e = [e for e in entries if e['section']=='BSAI-7A' and e['shift']=='Evening Shift']
codes_7a_e = sorted(set(e['course_code'] for e in bsai7a_e if e.get('course_code') and e['course_code'] != 'BREAK'))
print(f"BSAI-7A Evening: {codes_7a_e}")
print("PDF shows: COSC-4113, ARIT-4135, FLNG-41xx, ARIT-4154, ARIT-4136, ARAB-4101")

# BSCS-7A
bscs7a_m = [e for e in entries if e['section']=='BSCS-7A' and e['shift']=='Morning Shift']
codes_7a_cs_m = sorted(set(e['course_code'] for e in bscs7a_m if e.get('course_code') and e['course_code'] != 'BREAK'))
print(f"\nBSCS-7A Morning: {codes_7a_cs_m}")
print("PDF shows: COSC-4113, COSE-4135, COSE-4150, COSE-3146 (Cyber Sec), FLNG-41xx, ARAB-4101")

# check for BSSE-3A evening having Operating Systems
bsse3a_e = [e for e in entries if e['section']=='BSSE-3A' and e['shift']=='Evening Shift']
codes_bsse3a_e = sorted(set(e['course_code'] for e in bsse3a_e if e.get('course_code') and e['course_code'] != 'BREAK'))
print(f"\nBSSE-3A Evening: {codes_bsse3a_e}")
print("PDF shows: STAT-2101, SOCI-2101, COSC-2111, COSC-2106, COSC-3112, COSC-2110, ARAB-2101")

print("\n=== BSIT 2YEAR AUDIT ===")
bsit2y = [e for e in entries if '2Y' in e.get('section','')]
bsit2y_unique = sorted(set(f"{e['section']} {e['semester']}" for e in bsit2y))
print(f"2-year BSIT: {bsit2y_unique}")
bsit2y_codes = sorted(set(e['course_code'] for e in bsit2y if e.get('course_code') and e['course_code'] != 'BREAK'))
print(f"Codes: {bsit2y_codes}")
print("PDF shows: UOHQ-1107(Fahm e Quran/Qudsia Khanam), INTE-3137(IT Infrastructure/Dr.Usman)")
print("  INTE-4132(Cyber Sec/Aleena Shafqat), INTE-3122(Formal Methods/Zahid Aziz)")
print("  INTE-3121(Distributed Computing/Muhammad Kamran Abid), INTE-3147(Mobile App/Muhammad Jasim Shah)")
print("  COSC-2116(Prof Practices/Engr Mirza Murad Baig)")
print("  ALL in CTB1-01")
