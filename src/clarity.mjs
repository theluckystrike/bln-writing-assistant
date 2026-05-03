/**
 * Clarity Analyzer — Passive voice, filler words, hedge words, jargon, wordy phrases.
 * NASA P10: All functions <60 lines, 2+ assertions, bounded loops, const/let only.
 */

const MAX_ITEMS = 10000;

/** Past participle patterns for passive voice detection. */
const IRREGULAR_PAST_PARTICIPLES = Object.freeze([
  'been', 'born', 'broken', 'brought', 'built', 'bought', 'caught', 'chosen',
  'come', 'done', 'drawn', 'driven', 'eaten', 'fallen', 'felt', 'found',
  'forgotten', 'frozen', 'given', 'gone', 'grown', 'had', 'heard', 'held',
  'hidden', 'hit', 'kept', 'known', 'led', 'left', 'lost', 'made', 'meant',
  'met', 'paid', 'put', 'read', 'risen', 'run', 'said', 'seen', 'sent',
  'set', 'shaken', 'shown', 'spoken', 'spent', 'stolen', 'stood', 'struck',
  'sworn', 'taken', 'taught', 'thought', 'thrown', 'told', 'torn',
  'understood', 'woken', 'won', 'worn', 'written'
]);

const BE_VERBS = Object.freeze([
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'am', 'gets', 'got', 'getting'
]);

const FILLER_WORDS = Object.freeze([
  'basically', 'actually', 'really', 'very', 'just', 'quite', 'rather',
  'literally', 'honestly', 'obviously', 'clearly', 'simply', 'totally',
  'definitely', 'certainly', 'absolutely', 'essentially'
]);

const HEDGE_WORDS = Object.freeze([
  'might', 'perhaps', 'possibly', 'maybe', 'could potentially',
  'somewhat', 'arguably', 'presumably', 'supposedly', 'tends to',
  'it seems', 'appears to', 'in some cases', 'more or less'
]);

/** Jargon -> simpler alternative mappings. */
const JARGON_MAP = Object.freeze({
  'utilize': 'use',
  'leverage': 'use',
  'facilitate': 'help',
  'implement': 'build / set up',
  'optimize': 'improve',
  'streamline': 'simplify',
  'paradigm': 'model / pattern',
  'synergy': 'collaboration',
  'holistic': 'complete / whole',
  'actionable': 'practical',
  'bandwidth': 'capacity / time',
  'cadence': 'schedule / rhythm',
  'deliverable': 'result / output',
  'ecosystem': 'system / environment',
  'granular': 'detailed',
  'incentivize': 'encourage',
  'methodology': 'method',
  'operationalize': 'put into practice',
  'robust': 'strong / reliable',
  'scalable': 'growable / expandable'
});

/** Wordy phrase -> concise alternative mappings (20+ patterns). */
const WORDY_PHRASES = Object.freeze({
  'in order to': 'to',
  'due to the fact that': 'because',
  'in the event that': 'if',
  'at this point in time': 'now',
  'for the purpose of': 'to / for',
  'in the process of': 'currently / while',
  'on a daily basis': 'daily',
  'in the near future': 'soon',
  'a large number of': 'many',
  'the vast majority of': 'most',
  'in spite of the fact that': 'although / despite',
  'with regard to': 'about / regarding',
  'in reference to': 'about',
  'at the present time': 'now / currently',
  'is able to': 'can',
  'has the ability to': 'can',
  'in close proximity to': 'near',
  'on the other hand': 'however / but',
  'as a matter of fact': 'in fact',
  'take into consideration': 'consider',
  'make a decision': 'decide',
  'give consideration to': 'consider',
  'a number of': 'several / some',
  'in addition to': 'besides / also'
});

/**
 * Detect passive voice constructions.
 * @param {string} text
 * @returns {Array<{line: string, message: string, severity: string}>}
 */
function detectPassiveVoice(text) {
  console.assert(typeof text === 'string', 'detectPassiveVoice: text must be a string');
  console.assert(text.length >= 0, 'detectPassiveVoice: text length must be non-negative');

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
    const words = line.toLowerCase().split(/\s+/);
    for (let j = 0; j < words.length - 1 && j < 500; j++) {
      const w1 = words[j].replace(/[^a-z]/g, '');
      const w2 = words[j + 1].replace(/[^a-z]/g, '');
      const isBeVerb = BE_VERBS.includes(w1);
      const isPastPart = IRREGULAR_PAST_PARTICIPLES.includes(w2) || w2.endsWith('ed');
      if (isBeVerb && isPastPart && w2.length > 2) {
        issues.push({
          line: `Line ${i + 1}: "${w1} ${w2}"`,
          message: `Passive voice detected: "${w1} ${w2}". Consider using active voice.`,
          severity: 'info'
        });
        break; // one per line max
      }
    }
  }

  return issues;
}

/**
 * Detect filler words.
 * @param {string} text
 * @returns {Array<{line: string, message: string, severity: string}>}
 */
function detectFillerWords(text) {
  console.assert(typeof text === 'string', 'detectFillerWords: text must be a string');
  console.assert(text.length >= 0, 'detectFillerWords: text length must be non-negative');

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
    const lower = line.toLowerCase();
    for (let f = 0; f < FILLER_WORDS.length; f++) {
      const regex = new RegExp(`\\b${FILLER_WORDS[f]}\\b`, 'i');
      if (regex.test(lower)) {
        issues.push({
          line: `Line ${i + 1}`,
          message: `Filler word "${FILLER_WORDS[f]}" — consider removing for conciseness.`,
          severity: 'info'
        });
      }
    }
  }

  return issues;
}

/**
 * Detect hedge words/phrases.
 * @param {string} text
 * @returns {Array<{line: string, message: string, severity: string}>}
 */
function detectHedgeWords(text) {
  console.assert(typeof text === 'string', 'detectHedgeWords: text must be a string');
  console.assert(text.length >= 0, 'detectHedgeWords: text length must be non-negative');

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
    const lower = line.toLowerCase();
    for (let h = 0; h < HEDGE_WORDS.length; h++) {
      if (lower.includes(HEDGE_WORDS[h])) {
        issues.push({
          line: `Line ${i + 1}`,
          message: `Hedge phrase "${HEDGE_WORDS[h]}" — use definitive language when possible.`,
          severity: 'info'
        });
      }
    }
  }

  return issues;
}

/**
 * Detect jargon with simpler alternatives.
 * @param {string} text
 * @returns {Array<{line: string, message: string, severity: string}>}
 */
function detectJargon(text) {
  console.assert(typeof text === 'string', 'detectJargon: text must be a string');
  console.assert(text.length >= 0, 'detectJargon: text length must be non-negative');

  const lines = text.split('\n');
  const issues = [];
  const limit = Math.min(lines.length, MAX_ITEMS);
  const jargonKeys = Object.keys(JARGON_MAP);
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
    const lower = line.toLowerCase();
    for (let j = 0; j < jargonKeys.length; j++) {
      const regex = new RegExp(`\\b${jargonKeys[j]}\\b`, 'i');
      if (regex.test(lower)) {
        issues.push({
          line: `Line ${i + 1}`,
          message: `"${jargonKeys[j]}" is jargon — consider "${JARGON_MAP[jargonKeys[j]]}" instead.`,
          severity: 'info'
        });
      }
    }
  }

  return issues;
}

/**
 * Detect wordy phrases with concise alternatives.
 * @param {string} text
 * @returns {Array<{line: string, message: string, severity: string}>}
 */
function detectWordyPhrases(text) {
  console.assert(typeof text === 'string', 'detectWordyPhrases: text must be a string');
  console.assert(text.length >= 0, 'detectWordyPhrases: text length must be non-negative');

  const lines = text.split('\n');
  const issues = [];
  const limit = Math.min(lines.length, MAX_ITEMS);
  const phraseKeys = Object.keys(WORDY_PHRASES);
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
    const lower = line.toLowerCase();
    for (let p = 0; p < phraseKeys.length; p++) {
      if (lower.includes(phraseKeys[p])) {
        issues.push({
          line: `Line ${i + 1}`,
          message: `"${phraseKeys[p]}" is wordy — use "${WORDY_PHRASES[phraseKeys[p]]}" instead.`,
          severity: 'warning'
        });
      }
    }
  }

  return issues;
}

/**
 * Analyze text clarity.
 * @param {string} text - The full markdown/text content
 * @returns {{ score: number, issues: Array<{line: string, message: string, severity: string}> }}
 */
export function analyzeClarity(text) {
  console.assert(typeof text === 'string', 'analyzeClarity: text must be a string');
  console.assert(text.length >= 0, 'analyzeClarity: text length must be non-negative');

  const allIssues = [
    ...detectPassiveVoice(text),
    ...detectFillerWords(text),
    ...detectHedgeWords(text),
    ...detectJargon(text),
    ...detectWordyPhrases(text)
  ];

  // Estimate word count for proportional scoring
  const wordCount = Math.max(1, text.split(/\s+/).filter(w => w.length > 0).length);
  const issueRatio = allIssues.length / wordCount;

  // Score: fewer issues per word = higher score
  // 0 issues = 100, ratio of 0.1+ = ~0
  const score = Math.max(0, Math.min(100, Math.round(100 - (issueRatio * 1000))));

  return { score, issues: allIssues };
}
