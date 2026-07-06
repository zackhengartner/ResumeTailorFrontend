export default function HarvardTemplate({ data }) {
  const basics = data?.basics || {};
  const experience = data?.experience || [];
  const projects = data?.projects || [];
  const education = data?.education || [];
  const skills = data?.skills || [];
  const summary = (data?.summary || "").trim();

  return (
    <div style={styles.page}>
      <Header basics={basics} />

      {summary && (
        <Section title="Summary">
          <p style={styles.summary}>{summary}</p>
        </Section>
      )}

      {education.length > 0 && (
        <Section title="Education">
          {education.map((ed, i) => (
            <EducationEntry key={i} entry={ed} />
          ))}
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="Experience">
          {experience.map((e, i) => (
            <Job key={i} job={e} />
          ))}
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Projects">
          {projects.map((p, i) => (
            <Job key={i} job={p} />
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <p style={styles.skills}>{skills.join(" • ")}</p>
        </Section>
      )}
    </div>
  );
}

function Header({ basics }) {
  const contact = [
    basics.email,
    basics.phone,
    basics.links?.github,
    basics.links?.website,
  ].filter(Boolean).join(" · ");

  return (
    <div style={styles.header}>
      <div style={styles.name}>{basics.name || "Your Name"}</div>
      <div style={styles.contact}>{contact}</div>
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
        <p style={styles.degree}>{entry.degree}</p>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.title}>{title}</div>
      {children}
    </div>
  );
}

function Job({ job }) {
  return (
    <div style={styles.job}>
      <div style={styles.row}>
        <div style={styles.left}><b>{job.role || job.name}</b></div>
        <div style={styles.right}>{job.company || ""}</div>
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

const styles = {
  page: {
    width: "816px",
    minHeight: "1056px",
    boxSizing: "border-box",
    paddingTop: "36px",
    paddingBottom: "36px",
    paddingLeft: "52px",
    paddingRight: "52px",
    fontFamily: '"Times New Roman", Times, serif',
    fontSize: "11.5px",
    lineHeight: "1.28",
    color: "#111",
    backgroundColor: "#fff",
    wordWrap: "break-word",
    overflowWrap: "break-word",
  },
  header: {
    textAlign: "center",
    marginBottom: "14px",
    paddingBottom: "10px",
    borderBottom: "1.5px solid #111",
  },
  name: {
    fontSize: "25px",
    fontWeight: 700,
    lineHeight: "1.05",
    letterSpacing: "0.5px",
    marginBottom: "5px",
  },
  contact: {
    fontSize: "10.5px",
    color: "#333",
    lineHeight: "1.25",
  },
  section: {
    marginBottom: "12px",
  },
  title: {
    fontSize: "12px",
    fontWeight: 700,
    fontVariant: "small-caps",
    letterSpacing: "1.5px",
    borderBottom: "1px solid #555",
    paddingBottom: "2px",
    marginBottom: "7px",
  },
  job: {
    marginBottom: "9px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    width: "100%",
  },
  left: {
    flex: 1,
    minWidth: 0,
    overflowWrap: "break-word",
  },
  right: {
    textAlign: "right",
    color: "#333",
    fontStyle: "italic",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  degree: {
    margin: "2px 0 0 0",
    fontStyle: "italic",
    lineHeight: "1.3",
  },
  ul: {
    margin: "3px 0 0 0",
    paddingLeft: "18px",
  },
  li: {
    marginBottom: "2.5px",
    lineHeight: "1.32",
    overflowWrap: "break-word",
  },
  skills: {
    margin: 0,
    fontSize: "11px",
    lineHeight: "1.35",
    overflowWrap: "break-word",
  },
  summary: {
    margin: 0,
    fontSize: "11px",
    lineHeight: "1.35",
    overflowWrap: "break-word",
  },
};
