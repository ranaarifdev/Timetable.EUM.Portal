# Emerson University Multan — Timetable Portal
### Faculty of Computing & Emerging Technologies · Fall 2026 Session

> **🌐 Live Website:** [https://ranaarifdev.github.io/Timetable.EUM.Portal/](https://ranaarifdev.github.io/Timetable.EUM.Portal/)  
> **📅 Effective Date:** 07 September 2026  
> **🏛️ Institution:** Emerson University Multan (EUM), Pakistan  
> **📌 Source of Truth:** Official Fall 2026 Timetable PDF documents

---

## 👨‍💻 Developer & Maintainer
* **Developer:** **Muhammad Arif**
* **Program:** BS Cybersecurity (7th Semester, Evening Shift)
* **Department:** Department of Cybersecurity, Faculty of Computing & Emerging Technologies
* **University:** Emerson University Multan
* **GitHub:** [@ranaarifdev](https://github.com/ranaarifdev)
* **Repository:** [Timetable.EUM.Portal](https://github.com/ranaarifdev/Timetable.EUM.Portal)

---

## 🌟 Executive Summary
The **Emerson University Multan Timetable Portal** is an interactive, mobile-optimized, high-performance web platform that provides students, faculty members, and administrative staff with real-time, accurate access to departmental class schedules, teacher workloads, classroom assignments, and official course legends across the entire Faculty of Computing & Emerging Technologies.

All timetable data is extracted directly from the **latest official PDF schedule files** page by page with zero assumptions, strict Morning/Evening separation, section integrity (A, B, C, D), explicit Theory and Lab classifications, and deduplicated teacher and subject numbering logic.

---

## 📊 Current Timetable Statistics (Fall 2026)

| Metric | Count | Details |
| :--- | :---: | :--- |
| **Total Academic Departments** | **6** | Artificial Intelligence, Computer Science, Cybersecurity, Data Science, Information Technology, Software Engineering |
| **Total Unique Classes** | **64** | Separate program, semester, section, and shift groupings |
| ☀️ **Morning Shift Classes** | **33** | 08:00 AM – 01:10 PM time slots |
| 🌙 **Evening Shift Classes** | **31** | 01:30 PM – 06:40 PM time slots |
| **Total Weekly Lecture Slots** | **1,130** | Complete schedule entries mapped with exact day, time, and room |
| **Distinct Faculty Members** | **115** | Active teaching faculty with comprehensive workload profiles |
| **Total Base Academic Courses** | **88** | Normalized unique course titles (deduplicated across Theory/Lab components) |
| **Course Catalog Allocations** | **437** | Clean, verified official course credit and instructor mappings extracted from PDF legends |
| **Active Classrooms & Labs** | **19** | 100% of non-Jummah scheduled classes mapped to specific rooms |

### Departmental Distribution Breakdown
| Department | Total Classes | Morning Classes | Evening Classes | Semesters Offered |
| :--- | :---: | :---: | :---: | :--- |
| **Artificial Intelligence (BSAI)** | 10 | 5 | 5 | 1st, 3rd, 5th, 7th |
| **Computer Science (BSCS)** | 11 | 6 | 5 | 1st, 3rd, 5th, 7th |
| **Cybersecurity (BS CyberSec)** | 9 | 5 | 4 | 1st, 3rd, 5th, 7th |
| **Data Science (BSDS)** | 10 | 5 | 5 | 1st, 3rd, 5th, 7th |
| **Information Technology (BSIT)** | 15 | 7 | 8 | 1st, 3rd, 5th, 7th |
| **Software Engineering (BSSE)** | 9 | 5 | 4 | 1st, 3rd, 5th, 7th |
| **Total** | **64** | **33** | **31** | **All 4 Active Semesters** |

---

## 🎯 Key Rules & PDF-Based Principles

### 1. PDFs as the Absolute Source of Truth
- Every single schedule entry is extracted page-by-page from the official timetable PDF documents.
- No class, lecture, room, or teacher assignment is guessed or inferred.
- Lectures that were relocated to different days or periods in the updated PDFs are accurately reflected.

### 2. Correct Teacher & Subject Counting Logic
* **No Double-Counting Repeated Lectures:**
  - If a teacher teaches the same subject 2 or 3 times in a week to the same class, it is counted as **one subject/course assignment** in summary statistics and workload counts.
  - All individual lecture timings and slots are strictly maintained and displayed in the timetable view.
* **Integrated Theory + Lab Handling:**
  - If a teacher handles both the Theory and Lab for the same course in a class, it represents **one overall subject offering**, while the individual Theory and Lab periods retain their distinct schedule slots, badges, and room allocations.
* **Weekly Workload Slots vs. Course Offerings:**
  - Faculty profiles explicitly show both **Weekly Periods** (total hours taught) and **Course Offerings** (distinct class-course combinations).

### 3. Clear Theory vs. Lab Badging
- Entries designated in the PDF as Lab sessions (e.g., `CL-I`, `CL-II`, `DLD Lab`, `DSA Lab`, `Physics Lab`) are tagged with high-visibility **`LAB`** badges.
- Theory lectures are explicitly tagged with **`THEORY`** badges.
- One component does not overwrite another; subjects with both Theory and Lab slots show both types appropriately in class grids, teacher profiles, and course catalogs.

### 4. Strict Section & Shift Separation
- **No Merging of Sections:** Sections `A`, `B`, `C`, and `D` are maintained as completely separate classes with their own individual schedules and course legends.
- **Strict Morning / Evening Separation:** Morning (08:00 AM – 01:10 PM) and Evening (01:30 PM – 06:40 PM) shifts are never mixed. The portal provides instant shift filtering and dedicated tabs.

### 5. Verified Room Assignment
- Every lecture slot displays its exact room from the PDF (e.g., `Room 101`, `Room 102`, `Room 103`, `CS Lab 1`, `CS Lab 2`, `IT Lab`, `DLD Lab`).
- No rooms are copied from adjacent sections or arbitrary slots.

---

## ✨ Features & User Interface

### 1. 📅 Interactive Class-Wise Timetable
- **Filter by Criteria:** Filter classes by Department, Semester (1st, 3rd, 5th, 7th), Shift (Morning / Evening), and Section.
- **Dual Display Modes:**
  - **Weekly Timetable Grid:** Full Monday-to-Friday schedule matrix showing period numbers, exact time ranges, subject names, assigned teacher, room badge, and `THEORY`/`LAB` status.
  - **List / Card View:** Streamlined, card-based agenda optimized for mobile devices and quick scanning.
- **Official Course Legend:** Below every class schedule, the official course catalog table is rendered directly from the PDF banner, showing Course Code, Course Title, Credit Hours (e.g., `3(2-1)` or `3(3-0)`), and Instructor Name.
- **Print & PDF Export:** One-click clean printing formatted specifically for A4 landscape schedules with complete weekly timetable grid, official course & instructor allocation legend, and university signature blocks (`Time Table Incharge` & `Head of Department`).

### 2. 👨‍🏫 Teacher-Wise Timetable & Workload Center
- **Instructor Directory:** Quick searchable list of all 115 faculty members.
- **Comprehensive Profile:**
  - Total Weekly Teaching Slots / Periods
  - Unique Classes Taught
  - Distinct Subjects Handled
  - Active Classrooms Used
- **Weekly Schedule Matrix:** Interactive day-by-day timetable for any selected instructor with room, class, and lecture type tags.
- **A4 Landscape Weekly Schedule Export:** One-click print generating a clean, dedicated A4 landscape timetable grid displaying all lectures, classrooms, and teaching sections, complete with a workload breakdown table and official signature lines (`Faculty Signature` & `Head of Department`).

### 3. 📚 Unified Subjects Catalog & Shift Breakdown
- Searchable directory of all 88 base academic courses.
- **Explicit Morning vs. Evening Shift Badges:** Every subject clearly indicates whether it is offered in `☀️ Morning Only`, `🌙 Evening Only`, or `☀️ Morning & 🌙 Evening`.
- **Shift-Wise Enrolled Classes:** Distinct morning and evening class groups tagged with high-visibility color-coded badges (`#f59e0b` / `#8b5cf6`).
- **Interactive Subject Sessions Modal:** Click any subject card to inspect its full weekly lecture and lab timetable across all days, times, and classrooms.
- **Multi-Factor Filtering:** Filter courses by Department, Shift (Morning / Evening / Both), Theory/Lab/Online, or keyword search.

### 4. 🏛️ Classroom & Lab Matrix
- Matrix of all 19 lecture halls and specialized computing laboratories.
- Real-time room occupancy and utilization metrics.
- Day-wise room timetable showing which class and teacher is occupying each room at any hour.

### 5. 📈 Academic Statistics & Analytics Dashboard
- High-level KPIs: Total Classes, Weekly Slots, Distinct Courses, Active Faculty.
- Departmental comparison table showing class distributions and shift ratios.
- Semester-wise breakdown across the 4-year degree programs.
- Complete faculty workload distribution table sorted by teaching periods.

### 6. 🌓 Responsive Design & Dark Glassmorphism Theme
- Custom design built with modern Vanilla CSS.
- Sleek dark theme (`#0c0f17` / `#131b2e`) with cyan/teal accents (`#00e5ff` / `#00bfa5`).
- Frosted glassmorphism panels, subtle border glows, and accessible contrast ratios.
- 100% mobile-friendly with responsive drawer navigation and touch gestures.

---

## 🗂️ Project Structure

```
timetable-management/
├── index.html                     # Main Single Page Application interface
├── portal.css                     # Complete design system, responsive styles, dark mode & print CSS
├── app.js                         # Frontend application logic, rendering engines, search, filters & state
├── timetable_data.json            # Consolidated JSON database (1,130 slots, 64 classes, 437 catalog items)
├── timetable-data.js              # Client-ready window.TIMETABLE_DATA bundle for seamless offline/CORS-free execution
├── all_timetables_detailed.json   # Detailed departmental & class breakdown export
├── build_dataset.py               # Robust PDF parsing & data generation pipeline (PyMuPDF engine)
├── README.md                      # Complete system documentation (this file)
│
├── TT BSAI M+E.pdf                # Official Timetable — BS Artificial Intelligence (Morning + Evening)
├── TT BSCS M+E.pdf                # Official Timetable — BS Computer Science (Morning + Evening)
├── TT BSCyberSec M+E.pdf          # Official Timetable — BS Cybersecurity (Morning + Evening)
├── TT BSDS M+E.pdf                # Official Timetable — BS Data Science (Morning + Evening)
├── TT BSIT M+E.pdf                # Official Timetable — BS Information Technology (Morning + Evening)
├── TT BSSE M+E.pdf                # Official Timetable — BS Software Engineering (Morning + Evening)
└── Tentative TT 1st SemAll.pdf    # Official Timetable — 1st Semester All Computing Programs
```

---

## 💾 Data Architecture & JSON Schema

The application is powered by `timetable_data.json` and `timetable-data.js`, structured into clean, normalized entities:

### 1. `metadata` Object
```json
{
  "institution": "Faculty of Computing & Emerging Technologies, Emerson University Multan",
  "session": "Fall 2026",
  "effective_date": "07 September 2026",
  "status": "Tentative Timetable",
  "total_entries": 1130,
  "total_courses": 437,
  "total_unique_classes": 64,
  "generated_at": "2026-09-20"
}
```

### 2. `schedule_entries` Array (1,130 Verified Lecture Slots)
Each entry in `schedule_entries` represents an individual lecture or laboratory period:
```json
{
  "id": 1,
  "department": "Cybersecurity",
  "section": "BSCybSec-3A",
  "semester": "3rd Semester",
  "shift": "Morning Shift",
  "day": "Monday",
  "time": "08:30-09:20",
  "start_time": "08:30",
  "end_time": "09:20",
  "course_code": "COSC-2110",
  "subject": "Software Engineering",
  "teacher": "Engr Mirza Murad Baig",
  "room": "CTB3-19",
  "location": "Botany Block — Upper Floor",
  "credit_hours": "3+0",
  "type": "theory",
  "file": "TT BSCyberSec M+E.pdf",
  "page": 1
}
```

### 3. `course_catalog` Array (437 Course Legend Allocations)
```json
{
  "file": "TT BSCyberSec M+E.pdf",
  "page": 1,
  "department": "Cybersecurity",
  "section": "BSCybSec-3A",
  "semester": "3rd Semester",
  "shift": "Morning Shift",
  "code": "CYSE-2131",
  "title": "Cyber Security",
  "instructor": "Waqas Shah",
  "cr_hrs": "2+1",
  "rooms": "CLab-04 | CLab-06",
  "location": "Lab Block"
}
```

---

## ⚙️ Data Extraction Pipeline (`build_dataset.py`)

The extraction pipeline is built in Python with `PyMuPDF` (`fitz`):
1. **Source Discovery:** Scans all official PDF timetable files in the workspace.
2. **Table & Cell Extraction:** Extracts vector drawings, line segments, coordinate bounds, and word bounding boxes to reconstruct grid cells with 100% boundary accuracy.
3. **Multi-Page Split Table Continuation:** Seamlessly handles course legend tables that split across page breaks (e.g. CyberSec Page 7, CS Page 3, DS Page 8, IT Page 9/11, SE Page 7) without dropping top rows or misallocating banners.
4. **Content Cleaning & Normalization:**
   - Cleans unicode artifacts (`—`, `–`, `·`), whitespace, and parenthetical course markers.
   - Normalizes instructor names and marks unassigned slots as `TO BE ASSIGNED`.
   - Tags `THEORY`, `LAB`, `ONLINE`, and `JUMMAH BREAK` slots explicitly.
5. **Print Engine Optimization:** Powers client-side A4 landscape printing with dedicated weekly schedule grids, course legends, and official university signature lines.
6. **Artifact Output:** Concurrently compiles `timetable_data.json`, `timetable-data.js` (for zero-dependency client execution), and `all_timetables_detailed.json`.

---

## 🚀 Deployment & Running Locally

### Online Access
The portal is continuously deployed to GitHub Pages:
[https://ranaarifdev.github.io/Timetable.EUM.Portal/](https://ranaarifdev.github.io/Timetable.EUM.Portal/)

### Local Usage
No web server or build process is strictly necessary. The application loads data through `timetable-data.js` directly onto `window.TIMETABLE_DATA`, enabling it to run directly by double-clicking `index.html` in any modern web browser or serving via any static file server:
```bash
# Optional local static preview
python -m http.server 8000
```

---

## 📜 License
This project is licensed under the **MIT License**. Created with dedication for the students and faculty of Emerson University Multan.