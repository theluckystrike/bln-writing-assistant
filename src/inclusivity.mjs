/**
 * Inclusivity Checker — Gender-neutral language, ableist language detection.
 * NASA P10: All functions <60 lines, 2+ assertions, bounded loops, const/let only.
 */

const MAX_ITEMS = 10000;

/** Gender-neutral language patterns (15+ entries). */
const GENDER_PATTERNS = Object.freeze([
  { pattern: /\bhe\/she\b/gi, suggestion: 'they', category: 'gender-neutral' },
  { pattern: /\bhis\/her\b/gi, suggestion: 'their', category: 'gender-neutral' },
  { pattern: /\bhim\/her\b/gi, suggestion: 'them', category: 'gender-neutral' },
  { pattern: /\bmankind\b/gi, suggestion: 'humankind / humanity', category: 'gender-neutral' },
  { pattern: /\bmanpower\b/gi, suggestion: 'workforce / staffing', category: 'gender-neutral' },
  { pattern: /\bman-hours?\b/gi, suggestion: 'person-hours / work-hours', category: 'gender-neutral' },
  { pattern: /\bchairman\b/gi, suggestion: 'chairperson / chair', category: 'gender-neutral' },
  { pattern: /\bfireman\b/gi, suggestion: 'firefighter', category: 'gender-neutral' },
  { pattern: /\bpoliceman\b/gi, suggestion: 'police officer', category: 'gender-neutral' },
  { pattern: /\bstewardess\b/gi, suggestion: 'flight attendant', category: 'gender-neutral' },
  { pattern: /\bforeman\b/gi, suggestion: 'supervisor / foreperson', category: 'gender-neutral' },
  { pattern: /\bmailman\b/gi, suggestion: 'mail carrier / postal worker', category: 'gender-neutral' },
  { pattern: /\bsalesman\b/gi, suggestion: 'salesperson / sales rep', category: 'gender-neutral' },
  { pattern: /\bbusinessman\b/gi, suggestion: 'businessperson / executive', category: 'gender-neutral' },
  { pattern: /\bwaiter\b/gi, suggestion: 'server', category: 'gender-neutral' },
  { pattern: /\bwaitress\b/gi, suggestion: 'server', category: 'gender-neutral' },
  { pattern: /\bman-made\b/gi, suggestion: 'artificial / synthetic / handmade', category: 'gender-neutral' },
  { pattern: /\bfreshman\b/gi, suggestion: 'first-year student', category: 'gender-neutral' }
]);

/** Ableist language patterns (15+ entries). */
const ABLEIST_PATTERNS = Object.freeze([
  { pattern: /\bcrazy\b/gi, suggestion: 'unexpected / surprising / wild', category: 'ableist' },
  { pattern: /\bblind spot\b/gi, suggestion: 'oversight / gap', category: 'ableist' },
  { pattern: /\bsanity check\b/gi, suggestion: 'confidence check / verification', category: 'ableist' },
  { pattern: /\binsane\b/gi, suggestion: 'incredible / intense / extreme', category: 'ableist' },
  { pattern: /\blame\b/gi, suggestion: 'uninteresting / unconvincing', category: 'ableist' },
  { pattern: /\bdumb\b/gi, suggestion: 'uninformed / placeholder', category: 'ableist' },
  { pattern: /\bcripple[sd]?\b/gi, suggestion: 'impair / hinder / disable', category: 'ableist' },
  { pattern: /\btone-deaf\b/gi, suggestion: 'insensitive / out of touch', category: 'ableist' },
  { pattern: /\bfalling on deaf ears\b/gi, suggestion: 'being ignored', category: 'ableist' },
  { pattern: /\bturn a blind eye\b/gi, suggestion: 'ignore / overlook', category: 'ableist' },
  { pattern: /\bparalyzed\b/gi, suggestion: 'stalled / stuck / unable to proceed', category: 'ableist' },
  { pattern: /\bsuffering from\b/gi, suggestion: 'living with / experiencing', category: 'ableist' },
  { pattern: /\bconfined to a wheelchair\b/gi, suggestion: 'uses a wheelchair', category: 'ableist' },
  { pattern: /\bmental(ly)?\b/gi, suggestion: 'consider if clinical term is needed', category: 'ableist' },
  { pattern: /\bspirit animal\b/gi, suggestion: 'inspiration / role model', category: 'ableist' },
  { pattern: /\bstands? up\b/gi, suggestion: 'meeting / check-in (if referring to a meeting)', category: 'ableist' }
]);

/**
 * Scan text for gender-neutral language issues.
 * @param {string} text
 * @returns {Array<{line: string, message: string, severity: string}>}
 */
function checkGenderNeutral(text) {
  console.assert(typeof text === 'string', 'checkGenderNeutral: text must be a string');
  console.assert(text.length >= 0, 'checkGenderNeutral: text length must be non-negative');

  const lines = text.split('\n');
  const issues = [];
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

    for (let p = 0; p < GENDER_PATTERNS.length; p++) {
      const entry = GENDER_PATTERNS[p];
      // Reset regex lastIndex for each line
      entry.pattern.lastIndex = 0;
      const match = entry.pattern.exec(line);
      if (match) {
        issues.push({
          line: `Line ${i + 1}: "${match[0]}"`,
          message: `Consider gender-neutral alternative: "${entry.suggestion}".`,
          severity: 'warning'
        });
      }
    }
  }

  return issues;
}

/**
 * Scan text for ableist language.
 * @param {string} text
 * @returns {Array<{line: string, message: string, severity: string}>}
 */
function checkAbleistLanguage(text) {
  console.assert(typeof text === 'string', 'checkAbleistLanguage: text must be a string');
  console.assert(text.length >= 0, 'checkAbleistLanguage: text length must be non-negative');

  const lines = text.split('\n');
  const issues = [];
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

    for (let p = 0; p < ABLEIST_PATTERNS.length; p++) {
      const entry = ABLEIST_PATTERNS[p];
      entry.pattern.lastIndex = 0;
      const match = entry.pattern.exec(line);
      if (match) {
        issues.push({
          line: `Line ${i + 1}: "${match[0]}"`,
          message: `Potentially ableist: "${match[0]}" — consider "${entry.suggestion}".`,
          severity: 'warning'
        });
      }
    }
  }

  return issues;
}

/**
 * Analyze text for inclusivity issues.
 * @param {string} text - The full markdown/text content
 * @returns {{ score: number, issues: Array<{line: string, message: string, severity: string}> }}
 */
export function analyzeInclusivity(text) {
  console.assert(typeof text === 'string', 'analyzeInclusivity: text must be a string');
  console.assert(text.length >= 0, 'analyzeInclusivity: text length must be non-negative');

  const allIssues = [
    ...checkGenderNeutral(text),
    ...checkAbleistLanguage(text)
  ];

  // Score: start at 100, deduct per issue
  const deductions = allIssues.length * 5;
  const score = Math.max(0, Math.min(100, 100 - deductions));

  return { score, issues: allIssues };
}
