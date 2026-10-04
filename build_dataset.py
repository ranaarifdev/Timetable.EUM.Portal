import fitz
import glob
import json
import re

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

DEPT_MAP = {
    'TT BSAI M+E updated.pdf': 'Artificial Intelligence',
    'TT BSCS M+E updated.pdf': 'Computer Science',
    'TT BSCyberSec M+E.pdf': 'Cybersecurity',
    'TT BSDS M+E updated.pdf': 'Data Science',
    'TT BSIT M+E updated.pdf': 'Information Technology',
    'TT BSSE M+E updated.pdf': 'Software Engineering',
    'TT BSAI M+E.pdf': 'Artificial Intelligence',
    'TT BSCS M+E.pdf': 'Computer Science',
    'TT BSCyberSec M+E.pdf': 'Cybersecurity',
    'TT BSDS M+E.pdf': 'Data Science',
    'TT BSIT M+E.pdf': 'Information Technology',
    'TT BSSE M+E.pdf': 'Software Engineering',
    'AI Mor TT Tentative.pdf': 'Artificial Intelligence',
    'CS TT Tentative.pdf': 'Computer Science',
    'CyberSec TT Tentative.pdf': 'Cybersecurity',
    'IT TT Tentative.pdf': 'Information Technology',
    'SE TT Tentative.pdf': 'Software Engineering',
}

SEM1_DEPT_MAP = {
    'BSCS(AI)-1A': 'Artificial Intelligence',
    'BSCS(CS)-1A': 'Computer Science',
    'BSCS(CyS)-1A': 'Cybersecurity',
    'BSCS(DS)-1A': 'Data Science',
    'BSCS(IT)-1A': 'Information Technology',
    'BSCS(SE)-1A': 'Software Engineering',
    'BSIT(2Y)-1A': 'Information Technology',
}

# These two documents use a different layout: the class heading appears below
# the timetable grid, so it cannot be associated with rows by the generic
# banner-based extractor.  Keep their official, course-level schedules here so
# they are regenerated along with the rest of the PDF-derived dataset.
SPECIAL_TIMETABLES = [
    {
        'file': 'updated BSIT 2yearTT.pdf', 'page': 1, 'department': 'Information Technology',
        'section': 'BSIT(2Y)-3A', 'semester': '3rd Semester', 'shift': 'Morning Shift',
        'courses': [
            ('UOHQ-1107', 'Fahm e Quran', 'Qudsia Khanam', '1+0', 'CTB1-01', 'Monday', '08:30', 1),
            ('INTE-3137', 'Information Technology Infrastructure', 'Dr. Usman', '3+0', 'CTB1-01', 'Monday', '08:30', 1),
            ('INTE-4132', 'Cyber Security', 'Aleena Shafqat', '3+0', 'CTB1-01', 'Monday', '08:30', 1),
            ('INTE-3122', 'Formal Methods in Software Engineering', 'Zahid Aziz', '3+0', 'CTB1-01', 'Monday', '08:30', 1),
            ('INTE-3121', 'Distributed Computing', 'Muhammad Kamran Abid', '3+0', 'CTB1-01', 'Monday', '08:30', 1),
            ('INTE-3147', 'Mobile Application Development', 'Muhammad Jasim Shah', '2+1', 'CTB1-01 | CLab-05', 'Monday', '08:30', 1),
            ('COSC-2116', 'Professional Practices', 'Engr Mirza Murad Baig', '3+0', 'CTB1-01', 'Monday', '08:30', 1),
        ],
        # Exact grid placements, rather than a credit-hour approximation.
        'slots': [
            ('Monday','08:30','UOHQ-1107'), ('Tuesday','08:30','INTE-3137'), ('Wednesday','08:30','INTE-4132'), ('Thursday','08:30','INTE-4132'), ('Friday','08:30','INTE-3137'),
            ('Monday','09:20','INTE-3122'), ('Tuesday','09:20','INTE-3121'), ('Wednesday','09:20','COSC-2116'), ('Thursday','09:20','INTE-4132'), ('Friday','09:20','INTE-3147'),
            ('Monday','10:10','INTE-3122'), ('Tuesday','10:10','INTE-3121'), ('Wednesday','10:10','INTE-3122'), ('Thursday','10:10','COSC-2116'),
            ('Monday','11:00','INTE-3121'), ('Tuesday','11:00','INTE-3147'), ('Wednesday','11:00','INTE-3137'), ('Thursday','11:00','COSC-2116'),
            ('Monday','11:50','INTE-3147'), ('Friday','12:40','BREAK'),
        ]
    },
]

def get_room_location(room):
    if not room:
        return ''
    r = room.upper().strip()
    if r == 'ONLINE':
        return 'Online'
    if r.startswith('CLAB'):
        return 'Lab Block'
    if r.startswith('CTB1'):
        return 'Old Building — Upper Floor'
    if r.startswith('CTB2'):
        return 'Old Building — Ground Floor'
    if r.startswith('CTB3'):
        return 'Botany Block — Upper'
    return 'University Main Campus'

def add_special_entry(entries, item, day, start, code, index):
    """Append one timetable cell from a non-standard official PDF layout."""
    end_hour, end_minute = map(int, start.split(':'))
    total = end_hour * 60 + end_minute + 50
    end = f'{total // 60:02d}:{total % 60:02d}'
    if code == 'BREAK':
        end_str = '01:30' if day == 'Friday' and start == '12:40' else end
        time_str = f'{start}-{end_str}'
        entries.append({'id': len(entries) + 1, **{k: item[k] for k in ('department','section','semester','shift','file','page')},
                        'day': day, 'time': time_str, 'start_time': start, 'end_time': end_str,
                        'course_code': 'BREAK', 'subject': 'Jummah Break', 'teacher': '', 'room': '',
                        'location': '', 'credit_hours': '', 'type': 'jummah'})
        return
    course = next(c for c in item['courses'] if c[0] == code)
    _, subject, teacher, credit_hours, room, *_ = course

    # Specific slot adjustments for BSIT(2Y)-3A INTE-3147 per official PDF
    entry_room = room
    entry_subj = subject
    entry_type = 'lab' if 'CLab' in room else 'theory'
    if code == 'INTE-3147':
        if day == 'Monday' and start == '11:50':
            entry_room = 'CLab-05'
            entry_subj = 'Mobile Application Development (Lab)'
            entry_type = 'lab'
        else:
            entry_room = 'CTB1-01'
            entry_subj = 'Mobile Application Development'
            entry_type = 'theory'

    entry_loc = get_room_location(entry_room)
    entries.append({'id': len(entries) + 1, **{k: item[k] for k in ('department','section','semester','shift','file','page')},
                    'day': day, 'time': f'{start}-{end}', 'start_time': start, 'end_time': end,
                    'course_code': '' if code.startswith('__') else code, 'subject': entry_subj, 'teacher': teacher, 'room': entry_room,
                    'location': entry_loc,
                    'credit_hours': credit_hours, 'type': entry_type})

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
                cat_loc = 'Botany Block — Upper'
            else:
                cat_loc = 'University Main Campus'
            catalog.append({'file': item['file'], 'page': item['page'], 'department': dept, 'section': section,
                            'semester': semester, 'shift': item['shift'], 'code': '', 'title': title,
                            'instructor': teacher, 'cr_hrs': credits, 'rooms': room,
                            'location': cat_loc})
            # The first-semester grids start their three-hour subjects at
            # 2:00 pm and Quran at 5:00 pm.  Third-semester grids place Quran
            # at 2:00 pm and their three-hour subjects from 3:00 pm onward.
            start = '17:00' if semester.startswith('1st') and periods == 1 else (
                '14:00' if semester.startswith('1st') else ('14:00' if periods == 1 else '15:00')
            )
            for offset in range(periods):
                minutes = int(start[:2]) * 60 + int(start[3:]) + offset * 60
                slot_start = f'{minutes // 60:02d}:{minutes % 60:02d}'
                add_special_entry(entries, item, day, slot_start, key, num)
                # The official MSIT-3A grid uses CLab-04 at 3:00 pm and
                # CTB1-07 at 4:00 and 5:00 pm, not both rooms per entry.
                if section == 'MSIT-3A' and title.startswith('Information System'):
                    entries[-1]['room'] = 'CLab-04' if slot_start == '15:00' else 'CTB1-07'
                    entries[-1]['location'] = 'Lab Block' if slot_start == '15:00' else 'Old Building — Upper Floor'
                    entries[-1]['type'] = 'lab' if slot_start == '15:00' else 'theory'
                else:
                    entries[-1]['location'] = get_room_location(entries[-1]['room'])

def clean_text(s):
    if not s:
        return ''
    s = str(s)
    for bad in ['\ufffd', chr(0xfffd), '\u2013', '\u2014', '\xb7', 'â€”']:
        if bad:
            s = s.replace(bad, '—')
    s = s.replace('\\ufffd', '—').replace('\\u2013', '—').replace('\\u2014', '—').replace('\\xb7', '—').strip()
    return re.sub(r'\s+', ' ', s)

def normalize_teacher_name(name):
    if not name:
        return 'TO BE ASSIGNED'
    n = clean_text(name).strip()
    if not n or n.upper() in ('TO BE ASSIGNED', 'TBA', 'XYZ', 'NONE', '-', '—'):
        return 'TO BE ASSIGNED'
    if n.lower() == 'farzeen khan':
        return 'Farzeen Khan'
    return n

def is_valid_course_code(code):
    if not code:
        return False
    c = clean_text(code).strip().upper()
    if c in ('CODE', 'TIME', 'TIME/DAY', 'TIME / DAY', 'FACULTY', 'DEPARTMENT', 'ROOM', 'BREAK', 'NONE', 'TBA', 'DAY'):
        return False
    if '/' in c or '\\' in c:
        return False
    if re.search(r'\d{2}:\d{2}', c):
        return False
    if len(c) > 20 or len(c) < 3:
        return False
    return bool(re.match(r'^[A-Z]{2,6}[\s\-]*(?:\d{3,4}|[0-9xX]{3,4})$', c))

def extract_all_timetables():
    all_sections_meta = []
    all_course_catalog = []
    all_schedule_entries = []

    # Process all PDF files
    pdf_files = sorted(glob.glob('*.pdf'))
    print(f'Found {len(pdf_files)} PDF files to process: {pdf_files}')

    for pdf_path in pdf_files:
        # Handled below from their official grids. Their headings are printed
        # after (not above) the tables, which otherwise creates an "Unknown"
        # duplicate class during generic extraction.
        if pdf_path in {'BSIT 2yrTT.pdf', 'updated BSIT 2yearTT.pdf', 'MS m phill all classes  TT.pdf', 'MS or  m -phill  classes  TT.pdf'}:
            continue
        doc = fitz.open(pdf_path)
        print(f'\nProcessing {pdf_path} ({len(doc)} pages)...')

        # 1. Discover all section banners in chronological document order
        banners = []
        for pno in range(len(doc)):
            page = doc[pno]
            for b in sorted(page.get_text('blocks'), key=lambda x: x[1]):
                txt = clean_text(b[4])
                norm = re.sub(r'[\xb7\ufffd\u2013\u2014\-]+', '-', txt)
                # The BSSE evening headings omit the word "Shift" and wrap
                # across lines, while the remaining PDFs use the full form.
                # Treat both official heading variants identically.
                m = re.search(r'([A-Za-z0-9\(\)\-]+)\s*-\s*(\d+\w*\s+Semester)\s*-\s*(Morning|Evening)(?:\s+Shift)?', norm)
                if m:
                    sec_name = m.group(1).replace(' ', '')
                    if pdf_path in {'TT  BS 1st Semester All classes.pdf', 'Tentative TT 1st SemAll.pdf'}:
                        dept_name = SEM1_DEPT_MAP.get(sec_name, 'Unknown')
                    else:
                        dept_name = DEPT_MAP.get(pdf_path, 'Unknown')

                    banner_obj = {
                        'pno': pno,
                        'page': pno + 1,
                        'y': b[1],
                        'section': sec_name,
                        'semester': m.group(2),
                        'shift': m.group(3) + ' Shift',
                        'department': dept_name,
                        'file': pdf_path
                    }
                    banners.append(banner_obj)
                    all_sections_meta.append(banner_obj)

        banners.sort(key=lambda b: (b['pno'], b['y']))
        print(f'  Found {len(banners)} sections in {pdf_path}:')
        for b in banners:
            print(f'    P{b["page"]} (y={b["y"]:.1f}) -> {b["department"]} | {b["section"]} | {b["semester"]} | {b["shift"]}')

        def get_active_banner(pno, y):
            active = None
            for b in banners:
                if (b['pno'] < pno) or (b['pno'] == pno and b['y'] <= y):
                    active = b
                else:
                    break
            return active

        # 2. Extract COURSES legend tables
        section_courses = {}
        for pno in range(len(doc)):
            page = doc[pno]
            tabs = page.find_tables()
            for t in tabs:
                rows = t.extract()
                for r_idx, r in enumerate(rows):
                    if not r or len(r) < 2 or not r[0]:
                        continue
                    first_cell = clean_text(r[0]).strip()
                    if any(w in first_cell.upper() for w in ['TIME', 'SEMESTER', 'SHIFT', 'EMERSON', 'DEPARTMENT', 'HEAD', 'SIGNATURE', 'FACULTY', 'MORNING', 'EVENING']):
                        continue
                    if is_valid_course_code(first_cell) and len(r) >= 5:
                        c0 = clean_text(r[0])
                        c1 = clean_text(r[1])
                        c2 = normalize_teacher_name(r[2]) if len(r) > 2 else 'TO BE ASSIGNED'
                        c3 = clean_text(r[3]) if len(r) > 3 else ''
                        c4 = clean_text(r[4]) if len(r) > 4 else ''
                        if 'CTB2-9' in c4:
                            c4 = re.sub(r'\bCTB2-9\b', 'CTB2-09', c4)
                        c5 = clean_text(r[5]) if len(r) > 5 else ''
                        
                        if c1 in DAYS or c2 in DAYS:
                            continue
                        if not c1 or len(c1) < 3 or re.search(r'\d{2}:\d{2}', c1):
                            continue
                        if len(c2) > 35 or re.search(r'\d{2}:\d{2}', c2):
                            c2 = 'TO BE ASSIGNED'
                            
                        row_y = t.rows[r_idx].bbox[1]
                        active_b = get_active_banner(pno, row_y)
                        if not active_b:
                            continue
                        sec_key = f"{active_b['department']}||{active_b['section']}||{active_b['shift']}"
                        if sec_key not in section_courses:
                            section_courses[sec_key] = {}

                        course_item = {
                            'file': pdf_path,
                            'page': pno + 1,
                            'department': active_b['department'],
                            'section': active_b['section'],
                            'semester': active_b['semester'],
                            'shift': active_b['shift'],
                            'code': c0,
                            'title': c1,
                            'instructor': c2,
                            'cr_hrs': c3,
                            'rooms': c4,
                            'location': c5
                        }
                        # Key by code (normalized without spaces/hyphens)
                        norm_code = re.sub(r'[\s\-]+', '', c0).upper()
                        section_courses[sec_key][norm_code] = course_item
                        all_course_catalog.append(course_item)


        # 3. Extract Grid Rows per page
        for pno in range(len(doc)):
            page = doc[pno]

            # Collect line segments for grid extraction
            h_lines = []
            v_lines = []
            for d in page.get_drawings():
                for item in d['items']:
                    if item[0] == 'l':
                        p1, p2 = item[1], item[2]
                        if abs(p1.y - p2.y) < 1.5:
                            h_lines.append((p1.y, min(p1.x, p2.x), max(p1.x, p2.x)))
                        elif abs(p1.x - p2.x) < 1.5:
                            v_lines.append((p1.x, min(p1.y, p2.y), max(p1.y, p2.y)))
                    elif item[0] == 're':
                        r = item[1]
                        h_lines.append((r.y0, r.x0, r.x1))
                        h_lines.append((r.y1, r.x0, r.x1))
                        v_lines.append((r.x0, r.y0, r.y1))
                        v_lines.append((r.x1, r.y0, r.y1))

            raw_ys = sorted(list(set([round(y[0], 0) for y in h_lines])))
            ys = []
            for y in raw_ys:
                if not ys or (y - ys[-1] > 6):
                    ys.append(y)

            raw_xs = sorted(list(set([round(x[0], 0) for x in v_lines])))
            xs = []
            for x in raw_xs:
                if not xs or (x - xs[-1] > 10):
                    xs.append(x)

            if len(xs) < 7:
                continue

            col_bounds = [(xs[1], xs[2]), (xs[2], xs[3]), (xs[3], xs[4]), (xs[4], xs[5]), (xs[5], xs[6])]

            # Detect rows with time format in column 0 (xs[0] to xs[1])
            for i in range(len(ys) - 1):
                y0, y1 = ys[i], ys[i+1]
                slot_rect = fitz.Rect(xs[0], y0, xs[1], y1)
                slot_words = page.get_text('words', clip=slot_rect)
                slot_words.sort(key=lambda w: (w[1], w[0]))
                slot_text = ' '.join(w[4] for w in slot_words).strip()

                m_time = re.search(r'(\d{2}:\d{2})\s*[-—–]\s*(\d{2}:\d{2})', slot_text)
                if not m_time:
                    continue

                start_t = m_time.group(1)
                end_t = m_time.group(2)
                time_str = f"{start_t}-{end_t}"

                # Determine active section for this row based on y0
                active_sec = get_active_banner(pno, y0)
                if not active_sec:
                    continue

                sec_key = f"{active_sec['department']}||{active_sec['section']}||{active_sec['shift']}"
                cat_lookup = section_courses.get(sec_key, {})

                # Process each day column
                for d_idx, (x0, x1) in enumerate(col_bounds):
                    day_name = DAYS[d_idx]
                    cell_rect = fitz.Rect(x0, y0, x1, y1)
                    words = page.get_text('words', clip=cell_rect)
                    if not words:
                        continue

                    words.sort(key=lambda w: (w[1], w[0]))
                    cell_lines = []
                    for w in words:
                        if not cell_lines or abs(w[1] - cell_lines[-1][0][1]) > 3.5:
                            cell_lines.append([w])
                        else:
                            cell_lines[-1].append(w)

                    raw_lines = []
                    for cl in cell_lines:
                        cl.sort(key=lambda w: w[0])
                        raw_lines.append(' '.join(w[4] for w in cl).strip())

                    raw_lines = [clean_text(l) for l in raw_lines if clean_text(l)]
                    if not raw_lines:
                        continue

                    # Check for Jummah Break
                    if any('JUMMAH' in l.upper() for l in raw_lines):
                        all_schedule_entries.append({
                            'id': len(all_schedule_entries) + 1,
                            'department': active_sec['department'],
                            'section': active_sec['section'],
                            'semester': active_sec['semester'],
                            'shift': active_sec['shift'],
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
                            'file': pdf_path,
                            'page': pno + 1
                        })
                        continue

                    # Parse standard cell:
                    # Line 0: Code - Subject (or Code and Subject on separate lines)
                    # Next: Teacher
                    # Last: Room
                    room_val = raw_lines[-1] if len(raw_lines) >= 3 else ''
                    teacher_val = raw_lines[-2] if len(raw_lines) >= 3 else ''
                    subj_part = ' '.join(raw_lines[:-2]) if len(raw_lines) >= 3 else ' '.join(raw_lines)

                    code_val = ''
                    subject_name = subj_part
                    if '—' in subj_part:
                        sp = subj_part.split('—', 1)
                        code_val = sp[0].strip()
                        subject_name = sp[1].strip()
                    elif '–' in subj_part:
                        sp = subj_part.split('–', 1)
                        code_val = sp[0].strip()
                        subject_name = sp[1].strip()
                    elif '-' in subj_part:
                        m_code = re.match(r'^([A-Za-z]+[\s\-]*(?:\d+|xxxx))\s*[-—–\s]\s*(.*)$', subj_part)
                        if m_code:
                            code_val = m_code.group(1).strip()
                            subject_name = m_code.group(2).strip()

                    code_val = clean_text(code_val)
                    subject_name = clean_text(subject_name)
                    teacher_val = normalize_teacher_name(teacher_val)
                    room_val = clean_text(room_val)

                    # Look up in section's course catalog for full metadata
                    norm_c = re.sub(r'[\s\-]+', '', code_val).upper()
                    matched_course = cat_lookup.get(norm_c)
                    if not matched_course and code_val:
                        # Fallback lookup by code across all catalog
                        for c_item in all_course_catalog:
                            if re.sub(r'[\s\-]+', '', c_item['code']).upper() == norm_c:
                                matched_course = c_item
                                break

                    # A few PDF cells display only the subject title.  Resolve those
                    # from the current section's course legend before saving an
                    # incomplete timetable entry.
                    if not matched_course and subject_name:
                        normalized_subject = re.sub(r'[^a-z0-9]+', '', subject_name.lower())
                        for c_item in cat_lookup.values():
                            catalog_subject = re.sub(r'[^a-z0-9]+', '', c_item['title'].lower())
                            if normalized_subject == catalog_subject:
                                matched_course = c_item
                                code_val = c_item['code']
                                break

                    cr_hrs_val = ''
                    loc_val = ''

                    if matched_course:
                        if not subject_name or len(subject_name) < 3:
                            subject_name = matched_course['title']
                        if not teacher_val or teacher_val == 'TO BE ASSIGNED' or teacher_val.upper() in ['TBA', 'XYZ', '']:
                            if matched_course['instructor'] and matched_course['instructor'].upper() != 'TO BE ASSIGNED':
                                teacher_val = matched_course['instructor']
                        if not room_val or room_val in ['TBA', '']:
                            room_val = matched_course['rooms']
                        cr_hrs_val = matched_course.get('cr_hrs', '')
                        loc_val = matched_course.get('location', '')

                    # Clean teacher display
                    teacher_val = normalize_teacher_name(teacher_val)

                    # Ensure strings derived from PDF table cells are display-ready.
                    code_val = code_val.strip()
                    subject_name = subject_name.strip()
                    teacher_val = teacher_val.strip()
                    room_val = room_val.strip()

                    # Clean room display
                    if not room_val:
                        room_val = 'TBA'
                    elif room_val == 'CTB1-10':
                        # Official PDF BSSE-5A Thursday 04:00 slot typo: room is CTB2-10 per legend
                        room_val = 'CTB2-10'
                    elif room_val == 'CTB2-9':
                        room_val = 'CTB2-09'

                    # Determine exact room location
                    if room_val and room_val != 'TBA':
                        loc_val = get_room_location(room_val)
                    elif matched_course:
                        loc_val = clean_text(matched_course.get('location', ''))

                    # Determine Entry Type
                    is_lab = ('(LAB)' in subject_name.upper() or 
                              '(LAB)' in code_val.upper() or 
                              room_val.upper().startswith('CLAB') or 
                              'LAB' in room_val.upper())
                    is_online = (room_val.upper() == 'ONLINE' or 
                                 'ONLINE' in subject_name.upper() or 
                                 loc_val.upper() == 'ONLINE')
                    is_tba = (teacher_val == 'TO BE ASSIGNED')

                    if is_online:
                        entry_type = 'online'
                    elif is_lab:
                        entry_type = 'lab'
                    elif is_tba:
                        entry_type = 'unassigned'
                    else:
                        entry_type = 'theory'

                    if code_val or subject_name:
                        all_schedule_entries.append({
                            'id': len(all_schedule_entries) + 1,
                            'department': active_sec['department'],
                            'section': active_sec['section'],
                            'semester': active_sec['semester'],
                            'shift': active_sec['shift'],
                            'day': day_name,
                            'time': time_str,
                            'start_time': start_t,
                            'end_time': end_t,
                            'course_code': code_val,
                            'subject': subject_name,
                            'teacher': teacher_val,
                            'room': room_val,
                            'location': loc_val,
                            'credit_hours': cr_hrs_val,
                            'type': entry_type,
                            'file': pdf_path,
                            'page': pno + 1
                        })

    # Add PDFs whose layouts cannot be safely inferred from banner position.
    for special in SPECIAL_TIMETABLES:
        for code, title, teacher, credits, room, *_ in special['courses']:
            all_course_catalog.append({
                'file': special['file'], 'page': special['page'], 'department': special['department'],
                'section': special['section'], 'semester': special['semester'], 'shift': special['shift'],
                'code': code, 'title': title, 'instructor': teacher, 'cr_hrs': credits, 'rooms': room,
                'location': 'Old Building — Upper Floor | Lab Block' if '|' in room else ('Lab Block' if 'CLab' in room else 'Old Building — Upper Floor')
            })
        for day, start, code in special['slots']:
            add_special_entry(all_schedule_entries, special, day, start, code, 0)
    add_ms_timetables(all_schedule_entries, all_course_catalog)

    print(f'\nTotal extracted schedule entries: {len(all_schedule_entries)}')
    print(f'Total course catalog items: {len(all_course_catalog)}')

    # Deduplicate unique classes
    unique_classes_set = sorted(list({f"{e['department']} | {e['section']} | {e['shift']}" for e in all_schedule_entries}))
    print(f'Total Unique Classes (Dept | Section | Shift): {len(unique_classes_set)}')

    # Build final data bundle
    output_bundle = {
        'metadata': {
            'institution': 'Faculty of Computing & Emerging Technologies, Emerson University Multan',
            'session': 'Fall 2026',
            'effective_date': '07 September 2026',
            'status': 'Tentative Timetable',
            'total_entries': len(all_schedule_entries),
            'total_courses': len(all_course_catalog),
            'total_unique_classes': len(unique_classes_set),
            'generated_at': '2026-09-27'
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
        'teachers': sorted(list({e['teacher'] for e in all_schedule_entries if e['teacher'] and e['teacher'] != 'TO BE ASSIGNED'})),
        'schedule_entries': all_schedule_entries,
        'course_catalog': all_course_catalog
    }

    # Build detailed section-by-section dictionary for all_timetables_detailed.json
    dept_grouped_timetables = {}
    for dept in output_bundle['departments']:
        dept_grouped_timetables[dept] = []

    # Map each of the 54 unique section+shift combinations
    for sec_key in unique_classes_set:
        dept_name, sec_name, shift_name = [s.strip() for s in sec_key.split('|')]
        sec_entries = [e for e in all_schedule_entries if e['department'] == dept_name and e['section'] == sec_name and e['shift'] == shift_name]
        if not sec_entries:
            continue

        semester_name = sec_entries[0]['semester']
        page_num = sec_entries[0]['page']

        # Get course list for this section
        sec_cat_key = f"{dept_name}||{sec_name}||{shift_name}"
        sec_courses = list(section_courses.get(sec_cat_key, {}).values())
        if not sec_courses:
            # Fallback to distinct courses in schedule entries
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

        # Build schedule slot rows
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

    with open('all_timetables_detailed.json', 'w', encoding='utf-8') as f:
        json.dump(detailed_bundle, f, ensure_ascii=False, indent=2)
    print('Saved all_timetables_detailed.json successfully.')

    # Save to timetable_data.json
    with open('timetable_data.json', 'w', encoding='utf-8') as f:
        json.dump(output_bundle, f, ensure_ascii=False, indent=2)
    print('Saved timetable_data.json successfully.')

    # Save to timetable-data.js for client-side inclusion without fetch
    with open('timetable-data.js', 'w', encoding='utf-8') as f:
        f.write('// Auto-generated full timetable dataset from Emerson University Multan PDFs\n')
        f.write('window.TIMETABLE_DATA = ')
        json.dump(output_bundle, f, ensure_ascii=False, indent=2)
        f.write(';\n')
    print('Saved timetable-data.js successfully.')

if __name__ == '__main__':
    extract_all_timetables()

