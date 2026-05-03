/**
 * Aggregate Scorer — Weighted scoring across all 5 categories + markdown score card.
 * NASA P10: All functions <60 lines, 2+ assertions, bounded loops, const/let only.
 */

/** Category weights (must sum to 1.0). */
const WEIGHTS = Object.freeze({
  readability: 0.30,
  structure: 0.20,
  clarity: 0.25,
  inclusivity: 0.15,
  l1Awareness: 0.10
});

/**
 * Compute weighted overall score from category scores.
 * @param {{ readability: number, structure: number, clarity: number, inclusivity: number, l1Awareness: number }} scores
 * @returns {number} Overall score 0-100
 */
function computeOverall(scores) {
  console.assert(typeof scores === 'object' && scores !== null, 'computeOverall: scores must be object');
  console.assert(typeof scores.readability === 'number', 'computeOverall: readability must be number');

  const overall =
    scores.readability * WEIGHTS.readability +
    scores.structure * WEIGHTS.structure +
    scores.clarity * WEIGHTS.clarity +
    scores.inclusivity * WEIGHTS.inclusivity +
    scores.l1Awareness * WEIGHTS.l1Awareness;

  return Math.max(0, Math.min(100, Math.round(overall)));
}

/**
 * Map a numeric score to a grade emoji/label.
 * @param {number} score
 * @returns {string}
 */
function scoreToGrade(score) {
  console.assert(typeof score === 'number', 'scoreToGrade: score must be number');
  console.assert(score >= 0 && score <= 100, 'scoreToGrade: score must be 0-100');

  if (score >= 90) { return 'A (Excellent)'; }
  if (score >= 80) { return 'B (Good)'; }
  if (score >= 70) { return 'C (Acceptable)'; }
  if (score >= 60) { return 'D (Needs Work)'; }
  return 'F (Poor)';
}

/**
 * Map a numeric score to a status indicator.
 * @param {number} score
 * @returns {string}
 */
function scoreToStatus(score) {
  console.assert(typeof score === 'number', 'scoreToStatus: score must be number');
  console.assert(score >= 0 && score <= 100, 'scoreToStatus: score must be 0-100');

  if (score >= 80) { return 'PASS'; }
  if (score >= 60) { return 'WARN'; }
  return 'FAIL';
}

/**
 * Generate a markdown score card table.
 * @param {{ readability: number, structure: number, clarity: number, inclusivity: number, l1Awareness: number }} scores
 * @param {number} overall
 * @returns {string} Markdown table
 */
function generateScoreCard(scores, overall) {
  console.assert(typeof scores === 'object' && scores !== null, 'generateScoreCard: scores must be object');
  console.assert(typeof overall === 'number', 'generateScoreCard: overall must be number');

  const rows = [
    ['Readability', scores.readability, WEIGHTS.readability * 100],
    ['Structure', scores.structure, WEIGHTS.structure * 100],
    ['Clarity', scores.clarity, WEIGHTS.clarity * 100],
    ['Inclusivity', scores.inclusivity, WEIGHTS.inclusivity * 100],
    ['L1 Awareness', scores.l1Awareness, WEIGHTS.l1Awareness * 100]
  ];

  const lines = [
    '## Writing Quality Score Card',
    '',
    `**Overall: ${overall}/100 — ${scoreToGrade(overall)}**`,
    '',
    '| Category | Score | Weight | Status |',
    '|----------|-------|--------|--------|'
  ];

  for (let i = 0; i < rows.length; i++) {
    const [name, score, weight] = rows[i];
    const status = scoreToStatus(score);
    lines.push(`| ${name} | ${score}/100 | ${weight}% | ${status} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('*Powered by [BeLikeNative Writing Assistant](https://belikenative.com)*');

  return lines.join('\n');
}

/**
 * Format issues into a markdown details section.
 * @param {string} category - Category name
 * @param {Array<{line: string, message: string, severity: string}>} issues
 * @returns {string} Markdown details block
 */
function formatIssuesSection(category, issues) {
  console.assert(typeof category === 'string', 'formatIssuesSection: category must be string');
  console.assert(Array.isArray(issues), 'formatIssuesSection: issues must be array');

  if (issues.length === 0) {
    return `### ${category}\nNo issues found.\n`;
  }

  const lines = [
    `<details>`,
    `<summary><strong>${category}</strong> (${issues.length} issue${issues.length === 1 ? '' : 's'})</summary>`,
    ''
  ];

  const limit = Math.min(issues.length, 50); // Cap displayed issues
  for (let i = 0; i < limit; i++) {
    const issue = issues[i];
    const icon = issue.severity === 'error' ? '!!!' : issue.severity === 'warning' ? '!!' : '!';
    lines.push(`- **[${icon}]** ${issue.line}: ${issue.message}`);
  }

  if (issues.length > 50) {
    lines.push(`- ...and ${issues.length - 50} more issues`);
  }

  lines.push('');
  lines.push('</details>');
  lines.push('');

  return lines.join('\n');
}

/**
 * Build the full review body with score card and all issue details.
 * @param {{ readability: {score: number, issues: Array}, structure: {score: number, issues: Array}, clarity: {score: number, issues: Array}, inclusivity: {score: number, issues: Array}, l1Awareness: {score: number, issues: Array} }} results
 * @returns {{ overall: number, scores: object, body: string }}
 */
export function buildReview(results) {
  console.assert(typeof results === 'object' && results !== null, 'buildReview: results must be object');
  console.assert('readability' in results, 'buildReview: results must have readability');

  const scores = {
    readability: results.readability.score,
    structure: results.structure.score,
    clarity: results.clarity.score,
    inclusivity: results.inclusivity.score,
    l1Awareness: results.l1Awareness.score
  };

  const overall = computeOverall(scores);
  const scoreCard = generateScoreCard(scores, overall);

  const issueSections = [
    formatIssuesSection('Readability', results.readability.issues),
    formatIssuesSection('Structure', results.structure.issues),
    formatIssuesSection('Clarity', results.clarity.issues),
    formatIssuesSection('Inclusivity', results.inclusivity.issues),
    formatIssuesSection('L1 Awareness', results.l1Awareness.issues)
  ];

  const body = [scoreCard, '', ...issueSections].join('\n');

  return { overall, scores, body };
}
