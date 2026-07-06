import { useState, useEffect, useRef } from "react";
import ResumeRenderer from "./components/ResumeRenderer";
import html2pdf from "html2pdf.js/dist/html2pdf.bundle.min";

// ── Blank entry templates ─────────────────────────────────────────────────────
const blankEducation = () => ({ school: "", degree: "", date: "" });
const blankExperience = () => ({ role: "", company: "", bullets: [""] });
const blankProject = () => ({ name: "", tech: [], bullets: [""] });

// ── BulletTextarea ────────────────────────────────────────────────────────────
// Keeps its own local string so the parent App doesn't re-render on every
// keystroke. Flushes the final value to the parent only onBlur.
function BulletTextarea({ initialValue, onCommit, onRemove }) {
  const [value, setValue] = useState(initialValue);

  // If the parent resets the whole form (new analysis), sync back down
  useEffect(() => { setValue(initialValue); }, [initialValue]);

  return (
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

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [layout, setLayout] = useState("google");
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOverOnePage, setIsOverOnePage] = useState(false);
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
  const [userStrengths, setUserStrengths] = useState([]);
  const [userMissing, setUserMissing] = useState([]);
  const [newSkill, setNewSkill] = useState("");

  // Override state — arrays shadow the AI arrays index-for-index
  const [basicsOverrides, setBasicsOverrides] = useState({});
  const [educationOverrides, setEducationOverrides] = useState([]);
  const [experienceOverrides, setExperienceOverrides] = useState([]);
  const [projectOverrides, setProjectOverrides] = useState([]);
  // Extra entries added by the user (not from AI)
  const [extraEducation, setExtraEducation] = useState([]);
  const [extraExperience, setExtraExperience] = useState([]);
  const [extraProjects, setExtraProjects] = useState([]);

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
    ...aiEducation.map((e, i) => ({ ...e, ...(educationOverrides[i] || {}) })),
    ...extraEducation,
  ];

  const mergedExperience = [
    ...aiExperience.map((e, i) => ({
      ...e,
      ...(experienceOverrides[i] || {}),
      bullets: experienceOverrides[i]?.bullets ?? e.bullets,
    })),
    ...extraExperience,
  ];

  const mergedProjects = [
    ...aiProjects.map((p, i) => ({
      ...p,
      ...(projectOverrides[i] || {}),
      bullets: projectOverrides[i]?.bullets ?? p.bullets,
    })),
    ...extraProjects,
  ];

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

  // ── API ─────────────────────────────────────────────────────────────────────
  const analyzeResume = async () => {
    if (!file || !jobDescription) return;
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);
    setLoading(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/analyze-resume`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResumeData(data);
    setUserStrengths([]);
    setUserMissing([]);
    setBasicsOverrides({});
    setEducationOverrides([]);
    setExperienceOverrides([]);
    setProjectOverrides([]);
    setExtraEducation([]);
    setExtraExperience([]);
    setExtraProjects([]);
    setLoading(false);
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

  // ── PDF download ────────────────────────────────────────────────────────────
  const downloadPDF = () => {
    const element = document.getElementById("resume");
    html2pdf()
      .set({
        margin: 0,
        filename: "resume.pdf",
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

          {/* EDUCATION */}
          <div className="section-label">Education</div>
          {/* AI-sourced entries */}
          {aiEducation.map((_, i) => {
            const entry = mergedEducation[i];
            return (
              <div key={i} className="entry-card">
                <div className="entry-title"><span>{entry.school || `School ${i + 1}`}</span></div>
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
            <div key={`extra-edu-${i}`} className="entry-card">
              <div className="entry-title">
                <span>{entry.school || "New school"}</span>
                <button className="btn-remove" onClick={() => removeExtraEntry(setExtraEducation, i)}>Remove</button>
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
              <div key={i} className="entry-card">
                <div className="entry-title">
                  <span>{job.role || `Job ${i + 1}`}{job.company ? ` — ${job.company}` : ""}</span>
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
            <div key={`extra-exp-${i}`} className="entry-card">
              <div className="entry-title">
                <span>{job.role || "New role"}{job.company ? ` — ${job.company}` : ""}</span>
                <button className="btn-remove" onClick={() => removeExtraEntry(setExtraExperience, i)}>Remove</button>
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
              <div key={i} className="entry-card">
                <div className="entry-title"><span>{proj.name || `Project ${i + 1}`}</span></div>
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
            <div key={`extra-proj-${i}`} className="entry-card">
              <div className="entry-title">
                <span>{proj.name || "New project"}</span>
                <button className="btn-remove" onClick={() => removeExtraEntry(setExtraProjects, i)}>Remove</button>
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
            <ResumeRenderer
              layout={layout}
              data={{
                basics: mergedBasics,
                education: mergedEducation,
                experience: mergedExperience,
                projects: mergedProjects,
                skills: strengths,
              }}
            />
          </div>

          {/* Overflow warning banner */}
          {isOverOnePage && (
            <div className="overflow-banner">
              <span style={{ fontSize: "18px", lineHeight: 1.2 }}>⚠️</span>
              <div>
                <div className="overflow-banner-title">Resume exceeds one page</div>
                <div className="overflow-banner-text">
                  The PDF will spill onto a second page. Try removing bullets, shortening descriptions, or trimming skills to fit.
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
