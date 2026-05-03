/**
 * Structure Analyzer — Heading hierarchy, code blocks, images, internal links.
 * NASA P10: All functions <60 lines, 2+ assertions, bounded loops, const/let only.
 */

const MAX_ITEMS = 10000;
const LONG_DOC_THRESHOLD = 500; // words before headings expected

/**
 * Extract headings with their levels from markdown text.
 * @param {string} text
 * @returns {Array<{level: number, text: string, lineNum: number}>}
 */
function extractHeadings(text) {
  console.assert(typeof text === 'string', 'extractHeadings: text must be a string');
  console.assert(text.length >= 0, 'extractHeadings: text length must be non-negative');

  const lines = text.split('\n');
  const headings = [];
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
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        lineNum: i + 1
      });
    }
  }

  return headings;
}

/**
 * Check heading hierarchy for skipped levels (e.g., h1 -> h3 with no h2).
 * @param {Array<{level: number, text: string, lineNum: number}>} headings
 * @returns {Array<{line: string, message: string, severity: string}>}
 */
function checkHeadingHierarchy(headings) {
  console.assert(Array.isArray(headings), 'checkHeadingHierarchy: headings must be array');
  console.assert(headings.length >= 0, 'checkHeadingHierarchy: headings length must be non-negative');

  const issues = [];
  const limit = Math.min(headings.length, MAX_ITEMS);

  for (let i = 1; i < limit; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    if (curr.level > prev.level + 1) {
      issues.push({
        line: `Line ${curr.lineNum}: "${curr.text}"`,
        message: `Heading level skipped: h${prev.level} -> h${curr.level}. Add an h${prev.level + 1} between them.`,
        severity: 'warning'
      });
    }
  }

  return issues;
}

/**
 * Find code blocks missing language tags.
 * @param {string} text
 * @returns {Array<{line: string, message: string, severity: string}>}
 */
function checkCodeBlocks(text) {
  console.assert(typeof text === 'string', 'checkCodeBlocks: text must be a string');
  console.assert(text.length >= 0, 'checkCodeBlocks: text length must be non-negative');

  const lines = text.split('\n');
  const issues = [];
  const limit = Math.min(lines.length, MAX_ITEMS);
  let inCodeBlock = false;

  for (let i = 0; i < limit; i++) {
    const trimmed = lines[i].trimStart();
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        const lang = trimmed.slice(3).trim();
        if (lang.length === 0) {
          issues.push({
            line: `Line ${i + 1}`,
            message: 'Code block missing language tag. Add a language (e.g., ```javascript) for syntax highlighting.',
            severity: 'info'
          });
        }
      }
      inCodeBlock = !inCodeBlock;
    }
  }

  return issues;
}

/**
 * Find images without alt text.
 * @param {string} text
 * @returns {Array<{line: string, message: string, severity: string}>}
 */
function checkImageAltText(text) {
  console.assert(typeof text === 'string', 'checkImageAltText: text must be a string');
  console.assert(text.length >= 0, 'checkImageAltText: text length must be non-negative');

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
    // Match ![alt](url) where alt is empty
    const imgRegex = /!\[([^\]]*)\]\([^)]+\)/g;
    let match = imgRegex.exec(line);
    let iterations = 0;
    while (match !== null && iterations < 100) {
      if (match[1].trim().length === 0) {
        issues.push({
          line: `Line ${i + 1}`,
          message: 'Image missing alt text. Add descriptive alt text for accessibility.',
          severity: 'warning'
        });
      }
      match = imgRegex.exec(line);
      iterations++;
    }
  }

  return issues;
}

/**
 * Check for broken relative internal links.
 * @param {string} text
 * @returns {Array<{line: string, message: string, severity: string}>}
 */
function checkInternalLinks(text) {
  console.assert(typeof text === 'string', 'checkInternalLinks: text must be a string');
  console.assert(text.length >= 0, 'checkInternalLinks: text length must be non-negative');

  const issues = [];
  const lines = text.split('\n');
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
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match = linkRegex.exec(line);
    let iterations = 0;
    while (match !== null && iterations < 100) {
      const url = match[2];
      // Flag relative links with suspicious patterns
      if (!url.startsWith('http') && !url.startsWith('#') && !url.startsWith('mailto:')) {
        if (url.includes(' ') || url.includes('..\\')) {
          issues.push({
            line: `Line ${i + 1}: [${match[1]}](${url})`,
            message: 'Potentially broken internal link: contains spaces or backslashes.',
            severity: 'warning'
          });
        }
      }
      match = linkRegex.exec(line);
      iterations++;
    }
  }

  return issues;
}

/**
 * Check if long documents have sufficient headings.
 * @param {string} text
 * @param {Array<{level: number, text: string, lineNum: number}>} headings
 * @returns {Array<{line: string, message: string, severity: string}>}
 */
function checkDocumentLength(text, headings) {
  console.assert(typeof text === 'string', 'checkDocumentLength: text must be a string');
  console.assert(Array.isArray(headings), 'checkDocumentLength: headings must be array');

  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const issues = [];

  if (wordCount > LONG_DOC_THRESHOLD && headings.length === 0) {
    issues.push({
      line: 'Document',
      message: `Document has ${wordCount} words but no headings. Add headings to improve navigation.`,
      severity: 'warning'
    });
  }

  if (wordCount > LONG_DOC_THRESHOLD * 2 && headings.length < 3) {
    issues.push({
      line: 'Document',
      message: `Document has ${wordCount} words but only ${headings.length} heading(s). Consider adding more structure.`,
      severity: 'info'
    });
  }

  return issues;
}

/**
 * Analyze document structure.
 * @param {string} text - The full markdown/text content
 * @returns {{ score: number, issues: Array<{line: string, message: string, severity: string}> }}
 */
export function analyzeStructure(text) {
  console.assert(typeof text === 'string', 'analyzeStructure: text must be a string');
  console.assert(text.length >= 0, 'analyzeStructure: text length must be non-negative');

  const headings = extractHeadings(text);
  const allIssues = [
    ...checkHeadingHierarchy(headings),
    ...checkCodeBlocks(text),
    ...checkImageAltText(text),
    ...checkInternalLinks(text),
    ...checkDocumentLength(text, headings)
  ];

  // Score: start at 100, deduct per issue
  const errorCount = allIssues.filter(i => i.severity === 'error').length;
  const warningCount = allIssues.filter(i => i.severity === 'warning').length;
  const infoCount = allIssues.filter(i => i.severity === 'info').length;

  const deductions = (errorCount * 15) + (warningCount * 8) + (infoCount * 3);
  const score = Math.max(0, Math.min(100, 100 - deductions));

  return { score, issues: allIssues };
}
