# Partners Academy

Wayfinder and the Partners Playbook Academy merged into one product. This
folder is the app. Deploy by dragging it into the repo, no build step.

Build marker: `academy-2026.09.03-p3`. It is printed in Settings under
THIS BUILD. Read it before diagnosing anything, because if it does not
match what you just deployed then the deploy did not land and the bug is
not real.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Shell. Config, fonts, CSS tokens, favicon, script tags |
| `js/core.jsx` | Config, Firebase, proxy client, icons, storage, roles |
| `js/ui.jsx` | Design system. Small pieces and shared style objects |
| `js/data.jsx` | Course and progress data layer, gating rules, markdown renderer |
| `js/auth.jsx` | Boot, sign in, sign up, email verification |
| `js/shell.jsx` | Studio, the stage routing and shared state. Header, FlowStrip |
| `js/authoring.jsx` | The authoring flow. Verified. Do not retime the video |
| `js/admin.jsx` | Course builder, assignment, people, settings |
| `js/learn.jsx` | Course delivery. My Courses, course page, lesson player |
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


## Phase 2, what is in it

**Learners** get My Courses with real progress, a course page with an
ordered lesson list, and a player that handles three lesson types. A guide
lesson plays the Wayfinder video and shows the written steps beneath it,
which is the join between the two halves of the product. Video marks itself
complete at 90 percent watched and remembers where you stopped.

**Admins** get a course builder. Add a lesson, pick from the searchable
list of existing Wayfinder guides, reorder by dragging or with the arrows,
mark lessons optional, set prerequisites, choose who gets it, publish.
People shows everyone who has signed in, with role changes and progress.

Assignment keys on lowercased email, so a course can be assigned to someone
who has not signed in for the first time yet.

**Two things worth knowing.** Admins are never locked out by prerequisites
or level gates, because they need to see what they built. And the progress
counter and the percentage both count the same pool, the required lessons,
so they can never disagree with each other.

Points are deliberately not awarded yet. The rules do not let a person raise
their own totals, so awarding moves to the proxy Worker in the next phase.


## Completion is earned, never declared

There is no "mark complete" button for learners. Progress that a person can
award themselves is not progress, it is a checkbox.

| Lesson type | What completes it |
| --- | --- |
| Video | 90 percent watched |
| Guide with a video | 90 percent of the video watched |
| Guide with no video | Scrolling to the end of the written steps |
| Written | Scrolling to the end of the lesson |

Admins keep an "Override as admin" button so a course can be checked without
sitting through every video. Learners never see it.

One honest limitation: a written lesson short enough to fit on one screen
completes as soon as it opens, because the end of it is already visible.
That is correct in the sense that they did see all of it, but it means very
short written lessons are effectively instant. Videos have no such gap.

A video that fails to load says so plainly and tells the learner to report
it, rather than leaving them stuck in a lesson they cannot finish.
