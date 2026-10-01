'use strict';
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const ALIAS = { mon: 'mon', monday: 'mon', tue: 'tue', tues: 'tue', tuesday: 'tue', wed: 'wed', weds: 'wed', wednesday: 'wed',
  thu: 'thu', thur: 'thu', thurs: 'thu', thursday: 'thu', fri: 'fri', friday: 'fri', sat: 'sat', saturday: 'sat', sun: 'sun', sunday: 'sun' };

function dayKey(s) { return ALIAS[String(s).trim().toLowerCase().replace(/\.$/, '')] || null; }

// Returns {min, meridiem:boolean} or null. 24:00 => 1440.
function parseTime(raw) {
  let s = String(raw).trim().toLowerCase().replace(/\./g, '');
  if (s === 'noon') return { min: 720, mer: true };
  if (s === 'midnight') return { min: 0, mer: true };
  const m = s.match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm|a|p)?$/);
  if (!m) return null;
  let h = +m[1]; const mi = m[2] ? +m[2] : 0; const mer = m[3] ? m[3][0] : null;
  if (mi > 59) return null;
  if (mer) { if (h < 1 || h > 12) return null; h = (h % 12) + (mer === 'p' ? 12 : 0); }
  else if (h > 24 || (h === 24 && mi > 0)) return null;
  return { min: h * 60 + mi, mer: !!mer, h12: !mer && h >= 1 && h <= 12 };
}

const fmt24 = (m) => { m = m % 1440 === 0 && m !== 0 && m !== 1440 ? 0 : m; const h = Math.floor(m / 60), mm = m % 60; return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
const fmt12 = (m) => { if (m === 1440) m = 0; const h = Math.floor(m / 60), mm = m % 60; const h12 = h % 12 === 0 ? 12 : h % 12; return h12 + (mm ? ':' + String(mm).padStart(2, '0') : '') + (h < 12 ? ' AM' : ' PM'); };

// Parse "9am-5pm" => {open, close, notes[]} or {error}
function parseRange(raw) {
  const s = String(raw).trim().toLowerCase();
  if (/^24\s*(h|hr|hrs|hours)?$|^open 24|^all day$/.test(s)) return { open: 0, close: 1440, allDay: true, notes: [] };
  const parts = s.split(/\s*(?:-|–|—|\bto\b|until)\s*/);
  if (parts.length !== 2) return { error: `cannot parse range "${raw}" (expected like 9am-5pm or 09:00-17:00)` };
  const a = parseTime(parts[0]), b = parseTime(parts[1]);
  if (!a || !b) return { error: `cannot parse time in "${raw}"` };
  const notes = [];
  let open = a.min, close = b.min;
  if (!a.mer && !b.mer && a.h12 && b.h12 && open !== 0 && close !== 0) {
    notes.push(`"${raw}" has no AM/PM; assumed ${fmt12(open)}-${fmt12(close <= open ? close + 720 : close)}. Add AM/PM to remove ambiguity.`);
    if (close <= open) close += 720;
  } else if (a.mer && !b.mer && b.h12) {
    if (close < open) close += 720; notes.push(`closing time in "${raw}" has no AM/PM; assumed ${fmt12(close)}.`);
  } else if (!a.mer && b.mer && a.h12 && open >= close) {
    open = open % 720; notes.push(`opening time in "${raw}" has no AM/PM; assumed ${fmt12(open)}.`);
  }
  return { open, close, notes };
}

// value: string | string[] | {closed:true} ; returns {intervals:[[o,c]], errors, warnings, closed}
function parseDay(day, value) {
  const errors = [], warnings = [], intervals = [];
  if (value === null || value === undefined || value === '') return { intervals, errors, warnings, missing: true };
  let items = Array.isArray(value) ? value : String(value).split(/\s*(?:,|;|&|\band\b)\s*/);
  items = items.map((x) => String(x).trim()).filter(Boolean);
  if (items.length === 1 && /^(closed|off|none|-)$/i.test(items[0])) return { intervals, errors, warnings, closed: true };
  for (const it of items) {
    const r = parseRange(it);
    if (r.error) { errors.push(`${day}: ${r.error}`); continue; }
    r.notes.forEach((n) => warnings.push(`${day}: ${n}`));
    if (!r.allDay && r.open === r.close) { errors.push(`${day}: "${it}" opens and closes at the same time (zero-length). Use "24 hours" or "closed".`); continue; }
    if (r.close < r.open) warnings.push(`${day}: "${it}" crosses midnight (closes ${fmt12(r.close)} next day). Google accepts this, but double-check ${day}-next-day hours are consistent.`);
    intervals.push([r.open, r.close < r.open ? r.close + 1440 : r.close]);
  }
  intervals.sort((x, y) => x[0] - y[0]);
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < intervals[i - 1][1]) errors.push(`${day}: overlapping ranges ${fmt12(intervals[i - 1][0])}-${fmt12(intervals[i - 1][1])} and ${fmt12(intervals[i][0])}-${fmt12(intervals[i][1])}.`);
    else if (intervals[i][0] === intervals[i - 1][1]) warnings.push(`${day}: back-to-back ranges could be merged into one.`);
  }
  if (intervals.length > 3) warnings.push(`${day}: ${intervals.length} ranges is unusual; confirm the split shifts are real.`);
  return { intervals, errors, warnings };
}

// Accepts object {mon:"9am-5pm"} or text lines "Mon: 9am-5pm, 6pm-8pm".
function parseInput(input) {
  if (typeof input === 'object' && input !== null) return input;
  const text = String(input).trim();
  if (text.startsWith('{')) return JSON.parse(text);
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const l = line.trim(); if (!l || l.startsWith('#')) continue;
    const m = l.match(/^([A-Za-z.]+)\s*(?:[:\-–]\s*|\s+)(.+)$/);
    if (!m) { out.__bad = (out.__bad || []).concat(l); continue; }
    const k = dayKey(m[1]);
    if (!k) { out.__bad = (out.__bad || []).concat(l); continue; }
    out[k] = m[2];
  }
  return out;
}

function validate(input) {
  const data = parseInput(input);
  const errors = [], warnings = [], normalized = {}, display = {};
  (data.__bad || []).forEach((l) => errors.push(`unrecognized line: "${l}"`));
  const seen = {};
  for (const k of Object.keys(data)) {
    if (k === '__bad') continue;
    const dk = dayKey(k);
    if (!dk) { errors.push(`unknown day key "${k}"`); continue; }
    if (seen[dk]) { errors.push(`duplicate entry for ${dk}`); continue; }
    seen[dk] = true;
    const r = parseDay(dk, data[k]);
    errors.push(...r.errors); warnings.push(...r.warnings);
    normalized[dk] = r.closed ? 'closed' : r.intervals.map(([o, c]) => fmt24(o) + '-' + (c === 1440 ? '24:00' : fmt24(c % 1440)));
    display[dk] = r.closed ? 'Closed' : r.intervals.map(([o, c]) => fmt12(o) + ' - ' + fmt12(c % 1440 === 0 && c >= 1440 ? 1440 : c % 1440)).join(', ');
  }
  const missing = DAYS.filter((d) => !seen[d]);
  if (missing.length) warnings.push(`no hours given for: ${missing.join(', ')}. In Google Business Profile, set unused days to "Closed" explicitly so customers are not guessing.`);
  const present = DAYS.filter((d) => seen[d]);
  if (present.length && present.every((d) => normalized[d] === 'closed')) warnings.push('every day is closed; the profile would look permanently closed.');
  const all24 = present.filter((d) => JSON.stringify(normalized[d]) === '["00:00-24:00"]');
  if (all24.length && all24.length < present.length) warnings.push(`24-hour on ${all24.join(', ')} but not every day; make sure that is intentional (common mistake for emergency services without real 24/7 coverage).`);
  return { ok: errors.length === 0, errors, warnings, normalized, display };
}

module.exports = { validate, parseTime, parseRange, parseDay, parseInput, DAYS, fmt12, fmt24 };
