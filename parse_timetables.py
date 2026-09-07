import fitz, glob, json, re

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

def clean_str(s):
    if s is None:
        return ''
    s = str(s).replace('\ufffd', '—').replace('\u2013', '—').strip()
    return re.sub(r'\s+', ' ', s)

def extract_all():
    master_data = {
        "institution": "Faculty of Computing & Emerging Technologies, Emerson University Multan",
        "academic_session": "Fall 2026",
        "effective_date": "07 September 2026",
        "departments": {}
    }

    # Explicit Section Header Maps for PDFs where headers are merged into tables
    known_section_maps = {
        "AI Mor TT Tentative.pdf": {
            1: ("BSAI-3A", "3rd Semester", "Morning Shift"),
            2: ("BSAI-5A", "5th Semester", "Morning Shift"),
            3: ("BSAI-5B", "5th Semester", "Morning Shift"),
            4: ("BSAI-7A", "7th Semester", "Morning Shift"),
            5: ("BSAI-3A", "3rd Semester", "Evening Shift"),
            6: ("BSAI-4A", "4th Semester", "Evening Shift"),
            7: ("BSAI-5B", "5th Semester", "Evening Shift"),
            8: ("BSAI-7A", "7th Semester", "Evening Shift"),
            9: ("BSAI-Lab-Extra", "Continuation", "Evening Shift")
        },
        "CS TT Tentative.pdf": {
            1: ("BSCS-3A", "3rd Semester", "Morning Shift"),
            2: ("BSCS-5A", "5th Semester", "Morning Shift"),
            3: ("BSCS-5B", "5th Semester", "Morning Shift"),
            4: ("BSCS-5C", "5th Semester", "Morning Shift"),
            5: ("BSCS-7A", "7th Semester", "Morning Shift"),
            6: ("BSCS-3A", "3rd Semester", "Evening Shift"),
            7: ("BSCS-4A", "4th Semester", "Evening Shift"),
            8: ("BSCS-5B", "5th Semester", "Evening Shift"),
            9: ("BSCS-7A", "7th Semester", "Evening Shift"),
            10: ("BSCS-Lab-Extra", "Continuation", "Evening Shift")
        },
        "CyberSec TT Tentative.pdf": {
            1: ("BSCybSec-3A", "3rd Semester", "Morning Shift"),
            2: ("BSCybSec-5A", "5th Semester", "Morning Shift"),
            3: ("BSCybSec-5B", "5th Semester", "Morning Shift"),
            4: ("BSCybSec-7A", "7th Semester", "Morning Shift"),
            5: ("BSCybSec-3A", "3rd Semester", "Evening Shift"),
            6: ("BSCybSec-5A", "5th Semester", "Evening Shift"),
            7: ("BSCybSec-7A", "7th Semester", "Evening Shift"),
            8: ("BSCybSec-Lab-Extra", "Continuation", "Evening Shift")
        },
        "IT TT Tentative.pdf": {
            1: ("BSIT-3A", "3rd Semester", "Morning Shift"),
            2: ("BSIT-5A", "5th Semester", "Morning Shift"),
            3: ("BSIT-5B", "5th Semester", "Morning Shift"),
            4: ("BSIT-5D", "5th Semester", "Morning Shift"),
            5: ("BSIT-7A", "7th Semester", "Morning Shift"),
            6: ("BSIT-Morning-Extra", "Continuation", "Morning Shift"),
            7: ("BSIT-3A", "3rd Semester", "Evening Shift"),
            8: ("BSIT-5A", "5th Semester", "Evening Shift"),
            9: ("BSIT-5B", "5th Semester", "Evening Shift"),
            10: ("BSIT-7A", "7th Semester", "Evening Shift"),
            11: ("BSIT-8A", "8th Semester", "Evening Shift"),
            12: ("BSIT-Evening-Extra", "Continuation", "Evening Shift")
        },
        "SE TT Tentative.pdf": {
            1: ("BSSE-3A", "3rd Semester", "Morning Shift"),
            2: ("BSSE-5A", "5th Semester", "Morning Shift"),
            3: ("BSSE-5B", "5th Semester", "Morning Shift"),
            4: ("BSSE-7A", "7th Semester", "Morning Shift"),
            5: ("BSSE-3A", "3rd Semester", "Evening Shift"),
            6: ("BSSE-4A", "4th Semester", "Evening Shift"),
            7: ("BSSE-7A", "7th Semester", "Evening Shift"),
            8: ("BSSE-Lab-Extra", "Continuation", "Evening Shift")
        },
        "Tentative TT 1st SemAll.pdf": {
            1: ("BSCS(AI)-1A", "1st Semester", "Morning Shift"),
            2: ("BSCS(CS)-1A", "1st Semester", "Morning Shift"),
            3: ("BSCS(CS)-1A-Part2", "1st Semester", "Morning Shift"),
            4: ("BSCS(DS)-1A", "1st Semester", "Evening Shift"),
            5: ("BSCS(IT)-1A", "1st Semester", "Morning Shift"),
            6: ("BSCS(SE)-1A", "1st Semester", "Evening Shift"),
            7: ("BSIT(2Y)-1A", "1st Semester", "Morning Shift")
        }
    }

    for pdf_path in sorted(glob.glob("*.pdf")):
        doc = fitz.open(pdf_path)
        dept_key = pdf_path.replace(".pdf", "")
        page_map = known_section_maps.get(pdf_path, {})
        
        dept_sections = []
        
        for pno in range(len(doc)):
            page = doc[pno]
            page_num = pno + 1
            sec_info = page_map.get(page_num, (f"Section-P{page_num}", "Semester", "Shift"))
            
            section_entry = {
                "section": sec_info[0],
                "semester": sec_info[1],
                "shift": sec_info[2],
                "page": page_num,
                "schedule": [],
                "courses": []
            }
            
            tabs = page.find_tables()
            for tab in tabs:
                raw_rows = tab.extract()
                for r in raw_rows:
                    clean_r = [clean_str(c) for c in r]
                    if not any(clean_r):
                        continue
                    
                    # Schedule Slot row: starts with time format "08:30-09:20" etc.
                    if len(clean_r) >= 6 and re.match(r'^\d{2}:\d{2}-\d{2}:\d{2}$', clean_r[0]):
                        slot_time = clean_r[0]
                        slot_days = {}
                        for d_idx, day_name in enumerate(DAYS):
                            if d_idx + 1 < len(clean_r):
                                val = clean_r[d_idx + 1]
                                if val:
                                    slot_days[day_name] = val
                        
                        section_entry['schedule'].append({
                            "time_slot": slot_time,
                            "days": slot_days
                        })
                    
                    # Courses Legend row: [Code, Course, Instructor, Cr Hrs, Room(s), Location]
                    elif len(clean_r) >= 6 and clean_r[0] not in ['Code', 'COURSES', '', 'TIME / DAY', 'FACULTY OF COMPUTING & EMERGING TECHNOLOGIES — EMERSON UNIVERSITY MULTAN'] and not re.match(r'^\d{2}:\d{2}', clean_r[0]) and not clean_r[0].startswith('BS'):
                        code = clean_r[0]
                        title = clean_r[1] if len(clean_r) > 1 else ''
                        instructor = clean_r[2] if len(clean_r) > 2 else ''
                        cr_hrs = clean_r[3] if len(clean_r) > 3 else ''
                        rooms = clean_r[4] if len(clean_r) > 4 else ''
                        location = clean_r[5] if len(clean_r) > 5 else ''
                        
                        if code and title:
                            section_entry['courses'].append({
                                "code": code,
                                "title": title,
                                "instructor": instructor,
                                "credit_hours": cr_hrs,
                                "rooms": rooms,
                                "location": location
                            })
            
            dept_sections.append(section_entry)
            
        master_data['departments'][dept_key] = dept_sections

    with open('all_timetables_detailed.json', 'w', encoding='utf-8') as f:
        json.dump(master_data, f, ensure_ascii=False, indent=2)

    print("Master JSON generated perfectly.")

if __name__ == '__main__':
    extract_all()
