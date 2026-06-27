export default function ATSTemplate({ data }) {
  const basics = data?.basics || {};
  const experience = data?.experience || [];
  const projects = data?.projects || [];
  const education = data?.education || [];
  const skills = data?.skills || [];

  return (
    <div style={styles.page}>
      <Header basics={basics} />

      <Section title="EDUCATION">
        {education.map((e, i) => (
          <EducationEntry key={i} entry={e} />
        ))}
      </Section>

      <Section title="EXPERIENCE">
        {experience.map((e, i) => (
          <Block key={i} item={e} />
        ))}
      </Section>

      <Section title="PROJECTS">
        {projects.map((p, i) => (
          <Block key={i} item={p} />
        ))}
      </Section>

      <Section title="SKILLS">
        <p style={styles.skills}>{skills.join(", ")}</p>
      </Section>
    </div>
  );
}

function Header({ basics }) {
  const contact = [
    basics.email,
    basics.phone,
    basics.links?.github,
    basics.links?.website,
  ].filter(Boolean).join(" | ");

  return (
    <div style={styles.header}>
      <div style={styles.name}>{basics.name || "Your Name"}</div>
      <div style={styles.contact}>{contact}</div>
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

function EducationEntry({ entry }) {
  return (
    <div style={styles.block}>
      <div style={styles.row}>
        <div style={styles.left}><b>{entry.school}</b></div>
        <div style={styles.right}>{entry.date}</div>
      </div>
      {entry.degree && (
        <p style={styles.text}>{entry.degree}</p>
      )}
    </div>
  );
}

function Block({ item }) {
  const tech = item.tech || item.stack || item.languages || [];

  return (
    <div style={styles.block}>
      <div style={styles.row}>
        <div style={styles.left}><b>{item.role || item.name}</b></div>
        <div style={styles.right}>{item.company || (tech.length ? tech.join(", ") : "")}</div>
      </div>
      {/* Render bullets as a proper list so edits appear correctly */}
      {(item.bullets || []).length > 0 && (
        <ul style={styles.ul}>
          {(item.bullets || []).map((b, i) => (
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
    paddingTop: "32px",
    paddingBottom: "32px",
    paddingLeft: "48px",
    paddingRight: "48px",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "11px",
    lineHeight: "1.25",
    color: "#111",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  },
  header: {
    textAlign: "center",
    marginBottom: "14px",
  },
  name: {
    fontSize: "24px",
    fontWeight: "700",
    lineHeight: "1.05",
    marginBottom: "4px",
  },
  contact: {
    fontSize: "10.5px",
    color: "#444",
    lineHeight: "1.25",
  },
  section: {
    marginBottom: "10px",
  },
  title: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "1.2px",
    borderBottom: "1px solid #999",
    paddingBottom: "2px",
    marginBottom: "6px",
  },
  block: {
    marginBottom: "8px",
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
    color: "#444",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  ul: {
    margin: "3px 0 0 0",
    paddingLeft: "18px",
  },
  li: {
    marginBottom: "2px",
    lineHeight: "1.3",
    overflowWrap: "break-word",
  },
  text: {
    marginTop: "3px",
    marginBottom: 0,
    lineHeight: "1.3",
    overflowWrap: "break-word",
  },
  skills: {
    margin: 0,
    fontSize: "10.75px",
    lineHeight: "1.3",
    overflowWrap: "break-word",
  },
};
