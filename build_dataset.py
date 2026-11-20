import fitz
import glob
import json
import re

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

def get_room_location(room):
    if not room or room in ('TBA', 'Online', 'None', ''):
        return 'Online' if room == 'Online' else 'University Main Campus'
    r = room.upper()
    if 'CLAB' in r:
        return 'Lab Block'
    if 'CTB1' in r:
        return 'Old Building — Upper Floor'
    if 'CTB2' in r:
        return 'Old Building — Ground Floor'
    if 'CTB3' in r:
        return 'Botany Block — Upper Floor'
    return 'University Main Campus'

def clean_text(s):
    if not s:
        return ''
    s = str(s)
    s = s.replace('\ufffd', '—').replace('\u2013', '—').replace('\u2014', '—')
    s = re.sub(r'[\t\r\f\v]+', ' ', s)
    s = re.sub(r' +', ' ', s)
    return s.strip()

def fix_common_typos(s):
    if not s:
        return ''
    replacements = [
        ('Sofwt are', 'Software'),
        ('Practci es', 'Practices'),
        ('Operatni g', 'Operating'),
        ('Translatoi n', 'Translation'),
        ('Informatoi n', 'Information'),
        ('Computni g', 'Computing'),
        ('Consttiution', 'Constitution'),
        ('Sofwtare', 'Software'),
        ('Practcies', 'Practices'),
        ('Operatnig', 'Operating'),
        ('Translatoin', 'Translation'),
        ('Informatoin', 'Information'),
        ('Computnig', 'Computing'),
        ('Artifci ial', 'Artificial'),
        ('Artifcial', 'Artificial'),
    ]
    for old, new in replacements:
        s = s.replace(old, new)
    return s

def normalize_teacher_name(name):
    if not name:
        return 'TO BE ASSIGNED'
    cleaned = clean_text(name).strip()
    if not cleaned or cleaned.upper() in ('XYZ', 'TBA', 'NONE', 'TO BE ASSIGNED', 'BREAK'):
        return 'TO BE ASSIGNED'
    
    # Specific normalization rules based on official PDF sources:
    norm_map = {
        'AREEJ KHAN': 'Areej Khan',
        'FARZEEN KHAN': 'Farzeen Khan',
        'AYESHA BIBI': 'Ayesha Bibi',
        'AZIZ UR RAHMAN': 'Aziz Ur Rahman',
        'DR.USMAN': 'Dr. Usman',
        'DR. USMAN': 'Dr. Usman',
        'MR.AMIN': 'Mr. Amin',
        'MR. AMIN': 'Mr. Amin',
        'MR.IBRAHIM': 'M. Ibrahim',
        'M.IBRAHIM': 'M. Ibrahim',
        'M. IBRAHIM': 'M. Ibrahim',
        'MS KOMAL SHABBIR': 'Komal Shabbir',
        'MS.KOMAL SHABBIR': 'Komal Shabbir',
        'KOMAL SHABBIR': 'Komal Shabbir',
        'MS QUDSIA KHANAM': 'Qudsia Khanam',
        'MS.QUDSIA KHANAM': 'Qudsia Khanam',
        'QUDDSIA KHANUM': 'Qudsia Khanam',
        'QUDSIA KHANAM': 'Qudsia Khanam',
        'HAFZI MUDASSAR USMAN': 'Hafiz Mudassar Usman',
        'HAFIZ MUDASSAR USMAN': 'Hafiz Mudassar Usman',
        'HAFZI OMER FAROOQ': 'Hafiz Omer Farooq',
        'HAFIZ OMER FAROOQ': 'Hafiz Omer Farooq',
        'HAFZIA IQRA FIRDOUS': 'Hafiza Iqra Firdous',
        'HAFIZA IQRA FIRDOUS': 'Hafiza Iqra Firdous',
        'ZIA UR REHMAN ZIA': 'Zia Ur Rehman Zia',
        'RABIA': 'Rabia',
        'WAJAHAT': 'Wajahat',
        'SAROSH': 'Sarosh'
    }
    key = cleaned.upper().replace('  ', ' ')
    if key in norm_map:
        return norm_map[key]
    return cleaned

BANNER_MAP = {
    '1st_Semester_TT_With_Lab of all programs M+E.pdf': [
        (0, 0.0, 'BSCS(AI)-1A', '1st Semester', 'Morning Shift', 'Artificial Intelligence'),
        (1, 0.0, 'BSCS(CS)-1A', '1st Semester', 'Morning Shift', 'Computer Science'),
        (2, 0.0, 'BSCS(IT)-1A', '1st Semester', 'Morning Shift', 'Information Technology'),
        (3, 0.0, 'BSCS(CyS)-1A', '1st Semester', 'Evening Shift', 'Cybersecurity'),
        (4, 0.0, 'BSCS(DS)-1A', '1st Semester', 'Evening Shift', 'Data Science'),
        (5, 0.0, 'BSCS(SE)-1A', '1st Semester', 'Evening Shift', 'Software Engineering'),
    ],
    'BSAI_TT_With_Lab_1 M+E.pdf': [
        (0, 0.0, 'BSAI-3A', '3rd Semester', 'Morning Shift', 'Artificial Intelligence'),
        (1, 0.0, 'BSAI-5A', '5th Semester', 'Morning Shift', 'Artificial Intelligence'),
        (2, 0.0, 'BSAI-5B', '5th Semester', 'Morning Shift', 'Artificial Intelligence'),
        (3, 0.0, 'BSAI-7A', '7th Semester', 'Morning Shift', 'Artificial Intelligence'),
        (4, 0.0, 'BSAI-3A', '3rd Semester', 'Evening Shift', 'Artificial Intelligence'),
        (5, 0.0, 'BSAI-4A', '4th Semester', 'Evening Shift', 'Artificial Intelligence'),
        (6, 0.0, 'BSAI-5A', '5th Semester', 'Evening Shift', 'Artificial Intelligence'),
        (7, 0.0, 'BSAI-5B', '5th Semester', 'Evening Shift', 'Artificial Intelligence'),
        (8, 0.0, 'BSAI-7A', '7th Semester', 'Evening Shift', 'Artificial Intelligence'),
    ],
    'BSCS_TT_With_Lab M+E.pdf': [
        (0, 0.0, 'BSCS-3A', '3rd Semester', 'Morning Shift', 'Computer Science'),
        (1, 0.0, 'BSCS-5A', '5th Semester', 'Morning Shift', 'Computer Science'),
        (2, 0.0, 'BSCS-5B', '5th Semester', 'Morning Shift', 'Computer Science'),
        (3, 0.0, 'BSCS-5C', '5th Semester', 'Morning Shift', 'Computer Science'),
        (4, 0.0, 'BSCS-7A', '7th Semester', 'Morning Shift', 'Computer Science'),
        (5, 0.0, 'BSCS-3A', '3rd Semester', 'Evening Shift', 'Computer Science'),
        (6, 0.0, 'BSCS-4A', '4th Semester', 'Evening Shift', 'Computer Science'),
        (7, 0.0, 'BSCS-5A', '5th Semester', 'Evening Shift', 'Computer Science'),
        (8, 0.0, 'BSCS-5B', '5th Semester', 'Evening Shift', 'Computer Science'),
        (9, 0.0, 'BSCS-7A', '7th Semester', 'Evening Shift', 'Computer Science'),
    ],
    'BS Cyber M+E.pdf': [
        (0, 110.0, 'BSCybSec-3A', '3rd Semester', 'Morning Shift', 'Cybersecurity'),
        (0, 500.0, 'BSCybSec-5A', '5th Semester', 'Morning Shift', 'Cybersecurity'),
        (1, 0.0,   'BSCybSec-5A', '5th Semester', 'Morning Shift', 'Cybersecurity'),
        (1, 350.0, 'BSCybSec-5B', '5th Semester', 'Morning Shift', 'Cybersecurity'),
        (2, 0.0,   'BSCybSec-5B', '5th Semester', 'Morning Shift', 'Cybersecurity'),
        (2, 240.0, 'BSCybSec-7A', '7th Semester', 'Morning Shift', 'Cybersecurity'),
        (4, 50.0,  'BSCybSec-3A', '3rd Semester', 'Evening Shift', 'Cybersecurity'),
        (4, 400.0, 'BSCybSec-4A', '4th Semester', 'Evening Shift', 'Cybersecurity'),
        (5, 0.0,   'BSCybSec-4A', '4th Semester', 'Evening Shift', 'Cybersecurity'),
        (5, 280.0, 'BSCybSec-5A', '5th Semester', 'Evening Shift', 'Cybersecurity'),
        (6, 0.0,   'BSCybSec-5A', '5th Semester', 'Evening Shift', 'Cybersecurity'),
        (6, 80.0,  'BSCybSec-7A', '7th Semester', 'Evening Shift', 'Cybersecurity'),
    ],
    'BSDS_TT_with_Lab M+E.pdf': [
        (0, 90.0,  'BSDS-3A', '3rd Semester', 'Morning Shift', 'Data Science'),
        (0, 410.0, 'BSDS-5A', '5th Semester', 'Morning Shift', 'Data Science'),
        (0, 740.0, 'BSDS-5B', '5th Semester', 'Morning Shift', 'Data Science'),
        (1, 0.0,   'BSDS-5B', '5th Semester', 'Morning Shift', 'Data Science'),
        (1, 300.0, 'BSDS-6A', '6th Semester', 'Morning Shift', 'Data Science'),
        (1, 630.0, 'BSDS-7A', '7th Semester', 'Morning Shift', 'Data Science'),
        (2, 0.0,   'BSDS-7A', '7th Semester', 'Morning Shift', 'Data Science'),
        (3, 50.0,  'BSDS-3A', '3rd Semester', 'Evening Shift', 'Data Science'),
        (3, 340.0, 'BSDS-4A', '4th Semester', 'Evening Shift', 'Data Science'),
        (3, 640.0, 'BSDS-5A', '5th Semester', 'Evening Shift', 'Data Science'),
        (4, 0.0,   'BSDS-5A', '5th Semester', 'Evening Shift', 'Data Science'),
        (4, 190.0, 'BSDS-7A', '7th Semester', 'Evening Shift', 'Data Science'),
    ],
    'BSIT2Y_TT_With_Lab  M+E.pdf': [
        (0, 0.0, 'BSIT(2Y)-3A', '3rd Semester', 'Morning Shift', 'Information Technology'),
    ],
    'BSIT_TT_With_Lab_1M+E.pdf': [
        (0, 0.0, 'BSIT-3A', '3rd Semester', 'Morning Shift', 'Information Technology'),
        (1, 0.0, 'BSIT-5A', '5th Semester', 'Morning Shift', 'Information Technology'),
        (2, 0.0, 'BSIT-5B', '5th Semester', 'Morning Shift', 'Information Technology'),
        (3, 0.0, 'BSIT-5C', '5th Semester', 'Morning Shift', 'Information Technology'),
        (4, 0.0, 'BSIT-5D', '5th Semester', 'Morning Shift', 'Information Technology'),
        (5, 0.0, 'BSIT-5E', '5th Semester', 'Morning Shift', 'Information Technology'),
        (6, 0.0, 'BSIT-7A', '7th Semester', 'Morning Shift', 'Information Technology'),
        (7, 0.0, 'BSIT-3A', '3rd Semester', 'Evening Shift', 'Information Technology'),
        (8, 0.0, 'BSIT-4A', '4th Semester', 'Evening Shift', 'Information Technology'),
        (9, 0.0, 'BSIT-5A', '5th Semester', 'Evening Shift', 'Information Technology'),
        (10, 0.0, 'BSIT-5B', '5th Semester', 'Evening Shift', 'Information Technology'),
        (11, 0.0, 'BSIT-7A', '7th Semester', 'Evening Shift', 'Information Technology'),
        (12, 0.0, 'BSIT-8A', '8th Semester', 'Evening Shift', 'Information Technology'),
    ],
    'BSSE_TT_With_Lab M+E.pdf': [
        (0, 0.0, 'BSSE-3A', '3rd Semester', 'Morning Shift', 'Software Engineering'),
        (1, 0.0, 'BSSE-5A', '5th Semester', 'Morning Shift', 'Software Engineering'),
        (2, 0.0, 'BSSE-5B', '5th Semester', 'Morning Shift', 'Software Engineering'),
        (3, 0.0, 'BSSE-7A', '7th Semester', 'Morning Shift', 'Software Engineering'),
        (4, 0.0, 'BSSE-3A', '3rd Semester', 'Evening Shift', 'Software Engineering'),
        (5, 0.0, 'BSSE-4A', '4th Semester', 'Evening Shift', 'Software Engineering'),
        (6, 0.0, 'BSSE-5A', '5th Semester', 'Evening Shift', 'Software Engineering'),
        (7, 0.0, 'BSSE-7A', '7th Semester', 'Evening Shift', 'Software Engineering'),
    ]
}

def add_ms_timetables(entries, catalog):
    """Import the five MS grids in the official MS timetable PDF."""
    classes = [
        ('Cybersecurity', 'MSCybSec-1A', '1st Semester (MS)', [('Information Privacy and Security','Waqas Shah','3','Tuesday','CLab-05',3), ('Research Methodology','Dr. Sohail Raza','3','Wednesday','CTB2-09',3), ('Wireless Network Security','Dr. Hira Nazir','3','Thursday','CLab-02',3), ('Fehm-e-Quran I','Aziz Ur Rahman','1','Tuesday','CTB2-09',1)]),
        ('Information Technology', 'MSIT-1A', '1st Semester (MS)', [('Advanced Database Management System','Dr. Wasif Akbar','3','Tuesday','CTB2-09',3), ('Research Methodology','Dr. Sohail Raza','3','Wednesday','CTB2-09',3), ('Object Oriented Analysis and Design','Muhammad Manshah','3','Thursday','CTB2-09',3), ('Fehm-e-Quran I','Aziz Ur Rahman','1','Tuesday','CTB2-09',1)]),
        ('Computer Science', 'MSCS-3A', '3rd Semester (MS)', [('Advanced Computer Architecture','Engr Mirza Murad Baig','3','Thursday','CLab-01',3), ('Deep Learning','Dr. Ghulam Jillani Ansari','3','Friday','CLab-01',3), ('Fahm e Quran','Aziz Ur Rahman','1','Thursday','CTB1-03',1)]),
        ('Cybersecurity', 'MSCybSec-3A', '3rd Semester (MS)', [('Digital Forensics','Waqas Shah','3','Thursday','CLab-03',3), ('IT Security Policy & Management','Dr. Hira Nazir','3','Friday','CLab-03',3), ('Fahm e Quran','Aziz Ur Rahman','1','Thursday','CTB1-03',1)]),
        ('Information Technology', 'MSIT-3A', '3rd Semester (MS)', [('Information System Modeling, Analysis, and Design','Dr. Wasif Akbar','3','Thursday','CLab-04 | CTB1-07',3), ('Advanced Topics in Computing','Dr. Shahbaz Wasti','3','Friday','CTB2-09',3), ('Fahm e Quran','Aziz Ur Rahman','1','Thursday','CTB1-03',1)]),
    ]
    for dept, section, semester, courses in classes:
        item = {'file': 'MS or  m -phill  classes  TT.pdf', 'page': 1 if semester.startswith('1st') else (2 if section != 'MSIT-3A' else 3),
                'department': dept, 'section': section, 'semester': semester, 'shift': 'Evening Shift', 'courses': []}
        for num, (title, teacher, credits, day, room, periods) in enumerate(courses, 1):
            key = f'__{section}_{num}'
            item['courses'].append((key, title, teacher, credits, room, day, '14:00', periods))
            if 'CLab' in room and 'CTB' in room:
                cat_loc = 'Old Building — Upper Floor | Lab Block'
            elif 'CLab' in room:
                cat_loc = 'Lab Block'
            elif 'CTB2' in room:
                cat_loc = 'Old Building — Ground Floor'
            elif 'CTB1' in room:
                cat_loc = 'Old Building — Upper Floor'
            elif 'CTB3' in room:
                cat_loc = 'Botany Block — Upper Floor'
            else:
                cat_loc = 'University Main Campus'
            catalog.append({'file': item['file'], 'page': item['page'], 'department': dept, 'section': section,
                            'semester': semester, 'shift': item['shift'], 'code': '', 'title': title,
                            'instructor': teacher, 'cr_hrs': credits, 'rooms': room,
                            'location': cat_loc})
            start = '17:00' if semester.startswith('1st') and periods == 1 else (
                '14:00' if semester.startswith('1st') else ('14:00' if periods == 1 else '15:00')
            )
            for offset in range(periods):
                minutes = int(start[:2]) * 60 + int(start[3:]) + offset * 60
                slot_start = f'{minutes // 60:02d}:{minutes % 60:02d}'
                end_minutes = minutes + 50
                slot_end = f'{end_minutes // 60:02d}:{end_minutes % 60:02d}'
                entry_room = room
                if section == 'MSIT-3A' and title.startswith('Information System'):
                    entry_room = 'CLab-04' if slot_start == '15:00' else 'CTB1-07'
                entries.append({
                    'id': len(entries) + 1,
                    'department': dept,
                    'section': section,
                    'semester': semester,
                    'shift': 'Evening Shift',
                    'day': day,
                    'time': f'{slot_start}-{slot_end}',
                    'start_time': slot_start,
                    'end_time': slot_end,
                    'course_code': '',
                    'subject': title,
                    'teacher': teacher,
                    'room': entry_room,
                    'location': get_room_location(entry_room),
                    'credit_hours': credits,
                    'type': 'theory',
                    'file': item['file'],
                    'page': item['page']
                })

def extract_all_timetables():
    all_course_catalog = []
    all_schedule_entries = []
    section_courses_map = {}

    print('Starting timetable extraction from official Fall 2026 Lab-Integrated PDFs...')

    for pdf_name, banners in BANNER_MAP.items():
        doc = fitz.open(pdf_name)
        sorted_banners = sorted(banners, key=lambda b: (b[0], b[1]))

        def find_banner(pno, y):
            active = sorted_banners[0]
            for b in sorted_banners:
                if (b[0] < pno) or (b[0] == pno and b[1] <= y + 15):
                    active = b
                else:
                    break
            return active

        print(f'Processing {pdf_name} ({len(doc)} pages)...')

        # 1. First pass: extract course catalog from COURSES tables
        for pno in range(len(doc)):
            page = doc[pno]
            tabs = list(page.find_tables())
            for t in tabs:
                rows = t.extract()
                for r_idx, r in enumerate(rows):
                    if not r or not r[0]:
                        continue
                    first_cell = clean_text(r[0])
                    row_y = t.rows[r_idx].bbox[1]
                    banner = find_banner(pno, row_y)
                    p_pno, p_y, sec, sem, shift, dept = banner

                    if len(r) >= 5 and re.match(r'^[A-Z]{2,6}[\s\-]*\d{3,4}', first_cell):
                        code = clean_text(r[0])
                        title = fix_common_typos(clean_text(r[1]))
                        teacher = normalize_teacher_name(r[2]) if len(r) > 2 else 'TO BE ASSIGNED'
                        credits = clean_text(r[3]) if len(r) > 3 else ''
                        rooms = clean_text(r[4]) if len(r) > 4 else ''
                        if 'CTB2-9' in rooms:
                            rooms = re.sub(r'\bCTB2-9\b', 'CTB2-09', rooms)
                        if 'CTB!-03' in rooms or 'CTB!-3' in rooms:
                            rooms = rooms.replace('CTB!-03', 'CTB1-03').replace('CTB!-3', 'CTB1-03')
                        rooms = re.sub(r'\bCLAB-(\d{2})\b', r'CLab-\1', rooms)
                        loc = clean_text(r[5]) if len(r) > 5 else get_room_location(rooms)

                        course_item = {
                            'file': pdf_name, 'page': pno + 1, 'department': dept,
                            'section': sec, 'semester': sem, 'shift': shift,
                            'code': code, 'title': title, 'instructor': teacher,
                            'cr_hrs': credits, 'rooms': rooms, 'location': loc
                        }
                        sec_key = f"{dept}||{sec}||{shift}"
                        if sec_key not in section_courses_map:
                            section_courses_map[sec_key] = {}
                        norm_code = re.sub(r'[\s\-]+', '', code).upper()
                        section_courses_map[sec_key][norm_code] = course_item
                        all_course_catalog.append(course_item)

        # 2. Second pass: extract schedule slot entries from TIME / DAY tables
        for pno in range(len(doc)):
            page = doc[pno]
            tabs = list(page.find_tables())
            for t in tabs:
                rows = t.extract()
                for r_idx, r in enumerate(rows):
                    if not r or not r[0]:
                        continue
                    first_cell = clean_text(r[0])
                    m_time = re.match(r'^(\d{1,2}:\d{2})\s*[-—–]\s*(\d{1,2}:\d{2})$', first_cell)
                    if not m_time:
                        continue

                    s_h, s_m = m_time.group(1).split(':')
                    e_h, e_m = m_time.group(2).split(':')
                    start_t = f'{int(s_h):02d}:{s_m}'
                    end_t = f'{int(e_h):02d}:{e_m}'
                    time_str = f'{start_t}-{end_t}'

                    row_y = t.rows[r_idx].bbox[1]
                    banner = find_banner(pno, row_y)
                    p_pno, p_y, sec, sem, shift, dept = banner
                    sec_key = f"{dept}||{sec}||{shift}"
                    cat_lookup = section_courses_map.get(sec_key, {})

                    for d_idx, day_name in enumerate(DAYS):
                        if d_idx + 1 >= len(r) or not r[d_idx + 1]:
                            continue
                        cell_val = str(r[d_idx + 1]).strip()
                        if not cell_val:
                            continue

                        # Jummah Break
                        if 'JUMMAH' in cell_val.upper() and 'BREAK' in cell_val.upper():
                            all_schedule_entries.append({
                                'id': len(all_schedule_entries) + 1,
                                'department': dept,
                                'section': sec,
                                'semester': sem,
                                'shift': shift,
                                'day': day_name,
                                'time': time_str,
                                'start_time': start_t,
                                'end_time': end_t,
                                'course_code': 'BREAK',
                                'subject': 'Jummah Break',
                                'teacher': '',
                                'room': '',
                                'location': '',
                                'credit_hours': '',
                                'type': 'jummah',
                                'file': pdf_name,
                                'page': pno + 1
                            })
                            continue

                        lines = [clean_text(l) for l in cell_val.split('\n') if clean_text(l)]
                        if not lines:
                            continue

                        # Room is always the last line
                        room_val = lines[-1]
                        if room_val.upper().startswith('CLAB-'):
                            room_val = 'CLab-' + room_val[5:]
                        elif room_val == 'CTB2-9':
                            room_val = 'CTB2-09'
                        elif room_val == 'CTB1-7':
                            room_val = 'CTB1-07'
                        elif room_val == 'CTB1-10':
                            room_val = 'CTB2-10'
                        elif room_val in ('CTB!-03', 'CTB!-3'):
                            room_val = 'CTB1-03'

                        # Handle 2-line cells (Code-Subject + Room, teacher unassigned)
                        if len(lines) == 2:
                            teacher_val = 'TO BE ASSIGNED'
                            subj_lines = [lines[0]]
                        elif len(lines) >= 3:
                            teacher_val = normalize_teacher_name(lines[-2])
                            subj_lines = lines[:-2]
                        else:
                            teacher_val = 'TO BE ASSIGNED'
                            subj_lines = lines

                        full_subj = ' '.join(subj_lines)
                        full_subj = fix_common_typos(full_subj)

                        code_val = ''
                        subj_name = full_subj
                        if '—' in full_subj:
                            sp = full_subj.split('—', 1)
                            code_val = sp[0].strip()
                            subj_name = sp[1].strip()
                        elif '-' in full_subj and re.match(r'^[A-Z]{2,6}[\s\-]*\d{3,4}', full_subj):
                            m_c = re.match(r'^([A-Z]{2,6}[\s\-]*\d{3,4})\s*[-—–]\s*(.*)$', full_subj)
                            if m_c:
                                code_val = m_c.group(1).strip()
                                subj_name = m_c.group(2).strip()

                        # Catalog lookup for metadata
                        norm_c = re.sub(r'[\s\-]+', '', code_val).upper()
                        matched_c = cat_lookup.get(norm_c)
                        if not matched_c and code_val:
                            for c_item in all_course_catalog:
                                if re.sub(r'[\s\-]+', '', c_item['code']).upper() == norm_c:
                                    matched_c = c_item
                                    break
                        if not matched_c and subj_name:
                            # Try matching by title within section catalog
                            norm_t = re.sub(r'[\s\-]+', '', subj_name).upper()
                            for c_item in cat_lookup.values():
                                if re.sub(r'[\s\-]+', '', c_item['title']).upper() == norm_t:
                                    matched_c = c_item
                                    break

                        cr_hrs_val = ''
                        if matched_c:
                            if not subj_name or len(subj_name) < 3:
                                subj_name = matched_c['title']
                            if teacher_val == 'TO BE ASSIGNED' and matched_c['instructor'] and matched_c['instructor'] != 'TO BE ASSIGNED':
                                teacher_val = matched_c['instructor']
                            cr_hrs_val = matched_c.get('cr_hrs', '')

                        # Entry classification
                        # Strictly do not classify as lab based only on room name!
                        # Only classify as lab if explicitly marked as Lab / Practical in the timetable.
                        is_lab = bool(
                            re.search(r'\((?:LAB|PRACTICAL)\)', subj_name, re.IGNORECASE) or
                            re.search(r'\((?:LAB|PRACTICAL)\)', code_val, re.IGNORECASE) or
                            re.search(r'\b(?:LAB|LABORATORY|PRACTICAL)\b', subj_name, re.IGNORECASE) or
                            re.search(r'\b(?:LAB|LABORATORY|PRACTICAL)\b', full_subj, re.IGNORECASE) or
                            any(re.search(r'\((?:LAB|PRACTICAL)\)|\b(?:LAB|LABORATORY|PRACTICAL)\b', l, re.IGNORECASE) for l in subj_lines)
                        )
                        is_online = (room_val.upper() == 'ONLINE' or 'ONLINE' in subj_name.upper())
                        is_tba = (teacher_val == 'TO BE ASSIGNED')

                        if is_online:
                            entry_type = 'online'
                        elif is_lab:
                            entry_type = 'lab'
                        elif is_tba:
                            entry_type = 'unassigned'
                        else:
                            entry_type = 'theory'

                        loc_val = get_room_location(room_val)

                        all_schedule_entries.append({
                            'id': len(all_schedule_entries) + 1,
                            'department': dept,
                            'section': sec,
                            'semester': sem,
                            'shift': shift,
                            'day': day_name,
                            'time': time_str,
                            'start_time': start_t,
                            'end_time': end_t,
                            'course_code': code_val,
                            'subject': subj_name,
                            'teacher': teacher_val,
                            'room': room_val,
                            'location': loc_val,
                            'credit_hours': cr_hrs_val,
                            'type': entry_type,
                            'file': pdf_name,
                            'page': pno + 1
                        })

    # Add MS timetables (official 5 MS grids)
    add_ms_timetables(all_schedule_entries, all_course_catalog)

    print(f'\nTotal extracted schedule entries: {len(all_schedule_entries)}')
    print(f'Total course catalog items: {len(all_course_catalog)}')

    unique_classes_set = sorted(list({f"{e['department']} | {e['section']} | {e['shift']}" for e in all_schedule_entries}))
    print(f'Total Unique Classes (Dept | Section | Shift): {len(unique_classes_set)}')

    # Clean teachers list
    clean_teachers = sorted(list({e['teacher'] for e in all_schedule_entries if e['teacher'] and e['teacher'] not in ('TO BE ASSIGNED', 'None')}))
    print(f'Total unique instructors: {len(clean_teachers)}')

    output_bundle = {
        'metadata': {
            'institution': 'Faculty of Computing & Emerging Technologies, Emerson University Multan',
            'session': 'Fall 2026',
            'effective_date': '07 September 2026',
            'status': 'Official Timetable (With Labs)',
            'total_entries': len(all_schedule_entries),
            'total_courses': len(all_course_catalog),
            'total_unique_classes': len(unique_classes_set),
            'generated_at': '2026-11-20'
        },
        'departments': [
            'Cybersecurity',
            'Information Technology',
            'Data Science',
            'Software Engineering',
            'Computer Science',
            'Artificial Intelligence'
        ],
        'sections': unique_classes_set,
        'teachers': clean_teachers,
        'schedule_entries': all_schedule_entries,
        'course_catalog': all_course_catalog
    }

    # Build detailed section-by-section dictionary for all_timetables_detailed.json
    dept_grouped_timetables = {}
    for dept in output_bundle['departments']:
        dept_grouped_timetables[dept] = []

    for sec_key in unique_classes_set:
        dept_name, sec_name, shift_name = [s.strip() for s in sec_key.split('|')]
        sec_entries = [e for e in all_schedule_entries if e['department'] == dept_name and e['section'] == sec_name and e['shift'] == shift_name]
        if not sec_entries:
            continue

        semester_name = sec_entries[0]['semester']
        page_num = sec_entries[0]['page']

        sec_cat_key = f"{dept_name}||{sec_name}||{shift_name}"
        sec_courses = list(section_courses_map.get(sec_cat_key, {}).values())
        if not sec_courses:
            seen_c = set()
            for e in sec_entries:
                c_code = e.get('course_code') or e.get('subject')
                if c_code and c_code not in seen_c and e.get('course_code') != 'BREAK':
                    seen_c.add(c_code)
                    sec_courses.append({
                        'code': e.get('course_code', ''),
                        'title': e.get('subject', ''),
                        'instructor': e.get('teacher', 'TO BE ASSIGNED'),
                        'credit_hours': e.get('credit_hours', ''),
                        'rooms': e.get('room', 'TBA'),
                        'location': e.get('location', '')
                    })

        slots_set = sorted(list(set(e['time'] for e in sec_entries)), key=lambda s: s.split('-')[0])
        slot_rows = []
        for sl in slots_set:
            day_map = {}
            for day in DAYS:
                match_e = next((e for e in sec_entries if e['time'] == sl and e['day'] == day), None)
                if match_e:
                    if match_e['type'] == 'jummah':
                        day_map[day] = 'JUMMAH BREAK'
                    else:
                        code_prefix = f"{match_e['course_code']} — " if match_e['course_code'] else ''
                        c_str = f"{code_prefix}{match_e['subject']} {match_e['teacher']} {match_e['room']}".strip()
                        day_map[day] = c_str
            slot_rows.append({
                'time_slot': sl,
                'days': day_map
            })

        dept_grouped_timetables.setdefault(dept_name, []).append({
            'section': sec_name,
            'semester': semester_name,
            'shift': shift_name,
            'page': page_num,
            'schedule': slot_rows,
            'courses': sec_courses
        })

    detailed_bundle = {
        'institution': 'Faculty of Computing & Emerging Technologies, Emerson University Multan',
        'academic_session': 'Fall 2026',
        'effective_date': '07 September 2026',
        'departments': dept_grouped_timetables
    }

    with open('all_timetables_detailed.json', 'w', encoding='utf-8', newline='\n') as f:
        json.dump(detailed_bundle, f, ensure_ascii=False, indent=2)
    print('Saved all_timetables_detailed.json successfully.')

    with open('timetable_data.json', 'w', encoding='utf-8', newline='\n') as f:
        json.dump(output_bundle, f, ensure_ascii=False, indent=2)
    print('Saved timetable_data.json successfully.')

    with open('timetable-data.js', 'w', encoding='utf-8', newline='\n') as f:
        f.write('// Auto-generated full timetable dataset from Emerson University Multan PDFs\n')
        f.write('window.TIMETABLE_DATA = ')
        json.dump(output_bundle, f, ensure_ascii=False, indent=2)
        f.write(';\n')
    print('Saved timetable-data.js successfully.')

if __name__ == '__main__':
    extract_all_timetables()
