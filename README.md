# Emerson University Multan — Timetable Portal

![Live Site](https://img.shields.io/badge/Live%20Site-Visit%20Now-blue?logo=github)
![License](https://img.shields.io/badge/License-MIT-green)
![Session](https://img.shields.io/badge/Session-Fall%202026-primary)

An interactive, PDF-backed timetable portal for the Faculty of Computing & Emerging Technologies at Emerson University Multan.

## Contents

- [Overview](#overview)
- [Features](#features)
- [Current dataset](#current-dataset)
- [Run locally](#run-locally)
- [Updating timetable data](#updating-timetable-data)
- [Project structure](#project-structure)
- [Maintainer](#maintainer)

## Overview

The portal makes official Fall 2026 timetable data easy to explore on desktop and mobile. It reads the generated `window.TIMETABLE_DATA` bundle in the browser; no backend, database, or build pipeline is needed to use the site.

The source of truth is the official timetable PDFs. The extraction pipeline converts them into structured schedule, course, teacher, and room records for the user interface.

## Features

### Home dashboard

- Displays live dataset totals and a timetable-entry color key.
- Provides direct navigation to all portal tools.
- Identifies the Fall 2026 session and tentative timetable status.

### Teacher-wise timetable

- Search faculty by name or choose from the teacher list.
- Filter by day, shift, and live availability status.
- View a faculty profile, weekly lectures, rooms, subjects, and workload summary.
- Shows real-time faculty availability calculated from the current day and time.
- Prints the selected faculty timetable or filtered faculty results.

### Class-wise timetable

- Browse by department, semester, section, morning/evening shift, day, or keyword.
- Keeps morning, evening, and MS graduate schedules clearly separated.
- Uses weekly grid and mobile-friendly card/list views.
- Shows course legends with instructor, credit hours, room, and location details.
- Supports program timetable printing.

### Live schedule

- Shows today's classes using the current weekday.
- Includes Today, Day Wise, and Shift Wise views.
- Filters results by department and shift.
- Prints the active schedule table.

### Subjects catalog

- Searches by course title or course code.
- Filters by department, shift, and class type (theory, lab, online, and unassigned).
- Opens a subject detail view with all scheduled sessions and shift breakdowns.

### Rooms and labs

- Searches rooms by identifier or building location.
- Filters by current status, room type, and day.
- Shows live free/busy room counts derived from timetable entries.
- Opens each room's weekly schedule and prints it.
- Includes a free-room finder that scans availability for a selected day and time slot.

### Statistics and detail tools

- Calculates overall, class-type, and shift statistics directly from the data bundle.
- Provides department, semester, and faculty workload tables.
- Opens detailed course, room, and subject modals from timetable results.
- Includes print-ready views for class, teacher, schedule, and room reports.

### Interface and accessibility

- Responsive dark glassmorphism interface designed for desktop and mobile screens.
- Keyboard-friendly buttons, labelled controls, semantic navigation, and modal dialog attributes.
- Print-specific layouts for A4 timetable reports.

## Current dataset

The current Fall 2026 dataset was generated on **27 September 2026** from **9 official timetable PDFs**.

| Item | Total |
| --- | ---: |
| Class/shift schedules | 69 |
| Timetable entries | 1,160 |
| Course catalog records | 454 |
| MS programme schedules | 5 |

The MS programmes are `MSCybSec-1A`, `MSIT-1A`, `MSCS-3A`, `MSCybSec-3A`, and `MSIT-3A`. The dataset also contains the updated two-year BSIT timetable and the BSSE evening schedules.

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

## Project structure

```text
Timetable.EUM.Portal/
├── index.html                       # Single-page portal markup and all view containers
├── portal.css                       # Responsive design, live status, modal, and print styles
├── app.js                           # Client-side filtering, rendering, modals, live status, printing
├── timetable-data.js                # Generated browser data bundle (window.TIMETABLE_DATA)
├── timetable_data.json              # Generated consolidated timetable dataset
├── all_timetables_detailed.json     # Generated detailed department/class schedules
├── build_dataset.py                 # PDF-to-dataset generation pipeline using PyMuPDF
├── parse_timetables.py              # Low-level PDF table extraction helper
├── inspect_teachers.py              # Teacher workload inspection utility
├── inspect_teachers_full.py         # Detailed teacher schedule inspection utility
├── inspect_corrupted_catalog.py     # Course catalog consistency inspection utility
├── parsed_raw.json                  # Intermediate extraction data
├── *.pdf                            # Official Fall 2026 timetable sources
├── university logo .png             # University visual asset
├── .gitignore                       # Editor, Python cache, environment exclusions
└── README.md                        # Project documentation
```

## Data model

Each schedule entry includes the department, section, semester, shift, day, time range, course, subject, teacher, room, location, credit hours, entry type, source PDF, and page. This preserves traceability from every portal entry back to its official timetable document.

Entry types include `theory`, `lab`, `online`, `unassigned`, and `jummah`.

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
