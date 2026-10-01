# GBP Hours Validator — FAQ / Discussions seed

Seed questions for the Discussions tab (GitHub Discussions must be enabled in repo Settings → Features; copy each Q&A into a new Q&A discussion).

## Project-specific

### What input formats are supported?
JSON (`{"mon":"9am-5pm","sat":["8am-12pm","1pm-3pm"],"sun":"closed"}`) or text lines (`Mon: 9am-5pm, 6pm-8pm`). Day names can be `mon`, `Monday`, `Thurs`, etc.

### Why does "9-5" produce a warning instead of passing?
Without AM/PM it is ambiguous. The tool assumes 9 AM to 5 PM and tells you so; add AM/PM to remove the warning.

### Does it connect to my Google Business Profile?
No. It only checks the hours you give it for formatting and logic problems. It cannot see what is live on Google.

### How are overnight hours handled?
A range like `6pm-2am` is accepted with a warning so you can double-check the next day's hours.

### Can I use it in CI?
Yes: exit code is 0 for OK, 1 for errors (or warnings with `--strict`), 2 for usage/IO errors.

## General

### Is this really free?
Yes. The code/data is MIT licensed: use it, modify it, and use it for clients. The only paid thing is optional human help — see [SUPPORT.md](SUPPORT.md) ($125 session, email order).

### Does it send my data anywhere?
No. There is no server and no tracking. Nothing you enter is uploaded.

### Can I use it for my clients' businesses?
Yes, the MIT license allows commercial use. Keep the license notice in copies of the code.

### How do I report a bug or ask for a feature?
Open an issue or start a Discussion on this repo. For private questions, email tommytbomar@gmail.com.

Spiel Ventures · Tommy Bomar · tommytbomar@gmail.com
