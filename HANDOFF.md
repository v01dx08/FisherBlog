# Handoff Notes

## Current Branch

- Working branch: `fix/profile-media-responsive`
- Do not push directly to `master`.
- Recommended flow: push this branch and open a pull request/merge request.

## Recent Work Summary

- Fixed responsive profile layout issues and reduced horizontal overflow risk.
- Moved profile editing into Settings and removed the edit button from the public profile page.
- Added profile cover image support with `User.coverUrl`, upload validation, profile rendering, and export support.
- Improved post media handling with multiple image uploads, Facebook-like media grids, and image zoom controls.
- Moved messaging toward a page-based experience.
- Added the water conditions page/API/client with map context and navigation entry.
- Added content reporting and admin moderation for posts, comments, and user profiles.

## Report And Moderation Details

- `prisma/schema.prisma`
  - Added `ReportTargetType`, `ReportStatus`, and `Report`.
  - Reports can target a post, comment, or user profile.

- `prisma/migrations/20260910000000_add_content_reports/migration.sql`
  - Creates report enums, the `Report` table, unique reporter/target constraints, indexes, and foreign keys.

- `src/lib/moderation.js`
  - Central validation for report reasons, report target types, moderation actions, and Prisma target data.

- `src/app/api/reports/route.js`
  - Authenticated users can report public posts, public comments, or active user profiles.
  - Users cannot report their own content/profile.
  - Duplicate reports from the same user for the same target return the existing report.

- `src/app/api/admin/reports/route.js`
  - Admins can list reports.
  - Admins can dismiss reports, remove reported posts, remove reported comments, or suspend reported non-admin users.
  - Resolution actions write audit logs.

- `src/components/FeedComponents.jsx`
  - Added report action in the post menu.
  - Added report action for comments.

- `src/app/profile/[username]/page.jsx`
  - Added report action for non-owner profile viewers.

- `src/app/admin/page.jsx`
  - Added Reports tab with search, target preview, reporter information, and moderation actions.
  - Added open report KPI.

- `src/app/api/admin/stats/route.js`
  - Added open report count to admin stats.

- `tests/security.test.mjs`
  - Added validator coverage for reports and moderation actions.

## Validation

These commands passed after the latest changes:

```bash
npm.cmd run db:generate
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Windows note: use `npm.cmd ...` from PowerShell to avoid execution-policy issues.

## Follow-Up Notes

- The working tree already had many related UI changes. Do not revert unrelated changes.
- `.gitignore` currently ignores `docs/`, so `HANDOFF.md` is the root-level note intended to travel with the branch.
- If the user says "remove this popup" while `Header.jsx` is active, confirm which popup first:
  - account/avatar menu
  - notifications dropdown
  - search suggestions
  - Settings modal
