/* ============================================================
   University Timetable Portal — app.js
   Faculty of Computing & Emerging Technologies
   Emerson University Multan — Fall 2026
   All data sourced from TIMETABLE_DATA (timetable-data.js)
   ============================================================ */

(function () {
  'use strict';

  /* ── DATA ─────────────────────────────────────────────── */
  const RAW     = window.TIMETABLE_DATA || {};
  const ENTRIES = RAW.schedule_entries  || [];
  const ALL_TEACHERS  = RAW.teachers    || [];
  const ALL_DEPTS     = RAW.departments || [];

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

  function getType(e) {
    if (!e) return 'theory';
    const room  = (e.room    || '').toLowerCase().trim();
    const subj  = (e.subject || '').toLowerCase().trim();
    const teach = (e.teacher || '').toLowerCase().trim();
    if (subj.includes('jummah') || subj === 'jummah break') return 'jummah';
    if (room === 'online' || subj.includes('online'))       return 'online';
    if (room.startsWith('clab') || room.includes(' lab'))   return 'lab';
    if (!e.teacher || teach === '' || teach === 'to be assigned') return 'unassigned';
    return 'theory';
  }

  function typeLabel(t) {
    return { theory:'Theory', lab:'Lab', online:'Online', unassigned:'TBA', jummah:'Jummah' }[t] || 'Theory';
  }

  function shiftShort(s) {
    return s === 'Morning Shift' ? '☀️ Morning' : '🌙 Evening';
  }

  function shiftBadgeCls(s) {
    return s === 'Morning Shift' ? 'bdg-morning' : 'bdg-evening';
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

  // Lazy-render flags
  const rendered = { statistics: false, subjects: false, rooms: false };

  function navigateTo(key) {
    Object.values(ALL_SECTIONS).forEach(s => s && s.classList.remove('active'));
    NAV_BTNS.forEach(b => b.classList.remove('active'));
    if (ALL_SECTIONS[key]) ALL_SECTIONS[key].classList.add('active');
    const btn = document.querySelector(`.nav-btn[data-section="${key}"]`);
    if (btn) btn.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (key === 'schedule'   && !scheduleInited)  initSchedule();
    if (key === 'subjects'   && !rendered.subjects)  { renderSubjects(); rendered.subjects = true; }
    if (key === 'rooms'      && !rendered.rooms)     { renderRooms();    rendered.rooms    = true; }
    if (key === 'statistics' && !rendered.statistics){ renderStatistics(); rendered.statistics = true; }
  }

  window.navigateTo = navigateTo;

  NAV_BTNS.forEach(btn =>
    btn.addEventListener('click', () => navigateTo(btn.dataset.section))
  );

  /* ══════════════════════════════════════════════════════════
     HOME — live stats
  ══════════════════════════════════════════════════════════ */
  function buildHomeStats() {
    const grid = document.getElementById('homeStatsGrid');
    if (!grid) return;

    const uniqueAssignments = [];
    const seenAssignments = new Set();
    ENTRIES.forEach(e => {
      const key = (e.teacher || 'TBA') + '||' + e.section + '||' + (e.course_code || e.subject);
      if (!seenAssignments.has(key)) {
        seenAssignments.add(key);
        uniqueAssignments.push(e);
      }
    });

    const uniqueClasses  = new Set(ENTRIES.map(e => e.section + '||' + e.shift)).size;
    const uniqueTeachers = new Set(ENTRIES.map(e => e.teacher).filter(t => t && t !== 'TO BE ASSIGNED')).size;
    const uniqueSubjects = new Set(ENTRIES.map(e => e.course_code).filter(Boolean)).size;
    const uniqueRooms    = new Set(ENTRIES.map(e => e.room).filter(Boolean)).size;
    const morningCount   = uniqueAssignments.filter(e => e.shift === 'Morning Shift').length;
    const eveningCount   = uniqueAssignments.filter(e => e.shift === 'Evening Shift').length;

    const cards = [
      { icon: '🎓', value: uniqueClasses,       label: 'Unique Classes'   },
      { icon: '👨‍🏫', value: uniqueTeachers,    label: 'Faculty Members'  },
      { icon: '📚', value: uniqueSubjects,       label: 'Subjects'         },
      { icon: '🏫', value: uniqueRooms,          label: 'Rooms & Labs'     },
      { icon: '📋', value: uniqueAssignments.length, label: 'Classes Taught' },
      { icon: '🏛️', value: ALL_DEPTS.length,    label: 'Departments'      },
      { icon: '☀️', value: morningCount,         label: 'Morning Classes'  },
      { icon: '🌙', value: eveningCount,         label: 'Evening Classes'  }
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
  const teacherSearchBox   = document.getElementById('teacherSearchBox');
  const teacherSelectBox   = document.getElementById('teacherSelectBox');
  const teacherDayBox      = document.getElementById('teacherDayBox');
  const teacherShiftBox    = document.getElementById('teacherShiftBox');
  const teacherProfileCard = document.getElementById('teacherProfileCard');
  const teacherResultsArea = document.getElementById('teacherResultsArea');

  function initTeacherDropdown() {
    const teachers = [...new Set(
      ENTRIES.map(e => e.teacher).filter(t => t && t !== 'TO BE ASSIGNED')
    )].sort();

    teacherSelectBox.innerHTML = '<option value="">— All Teachers —</option>' +
      teachers.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  }

  function renderTeacherView() {
    const search   = (teacherSearchBox.value || '').trim().toLowerCase();
    const selected = (teacherSelectBox.value || '').trim();
    const day      = teacherDayBox.value || '';
    const shift    = teacherShiftBox.value || '';

    let filtered = ENTRIES.filter(e => {
      if (!e.teacher) return false;
      if (selected && e.teacher !== selected) return false;
      if (search) {
        const ok = (e.teacher  || '').toLowerCase().includes(search)
                || (e.subject  || '').toLowerCase().includes(search)
                || (e.course_code || '').toLowerCase().includes(search)
                || (e.room     || '').toLowerCase().includes(search);
        if (!ok) return false;
      }
      if (day   && e.day   !== day)   return false;
      if (shift && e.shift !== shift) return false;
      return true;
    });

    // Profile card when a specific teacher is chosen
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
          <p>No entries match. Try a different teacher name, subject, or keyword.</p>
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
                  <th>Room</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                ${dayEntries.map(e => {
                  const t = getType(e);
                  return `<tr>
                    <td><span class="bdg bdg-time">${esc(e.time)}</span></td>
                    <td><span class="bdg bdg-code">${esc(e.course_code || '—')}</span></td>
                    <td><strong>${esc(e.subject || '—')}</strong></td>
                    <td><span class="bdg bdg-class">${esc(e.section)}</span></td>
                    <td style="font-size:0.8rem;color:var(--tx-3)">${esc(e.semester || '—')}</td>
                    <td><span class="bdg ${shiftBadgeCls(e.shift)}">${shiftShort(e.shift)}</span></td>
                    <td style="font-size:0.83rem">${esc(e.teacher || 'TO BE ASSIGNED')}</td>
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
    const uniqueAssignments = [];
    const seen = new Set();
    entries.forEach(e => {
      const key = e.section + '||' + (e.course_code || e.subject);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueAssignments.push(e);
      }
    });

    const totalC  = uniqueAssignments.length;
    const subjs   = new Set(uniqueAssignments.map(e => e.course_code || e.subject).filter(Boolean)).size;
    const rooms   = new Set(uniqueAssignments.map(e => e.room).filter(Boolean)).size;
    const morningC = uniqueAssignments.filter(e => e.shift === 'Morning Shift').length;
    const eveningC = uniqueAssignments.filter(e => e.shift === 'Evening Shift').length;
    const deptNames  = [...new Set(uniqueAssignments.map(e => e.department).filter(Boolean))].join(', ');
    const classNames = [...new Set(uniqueAssignments.map(e => e.section))].sort().join(', ');

    teacherProfileCard.innerHTML = `
      <div class="t-avatar">👨‍🏫</div>
      <div>
        <div class="t-name">${esc(teacher)}</div>
        <div class="t-meta">${esc(deptNames)}</div>
        <div class="t-meta" style="margin-top:0.15rem;font-size:0.72rem">Teaching: ${esc(classNames)}</div>
        <div class="t-stats">
          <div class="t-stat"><span class="t-stat-val">${totalC}</span><span class="t-stat-label">Total Classes</span></div>
          <div class="t-stat"><span class="t-stat-val">${subjs}</span><span class="t-stat-label">Subjects</span></div>
          <div class="t-stat"><span class="t-stat-val">${rooms}</span><span class="t-stat-label">Rooms</span></div>
          <div class="t-stat"><span class="t-stat-val">${morningC}</span><span class="t-stat-label">Morning</span></div>
          <div class="t-stat"><span class="t-stat-val">${eveningC}</span><span class="t-stat-label">Evening</span></div>
        </div>
      </div>`;
    teacherProfileCard.style.display = 'grid';
  }

  /* Teacher event listeners */
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
  document.getElementById('btnTeacherReset').addEventListener('click', () => {
    teacherSearchBox.value = '';
    teacherSelectBox.value = '';
    teacherDayBox.value    = '';
    teacherShiftBox.value  = '';
    teacherProfileCard.style.display = 'none';
    teacherResultsArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-ico">👨‍🏫</div>
        <h3>Select a Teacher</h3>
        <p>Search or select a faculty member above to view their complete timetable.</p>
      </div>`;
  });

  /* ══════════════════════════════════════════════════════════
     CLASS WISE — weekly grid per class/shift
  ══════════════════════════════════════════════════════════ */
  let activeDept = null;

  const deptTabBar         = document.getElementById('deptTabBar');
  const classSemesterSelect = document.getElementById('classSemesterSelect');
  const classSectionSelect  = document.getElementById('classSectionSelect');
  const classShiftSelect    = document.getElementById('classShiftSelect');
  const classDaySelect      = document.getElementById('classDaySelect');
  const classKeyword        = document.getElementById('classKeyword');
  const classResultsArea    = document.getElementById('classResultsArea');

  function initDeptTabs() {
    // Only show departments that actually have entries
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
  }

  function updateClassFilters() {
    if (!activeDept) return;
    const deptEntries = ENTRIES.filter(e => e.department === activeDept);

    // Semesters — sorted numerically
    const sems = [...new Set(deptEntries.map(e => e.semester).filter(Boolean))]
      .sort((a, b) => parseInt(a) - parseInt(b));
    classSemesterSelect.innerHTML = '<option value="">All Semesters</option>' +
      sems.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');

    // Sections — sorted
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

    const semF  = classSemesterSelect.value;
    const secF  = classSectionSelect.value;
    const shiftF = classShiftSelect.value;
    const dayF  = classDaySelect.value;
    const kw    = classKeyword.value.trim().toLowerCase();

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
          <p>No timetable entries match the filters for ${esc(activeDept)}.</p>
        </div>`;
      return;
    }

    // Group by section → shift → build separate grid for each
    const groups = {};
    filtered.forEach(e => {
      const key = e.section + '||' + e.shift;
      if (!groups[key]) groups[key] = { section: e.section, shift: e.shift, semester: e.semester, entries: [] };
      groups[key].entries.push(e);
    });

    // Sort groups: by semester number, then section name
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const ga = groups[a], gb = groups[b];
      const na = parseInt(ga.semester) || 0;
      const nb = parseInt(gb.semester) || 0;
      if (na !== nb) return na - nb;
      if (ga.section !== gb.section) return ga.section.localeCompare(gb.section);
      return ga.shift.localeCompare(gb.shift);
    });

    classResultsArea.innerHTML = sortedKeys
      .map(k => buildWeeklyGrid(groups[k].entries, groups[k].section, groups[k].shift))
      .join('');
  }

  /* Build a weekly grid for one class+shift combination */
  function buildWeeklyGrid(entries, section, shift) {
    // Collect time slots from these entries, sorted chronologically
    const timeSlots = [...new Set(entries.map(e => e.time))]
      .sort((a, b) => a.split('-')[0].localeCompare(b.split('-')[0]));

    // Lookup: time → day → entry (last one wins for duplicates)
    const lup = {};
    timeSlots.forEach(t => {
      lup[t] = {};
      DAYS.forEach(d => { lup[t][d] = null; });
    });
    entries.forEach(e => { if (lup[e.time]) lup[e.time][e.day] = e; });

    const semester  = entries[0] ? entries[0].semester : '';
    const pillCls   = shift === 'Morning Shift' ? 'tt-pill-m' : 'tt-pill-e';
    const shiftLabel = shiftShort(shift);

    let rows = timeSlots.map(ts => {
      const cells = DAYS.map(day => {
        const e = lup[ts][day];
        if (!e) return `<td><div class="tt-empty">—</div></td>`;
        const t = getType(e);
        if (t === 'jummah') {
          return `<td><div class="tt-entry jummah">🕌 Jummah Break</div></td>`;
        }
        const tba = !e.teacher || e.teacher === 'TO BE ASSIGNED';
        return `<td>
          <div class="tt-entry ${t}">
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
      </div>`;
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

    // Populate department filter
    const schedDeptFilter = document.getElementById('schedDeptFilter');
    ALL_DEPTS.filter(d => ENTRIES.some(e => e.department === d)).forEach(d => {
      const o = document.createElement('option');
      o.value = d; o.textContent = d;
      schedDeptFilter.appendChild(o);
    });

    // Today label
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const todayName = dayNames[new Date().getDay()];
    const lbl = document.getElementById('todayLabel');
    if (lbl) lbl.textContent = `Today is ${todayName} — ${
      DAYS.includes(todayName) ? 'showing live schedule' : 'no university timetable (weekend)'
    }`;

    // Set day-wise default to today (or Monday)
    const schedDaySelect = document.getElementById('schedDaySelect');
    schedDaySelect.value = DAYS.includes(todayName) ? todayName : 'Monday';

    // Sub-tab listeners
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
    if (schedSubTab === 'today')    targetDays = [todayName];
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

  function buildDayTable(entries, daysToShow) {
    let html = '';
    daysToShow.forEach(day => {
      const dayEntries = entries
        .filter(e => e.day === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      if (!dayEntries.length) return;

      html += `
        <div class="day-section">
          <div class="day-sec-hd">
            <span class="day-sec-title">📅 ${day}</span>
            <span class="day-sec-cnt">${dayEntries.length} entr${dayEntries.length !== 1 ? 'ies' : 'y'}</span>
          </div>
          <div class="tbl-wrap">
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
                ${dayEntries.map(e => `<tr>
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
          </div>
        </div>`;
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

    // Populate dept filter
    if (deptFilter.children.length === 1) {
      ALL_DEPTS.filter(d => ENTRIES.some(e => e.department === d)).forEach(d => {
        const o = document.createElement('option');
        o.value = d; o.textContent = d;
        deptFilter.appendChild(o);
      });
    }

    // Build subject map by course_code
    const subjectMap = {};
    ENTRIES.forEach(e => {
      if (!e.course_code || !e.subject) return;
      if (!subjectMap[e.course_code]) {
        subjectMap[e.course_code] = {
          code: e.course_code, name: e.subject,
          departments: new Set(), teachers: new Set(),
          classes: new Set(), rooms: new Set(), types: new Set()
        };
      }
      const s = subjectMap[e.course_code];
      s.departments.add(e.department);
      if (e.teacher) s.teachers.add(e.teacher);
      s.classes.add(e.section);
      if (e.room) s.rooms.add(e.room);
      s.types.add(getType(e));
    });

    function doRender() {
      const kw    = searchBox.value.trim().toLowerCase();
      const deptF = deptFilter.value;
      const typeF = typeFilter.value;

      let subjects = Object.values(subjectMap).sort((a, b) => a.code.localeCompare(b.code));

      if (kw)    subjects = subjects.filter(s => s.code.toLowerCase().includes(kw) || s.name.toLowerCase().includes(kw));
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
                <div class="subj-code">${esc(s.code)}</div>
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
     ROOMS
  ══════════════════════════════════════════════════════════ */
  function renderRooms() {
    const searchBox  = document.getElementById('roomSearchBox');
    const typeFilter = document.getElementById('roomTypeFilter');
    const dayFilter  = document.getElementById('roomDayFilter');
    const area       = document.getElementById('roomsResultsArea');

    // Build room map
    const roomMap = {};
    ENTRIES.forEach(e => {
      if (!e.room) return;
      if (!roomMap[e.room]) {
        roomMap[e.room] = {
          name: e.room,
          teachers: new Set(), subjects: new Set(),
          classes: new Set(), days: new Set(), count: 0
        };
      }
      const r = roomMap[e.room];
      r.teachers.add(e.teacher || 'TBA');
      if (e.subject) r.subjects.add(e.subject);
      r.classes.add(e.section);
      r.days.add(e.day);
      r.count++;
    });

    function doRender() {
      const kw    = searchBox.value.trim().toLowerCase();
      const typeF = typeFilter.value;
      const dayF  = dayFilter.value;

      let rooms = Object.values(roomMap).sort((a, b) => a.name.localeCompare(b.name));

      if (kw)    rooms = rooms.filter(r => r.name.toLowerCase().includes(kw));
      if (typeF === 'ctb')    rooms = rooms.filter(r => r.name.toLowerCase().startsWith('ctb'));
      else if (typeF === 'clab')   rooms = rooms.filter(r => r.name.toLowerCase().startsWith('clab'));
      else if (typeF === 'online') rooms = rooms.filter(r => r.name.toLowerCase() === 'online');
      if (dayF)  rooms = rooms.filter(r => r.days.has(dayF));

      if (!rooms.length) {
        area.innerHTML = `
          <div class="empty-state">
            <div class="empty-ico">🏫</div>
            <h3>No Rooms Found</h3>
            <p>Adjust your search or filters.</p>
          </div>`;
        return;
      }

      area.innerHTML = `
        <div class="result-count">Showing ${rooms.length} room${rooms.length !== 1 ? 's' : ''}</div>
        <div class="room-cards-grid">
          ${rooms.map(r => {
            const classesStr = [...r.classes].sort().slice(0, 4).join(', ') + (r.classes.size > 4 ? '...' : '');
            const daysStr    = DAYS.filter(d => r.days.has(d)).join(', ');
            return `
              <div class="room-card">
                <div class="room-card-hd">
                  <span class="room-card-name">${esc(r.name)}</span>
                  <span class="bdg bdg-code">${r.count} slots</span>
                </div>
                <div class="room-card-body">
                  <div class="room-card-stat">📚 <strong>${r.subjects.size}</strong> subjects</div>
                  <div class="room-card-stat">🎓 <strong>${r.classes.size}</strong> classes: ${esc(classesStr)}</div>
                  <div class="room-card-stat">👨‍🏫 <strong>${r.teachers.size}</strong> teachers</div>
                  <div class="room-card-stat">📅 Days: ${esc(daysStr)}</div>
                </div>
              </div>`;
          }).join('')}
        </div>`;
    }

    searchBox.addEventListener('input',   doRender);
    typeFilter.addEventListener('change', doRender);
    dayFilter.addEventListener('change',  doRender);
    document.getElementById('btnRoomsReset').addEventListener('click', () => {
      searchBox.value = ''; typeFilter.value = ''; dayFilter.value = '';
      doRender();
    });

    doRender();
  }

  /* ══════════════════════════════════════════════════════════
     STATISTICS
  ══════════════════════════════════════════════════════════ */
  function renderStatistics() {
    // Unique Assignments for counting taught classes rather than individual periods
    const uniqueAssignments = [];
    const seenAssignments = new Set();
    ENTRIES.forEach(e => {
      const key = (e.teacher || 'TBA') + '||' + e.section + '||' + (e.course_code || e.subject);
      if (!seenAssignments.has(key)) {
        seenAssignments.add(key);
        uniqueAssignments.push(e);
      }
    });

    // Overall
    const uniqueClasses  = new Set(ENTRIES.map(e => e.section + '||' + e.shift)).size;
    const uniqueSections = new Set(ENTRIES.map(e => e.section)).size;
    const uniqueTeachers = new Set(ENTRIES.map(e => e.teacher).filter(t => t && t !== 'TO BE ASSIGNED')).size;
    const uniqueSubjects = new Set(ENTRIES.map(e => e.course_code || e.subject).filter(Boolean)).size;
    const uniqueCodes    = new Set(ENTRIES.map(e => e.course_code).filter(Boolean)).size;
    const uniqueRooms    = new Set(ENTRIES.map(e => e.room).filter(Boolean)).size;
    const uniqueSems     = new Set(ENTRIES.map(e => e.semester).filter(Boolean)).size;
    const uniqueDepts    = new Set(ENTRIES.map(e => e.department).filter(Boolean)).size;
    const morningCount   = uniqueAssignments.filter(e => e.shift === 'Morning Shift').length;
    const eveningCount   = uniqueAssignments.filter(e => e.shift === 'Evening Shift').length;

    const overallGrid = document.getElementById('statsOverallGrid');
    overallGrid.innerHTML = [
      { icon:'🏛️', value: uniqueDepts,    label:'Departments'     },
      { icon:'🎓', value: uniqueClasses,   label:'Unique Classes'  },
      { icon:'📋', value: uniqueSections,  label:'Unique Sections' },
      { icon:'📅', value: uniqueSems,      label:'Semesters'       },
      { icon:'👨‍🏫', value: uniqueTeachers, label:'Teachers'       },
      { icon:'📚', value: uniqueSubjects,  label:'Subjects'        },
      { icon:'🔖', value: uniqueCodes,     label:'Course Codes'    },
      { icon:'🏫', value: uniqueRooms,     label:'Rooms & Labs'    },
      { icon:'📊', value: uniqueAssignments.length,  label:'Total Classes Taught'   },
      { icon:'☀️', value: morningCount,    label:'Morning Classes' },
      { icon:'🌙', value: eveningCount,    label:'Evening Classes' }
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
      { icon:'📖', value: theoryN,   label:'Theory',              cls:'theory'    },
      { icon:'🔬', value: labN,      label:'Lab',                 cls:'lab'       },
      { icon:'🌐', value: onlineN,   label:'Online',              cls:'online'    },
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
      { icon:'☀️', value: morningCount, label: `Morning Shift (${Math.round(morningCount/uniqueAssignments.length*100) || 0}%)` },
      { icon:'🌙', value: eveningCount, label: `Evening Shift (${Math.round(eveningCount/uniqueAssignments.length*100) || 0}%)` }
    ].map(c => `
      <div class="stat-card">
        <div class="stat-card-icon">${c.icon}</div>
        <div class="stat-card-value">${c.value.toLocaleString()}</div>
        <div class="stat-card-label">${c.label}</div>
      </div>`).join('');

    // Department table
    const deptRows = ALL_DEPTS.map(dept => {
      const de    = uniqueAssignments.filter(e => e.department === dept);
      if (!de.length) return null;
      const cls   = new Set(de.map(e => e.section + '||' + e.shift)).size;
      const teach = new Set(de.map(e => e.teacher).filter(t => t && t !== 'TO BE ASSIGNED')).size;
      const subs  = new Set(de.map(e => e.course_code || e.subject).filter(Boolean)).size;
      const morn  = de.filter(e => e.shift === 'Morning Shift').length;
      const eve   = de.filter(e => e.shift === 'Evening Shift').length;
      return { dept, cls, teach, subs, total: de.length, morn, eve };
    }).filter(Boolean);

    document.getElementById('statsDeptTable').innerHTML = `
      <table class="data-tbl">
        <thead>
          <tr><th>Department</th><th>Classes</th><th>Teachers</th><th>Subjects</th><th>Morning</th><th>Evening</th><th>Total Classes</th></tr>
        </thead>
        <tbody>
          ${deptRows.map(d => `<tr>
            <td><strong>${DEPT_ICONS[d.dept] || ''} ${esc(d.dept)}</strong></td>
            <td>${d.cls}</td><td>${d.teach}</td><td>${d.subs}</td>
            <td><span class="bdg bdg-morning">☀️ ${d.morn}</span></td>
            <td><span class="bdg bdg-evening">🌙 ${d.eve}</span></td>
            <td><strong>${d.total}</strong></td>
          </tr>`).join('')}
        </tbody>
      </table>`;

    // Semester table
    const semMap = {};
    uniqueAssignments.forEach(e => {
      if (!e.semester) return;
      if (!semMap[e.semester]) semMap[e.semester] = { sem: e.semester, classes: new Set(), morn: 0, eve: 0, total: 0 };
      semMap[e.semester].classes.add(e.section + '||' + e.shift);
      if (e.shift === 'Morning Shift') semMap[e.semester].morn++;
      else semMap[e.semester].eve++;
      semMap[e.semester].total++;
    });
    const semArr = Object.values(semMap).sort((a, b) => parseInt(a.sem) - parseInt(b.sem));

    document.getElementById('statsSemTable').innerHTML = `
      <table class="data-tbl">
        <thead>
          <tr><th>Semester</th><th>Classes</th><th>Morning</th><th>Evening</th><th>Total Classes</th></tr>
        </thead>
        <tbody>
          ${semArr.map(s => `<tr>
            <td><strong>${esc(s.sem)}</strong></td>
            <td>${s.classes.size}</td>
            <td><span class="bdg bdg-morning">☀️ ${s.morn}</span></td>
            <td><span class="bdg bdg-evening">🌙 ${s.eve}</span></td>
            <td><strong>${s.total}</strong></td>
          </tr>`).join('')}
        </tbody>
      </table>`;

    // Teacher load table
    const teachMap = {};
    uniqueAssignments.forEach(e => {
      if (!e.teacher || e.teacher === 'TO BE ASSIGNED') return;
      if (!teachMap[e.teacher]) teachMap[e.teacher] = { name: e.teacher, total: 0, morn: 0, eve: 0, depts: new Set(), classes: new Set() };
      const t = teachMap[e.teacher];
      t.total++;
      if (e.shift === 'Morning Shift') t.morn++;
      else t.eve++;
      t.depts.add(e.department);
      t.classes.add(e.section);
    });

    const teachArr = Object.values(teachMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    document.getElementById('statsTeacherTable').innerHTML = `
      <table class="data-tbl">
        <thead>
          <tr><th>#</th><th>Teacher</th><th>Morning</th><th>Evening</th><th>Total Classes</th><th>Depts</th><th>Sections</th></tr>
        </thead>
        <tbody>
          ${teachArr.map((t, i) => `<tr>
            <td style="color:var(--tx-3);font-variant-numeric:tabular-nums">${i + 1}</td>
            <td><strong>${esc(t.name)}</strong></td>
            <td><span class="bdg bdg-morning">☀️ ${t.morn}</span></td>
            <td><span class="bdg bdg-evening">🌙 ${t.eve}</span></td>
            <td><strong>${t.total}</strong></td>
            <td>${t.depts.size}</td>
            <td>${t.classes.size}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  }

  /* ══════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════ */
  function init() {
    buildHomeStats();
    initTeacherDropdown();
    initDeptTabs();
    navigateTo('home');
  }

  init();

})();
