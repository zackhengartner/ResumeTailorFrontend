export default function GoogleTemplate({ data }) {
  const basics = data?.basics || {};
  const experience = data?.experience || [];
  const education = data?.education || [];
  const projects = data?.projects || [];
  const skills = data?.skills || [];
  const summary = (data?.summary || "").trim();

  return (
    <div style={styles.page}>
      <Header basics={basics} />

      {summary && (
        <Section title="SUMMARY">
          <p style={styles.summary}>{summary}</p>
        </Section>
      )}

      {education.length > 0 && (
        <Section title="EDUCATION">
          {education.map((e, i) => (
            <EducationEntry key={i} entry={e} />
          ))}
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="EXPERIENCE">
          {experience.map((e, i) => (
            <Job key={i} job={e} />
          ))}
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="PROJECTS">
          {projects.map((p, i) => (
            <Project key={i} project={p} />
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="SKILLS">
          <p style={styles.skills}>{skills.join(" • ")}</p>
        </Section>
      )}
    </div>
  );
}

function Header({ basics }) {
  const parts = [
    basics.email,
    basics.phone,
    basics.links?.github,
    basics.links?.website,
  ].filter(Boolean);

  return (
    <div style={styles.header}>
      <div style={styles.name}>{basics.name || "Your Name"}</div>
      <div style={styles.contact}>{parts.join(" · ")}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function Job({ job }) {
  return (
    <div style={styles.job}>
      <div style={styles.row}>
        <div style={styles.left}><b>{job.role}</b></div>
        <div style={styles.right}>{job.company}</div>
      </div>
      {(job.bullets || []).length > 0 && (
        <ul style={styles.ul}>
          {(job.bullets || []).map((b, i) => (
            <li key={i} style={styles.li}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EducationEntry({ entry }) {
  return (
    <div style={styles.job}>
      <div style={styles.row}>
        <div style={styles.left}><b>{entry.school}</b></div>
        <div style={styles.right}>{entry.date}</div>
      </div>
      {entry.degree && <p style={styles.degree}>{entry.degree}</p>}
    </div>
  );
}

function Project({ project }) {
  const tech = project.tech || project.stack || project.languages || [];
  return (
    <div style={styles.job}>
      <div style={styles.row}>
        <div style={styles.left}><b>{project.name}</b></div>
        <div style={styles.right}>{tech.length ? tech.join(" • ") : ""}</div>
      </div>
      {(project.bullets || []).length > 0 && (
        <ul style={styles.ul}>
          {(project.bullets || []).map((b, i) => (
            <li key={i} style={styles.li}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
  page: {
    width: "816px",
    minHeight: "1056px",
    boxSizing: "border-box",
    padding: "40px 48px",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "12px",
    lineHeight: "1.3",
    color: "#111",
    backgroundColor: "#fff",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  },
  header: { marginBottom: "18px" },
  name: {
    fontSize: "28px",
    fontWeight: "bold",
    lineHeight: "1.05",
    marginBottom: "5px",
  },
  contact: { fontSize: "11.5px", color: "#444" },
  section: { marginBottom: "14px" },
  sectionTitle: {
    fontSize: "10.5px",
    fontWeight: "700",
    color: "#1a73e8",
    letterSpacing: "1.6px",
    borderBottom: "1px solid #dadce0",
    marginBottom: "8px",
    paddingBottom: "3px",
  },
  job: { marginBottom: "10px" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    width: "100%",
  },
  left: { fontSize: "12.5px", flex: "1 1 0", minWidth: 0, wordBreak: "break-word" },
  right: {
    fontSize: "11.5px",
    color: "#444",
    textAlign: "right",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  degree: { margin: "3px 0 0 0", fontSize: "11.5px", color: "#333" },
  ul: { margin: "5px 0 0 0", paddingLeft: "18px" },
  li: { marginBottom: "3px", lineHeight: "1.35", overflowWrap: "break-word" },
  skills: { margin: 0, fontSize: "12px", lineHeight: "1.4" },
  summary: { margin: 0, fontSize: "12px", lineHeight: "1.4" },
};
