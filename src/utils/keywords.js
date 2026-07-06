// Client-side keyword extraction from a job description, plus coverage
// matching against the current resume content. Mirrors the first pass an ATS
// does: exact keyword presence.

const STOPWORDS = new Set([
  // generic english
  "a", "an", "and", "are", "as", "at", "be", "been", "being", "but", "by",
  "can", "could", "do", "does", "for", "from", "had", "has", "have", "if",
  "in", "into", "is", "it", "its", "may", "more", "most", "must", "not",
  "of", "on", "or", "our", "should", "so", "such", "than", "that", "the",
  "their", "them", "then", "there", "these", "they", "this", "those", "to",
  "us", "was", "we", "were", "what", "when", "where", "which", "while",
  "who", "will", "with", "would", "you", "your", "all", "also", "any",
  "each", "how", "other", "some", "up", "out", "about", "across", "after",
  "both", "through", "during", "including", "per", "via", "within", "well",
  // job-posting boilerplate
  "ability", "able", "applicants", "application", "applications", "apply",
  "benefits", "best", "bonus", "candidate", "candidates", "career", "company",
  "compensation", "culture", "day", "days", "degree", "description",
  "employee", "employees", "employer", "employment", "equal", "equivalent",
  "etc", "excellent", "experience", "experienced", "familiar", "familiarity",
  "field", "full", "help", "highly", "hire", "hiring", "ideal", "impact",
  "individual", "job", "join", "knowledge", "level", "like", "looking",
  "member", "minimum", "mission", "new", "one", "opportunity", "opportunities",
  "part", "passion", "passionate", "plus", "position", "preferred", "proven",
  "qualifications", "qualified", "related", "required", "requirements",
  "responsibilities", "responsible", "role", "salary", "seeking", "skill",
  "skills", "solid", "strong", "team", "teams", "time", "understanding",
  "using", "work", "working", "world", "years", "you'll", "must-have",
  "nice", "great", "good", "many", "make", "makes", "made", "get", "use",
  "used", "need", "needs", "needed", "want", "wants", "way", "ways",
  "build", "building", "develop", "developing", "create", "creating",
  "collaborate", "collaboration", "feature", "features", "certification",
  "certifications", "tools", "technologies", "environment", "office",
]);

// Multi-word tech phrases worth catching as a unit when present in the JD.
const KNOWN_PHRASES = [
  "machine learning", "deep learning", "natural language processing",
  "computer vision", "data science", "data engineering", "data analysis",
  "software engineering", "software development", "web development",
  "front end", "back end", "full stack", "unit testing", "integration testing",
  "test driven development", "continuous integration", "continuous deployment",
  "version control", "cloud computing", "distributed systems",
  "microservices architecture", "rest api", "rest apis", "restful apis",
  "object oriented", "agile development", "project management",
  "product management", "problem solving", "code review", "code reviews",
  "system design", "user experience", "user interface", "open source",
  "software engineer", "software developer", "web developer",
  "data scientist", "data analyst", "data engineer", "product manager",
];

const tokenPattern = /[a-zA-Z][a-zA-Z0-9+#./-]*[a-zA-Z0-9+#]|[a-zA-Z]/g;

/**
 * Extract the most relevant keywords from a job description.
 * Returns up to `limit` terms ordered by frequency, then first appearance.
 */
export function extractKeywords(jobDescription, limit = 24) {
  if (!jobDescription) return [];
  const text = jobDescription.toLowerCase();

  const counts = new Map(); // term -> { count, firstIndex, display }

  const bump = (term, index, display) => {
    const existing = counts.get(term);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(term, { count: 1, firstIndex: index, display });
    }
  };

  for (const phrase of KNOWN_PHRASES) {
    let idx = text.indexOf(phrase);
    while (idx !== -1) {
      bump(phrase, idx, phrase);
      idx = text.indexOf(phrase, idx + phrase.length);
    }
  }

  let match;
  while ((match = tokenPattern.exec(text)) !== null) {
    const word = match[0].replace(/^[./-]+|[./-]+$/g, "");
    if (word.length < 2 || STOPWORDS.has(word)) continue;
    // Skip plain numbers and single letters that aren't languages
    if (word.length === 1 && !["c", "r"].includes(word)) continue;
    // Skip words already counted as part of a known phrase at this position
    bump(word, match.index, word);
  }

  const ranked = [...counts.entries()]
    .filter(([, v]) => v.count >= 1)
    .sort((a, b) => b[1].count - a[1].count || a[1].firstIndex - b[1].firstIndex)
    .slice(0, limit)
    .map(([term]) => term);

  // Drop single words that are subsumed by a kept phrase ("machine" vs
  // "machine learning") so the list isn't redundant.
  const phrases = ranked.filter((t) => t.includes(" "));
  const deduped = ranked.filter(
    (t) => t.includes(" ") || !phrases.some((p) => p.split(" ").includes(t))
  );

  // Collapse plural/singular pairs ("rest apis" vs "rest api")
  const set = new Set(deduped);
  return deduped.filter((t) => !(t.endsWith("s") && set.has(t.slice(0, -1))));
}

/** Serialize the merged resume model into one searchable lowercase string. */
export function resumeToSearchText(data) {
  const parts = [];
  const { basics = {}, education = [], experience = [], projects = [], skills = [], summary = "" } = data || {};
  parts.push(basics.name, basics.email, summary);
  for (const e of education) parts.push(e.school, e.degree);
  for (const e of experience) {
    parts.push(e.role, e.company, ...(e.bullets || []));
  }
  for (const p of projects) {
    parts.push(p.name, ...(p.tech || []), ...(p.bullets || []));
  }
  parts.push(...skills);
  return parts.filter(Boolean).join("\n").toLowerCase();
}

const ACRONYMS = new Set([
  "aws", "gcp", "sql", "nosql", "api", "apis", "rest", "css", "html", "php",
  "ios", "ui", "ux", "qa", "ml", "ai", "nlp", "etl", "sdk", "cli", "crm",
  "erp", "seo", "k8s", "ci/cd", "http", "json", "xml", "npm", "git",
]);

/** Format an extracted (lowercase) keyword for display as a skill chip. */
export function formatKeywordAsSkill(keyword) {
  return keyword
    .split(" ")
    .map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Whether a keyword appears in the resume text (word-boundary aware, plural-tolerant). */
export function keywordInText(keyword, searchText) {
  if (!searchText) return false;
  const base = keyword.toLowerCase();
  const forms = [base];
  // Also try the singular form, but only when it stays long enough that
  // stripping the "s" can't create false matches ("css" must not become "cs").
  if (base.endsWith("s") && base.length > 4) forms.push(base.slice(0, -1));
  const alternatives = forms.map(escapeRegExp).join("|");
  const pattern = new RegExp(
    `(^|[^a-z0-9])(${alternatives})(e?s)?($|[^a-z0-9])`,
    "i"
  );
  return pattern.test(searchText);
}

/** Full coverage report: [{ keyword, covered }], plus percentage. */
export function keywordCoverage(jobDescription, resumeData) {
  const keywords = extractKeywords(jobDescription);
  const searchText = resumeToSearchText(resumeData);
  const items = keywords.map((keyword) => ({
    keyword,
    covered: keywordInText(keyword, searchText),
  }));
  const coveredCount = items.filter((i) => i.covered).length;
  return {
    items,
    percent: items.length ? Math.round((coveredCount / items.length) * 100) : 0,
  };
}
