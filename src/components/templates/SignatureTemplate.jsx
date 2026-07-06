// Modeled on Zack's main resume: serif name + section headings over thin
// rules, sans-serif body, three-column bulleted skills.
export default function SignatureTemplate({ data }) {
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
          {education.map((e, i) => (
            <div key={i} style={styles.entry}>
              <div style={styles.row}>
                <div style={styles.left}><b>{e.school}</b></div>
                <div style={styles.right}>{e.date}</div>
              </div>
              {e.degree && <p style={styles.sub}>{e.degree}</p>}
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <SkillColumns skills={skills} />
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Projects">
          {projects.map((p, i) => (
            <Entry
              key={i}
              heading={
                (p.tech || p.stack || p.languages || []).length > 0
                  ? `${p.name} | ${(p.tech || p.stack || p.languages).join(", ")}`
                  : p.name
              }
              bullets={p.bullets}
            />
          ))}
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="Professional Experience">
          {experience.map((e, i) => (
            <Entry
              key={i}
              heading={e.role}
              date={e.date}
              sub={e.company}
              bullets={e.bullets}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Header({ basics }) {
  const contact = [
    basics.phone,
    basics.email,
    basics.links?.website,
    basics.links?.github,
  ].filter(Boolean);

  return (
    <div style={styles.header}>
      <div style={styles.name}>{basics.name || "Your Name"}</div>
      <div style={styles.headerRule} />
      <div style={styles.contact}>
        {contact.map((c, i) => (
          <span key={i}>
            {i > 0 && <span style={styles.dot}>•</span>}
            {c}
          </span>
        ))}
      </div>
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

function Entry({ heading, date, sub, bullets }) {
  return (
    <div style={styles.entry}>
      <div style={styles.row}>
        <div style={styles.left}><b>{heading}</b></div>
        {date && <div style={styles.right}>{date}</div>}
      </div>
      {sub && <p style={styles.sub}>{sub}</p>}
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

// The real resume groups skills under three bold category headers; the data
// model only has a flat list, so balance it across three bulleted columns.
function SkillColumns({ skills }) {
  const cols = [[], [], []];
  const per = Math.ceil(skills.length / 3);
  skills.forEach((s, i) => cols[Math.min(Math.floor(i / per), 2)].push(s));

  return (
    <div style={styles.skillCols}>
      {cols.filter((c) => c.length > 0).map((col, ci) => (
        <ul key={ci} style={styles.skillUl}>
          {col.map((s, si) => (
            <li key={si} style={styles.li}>{s}</li>
          ))}
        </ul>
      ))}
    </div>
  );
}

const styles = {
  page: {
    width: "816px",
    minHeight: "1056px",
    boxSizing: "border-box",
    padding: "40px 40px",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "10.5px",
    lineHeight: "1.35",
    color: "#1a1a1a",
    backgroundColor: "#fff",
    wordWrap: "break-word",
    overflowWrap: "break-word",
  },
  header: {
    marginBottom: "10px",
  },
  name: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "30px",
    fontWeight: 400,
    lineHeight: "1.1",
    marginBottom: "8px",
  },
  headerRule: {
    borderBottom: "2.5px solid #1a1a1a",
    marginBottom: "7px",
  },
  contact: {
    fontSize: "10.5px",
    color: "#1a1a1a",
  },
  dot: {
    margin: "0 12px",
    color: "#555",
  },
  section: {
    marginBottom: "12px",
  },
  title: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "15px",
    fontWeight: 400,
    borderBottom: "1px solid #c9c9c9",
    paddingBottom: "3px",
    marginBottom: "8px",
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
    fontWeight: 700,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  sub: {
    margin: "1px 0 0 0",
    color: "#333",
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
  skillCols: {
    display: "flex",
    gap: "24px",
  },
  skillUl: {
    flex: 1,
    margin: 0,
    paddingLeft: "18px",
  },
  summary: {
    margin: 0,
    lineHeight: "1.4",
    overflowWrap: "break-word",
  },
};
