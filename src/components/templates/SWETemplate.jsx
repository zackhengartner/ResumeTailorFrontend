// Modeled on the classic Google Docs SWE resume: centered bold sans-serif
// name, sentence-case section headers over thin rules, company bold with
// dates right-aligned and the role in italics beneath.
export default function SWETemplate({ data }) {
  const basics = data?.basics || {};
  const experience = data?.experience || [];
  const projects = data?.projects || [];
  const education = data?.education || [];
  const skills = data?.skills || [];
  const summary = (data?.summary || "").trim();

  const contact = [
    basics.phone,
    basics.email,
    basics.links?.github,
    basics.links?.website,
  ].filter(Boolean);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.name}>{basics.name || "Your Name"}</div>
        <div style={styles.contact}>{contact.join("   |   ")}</div>
      </div>

      {summary && (
        <Section title="Summary">
          <p style={styles.summary}>{summary}</p>
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
              {e.degree && <p style={styles.italicSub}>{e.degree}</p>}
            </div>
          ))}
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="Experience">
          {experience.map((e, i) => (
            <div key={i} style={styles.entry}>
              <div style={styles.row}>
                <div style={styles.left}><b>{e.company || e.role}</b></div>
                <div style={styles.right}>{e.date}</div>
              </div>
              {e.company && e.role && <p style={styles.italicSub}>{e.role}</p>}
              <Bullets bullets={e.bullets} />
            </div>
          ))}
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Projects">
          {projects.map((p, i) => {
            const tech = p.tech || p.stack || p.languages || [];
            return (
              <div key={i} style={styles.entry}>
                <div style={styles.left}>
                  <b>{p.name}</b>
                  {tech.length > 0 && (
                    <span style={styles.techNote}> | <i>{tech.join(", ")}</i></span>
                  )}
                </div>
                <Bullets bullets={p.bullets} />
              </div>
            );
          })}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Technical Skills">
          <p style={styles.skills}>
            <b>Skills:</b> {skills.join(", ")}
          </p>
        </Section>
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

function Bullets({ bullets }) {
  if (!(bullets || []).length) return null;
  return (
    <ul style={styles.ul}>
      {bullets.map((b, i) => (
        <li key={i} style={styles.li}>{b}</li>
      ))}
    </ul>
  );
}

const styles = {
  page: {
    width: "816px",
    minHeight: "1056px",
    boxSizing: "border-box",
    padding: "36px 48px",
    fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
    fontSize: "11.5px",
    lineHeight: "1.35",
    color: "#111",
    backgroundColor: "#fff",
    wordWrap: "break-word",
    overflowWrap: "break-word",
  },
  header: {
    textAlign: "center",
    marginBottom: "12px",
  },
  name: {
    fontSize: "30px",
    fontWeight: 700,
    lineHeight: "1.1",
    marginBottom: "4px",
  },
  contact: {
    fontSize: "11px",
    color: "#222",
  },
  section: {
    marginBottom: "12px",
  },
  title: {
    fontSize: "13.5px",
    fontWeight: 600,
    borderBottom: "1px solid #444",
    paddingBottom: "2px",
    marginBottom: "7px",
  },
  entry: {
    marginBottom: "9px",
    paddingLeft: "10px",
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
    fontSize: "12px",
    overflowWrap: "break-word",
  },
  right: {
    fontWeight: 600,
    fontSize: "11.5px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  italicSub: {
    margin: "1px 0 0 0",
    fontStyle: "italic",
    lineHeight: "1.3",
  },
  techNote: {
    fontWeight: 400,
  },
  ul: {
    margin: "4px 0 0 0",
    paddingLeft: "18px",
  },
  li: {
    marginBottom: "3px",
    lineHeight: "1.4",
    overflowWrap: "break-word",
  },
  skills: {
    margin: 0,
    lineHeight: "1.45",
    overflowWrap: "break-word",
  },
  summary: {
    margin: 0,
    lineHeight: "1.4",
    overflowWrap: "break-word",
  },
};
