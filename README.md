# ResumeTailor — Frontend

React (Vite) frontend for RESUMETaiLOR: upload a resume PDF, paste a job
description, and get an AI-tailored, editable, ATS-friendly resume with live
preview and PDF export.

## Features

- **AI analysis** — sends resume + job description to the FastAPI backend and
  renders the structured result in an editable three-panel layout
- **Keyword coverage** — client-side scan of the job posting's key terms with
  live covered/missing status; click a missing keyword to add it as a skill
- **Match score** with matched/missing skill chips
- **Full editor** — contact info, professional summary, education, experience,
  projects, skills; add your own entries alongside the AI-extracted ones
- **Bullet quality hints** — flags weak openers, over-long bullets, and
  unquantified impact
- **Show/hide entries** — toggle entries off the resume (without deleting) to
  fit one page
- **Session autosave** — everything persists to localStorage across refreshes,
  with a Reset button to start over
- **Saved versions** — snapshot a tailored resume per job application and
  reload it any time
- **Three templates** — Google SWE, Harvard Academic, ATS Clean
- **Export** — one-click PDF (named after you, e.g. `Jane_Doe_Resume.pdf`) and
  copy-as-plain-text for ATS web forms
- **One-page fit badge** — warns when the resume spills onto a second page

## Setup

```bash
npm install
npm run dev
```

Set `VITE_API_URL` in `.env` to the backend URL (see the `backend/` directory
of the parent repo).
