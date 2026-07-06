export default function ExecutiveTemplate({ data }) {
  const basics = data?.basics || {};
  const experience = data?.experience || [];
  const projects = data?.projects || [];
  const education = data?.education || [];
  const skills = data?.skills || [];
  const summary = (data?.summary || "").trim();

  const contact = [
    basics.email,
    basics.phone,
    basics.links?.github,
    basics.links?.website,
  ].filter(Boolean).join("  |  ");

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.name}>{basics.name || "Your Name"}</div>
        <div style={styles.contact}>{contact}</div>
        <div style={styles.headerRule} />
        <div style={styles.headerRuleThin} />
      </div>

      {summary && (
        <Section title="Profile">
          <p style={styles.summary}>{summary}</p>
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="Professional Experience">
          {experience.map((e, i) => (
            <Entry key={i} heading={e.role} sub={e.company} bullets={e.bullets} />
          ))}
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Selected Projects">
          {projects.map((p, i) => (
            <Entry
              key={i}
              heading={p.name}
              sub={(p.tech || p.stack || p.languages || []).join(", ")}
              bullets={p.bullets}
            />
          ))}
        </Section>
      )}

      {education.length > 0 && (
        <Section title="Education">
          {education.map((e, i) => (
            <div key={i} style={styles.entry}>
              <div style={styles.row}>
                <div style={styles.left}><b>{e.school}</b></div>
                <div style={styles.right}>{e.date}</div>
              </div>
              {e.degree && <p style={styles.degree}>{e.degree}</p>}
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Core Competencies">
          <p style={styles.skills}>{skills.join("  ·  ")}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.titleRow}>
        <div style={styles.titleLine} />
        <div style={styles.title}>{title}</div>
        <div style={styles.titleLine} />
      </div>
      {children}
    </div>
  );
}

function Entry({ heading, sub, bullets }) {
  return (
    <div style={styles.entry}>
      <div style={styles.row}>
        <div style={styles.left}><b>{heading}</b></div>
        <div style={styles.right}>{sub || ""}</div>
      </div>
      {(bullets || []).length > 0 && (
        <ul style={styles.ul}>
          {(bullets || []).map((b, i) => (
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
    padding: "42px 56px",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "11.5px",
    lineHeight: "1.32",
    color: "#1c1c1c",
    backgroundColor: "#fff",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  },
  header: {
    textAlign: "center",
    marginBottom: "16px",
  },
  name: {
    fontSize: "26px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "3px",
    lineHeight: "1.1",
    marginBottom: "6px",
  },
  contact: {
    fontSize: "10.5px",
    color: "#3a3a3a",
    letterSpacing: "0.3px",
    marginBottom: "10px",
  },
  headerRule: {
    borderBottom: "2.5px solid #1c1c1c",
    marginBottom: "2px",
  },
  headerRuleThin: {
    borderBottom: "1px solid #1c1c1c",
  },
  section: {
    marginBottom: "13px",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  titleLine: {
    flex: 1,
    borderBottom: "1px solid #b0b0b0",
  },
  title: {
    fontSize: "11.5px",
    fontWeight: 700,
    fontVariant: "small-caps",
    letterSpacing: "2px",
    whiteSpace: "nowrap",
  },
  entry: {
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
    color: "#3a3a3a",
    fontStyle: "italic",
    fontSize: "11px",
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
    lineHeight: "1.34",
    overflowWrap: "break-word",
  },
  skills: {
    margin: 0,
    fontSize: "11px",
    lineHeight: "1.45",
    textAlign: "center",
    overflowWrap: "break-word",
  },
  summary: {
    margin: 0,
    fontSize: "11.5px",
    lineHeight: "1.4",
    textAlign: "center",
    fontStyle: "italic",
    overflowWrap: "break-word",
  },
};
