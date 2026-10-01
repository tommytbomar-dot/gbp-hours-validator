#!/usr/bin/env node
'use strict';
const fs = require('fs');
const { validate } = require('../lib/validate');
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const files = args.filter((a) => !a.startsWith('--'));
if (flags.has('--help') || flags.has('-h') || files.length === 0 && process.stdin.isTTY) {
  console.log(`gbp-hours - validate Google Business Profile opening hours\n\nUsage: gbp-hours <file|-> [--json] [--strict]\n\nInput: JSON ({"mon":"9am-5pm","sat":["8am-12pm","1pm-3pm"],"sun":"closed"})\n   or text lines ("Mon: 9am-5pm, 6pm-8pm").\nExit: 0 ok, 1 errors (or warnings with --strict), 2 usage/IO error.`);
  process.exit(files.length === 0 && !flags.has('--help') && !flags.has('-h') ? 2 : 0);
}
let raw;
try { raw = fs.readFileSync(files[0] && files[0] !== '-' ? files[0] : 0, 'utf8'); } catch (e) { console.error('cannot read input: ' + e.message); process.exit(2); }
let res;
try { res = validate(raw); } catch (e) { console.error('cannot parse input: ' + e.message); process.exit(2); }
if (flags.has('--json')) console.log(JSON.stringify(res, null, 2));
else {
  for (const d of Object.keys(res.display)) console.log(d.toUpperCase() + '  ' + res.display[d]);
  res.errors.forEach((e) => console.log('ERROR   ' + e));
  res.warnings.forEach((w) => console.log('WARN    ' + w));
  console.log(res.ok ? (res.warnings.length ? 'OK with warnings' : 'OK') : 'FAILED');
}
process.exit(!res.ok || (flags.has('--strict') && res.warnings.length) ? 1 : 0);
