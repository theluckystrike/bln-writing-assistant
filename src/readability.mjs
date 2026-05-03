/**
 * Readability Analyzer — Flesch-Kincaid metrics, sentence/paragraph analysis.
 * NASA P10: All functions <60 lines, 2+ assertions, bounded loops, const/let only.
 */

const MAX_SENTENCE_WORDS = 25;
const MAX_PARAGRAPH_WORDS = 150;
const MAX_ITEMS = 50000;

/**
 * Count syllables in a single word using regex heuristics.
 * @param {string} word
 * @returns {number}
 */
function countSyllables(word) {
  console.assert(typeof word === 'string', 'countSyllables: word must be a string');
  console.assert(word.length >= 0, 'countSyllables: word length must be non-negative');

  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length === 0) {
    return 0;
  }
  if (cleaned.length <= 3) {
    return 1;
  }

  let count = 0;
  const vowels = 'aeiouy';
  let prevVowel = false;

  for (let i = 0; i < cleaned.length && i < 100; i++) {
    const isVowel = vowels.includes(cleaned[i]);
    if (isVowel && !prevVowel) {
      count++;
    }
    prevVowel = isVowel;
  }

  // Silent e at end
  if (cleaned.endsWith('e') && count > 1) {
    count--;
  }
  // -le ending adds syllable
  if (cleaned.endsWith('le') && cleaned.length > 2 && !vowels.includes(cleaned[cleaned.length - 3])) {
    count++;
  }

  return Math.max(1, count);
}

/**
 * Split text into sentences using punctuation boundaries.
 * @param {string} text
 * @returns {string[]}
 */
function splitSentences(text) {
  console.assert(typeof text === 'string', 'splitSentences: text must be a string');
  console.assert(text.length >= 0, 'splitSentences: text length must be non-negative');

  const raw = text
    .replace(/^#+\s+.*/gm, '')    // remove headings
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/`[^`]*`/g, '')       // remove inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')  // remove images
    .trim();

  if (raw.length === 0) {
    return [];
  }

  const sentences = raw.split(/(?<=[.!?])\s+/);
  const result = [];
  const limit = Math.min(sentences.length, MAX_ITEMS);
  for (let i = 0; i < limit; i++) {
    const s = sentences[i].trim();
    if (s.length > 0) {
      result.push(s);
    }
  }
  return result;
}

/**
 * Split text into paragraphs (double newline separated).
 * @param {string} text
 * @returns {string[]}
 */
function splitParagraphs(text) {
  console.assert(typeof text === 'string', 'splitParagraphs: text must be a string');
  console.assert(text.length >= 0, 'splitParagraphs: text length must be non-negative');

  const cleaned = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#+\s+.*/gm, '')
    .trim();

  if (cleaned.length === 0) {
    return [];
  }

  const paragraphs = cleaned.split(/\n\s*\n/);
  const result = [];
  const limit = Math.min(paragraphs.length, MAX_ITEMS);
  for (let i = 0; i < limit; i++) {
    const p = paragraphs[i].trim();
    if (p.length > 0) {
      result.push(p);
    }
  }
  return result;
}

/**
 * Count words in a string.
 * @param {string} text
 * @returns {number}
 */
function countWords(text) {
  console.assert(typeof text === 'string', 'countWords: text must be a string');
  console.assert(text.length >= 0, 'countWords: text length must be non-negative');

  const words = text.split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

/**
 * Extract all words from text.
 * @param {string} text
 * @returns {string[]}
 */
function extractWords(text) {
  console.assert(typeof text === 'string', 'extractWords: text must be a string');
  console.assert(text.length >= 0, 'extractWords: text length must be non-negative');

  return text.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length > 0);
}

/**
 * Compute Flesch-Kincaid Grade Level.
 * @param {number} totalWords
 * @param {number} totalSentences
 * @param {number} totalSyllables
 * @returns {number}
 */
function fleschKincaidGrade(totalWords, totalSentences, totalSyllables) {
  console.assert(typeof totalWords === 'number', 'fleschKincaidGrade: totalWords must be number');
  console.assert(typeof totalSentences === 'number', 'fleschKincaidGrade: totalSentences must be number');

  if (totalSentences === 0 || totalWords === 0) {
    return 0;
  }
  const grade = 0.39 * (totalWords / totalSentences) + 11.8 * (totalSyllables / totalWords) - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

/**
 * Compute Flesch Reading Ease.
 * @param {number} totalWords
 * @param {number} totalSentences
 * @param {number} totalSyllables
 * @returns {number}
 */
function fleschReadingEase(totalWords, totalSentences, totalSyllables) {
  console.assert(typeof totalWords === 'number', 'fleschReadingEase: totalWords must be number');
  console.assert(typeof totalSentences === 'number', 'fleschReadingEase: totalSentences must be number');

  if (totalSentences === 0 || totalWords === 0) {
    return 100;
  }
  const ease = 206.835 - 1.015 * (totalWords / totalSentences) - 84.6 * (totalSyllables / totalWords);
  return Math.max(0, Math.min(100, Math.round(ease * 10) / 10));
}

/**
 * Analyze readability of text content.
 * @param {string} text - The full markdown/text content
 * @returns {{ score: number, grade: number, ease: number, avgSentenceLength: number, issues: Array<{line: string, message: string, severity: string}> }}
 */
export function analyzeReadability(text) {
  console.assert(typeof text === 'string', 'analyzeReadability: text must be a string');
  console.assert(text.length >= 0, 'analyzeReadability: text length must be non-negative');

  const sentences = splitSentences(text);
  const paragraphs = splitParagraphs(text);
  const allWords = extractWords(text);
  const issues = [];

  let totalSyllables = 0;
  const wordLimit = Math.min(allWords.length, MAX_ITEMS);
  for (let i = 0; i < wordLimit; i++) {
    totalSyllables += countSyllables(allWords[i]);
  }

  const totalWords = allWords.length;
  const totalSentences = Math.max(sentences.length, 1);
  const grade = fleschKincaidGrade(totalWords, totalSentences, totalSyllables);
  const ease = fleschReadingEase(totalWords, totalSentences, totalSyllables);
  const avgSentenceLength = Math.round((totalWords / totalSentences) * 10) / 10;

  // Flag long sentences
  const sentenceLimit = Math.min(sentences.length, MAX_ITEMS);
  for (let i = 0; i < sentenceLimit; i++) {
    const wc = countWords(sentences[i]);
    if (wc > MAX_SENTENCE_WORDS) {
      const preview = sentences[i].substring(0, 60);
      issues.push({
        line: preview,
        message: `Sentence has ${wc} words (max recommended: ${MAX_SENTENCE_WORDS}). Consider splitting.`,
        severity: 'warning'
      });
    }
  }

  // Flag long paragraphs
  const paraLimit = Math.min(paragraphs.length, MAX_ITEMS);
  for (let i = 0; i < paraLimit; i++) {
    const wc = countWords(paragraphs[i]);
    if (wc > MAX_PARAGRAPH_WORDS) {
      const preview = paragraphs[i].substring(0, 60);
      issues.push({
        line: preview,
        message: `Paragraph has ${wc} words (max recommended: ${MAX_PARAGRAPH_WORDS}). Consider breaking up.`,
        severity: 'warning'
      });
    }
  }

  // Score: based on reading ease (0-100 maps well)
  const score = Math.max(0, Math.min(100, Math.round(ease)));

  return { score, grade, ease, avgSentenceLength, issues };
}
