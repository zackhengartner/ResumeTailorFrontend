// Modeled on the classic NYU/FAANG serif resume: centered uppercase name,
// centered bold section headers under full-width rules, Times throughout,
// company bold with the role in italics, skills as one centered line.
export default function ClassicSerifTemplate({ data }) {
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
        <div style={styles.contact}>{contact.join("  •  ")}</div>
      </div>

      {summary && (
        <Section title="Summary">
          <p style={styles.summary}>{summary}</p>
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
                  {tech.length > 0 && <span> ({tech.join(", ")})</span>}
                </div>
                <Bullets bullets={p.bullets} />
              </div>
            );
          })}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <p style={styles.skills}>{skills.join(", ")}</p>
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
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionRule} />
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
    padding: "36px 52px",
    fontFamily: '"Times New Roman", Times, serif',
    fontSize: "12px",
    lineHeight: "1.32",
    color: "#000",
    backgroundColor: "#fff",
    wordWrap: "break-word",
    overflowWrap: "break-word",
  },
  header: {
    textAlign: "center",
    marginBottom: "10px",
  },
  name: {
    fontSize: "24px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1px",
    lineHeight: "1.15",
    marginBottom: "3px",
  },
  contact: {
    fontSize: "11.5px",
  },
  section: {
    marginBottom: "11px",
  },
  sectionRule: {
    borderBottom: "1px solid #000",
    marginBottom: "4px",
  },
  title: {
    fontSize: "14px",
    fontWeight: 700,
    textAlign: "center",
    marginBottom: "7px",
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
    fontSize: "12.5px",
    overflowWrap: "break-word",
  },
  right: {
    fontSize: "12px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  italicSub: {
    margin: "1px 0 0 0",
    fontStyle: "italic",
    lineHeight: "1.3",
  },
  ul: {
    margin: "3px 0 0 0",
    paddingLeft: "20px",
  },
  li: {
    marginBottom: "2.5px",
    lineHeight: "1.35",
    overflowWrap: "break-word",
  },
  skills: {
    margin: 0,
    textAlign: "center",
    lineHeight: "1.45",
    overflowWrap: "break-word",
  },
  summary: {
    margin: 0,
    lineHeight: "1.4",
    overflowWrap: "break-word",
  },
};
