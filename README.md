# Emerson University Multan — Timetable Portal

![Live Site](https://img.shields.io/badge/Live%20Site-Visit%20Now-blue?logo=github)
![License](https://img.shields.io/badge/License-MIT-green)
![Session](https://img.shields.io/badge/Session-Fall%202026-primary)
![Pages](https://img.shields.io/badge/Portal%20Pages-8-blueviolet)
![PDF Sources](https://img.shields.io/badge/PDF%20Sources-9-orange)

An interactive, PDF-backed timetable portal for the Faculty of Computing & Emerging Technologies at Emerson University Multan.

## Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Current dataset](#current-dataset)
- [Run locally](#run-locally)
- [Updating timetable data](#updating-timetable-data)
- [Project structure](#project-structure)
- [File reference](#file-reference)
- [Data model](#data-model)
- [Maintainer](#maintainer)
- [Online portal](#online-portal)
- [License](#license)

---

## Overview

The portal makes official Fall 2026 timetable data easy to explore on desktop and mobile. It reads the generated `window.TIMETABLE_DATA` bundle in the browser; no backend, database, or build pipeline is needed to use the site.

The source of truth is the official timetable PDFs. The extraction pipeline converts them into structured schedule, course, teacher, and room records for the user interface.

---

## Features

### 🏠 Home dashboard

- Displays live dataset totals (unique classes, morning/evening counts, faculty, subjects, rooms, course offerings, departments).
- Provides six quick-access cards for direct navigation to all portal tools.
- Shows a timetable-entry color key (Theory, Lab, Online, Unassigned, Jummah Break).
- Identifies the Fall 2026 session and tentative timetable status.

### 👨‍🏫 Teacher-wise timetable

- **Search** faculty by name or choose from a populated dropdown of all teachers.
- **Filter** by day, shift, and live availability status (Free / In Lecture).
- **Faculty profile card** shows:
  - Live availability status with real-time pulse indicator.
  - Weekly periods, classes taught, unique subjects, course offerings, rooms, morning/evening slot counts.
  - Active lecture details (subject, room, time remaining) when the teacher is busy.
  - Next upcoming lecture info when the teacher is free.
  - Direct inline print button.
- **Official-format timetable table** with day, time, code, subject, section, semester, shift, room, type columns.
- **Campus classroom & laboratory locations table** showing rooms used, building locations, subjects/sections, and period counts.
- **Faculty live availability bar** with real-time free/busy counts across all faculty.
- **Print** the selected faculty timetable in an official A4 PDF-ready format with header, metadata, lecture grid, room locations, and footer.
- **Live status filter** to show only faculty who are Free Right Now or In Lecture Now.

### 🎓 Class-wise timetable

- **Department tab bar** for switching between all six departments (Cybersecurity, IT, Data Science, SE, CS, AI).
- **Shift tab bar** with All Shifts, Morning Shift, and Evening Shift quick-toggle buttons.
- **Filters** for semester, section, shift, day, and keyword search (course, teacher, room).
- **Weekly grid view** showing the full Monday–Friday timetable with time slots as rows and days as columns.
- **Mobile-friendly list/card view** with day-grouped entries showing time, subject, teacher, room, and type badges.
- **Shift section dividers** — Morning, Evening, and MS/M.Phil programs are visually separated with color-coded headers.
- **Course allocations & legend table** below each class grid showing code, course title, instructor, credit hours, room(s), and building location.
- **Program timetable printing** in official A4 format with one page per class group.

### 📅 Live schedule

- **Today's Schedule** — shows today's classes using the browser's current weekday; displays weekend message on Saturday/Sunday.
- **Day Wise** — select any weekday to view its full schedule.
- **Shift Wise** — view all five days grouped by Morning and Evening shifts.
- **Filters** for department and shift.
- **Morning/Evening split** — each day's results are separated into Morning and Evening sub-tables.
- **Print** the currently displayed schedule table.

### 📚 Subjects catalog

- **Search** by course title or course code.
- **Filter** by department, shift (Morning Only / Evening Only / Both), and class type (Theory, Lab, Online).
- **Subject cards** display:
  - Course code and credit hours.
  - Shift availability badge (Morning Only, Evening Only, Morning & Evening).
  - Morning and evening class listings with section badges.
  - Faculty, department, rooms, and type badges.
- **Subject detail modal** with:
  - Complete shift breakdown (Morning vs Evening classes).
  - Department, faculty, classrooms, total periods summary.
  - Full scheduled lecture & lab periods table (day, time, shift, class, semester, type, teacher, room).

### 🏫 Rooms and labs

- **Building location map** showing CTB1 (Old Building Upper Floor), CTB2 (Ground Floor), CTB3 (Botany Block Upper), CLab (Lab Block), and Online.
- **Live room status bar** with real-time system clock, free/busy room counts, and pulse indicators.
- **Search** rooms by identifier or building location.
- **Filter** by live occupancy (Free Now / In Lecture), room type (Classrooms CTB / Labs CLab / Online), and day.
- **Room cards** showing:
  - Live status with pulse indicator and badge.
  - Active lecture details (section, subject, time) or next lecture info.
  - Building location, subject count, weekly slots, classes using the room, faculty count, active days.
  - "View Full Weekly Schedule" button.
- **Room weekly schedule modal** with:
  - Live status badge and building location.
  - Summary (current status message, total scheduled periods, number of classes).
  - Full Monday–Friday weekly grid table.
  - Print room schedule button.

#### 🔍 Free Room & Lab Finder

- **Time-wise availability checker** tool embedded in the Rooms section.
- **Cascading dropdowns** — select a day, then choose from auto-populated time slots for that day.
- **Check Availability** button scans all timetable entries for overlap.
- **Results display** with:
  - Summary showing free and occupied room counts.
  - Two-column layout — Available rooms with locations, Occupied rooms with section/subject/teacher details.
  - Print Available Rooms button for an A4 report.

### 📊 Statistics and detail tools

- **Overall Counts** — departments, unique classes, morning/evening, sections, semesters, faculty, subjects, course codes, rooms, total offerings, weekly periods.
- **Entry Type Breakdown** — theory, lab, online, unassigned, jummah counts with colored values.
- **Shift Distribution** — morning vs evening class counts with percentages.
- **Department-Wise Breakdown table** — unique classes, morning/evening, faculty, subjects, weekly slots per department.
- **Semester-Wise Breakdown table** — unique classes, morning/evening, weekly periods per semester.
- **Teacher-Wise Load table (Top 25)** — rank, name, weekly periods, unique subjects, classes, course offerings, morning/evening, departments.

### 🔔 Modals and interactive elements

- **Course Details Modal** — opens on any timetable entry click; shows department, class, semester/shift, time/day, instructor, room/block, credit hours, source PDF document and page.
- **Room Schedule Modal** — weekly grid for a single room with live status, print button.
- **Subject Details Modal** — full shift breakdown, lecture/lab periods table.
- **Escape key** closes all modals; clicking overlay background also closes.
- **Global click delegation** on `[data-entry-id]` elements for seamless modal opening.

### 🖨️ Print engine (5 modes)

1. **Print Faculty Timetable** — official A4 format with university header, faculty metadata, day-wise lecture table, campus room locations table, signature lines, and footer.
2. **Print Program/Class Timetable** — one page per class group with weekly grid, course allocations table, and signature lines.
3. **Print Schedule View** — prints the currently displayed schedule table with header and filters metadata.
4. **Print Room Schedule** — single room weekly occupancy grid with building info and statistics.
5. **Print Available Rooms Report** — list of free rooms for a selected day/time with numbered rows, building locations, and status badges.

### 🎨 Interface and accessibility

- Responsive dark glassmorphism interface designed for desktop and mobile screens.
- Keyboard-friendly buttons, labelled controls, semantic navigation, and modal `role="dialog"` attributes.
- Print-specific layouts for A4 timetable reports with `@media print` styles.
- Google Fonts (Inter, JetBrains Mono) for modern typography.
- Auto real-time refresh timer (every 15 seconds) for room and teacher live status views.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFFICIAL TIMETABLE PDFs                       │
│         9 PDF files (61 pages) — Source of Truth                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │ build_dataset │   Python + PyMuPDF (fitz)
                    │     .py       │   PDF → Structured Data
                    └──┬────┬────┬──┘
                       │    │    │
        ┌──────────────┘    │    └──────────────┐
        ▼                   ▼                   ▼
  timetable_data    timetable-data     all_timetables
     .json               .js           _detailed.json
  (canonical)     (browser bundle)    (dept breakdown)
                        │
                        ▼
              ┌─────────────────────┐
              │     index.html      │   Single-page portal
              │     portal.css      │   Dark glassmorphism UI
              │       app.js        │   Client-side rendering
              └─────────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │   Browser (client)  │
              │  No backend needed  │
              └─────────────────────┘
```

---

## Current dataset

The current Fall 2026 dataset was generated on **27 September 2026** from **9 official timetable PDFs**.

| Item | Total |
| --- | ---: |
| Class/shift schedules | 69 |
| Timetable entries | 1,160 |
| Course catalog records | 454 |
| MS programme schedules | 5 |

The MS programmes are `MSCybSec-1A`, `MSIT-1A`, `MSCS-3A`, `MSCybSec-3A`, and `MSIT-3A`. The dataset also contains the updated two-year BSIT timetable and the BSSE evening schedules.

---

## Official PDF source register

All generated timetable records retain their originating PDF filename and page number. The following files are the official source documents currently stored in the project root.

| PDF file | Pages | Programme coverage | Extracted entries |
| --- | ---: | --- | ---: |
| `MS or  m -phill  classes  TT.pdf` | 3 | MS Cybersecurity, MS Information Technology, MS Computer Science | 41 |
| `TT  BS 1st Semester All classes.pdf` | 7 | First-semester AI, CS, IT, Cybersecurity, Data Science, and Software Engineering | 120 |
| `TT BSAI M+E updated.pdf` | 8 | BS Artificial Intelligence, morning and evening | 154 |
| `TT BSCS M+E updated.pdf` | 8 | BS Computer Science, morning and evening | 180 |
| `TT BSCyberSec M+E.pdf` | 7 | BS Cybersecurity, morning and evening | 131 |
| `TT BSDS M+E updated.pdf` | 8 | BS Data Science, morning and evening | 154 |
| `TT BSIT M+E updated.pdf` | 11 | BS Information Technology, morning and evening | 224 |
| `TT BSSE M+E updated.pdf` | 8 | BS Software Engineering, morning and evening | 136 |
| `updated BSIT 2yearTT.pdf` | 2 | Two-year BSIT, 3rd semester morning section | 20 |

The source set contains **61 pages** and produces the 1,160 timetable entries in the current dataset. PDF files are tracked as the timetable source of truth; replace them only with the corresponding official revised documents before running `python build_dataset.py`.

---

## Run locally

### Requirements

- A modern browser (Chrome, Edge, Firefox, or Safari).
- Python 3.9+ only when regenerating timetable data or running a local static server.

### Open the portal

You can open `index.html` directly, or start a local static server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

---

## Updating timetable data

1. Put the official timetable PDFs in the project root.
2. Run the extraction pipeline:

   ```bash
   python build_dataset.py
   ```

3. Verify the generated files and reload the portal.

The script reads all PDFs and regenerates:

- `timetable_data.json` — canonical timetable data used for validation and reuse.
- `timetable-data.js` — browser-ready bundle that assigns `window.TIMETABLE_DATA`.
- `all_timetables_detailed.json` — department and class-level schedule breakdown.

The extractor recognizes the regular programme timetable layout as well as the separate MS and two-year BSIT layouts. It also handles the wrapped BSSE evening headers in the official document.

---

## Project structure

```text
Timetable.EUM.Portal/
│
├── index.html                         # Single-page portal markup (668 lines)
├── portal.css                         # Full responsive design system (74 KB)
├── app.js                             # Client-side application logic (3,118 lines)
├── timetable-data.js                  # Generated browser data bundle (window.TIMETABLE_DATA)
│
├── build_dataset.py                   # Primary PDF-to-dataset pipeline (635 lines)
├── parse_timetables.py                # Low-level PDF table extraction helper (172 lines)
├── extract_pdfs.py                    # Raw PDF text extraction utility (35 lines)
│
├── audit.py                           # Data audit — verifies entries against official PDFs (131 lines)
├── inspect_teachers.py                # Teacher workload inspection utility (30 lines)
├── inspect_teachers_full.py           # Full teacher/instructor listing utility (20 lines)
├── inspect_corrupted_catalog.py       # Course catalog consistency checker (17 lines)
├── view_pdfs.py                       # Extracted PDF text viewer utility (12 lines)
│
├── timetable_data.json                # Generated canonical timetable dataset
├── all_timetables_detailed.json       # Generated detailed department/class schedules
├── parsed_raw.json                    # Intermediate extraction data
├── pdf_extracted.json                 # Raw PDF text extraction output
├── pdf_content.txt                    # PDF text content dump
│
├── *.pdf                              # 9 official Fall 2026 timetable source PDFs
├── university logo .png               # University visual asset
├── .gitignore                         # Editor, Python cache, environment exclusions
└── README.md                          # This documentation
```

---

## File reference

### `index.html` — Portal markup (668 lines)

Single-page application with all section containers, navigation, modals, and structural elements.

**Sections:**
- **Site Header** — university branding, session badge (Fall 2026, w.e.f. 07 Sep 2026).
- **Main Navigation** (`#mainNav`) — 8 navigation buttons: Home, Teacher Wise, Class Wise, Schedule, Subjects, Rooms, Statistics, About.
- **Home Section** (`#sectionHome`) — hero banner, stats grid, quick-access cards, entry legend.
- **Teacher Wise Section** (`#sectionTeacher`) — search/select controls, day/shift/live-status filters, live availability bar, profile card, results area.
- **Class Wise Section** (`#sectionClass`) — department tab bar, shift tabs, semester/section/shift/day/keyword filters, grid/list view toggle, results area.
- **Schedule Section** (`#sectionSchedule`) — sub-tabs (Today / Day Wise / Shift Wise), department/shift/day filters, results area.
- **Subjects Section** (`#sectionSubjects`) — search/department/shift/type filters, results area.
- **Rooms Section** (`#sectionRooms`) — building map, live status bar, search/live-filter/type/day filters, free room finder panel, room matrix area.
- **Statistics Section** (`#sectionStatistics`) — overall grid, type grid, shift grid, department/semester/teacher tables.
- **About Section** (`#sectionAbout`) — university info, faculty info, session info, data source, developer card, color key.
- **Footer** — copyright, developer credit, data source note.
- **Modals:**
  - `#courseModal` — course/entry details.
  - `#roomModal` — room weekly schedule with print button.
  - `#subjectModal` — subject details and all scheduled sessions.
- **Print Container** (`#printArea`) — dedicated div for print engine output.

---

### `app.js` — Client-side application (3,118 lines)

Self-contained IIFE with all portal logic. No external dependencies beyond the `TIMETABLE_DATA` global.

#### Data layer (lines 11–17)

| Constant | Source | Description |
| --- | --- | --- |
| `RAW` | `window.TIMETABLE_DATA` | Root data object |
| `ENTRIES` | `RAW.schedule_entries` | Array of all timetable entries |
| `ALL_TEACHERS` | `RAW.teachers` | Sorted unique teacher name list |
| `ALL_DEPTS` | `RAW.departments` | Ordered department name list |
| `CATALOG` | `RAW.course_catalog` | Course allocation records |

#### Utility functions

| Function | Lines | Description |
| --- | --- | --- |
| `esc(str)` | 33–41 | HTML-escapes special characters (`&`, `<`, `>`, `"`, `'`) |
| `getSubjectBaseKey(e)` | 44–53 | Normalizes subject identity — strips `(LAB)` suffixes from codes/names to unify theory + lab entries |
| `cleanSubjectTitle(title)` | 55–58 | Removes `(LAB)` and ` LAB` suffixes from display titles |
| `getType(e)` | 60–73 | Classifies an entry as `theory`, `lab`, `online`, `unassigned`, or `jummah` based on subject, code, room, and teacher fields |
| `typeLabel(t)` | 75–83 | Maps type string to display label (`THEORY`, `LAB`, `ONLINE`, `TBA`, `JUMMAH`) |
| `shiftShort(s)` | 85–87 | Returns `☀️ Morning` or `🌙 Evening` |
| `shiftBadgeCls(s)` | 89–91 | Returns CSS class `bdg-morning` or `bdg-evening` |
| `getLocation(room)` | 93–102 | Maps room prefix to building location string |

#### Time & real-time engine (lines 104–286)

| Function | Lines | Description |
| --- | --- | --- |
| `parseSingleTime(s)` | 105–113 | Parses `HH:MM` to total minutes; auto-converts 1:00–7:00 to PM (13:00–19:00) |
| `parseSlotTime(timeStr)` | 115–127 | Parses `HH:MM-HH:MM` range to `{start, end}` in minutes |
| `formatMinutesToTime(totalMins)` | 129–137 | Converts total minutes back to `H:MM AM/PM` string |
| `fmtSlotLabel(raw)` | 139–143 | Formats raw time slot to readable `H:MM AM – H:MM PM` |
| `getLiveSystemInfo()` | 145–162 | Returns current day, time, weekday status, formatted time strings |
| `getRoomLiveStatus(roomName)` | 164–225 | Computes real-time room occupancy — returns `{status, current, next, badgeText, message}` |
| `getTeacherLiveStatus(teacherName)` | 227–286 | Computes real-time teacher availability — returns `{status, current, next, badgeText, message}` |

#### Navigation (lines 288–322)

| Function | Lines | Description |
| --- | --- | --- |
| `navigateTo(key)` | 303–316 | Switches active section, triggers lazy rendering for statistics/subjects/rooms |

#### Course details modal (lines 324–516)

| Function | Lines | Description |
| --- | --- | --- |
| `openCourseModal(e)` | 332–381 | Renders and opens the course detail modal with full metadata grid |
| `closeCourseModal()` | 383–388 | Hides modal and restores scroll |

#### Room schedule modal (lines 397–497)

| Function | Lines | Description |
| --- | --- | --- |
| `openRoomModal(roomName)` | 405–483 | Builds weekly grid for a room with live status, opens modal |
| `closeRoomModal()` | 485–490 | Hides room modal |

#### Home section (lines 518–561)

| Function | Lines | Description |
| --- | --- | --- |
| `buildHomeStats()` | 521–561 | Calculates and renders 8 stat cards (unique classes, morning/evening, faculty, subjects, rooms, offerings, departments) |

#### Teacher Wise section (lines 563–779)

| Function | Lines | Description |
| --- | --- | --- |
| `initTeacherDropdown()` | 578–585 | Populates teacher `<select>` dropdown from ENTRIES |
| `renderTeacherView()` | 587–703 | Main render — filters entries, computes live stats bar, renders profile or filtered results table |
| `renderTeacherProfile(teacher, entries)` | 705–752 | Builds detailed faculty profile card with avatar, live status, stats grid, teaching sections |

#### Class Wise section (lines 781–1240)

| Function | Lines | Description |
| --- | --- | --- |
| `initDeptTabs()` | 830–855 | Creates department tab buttons from available departments |
| `updateClassFilters()` | 857–870 | Populates semester and section dropdowns based on active department and shift |
| `renderClassWise()` | 872–999 | Main render — groups entries by section+shift, separates BS Morning/Evening/MS, renders grids or list views |
| `buildWeeklyGrid(entries, section, shift)` | 1003–1105 | Builds full Monday–Friday weekly timetable grid table with course legend |
| `getSectionCourses(entries, section, shift)` | 1107–1128 | Retrieves course allocations from CATALOG or derives them from entries |
| `buildClassListView(entries, section, shift)` | 1131–1226 | Builds mobile-friendly card/list view grouped by day |

#### Schedule section (lines 1242–1421)

| Function | Lines | Description |
| --- | --- | --- |
| `initSchedule()` | 1248–1290 | Initializes department dropdown, detects today, sets up sub-tab listeners |
| `renderSchedule()` | 1292–1349 | Filters and renders schedule based on active sub-tab (today/daywise/shiftwise) |
| `renderTableMarkup(dayEntries)` | 1352–1382 | Builds a data table for a set of schedule entries |
| `buildDayTable(entries, daysToShow)` | 1384–1421 | Builds day-grouped tables with Morning/Evening sub-sections |

#### Subject sessions modal (lines 1423–1548)

| Function | Lines | Description |
| --- | --- | --- |
| `openSubjectModal(subjectObj)` | 1431–1534 | Renders subject detail modal with shift breakdown, metadata, and full sessions table |
| `closeSubjectModal()` | 1536–1541 | Hides subject modal |

#### Subjects section (lines 1550–1742)

| Function | Lines | Description |
| --- | --- | --- |
| `renderSubjects()` | 1553–1742 | Builds subject map from ENTRIES, renders filterable subject cards with shift indicators, attaches modal click events |

#### Rooms section (lines 1744–2081)

| Function | Lines | Description |
| --- | --- | --- |
| `renderRooms()` | 1747–1887 | Builds room map, computes live status for each room, renders room cards with filters |
| `initFreeRoomFinder()` | 1891–2080 | Initializes cascading day→time dropdowns, overlap-based availability check, renders free/occupied room results |

#### Statistics section (lines 2083–2305)

| Function | Lines | Description |
| --- | --- | --- |
| `renderStatistics()` | 2086–2305 | Computes all statistics from ENTRIES — overall counts, type breakdown, shift distribution, department table, semester table, teacher workload table (top 25) |

#### Auto real-time refresh (lines 2307–2313)

- `setInterval` at 15 seconds refreshes room and teacher views when active.

#### Print engine (lines 2315–3101)

| Function | Lines | Description |
| --- | --- | --- |
| `printDocHeader(mainTitle, subTitle, metaItems)` | 2325–2346 | Generates print document header with university branding and metadata |
| `printDocFooter()` | 2348–2354 | Generates print document footer |
| `buildPrintGrid(entries, section, shift, dept)` | 2356–2479 | Builds print-ready weekly grid with course allocations and signature rows |
| `formatPrintDateTime(d)` | 2481–2494 | Formats date/time for print headers |
| `buildTeacherOfficialPrintTable(tEntries, teacher)` | 2497–2635 | Builds official-format teacher timetable for printing — header, lecture table, room locations, footer |
| `buildTeacherOfficialTable(tEntries, teacher)` | 2637–2760 | Builds on-screen official-format teacher table (web version with clickable entries) |
| `buildPrintTable(entries, columns)` | 2762–2770 | Generic print table builder with configurable columns |
| `triggerPrint(htmlContent)` | 2772–2782 | Injects content into print area, triggers `window.print()`, cleans up after 1.5s |
| `printTeacherWise(specificTeacher)` | 2785–2810 | Print handler for teacher timetable — validates selection, builds content, triggers print |
| `printClassWise()` | 2813–2885 | Print handler for class/program timetable — one page per class group |
| `printScheduleView()` | 2888–2915 | Print handler for schedule section — captures displayed content |
| `printRoomSchedule(roomName)` | 2918–2988 | Print handler for single room weekly schedule |
| `printAvailableRooms()` | 2991–3079 | Print handler for available rooms report from free room finder |
| `initPrintButtons()` | 3082–3101 | Wires up all print button click listeners |

#### Initialization (lines 3103–3116)

| Function | Lines | Description |
| --- | --- | --- |
| `init()` | 3106–3112 | Calls `buildHomeStats()`, `initTeacherDropdown()`, `initDeptTabs()`, `initPrintButtons()`, `navigateTo('home')` |

---

### `portal.css` — Design system (74 KB)

Complete responsive CSS with:
- **CSS custom properties** for colors, spacing, radii, typography (Inter, JetBrains Mono).
- **Dark glassmorphism theme** with glass card effects, gradient backgrounds, and `backdrop-filter`.
- **Component styles** — header, navigation, hero banner, stat cards, control panels, data tables, timetable grids, badges, modals, room cards, subject cards, building map, legends.
- **Live status styles** — pulse-dot animations, free/busy pill indicators.
- **Free Room Finder panel** styles with controls, result columns, room chips.
- **Teacher profile** and official format table styles.
- **Print-specific styles** — `@media print` rules for A4 output, print headers/footers, signature rows, course allocation tables, room location tables.
- **Responsive breakpoints** for mobile and tablet layouts.

---

### `build_dataset.py` — PDF extraction pipeline (635 lines)

The primary data generation script. Reads all official timetable PDFs using PyMuPDF and produces the complete dataset.

**Dependencies:** `fitz` (PyMuPDF), `glob`, `json`, `re`

#### Constants & configuration

| Name | Description |
| --- | --- |
| `DAYS` | Weekday list `['Monday', ..., 'Friday']` |
| `DEPT_MAP` | Maps PDF filenames to department names |
| `SEM1_DEPT_MAP` | Maps 1st-semester section names to departments |
| `SPECIAL_TIMETABLES` | Hard-coded timetable data for non-standard PDF layouts (2-year BSIT) |

#### Functions

| Function | Lines | Description |
| --- | --- | --- |
| `add_special_entry(entries, item, day, start, code, index)` | 66–83 | Appends one timetable cell from a non-standard official PDF layout (special/MS timetables) |
| `add_ms_timetables(entries, catalog)` | 85–118 | Imports the five MS grids from the official MS timetable PDF with per-section course lists and slot placements |
| `clean_text(s)` | 120–124 | Normalizes Unicode replacement chars and whitespace |
| `normalize_teacher_name(name)` | 126–134 | Normalizes teacher names — handles TBA, XYZ, None variants; fixes casing for known names |
| `is_valid_course_code(code)` | 136–148 | Validates course code format (e.g., `COSC-2108`) — rejects headers, time strings, overly long values |
| `extract_all_timetables()` | 150–633 | **Main pipeline** — performs the full extraction workflow: |

**`extract_all_timetables()` workflow:**

1. **PDF Discovery** — finds all `*.pdf` files, skips special-layout PDFs.
2. **Banner Discovery** — scans each PDF page for section header patterns (`Section-Semester-Shift`), handles both standard and wrapped BSSE heading variants.
3. **Course Legend Extraction** — finds course allocation tables (code, title, instructor, credit hours, room, location) and associates them with the active banner section.
4. **Grid Row Extraction** — detects horizontal/vertical line segments to identify grid structure, finds time-slot rows, extracts cell content for each day column.
5. **Cell Parsing** — extracts course code, subject, teacher, and room from cell text; resolves incomplete cells against the course catalog.
6. **Entry Type Classification** — classifies each entry as theory, lab, online, unassigned, or jummah.
7. **Special Timetables** — adds 2-year BSIT and MS programme entries from hard-coded data.
8. **Output Generation** — writes `timetable_data.json`, `timetable-data.js`, and `all_timetables_detailed.json`.

---

### `parse_timetables.py` — Low-level table extractor (172 lines)

Alternative/legacy extraction helper that uses PyMuPDF's `page.find_tables()` API.

**Dependencies:** `fitz`, `glob`, `json`, `re`

| Function | Lines | Description |
| --- | --- | --- |
| `clean_str(s)` | 5–9 | Cleans Unicode characters and whitespace |
| `extract_all()` | 11–168 | Extracts timetable data using PyMuPDF table finder; uses `known_section_maps` for PDFs with merged headers; outputs `all_timetables_detailed.json` |

Contains hard-coded `known_section_maps` for section-to-page mapping across AI, CS, CyberSec, IT, SE, and 1st Semester PDFs.

---

### `extract_pdfs.py` — Raw text extraction (35 lines)

Simple utility to extract raw text from all 9 official PDFs and save to `pdf_extracted.json`.

| Function | Description |
| --- | --- |
| `clean(s)` | Basic Unicode cleaning |
| Main loop | Opens each PDF with PyMuPDF, extracts page text, saves to JSON |

**Output:** `pdf_extracted.json`

---

### `audit.py` — Data audit script (131 lines)

Comprehensive audit tool that verifies extracted timetable data against known official PDF contents.

**Checks performed:**
- Section audit — lists all unique sections with entry counts.
- BSAI-5A course code verification.
- Linear Algebra instructor checks (BSAI-5A, BSAI-5B).
- Lab room assignments (BSAI-3A).
- Data Structures code verification (BSCS-3A, BSCybSec-3A).
- CYSE course codes (BSCybSec-5A).
- BSIT section completeness (5C, 5D, 5E, 8A).
- MS section presence.
- BSDS section coverage.
- BSSE section coverage.
- Teacher name normalization (xyz removal).
- BSAI-7A course code audit (Morning + Evening).
- BSCS-7A course code audit.
- BSSE-3A Evening course codes.
- BSIT 2-year programme audit.

---

### `inspect_teachers.py` — Teacher inspection (30 lines)

Utility to inspect specific teacher entries and catalog records.

| Function | Description |
| --- | --- |
| `show_t(name)` | Prints all schedule entries and catalog entries for a given teacher name |

Pre-configured queries: Rabia, Rabia Tariq, Farzeen Khan, Muhammad Aqib, Malik Muhammad Aqib, Wajahat, Sadia Parveen, Sadia Ramzan, Zia Ur Rehman Zia.

---

### `inspect_teachers_full.py` — Full teacher listing (20 lines)

Lists all unique teacher names in schedule entries and all unique instructor names in the course catalog with occurrence counts.

---

### `inspect_corrupted_catalog.py` — Catalog checker (17 lines)

Scans the course catalog for corrupted instructor fields — detects entries containing dashes, room identifiers, or overly long values that indicate parsing errors.

---

### `view_pdfs.py` — PDF text viewer (12 lines)

Reads `pdf_extracted.json` and prints the first 4,000 characters of each page for manual inspection.

---

## Data model

### Schedule entry

Each timetable entry in `schedule_entries` contains:

| Field | Type | Description |
| --- | --- | --- |
| `id` | int | Sequential entry identifier |
| `department` | string | Department name (e.g., "Cybersecurity") |
| `section` | string | Class section (e.g., "BSCS-3A", "MSCybSec-1A") |
| `semester` | string | Semester label (e.g., "3rd Semester", "1st Semester (MS)") |
| `shift` | string | "Morning Shift" or "Evening Shift" |
| `day` | string | Weekday name (Monday–Friday) |
| `time` | string | Time range (e.g., "08:30-09:20") |
| `start_time` | string | Start time (e.g., "08:30") |
| `end_time` | string | End time (e.g., "09:20") |
| `course_code` | string | Official course code (e.g., "COSC-2108") or "BREAK" |
| `subject` | string | Course/subject title |
| `teacher` | string | Faculty name or "TO BE ASSIGNED" |
| `room` | string | Room identifier (e.g., "CTB1-01", "CLab-05", "Online") |
| `location` | string | Building location description |
| `credit_hours` | string | Credit hours (e.g., "3+0", "2+1") |
| `type` | string | Entry type: `theory`, `lab`, `online`, `unassigned`, `jummah` |
| `file` | string | Source PDF filename |
| `page` | int | Source PDF page number |

### Course catalog entry

Each record in `course_catalog` contains:

| Field | Type | Description |
| --- | --- | --- |
| `file` | string | Source PDF filename |
| `page` | int | Source PDF page number |
| `department` | string | Department name |
| `section` | string | Class section |
| `semester` | string | Semester label |
| `shift` | string | Shift designation |
| `code` | string | Course code |
| `title` | string | Course title |
| `instructor` | string | Faculty name |
| `cr_hrs` | string | Credit hours |
| `rooms` | string | Room identifier(s) |
| `location` | string | Building location |

### Data bundle metadata

```json
{
  "institution": "Faculty of Computing & Emerging Technologies, Emerson University Multan",
  "session": "Fall 2026",
  "effective_date": "07 September 2026",
  "status": "Tentative Timetable",
  "total_entries": 1160,
  "total_courses": 454,
  "total_unique_classes": 69,
  "generated_at": "2026-09-27"
}
```

### Entry types

| Type | Description |
| --- | --- |
| `theory` | Regular classroom lecture (assigned teacher, CTB room) |
| `lab` | Laboratory practical session (CLab room or subject contains "LAB") |
| `online` | Virtual/remote class (room is "Online") |
| `unassigned` | Teacher field is empty or "TO BE ASSIGNED" |
| `jummah` | Friday prayer break (no class) |

### Room locations

| Prefix | Building | Description |
| --- | --- | --- |
| `CTB1` | Old Building — Upper Floor | Rooms CTB1-01 to CTB1-08 |
| `CTB2` | Old Building — Ground Floor | Rooms CTB2-09 to CTB2-15 |
| `CTB3` | Botany Block — Upper Floor | Rooms CTB3-16 to CTB3-23 |
| `CLab` | Lab Block | Labs CLab-01 to CLab-06 |
| `Online` | Virtual Classroom | Remote/online classes |

---

## Maintainer

- **Developer:** Muhammad Arif
- **Program:** BS Cybersecurity (7th Semester, Evening Shift)
- **Department:** Department of Cybersecurity, Faculty of Computing & Emerging Technologies
- **University:** Emerson University Multan
- **GitHub:** [@ranaarifdev](https://github.com/ranaarifdev)
- **Repository:** [Timetable.EUM.Portal](https://github.com/ranaarifdev/Timetable.EUM.Portal)

## Online portal

[ranaarifdev.github.io/Timetable.EUM.Portal](https://ranaarifdev.github.io/Timetable.EUM.Portal/)

## License

MIT License. Created for the students and faculty of Emerson University Multan.
