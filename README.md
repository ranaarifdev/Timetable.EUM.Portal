# Emerson University Multan — Timetable Portal

![Live Site](https://img.shields.io/badge/Live%20Site-Visit%20Now-blue?logo=github)  
![License](https://img.shields.io/badge/License-MIT-green)  
![Version](https://img.shields.io/badge/Version-1.0.0-primary)

### Faculty of Computing & Emerging Technologies · Fall 2026 Session

---

## 📚 Overview

The **Emerson University Multan Timetable Portal** is a sleek, mobile‑first, dark‑theme web application that provides **real‑time, PDF‑derived** class schedules, teacher workloads, classroom assignments, and course catalogs for the Faculty of Computing & Emerging Technologies. All data is extracted directly from the official timetable PDFs—**zero assumptions**, full shift separation, and exact room mapping.

---

## 👨‍💻 Developer & Maintainer

- **Developer:** Muhammad Arif
- **Program:** BS Cybersecurity (7th Semester, Evening Shift)
- **Department:** Department of Cybersecurity, Faculty of Computing & Emerging Technologies
- **University:** Emerson University Multan
- **GitHub:** [@ranaarifdev](https://github.com/ranaarifdev)
- **Repository:** [Timetable.EUM.Portal](https://github.com/ranaarifdev/Timetable.EUM.Portal)

---

## ✨ Features & User Interface

| Feature | Description |
|---|---|
| **📅 Interactive Class‑Wise Timetable** | Filter by department, semester, shift, and section. Dual view: grid (full week) and card list (mobile). Includes official course legend and one‑click PDF/print export. |
| **👨‍🏫 Teacher‑Wise Timetable & Workload Center** | searchable faculty directory, weekly schedule matrix, workload summary, and printable A4 schedule. |
| **📚 Unified Subjects Catalog** | searchable list of 88 base courses with shift badges, theory/lab tags, and multi‑factor filtering. |
| **🏛️ Classroom & Lab Matrix** | real‑time room occupancy, day‑wise matrix, and utilization metrics for 19 rooms/labs. |
| **📈 Academic Statistics & Analytics Dashboard** | KPIs, department comparison, semester breakdown, and faculty workload table. |
| **🌓 Responsive Dark Glassmorphism Theme** | Modern vanilla‑CSS design, frosted glass panels, cyan/teal accents, fully mobile‑friendly. |

---

## 🚀 Installation & Local Development

### Prerequisites

- Modern web browser (Chrome, Edge, Firefox, Safari) with ES6 support.
- *Optional*: Python 3.9+ for data generation scripts.

### Quick Start (no server needed)

1. Clone the repository:
   ```bash
   git clone https://github.com/ranaarifdev/Timetable.EUM.Portal.git
   cd Timetable.EUM.Portal
   ```
2. Open `index.html` directly in a browser **or** serve via a static server:
   ```bash
   python -m http.server 8000
   # then visit http://localhost:8000
   ```
3. The app loads `timetable-data.js` which injects `window.TIMETABLE_DATA` – no additional build steps required.

---

## 🛠️ Project Structure

```
Timetable‑Management/
├── index.html                     # Main SPA entry point
├── portal.css                     # Design system, dark mode, print CSS
├── app.js                         # Front‑end logic, state, filters & rendering
├── timetable_data.json            # Consolidated JSON database (1,130 slots)
├── timetable-data.js              # Client‑ready bundle (window.TIMETABLE_DATA)
├── all_timetables_detailed.json   # Full departmental & class breakdown
├── build_dataset.py               # PDF parsing & data generation pipeline (PyMuPDF)
├── inspect_teachers.py            # Utility to analyze teacher workloads
├── inspect_teachers_full.py       # Extended teacher inspection script
├── inspect_corrupted_catalog.py   # Detects inconsistencies in course legends
├── parse_timetables.py            # Low‑level PDF parsing helpers
├── parsed_raw.json                # Intermediate raw extraction output
├── portal.css                     # Styling (dark glassmorphism theme)
├── README.md                      # Documentation (this file)
├── *.pdf                          # Official timetable PDFs per department
└── university logo .png           # Institutional logo
```

---

## 📊 Data Architecture & JSON Schema

### `metadata`
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

### `schedule_entries` (example)
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
  "teacher": "Engr Mirza Murad Baag",
  "room": "CTB3-19",
  "location": "Botany Block — Upper Floor",
  "credit_hours": "3+0",
  "type": "theory",
  "file": "TT BSCyberSec M+E.pdf",
  "page": 1
}
```

### `course_catalog` (example)
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

1. **Source Discovery** – Scans the workspace for all official timetable PDFs.
2. **Table & Cell Extraction** – Uses `PyMuPDF` to reconstruct vector‑based grid cells with 100 % boundary accuracy.
3. **Multi‑Page Continuation** – Handles course‑legend tables split across pages without losing rows.
4. **Content Cleaning & Normalization** – Removes stray Unicode artifacts, normalizes instructor names, and tags `THEORY`, `LAB`, `ONLINE`, and `JUMMAH BREAK` slots.
5. **Print Engine Optimization** – Generates data structures that power the client‑side A4 landscape print view with official signatures.
6. **Artifact Output** – Produces `timetable_data.json`, `timetable-data.js`, and `all_timetables_detailed.json` for the frontend.

---

## 📂 Utility Scripts

- **`inspect_teachers.py`** – Summarizes each teacher’s weekly periods, distinct classes, and subjects.
- **`inspect_teachers_full.py`** – Detailed per‑teacher schedule view with room and shift breakdown.
- **`inspect_corrupted_catalog.py`** – Detects mismatches or missing entries in the course catalog.
- **`parse_timetables.py`** – Low‑level helpers used by the data pipeline.

---

## 🖥️ Running the Portal

### Online

Visit the live site: [https://ranaarifdev.github.io/Timetable.EUM.Portal/](https://ranaarifdev.github.io/Timetable.EUM.Portal/)

### Local

```bash
# From the project root
python -m http.server 8000  # optional static server
# Then open http://localhost:8000 in your browser
```

The app works by loading `timetable-data.js` which populates `window.TIMETABLE_DATA`; no additional back‑end is required.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repo, create a feature branch, and submit a pull request. Follow the existing code style and ensure any new scripts adhere to the **PDF‑as‑source‑of‑truth** principle.

---

## 📜 License
This project is licensed under the **MIT License**. Created with dedication for the students and faculty of Emerson University Multan.