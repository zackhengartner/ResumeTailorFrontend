import { useState, useEffect, useMemo, useRef } from "react";
import ResumeRenderer from "./components/ResumeRenderer";
import html2pdf from "html2pdf.js/dist/html2pdf.bundle.min";
import { keywordCoverage, formatKeywordAsSkill } from "./utils/keywords";
import { bulletHint } from "./utils/bulletHints";
import { resumeToPlainText } from "./utils/plainText";
import {
  loadSession, saveSession, clearSession,
  loadVersions, saveVersion, deleteVersion,
} from "./utils/storage";

// ── Blank entry templates ─────────────────────────────────────────────────────
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const blankEducation = () => ({ _id: newId(), school: "", degree: "", date: "" });
const blankExperience = () => ({ _id: newId(), role: "", company: "", bullets: [""] });
const blankProject = () => ({ _id: newId(), name: "", tech: [], bullets: [""] });

// ── BulletTextarea ────────────────────────────────────────────────────────────
// Keeps its own local string so the parent App doesn't re-render on every
// keystroke. Flushes the final value to the parent only onBlur.
function BulletTextarea({ initialValue, onCommit, onRemove }) {
  const [value, setValue] = useState(initialValue);

  // If the parent resets the whole form (new analysis), sync back down
  useEffect(() => { setValue(initialValue); }, [initialValue]);

  const hint = bulletHint(value);

  return (
    <div className="bullet-block">
      <div className="bullet-row">
        <textarea
          rows={2}
          className="textarea"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => onCommit(value)}
        />
        <button className="btn-x" onClick={onRemove} title="Remove bullet">✕</button>
      </div>
      {hint && <div className="bullet-hint">{hint}</div>}
    </div>
  );
}

// ── BulletEditor ──────────────────────────────────────────────────────────────
// Renders a list of BulletTextareas plus an add button.
// Must be defined outside App so React never remounts it mid-keystroke.
function BulletEditor({ bullets, onUpdate, onAdd, onRemove }) {
  return (
    <>
      <div className="field-label">Bullets</div>
      {(bullets || []).map((b, bi) => (
        <BulletTextarea
          key={bi}
          initialValue={b}
          onCommit={(val) => onUpdate(bi, val)}
          onRemove={() => onRemove(bi)}
        />
      ))}
      <button className="btn-link" onClick={onAdd}>+ Add bullet</button>
    </>
  );
}

// ── HideToggle ────────────────────────────────────────────────────────────────
// Eye button on each entry card: hidden entries stay editable but are left off
// the rendered resume — handy for squeezing onto one page without deleting.
function HideToggle({ hidden, onToggle }) {
  return (
    <button
      className={`btn-eye${hidden ? " off" : ""}`}
      onClick={onToggle}
      title={hidden ? "Hidden from resume — click to show" : "Shown on resume — click to hide"}
    >
      {hidden ? "🚫 Hidden" : "👁 Shown"}
    </button>
  );
}

const restoredSession = loadSession();

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState(restoredSession?.jobDescription ?? "");
  const [layout, setLayout] = useState(restoredSession?.layout ?? "google");
  const [resumeData, setResumeData] = useState(restoredSession?.resumeData ?? null);
  const [summary, setSummary] = useState(restoredSession?.summary ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOverOnePage, setIsOverOnePage] = useState(false);
  const [copied, setCopied] = useState(false);
  const resumeRef = useRef(null);

  // Watch the resume div height — flag if it exceeds one letter page (1056px at 96dpi)
  useEffect(() => {
    const el = resumeRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setIsOverOnePage(entry.contentRect.height > 1056);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Skill chip editor
  const [userStrengths, setUserStrengths] = useState(restoredSession?.userStrengths ?? []);
  const [userMissing, setUserMissing] = useState(restoredSession?.userMissing ?? []);
  const [newSkill, setNewSkill] = useState("");

  // Override state — arrays shadow the AI arrays index-for-index
  const [basicsOverrides, setBasicsOverrides] = useState(restoredSession?.basicsOverrides ?? {});
  const [educationOverrides, setEducationOverrides] = useState(restoredSession?.educationOverrides ?? []);
  const [experienceOverrides, setExperienceOverrides] = useState(restoredSession?.experienceOverrides ?? []);
  const [projectOverrides, setProjectOverrides] = useState(restoredSession?.projectOverrides ?? []);
  // Extra entries added by the user (not from AI)
  const [extraEducation, setExtraEducation] = useState(restoredSession?.extraEducation ?? []);
  const [extraExperience, setExtraExperience] = useState(restoredSession?.extraExperience ?? []);
  const [extraProjects, setExtraProjects] = useState(restoredSession?.extraProjects ?? []);
  // Entries hidden from the rendered resume (keys: "edu-ai-0" or an extra's _id)
  const [hiddenEntries, setHiddenEntries] = useState(restoredSession?.hiddenEntries ?? []);

  // Saved tailored versions (one per job application)
  const [versions, setVersions] = useState(loadVersions);
  const [versionName, setVersionName] = useState("");

  // ── Raw AI data ─────────────────────────────────────────────────────────────
  const aiBasics = resumeData?.basics || {
    name: "", email: "", phone: "", links: { github: "", website: "" },
  };
  const aiEducation = resumeData?.education || [];
  const aiExperience = resumeData?.experience || [];
  const aiProjects = resumeData?.projects || [];
  const aiSkills = resumeData?.skills || [];
  const aiMissing = resumeData?.missingSkills || [];

  // ── Merged data ─────────────────────────────────────────────────────────────
  const mergedBasics = {
    ...aiBasics,
    ...basicsOverrides,
    links: { ...aiBasics.links, ...basicsOverrides.links },
  };

  const mergedEducation = [
    ...aiEducation.map((e, i) => ({ ...e, ...(educationOverrides[i] || {}), _key: `edu-ai-${i}` })),
    ...extraEducation.map((e) => ({ ...e, _key: e._id })),
  ];

  const mergedExperience = [
    ...aiExperience.map((e, i) => ({
      ...e,
      ...(experienceOverrides[i] || {}),
      bullets: experienceOverrides[i]?.bullets ?? e.bullets,
      _key: `exp-ai-${i}`,
    })),
    ...extraExperience.map((e) => ({ ...e, _key: e._id })),
  ];

  const mergedProjects = [
    ...aiProjects.map((p, i) => ({
      ...p,
      ...(projectOverrides[i] || {}),
      bullets: projectOverrides[i]?.bullets ?? p.bullets,
      _key: `proj-ai-${i}`,
    })),
    ...extraProjects.map((p) => ({ ...p, _key: p._id })),
  ];

  const isHidden = (key) => hiddenEntries.includes(key);
  const toggleHidden = (key) =>
    setHiddenEntries((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  // What actually appears on the resume (hidden entries filtered out)
  const visibleEducation = mergedEducation.filter((e) => !isHidden(e._key));
  const visibleExperience = mergedExperience.filter((e) => !isHidden(e._key));
  const visibleProjects = mergedProjects.filter((p) => !isHidden(p._key));

  const strengths = Array.from(
    new Set([...aiSkills, ...userStrengths])
  ).filter((s) => !userMissing.includes(s));

  const missingSkills = Array.from(
    new Set([...aiMissing, ...userMissing])
  ).filter((s) => !strengths.includes(s));

  const matchScore = (() => {
    const total = strengths.length + missingSkills.length;
    return total ? Math.round((strengths.length / total) * 100) : 0;
  })();

  const renderedData = {
    basics: mergedBasics,
    summary,
    education: visibleEducation,
    experience: visibleExperience,
    projects: visibleProjects,
    skills: strengths,
  };

  // ── Keyword coverage (live ATS check against the job description) ──────────
  const coverage = useMemo(() => {
    if (!jobDescription.trim() || !resumeData) return null;
    return keywordCoverage(jobDescription, renderedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobDescription, resumeData, summary, basicsOverrides, educationOverrides,
      experienceOverrides, projectOverrides, extraEducation, extraExperience,
      extraProjects, userStrengths, userMissing, hiddenEntries]);

  // ── Session autosave (debounced) ────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      saveSession({
        jobDescription, layout, resumeData, summary,
        userStrengths, userMissing,
        basicsOverrides, educationOverrides, experienceOverrides, projectOverrides,
        extraEducation, extraExperience, extraProjects, hiddenEntries,
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [jobDescription, layout, resumeData, summary, userStrengths, userMissing,
      basicsOverrides, educationOverrides, experienceOverrides, projectOverrides,
      extraEducation, extraExperience, extraProjects, hiddenEntries]);

  const applySnapshot = (s) => {
    setJobDescription(s.jobDescription ?? "");
    setLayout(s.layout ?? "google");
    setResumeData(s.resumeData ?? null);
    setSummary(s.summary ?? "");
    setUserStrengths(s.userStrengths ?? []);
    setUserMissing(s.userMissing ?? []);
    setBasicsOverrides(s.basicsOverrides ?? {});
    setEducationOverrides(s.educationOverrides ?? []);
    setExperienceOverrides(s.experienceOverrides ?? []);
    setProjectOverrides(s.projectOverrides ?? []);
    setExtraEducation(s.extraEducation ?? []);
    setExtraExperience(s.extraExperience ?? []);
    setExtraProjects(s.extraProjects ?? []);
    setHiddenEntries(s.hiddenEntries ?? []);
  };

  const resetAll = () => {
    if (!window.confirm("Clear the current resume, edits, and job description? Saved versions are kept.")) return;
    clearSession();
    applySnapshot({});
    setFile(null);
    setError("");
    setNewSkill("");
  };

  // ── Saved versions ──────────────────────────────────────────────────────────
  const handleSaveVersion = () => {
    const snapshot = {
      jobDescription, layout, resumeData, summary,
      userStrengths, userMissing,
      basicsOverrides, educationOverrides, experienceOverrides, projectOverrides,
      extraEducation, extraExperience, extraProjects, hiddenEntries,
    };
    const saved = saveVersion(versionName || `Version ${versions.length + 1}`, snapshot);
    if (saved) {
      setVersions((prev) => [saved, ...prev]);
      setVersionName("");
    } else {
      setError("Couldn't save this version — browser storage may be full.");
    }
  };

  const handleLoadVersion = (v) => applySnapshot(v.snapshot);

  const handleDeleteVersion = (id) => setVersions(deleteVersion(id));

  // ── API ─────────────────────────────────────────────────────────────────────
  const analyzeResume = async () => {
    if (!file || !jobDescription) return;
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/analyze-resume`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`The analysis server returned an error (${res.status}). Try again in a moment.`);
      const data = await res.json();
      setResumeData(data);
      setSummary("");
      setUserStrengths([]);
      setUserMissing([]);
      setBasicsOverrides({});
      setEducationOverrides([]);
      setExperienceOverrides([]);
      setProjectOverrides([]);
      setExtraEducation([]);
      setExtraExperience([]);
      setExtraProjects([]);
      setHiddenEntries([]);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Could not reach the analysis server. Check your connection (or that the backend is running) and try again."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Override helpers: AI-sourced entries ────────────────────────────────────
  const updateBasics = (field, value) =>
    setBasicsOverrides((prev) => ({ ...prev, [field]: value }));

  const updateBasicsLink = (field, value) =>
    setBasicsOverrides((prev) => ({
      ...prev,
      links: { ...mergedBasics.links, ...prev.links, [field]: value },
    }));

  const updateEducation = (i, field, value) =>
    setEducationOverrides((prev) => {
      const next = [...prev];
      next[i] = { ...(next[i] || {}), [field]: value };
      return next;
    });

  const updateExpField = (i, field, value) =>
    setExperienceOverrides((prev) => {
      const next = [...prev];
      next[i] = { ...(next[i] || {}), [field]: value };
      return next;
    });

  const updateExpBullet = (i, bi, value) =>
    setExperienceOverrides((prev) => {
      const next = [...prev];
      const bullets = next[i]?.bullets ?? aiExperience[i]?.bullets ?? [];
      next[i] = { ...(next[i] || {}), bullets: bullets.map((b, j) => j === bi ? value : b) };
      return next;
    });

  const addExpBullet = (i) =>
    setExperienceOverrides((prev) => {
      const next = [...prev];
      const bullets = next[i]?.bullets ?? aiExperience[i]?.bullets ?? [];
      next[i] = { ...(next[i] || {}), bullets: [...bullets, ""] };
      return next;
    });

  const removeExpBullet = (i, bi) =>
    setExperienceOverrides((prev) => {
      const next = [...prev];
      const bullets = next[i]?.bullets ?? aiExperience[i]?.bullets ?? [];
      next[i] = { ...(next[i] || {}), bullets: bullets.filter((_, j) => j !== bi) };
      return next;
    });

  const updateProjField = (i, field, value) =>
    setProjectOverrides((prev) => {
      const next = [...prev];
      next[i] = { ...(next[i] || {}), [field]: value };
      return next;
    });

  const updateProjBullet = (i, bi, value) =>
    setProjectOverrides((prev) => {
      const next = [...prev];
      const bullets = next[i]?.bullets ?? aiProjects[i]?.bullets ?? [];
      next[i] = { ...(next[i] || {}), bullets: bullets.map((b, j) => j === bi ? value : b) };
      return next;
    });

  const addProjBullet = (i) =>
    setProjectOverrides((prev) => {
      const next = [...prev];
      const bullets = next[i]?.bullets ?? aiProjects[i]?.bullets ?? [];
      next[i] = { ...(next[i] || {}), bullets: [...bullets, ""] };
      return next;
    });

  const removeProjBullet = (i, bi) =>
    setProjectOverrides((prev) => {
      const next = [...prev];
      const bullets = next[i]?.bullets ?? aiProjects[i]?.bullets ?? [];
      next[i] = { ...(next[i] || {}), bullets: bullets.filter((_, j) => j !== bi) };
      return next;
    });

  // ── Helpers: extra (user-added) entries ─────────────────────────────────────
  const updateExtra = (setter, i, field, value) =>
    setter((prev) => prev.map((item, j) => j === i ? { ...item, [field]: value } : item));

  const updateExtraBullet = (setter, i, bi, value) =>
    setter((prev) => prev.map((item, j) =>
      j === i ? { ...item, bullets: item.bullets.map((b, k) => k === bi ? value : b) } : item
    ));

  const addExtraBullet = (setter, i) =>
    setter((prev) => prev.map((item, j) =>
      j === i ? { ...item, bullets: [...item.bullets, ""] } : item
    ));

  const removeExtraBullet = (setter, i, bi) =>
    setter((prev) => prev.map((item, j) =>
      j === i ? { ...item, bullets: item.bullets.filter((_, k) => k !== bi) } : item
    ));

  const removeExtraEntry = (setter, i) =>
    setter((prev) => prev.filter((_, j) => j !== i));

  // ── Skills ──────────────────────────────────────────────────────────────────
  const addSkill = () => {
    const val = newSkill.trim();
    if (!val || strengths.includes(val)) return;
    setUserStrengths((p) => [...p, val]);
    setNewSkill("");
  };

  const addStrength = (skill) => {
    setUserMissing((p) => p.filter((s) => s !== skill));
    setUserStrengths((p) => p.includes(skill) ? p : [...p, skill]);
  };

  const removeStrength = (skill) => {
    setUserStrengths((p) => p.filter((s) => s !== skill));
    // Only push back to missing if it was originally an AI-missing skill
    if (aiMissing.includes(skill)) {
      setUserMissing((p) => p.includes(skill) ? p : [...p, skill]);
    }
  };

  // ── Export ──────────────────────────────────────────────────────────────────
  const pdfFilename = (() => {
    const name = (mergedBasics.name || "").trim().replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, "");
    return name ? `${name}_Resume.pdf` : "resume.pdf";
  })();

  const downloadPDF = () => {
    const element = document.getElementById("resume");
    html2pdf()
      .set({
        margin: 0,
        filename: pdfFilename,
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, windowWidth: 816 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(element)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        for (let i = pdf.internal.getNumberOfPages(); i >= 2; i--) {
          const page = pdf.internal.pages[i];
          if (!page || page.join("").trim() === "") pdf.deletePage(i);
        }
      })
      .save();
  };

  const copyAsText = async () => {
    try {
      await navigator.clipboard.writeText(resumeToPlainText(renderedData));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy to clipboard — your browser may be blocking clipboard access.");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app">

      {/* ── LEFT: Upload + settings ─────────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-head">
          <div className="brand">
            <div className="brand-mark">RT</div>
            <h1 className="brand-name">Resume<em>Tailor</em></h1>
          </div>
          {(resumeData || jobDescription) && (
            <button className="btn-remove" onClick={resetAll} title="Clear resume, edits, and job description">
              Reset
            </button>
          )}
        </div>
        <div className="panel-body">
          <div className="form-row">
            <label className="field-label">Resume PDF</label>
            <label className={`dropzone${file ? " has-file" : ""}`}>
              <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
              <div className="dropzone-icon">{file ? "📄" : "⬆️"}</div>
              <div className="dropzone-text">
                <div className="dropzone-title">
                  {file ? file.name : "Upload your resume"}
                </div>
                <div className="dropzone-hint">
                  {file ? "Click to replace" : "PDF, one page works best"}
                </div>
              </div>
            </label>
          </div>

          <div className="form-row">
            <label className="field-label">Template</label>
            <select className="select" value={layout} onChange={(e) => setLayout(e.target.value)}>
              <option value="google">Google SWE Style</option>
              <option value="harvard">Harvard Academic</option>
              <option value="ats">ATS Clean</option>
            </select>
          </div>

          <div className="form-row">
            <label className="field-label">Job Description</label>
            <textarea
              rows={12}
              className="textarea"
              placeholder="Paste the job posting here…"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={analyzeResume}
            disabled={loading || !file || !jobDescription}
          >
            {loading && <span className="spinner" />}
            {loading ? "Analyzing…" : "Analyze Resume"}
          </button>

          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <div>{error}</div>
              <button className="btn-x" onClick={() => setError("")} title="Dismiss">✕</button>
            </div>
          )}

          {resumeData && (
            <div className="score-card">
              <div className="score-top">
                <div className="score-value">{matchScore}%</div>
                <div className="score-label">Match Score</div>
              </div>
              <div className="score-track">
                <div className="score-fill" style={{ width: `${matchScore}%` }} />
              </div>
              <div className="score-meta">
                <span>{strengths.length} matched</span>
                <span>{missingSkills.length} missing</span>
              </div>
            </div>
          )}

          {/* KEYWORD COVERAGE */}
          {coverage && coverage.items.length > 0 && (
            <div className="coverage-card">
              <div className="coverage-head">
                <span className="coverage-title">Keyword coverage</span>
                <span className="coverage-percent">{coverage.percent}%</span>
              </div>
              <div className="coverage-hint">
                Key terms from the job posting. Green ones appear in your resume; click an amber one to add it as a skill.
              </div>
              <div className="chip-row">
                {coverage.items.map(({ keyword, covered }) =>
                  covered ? (
                    <span key={keyword} className="chip chip-good chip-sm">✓ {keyword}</span>
                  ) : (
                    <span
                      key={keyword}
                      className="chip chip-warn chip-sm"
                      onClick={() => addStrength(formatKeywordAsSkill(keyword))}
                      title="Click to add to your skills"
                    >
                      + {keyword}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* SAVED VERSIONS */}
          <div className="section-label">Saved versions</div>
          <div className="skill-add-row">
            <input
              type="text"
              className="input"
              placeholder="e.g. Google SWE Intern"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && resumeData) { e.preventDefault(); handleSaveVersion(); } }}
            />
            <button
              className="btn btn-ghost"
              onClick={handleSaveVersion}
              disabled={!resumeData}
              title={resumeData ? "Save the current tailored resume" : "Analyze a resume first"}
            >
              Save
            </button>
          </div>
          {versions.length === 0 ? (
            <div className="versions-empty">
              Save a snapshot of each tailored resume so you can come back to it per application.
            </div>
          ) : (
            <ul className="version-list">
              {versions.map((v) => (
                <li key={v.id} className="version-item">
                  <div className="version-info">
                    <div className="version-name">{v.name}</div>
                    <div className="version-date">
                      {new Date(v.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  <button className="btn-link" onClick={() => handleLoadVersion(v)}>Load</button>
                  <button className="btn-x" onClick={() => handleDeleteVersion(v.id)} title="Delete version">✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── CENTER: All editors ─────────────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Editor</h2>
        </div>
        <div className="panel-body">

          {/* BASICS */}
          <div className="section-label">Contact info</div>
          {[["name", "Full name"], ["email", "Email"], ["phone", "Phone"]].map(([f, label]) => (
            <div key={f} className="form-row">
              <div className="field-label">{label}</div>
              <input
                type="text"
                className="input"
                value={mergedBasics[f] ?? ""}
                onChange={(e) => updateBasics(f, e.target.value)}
              />
            </div>
          ))}
          <div className="form-row">
            <div className="field-label">GitHub</div>
            <input
              type="text"
              className="input"
              value={mergedBasics.links?.github ?? ""}
              onChange={(e) => updateBasicsLink("github", e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="field-label">Website</div>
            <input
              type="text"
              className="input"
              value={mergedBasics.links?.website ?? ""}
              onChange={(e) => updateBasicsLink("website", e.target.value)}
            />
          </div>

          {/* SUMMARY */}
          <div className="section-label">Professional summary</div>
          <div className="form-row">
            <textarea
              rows={3}
              className="textarea"
              placeholder="Optional 1–3 sentence pitch tailored to this role. Leave blank to omit the section."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          {/* EDUCATION */}
          <div className="section-label">Education</div>
          {/* AI-sourced entries */}
          {aiEducation.map((_, i) => {
            const entry = mergedEducation[i];
            return (
              <div key={i} className={`entry-card${isHidden(entry._key) ? " is-hidden" : ""}`}>
                <div className="entry-title">
                  <span>{entry.school || `School ${i + 1}`}</span>
                  <HideToggle hidden={isHidden(entry._key)} onToggle={() => toggleHidden(entry._key)} />
                </div>
                <div className="field-label">School</div>
                <input type="text" className="input" value={entry.school ?? ""} onChange={(e) => updateEducation(i, "school", e.target.value)} />
                <div className="field-label">Degree</div>
                <input type="text" className="input" value={entry.degree ?? ""} onChange={(e) => updateEducation(i, "degree", e.target.value)} />
                <div className="field-label">Date range</div>
                <input type="text" className="input" value={entry.date ?? ""} placeholder="e.g. Aug 2021 – May 2025" onChange={(e) => updateEducation(i, "date", e.target.value)} />
              </div>
            );
          })}
          {/* User-added extra entries */}
          {extraEducation.map((entry, i) => (
            <div key={entry._id} className={`entry-card${isHidden(entry._id) ? " is-hidden" : ""}`}>
              <div className="entry-title">
                <span>{entry.school || "New school"}</span>
                <span className="entry-actions">
                  <HideToggle hidden={isHidden(entry._id)} onToggle={() => toggleHidden(entry._id)} />
                  <button className="btn-remove" onClick={() => removeExtraEntry(setExtraEducation, i)}>Remove</button>
                </span>
              </div>
              <div className="field-label">School</div>
              <input type="text" className="input" value={entry.school} onChange={(e) => updateExtra(setExtraEducation, i, "school", e.target.value)} />
              <div className="field-label">Degree</div>
              <input type="text" className="input" value={entry.degree} onChange={(e) => updateExtra(setExtraEducation, i, "degree", e.target.value)} />
              <div className="field-label">Date range</div>
              <input type="text" className="input" value={entry.date} placeholder="e.g. Aug 2021 – May 2025" onChange={(e) => updateExtra(setExtraEducation, i, "date", e.target.value)} />
            </div>
          ))}
          <button className="btn btn-add-entry" onClick={() => setExtraEducation((p) => [...p, blankEducation()])}>
            + Add education
          </button>

          {/* EXPERIENCE */}
          <div className="section-label">Experience</div>
          {aiExperience.map((_, i) => {
            const job = mergedExperience[i];
            return (
              <div key={i} className={`entry-card${isHidden(job._key) ? " is-hidden" : ""}`}>
                <div className="entry-title">
                  <span>{job.role || `Job ${i + 1}`}{job.company ? ` — ${job.company}` : ""}</span>
                  <HideToggle hidden={isHidden(job._key)} onToggle={() => toggleHidden(job._key)} />
                </div>
                <div className="field-label">Job title</div>
                <input type="text" className="input" value={job.role ?? ""} onChange={(e) => updateExpField(i, "role", e.target.value)} />
                <div className="field-label">Company</div>
                <input type="text" className="input" value={job.company ?? ""} onChange={(e) => updateExpField(i, "company", e.target.value)} />
                <BulletEditor
                  bullets={job.bullets}
                  onUpdate={(bi, val) => updateExpBullet(i, bi, val)}
                  onAdd={() => addExpBullet(i)}
                  onRemove={(bi) => removeExpBullet(i, bi)}
                />
              </div>
            );
          })}
          {extraExperience.map((job, i) => (
            <div key={job._id} className={`entry-card${isHidden(job._id) ? " is-hidden" : ""}`}>
              <div className="entry-title">
                <span>{job.role || "New role"}{job.company ? ` — ${job.company}` : ""}</span>
                <span className="entry-actions">
                  <HideToggle hidden={isHidden(job._id)} onToggle={() => toggleHidden(job._id)} />
                  <button className="btn-remove" onClick={() => removeExtraEntry(setExtraExperience, i)}>Remove</button>
                </span>
              </div>
              <div className="field-label">Job title</div>
              <input type="text" className="input" value={job.role} onChange={(e) => updateExtra(setExtraExperience, i, "role", e.target.value)} />
              <div className="field-label">Company</div>
              <input type="text" className="input" value={job.company} onChange={(e) => updateExtra(setExtraExperience, i, "company", e.target.value)} />
              <BulletEditor
                bullets={job.bullets}
                onUpdate={(bi, val) => updateExtraBullet(setExtraExperience, i, bi, val)}
                onAdd={() => addExtraBullet(setExtraExperience, i)}
                onRemove={(bi) => removeExtraBullet(setExtraExperience, i, bi)}
              />
            </div>
          ))}
          <button className="btn btn-add-entry" onClick={() => setExtraExperience((p) => [...p, blankExperience()])}>
            + Add experience
          </button>

          {/* PROJECTS */}
          <div className="section-label">Projects</div>
          {aiProjects.map((_, i) => {
            const proj = mergedProjects[i];
            return (
              <div key={i} className={`entry-card${isHidden(proj._key) ? " is-hidden" : ""}`}>
                <div className="entry-title">
                  <span>{proj.name || `Project ${i + 1}`}</span>
                  <HideToggle hidden={isHidden(proj._key)} onToggle={() => toggleHidden(proj._key)} />
                </div>
                <div className="field-label">Project name</div>
                <input type="text" className="input" value={proj.name ?? ""} onChange={(e) => updateProjField(i, "name", e.target.value)} />
                <div className="field-label">Tech stack</div>
                <input
                  type="text"
                  className="input"
                  value={(proj.tech || proj.stack || proj.languages || []).join(", ")}
                  placeholder="e.g. React, Node.js, PostgreSQL"
                  onChange={(e) => updateProjField(i, "tech", e.target.value.split(",").map((s) => s.trim()))}
                />
                <BulletEditor
                  bullets={proj.bullets}
                  onUpdate={(bi, val) => updateProjBullet(i, bi, val)}
                  onAdd={() => addProjBullet(i)}
                  onRemove={(bi) => removeProjBullet(i, bi)}
                />
              </div>
            );
          })}
          {extraProjects.map((proj, i) => (
            <div key={proj._id} className={`entry-card${isHidden(proj._id) ? " is-hidden" : ""}`}>
              <div className="entry-title">
                <span>{proj.name || "New project"}</span>
                <span className="entry-actions">
                  <HideToggle hidden={isHidden(proj._id)} onToggle={() => toggleHidden(proj._id)} />
                  <button className="btn-remove" onClick={() => removeExtraEntry(setExtraProjects, i)}>Remove</button>
                </span>
              </div>
              <div className="field-label">Project name</div>
              <input type="text" className="input" value={proj.name} onChange={(e) => updateExtra(setExtraProjects, i, "name", e.target.value)} />
              <div className="field-label">Tech stack</div>
              <input
                type="text"
                className="input"
                value={(proj.tech || []).join(", ")}
                placeholder="e.g. React, Node.js, PostgreSQL"
                onChange={(e) => updateExtra(setExtraProjects, i, "tech", e.target.value.split(",").map((s) => s.trim()))}
              />
              <BulletEditor
                bullets={proj.bullets}
                onUpdate={(bi, val) => updateExtraBullet(setExtraProjects, i, bi, val)}
                onAdd={() => addExtraBullet(setExtraProjects, i)}
                onRemove={(bi) => removeExtraBullet(setExtraProjects, i, bi)}
              />
            </div>
          ))}
          <button className="btn btn-add-entry" onClick={() => setExtraProjects((p) => [...p, blankProject()])}>
            + Add project
          </button>

          {/* SKILLS */}
          <div className="section-label">Skills</div>
          <div className="chip-row">
            {strengths.map((skill) => (
              <span key={skill} className="chip chip-good">
                {skill}
                <button onClick={() => removeStrength(skill)} title="Remove skill">✕</button>
              </span>
            ))}
          </div>
          <div className="skill-add-row">
            <input
              type="text"
              className="input"
              placeholder="Add a skill…"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            />
            <button className="btn btn-ghost" onClick={addSkill}>Add</button>
          </div>

          {/* MISSING SKILLS */}
          {missingSkills.length > 0 && (
            <>
              <div className="section-label">Missing Skills</div>
              <div className="chip-row">
                {missingSkills.map((skill) => (
                  <span key={skill} className="chip chip-bad" onClick={() => addStrength(skill)} title="Click to add as a strength">
                    + {skill}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT: Live preview ─────────────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Preview</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {resumeData && (
              <span className={`fit-badge ${isOverOnePage ? "over" : "ok"}`}>
                {isOverOnePage ? "⚠ Exceeds 1 page" : "✓ Fits 1 page"}
              </span>
            )}
            <button className="btn btn-ghost" onClick={copyAsText} title="Copy the resume as plain text for ATS forms">
              {copied ? "Copied ✓" : "Copy as text"}
            </button>
            <button
              className="btn btn-dark"
              onClick={downloadPDF}
              title={isOverOnePage ? "Resume exceeds one page — PDF may be clipped" : ""}
            >
              Download PDF
            </button>
          </div>
        </div>
        <div className="panel-body preview-body">
          <div id="resume" ref={resumeRef} className="resume-sheet">
            <ResumeRenderer layout={layout} data={renderedData} />
          </div>

          {/* Overflow warning banner */}
          {isOverOnePage && (
            <div className="overflow-banner">
              <span style={{ fontSize: "18px", lineHeight: 1.2 }}>⚠️</span>
              <div>
                <div className="overflow-banner-title">Resume exceeds one page</div>
                <div className="overflow-banner-text">
                  The PDF will spill onto a second page. Try hiding an entry (👁 toggle), removing bullets, or trimming skills to fit.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
