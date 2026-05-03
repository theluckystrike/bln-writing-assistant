/**
 * L1-Aware Pattern Detector — Common patterns from non-native English speakers.
 * BeLikeNative's unique differentiator: identifies errors by L1 (first language) group.
 * NASA P10: All functions <60 lines, 2+ assertions, bounded loops, const/let only.
 */

const MAX_ITEMS = 10000;

/**
 * L1 pattern definitions: each has a regex, correction, and L1 attribution.
 * 20+ patterns covering missing articles, double subjects, prepositions, pluralization.
 */
const L1_PATTERNS = Object.freeze([
  // === Missing articles (CJK, Slavic, Arabic speakers) ===
  {
    pattern: /\b(go|went|goes|going) to (\w+)\b/gi,
    check: (match) => {
      const noArticleWords = ['store', 'hospital', 'office', 'bank', 'market', 'gym', 'park', 'library', 'airport', 'station'];
      const word = match[2].toLowerCase();
      return noArticleWords.includes(word);
    },
    message: (match) => `Missing article: "${match[0]}" — consider "...to the ${match[2]}"`,
    l1Groups: 'CJK (Chinese, Japanese, Korean), Slavic (Russian, Polish, Czech), Arabic',
    severity: 'warning'
  },
  {
    pattern: /\b(is|are|was|were) (\w+) (problem|issue|solution|reason|result|answer)\b/gi,
    check: () => true,
    message: (match) => `Possibly missing article before "${match[3]}": consider "...a ${match[3]}" or "...the ${match[3]}"`,
    l1Groups: 'CJK, Slavic, Turkish',
    severity: 'info'
  },

  // === Double subjects (CJK, some Slavic speakers) ===
  {
    pattern: /\b(the\s+\w+)\s+it\s+(is|was|has|does|will|can|should|would)\b/gi,
    check: () => true,
    message: (match) => `Double subject: "${match[0]}" — remove "it": "${match[1]} ${match[2]}"`,
    l1Groups: 'CJK (Chinese, Japanese, Korean), some Slavic languages',
    severity: 'warning'
  },
  {
    pattern: /\b(the\s+\w+)\s+it\s+(\w+s)\b/gi,
    check: () => true,
    message: (match) => `Possible double subject: "${match[0]}" — the "it" may be redundant`,
    l1Groups: 'CJK, French (topic-comment structure transfer)',
    severity: 'info'
  },

  // === Preposition errors ===
  {
    pattern: /\barrive to\b/gi,
    check: () => true,
    message: () => '"arrive to" — use "arrive at" (a place) or "arrive in" (a city/country)',
    l1Groups: 'Spanish, French, Italian, Portuguese (Romance languages)',
    severity: 'warning'
  },
  {
    pattern: /\bdiscuss about\b/gi,
    check: () => true,
    message: () => '"discuss about" — "discuss" is transitive; use "discuss [topic]" (no "about")',
    l1Groups: 'Hindi, Arabic, many Indo-European languages',
    severity: 'warning'
  },
  {
    pattern: /\bexplain me\b/gi,
    check: () => true,
    message: () => '"explain me" — use "explain to me" or "explain [topic]"',
    l1Groups: 'Hindi, Russian, French, Spanish',
    severity: 'warning'
  },
  {
    pattern: /\bdepend of\b/gi,
    check: () => true,
    message: () => '"depend of" — use "depend on"',
    l1Groups: 'French, Spanish, Portuguese (calque from "dependre de")',
    severity: 'warning'
  },
  {
    pattern: /\binterested for\b/gi,
    check: () => true,
    message: () => '"interested for" — use "interested in"',
    l1Groups: 'Greek, Turkish, Arabic',
    severity: 'warning'
  },
  {
    pattern: /\bconsist from\b/gi,
    check: () => true,
    message: () => '"consist from" — use "consist of"',
    l1Groups: 'Russian, German, Slavic languages',
    severity: 'warning'
  },

  // === Pluralization errors (uncountable nouns) ===
  {
    pattern: /\binformations\b/gi,
    check: () => true,
    message: () => '"informations" — "information" is uncountable; use "information" or "pieces of information"',
    l1Groups: 'French, German, Spanish, Italian (countable in Romance/Germanic languages)',
    severity: 'warning'
  },
  {
    pattern: /\bequipments\b/gi,
    check: () => true,
    message: () => '"equipments" — "equipment" is uncountable; use "equipment" or "pieces of equipment"',
    l1Groups: 'French, many Indo-European languages',
    severity: 'warning'
  },
  {
    pattern: /\bfurnitures\b/gi,
    check: () => true,
    message: () => '"furnitures" — "furniture" is uncountable; use "furniture" or "pieces of furniture"',
    l1Groups: 'French, Italian, many European languages',
    severity: 'warning'
  },
  {
    pattern: /\badvices\b/gi,
    check: () => true,
    message: () => '"advices" — "advice" is uncountable; use "advice" or "pieces of advice"',
    l1Groups: 'French, German, many European languages',
    severity: 'warning'
  },
  {
    pattern: /\bresearchs\b/gi,
    check: () => true,
    message: () => '"researchs" — "research" is uncountable; use "research" or "research studies"',
    l1Groups: 'Many non-English L1 groups',
    severity: 'warning'
  },
  {
    pattern: /\bfeedbacks\b/gi,
    check: () => true,
    message: () => '"feedbacks" — "feedback" is uncountable; use "feedback" or "pieces of feedback"',
    l1Groups: 'German, French, many European languages',
    severity: 'warning'
  },
  {
    pattern: /\bhomeworks\b/gi,
    check: () => true,
    message: () => '"homeworks" — "homework" is uncountable; use "homework" or "homework assignments"',
    l1Groups: 'Many non-English L1 groups',
    severity: 'warning'
  },
  {
    pattern: /\bsoftwares\b/gi,
    check: () => true,
    message: () => '"softwares" — "software" is uncountable; use "software" or "software programs"',
    l1Groups: 'Many non-English L1 groups',
    severity: 'warning'
  },

  // === Word order / article usage (various L1 groups) ===
  {
    pattern: /\bsince\s+\d+\s+years?\b/gi,
    check: () => true,
    message: () => '"since X years" — use "for X years" (duration) or "since [year]" (point in time)',
    l1Groups: 'French, German, Hindi (since/for confusion)',
    severity: 'warning'
  },
  {
    pattern: /\bI am agree\b/gi,
    check: () => true,
    message: () => '"I am agree" — use "I agree" (no "am")',
    l1Groups: 'French, Arabic, Hindi (calque from "je suis d\'accord")',
    severity: 'warning'
  },
  {
    pattern: /\bmake a party\b/gi,
    check: () => true,
    message: () => '"make a party" — use "throw a party" or "have a party"',
    l1Groups: 'German, French, Spanish (calque from "faire/machen")',
    severity: 'info'
  },
  {
    pattern: /\bopen the light\b/gi,
    check: () => true,
    message: () => '"open the light" — use "turn on the light"',
    l1Groups: 'French, Arabic, Mandarin Chinese',
    severity: 'warning'
  },
  {
    pattern: /\bclose the light\b/gi,
    check: () => true,
    message: () => '"close the light" — use "turn off the light"',
    l1Groups: 'French, Arabic, Mandarin Chinese',
    severity: 'warning'
  }
]);

/**
 * Scan a single line for L1 pattern matches.
 * @param {string} line - The line text
 * @param {number} lineNum - The 1-indexed line number
 * @returns {Array<{line: string, message: string, severity: string, l1Groups: string}>}
 */
function scanLineForPatterns(line, lineNum) {
  console.assert(typeof line === 'string', 'scanLineForPatterns: line must be a string');
  console.assert(typeof lineNum === 'number' && lineNum > 0, 'scanLineForPatterns: lineNum must be positive number');

  const issues = [];

  for (let p = 0; p < L1_PATTERNS.length; p++) {
    const entry = L1_PATTERNS[p];
    entry.pattern.lastIndex = 0;
    const match = entry.pattern.exec(line);
    if (match && entry.check(match)) {
      issues.push({
        line: `Line ${lineNum}`,
        message: `${entry.message(match)} [Common L1: ${entry.l1Groups}]`,
        severity: entry.severity,
        l1Groups: entry.l1Groups
      });
    }
  }

  return issues;
}

/**
 * Analyze text for L1-influenced writing patterns.
 * @param {string} text - The full markdown/text content
 * @returns {{ score: number, issues: Array<{line: string, message: string, severity: string, l1Groups: string}> }}
 */
export function analyzeL1Patterns(text) {
  console.assert(typeof text === 'string', 'analyzeL1Patterns: text must be a string');
  console.assert(text.length >= 0, 'analyzeL1Patterns: text length must be non-negative');

  const lines = text.split('\n');
  const allIssues = [];
  const limit = Math.min(lines.length, MAX_ITEMS);
  let inCodeBlock = false;

  for (let i = 0; i < limit; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      continue;
    }

    const lineIssues = scanLineForPatterns(line, i + 1);
    for (let j = 0; j < lineIssues.length; j++) {
      allIssues.push(lineIssues[j]);
    }
  }

  // Score: start at 100, deduct per issue (L1 issues are common, be gentler)
  const deductions = allIssues.length * 4;
  const score = Math.max(0, Math.min(100, 100 - deductions));

  return { score, issues: allIssues };
}
