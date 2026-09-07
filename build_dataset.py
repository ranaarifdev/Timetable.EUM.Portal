import fitz
import glob
import json
import re

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

def clean_text(s):
    if not s:
        return ''
    s = s.replace('\ufffd', '—').replace('\u2013', '—').replace('\u2014', '—').strip()
    return re.sub(r'\s+', ' ', s)

def extract_all_entries():
    # 1. First extract all legends across all files so we have 100% ground truth for codes, subjects, teachers, rooms
    all_legends = []
    
    for pdf_path in sorted(glob.glob('*.pdf')):
        doc = fitz.open(pdf_path)
        for pno in range(len(doc)):
            page = doc[pno]
            tabs = page.find_tables()
            for t in tabs:
                rows = t.extract()
                found_header = False
                for r in rows:
                    if r and len(r) >= 6 and r[0] == 'Code' and 'Course' in str(r[1]):
                        found_header = True
                        continue
                    if found_header and r and len(r) >= 6:
                        c0 = clean_text(r[0])
                        c1 = clean_text(r[1])
                        c2 = clean_text(r[2])
                        c3 = clean_text(r[3])
                        c4 = clean_text(r[4])
                        c5 = clean_text(r[5])
                        if c0 and c0 != 'Code' and not c0.startswith('BS') and not c0.startswith('TIME') and not c0.startswith('FACULTY'):
                            all_legends.append({
                                'file': pdf_path,
                                'page': pno + 1,
                                'code': c0,
                                'title': c1,
                                'instructor': c2,
                                'cr_hrs': c3,
                                'rooms': c4,
                                'location': c5
                            })
                            
    # Build course dictionary by (file, code) and (code, instructor)
    course_by_file_code = {}
    for l in all_legends:
        key = (l['file'], l['code'])
        course_by_file_code[key] = l

    # 2. Extract every schedule slot cell by cell using bounding boxes
    schedule_entries = []
    
    # Precise Section mapping per page
    # Maps (file, page_num) -> (department, section, semester, shift)
    section_map = {
        # AI
        ('AI Mor TT Tentative.pdf', 1): ('Artificial Intelligence', 'BSAI-3A', '3rd Semester', 'Morning Shift'),
        ('AI Mor TT Tentative.pdf', 2): ('Artificial Intelligence', 'BSAI-5A', '3rd Semester', 'Morning Shift'),
        ('AI Mor TT Tentative.pdf', 3): ('Artificial Intelligence', 'BSAI-5B', '5th Semester', 'Morning Shift'),
        ('AI Mor TT Tentative.pdf', 4): ('Artificial Intelligence', 'BSAI-7A', '7th Semester', 'Morning Shift'),
        ('AI Mor TT Tentative.pdf', 5): ('Artificial Intelligence', 'BSAI-3A', '3rd Semester', 'Evening Shift'),
        ('AI Mor TT Tentative.pdf', 6): ('Artificial Intelligence', 'BSAI-4A', '4th Semester', 'Evening Shift'),
        ('AI Mor TT Tentative.pdf', 7): ('Artificial Intelligence', 'BSAI-5A', '5th Semester', 'Evening Shift'),
        ('AI Mor TT Tentative.pdf', 8): ('Artificial Intelligence', 'BSAI-5B', '5th Semester', 'Evening Shift'),
        ('AI Mor TT Tentative.pdf', 9): ('Artificial Intelligence', 'BSAI-7A', '7th Semester', 'Evening Shift'),

        # CS
        ('CS TT Tentative.pdf', 1): ('Computer Science', 'BSCS-3A', '3rd Semester', 'Morning Shift'),
        ('CS TT Tentative.pdf', 2): ('Computer Science', 'BSCS-5A', '5th Semester', 'Morning Shift'),
        ('CS TT Tentative.pdf', 3): ('Computer Science', 'BSCS-5B', '5th Semester', 'Morning Shift'),
        ('CS TT Tentative.pdf', 4): ('Computer Science', 'BSCS-5C', '5th Semester', 'Morning Shift'),
        ('CS TT Tentative.pdf', 5): ('Computer Science', 'BSCS-7A', '7th Semester', 'Morning Shift'),
        ('CS TT Tentative.pdf', 6): ('Computer Science', 'BSCS-3A', '3rd Semester', 'Evening Shift'),
        ('CS TT Tentative.pdf', 7): ('Computer Science', 'BSCS-4A', '4th Semester', 'Evening Shift'),
        ('CS TT Tentative.pdf', 8): ('Computer Science', 'BSCS-5A', '5th Semester', 'Evening Shift'),
        ('CS TT Tentative.pdf', 9): ('Computer Science', 'BSCS-5B', '5th Semester', 'Evening Shift'),
        ('CS TT Tentative.pdf', 10): ('Computer Science', 'BSCS-7A', '7th Semester', 'Evening Shift'),

        # CyberSec
        ('CyberSec TT Tentative.pdf', 1): ('Cybersecurity', 'BSCybSec-3A', '3rd Semester', 'Morning Shift'),
        ('CyberSec TT Tentative.pdf', 2): ('Cybersecurity', 'BSCybSec-5A', '5th Semester', 'Morning Shift'),
        ('CyberSec TT Tentative.pdf', 3): ('Cybersecurity', 'BSCybSec-5B', '5th Semester', 'Morning Shift'),
        ('CyberSec TT Tentative.pdf', 4): ('Cybersecurity', 'BSCybSec-7A', '7th Semester', 'Morning Shift'),
        ('CyberSec TT Tentative.pdf', 5): ('Cybersecurity', 'BSCybSec-3A', '3rd Semester', 'Evening Shift'),
        ('CyberSec TT Tentative.pdf', 6): ('Cybersecurity', 'BSCybSec-4A', '4th Semester', 'Evening Shift'),
        ('CyberSec TT Tentative.pdf', 7): ('Cybersecurity', 'BSCybSec-5A', '5th Semester', 'Evening Shift'),
        ('CyberSec TT Tentative.pdf', 8): ('Cybersecurity', 'BSCybSec-7A', '7th Semester', 'Evening Shift'),

        # IT
        ('IT TT Tentative.pdf', 1): ('Information Technology', 'BSIT-3A', '3rd Semester', 'Morning Shift'),
        ('IT TT Tentative.pdf', 2): ('Information Technology', 'BSIT-5A', '5th Semester', 'Morning Shift'),
        ('IT TT Tentative.pdf', 3): ('Information Technology', 'BSIT-5B', '5th Semester', 'Morning Shift'),
        ('IT TT Tentative.pdf', 4): ('Information Technology', 'BSIT-5C', '5th Semester', 'Morning Shift'),
        ('IT TT Tentative.pdf', 5): ('Information Technology', 'BSIT-5D', '5th Semester', 'Morning Shift'),
        ('IT TT Tentative.pdf', 6): ('Information Technology', 'BSIT-7A', '7th Semester', 'Morning Shift'),
        ('IT TT Tentative.pdf', 7): ('Information Technology', 'BSIT-3A', '3rd Semester', 'Evening Shift'),
        ('IT TT Tentative.pdf', 8): ('Information Technology', 'BSIT-4A', '4th Semester', 'Evening Shift'),
        ('IT TT Tentative.pdf', 9): ('Information Technology', 'BSIT-5A', '5th Semester', 'Evening Shift'),
        ('IT TT Tentative.pdf', 10): ('Information Technology', 'BSIT-5B', '5th Semester', 'Evening Shift'),
        ('IT TT Tentative.pdf', 11): ('Information Technology', 'BSIT-7A', '7th Semester', 'Evening Shift'),
        ('IT TT Tentative.pdf', 12): ('Information Technology', 'BSIT-8A', '8th Semester', 'Evening Shift'),

        # SE
        ('SE TT Tentative.pdf', 1): ('Software Engineering', 'BSSE-3A', '3rd Semester', 'Morning Shift'),
        ('SE TT Tentative.pdf', 2): ('Software Engineering', 'BSSE-5A', '5th Semester', 'Morning Shift'),
        ('SE TT Tentative.pdf', 3): ('Software Engineering', 'BSSE-5B', '5th Semester', 'Morning Shift'),
        ('SE TT Tentative.pdf', 4): ('Software Engineering', 'BSSE-7A', '7th Semester', 'Morning Shift'),
        ('SE TT Tentative.pdf', 5): ('Software Engineering', 'BSSE-3A', '3rd Semester', 'Evening Shift'),
        ('SE TT Tentative.pdf', 6): ('Software Engineering', 'BSSE-4A', '4th Semester', 'Evening Shift'),
        ('SE TT Tentative.pdf', 7): ('Software Engineering', 'BSSE-5A', '5th Semester', 'Evening Shift'),
        ('SE TT Tentative.pdf', 8): ('Software Engineering', 'BSSE-7A', '7th Semester', 'Evening Shift'),

        # 1st SemAll
        ('Tentative TT 1st SemAll.pdf', 1): ('Artificial Intelligence', 'BSCS(AI)-1A', '1st Semester', 'Morning Shift'),
        ('Tentative TT 1st SemAll.pdf', 2): ('Computer Science', 'BSCS(CS)-1A', '1st Semester', 'Morning Shift'),
        ('Tentative TT 1st SemAll.pdf', 3): ('Cybersecurity', 'BSCS(CyS)-1A', '1st Semester', 'Evening Shift'),
        ('Tentative TT 1st SemAll.pdf', 4): ('Data Science', 'BSCS(DS)-1A', '1st Semester', 'Evening Shift'),
        ('Tentative TT 1st SemAll.pdf', 5): ('Information Technology', 'BSCS(IT)-1A', '1st Semester', 'Morning Shift'),
        ('Tentative TT 1st SemAll.pdf', 6): ('Software Engineering', 'BSCS(SE)-1A', '1st Semester', 'Evening Shift'),
        ('Tentative TT 1st SemAll.pdf', 7): ('Information Technology', 'BSIT(2Y)-1A', '1st Semester', 'Morning Shift'),
    }

    # Fix correct 5th semester semester field for BSAI-5A
    section_map[('AI Mor TT Tentative.pdf', 2)] = ('Artificial Intelligence', 'BSAI-5A', '5th Semester', 'Morning Shift')

    # Read each page grid
    for pdf_path in sorted(glob.glob('*.pdf')):
        doc = fitz.open(pdf_path)
        for pno in range(len(doc)):
            page = doc[pno]
            sec_meta = section_map.get((pdf_path, pno + 1))
            if not sec_meta:
                continue
            dept, sec_code, sem_name, shift_name = sec_meta
            
            # Find grid drawings
            h_lines = []
            v_lines = []
            for d in page.get_drawings():
                for item in d['items']:
                    if item[0] == 'l':
                        p1, p2 = item[1], item[2]
                        if abs(p1.y - p2.y) < 1:
                            h_lines.append((p1.y, min(p1.x, p2.x), max(p1.x, p2.x)))
                        elif abs(p1.x - p2.x) < 1:
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
            
            # Identify which Y rows correspond to timetable grid
            # Read first column (xs[0] to xs[1]) for each interval (ys[i] to ys[i+1])
            grid_rows = []
            for i in range(len(ys) - 1):
                y0, y1 = ys[i], ys[i+1]
                slot_rect = fitz.Rect(xs[0], y0, xs[1], y1)
                slot_words = page.get_text('words', clip=slot_rect)
                slot_words.sort(key=lambda w: (w[1], w[0]))
                slot_text = ' '.join(w[4] for w in slot_words).strip()
                # Check if it has time format like 08:30-09:20 or 01:30-02:20
                m_time = re.search(r'(\d{2}:\d{2})\s*[-—]\s*(\d{2}:\d{2})', slot_text)
                if m_time:
                    start_t = m_time.group(1)
                    end_t = m_time.group(2)
                    grid_rows.append((f"{start_t}-{end_t}", start_t, end_t, y0, y1))
                    
            # Now for each row and day column, extract text
            for time_str, start_t, end_t, y0, y1 in grid_rows:
                for d_idx, (x0, x1) in enumerate(col_bounds):
                    day_name = DAYS[d_idx]
                    cell_rect = fitz.Rect(x0, y0, x1, y1)
                    words = page.get_text('words', clip=cell_rect)
                    if not words:
                        continue
                    words.sort(key=lambda w: (w[1], w[0]))
                    # group words into lines
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
                        
                    raw_lines = [l for l in raw_lines if l]
                    if not raw_lines:
                        continue
                        
                    # Check for Jummah Break
                    if raw_lines[0] == 'JUMMAH BREAK':
                        if len(raw_lines) > 1:
                            raw_lines = raw_lines[1:]
                        else:
                            continue
                            
                    # Parse cell lines:
                    # e.g.:
                    # Line 0: SOCI-2101 — Civics and Community
                    # Line 1: Engagement
                    # Line 2: Rabia
                    # Line 3: CTB3-16
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
                            
                    # Clean up
                    code_val = clean_text(code_val)
                    subject_name = clean_text(subject_name)
                    teacher_val = clean_text(teacher_val)
                    room_val = clean_text(room_val)
                    
                    # If subject_name is empty but code is there, look up in legend
                    if code_val and (pdf_path, code_val) in course_by_file_code:
                        leg = course_by_file_code[(pdf_path, code_val)]
                        if not subject_name:
                            subject_name = leg['title']
                        if not teacher_val or teacher_val == 'TO BE ASSIGNED':
                            if leg['instructor'] and leg['instructor'] != 'TO BE ASSIGNED':
                                teacher_val = leg['instructor']
                        if not room_val:
                            room_val = leg['rooms']

                    if code_val or subject_name:
                        schedule_entries.append({
                            'id': len(schedule_entries) + 1,
                            'department': dept,
                            'section': sec_code,
                            'semester': sem_name,
                            'shift': shift_name,
                            'day': day_name,
                            'time': time_str,
                            'start_time': start_t,
                            'end_time': end_t,
                            'course_code': code_val,
                            'subject': subject_name,
                            'teacher': teacher_val,
                            'room': room_val,
                            'file': pdf_path,
                            'page': pno + 1
                        })

    print(f'Successfully extracted {len(schedule_entries)} total schedule entries.')
    print(f'Total Course Legends: {len(all_legends)}')
    
    output_bundle = {
        'metadata': {
            'institution': 'Faculty of Computing & Emerging Technologies, Emerson University Multan',
            'session': 'Fall 2026',
            'effective_date': '07 September 2026',
            'total_entries': len(schedule_entries),
            'total_courses': len(all_legends)
        },
        'sections': list({f"{e['department']} | {e['section']} | {e['shift']}" for e in schedule_entries}),
        'teachers': sorted(list({e['teacher'] for e in schedule_entries if e['teacher'] and e['teacher'] != 'TO BE ASSIGNED'})),
        'departments': ['Cybersecurity', 'Information Technology', 'Data Science', 'Software Engineering', 'Computer Science', 'Artificial Intelligence'],
        'schedule_entries': schedule_entries,
        'course_catalog': all_legends
    }
    
    with open('timetable_data.json', 'w', encoding='utf-8') as f:
        json.dump(output_bundle, f, ensure_ascii=False, indent=2)
    print('Saved timetable_data.json successfully.')

if __name__ == '__main__':
    extract_all_entries()
