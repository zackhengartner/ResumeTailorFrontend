---
name: verify
description: Build, launch, and drive the ResumeTailor frontend to verify changes end-to-end.
---

# Verifying the ResumeTailor frontend

React + Vite SPA. The backend (FastAPI, separate repo at `../backend`) is only
needed for the real `/analyze-resume` call — mock it for UI verification.

## Build & launch

```bash
npm run build                 # production build (rolldown-vite)
npx eslint src                # note: one pre-existing react-hooks/set-state-in-effect error in App.jsx (BulletTextarea)
npx vite --port 5199 --strictPort   # dev server; run in background
```

## Drive it (no backend needed)

Install Playwright in a temp dir (`npm i playwright --no-save`) and launch with
the system browser — no browser download needed:

```js
const browser = await chromium.launch({ channel: "msedge", headless: true });
```

Mock the analyze endpoint so the full flow runs:

```js
await page.route("**/analyze-resume", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockResume) }));
```

`mockResume` shape: `{ basics: {name,email,phone,links:{github,website}}, education: [{school,degree,date}], experience: [{role,company,bullets:[]}], projects: [{name,bullets:[]}], skills: [], missingSkills: [], matchScore: 0 }`.

Any file works for the upload input (`page.setInputFiles`) since parsing happens server-side.

## Flows worth driving

- Upload + JD + Analyze → editor and `#resume` preview populate
- Analyze with a 500 route → `.error-banner` appears and dismisses
- Keyword coverage card (`.coverage-card`) → click an amber chip → coverage % rises
- Bullet hints (`.bullet-hint`) on weak/unquantified bullets
- Summary textarea → SUMMARY section in preview
- Hide toggle (`.btn-eye`) → entry leaves preview, stays in editor with `.is-hidden`
- Copy as text → grant `clipboard-read`/`clipboard-write` permissions on the context
- Save version → reload page → session and versions restored from localStorage
- Reset button fires `window.confirm` — attach `page.once("dialog", d => d.accept())`

## Gotchas

- Autosave is debounced 600ms — wait ~1s before reloading to test persistence
- Session key `rt:session:v1`, versions key `rt:versions:v1` in localStorage
- The worktree resolves node_modules from the main checkout's parent dirs; no reinstall needed
