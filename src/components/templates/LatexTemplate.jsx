// Modeled on the LaTeX (Computer Modern) engineering resume: large centered
// serif name, pipe-separated contact line, small-caps section headers over
// thin rules, role bold with dates right and the company in italics beneath.
export default function LatexTemplate({ data }) {
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
        <div style={styles.contact}>{contact.join(" | ")}</div>
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
                <div style={styles.left}><b>{e.role || e.company}</b></div>
                <div style={styles.right}>{e.date}</div>
              </div>
              {e.role && e.company && <p style={styles.italicSub}>{e.company}</p>}
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
                    <span> | <i>{tech.join(", ")}</i></span>
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
    padding: "38px 50px",
    fontFamily: 'Cambria, "Times New Roman", Georgia, serif',
    fontSize: "12px",
    lineHeight: "1.33",
    color: "#000",
    backgroundColor: "#fff",
    wordWrap: "break-word",
    overflowWrap: "break-word",
  },
  header: {
    textAlign: "center",
    marginBottom: "12px",
  },
  name: {
    fontSize: "29px",
    fontWeight: 400,
    lineHeight: "1.1",
    marginBottom: "4px",
  },
  contact: {
    fontSize: "11.5px",
  },
  section: {
    marginBottom: "11px",
  },
  title: {
    fontSize: "13px",
    fontWeight: 700,
    fontVariant: "small-caps",
    letterSpacing: "0.5px",
    borderBottom: "1px solid #000",
    paddingBottom: "1px",
    marginBottom: "6px",
  },
  entry: {
    marginBottom: "8px",
    paddingLeft: "8px",
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
    fontWeight: 600,
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
    paddingLeft: "18px",
  },
  li: {
    marginBottom: "2.5px",
    lineHeight: "1.35",
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
