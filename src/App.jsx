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
    <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onCommit(value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          fontSize: "13px",
          boxSizing: "border-box",
          color: "#111827",
          marginBottom: 0,
          flex: 1,
          resize: "vertical",
          background: "#fff",
          fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      />
      <button
        onClick={onRemove}
        style={{
          background: "none",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          cursor: "pointer",
          color: "#9ca3af",
          padding: "4px 8px",
          alignSelf: "flex-start",
          fontSize: "12px",
        }}
      >✕</button>
    </div>
  );
}

// ── BulletEditor ──────────────────────────────────────────────────────────────
// Renders a list of BulletTextareas plus an add button.
// Must be defined outside App so React never remounts it mid-keystroke.
function BulletEditor({ bullets, onUpdate, onAdd, onRemove }) {
  return (
    <>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
        Bullets
      </div>
      {(bullets || []).map((b, bi) => (
        <BulletTextarea
          key={bi}
          initialValue={b}
          onCommit={(val) => onUpdate(bi, val)}
          onRemove={() => onRemove(bi)}
        />
      ))}
      <button
        onClick={onAdd}
        style={{
          background: "none",
          border: "none",
          color: "#2563eb",
          fontSize: "12px",
          cursor: "pointer",
          padding: "4px 0",
        }}
      >+ Add bullet</button>
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

  // ── Shared styles ───────────────────────────────────────────────────────────
  const card = {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    overflow: "auto",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
    fontSize: "14px",
    marginBottom: "16px",
  };

  const fieldStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "13px",
    boxSizing: "border-box",
    color: "#111827",
    marginBottom: "8px",
    background: "#fff",
  };

  const sectionLabel = {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "1px",
    textTransform: "uppercase",
    color: "#9ca3af",
    borderBottom: "1px solid #f3f4f6",
    paddingBottom: "6px",
    marginBottom: "12px",
    marginTop: "24px",
  };

  const fieldLabel = {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: "4px",
  };

  const entryCard = {
    background: "#f9fafb",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    padding: "12px 14px",
    marginBottom: "12px",
  };

  const entryTitle = {
    fontSize: "12px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const removeBtnStyle = {
    background: "none",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#ef4444",
    fontSize: "11px",
    padding: "2px 8px",
    fontWeight: 600,
  };

  const addEntryBtn = {
    width: "100%",
    padding: "8px",
    borderRadius: "8px",
    border: "1px dashed #d1d5db",
    background: "none",
    color: "#6b7280",
    fontSize: "13px",
    cursor: "pointer",
    marginBottom: "8px",
  };


  const chip = (type) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 14px",
    margin: "5px",
    borderRadius: "999px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    userSelect: "none",
    background: type === "good" ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)",
    color: type === "good" ? "#059669" : "#dc2626",
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "320px 350px 1fr",
      gap: "20px",
      height: "100vh",
      padding: "20px",
      background: "#f5f7fb",
      boxSizing: "border-box",
      fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* ── LEFT: Upload + settings ─────────────────────────────────────────── */}
      <div style={card}>
        <h1 style={{ marginTop: 0, marginBottom: "24px", fontSize: "28px", color: "#111827" }}>
          Resume Analyzer
        </h1>

        <label style={fieldLabel}>Resume PDF</label>
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} style={inputStyle} />

        <label style={fieldLabel}>Template</label>
        <select value={layout} onChange={(e) => setLayout(e.target.value)} style={inputStyle}>
          <option value="google">Google SWE Style</option>
          <option value="harvard">Harvard Academic</option>
          <option value="ats">ATS Clean</option>
        </select>

        <label style={fieldLabel}>Job Description</label>
        <textarea
          rows={12}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <button
          onClick={analyzeResume}
          style={{
            width: "100%", padding: "14px", border: "none", borderRadius: "12px",
            background: "#2563eb", color: "#fff", fontWeight: 600, fontSize: "15px", cursor: "pointer",
          }}
        >
          {loading ? "Analyzing…" : "Analyze Resume"}
        </button>

        <div style={{
          marginTop: "24px", background: "#eff6ff", borderRadius: "14px",
          padding: "20px", textAlign: "center",
        }}>
          <div style={{ fontSize: "48px", fontWeight: "700", color: "#2563eb" }}>{matchScore}%</div>
          <div style={{ color: "#64748b", fontSize: "14px" }}>Match Score</div>
        </div>
      </div>

      {/* ── CENTER: All editors ─────────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={{ marginTop: 0, color: "#111827" }}>Editor</h2>

        {/* BASICS */}
        <div style={sectionLabel}>Contact info</div>
        {[["name", "Full name"], ["email", "Email"], ["phone", "Phone"]].map(([f, label]) => (
          <div key={f}>
            <div style={fieldLabel}>{label}</div>
            <input
              type="text"
              value={mergedBasics[f] ?? ""}
              onChange={(e) => updateBasics(f, e.target.value)}
              style={fieldStyle}
            />
          </div>
        ))}
        <div style={fieldLabel}>GitHub</div>
        <input
          type="text"
          value={mergedBasics.links?.github ?? ""}
          onChange={(e) => updateBasicsLink("github", e.target.value)}
          style={fieldStyle}
        />
        <div style={fieldLabel}>Website</div>
        <input
          type="text"
          value={mergedBasics.links?.website ?? ""}
          onChange={(e) => updateBasicsLink("website", e.target.value)}
          style={fieldStyle}
        />

        {/* EDUCATION */}
        <div style={sectionLabel}>Education</div>
        {/* AI-sourced entries */}
        {aiEducation.map((_, i) => {
          const entry = mergedEducation[i];
          return (
            <div key={i} style={entryCard}>
              <div style={entryTitle}>{entry.school || `School ${i + 1}`}</div>
              <div style={fieldLabel}>School</div>
              <input type="text" value={entry.school ?? ""} onChange={(e) => updateEducation(i, "school", e.target.value)} style={fieldStyle} />
              <div style={fieldLabel}>Degree</div>
              <input type="text" value={entry.degree ?? ""} onChange={(e) => updateEducation(i, "degree", e.target.value)} style={fieldStyle} />
              <div style={fieldLabel}>Date range</div>
              <input type="text" value={entry.date ?? ""} placeholder="e.g. Aug 2021 – May 2025" onChange={(e) => updateEducation(i, "date", e.target.value)} style={fieldStyle} />
            </div>
          );
        })}
        {/* User-added extra entries */}
        {extraEducation.map((entry, i) => (
          <div key={`extra-edu-${i}`} style={entryCard}>
            <div style={entryTitle}>
              <span>{entry.school || "New school"}</span>
              <button style={removeBtnStyle} onClick={() => removeExtraEntry(setExtraEducation, i)}>Remove</button>
            </div>
            <div style={fieldLabel}>School</div>
            <input type="text" value={entry.school} onChange={(e) => updateExtra(setExtraEducation, i, "school", e.target.value)} style={fieldStyle} />
            <div style={fieldLabel}>Degree</div>
            <input type="text" value={entry.degree} onChange={(e) => updateExtra(setExtraEducation, i, "degree", e.target.value)} style={fieldStyle} />
            <div style={fieldLabel}>Date range</div>
            <input type="text" value={entry.date} placeholder="e.g. Aug 2021 – May 2025" onChange={(e) => updateExtra(setExtraEducation, i, "date", e.target.value)} style={fieldStyle} />
          </div>
        ))}
        <button style={addEntryBtn} onClick={() => setExtraEducation((p) => [...p, blankEducation()])}>
          + Add education
        </button>

        {/* EXPERIENCE */}
        <div style={sectionLabel}>Experience</div>
        {aiExperience.map((_, i) => {
          const job = mergedExperience[i];
          return (
            <div key={i} style={entryCard}>
              <div style={entryTitle}>{job.role || `Job ${i + 1}`}{job.company ? ` — ${job.company}` : ""}</div>
              <div style={fieldLabel}>Job title</div>
              <input type="text" value={job.role ?? ""} onChange={(e) => updateExpField(i, "role", e.target.value)} style={fieldStyle} />
              <div style={fieldLabel}>Company</div>
              <input type="text" value={job.company ?? ""} onChange={(e) => updateExpField(i, "company", e.target.value)} style={fieldStyle} />
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
          <div key={`extra-exp-${i}`} style={entryCard}>
            <div style={entryTitle}>
              <span>{job.role || "New role"}{job.company ? ` — ${job.company}` : ""}</span>
              <button style={removeBtnStyle} onClick={() => removeExtraEntry(setExtraExperience, i)}>Remove</button>
            </div>
            <div style={fieldLabel}>Job title</div>
            <input type="text" value={job.role} onChange={(e) => updateExtra(setExtraExperience, i, "role", e.target.value)} style={fieldStyle} />
            <div style={fieldLabel}>Company</div>
            <input type="text" value={job.company} onChange={(e) => updateExtra(setExtraExperience, i, "company", e.target.value)} style={fieldStyle} />
            <BulletEditor
              bullets={job.bullets}
              onUpdate={(bi, val) => updateExtraBullet(setExtraExperience, i, bi, val)}
              onAdd={() => addExtraBullet(setExtraExperience, i)}
              onRemove={(bi) => removeExtraBullet(setExtraExperience, i, bi)}
            />
          </div>
        ))}
        <button style={addEntryBtn} onClick={() => setExtraExperience((p) => [...p, blankExperience()])}>
          + Add experience
        </button>

        {/* PROJECTS */}
        <div style={sectionLabel}>Projects</div>
        {aiProjects.map((_, i) => {
          const proj = mergedProjects[i];
          return (
            <div key={i} style={entryCard}>
              <div style={entryTitle}>{proj.name || `Project ${i + 1}`}</div>
              <div style={fieldLabel}>Project name</div>
              <input type="text" value={proj.name ?? ""} onChange={(e) => updateProjField(i, "name", e.target.value)} style={fieldStyle} />
              <div style={fieldLabel}>Tech stack</div>
              <input
                type="text"
                value={(proj.tech || proj.stack || proj.languages || []).join(", ")}
                placeholder="e.g. React, Node.js, PostgreSQL"
                onChange={(e) => updateProjField(i, "tech", e.target.value.split(",").map((s) => s.trim()))}
                style={fieldStyle}
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
          <div key={`extra-proj-${i}`} style={entryCard}>
            <div style={entryTitle}>
              <span>{proj.name || "New project"}</span>
              <button style={removeBtnStyle} onClick={() => removeExtraEntry(setExtraProjects, i)}>Remove</button>
            </div>
            <div style={fieldLabel}>Project name</div>
            <input type="text" value={proj.name} onChange={(e) => updateExtra(setExtraProjects, i, "name", e.target.value)} style={fieldStyle} />
            <div style={fieldLabel}>Tech stack</div>
            <input
              type="text"
              value={(proj.tech || []).join(", ")}
              placeholder="e.g. React, Node.js, PostgreSQL"
              onChange={(e) => updateExtra(setExtraProjects, i, "tech", e.target.value.split(",").map((s) => s.trim()))}
              style={fieldStyle}
            />
            <BulletEditor
              bullets={proj.bullets}
              onUpdate={(bi, val) => updateExtraBullet(setExtraProjects, i, bi, val)}
              onAdd={() => addExtraBullet(setExtraProjects, i)}
              onRemove={(bi) => removeExtraBullet(setExtraProjects, i, bi)}
            />
          </div>
        ))}
        <button style={addEntryBtn} onClick={() => setExtraProjects((p) => [...p, blankProject()])}>
          + Add project
        </button>

        {/* SKILLS */}
        <div style={sectionLabel}>Skills</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "10px" }}>
          {strengths.map((skill) => (
            <span
              key={skill}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "5px 10px", borderRadius: "999px",
                background: "rgba(16,185,129,.12)", color: "#059669",
                fontSize: "13px", fontWeight: 600,
              }}
            >
              {skill}
              <button
                onClick={() => removeStrength(skill)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#059669", fontSize: "14px", lineHeight: 1, padding: 0 }}
              >✕</button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Add a skill…"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            style={{ ...fieldStyle, marginBottom: 0, flex: 1 }}
          />
          <button
            onClick={addSkill}
            style={{
              padding: "8px 14px", borderRadius: "8px", border: "1px solid #2563eb",
              background: "#eff6ff", color: "#2563eb", fontWeight: 600, fontSize: "13px", cursor: "pointer",
            }}
          >Add</button>
        </div>

        {/* MISSING SKILLS */}
        {missingSkills.length > 0 && (
          <>
            <div style={sectionLabel}>Missing Skills</div>
            <div>
              {missingSkills.map((skill) => (
                <span key={skill} style={chip("bad")} onClick={() => addStrength(skill)}>
                  + {skill}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT: Live preview ─────────────────────────────────────────────── */}
      <div style={{ ...card, background: "#eef2f7" }}>
        <div
          id="resume"
          ref={resumeRef}
          style={{
            background: "#fff",
            width: "816px",
            minHeight: "1056px",
            margin: "0 auto",
            borderRadius: "12px",
            overflow: "visible",
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          }}
        >
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

        {/* Page overflow indicator line */}
        {resumeData && (
          <div style={{
            width: "816px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "12px",
          }}>
            <div style={{ flex: 1, height: "1px", background: isOverOnePage ? "#fca5a5" : "#d1fae5" }} />
            <span style={{
              fontSize: "11px",
              fontWeight: 600,
              color: isOverOnePage ? "#ef4444" : "#10b981",
              whiteSpace: "nowrap",
            }}>
              {isOverOnePage ? "⚠ Exceeds 1 page" : "✓ Fits 1 page"}
            </span>
            <div style={{ flex: 1, height: "1px", background: isOverOnePage ? "#fca5a5" : "#d1fae5" }} />
          </div>
        )}

        {/* Overflow warning banner */}
        {isOverOnePage && (
          <div style={{
            marginTop: "12px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            width: "816px",
            margin: "12px auto 0",
            boxSizing: "border-box",
          }}>
            <span style={{ fontSize: "18px", lineHeight: 1.2 }}>⚠️</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#b91c1c", marginBottom: "2px" }}>
                Resume exceeds one page
              </div>
              <div style={{ fontSize: "12px", color: "#991b1b", lineHeight: 1.5 }}>
                The PDF will spill onto a second page. Try removing bullets, shortening descriptions, or trimming skills to fit.
              </div>
            </div>
          </div>
        )}

        <button
          onClick={downloadPDF}
          style={{
            marginTop: "16px", width: "100%", padding: "14px", border: "none",
            borderRadius: "12px",
            background: isOverOnePage ? "#6b7280" : "#111827",
            color: "#fff",
            fontWeight: 600, fontSize: "15px", cursor: "pointer",
            transition: "background 0.2s",
          }}
          title={isOverOnePage ? "Resume exceeds one page — PDF may be clipped" : ""}
        >
          {isOverOnePage ? "Download PDF (over 1 page)" : "Download PDF"}
        </button>
      </div>
    </div>
  );
}

export default App;
