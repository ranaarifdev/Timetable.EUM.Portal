/* ============================================================
   University Timetable Portal — app.js
   Faculty of Computing & Emerging Technologies
   Emerson University Multan — Fall 2026
   All data sourced dynamically from TIMETABLE_DATA (timetable-data.js)
   ============================================================ */

(function () {
  'use strict';

  /* ── DATA ─────────────────────────────────────────────── */
  const RAW          = window.TIMETABLE_DATA || {};
  const ENTRIES      = RAW.schedule_entries  || [];
  const ALL_TEACHERS = RAW.teachers          || [];
  const ALL_DEPTS    = RAW.departments       || [];
  const CATALOG      = RAW.course_catalog    || [];

  // Tag every entry with an index for rapid modal lookup
  ENTRIES.forEach((e, idx) => { e._id = idx; });

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const DEPT_ICONS = {
    'Cybersecurity':           '🔐',
    'Information Technology':  '💻',
    'Data Science':            '📊',
    'Software Engineering':    '⚙️',
    'Computer Science':        '🖥️',
    'Artificial Intelligence': '🤖'
  };

  /* ── UTILITY ──────────────────────────────────────────── */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* Normalize subject identity so Theory + Lab or repeated lectures share one identity */
  function getSubjectBaseKey(e) {
    if (!e) return '';
    const code = (e.course_code || '').trim().toUpperCase();
    if (code && code !== 'NO CODE' && code !== 'BREAK') {
      return code.replace(/\s*\(LAB\)/i, '').replace(/[-_]LAB$/i, '').trim();
    }
    let subj = (e.subject || '').trim().toUpperCase();
    subj = subj.replace(/\s*\(LAB\)/i, '').replace(/\s+LAB$/i, '').trim();
    return subj;
  }

  function cleanSubjectTitle(title) {
    if (!title) return '';
    return title.replace(/\s*\(LAB\)/i, '').replace(/\s+LAB$/i, '').trim();
  }

  function getType(e) {
    if (!e) return 'theory';
    const subj    = (e.subject || '').toLowerCase().trim();
    const code    = (e.course_code || '').toLowerCase().trim();
    const room    = (e.room || '').toLowerCase().trim();
    const teach   = (e.teacher || '').toLowerCase().trim();
    const rawType = (e.type || '').toLowerCase().trim();

    if (subj.includes('jummah') || subj === 'jummah break' || rawType === 'jummah' || code === 'break') return 'jummah';
    if (rawType === 'lab' || subj.includes('(lab)') || subj.includes(' lab') || code.includes('(lab)') || room.startsWith('clab') || room.includes('lab')) return 'lab';
    if (rawType === 'online' || room === 'online' || subj.includes('online')) return 'online';
    if (!e.teacher || teach === '' || teach === 'to be assigned' || rawType === 'unassigned') return 'unassigned';
    return 'theory';
  }

  function typeLabel(t) {
    return {
      theory:     'THEORY',
      lab:        'LAB',
      online:     'ONLINE',
      unassigned: 'TBA',
      jummah:     'JUMMAH'
    }[t] || 'THEORY';
  }

  function shiftShort(s) {
    return s === 'Morning Shift' ? '☀️ Morning' : '🌙 Evening';
  }

  function shiftBadgeCls(s) {
    return s === 'Morning Shift' ? 'bdg-morning' : 'bdg-evening';
  }

  function getLocation(room) {
    if (!room) return 'To Be Assigned';
    const r = room.toUpperCase().trim();
    if (r === 'ONLINE') return 'Virtual Classroom';
    if (r.startsWith('CLAB')) return 'Lab Block';
    if (r.startsWith('CTB1')) return 'Old Building — Upper Floor';
    if (r.startsWith('CTB2')) return 'Old Building — Ground Floor';
    if (r.startsWith('CTB3')) return 'Botany Block — Upper Floor';
    return 'University Main Campus';
  }

  /* ── TIME & REAL-TIME SYSTEM ENGINE ───────────────────── */
  function parseSingleTime(s) {
    if (!s) return null;
    const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    if (hh >= 1 && hh <= 7) hh += 12; // convert PM slots (01:30 -> 13:30, 06:30 -> 18:30)
    return hh * 60 + mm;
  }

  function parseSlotTime(timeStr) {
    if (!timeStr) return null;
    const parts = timeStr.split('-');
    if (parts.length === 2) {
      const st = parseSingleTime(parts[0]);
      const et = parseSingleTime(parts[1]);
      if (st !== null && et !== null) return { start: st, end: et };
    } else if (parts.length === 1) {
      const st = parseSingleTime(parts[0]);
      if (st !== null) return { start: st, end: st + 50 };
    }
    return null;
  }

  function formatMinutesToTime(totalMins) {
    let h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const mm = m < 10 ? '0' + m : m;
    return `${h}:${mm} ${ampm}`;
  }

  function getLiveSystemInfo() {
    const now = new Date();
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const currentDay = dayNames[now.getDay()];
    const isWeekday = DAYS.includes(currentDay);
    const hours = now.getHours();
    const mins = now.getMinutes();
    const currentMins = hours * 60 + mins;
    const formattedTime = formatMinutesToTime(currentMins);
    return {
      now,
      currentDay,
      isWeekday,
      currentMins,
      formattedTime,
      fullText: `${currentDay}, ${formattedTime}`
    };
  }

  function getRoomLiveStatus(roomName) {
    const sys = getLiveSystemInfo();
    const roomLower = (roomName || '').trim().toLowerCase();

    if (!sys.isWeekday) {
      return {
        status: 'free',
        isWeekend: true,
        current: null,
        next: null,
        badgeText: '🟢 Available Today',
        badgeCls: 'free',
        message: 'Weekend — No scheduled classes today'
      };
    }

    const todayEntries = ENTRIES.filter(e => {
      return (e.room || '').trim().toLowerCase() === roomLower &&
             e.day === sys.currentDay &&
             getType(e) !== 'jummah';
    });

    let currentEntry = null;
    let nextEntry = null;
    let minNextStart = Infinity;

    for (const e of todayEntries) {
      const slot = parseSlotTime(e.time);
      if (!slot) continue;
      if (sys.currentMins >= slot.start && sys.currentMins < slot.end) {
        currentEntry = { entry: e, slot, remainingMins: slot.end - sys.currentMins };
        break;
      } else if (slot.start >= sys.currentMins && slot.start < minNextStart) {
        minNextStart = slot.start;
        nextEntry = { entry: e, slot, startMins: slot.start };
      }
    }

    if (currentEntry) {
      return {
        status: 'busy',
        isWeekend: false,
        current: currentEntry,
        next: nextEntry,
        badgeText: '🔴 In Lecture',
        badgeCls: 'busy',
        message: `Active Lecture: <strong>${esc(currentEntry.entry.section)}</strong> &middot; ${esc(currentEntry.entry.subject || 'Lecture')} (${formatMinutesToTime(currentEntry.slot.start)} &ndash; ${formatMinutesToTime(currentEntry.slot.end)})`
      };
    } else {
      return {
        status: 'free',
        isWeekend: false,
        current: null,
        next: nextEntry,
        badgeText: '🟢 Free Right Now',
        badgeCls: 'free',
        message: nextEntry
          ? `🟢 Currently Free (Next Lecture: <strong>${esc(nextEntry.entry.section)}</strong> at ${formatMinutesToTime(nextEntry.slot.start)})`
          : `🟢 Free for the rest of today`
      };
    }
  }

  function getTeacherLiveStatus(teacherName) {
    const sys = getLiveSystemInfo();
    if (!sys.isWeekday || !teacherName || teacherName === 'TO BE ASSIGNED') {
      return {
        status: 'free',
        isWeekend: !sys.isWeekday,
        current: null,
        next: null,
        badgeText: '🟢 Free Now',
        badgeCls: 'free',
        message: !sys.isWeekday ? 'Weekend &mdash; No active lectures scheduled' : 'Free right now'
      };
    }

    const tEntries = ENTRIES.filter(e => {
      return e.teacher === teacherName &&
             e.day === sys.currentDay &&
             getType(e) !== 'jummah';
    });

    let currentEntry = null;
    let nextEntry = null;
    let minNextStart = Infinity;

    for (const e of tEntries) {
      const slot = parseSlotTime(e.time);
      if (!slot) continue;
      if (sys.currentMins >= slot.start && sys.currentMins < slot.end) {
        currentEntry = { entry: e, slot, remainingMins: slot.end - sys.currentMins };
        break;
      } else if (slot.start >= sys.currentMins && slot.start < minNextStart) {
        minNextStart = slot.start;
        nextEntry = { entry: e, slot, startMins: slot.start };
      }
    }

    if (currentEntry) {
      return {
        status: 'busy',
        isWeekend: false,
        current: currentEntry,
        next: nextEntry,
        badgeText: '🔴 In Lecture Now',
        badgeCls: 'busy',
        message: `Currently Taking Lecture: <strong>${esc(currentEntry.entry.section)}</strong> &middot; ${esc(currentEntry.entry.subject || 'Lecture')} in <strong>📍 ${esc(currentEntry.entry.room || 'TBA')}</strong> until ${formatMinutesToTime(currentEntry.slot.end)}`
      };
    } else {
      return {
        status: 'free',
        isWeekend: false,
        current: null,
        next: nextEntry,
        badgeText: '🟢 Free Right Now',
        badgeCls: 'free',
        message: nextEntry
          ? `🟢 Currently Free (Next Lecture: <strong>${esc(nextEntry.entry.section)}</strong> in ${esc(nextEntry.entry.room || 'TBA')} at ${formatMinutesToTime(nextEntry.slot.start)})`
          : '🟢 Free for the rest of today'
      };
    }
  }

  /* ── NAVIGATION ───────────────────────────────────────── */
  const NAV_BTNS = document.querySelectorAll('.nav-btn');
  const ALL_SECTIONS = {
    home:       document.getElementById('sectionHome'),
    teacher:    document.getElementById('sectionTeacher'),
    class:      document.getElementById('sectionClass'),
    schedule:   document.getElementById('sectionSchedule'),
    subjects:   document.getElementById('sectionSubjects'),
    rooms:      document.getElementById('sectionRooms'),
    statistics: document.getElementById('sectionStatistics'),
    about:      document.getElementById('sectionAbout')
  };

  const rendered = { statistics: false, subjects: false, rooms: false };

  function navigateTo(key) {
    Object.values(ALL_SECTIONS).forEach(s => s && s.classList.remove('active'));
    NAV_BTNS.forEach(b => b.classList.remove('active'));
    if (ALL_SECTIONS[key]) ALL_SECTIONS[key].classList.add('active');
    const btn = document.querySelector(`.nav-btn[data-section="${key}"]`);
    if (btn) btn.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (key === 'teacher')                          renderTeacherView();
    if (key === 'schedule'   && !scheduleInited)    initSchedule();
    if (key === 'subjects'   && !rendered.subjects) { renderSubjects();   rendered.subjects   = true; }
    if (key === 'rooms')                            { renderRooms();      rendered.rooms      = true; }
    if (key === 'statistics' && !rendered.statistics){ renderStatistics(); rendered.statistics = true; }
  }

  window.navigateTo = navigateTo;

  NAV_BTNS.forEach(btn =>
    btn.addEventListener('click', () => navigateTo(btn.dataset.section))
  );

  /* ── COURSE DETAILS MODAL ─────────────────────────────── */
  const courseModal      = document.getElementById('courseModal');
  const modalCloseBtn    = document.getElementById('modalCloseBtn');
  const modalTypeBadge   = document.getElementById('modalTypeBadge');
  const modalCourseTitle = document.getElementById('modalCourseTitle');
  const modalCourseCode  = document.getElementById('modalCourseCode');
  const modalBody        = document.getElementById('modalBody');

  function openCourseModal(e) {
    if (!e || !courseModal) return;
    const t = getType(e);
    modalTypeBadge.className = 'bdg bdg-' + t;
    modalTypeBadge.textContent = typeLabel(t);
    modalCourseTitle.textContent = e.subject || (t === 'jummah' ? 'Jummah Break' : 'To Be Assigned');
    modalCourseCode.textContent = e.course_code ? e.course_code : (t === 'jummah' ? 'BREAK' : 'NO CODE');

    modalBody.innerHTML = `
      <div class="modal-info-grid">
        <div class="modal-info-item">
          <div class="modal-info-lbl">🏛️ Department</div>
          <div class="modal-info-val">${esc(e.department || 'Computing')}</div>
        </div>
        <div class="modal-info-item">
          <div class="modal-info-lbl">🎓 Class &amp; Section</div>
          <div class="modal-info-val">${esc(e.section || '—')}</div>
        </div>
        <div class="modal-info-item">
          <div class="modal-info-lbl">📅 Semester &amp; Shift</div>
          <div class="modal-info-val">${esc(e.semester || '—')} &middot; ${shiftShort(e.shift)}</div>
        </div>
        <div class="modal-info-item">
          <div class="modal-info-lbl">⏰ Time &amp; Day</div>
          <div class="modal-info-val">${esc(e.day)} (${esc(e.time)})</div>
        </div>
        <div class="modal-info-item">
          <div class="modal-info-lbl">👨‍🏫 Instructor</div>
          <div class="modal-info-val">${esc(e.teacher || 'TO BE ASSIGNED')}</div>
        </div>
        <div class="modal-info-item">
          <div class="modal-info-lbl">📍 Room &amp; Block</div>
          <div class="modal-info-val">${esc(e.room || 'TBA')} <span style="font-size:0.75rem;font-weight:normal;color:var(--tx-3)">(${esc(getLocation(e.room))})</span></div>
        </div>
        ${e.credit_hours ? `
        <div class="modal-info-item">
          <div class="modal-info-lbl">⏱️ Credit Hours</div>
          <div class="modal-info-val">${esc(e.credit_hours)}</div>
        </div>` : ''}
        <div class="modal-info-item full-width">
          <div class="modal-info-lbl">📄 Source Document</div>
          <div class="modal-info-val" style="font-size:0.8rem;color:var(--tx-3)">${esc(e.file || 'Official Timetable PDF')}${e.page ? ` (Page ${e.page})` : ''} &middot; Effective w.e.f 07 Sep 2026</div>
        </div>
      </div>
    `;

    courseModal.style.display = 'flex';
    courseModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCourseModal() {
    if (!courseModal) return;
    courseModal.style.display = 'none';
    courseModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeCourseModal);
  if (courseModal) {
    courseModal.addEventListener('click', (ev) => {
      if (ev.target === courseModal) closeCourseModal();
    });
  }

  /* ── ROOM SCHEDULE MODAL ──────────────────────────────── */
  const roomModal            = document.getElementById('roomModal');
  const roomModalCloseBtn     = document.getElementById('roomModalCloseBtn');
  const roomModalTitle       = document.getElementById('roomModalTitle');
  const roomModalLocation    = document.getElementById('roomModalLocation');
  const roomModalStatusBadge = document.getElementById('roomModalStatusBadge');
  const roomModalBody        = document.getElementById('roomModalBody');

  function openRoomModal(roomName) {
    if (!roomModal || !roomName) return;
    const roomEntries = ENTRIES.filter(e => (e.room || '').trim().toLowerCase() === roomName.trim().toLowerCase());
    const live = getRoomLiveStatus(roomName);

    roomModalTitle.textContent = `📍 Room ${roomName} — Weekly Schedule`;
    roomModalLocation.textContent = getLocation(roomName);
    
    if (roomModalStatusBadge) {
      roomModalStatusBadge.className = `bdg ${live.status === 'busy' ? 'bdg-evening' : 'bdg-morning'}`;
      roomModalStatusBadge.innerHTML = `<span class="pulse-dot ${live.badgeCls}"></span> ${live.badgeText}`;
    }

    if (!roomEntries.length) {
      roomModalBody.innerHTML = `
        <div class="empty-state">
          <div class="empty-ico">🏫</div>
          <h3>No Scheduled Classes</h3>
          <p>This room has no classes assigned in the tentative timetable.</p>
        </div>`;
    } else {
      // Collect unique time slots
      const timeSlots = [...new Set(roomEntries.map(e => e.time))].sort((a, b) => {
        const sa = parseSlotTime(a);
        const sb = parseSlotTime(b);
        return (sa ? sa.start : 0) - (sb ? sb.start : 0);
      });

      const lup = {};
      timeSlots.forEach(t => {
        lup[t] = {};
        DAYS.forEach(d => { lup[t][d] = null; });
      });
      roomEntries.forEach(e => { if (lup[e.time]) lup[e.time][e.day] = e; });

      const rows = timeSlots.map(ts => {
        const cells = DAYS.map(day => {
          const e = lup[ts][day];
          if (!e) return `<td><div class="tt-empty">—</div></td>`;
          const t = getType(e);
          if (t === 'jummah') {
            return `<td><div class="tt-entry jummah" data-entry-id="${e._id}">🕌 Jummah Break</div></td>`;
          }
          const tba = !e.teacher || e.teacher === 'TO BE ASSIGNED';
          return `<td>
            <div class="tt-entry ${t}" data-entry-id="${e._id}" title="Click to view details">
              <span class="tt-type-badge">${typeLabel(t)}</span>
              <div class="tt-code" style="font-weight:700;color:var(--primary)">🎓 ${esc(e.section)}</div>
              <div class="tt-subj">${esc(e.subject || '')}</div>
              <div class="tt-teacher">👤 ${esc(tba ? 'TO BE ASSIGNED' : e.teacher)}</div>
              <div class="tt-room"><span class="bdg ${shiftBadgeCls(e.shift)}" style="font-size:0.68rem;padding:0.1rem 0.35rem;">${shiftShort(e.shift)}</span></div>
            </div>
          </td>`;
        }).join('');
        return `<tr><td class="tc-time">${esc(ts)}</td>${cells}</tr>`;
      }).join('');

      roomModalBody.innerHTML = `
        <div style="background:var(--bg-card); border-radius:10px; padding:0.9rem 1.1rem; margin-bottom:1.2rem; border:1px solid var(--border);">
          <div style="font-size:0.88rem; color:var(--tx-1); line-height:1.5;">${live.message}</div>
          <div style="font-size:0.78rem; color:var(--tx-3); margin-top:0.3rem;">Total scheduled periods: <strong>${roomEntries.length} slots/week</strong> across <strong>${new Set(roomEntries.map(e => e.section)).size} classes</strong></div>
        </div>
        <div class="tt-scroll">
          <table class="tt-grid">
            <thead>
              <tr>
                <th class="col-time">Time</th>
                ${DAYS.map(d => `<th class="col-day">${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }

    roomModal.style.display = 'flex';
    roomModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeRoomModal() {
    if (!roomModal) return;
    roomModal.style.display = 'none';
    roomModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (roomModalCloseBtn) roomModalCloseBtn.addEventListener('click', closeRoomModal);
  if (roomModal) {
    roomModal.addEventListener('click', (ev) => {
      if (ev.target === roomModal) closeRoomModal();
    });
  }

  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      if (courseModal && courseModal.style.display === 'flex') closeCourseModal();
      if (roomModal && roomModal.style.display === 'flex') closeRoomModal();
    }
  });

  // Global click delegator for any timetable entry element
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-entry-id]');
    if (el) {
      const id = parseInt(el.getAttribute('data-entry-id'), 10);
      if (!isNaN(id) && ENTRIES[id]) {
        openCourseModal(ENTRIES[id]);
      }
    }
  });

  /* ══════════════════════════════════════════════════════════
     HOME — live stats
  ══════════════════════════════════════════════════════════ */
  function buildHomeStats() {
    const grid = document.getElementById('homeStatsGrid');
    if (!grid) return;

    // Unique assignments (class group + shift + subject base key)
    const uniqueAssignments = [];
    const seenAssignments = new Set();
    ENTRIES.forEach(e => {
      if (getType(e) === 'jummah') return;
      const key = (e.teacher || 'TBA') + '||' + e.section + '||' + e.shift + '||' + getSubjectBaseKey(e);
      if (!seenAssignments.has(key)) {
        seenAssignments.add(key);
        uniqueAssignments.push(e);
      }
    });

    const uniqueClasses  = new Set(ENTRIES.map(e => e.department + '||' + e.section + '||' + e.shift)).size;
    const morningClasses = new Set(ENTRIES.filter(e => e.shift === 'Morning Shift').map(e => e.department + '||' + e.section + '||' + e.shift)).size;
    const eveningClasses = new Set(ENTRIES.filter(e => e.shift === 'Evening Shift').map(e => e.department + '||' + e.section + '||' + e.shift)).size;
    const uniqueTeachers = new Set(ENTRIES.map(e => e.teacher).filter(t => t && t !== 'TO BE ASSIGNED')).size;
    const uniqueSubjects = new Set(ENTRIES.map(e => getSubjectBaseKey(e)).filter(Boolean)).size;
    const uniqueRooms    = new Set(ENTRIES.map(e => e.room).filter(Boolean)).size;

    const cards = [
      { icon: '🎓', value: uniqueClasses,            label: 'Unique Classes'   },
      { icon: '☀️', value: morningClasses,          label: 'Morning Classes'  },
      { icon: '🌙', value: eveningClasses,          label: 'Evening Classes'  },
      { icon: '👨‍🏫', value: uniqueTeachers,         label: 'Faculty Members'  },
      { icon: '📚', value: uniqueSubjects,          label: 'Subjects / Courses'},
      { icon: '🏫', value: uniqueRooms,             label: 'Rooms & Labs'     },
      { icon: '📋', value: uniqueAssignments.length,label: 'Course Offerings' },
      { icon: '🏛️', value: ALL_DEPTS.length,         label: 'Departments'      }
    ];

    grid.innerHTML = cards.map(c => `
      <div class="stat-card">
        <div class="stat-card-icon">${c.icon}</div>
        <div class="stat-card-value">${c.value.toLocaleString()}</div>
        <div class="stat-card-label">${c.label}</div>
      </div>`).join('');
  }

  /* ══════════════════════════════════════════════════════════
     TEACHER WISE
  ══════════════════════════════════════════════════════════ */
  const teacherSearchBox         = document.getElementById('teacherSearchBox');
  const teacherSelectBox         = document.getElementById('teacherSelectBox');
  const teacherDayBox            = document.getElementById('teacherDayBox');
  const teacherShiftBox          = document.getElementById('teacherShiftBox');
  const teacherLiveStatusFilter  = document.getElementById('teacherLiveStatusFilter');
  const teacherProfileCard       = document.getElementById('teacherProfileCard');
  const teacherResultsArea       = document.getElementById('teacherResultsArea');
  const teacherLiveClockText     = document.getElementById('teacherLiveClockText');
  const teacherLiveClockSub      = document.getElementById('teacherLiveClockSub');
  const teacherFreeCount         = document.getElementById('teacherFreeCount');
  const teacherBusyCount         = document.getElementById('teacherBusyCount');

  function initTeacherDropdown() {
    const teachers = [...new Set(
      ENTRIES.map(e => e.teacher).filter(t => t && t !== 'TO BE ASSIGNED')
    )].sort();

    teacherSelectBox.innerHTML = '<option value="">— All Teachers —</option>' +
      teachers.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  }

  function renderTeacherView() {
    const search     = (teacherSearchBox.value || '').trim().toLowerCase();
    const selected   = (teacherSelectBox.value || '').trim();
    const day        = teacherDayBox.value || '';
    const shift      = teacherShiftBox.value || '';
    const liveStatusF= teacherLiveStatusFilter ? teacherLiveStatusFilter.value : '';

    const sys = getLiveSystemInfo();
    const allFaculty = [...new Set(ENTRIES.map(e => e.teacher).filter(t => t && t !== 'TO BE ASSIGNED'))];

    // Compute live stats for all teachers
    let freeTeachersCount = 0;
    let busyTeachersCount = 0;
    allFaculty.forEach(t => {
      const ls = getTeacherLiveStatus(t);
      if (ls.status === 'busy') busyTeachersCount++;
      else freeTeachersCount++;
    });

    if (teacherLiveClockText) teacherLiveClockText.textContent = `System Time: ${sys.fullText}`;
    if (teacherLiveClockSub)  teacherLiveClockSub.textContent = sys.isWeekday
      ? `Real-time faculty lecture tracking for ${sys.currentDay}`
      : `Weekend &mdash; All faculty free today`;
    if (teacherFreeCount) teacherFreeCount.innerHTML = `<span class="pulse-dot free"></span> ${freeTeachersCount} Faculty Free Now`;
    if (teacherBusyCount) teacherBusyCount.innerHTML = `<span class="pulse-dot busy"></span> ${busyTeachersCount} In Lecture`;

    let filtered = ENTRIES.filter(e => {
      if (!e.teacher || e.teacher === 'TO BE ASSIGNED') return false;
      if (selected && e.teacher !== selected) return false;
      if (search) {
        const ok = (e.teacher     || '').toLowerCase().includes(search)
                || (e.subject     || '').toLowerCase().includes(search)
                || (e.course_code || '').toLowerCase().includes(search)
                || (e.room        || '').toLowerCase().includes(search);
        if (!ok) return false;
      }
      if (day   && e.day   !== day)   return false;
      if (shift && e.shift !== shift) return false;
      if (liveStatusF) {
        const tStatus = getTeacherLiveStatus(e.teacher);
        if (tStatus.status !== liveStatusF) return false;
      }
      return true;
    });

    if (selected && filtered.length > 0) {
      renderTeacherProfile(selected, filtered);
    } else {
      teacherProfileCard.style.display = 'none';
    }

    if (!filtered.length) {
      teacherResultsArea.innerHTML = `
        <div class="empty-state">
          <div class="empty-ico">🔍</div>
          <h3>No Results Found</h3>
          <p>No entries match the selected teacher or live filter.</p>
        </div>`;
      return;
    }

    let html = '';
    DAYS.forEach(dayName => {
      const dayEntries = filtered
        .filter(e => e.day === dayName)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      if (!dayEntries.length) return;

      html += `
        <div class="day-section">
          <div class="day-sec-hd">
            <span class="day-sec-title">📅 ${dayName}</span>
            <span class="day-sec-cnt">${dayEntries.length} class${dayEntries.length !== 1 ? 'es' : ''}</span>
          </div>
          <div class="tbl-wrap">
            <table class="data-tbl">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Code</th>
                  <th>Subject</th>
                  <th>Section</th>
                  <th>Semester</th>
                  <th>Shift</th>
                  <th>Teacher</th>
                  <th>Live Status</th>
                  <th>Room</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                ${dayEntries.map(e => {
                  const t = getType(e);
                  const tStatus = getTeacherLiveStatus(e.teacher);
                  return `<tr data-entry-id="${e._id}" style="cursor:pointer" title="Click to view details">
                    <td><span class="bdg bdg-time">${esc(e.time)}</span></td>
                    <td><span class="bdg bdg-code">${esc(e.course_code || '—')}</span></td>
                    <td><strong>${esc(e.subject || '—')}</strong></td>
                    <td><span class="bdg bdg-class">${esc(e.section)}</span></td>
                    <td style="font-size:0.8rem;color:var(--tx-3)">${esc(e.semester || '—')}</td>
                    <td><span class="bdg ${shiftBadgeCls(e.shift)}">${shiftShort(e.shift)}</span></td>
                    <td style="font-size:0.83rem"><strong>${esc(e.teacher)}</strong></td>
                    <td><span class="bdg ${tStatus.status === 'busy' ? 'bdg-evening' : 'bdg-morning'}" style="font-size:0.72rem;"><span class="pulse-dot ${tStatus.badgeCls}"></span> ${tStatus.status === 'busy' ? 'In Lecture' : 'Free Now'}</span></td>
                    <td><span class="bdg bdg-room">📍 ${esc(e.room || 'TBA')}</span></td>
                    <td><span class="bdg bdg-${t}">${typeLabel(t)}</span></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    });

    teacherResultsArea.innerHTML = html;
  }

  function renderTeacherProfile(teacher, entries) {
    const uniqueAssignments = new Set();
    entries.forEach(e => {
      if (getType(e) === 'jummah') return;
      const key = e.section + '||' + e.shift + '||' + getSubjectBaseKey(e);
      uniqueAssignments.add(key);
    });

    const totalPeriods   = entries.length;
    const uniqueClasses  = new Set(entries.map(e => e.department + '||' + e.section + '||' + e.shift)).size;
    const subjs          = new Set(entries.map(e => getSubjectBaseKey(e)).filter(Boolean)).size;
    const rooms          = new Set(entries.map(e => e.room).filter(Boolean)).size;
    const morningSlots   = entries.filter(e => e.shift === 'Morning Shift').length;
    const eveningSlots   = entries.filter(e => e.shift === 'Evening Shift').length;
    const deptNames      = [...new Set(entries.map(e => e.department).filter(Boolean))].join(', ');
    const classNames     = [...new Set(entries.map(e => e.section))].sort().join(', ');

    const live = getTeacherLiveStatus(teacher);

    teacherProfileCard.innerHTML = `
      <div class="t-avatar">👨‍🏫</div>
      <div>
        <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
          <span class="t-name">${esc(teacher)}</span>
          <span class="live-pill ${live.badgeCls}" style="font-size:0.75rem; padding:0.2rem 0.65rem;"><span class="pulse-dot ${live.badgeCls}"></span> ${live.badgeText}</span>
        </div>
        <div class="t-meta" style="margin-top:0.25rem;">${esc(deptNames)}</div>
        <div style="background:rgba(255,255,255,0.06); border-radius:8px; padding:0.5rem 0.75rem; margin:0.5rem 0; font-size:0.8rem; border-left:3px solid ${live.status === 'busy' ? '#8b5cf6' : '#10b981'};">
          ${live.message}
        </div>
        <div class="t-meta" style="font-size:0.75rem">Teaching Sections: ${esc(classNames)}</div>
        <div class="t-stats" style="margin-top:0.6rem;">
          <div class="t-stat"><span class="t-stat-val">${totalPeriods}</span><span class="t-stat-label">Weekly Periods</span></div>
          <div class="t-stat"><span class="t-stat-val">${uniqueClasses}</span><span class="t-stat-label">Classes Taught</span></div>
          <div class="t-stat"><span class="t-stat-val">${subjs}</span><span class="t-stat-label">Unique Subjects</span></div>
          <div class="t-stat"><span class="t-stat-val">${uniqueAssignments.size}</span><span class="t-stat-label">Course Offerings</span></div>
          <div class="t-stat"><span class="t-stat-val">${rooms}</span><span class="t-stat-label">Rooms</span></div>
          <div class="t-stat"><span class="t-stat-val">${morningSlots}</span><span class="t-stat-label">Morning Slots</span></div>
          <div class="t-stat"><span class="t-stat-val">${eveningSlots}</span><span class="t-stat-label">Evening Slots</span></div>
        </div>
      </div>`;
    teacherProfileCard.style.display = 'grid';
  }

  teacherSearchBox.addEventListener('input', () => {
    teacherSelectBox.value = '';
    renderTeacherView();
  });
  teacherSelectBox.addEventListener('change', () => {
    teacherSearchBox.value = '';
    renderTeacherView();
  });
  teacherDayBox.addEventListener('change',   renderTeacherView);
  teacherShiftBox.addEventListener('change', renderTeacherView);
  if (teacherLiveStatusFilter) teacherLiveStatusFilter.addEventListener('change', renderTeacherView);

  document.getElementById('btnTeacherReset').addEventListener('click', () => {
    teacherSearchBox.value = '';
    teacherSelectBox.value = '';
    teacherDayBox.value    = '';
    teacherShiftBox.value  = '';
    if (teacherLiveStatusFilter) teacherLiveStatusFilter.value = '';
    teacherProfileCard.style.display = 'none';
    teacherResultsArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-ico">👨‍🏫</div>
        <h3>Select a Teacher</h3>
        <p>Search or select a faculty member above to view their complete timetable.</p>
      </div>`;
  });

  /* ══════════════════════════════════════════════════════════
     CLASS WISE — weekly grid & list view per class/shift
  ══════════════════════════════════════════════════════════ */
  let activeDept = null;
  let classViewMode = 'grid'; // 'grid' or 'list'

  const deptTabBar          = document.getElementById('deptTabBar');
  const classShiftTabs      = document.getElementById('classShiftTabs');
  const classSemesterSelect = document.getElementById('classSemesterSelect');
  const classSectionSelect  = document.getElementById('classSectionSelect');
  const classShiftSelect    = document.getElementById('classShiftSelect');
  const classDaySelect      = document.getElementById('classDaySelect');
  const classKeyword        = document.getElementById('classKeyword');
  const classResultsArea    = document.getElementById('classResultsArea');
  const btnViewGrid         = document.getElementById('btnViewGrid');
  const btnViewList         = document.getElementById('btnViewList');

  if (btnViewGrid && btnViewList) {
    btnViewGrid.addEventListener('click', () => {
      classViewMode = 'grid';
      btnViewGrid.classList.add('active');
      btnViewList.classList.remove('active');
      renderClassWise();
    });
    btnViewList.addEventListener('click', () => {
      classViewMode = 'list';
      btnViewList.classList.add('active');
      btnViewGrid.classList.remove('active');
      renderClassWise();
    });
  }

  if (classShiftTabs) {
    classShiftTabs.querySelectorAll('.shift-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        classShiftTabs.querySelectorAll('.shift-tab-btn').forEach(b => {
          b.classList.remove('active');
          b.style.boxShadow = 'none';
        });
        btn.classList.add('active');
        btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
        const shiftVal = btn.dataset.shift;
        classShiftSelect.value = shiftVal === 'all' ? '' : shiftVal;
        updateClassFilters();
        renderClassWise();
      });
    });
  }

  function initDeptTabs() {
    const availDepts = ALL_DEPTS.filter(d => ENTRIES.some(e => e.department === d));

    deptTabBar.innerHTML = availDepts.map(d => `
      <button class="dept-tab-btn" data-dept="${esc(d)}" role="tab">
        ${DEPT_ICONS[d] || '📁'} ${esc(d)}
      </button>`).join('');

    deptTabBar.querySelectorAll('.dept-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        deptTabBar.querySelectorAll('.dept-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeDept = btn.dataset.dept;
        updateClassFilters();
        renderClassWise();
      });
    });

    // Auto-select first department so timetables appear immediately
    if (availDepts.length > 0 && !activeDept) {
      activeDept = availDepts[0];
      const firstBtn = deptTabBar.querySelector(`.dept-tab-btn[data-dept="${CSS.escape(activeDept)}"]`);
      if (firstBtn) firstBtn.classList.add('active');
      updateClassFilters();
    }
  }

  function updateClassFilters() {
    if (!activeDept) return;
    const shiftVal = classShiftSelect.value;
    const deptEntries = ENTRIES.filter(e => e.department === activeDept && (!shiftVal || e.shift === shiftVal));

    const sems = [...new Set(deptEntries.map(e => e.semester).filter(Boolean))]
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    classSemesterSelect.innerHTML = '<option value="">All Semesters</option>' +
      sems.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');

    const secs = [...new Set(deptEntries.map(e => e.section).filter(Boolean))].sort();
    classSectionSelect.innerHTML = '<option value="">All Sections</option>' +
      secs.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
  }

  function renderClassWise() {
    if (!activeDept) {
      classResultsArea.innerHTML = `
        <div class="empty-state">
          <div class="empty-ico">🎓</div>
          <h3>Select a Department</h3>
          <p>Click a department tab above to view timetables.</p>
        </div>`;
      return;
    }

    const semF   = classSemesterSelect.value;
    const secF   = classSectionSelect.value;
    const shiftF = classShiftSelect.value;
    const dayF   = classDaySelect.value;
    const kw     = classKeyword.value.trim().toLowerCase();

    let filtered = ENTRIES.filter(e => {
      if (e.department !== activeDept) return false;
      if (semF   && e.semester !== semF)   return false;
      if (secF   && e.section  !== secF)   return false;
      if (shiftF && e.shift    !== shiftF) return false;
      if (dayF   && e.day      !== dayF)   return false;
      if (kw) {
        const ok = (e.subject    || '').toLowerCase().includes(kw)
                || (e.course_code|| '').toLowerCase().includes(kw)
                || (e.teacher    || '').toLowerCase().includes(kw)
                || (e.room       || '').toLowerCase().includes(kw);
        if (!ok) return false;
      }
      return true;
    });

    if (!filtered.length) {
      classResultsArea.innerHTML = `
        <div class="empty-state">
          <div class="empty-ico">📭</div>
          <h3>No Classes Found</h3>
          <p>No timetable entries match the selected filters for ${esc(activeDept)}.</p>
        </div>`;
      return;
    }

    // Separate groups for section + shift
    const groups = {};
    filtered.forEach(e => {
      const key = e.section + '||' + e.shift;
      if (!groups[key]) groups[key] = { section: e.section, shift: e.shift, semester: e.semester, entries: [] };
      groups[key].entries.push(e);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const ga = groups[a], gb = groups[b];
      const na = parseInt(ga.semester, 10) || 0;
      const nb = parseInt(gb.semester, 10) || 0;
      if (na !== nb) return na - nb;
      if (ga.section !== gb.section) return ga.section.localeCompare(gb.section);
      return ga.shift.localeCompare(gb.shift);
    });

    const morningGroups = [];
    const eveningGroups = [];
    sortedKeys.forEach(k => {
      if (groups[k].shift === 'Morning Shift') {
        morningGroups.push(groups[k]);
      } else {
        eveningGroups.push(groups[k]);
      }
    });

    let html = '';
    if (morningGroups.length > 0 && (!shiftF || shiftF === 'Morning Shift')) {
      if (!shiftF) {
        html += `
        <div class="shift-section-divider morning-divider" style="background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%); border-left: 5px solid #f59e0b; border-radius: 12px; padding: 1.1rem 1.4rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(245,158,11,0.12);">
          <div>
            <h3 style="color: #92400e; font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; margin: 0;">☀️ Morning Shift Timetables</h3>
            <p style="color: #b45309; font-size: 0.84rem; margin: 0.25rem 0 0 0;">Dedicated timetable tables for morning classes</p>
          </div>
          <span style="background: #f59e0b; color: #fff; font-weight: 800; font-size: 0.8rem; padding: 0.3rem 0.85rem; border-radius: 9999px;">${morningGroups.length} Class${morningGroups.length !== 1 ? 'es' : ''}</span>
        </div>`;
      }
      html += morningGroups.map(g => classViewMode === 'list'
        ? buildClassListView(g.entries, g.section, g.shift)
        : buildWeeklyGrid(g.entries, g.section, g.shift)).join('');
    }

    if (eveningGroups.length > 0 && (!shiftF || shiftF === 'Evening Shift')) {
      if (!shiftF) {
        html += `
        <div class="shift-section-divider evening-divider" style="background: linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%); border-left: 5px solid #8b5cf6; border-radius: 12px; padding: 1.1rem 1.4rem; margin: 2.8rem 0 1.5rem 0; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(139,92,246,0.12);">
          <div>
            <h3 style="color: #5b21b6; font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; margin: 0;">🌙 Evening Shift Timetables</h3>
            <p style="color: #6d28d9; font-size: 0.84rem; margin: 0.25rem 0 0 0;">Dedicated timetable tables for evening classes</p>
          </div>
          <span style="background: #8b5cf6; color: #fff; font-weight: 800; font-size: 0.8rem; padding: 0.3rem 0.85rem; border-radius: 9999px;">${eveningGroups.length} Class${eveningGroups.length !== 1 ? 'es' : ''}</span>
        </div>`;
      }
      html += eveningGroups.map(g => classViewMode === 'list'
        ? buildClassListView(g.entries, g.section, g.shift)
        : buildWeeklyGrid(g.entries, g.section, g.shift)).join('');
    }

    classResultsArea.innerHTML = html;
  }

  /* Weekly Grid View */
  function buildWeeklyGrid(entries, section, shift) {
    const timeSlots = [...new Set(entries.map(e => e.time))].sort((a, b) => {
      const sa = parseSlotTime(a);
      const sb = parseSlotTime(b);
      return (sa ? sa.start : 0) - (sb ? sb.start : 0);
    });

    const lup = {};
    timeSlots.forEach(t => {
      lup[t] = {};
      DAYS.forEach(d => { lup[t][d] = null; });
    });
    entries.forEach(e => { if (lup[e.time]) lup[e.time][e.day] = e; });

    const semester   = entries[0] ? entries[0].semester : '';
    const pillCls    = shift === 'Morning Shift' ? 'tt-pill-m' : 'tt-pill-e';
    const shiftLabel = shiftShort(shift);

    let rows = timeSlots.map(ts => {
      const cells = DAYS.map(day => {
        const e = lup[ts][day];
        if (!e) return `<td><div class="tt-empty">—</div></td>`;
        const t = getType(e);
        if (t === 'jummah') {
          return `<td><div class="tt-entry jummah" data-entry-id="${e._id}">🕌 Jummah Break</div></td>`;
        }
        const tba = !e.teacher || e.teacher === 'TO BE ASSIGNED';
        return `<td>
          <div class="tt-entry ${t}" data-entry-id="${e._id}" title="Click to view details">
            <span class="tt-type-badge">${typeLabel(t)}</span>
            <div class="tt-code">${esc(e.course_code || '')}</div>
            <div class="tt-subj">${esc(e.subject || '')}</div>
            <div class="tt-teacher">👤 ${esc(tba ? 'TO BE ASSIGNED' : e.teacher)}</div>
            <div class="tt-room">📍 ${esc(e.room || 'TBA')}</div>
          </div>
        </td>`;
      }).join('');
      return `<tr>
        <td class="tc-time">${esc(ts)}</td>
        ${cells}
      </tr>`;
    }).join('');

    const courses = getSectionCourses(entries, section, shift);
    let coursesTableHtml = '';
    if (courses.length > 0) {
      coursesTableHtml = `
        <div class="tt-legend-box" style="margin-top:1.2rem; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--r-lg); padding:1rem 1.2rem;">
          <div style="font-size:0.85rem; font-weight:800; color:var(--tx-1); display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem;">
            <span>📚 Course Allocations &amp; Legend</span>
            <span style="font-size:0.75rem; font-weight:700; color:var(--tx-3);">${courses.length} Course Offering${courses.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="tbl-wrap">
            <table class="data-tbl" style="font-size:0.78rem;">
              <thead>
                <tr>
                  <th style="width:110px;">Code</th>
                  <th>Course Title</th>
                  <th>Instructor</th>
                  <th style="width:80px; text-align:center;">Cr Hrs</th>
                  <th>Room(s)</th>
                  <th>Location / Block</th>
                </tr>
              </thead>
              <tbody>
                ${courses.map(c => `
                  <tr>
                    <td><span class="bdg bdg-code">${esc(c.code || '—')}</span></td>
                    <td><strong>${esc(c.title || '—')}</strong></td>
                    <td style="font-weight:600;">👤 ${esc(c.instructor || 'TO BE ASSIGNED')}</td>
                    <td style="text-align:center; font-family:var(--mono);">${esc(c.cr_hrs || '—')}</td>
                    <td><span class="bdg bdg-room">📍 ${esc(c.rooms || 'TBA')}</span></td>
                    <td style="color:var(--tx-3); font-size:0.74rem;">${esc(c.location || '—')}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    }

    return `
      <div class="tt-block">
        <div class="tt-hd">
          <div class="tt-hd-title">📋 ${esc(section)}</div>
          <div class="tt-hd-pills">
            <span class="tt-pill">${esc(semester)}</span>
            <span class="tt-pill ${pillCls}">${shiftLabel}</span>
          </div>
        </div>
        <div class="tt-scroll">
          <table class="tt-grid">
            <thead>
              <tr>
                <th class="col-time">Time</th>
                ${DAYS.map(d => `<th class="col-day">${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${coursesTableHtml}
      </div>`;
  }

  function getSectionCourses(entries, section, shift) {
    let courses = CATALOG.filter(c => c.section === section && c.shift === shift);
    if (!courses.length) {
      const seen = new Set();
      entries.forEach(e => {
        if (getType(e) === 'jummah') return;
        const baseKey = getSubjectBaseKey(e);
        if (!seen.has(baseKey)) {
          seen.add(baseKey);
          courses.push({
            code: e.course_code || '—',
            title: cleanSubjectTitle(e.subject) || baseKey,
            instructor: e.teacher || 'TO BE ASSIGNED',
            cr_hrs: e.credit_hours || '—',
            rooms: e.room || 'TBA',
            location: getLocation(e.room)
          });
        }
      });
    }
    return courses;
  }

  /* List / Card View for mobile and alternate view */
  function buildClassListView(entries, section, shift) {
    const semester   = entries[0] ? entries[0].semester : '';
    const pillCls    = shift === 'Morning Shift' ? 'tt-pill-m' : 'tt-pill-e';
    const shiftLabel = shiftShort(shift);

    let daysHtml = DAYS.map(dayName => {
      const dayEntries = entries
        .filter(e => e.day === dayName)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      if (!dayEntries.length) return '';

      const itemsHtml = dayEntries.map(e => {
        const t = getType(e);
        const tba = !e.teacher || e.teacher === 'TO BE ASSIGNED';
        return `
          <div class="tt-card-item" data-entry-id="${e._id}" title="Click to view details">
            <div class="tt-card-left">
              <div class="tt-card-time">⏰ ${esc(e.time)}</div>
              <div class="tt-card-subj">${esc(e.subject || '—')}</div>
              <div class="tt-card-meta">
                <span>👤 ${esc(tba ? 'TO BE ASSIGNED' : e.teacher)}</span>
                <span>📍 ${esc(e.room || 'TBA')}</span>
                ${e.course_code ? `<span class="bdg bdg-code">${esc(e.course_code)}</span>` : ''}
              </div>
            </div>
            <div class="tt-card-right">
              <span class="bdg bdg-${t}">${typeLabel(t)}</span>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="tt-day-card-group">
          <div class="tt-day-card-hd">
            <span>📅 ${dayName}</span>
            <span class="day-sec-cnt">${dayEntries.length} class${dayEntries.length !== 1 ? 'es' : ''}</span>
          </div>
          <div class="tt-card-items">${itemsHtml}</div>
        </div>
      `;
    }).filter(Boolean).join('');

    const courses = getSectionCourses(entries, section, shift);
    let coursesListHtml = '';
    if (courses.length > 0) {
      coursesListHtml = `
        <div class="tt-legend-box" style="margin-top:1.2rem; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--r-lg); padding:1rem 1.2rem;">
          <div style="font-size:0.85rem; font-weight:800; color:var(--tx-1); display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem;">
            <span>📚 Course Allocations &amp; Legend</span>
            <span style="font-size:0.75rem; font-weight:700; color:var(--tx-3);">${courses.length} Course Offering${courses.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="tbl-wrap">
            <table class="data-tbl" style="font-size:0.78rem;">
              <thead>
                <tr>
                  <th style="width:110px;">Code</th>
                  <th>Course Title</th>
                  <th>Instructor</th>
                  <th style="width:80px; text-align:center;">Cr Hrs</th>
                  <th>Room(s)</th>
                  <th>Location / Block</th>
                </tr>
              </thead>
              <tbody>
                ${courses.map(c => `
                  <tr>
                    <td><span class="bdg bdg-code">${esc(c.code || '—')}</span></td>
                    <td><strong>${esc(c.title || '—')}</strong></td>
                    <td style="font-weight:600;">👤 ${esc(c.instructor || 'TO BE ASSIGNED')}</td>
                    <td style="text-align:center; font-family:var(--mono);">${esc(c.cr_hrs || '—')}</td>
                    <td><span class="bdg bdg-room">📍 ${esc(c.rooms || 'TBA')}</span></td>
                    <td style="color:var(--tx-3); font-size:0.74rem;">${esc(c.location || '—')}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    }

    return `
      <div class="tt-list-block">
        <div class="tt-hd">
          <div class="tt-hd-title">📋 ${esc(section)}</div>
          <div class="tt-hd-pills">
            <span class="tt-pill">${esc(semester)}</span>
            <span class="tt-pill ${pillCls}">${shiftLabel}</span>
          </div>
        </div>
        <div class="tt-list-days">
          ${daysHtml || '<div class="empty-state"><h3>No schedule found</h3></div>'}
        </div>
        ${coursesListHtml}
      </div>
    `;
  }

  /* Class Wise event listeners */
  [classSemesterSelect, classSectionSelect, classShiftSelect, classDaySelect].forEach(el =>
    el.addEventListener('change', renderClassWise)
  );
  classKeyword.addEventListener('input', renderClassWise);
  document.getElementById('btnClassReset').addEventListener('click', () => {
    classSemesterSelect.value = '';
    classSectionSelect.value  = '';
    classShiftSelect.value    = '';
    classDaySelect.value      = '';
    classKeyword.value        = '';
    renderClassWise();
  });

  /* ══════════════════════════════════════════════════════════
     SCHEDULE
  ══════════════════════════════════════════════════════════ */
  let scheduleInited = false;
  let schedSubTab = 'today';

  function initSchedule() {
    if (scheduleInited) return;
    scheduleInited = true;

    const schedDeptFilter = document.getElementById('schedDeptFilter');
    ALL_DEPTS.filter(d => ENTRIES.some(e => e.department === d)).forEach(d => {
      const o = document.createElement('option');
      o.value = d; o.textContent = d;
      schedDeptFilter.appendChild(o);
    });

    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const todayName = dayNames[new Date().getDay()];
    const lbl = document.getElementById('todayLabel');
    if (lbl) lbl.textContent = `Today is ${todayName} — ${
      DAYS.includes(todayName) ? 'showing live schedule' : 'no university timetable (weekend)'
    }`;

    const schedDaySelect = document.getElementById('schedDaySelect');
    schedDaySelect.value = DAYS.includes(todayName) ? todayName : 'Monday';

    document.querySelectorAll('.sub-tab').forEach(btn =>
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        schedSubTab = btn.dataset.subtab;
        document.getElementById('dayWiseCtrl').style.display =
          schedSubTab === 'daywise' ? '' : 'none';
        renderSchedule();
      })
    );

    document.getElementById('schedDeptFilter').addEventListener('change', renderSchedule);
    document.getElementById('schedShiftFilter').addEventListener('change', renderSchedule);
    document.getElementById('schedDaySelect').addEventListener('change', renderSchedule);
    document.getElementById('btnScheduleReset').addEventListener('click', () => {
      document.getElementById('schedDeptFilter').value = '';
      document.getElementById('schedShiftFilter').value = '';
      renderSchedule();
    });

    renderSchedule();
  }

  function renderSchedule() {
    const deptF  = document.getElementById('schedDeptFilter').value;
    const shiftF = document.getElementById('schedShiftFilter').value;
    const dayV   = document.getElementById('schedDaySelect').value;
    const area   = document.getElementById('scheduleResultsArea');

    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const todayName = dayNames[new Date().getDay()];
    const isTodayWeekday = DAYS.includes(todayName);

    if (schedSubTab === 'today' && !isTodayWeekday) {
      area.innerHTML = `
        <div class="empty-state">
          <div class="empty-ico">🎉</div>
          <h3>No Classes Today</h3>
          <p>Today is ${todayName} — enjoy your weekend!</p>
        </div>`;
      return;
    }

    let targetDays = [];
    if (schedSubTab === 'today')         targetDays = [todayName];
    else if (schedSubTab === 'daywise')  targetDays = [dayV];
    else                                 targetDays = DAYS;

    let filtered = ENTRIES.filter(e => {
      if (schedSubTab !== 'shiftwise' && !targetDays.includes(e.day)) return false;
      if (schedSubTab === 'shiftwise' && !DAYS.includes(e.day)) return false;
      if (deptF  && e.department !== deptF)  return false;
      if (shiftF && e.shift      !== shiftF) return false;
      return true;
    });

    if (!filtered.length) {
      area.innerHTML = `
        <div class="empty-state">
          <div class="empty-ico">📭</div>
          <h3>No Classes Found</h3>
          <p>No entries match the selected filters.</p>
        </div>`;
      return;
    }

    let html = '';

    if (schedSubTab === 'shiftwise') {
      ['Morning Shift', 'Evening Shift'].forEach(shift => {
        const shiftEntries = filtered.filter(e => e.shift === shift);
        if (!shiftEntries.length) return;
        const cls = shift === 'Morning Shift' ? 'morning' : 'evening';
        html += `<div class="shift-hd ${cls}">${shiftShort(shift)} &mdash; ${shiftEntries.length} entries</div>`;
        html += buildDayTable(shiftEntries, DAYS);
      });
    } else {
      html = buildDayTable(filtered, targetDays);
    }

    area.innerHTML = html;
  }

  function renderTableMarkup(dayEntries) {
    return `
      <div class="tbl-wrap" style="margin-bottom: 1.2rem;">
        <table class="data-tbl">
          <thead>
            <tr>
              <th>Time</th>
              <th>Code</th>
              <th>Subject</th>
              <th>Section</th>
              <th>Shift</th>
              <th>Department</th>
              <th>Teacher</th>
              <th>Room</th>
            </tr>
          </thead>
          <tbody>
            ${dayEntries.map(e => `<tr data-entry-id="${e._id}" style="cursor:pointer" title="Click to view details">
              <td><span class="bdg bdg-time">${esc(e.time)}</span></td>
              <td><span class="bdg bdg-code">${esc(e.course_code || '—')}</span></td>
              <td><strong>${esc(e.subject || '—')}</strong></td>
              <td><span class="bdg bdg-class">${esc(e.section)}</span></td>
              <td><span class="bdg ${shiftBadgeCls(e.shift)}">${shiftShort(e.shift)}</span></td>
              <td><span class="bdg bdg-dept">${esc(e.department || '—')}</span></td>
              <td style="font-size:0.82rem">${esc(e.teacher || 'TO BE ASSIGNED')}</td>
              <td><span class="bdg bdg-room">📍 ${esc(e.room || 'TBA')}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function buildDayTable(entries, daysToShow) {
    let html = '';
    daysToShow.forEach(day => {
      const dayEntries = entries.filter(e => e.day === day);
      if (!dayEntries.length) return;

      const mEntries = dayEntries.filter(e => e.shift === 'Morning Shift').sort((a, b) => a.start_time.localeCompare(b.start_time));
      const eEntries = dayEntries.filter(e => e.shift === 'Evening Shift').sort((a, b) => a.start_time.localeCompare(b.start_time));

      html += `
        <div class="day-section">
          <div class="day-sec-hd">
            <span class="day-sec-title">📅 ${day}</span>
            <span class="day-sec-cnt">${dayEntries.length} total class${dayEntries.length !== 1 ? 'es' : ''}</span>
          </div>`;

      if (mEntries.length > 0) {
        html += `
          <div style="margin: 0.6rem 0 0.4rem 0; font-size: 0.88rem; font-weight: 800; color: #b45309; display: flex; align-items: center; gap: 0.4rem;">
            <span>☀️ Morning Shift</span>
            <span class="bdg bdg-morning" style="font-size:0.72rem;">${mEntries.length} class${mEntries.length !== 1 ? 'es' : ''}</span>
          </div>
          ${renderTableMarkup(mEntries)}`;
      }

      if (eEntries.length > 0) {
        html += `
          <div style="margin: 1.2rem 0 0.4rem 0; font-size: 0.88rem; font-weight: 800; color: #6d28d9; display: flex; align-items: center; gap: 0.4rem;">
            <span>🌙 Evening Shift</span>
            <span class="bdg bdg-evening" style="font-size:0.72rem;">${eEntries.length} class${eEntries.length !== 1 ? 'es' : ''}</span>
          </div>
          ${renderTableMarkup(eEntries)}`;
      }

      html += `</div>`;
    });
    return html || `<div class="empty-state"><div class="empty-ico">📭</div><h3>No entries</h3></div>`;
  }

  /* ══════════════════════════════════════════════════════════
     SUBJECTS
  ══════════════════════════════════════════════════════════ */
  function renderSubjects() {
    const searchBox   = document.getElementById('subjectSearchBox');
    const deptFilter  = document.getElementById('subjectDeptFilter');
    const typeFilter  = document.getElementById('subjectTypeFilter');
    const area        = document.getElementById('subjectsResultsArea');

    if (deptFilter.children.length === 1) {
      ALL_DEPTS.filter(d => ENTRIES.some(e => e.department === d)).forEach(d => {
        const o = document.createElement('option');
        o.value = d; o.textContent = d;
        deptFilter.appendChild(o);
      });
    }

    const subjectMap = {};
    ENTRIES.forEach(e => {
      if (!e.course_code && !e.subject) return;
      if (getType(e) === 'jummah') return;
      const key = getSubjectBaseKey(e);
      if (!key) return;
      if (!subjectMap[key]) {
        const cleanCode = (e.course_code || '—').replace(/\s*\(LAB\)/i, '').trim();
        subjectMap[key] = {
          code: cleanCode,
          name: cleanSubjectTitle(e.subject) || key,
          departments: new Set(),
          teachers: new Set(),
          classes: new Set(),
          rooms: new Set(),
          types: new Set(),
          credit_hours: e.credit_hours || ''
        };
      }
      const s = subjectMap[key];
      if (e.department) s.departments.add(e.department);
      if (e.teacher && e.teacher !== 'TO BE ASSIGNED') s.teachers.add(e.teacher);
      if (e.section) s.classes.add(e.section);
      if (e.room && e.room !== 'TBA') s.rooms.add(e.room);
      if (e.credit_hours && !s.credit_hours) s.credit_hours = e.credit_hours;
      s.types.add(getType(e));
    });

    function doRender() {
      const kw    = searchBox.value.trim().toLowerCase();
      const deptF = deptFilter.value;
      const typeF = typeFilter.value;

      let subjects = Object.values(subjectMap).sort((a, b) => a.code.localeCompare(b.code));

      if (kw) {
        subjects = subjects.filter(s =>
          s.code.toLowerCase().includes(kw) || s.name.toLowerCase().includes(kw)
        );
      }
      if (deptF) subjects = subjects.filter(s => s.departments.has(deptF));
      if (typeF) subjects = subjects.filter(s => s.types.has(typeF));

      if (!subjects.length) {
        area.innerHTML = `
          <div class="empty-state">
            <div class="empty-ico">📭</div>
            <h3>No Subjects Found</h3>
            <p>Adjust your search or filters.</p>
          </div>`;
        return;
      }

      area.innerHTML = `
        <div class="result-count">Showing ${subjects.length} subject${subjects.length !== 1 ? 's' : ''}</div>
        <div class="subj-grid">
          ${subjects.map(s => {
            const typeBadges = [...s.types]
              .map(t => `<span class="bdg bdg-${t}">${typeLabel(t)}</span>`).join(' ');
            const teachers = [...s.teachers].join(', ') || 'TO BE ASSIGNED';
            const classes  = [...s.classes].sort().join(', ');
            const depts    = [...s.departments].join(', ');
            const rooms    = [...s.rooms].join(', ') || 'TBA';
            return `
              <div class="subj-card">
                <div class="subj-code">${esc(s.code)} ${s.credit_hours ? `<span style="font-size:0.75rem;font-weight:normal;color:var(--tx-3)">(${esc(s.credit_hours)})</span>` : ''}</div>
                <div class="subj-name">${esc(s.name)}</div>
                <div class="subj-meta">
                  <div class="subj-meta-row"><span class="ico">👨‍🏫</span><span>${esc(teachers)}</span></div>
                  <div class="subj-meta-row"><span class="ico">🎓</span><span>${esc(classes)}</span></div>
                  <div class="subj-meta-row"><span class="ico">🏛️</span><span>${esc(depts)}</span></div>
                  <div class="subj-meta-row"><span class="ico">🏫</span><span>${esc(rooms)}</span></div>
                  <div class="subj-meta-row">${typeBadges}</div>
                </div>
              </div>`;
          }).join('')}
        </div>`;
    }

    searchBox.addEventListener('input',  doRender);
    deptFilter.addEventListener('change', doRender);
    typeFilter.addEventListener('change', doRender);
    document.getElementById('btnSubjectsReset').addEventListener('click', () => {
      searchBox.value = ''; deptFilter.value = ''; typeFilter.value = '';
      doRender();
    });

    doRender();
  }

  /* ══════════════════════════════════════════════════════════
     ROOMS — with real-time live availability & schedule modal
  ══════════════════════════════════════════════════════════ */
  function renderRooms() {
    const searchBox       = document.getElementById('roomSearchBox');
    const liveFilter      = document.getElementById('roomLiveFilter');
    const typeFilter      = document.getElementById('roomTypeFilter');
    const dayFilter       = document.getElementById('roomDayFilter');
    const area            = document.getElementById('roomsResultsArea');
    const roomClockText   = document.getElementById('roomLiveClockText');
    const roomClockSub    = document.getElementById('roomLiveClockSub');
    const roomFreePill    = document.getElementById('roomLiveFreeCount');
    const roomBusyPill    = document.getElementById('roomLiveBusyCount');

    const roomMap = {};
    ENTRIES.forEach(e => {
      const room = (e.room || '').trim();
      if (!room) return;
      if (!roomMap[room]) {
        roomMap[room] = {
          name: room,
          classes: new Set(),
          subjects: new Set(),
          teachers: new Set(),
          days: new Set(),
          entries: [],
          count: 0
        };
      }
      roomMap[room].classes.add(e.section);
      if (e.subject) roomMap[room].subjects.add(e.subject);
      if (e.teacher && e.teacher !== 'TO BE ASSIGNED') roomMap[room].teachers.add(e.teacher);
      if (e.day) roomMap[room].days.add(e.day);
      roomMap[room].entries.push(e);
      roomMap[room].count++;
    });

    function doRender() {
      const kw    = searchBox.value.trim().toLowerCase();
      const liveF = liveFilter ? liveFilter.value : '';
      const typeF = typeFilter.value;
      const dayF  = dayFilter.value;

      const sys = getLiveSystemInfo();
      let allRooms = Object.values(roomMap).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      // Live status calculations
      let freeCount = 0;
      let busyCount = 0;
      allRooms.forEach(r => {
        const live = getRoomLiveStatus(r.name);
        r._live = live;
        if (live.status === 'busy') busyCount++;
        else freeCount++;
      });

      if (roomClockText) roomClockText.textContent = `System Time: ${sys.fullText}`;
      if (roomClockSub)  roomClockSub.textContent  = sys.isWeekday
        ? `Real-time room occupancy synced with university timetable for ${sys.currentDay}`
        : `Weekend &mdash; All rooms available today`;
      if (roomFreePill)  roomFreePill.innerHTML  = `<span class="pulse-dot free"></span> ${freeCount} Rooms Free Now`;
      if (roomBusyPill)  roomBusyPill.innerHTML  = `<span class="pulse-dot busy"></span> ${busyCount} In Lecture`;

      let filteredRooms = allRooms;

      if (kw) filteredRooms = filteredRooms.filter(r => r.name.toLowerCase().includes(kw));
      if (liveF) filteredRooms = filteredRooms.filter(r => r._live.status === liveF);
      if (typeF === 'ctb')        filteredRooms = filteredRooms.filter(r => r.name.toLowerCase().startsWith('ctb'));
      else if (typeF === 'clab')   filteredRooms = filteredRooms.filter(r => r.name.toLowerCase().startsWith('clab'));
      else if (typeF === 'online') filteredRooms = filteredRooms.filter(r => r.name.toLowerCase() === 'online');
      if (dayF) filteredRooms = filteredRooms.filter(r => r.days.has(dayF));

      if (!filteredRooms.length) {
        area.innerHTML = `
          <div class="empty-state">
            <div class="empty-ico">🏫</div>
            <h3>No Rooms Found</h3>
            <p>Adjust your search or live status filters.</p>
          </div>`;
        return;
      }

      area.innerHTML = `
        <div class="result-count">Showing ${filteredRooms.length} room${filteredRooms.length !== 1 ? 's' : ''}</div>
        <div class="room-cards-grid">
          ${filteredRooms.map(r => {
            const classesStr = [...r.classes].sort().slice(0, 4).join(', ') + (r.classes.size > 4 ? '...' : '');
            const daysStr    = DAYS.filter(d => r.days.has(d)).join(', ');
            const live       = r._live;
            return `
              <div class="room-card" data-room-name="${esc(r.name)}" style="display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <div class="room-card-hd" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.6rem;">
                    <span class="room-card-name" style="font-size:1.15rem; font-weight:800;">📍 ${esc(r.name)}</span>
                    <span class="live-pill ${live.badgeCls}" style="font-size:0.75rem; padding:0.25rem 0.65rem;">
                      <span class="pulse-dot ${live.badgeCls}"></span> ${live.badgeText}
                    </span>
                  </div>

                  <div class="room-live-status-box" style="background:var(--bg-surface); border-radius:8px; padding:0.6rem 0.8rem; margin-bottom:0.75rem; border-left:3.5px solid ${live.status === 'busy' ? '#8b5cf6' : '#10b981'}; font-size:0.8rem; line-height:1.45; color:var(--tx-1);">
                    ${live.message}
                  </div>

                  <div class="room-card-body">
                    <div class="room-card-stat">🏛️ <strong>${esc(getLocation(r.name))}</strong></div>
                    <div class="room-card-stat">📚 <strong>${r.subjects.size}</strong> subjects &middot; <strong>${r.count}</strong> weekly slots</div>
                    <div class="room-card-stat">🎓 <strong>${r.classes.size}</strong> classes: ${esc(classesStr)}</div>
                    <div class="room-card-stat">👨‍🏫 <strong>${r.teachers.size}</strong> faculty members</div>
                    <div class="room-card-stat">📅 Days: ${esc(daysStr)}</div>
                  </div>
                </div>

                <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border);">
                  <button type="button" class="btn-room-schedule" data-open-room="${esc(r.name)}" style="width:100%; padding:0.5rem 0.8rem; border-radius:8px; background:var(--primary); color:#fff; font-weight:700; font-size:0.82rem; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.4rem; transition:opacity 0.2s;">
                    📅 View Full Weekly Schedule
                  </button>
                </div>
              </div>`;
          }).join('')}
        </div>`;

      // Attach click events for Room Schedule buttons
      area.querySelectorAll('[data-open-room]').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          openRoomModal(btn.dataset.openRoom);
        });
      });
    }

    searchBox.addEventListener('input',   doRender);
    if (liveFilter) liveFilter.addEventListener('change', doRender);
    typeFilter.addEventListener('change', doRender);
    dayFilter.addEventListener('change',  doRender);
    document.getElementById('btnRoomsReset').addEventListener('click', () => {
      searchBox.value = '';
      if (liveFilter) liveFilter.value = '';
      typeFilter.value = '';
      dayFilter.value = '';
      doRender();
    });

    doRender();
  }

  /* ══════════════════════════════════════════════════════════
     STATISTICS — fully dynamic data calculations
  ══════════════════════════════════════════════════════════ */
  function renderStatistics() {
    const uniqueAssignments = [];
    const seenAssignments = new Set();
    ENTRIES.forEach(e => {
      if (getType(e) === 'jummah') return;
      const key = (e.teacher || 'TBA') + '||' + e.section + '||' + e.shift + '||' + getSubjectBaseKey(e);
      if (!seenAssignments.has(key)) {
        seenAssignments.add(key);
        uniqueAssignments.push(e);
      }
    });

    const uniqueClasses  = new Set(ENTRIES.map(e => e.department + '||' + e.section + '||' + e.shift)).size;
    const morningClasses = new Set(ENTRIES.filter(e => e.shift === 'Morning Shift').map(e => e.department + '||' + e.section + '||' + e.shift)).size;
    const eveningClasses = new Set(ENTRIES.filter(e => e.shift === 'Evening Shift').map(e => e.department + '||' + e.section + '||' + e.shift)).size;
    const uniqueSections = new Set(ENTRIES.map(e => e.section)).size;
    const uniqueTeachers = new Set(ENTRIES.map(e => e.teacher).filter(t => t && t !== 'TO BE ASSIGNED')).size;
    const uniqueSubjects = new Set(ENTRIES.map(e => getSubjectBaseKey(e)).filter(Boolean)).size;
    const uniqueCodes    = new Set(ENTRIES.map(e => (e.course_code || '').replace(/\s*\(LAB\)/i, '').trim()).filter(Boolean)).size;
    const uniqueRooms    = new Set(ENTRIES.map(e => e.room).filter(Boolean)).size;
    const uniqueSems     = new Set(ENTRIES.map(e => e.semester).filter(Boolean)).size;
    const uniqueDepts    = new Set(ENTRIES.map(e => e.department).filter(Boolean)).size;

    const overallGrid = document.getElementById('statsOverallGrid');
    overallGrid.innerHTML = [
      { icon:'🏛️', value: uniqueDepts,             label:'Departments'          },
      { icon:'🎓', value: uniqueClasses,           label:'Unique Classes'       },
      { icon:'☀️', value: morningClasses,          label:'Morning Classes'      },
      { icon:'🌙', value: eveningClasses,          label:'Evening Classes'      },
      { icon:'📋', value: uniqueSections,          label:'Unique Sections'      },
      { icon:'📅', value: uniqueSems,              label:'Semesters'            },
      { icon:'👨‍🏫', value: uniqueTeachers,         label:'Faculty Members'      },
      { icon:'📚', value: uniqueSubjects,          label:'Subjects (Normalized)'},
      { icon:'🔖', value: uniqueCodes,             label:'Course Codes'         },
      { icon:'🏫', value: uniqueRooms,             label:'Rooms & Labs'         },
      { icon:'📊', value: uniqueAssignments.length,label:'Total Course Offerings'},
      { icon:'⏰', value: ENTRIES.length,          label:'Weekly Class Periods' }
    ].map(c => `
      <div class="stat-card">
        <div class="stat-card-icon">${c.icon}</div>
        <div class="stat-card-value">${c.value.toLocaleString()}</div>
        <div class="stat-card-label">${c.label}</div>
      </div>`).join('');

    // Type breakdown
    const theoryN    = ENTRIES.filter(e => getType(e) === 'theory').length;
    const labN       = ENTRIES.filter(e => getType(e) === 'lab').length;
    const onlineN    = ENTRIES.filter(e => getType(e) === 'online').length;
    const unassignN  = ENTRIES.filter(e => getType(e) === 'unassigned').length;
    const jummahN    = ENTRIES.filter(e => getType(e) === 'jummah').length;

    document.getElementById('statsTypeGrid').innerHTML = [
      { icon:'📖', value: theoryN,   label:'Theory Lectures',     cls:'theory'    },
      { icon:'🔬', value: labN,      label:'Lab Sessions',        cls:'lab'       },
      { icon:'🌐', value: onlineN,   label:'Online Classes',      cls:'online'    },
      { icon:'❓', value: unassignN, label:'To Be Assigned',      cls:'unassign'  },
      { icon:'🕌', value: jummahN,   label:'Jummah Break',        cls:'jummah'    }
    ].map(c => `
      <div class="stat-card">
        <div class="stat-card-icon">${c.icon}</div>
        <div class="stat-card-value" style="color:var(--${c.cls}-c)">${c.value.toLocaleString()}</div>
        <div class="stat-card-label">${c.label}</div>
      </div>`).join('');

    // Shift distribution
    document.getElementById('statsShiftGrid').innerHTML = [
      { icon:'☀️', value: morningClasses, label: `Morning Shift (${Math.round(morningClasses / uniqueClasses * 100) || 0}% of classes)` },
      { icon:'🌙', value: eveningClasses, label: `Evening Shift (${Math.round(eveningClasses / uniqueClasses * 100) || 0}% of classes)` }
    ].map(c => `
      <div class="stat-card">
        <div class="stat-card-icon">${c.icon}</div>
        <div class="stat-card-value">${c.value.toLocaleString()}</div>
        <div class="stat-card-label">${c.label}</div>
      </div>`).join('');

    // Department table
    const deptRows = ALL_DEPTS.map(dept => {
      const de = ENTRIES.filter(e => e.department === dept);
      if (!de.length) return null;
      const cls   = new Set(de.map(e => e.department + '||' + e.section + '||' + e.shift)).size;
      const morn  = new Set(de.filter(e => e.shift === 'Morning Shift').map(e => e.department + '||' + e.section + '||' + e.shift)).size;
      const eve   = new Set(de.filter(e => e.shift === 'Evening Shift').map(e => e.department + '||' + e.section + '||' + e.shift)).size;
      const teach = new Set(de.map(e => e.teacher).filter(t => t && t !== 'TO BE ASSIGNED')).size;
      const subs  = new Set(de.map(e => getSubjectBaseKey(e)).filter(Boolean)).size;
      return { dept, cls, morn, eve, teach, subs, periods: de.length };
    }).filter(Boolean);

    document.getElementById('statsDeptTable').innerHTML = `
      <table class="data-tbl">
        <thead>
          <tr>
            <th>Department</th>
            <th>Unique Classes</th>
            <th>Morning</th>
            <th>Evening</th>
            <th>Faculty</th>
            <th>Subjects</th>
            <th>Weekly Slots</th>
          </tr>
        </thead>
        <tbody>
          ${deptRows.map(d => `<tr>
            <td><strong>${DEPT_ICONS[d.dept] || '📁'} ${esc(d.dept)}</strong></td>
            <td><strong>${d.cls}</strong></td>
            <td><span class="bdg bdg-morning">☀️ ${d.morn}</span></td>
            <td><span class="bdg bdg-evening">🌙 ${d.eve}</span></td>
            <td>${d.teach}</td>
            <td>${d.subs}</td>
            <td>${d.periods}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;

    // Semester table
    const semMap = {};
    ENTRIES.forEach(e => {
      if (!e.semester) return;
      if (!semMap[e.semester]) {
        semMap[e.semester] = {
          sem: e.semester,
          classes: new Set(),
          mornClasses: new Set(),
          eveClasses: new Set(),
          periods: 0
        };
      }
      const classKey = e.department + '||' + e.section + '||' + e.shift;
      semMap[e.semester].classes.add(classKey);
      if (e.shift === 'Morning Shift') semMap[e.semester].mornClasses.add(classKey);
      else semMap[e.semester].eveClasses.add(classKey);
      semMap[e.semester].periods++;
    });

    const semArr = Object.values(semMap).sort((a, b) => parseInt(a.sem, 10) - parseInt(b.sem, 10));

    document.getElementById('statsSemTable').innerHTML = `
      <table class="data-tbl">
        <thead>
          <tr>
            <th>Semester</th>
            <th>Unique Classes</th>
            <th>Morning</th>
            <th>Evening</th>
            <th>Weekly Periods</th>
          </tr>
        </thead>
        <tbody>
          ${semArr.map(s => `<tr>
            <td><strong>${esc(s.sem)}</strong></td>
            <td><strong>${s.classes.size}</strong></td>
            <td><span class="bdg bdg-morning">☀️ ${s.mornClasses.size}</span></td>
            <td><span class="bdg bdg-evening">🌙 ${s.eveClasses.size}</span></td>
            <td>${s.periods}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;

    // Teacher workload table
    const teachMap = {};
    ENTRIES.forEach(e => {
      if (!e.teacher || e.teacher === 'TO BE ASSIGNED') return;
      if (!teachMap[e.teacher]) {
        teachMap[e.teacher] = {
          name: e.teacher,
          periods: 0,
          mornPeriods: 0,
          evePeriods: 0,
          depts: new Set(),
          classes: new Set(),
          subjects: new Set(),
          assignments: new Set()
        };
      }
      const t = teachMap[e.teacher];
      t.periods++;
      if (e.shift === 'Morning Shift') t.mornPeriods++;
      else t.evePeriods++;
      t.depts.add(e.department);
      t.classes.add(e.department + '||' + e.section + '||' + e.shift);
      const sKey = getSubjectBaseKey(e);
      if (sKey) {
        t.subjects.add(sKey);
        t.assignments.add(e.section + '||' + e.shift + '||' + sKey);
      }
    });

    const teachArr = Object.values(teachMap)
      .sort((a, b) => b.periods - a.periods)
      .slice(0, 25);

    document.getElementById('statsTeacherTable').innerHTML = `
      <table class="data-tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>Faculty Member</th>
            <th>Weekly Periods</th>
            <th>Unique Subjects</th>
            <th>Classes Taught</th>
            <th>Course Offerings</th>
            <th>Morning</th>
            <th>Evening</th>
            <th>Departments</th>
          </tr>
        </thead>
        <tbody>
          ${teachArr.map((t, i) => `<tr>
            <td style="color:var(--tx-3);font-variant-numeric:tabular-nums">${i + 1}</td>
            <td><strong>${esc(t.name)}</strong></td>
            <td><strong>${t.periods}</strong></td>
            <td><span class="bdg bdg-code">${t.subjects.size}</span></td>
            <td><span class="bdg bdg-class">${t.classes.size}</span></td>
            <td><strong>${t.assignments.size}</strong></td>
            <td><span class="bdg bdg-morning">☀️ ${t.mornPeriods}</span></td>
            <td><span class="bdg bdg-evening">🌙 ${t.evePeriods}</span></td>
            <td>${t.depts.size}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  }

  /* ══════════════════════════════════════════════════════════
     AUTO REAL-TIME REFRESH TIMER (every 15 seconds)
  ══════════════════════════════════════════════════════════ */
  setInterval(() => {
    if (ALL_SECTIONS.rooms   && ALL_SECTIONS.rooms.classList.contains('active'))   renderRooms();
    if (ALL_SECTIONS.teacher && ALL_SECTIONS.teacher.classList.contains('active')) renderTeacherView();
  }, 15000);

  /* ══════════════════════════════════════════════════════════
     PRINT ENGINE
     Three modes:
       1. printTeacherWise(teacherName)  — one teacher per page
       2. printClassWise(dept, shift)    — one class per page
       3. printScheduleView()            — current schedule table
       4. printRoomSchedule(roomName)    — single room from modal
  ══════════════════════════════════════════════════════════ */
  const PRINT_AREA = document.getElementById('printArea');

  function printDocHeader(mainTitle, subTitle, metaItems) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-PK', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const timeStr = now.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });
    const metas = metaItems.map(m => `<span><strong>${m.k}:</strong> ${m.v}</span>`).join('');
    return `
      <div class="print-header">
        <div class="print-header-top">
          <div>
            <div class="print-logo-text">Emerson University Multan</div>
            <div class="print-faculty-title">Faculty of Computing &amp; Emerging Technologies</div>
          </div>
          <span class="print-tag">Tentative &bull; Fall 2026</span>
        </div>
        <div class="print-main-title">${mainTitle}${subTitle ? ' &mdash; ' + subTitle : ''}</div>
        <div class="print-meta-bar">
          ${metas}
          <span><strong>Printed:</strong> ${dateStr}, ${timeStr}</span>
          <span><strong>Effective w.e.f.:</strong> 07 Sep 2026</span>
        </div>
      </div>`;
  }

  function printDocFooter() {
    return `
      <div class="print-footer">
        <span>Faculty of Computing &amp; Emerging Technologies &bull; Emerson University Multan &bull; Fall 2026</span>
        <span>Timetable is Tentative &bull; Subject to Change</span>
      </div>`;
  }

  function buildPrintGrid(entries, section, shift, dept) {
    const timeSlots = [...new Set(entries.map(e => e.time))].sort((a, b) => {
      const sa = parseSlotTime(a); const sb = parseSlotTime(b);
      return (sa ? sa.start : 0) - (sb ? sb.start : 0);
    });

    const lup = {};
    timeSlots.forEach(t => { lup[t] = {}; DAYS.forEach(d => { lup[t][d] = null; }); });
    entries.forEach(e => { if (lup[e.time]) lup[e.time][e.day] = e; });

    const rows = timeSlots.map(ts => {
      const cells = DAYS.map(day => {
        const e = lup[ts][day];
        if (!e) return `<td><div class="tt-empty">—</div></td>`;
        const t = getType(e);
        if (t === 'jummah') return `<td><div class="tt-entry jummah">Jummah Break</div></td>`;
        const tba = !e.teacher || e.teacher === 'TO BE ASSIGNED';
        return `<td><div class="tt-entry ${t}">
          <span class="tt-type-badge">${typeLabel(t)}</span>
          <div class="tt-code">${esc(e.course_code || '')}</div>
          <div class="tt-subj">${esc(e.subject || '')}</div>
          <div class="tt-teacher">${esc(tba ? 'TBA' : e.teacher)}</div>
          <div class="tt-room">${esc(e.room || 'TBA')}</div>
        </div></td>`;
      }).join('');
      return `<tr><td class="tc-time">${esc(ts)}</td>${cells}</tr>`;
    }).join('');

    const shiftLabel = shift === 'Morning Shift' ? '☀ Morning Shift' : '🌙 Evening Shift';
    const semester   = entries[0] ? `Semester ${entries[0].semester}` : '';
    const pillCls    = shift === 'Morning Shift' ? 'tt-pill-m' : 'tt-pill-e';

    return `
      <div class="tt-block">
        <div class="tt-hd">
          <div class="tt-hd-title">${esc(section)}</div>
          <div class="tt-hd-pills">
            <span class="tt-pill">${esc(semester)}</span>
            <span class="tt-pill ${pillCls}">${shiftLabel}</span>
            ${dept ? `<span class="tt-pill">${esc(dept)}</span>` : ''}
          </div>
        </div>
        <div class="tt-scroll">
          <table class="tt-grid">
            <thead><tr>
              <th class="col-time">Time</th>
              ${DAYS.map(d => `<th class="col-day">${d}</th>`).join('')}
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }

  function buildPrintTable(entries, columns) {
    return `
      <div class="tbl-wrap">
        <table class="data-tbl">
          <thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
          <tbody>${entries.map(e => `<tr>${columns.map(c => `<td>${c.render(e)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>`;
  }

  function triggerPrint(htmlContent) {
    if (!PRINT_AREA) return;
    PRINT_AREA.innerHTML = htmlContent;
    document.body.classList.add('printing-mode');
    window.print();
    // restore after print dialog closes
    setTimeout(() => {
      document.body.classList.remove('printing-mode');
      PRINT_AREA.innerHTML = '';
    }, 1500);
  }

  /* ── 1. PRINT TEACHER WISE ─────────────────────────────── */
  function printTeacherWise() {
    const selected = (teacherSelectBox.value || '').trim();
    const teachers = selected
      ? [selected]
      : [...new Set(ENTRIES.map(e => e.teacher).filter(t => t && t !== 'TO BE ASSIGNED'))].sort();

    if (!teachers.length) {
      alert('No teacher selected or found. Please select a teacher from the dropdown first.');
      return;
    }

    let pages = '';
    teachers.forEach((teacher, idx) => {
      const tEntries = ENTRIES.filter(e => e.teacher === teacher && e.day);

      if (!tEntries.length) return;

      const depts    = [...new Set(tEntries.map(e => e.department))].join(', ');
      const sections = [...new Set(tEntries.map(e => e.section))].sort().join(', ');
      const morn     = tEntries.filter(e => e.shift === 'Morning Shift').length;
      const eve      = tEntries.filter(e => e.shift === 'Evening Shift').length;

      const cols = [
        { label: 'Day',      render: e => esc(e.day) },
        { label: 'Time',     render: e => `<span class="bdg bdg-time">${esc(e.time)}</span>` },
        { label: 'Code',     render: e => esc(e.course_code || '—') },
        { label: 'Subject',  render: e => `<strong>${esc(e.subject || '—')}</strong>` },
        { label: 'Section',  render: e => esc(e.section) },
        { label: 'Semester', render: e => esc(e.semester || '—') },
        { label: 'Shift',    render: e => esc(e.shift === 'Morning Shift' ? '☀ Morning' : '🌙 Evening') },
        { label: 'Room',     render: e => esc(e.room || 'TBA') },
        { label: 'Type',     render: e => typeLabel(getType(e)) }
      ];

      const sorted = [...tEntries].sort((a, b) => {
        const di = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
        if (di !== 0) return di;
        return (a.start_time || '').localeCompare(b.start_time || '');
      });

      if (idx > 0) pages += `<div class="page-break"></div>`;
      pages += `
        <div class="print-doc">
          ${printDocHeader('Faculty Timetable', esc(teacher), [
            { k: 'Department', v: esc(depts) },
            { k: 'Teaching Sections', v: esc(sections) },
            { k: 'Morning Periods', v: String(morn) },
            { k: 'Evening Periods', v: String(eve) },
            { k: 'Total Weekly Periods', v: String(tEntries.length) }
          ])}
          <div class="print-body">
            ${buildPrintTable(sorted, cols)}
          </div>
          ${printDocFooter()}
        </div>`;
    });

    if (!pages) { alert('No timetable data found for the selected teacher.'); return; }
    triggerPrint(pages);
  }

  /* ── 2. PRINT CLASS / PROGRAM WISE ─────────────────────── */
  function printClassWise() {
    if (!activeDept) {
      alert('Please select a department tab first, then click Print Program.');
      return;
    }

    const shiftF = classShiftSelect.value;
    const secF   = classSectionSelect.value;

    let entries = ENTRIES.filter(e => {
      if (e.department !== activeDept) return false;
      if (shiftF && e.shift !== shiftF) return false;
      if (secF   && e.section !== secF) return false;
      return true;
    });

    if (!entries.length) {
      alert('No timetable entries found for the current filter. Please adjust filters and try again.');
      return;
    }

    // Group by section + shift
    const groups = {};
    entries.forEach(e => {
      const key = e.section + '||' + e.shift;
      if (!groups[key]) groups[key] = { section: e.section, shift: e.shift, semester: e.semester, dept: e.department, entries: [] };
      groups[key].entries.push(e);
    });

    const sortedGroups = Object.values(groups).sort((a, b) => {
      const na = parseInt(a.semester, 10) || 0;
      const nb = parseInt(b.semester, 10) || 0;
      if (na !== nb) return na - nb;
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      return a.shift.localeCompare(b.shift);
    });

    const morningGroups = sortedGroups.filter(g => g.shift === 'Morning Shift');
    const eveningGroups = sortedGroups.filter(g => g.shift === 'Evening Shift');

    const totalClasses = sortedGroups.length;
    const totalSlots   = entries.length;

    let pages = '';
    let pageIdx = 0;

    // One page per class group
    const allGroups = [...morningGroups, ...eveningGroups];
    allGroups.forEach((g, idx) => {
      if (idx > 0) pages += `<div class="page-break"></div>`;
      pages += `
        <div class="print-doc">
          ${printDocHeader(
            `${esc(g.dept)} &mdash; Program Timetable`,
            `${esc(g.section)}`,
            [
              { k: 'Program',    v: esc(g.dept) },
              { k: 'Section',    v: esc(g.section) },
              { k: 'Semester',   v: esc(g.semester || '—') },
              { k: 'Shift',      v: g.shift === 'Morning Shift' ? '☀ Morning Shift' : '🌙 Evening Shift' },
              { k: 'Total Slots',v: String(g.entries.length) + ' per week' }
            ]
          )}
          <div class="print-body">
            ${buildPrintGrid(g.entries, g.section, g.shift, g.dept)}
          </div>
          ${printDocFooter()}
        </div>`;
    });

    if (!pages) { alert('Nothing to print.'); return; }
    triggerPrint(pages);
  }

  /* ── 3. PRINT SCHEDULE (current displayed view) ─────────── */
  function printScheduleView() {
    const schedArea = document.getElementById('scheduleResultsArea');
    if (!schedArea || !schedArea.innerHTML.trim() || schedArea.querySelector('.empty-state')) {
      alert('No schedule data is currently displayed. Please load a schedule first.');
      return;
    }

    const deptF  = document.getElementById('schedDeptFilter').value;
    const shiftF = document.getElementById('schedShiftFilter').value;
    const dayV   = document.getElementById('schedDaySelect').value;
    const tabLabel = schedSubTab === 'today' ? 'Today\'s Schedule'
                   : schedSubTab === 'daywise' ? `Day Wise — ${dayV}`
                   : 'Shift Wise Schedule';

    const metaItems = [
      { k: 'View', v: tabLabel },
    ];
    if (deptF)  metaItems.push({ k: 'Department', v: deptF });
    if (shiftF) metaItems.push({ k: 'Shift',      v: shiftF === 'Morning Shift' ? '☀ Morning' : '🌙 Evening' });

    const content = `
      <div class="print-doc">
        ${printDocHeader('University Class Schedule', tabLabel, metaItems)}
        <div class="print-body">${schedArea.innerHTML}</div>
        ${printDocFooter()}
      </div>`;
    triggerPrint(content);
  }

  /* ── 4. PRINT SINGLE ROOM SCHEDULE (from room modal) ───── */
  function printRoomSchedule(roomName) {
    if (!roomName) return;
    const roomEntries = ENTRIES.filter(e => (e.room || '').trim().toLowerCase() === roomName.trim().toLowerCase() && e.day);

    if (!roomEntries.length) {
      alert(`No timetable entries found for room: ${roomName}`);
      return;
    }

    const location  = getLocation(roomName);
    const classes   = [...new Set(roomEntries.map(e => e.section))].sort().join(', ');
    const subjects  = [...new Set(roomEntries.map(e => e.subject).filter(Boolean))].length;
    const teachers  = [...new Set(roomEntries.map(e => e.teacher).filter(t => t && t !== 'TO BE ASSIGNED'))].length;

    const timeSlots = [...new Set(roomEntries.map(e => e.time))].sort((a, b) => {
      const sa = parseSlotTime(a); const sb = parseSlotTime(b);
      return (sa ? sa.start : 0) - (sb ? sb.start : 0);
    });

    const lup = {};
    timeSlots.forEach(t => { lup[t] = {}; DAYS.forEach(d => { lup[t][d] = null; }); });
    roomEntries.forEach(e => { if (lup[e.time]) lup[e.time][e.day] = e; });

    const rows = timeSlots.map(ts => {
      const cells = DAYS.map(day => {
        const e = lup[ts][day];
        if (!e) return `<td><div class="tt-empty">—</div></td>`;
        const t = getType(e);
        if (t === 'jummah') return `<td><div class="tt-entry jummah">Jummah Break</div></td>`;
        const tba = !e.teacher || e.teacher === 'TO BE ASSIGNED';
        return `<td><div class="tt-entry ${t}">
          <span class="tt-type-badge">${typeLabel(t)}</span>
          <div class="tt-code" style="font-weight:700">${esc(e.section)}</div>
          <div class="tt-subj">${esc(e.subject || '')}</div>
          <div class="tt-teacher">${esc(tba ? 'TBA' : e.teacher)}</div>
          <div class="tt-room">${esc(e.shift === 'Morning Shift' ? '☀ Morning' : '🌙 Evening')}</div>
        </div></td>`;
      }).join('');
      return `<tr><td class="tc-time">${esc(ts)}</td>${cells}</tr>`;
    }).join('');

    const content = `
      <div class="print-doc">
        ${printDocHeader('Room Weekly Schedule', `📍 ${esc(roomName)}`, [
          { k: 'Building', v: esc(location) },
          { k: 'Classes Using This Room', v: esc(classes) },
          { k: 'Total Weekly Slots', v: String(roomEntries.length) },
          { k: 'Subjects Taught', v: String(subjects) },
          { k: 'Faculty Members', v: String(teachers) }
        ])}
        <div class="print-body">
          <div class="tt-block">
            <div class="tt-hd">
              <div class="tt-hd-title">📍 Room ${esc(roomName)} — Full Weekly Occupancy Grid</div>
              <div class="tt-hd-pills"><span class="tt-pill">${esc(location)}</span></div>
            </div>
            <div class="tt-scroll">
              <table class="tt-grid">
                <thead><tr>
                  <th class="col-time">Time</th>
                  ${DAYS.map(d => `<th class="col-day">${d}</th>`).join('')}
                </tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        </div>
        ${printDocFooter()}
      </div>`;
    triggerPrint(content);
  }

  /* ── WIRE UP ALL PRINT BUTTONS ──────────────────────────── */
  function initPrintButtons() {
    const btnPrintTeacher  = document.getElementById('btnPrintTeacher');
    const btnPrintClass    = document.getElementById('btnPrintClassView');
    const btnPrintSchedule = document.getElementById('btnPrintSchedule');
    const btnModalRoom     = document.getElementById('btnModalPrintRoom');

    if (btnPrintTeacher)  btnPrintTeacher.addEventListener('click', printTeacherWise);
    if (btnPrintClass)    btnPrintClass.addEventListener('click',   printClassWise);
    if (btnPrintSchedule) btnPrintSchedule.addEventListener('click', printScheduleView);

    if (btnModalRoom) {
      btnModalRoom.addEventListener('click', () => {
        const title = document.getElementById('roomModalTitle');
        if (!title) return;
        // Extract room name from "📍 Room CTB1-01 — Weekly Schedule"
        const match = title.textContent.match(/Room\s+([A-Za-z0-9\-]+)\s*—/);
        if (match) printRoomSchedule(match[1]);
      });
    }
  }

  /* ══════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════ */
  function init() {
    buildHomeStats();
    initTeacherDropdown();
    initDeptTabs();
    initPrintButtons();
    navigateTo('home');
  }

  init();

})();

