// Build a plain-text rendition of the resume for pasting into ATS web forms.

export function resumeToPlainText(data) {
  const { basics = {}, education = [], experience = [], projects = [], skills = [], summary = "" } = data || {};
  const lines = [];

  if (basics.name) lines.push(basics.name.toUpperCase());
  const contact = [basics.email, basics.phone, basics.links?.github, basics.links?.website]
    .filter(Boolean)
    .join(" | ");
  if (contact) lines.push(contact);
  lines.push("");

  if (summary.trim()) {
    lines.push("SUMMARY", summary.trim(), "");
  }

  if (education.length) {
    lines.push("EDUCATION");
    for (const e of education) {
      lines.push([e.school, e.degree].filter(Boolean).join(" — ") + (e.date ? ` (${e.date})` : ""));
    }
    lines.push("");
  }

  if (experience.length) {
    lines.push("EXPERIENCE");
    for (const job of experience) {
      lines.push([job.role, job.company].filter(Boolean).join(", "));
      for (const b of job.bullets || []) {
        if (b.trim()) lines.push(`- ${b.trim()}`);
      }
      lines.push("");
    }
  }

  if (projects.length) {
    lines.push("PROJECTS");
    for (const p of projects) {
      const tech = (p.tech || []).filter(Boolean).join(", ");
      lines.push(p.name + (tech ? ` (${tech})` : ""));
      for (const b of p.bullets || []) {
        if (b.trim()) lines.push(`- ${b.trim()}`);
      }
      lines.push("");
    }
  }

  if (skills.length) {
    lines.push("SKILLS", skills.join(", "));
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
