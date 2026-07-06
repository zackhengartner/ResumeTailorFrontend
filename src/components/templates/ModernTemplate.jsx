const ACCENT = "#0f766e";

export default function ModernTemplate({ data }) {
  const basics = data?.basics || {};
  const experience = data?.experience || [];
  const projects = data?.projects || [];
  const education = data?.education || [];
  const skills = data?.skills || [];
  const summary = (data?.summary || "").trim();

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.name}>{basics.name || "Your Name"}</div>
      </div>

      <div style={styles.body}>
        <div style={styles.main}>
          {summary && (
            <MainSection title="Summary">
              <p style={styles.summary}>{summary}</p>
            </MainSection>
          )}

          {experience.length > 0 && (
            <MainSection title="Experience">
              {experience.map((e, i) => (
                <Entry key={i} heading={e.role} sub={e.company} bullets={e.bullets} />
              ))}
            </MainSection>
          )}

          {projects.length > 0 && (
            <MainSection title="Projects">
              {projects.map((p, i) => (
                <Entry
                  key={i}
                  heading={p.name}
                  sub={(p.tech || p.stack || p.languages || []).join(" · ")}
                  bullets={p.bullets}
                />
              ))}
            </MainSection>
          )}
        </div>

        <div style={styles.sidebar}>
          <SideSection title="Contact">
            {[basics.email, basics.phone, basics.links?.github, basics.links?.website]
              .filter(Boolean)
              .map((c, i) => (
                <div key={i} style={styles.sideItem}>{c}</div>
              ))}
          </SideSection>

          {education.length > 0 && (
            <SideSection title="Education">
              {education.map((e, i) => (
                <div key={i} style={styles.sideBlock}>
                  <div style={styles.sideBold}>{e.school}</div>
                  {e.degree && <div style={styles.sideItem}>{e.degree}</div>}
                  {e.date && <div style={styles.sideMuted}>{e.date}</div>}
                </div>
              ))}
            </SideSection>
          )}

          {skills.length > 0 && (
            <SideSection title="Skills">
              {skills.map((s, i) => (
                <div key={i} style={styles.sideItem}>{s}</div>
              ))}
            </SideSection>
          )}
        </div>
      </div>
    </div>
  );
}

function MainSection({ title, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function SideSection({ title, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sideTitle}>{title}</div>
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
    display: "flex",
    flexDirection: "column",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "11.5px",
    lineHeight: "1.3",
    color: "#1f2937",
    backgroundColor: "#fff",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  },
  header: {
    padding: "30px 40px 18px 40px",
    borderBottom: `3px solid ${ACCENT}`,
  },
  name: {
    fontSize: "27px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    lineHeight: "1.05",
    color: "#111827",
  },
  body: {
    flex: 1,
    display: "flex",
    alignItems: "stretch",
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: "20px 24px 32px 40px",
  },
  sidebar: {
    width: "224px",
    flexShrink: 0,
    boxSizing: "border-box",
    padding: "20px 24px 32px 24px",
    backgroundColor: "#f0f5f4",
  },
  section: {
    marginBottom: "14px",
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    color: ACCENT,
    borderBottom: "1px solid #d1d5db",
    paddingBottom: "3px",
    marginBottom: "8px",
  },
  sideTitle: {
    fontSize: "10.5px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    color: ACCENT,
    marginBottom: "6px",
  },
  entry: {
    marginBottom: "10px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    width: "100%",
  },
  left: {
    flex: 1,
    minWidth: 0,
    overflowWrap: "break-word",
  },
  right: {
    textAlign: "right",
    color: "#4b5563",
    fontSize: "10.5px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  ul: {
    margin: "4px 0 0 0",
    paddingLeft: "16px",
  },
  li: {
    marginBottom: "2.5px",
    lineHeight: "1.32",
    overflowWrap: "break-word",
  },
  sideBlock: {
    marginBottom: "7px",
  },
  sideBold: {
    fontWeight: "700",
    fontSize: "10.75px",
    lineHeight: "1.3",
  },
  sideItem: {
    fontSize: "10.5px",
    lineHeight: "1.4",
    marginBottom: "2px",
    overflowWrap: "break-word",
  },
  sideMuted: {
    fontSize: "10px",
    color: "#6b7280",
    lineHeight: "1.3",
  },
  summary: {
    margin: 0,
    fontSize: "11px",
    lineHeight: "1.4",
    overflowWrap: "break-word",
  },
};
