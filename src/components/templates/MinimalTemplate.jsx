export default function MinimalTemplate({ data }) {
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
  ].filter(Boolean).join("   ·   ");

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.name}>{basics.name || "Your Name"}</div>
        <div style={styles.contact}>{contact}</div>
      </div>

      {summary && (
        <Section title="Summary">
          <p style={styles.summary}>{summary}</p>
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="Experience">
          {experience.map((e, i) => (
            <Entry key={i} heading={e.role} sub={e.company} bullets={e.bullets} />
          ))}
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Projects">
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
                <div style={styles.left}>
                  <span style={styles.heading}>{e.school}</span>
                  {e.degree && <span style={styles.sub}> — {e.degree}</span>}
                </div>
                <div style={styles.right}>{e.date}</div>
              </div>
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <p style={styles.skills}>{skills.join("  ·  ")}</p>
        </Section>
      )}
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

function Entry({ heading, sub, bullets }) {
  return (
    <div style={styles.entry}>
      <div style={styles.row}>
        <div style={styles.left}>
          <span style={styles.heading}>{heading}</span>
          {sub && <span style={styles.sub}> — {sub}</span>}
        </div>
      </div>
      {(bullets || []).length > 0 && (
        <ul style={styles.ul}>
          {(bullets || []).map((b, i) => (
            <li key={i} style={styles.li}>
              <span style={styles.dash}>–</span>
              <span style={styles.bulletText}>{b}</span>
            </li>
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
    padding: "48px 60px",
    fontFamily: "Helvetica, Arial, sans-serif",
    fontSize: "11.5px",
    lineHeight: "1.4",
    color: "#1a1a1a",
    backgroundColor: "#fff",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  },
  header: {
    marginBottom: "24px",
  },
  name: {
    fontSize: "26px",
    fontWeight: "600",
    letterSpacing: "-0.3px",
    lineHeight: "1.1",
    marginBottom: "6px",
  },
  contact: {
    fontSize: "10.5px",
    color: "#666",
    whiteSpace: "pre-wrap",
  },
  section: {
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "9.5px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "2px",
    color: "#999",
    marginBottom: "8px",
  },
  entry: {
    marginBottom: "10px",
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
    color: "#666",
    fontSize: "10.5px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  heading: {
    fontWeight: "700",
    fontSize: "12px",
  },
  sub: {
    color: "#555",
    fontSize: "11.5px",
  },
  ul: {
    margin: "4px 0 0 0",
    paddingLeft: "2px",
    listStyleType: "none",
  },
  li: {
    display: "flex",
    gap: "7px",
    marginBottom: "3px",
    lineHeight: "1.4",
  },
  dash: {
    color: "#999",
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    minWidth: 0,
    overflowWrap: "break-word",
  },
  skills: {
    margin: 0,
    fontSize: "11px",
    lineHeight: "1.5",
    overflowWrap: "break-word",
  },
  summary: {
    margin: 0,
    fontSize: "11.5px",
    lineHeight: "1.45",
    overflowWrap: "break-word",
  },
};
