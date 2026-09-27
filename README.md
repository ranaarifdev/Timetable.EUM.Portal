# Emerson University Multan — Timetable Portal

![Live Site](https://img.shields.io/badge/Live%20Site-Visit%20Now-blue?logo=github)
![License](https://img.shields.io/badge/License-MIT-green)
![Session](https://img.shields.io/badge/Session-Fall%202026-primary)

Faculty of Computing & Emerging Technologies · Fall 2026

## Overview

This mobile-first timetable portal presents the official class schedules, teacher workloads, classroom availability, and course catalog for Emerson University Multan’s Faculty of Computing & Emerging Technologies. The dataset is generated from the official timetable PDFs and includes morning, evening, BS, and MS schedules.

## Developer & Maintainer

- **Developer:** Muhammad Arif
- **Program:** BS Cybersecurity (7th Semester, Evening Shift)
- **Department:** Department of Cybersecurity, Faculty of Computing & Emerging Technologies
- **University:** Emerson University Multan
- **GitHub:** [@ranaarifdev](https://github.com/ranaarifdev)
- **Repository:** [Timetable.EUM.Portal](https://github.com/ranaarifdev/Timetable.EUM.Portal)

## Current timetable dataset

Generated on 27 September 2026 from 9 official PDF files:

| Item | Total |
| --- | ---: |
| Class/shift schedules | 69 |
| Timetable entries | 1,160 |
| Course catalog records | 454 |
| MS programme schedules | 5 |

The MS schedule includes MSCybSec-1A, MSIT-1A, MSCS-3A, MSCybSec-3A, and MSIT-3A. The current BS data also includes the updated two-year BSIT timetable and BSSE evening sections.

## Features

- Class-wise weekly timetable with department, semester, shift, and section filters.
- Teacher schedules and workload summaries.
- Course catalog, classroom/lab matrix, and academic statistics.
- Responsive dark interface with print-friendly timetable views.

## Run locally

No build step is required. Open `index.html` directly, or serve the project with a static HTTP server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`. The application loads `timetable-data.js`, which assigns the dataset to `window.TIMETABLE_DATA`.

## Updating the timetable

Place the official PDF files in the project root, then regenerate the client data:

```bash
python build_dataset.py
```

This produces the following source-controlled artifacts:

- `timetable_data.json` — consolidated timetable dataset.
- `timetable-data.js` — browser-ready data bundle.
- `all_timetables_detailed.json` — class-by-class schedule breakdown.

The extraction pipeline handles the standard timetable layout as well as the official MS and two-year BSIT layouts.

## Project structure

```text
├── index.html
├── app.js
├── portal.css
├── build_dataset.py
├── timetable_data.json
├── timetable-data.js
├── all_timetables_detailed.json
└── *.pdf
```

## Online

Visit the live portal: [ranaarifdev.github.io/Timetable.EUM.Portal](https://ranaarifdev.github.io/Timetable.EUM.Portal/)

## License

MIT License. Created for the students and faculty of Emerson University Multan.
