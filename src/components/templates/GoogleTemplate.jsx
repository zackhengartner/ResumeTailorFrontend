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

      <Section title="EDUCATION">
        {education.map((e, i) => (
          <EducationEntry key={i} entry={e} />
        ))}
      </Section>

      <Section title="EXPERIENCE">
        {experience.map((e, i) => (
          <Job key={i} job={e} />
        ))}
      </Section>

      <Section title="PROJECTS">
        {projects.map((p, i) => (
          <Project key={i} project={p} />
        ))}
      </Section>

      <Section title="SKILLS">
        <p style={styles.skills}>{skills.join(" • ")}</p>
      </Section>
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
      <ul style={styles.ul}>
        {(job.bullets || []).map((b, i) => (
          <li key={i} style={styles.li}>{b}</li>
        ))}
      </ul>
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
      {entry.degree && (
        <ul style={styles.ul}>
          <li style={styles.li}>{entry.degree}</li>
        </ul>
      )}
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
      <ul style={styles.ul}>
        {(project.bullets || []).map((b, i) => (
          <li key={i} style={styles.li}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "Arial",
    fontSize: "13px",
    padding: "40px 48px 40px 40px",
    color: "#111",
    width: "816px",
    boxSizing: "border-box",
  },
  header: { marginBottom: "18px" },
  name: { fontSize: "28px", fontWeight: "bold", marginBottom: "4px" },
  contact: { fontSize: "12px", color: "#444" },
  section: { marginBottom: "14px" },
  sectionTitle: {
    fontSize: "11px",
    letterSpacing: "1.6px",
    borderBottom: "1px solid #ddd",
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
  left: { fontSize: "13px", flex: "1 1 0", minWidth: 0, wordBreak: "break-word" },
  right: {
    fontSize: "12px",
    color: "#444",
    textAlign: "right",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  ul: { margin: "6px 0 0 18px", paddingLeft: "14px" },
  li: { marginBottom: "3px", lineHeight: "1.35" },
  skills: { fontSize: "12.5px" },
  summary: { margin: 0, fontSize: "12.5px", lineHeight: "1.4" },
};
