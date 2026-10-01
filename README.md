# gbp-hours-validator

Zero-dependency Node CLI (MIT) that checks Google Business Profile opening hours before you paste them in: overlapping ranges, zero-length ranges, ambiguous AM/PM ("9-5"), unreadable times, overnight spans, missing days, and suspicious 24-hour days.

```bash
git clone https://github.com/tommytbomar-dot/gbp-hours-validator && cd gbp-hours-validator
node bin/gbp-hours.js examples/bad.json      # exit 1 with ERROR/WARN lines
node bin/gbp-hours.js examples/good.txt      # OK
cat hours.txt | node bin/gbp-hours.js - --json
npm test
```

Input is JSON (`{"mon":"9am-5pm","sat":["8am-12pm","1pm-3pm"],"sun":"closed"}`) or lines (`Mon: 9am-5pm, 6pm-8pm`). Use `--strict` to fail on warnings. Requires Node 18+.

It validates formatting and logic only. It cannot see what is live on Google and does not log in to anything.

Paid help: see [SUPPORT.md](SUPPORT.md) ($125 session). Want your whole site and profile checked? Email tommytbomar@gmail.com, subject `WANT AUDIT`. License: MIT.
