# Partners Academy

Wayfinder and the Partners Playbook Academy merged into one product. This
folder is the app. Deploy by dragging it into the repo, no build step.

Build marker: `academy-2026.09.02-p1`. It is printed in Settings under
THIS BUILD. Read it before diagnosing anything, because if it does not
match what you just deployed then the deploy did not land and the bug is
not real.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Shell. Config, fonts, CSS tokens, favicon, script tags |
| `js/core.jsx` | Config, Firebase, proxy client, icons, storage, roles |
| `js/ui.jsx` | Design system. Small pieces and shared style objects |
| `js/auth.jsx` | Boot, sign in, sign up, email verification |
| `js/shell.jsx` | Studio, the stage routing and shared state. Header, FlowStrip |
| `js/authoring.jsx` | The authoring flow. Verified. Do not retime the video |
| `js/admin.jsx` | Settings today, people and reporting later |
| `js/learn.jsx` | Course delivery. Watch doubles as the guide lesson player |
| `js/boot.jsx` | The render call. Must stay last |
| `firestore.rules` | Paste into the console and publish. Marker in the header comment |
| `migrate.html` | One-time console. Moves published courses off partners-playbook |

## The one rule the split imposes

Files run in document order and top-level declarations cross file
boundaries, both proven by measurement, so ordinary `const` works with no
`window` plumbing. Babel compiles every top-level `const` down to a global
`var`, which is why it works.

The cost: duplicate top-level names do **not** error, they silently
overwrite, and the last file to load wins. Prefix component names by
module rather than trusting yourself to remember. `boot.jsx` stays last.

Babel is pinned to `7.28.4`. It used to be requested unpinned, which meant
production was silently riding whatever the latest major release happened
to be. Do not un-pin it.

## Order of operations

1. Publish `firestore.rules`
2. Deploy this folder, sign in, confirm the build marker in Settings
3. Run `migrate.html`, read the inventory, download the loss CSV, dry run,
   then write
4. Confirm the migrated courses appear before trusting any of it

`settings/rolePresets` is written by the migration as an email to role map.
It is not applied automatically, because the rules correctly forbid anyone
raising their own role. An admin applies it from the People screen.
