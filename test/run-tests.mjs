/**
 * Basic import and functional tests for all modules.
 * NASA P10: bounded loops, assertions, <60 line functions.
 */

let passed = 0;
let failed = 0;

function test(name, fn) {
  console.assert(typeof name === 'string', 'test: name must be string');
  console.assert(typeof fn === 'function', 'test: fn must be function');
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL: ${name} — ${err.message}`);
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

function assertRange(value, min, max, msg) {
  if (value < min || value > max) {
    throw new Error(`${msg}: ${value} not in range [${min}, ${max}]`);
  }
}

// === Test readability.mjs ===
console.log('\n--- readability.mjs ---');
const { analyzeReadability } = await import('../src/readability.mjs');

test('analyzeReadability exports a function', () => {
  assertEqual(typeof analyzeReadability, 'function', 'type check');
});

test('analyzeReadability returns score for simple text', () => {
  const result = analyzeReadability('This is a simple sentence. Here is another one.');
  assertRange(result.score, 0, 100, 'score range');
  assertEqual(typeof result.grade, 'number', 'grade type');
  assertEqual(typeof result.ease, 'number', 'ease type');
  assertEqual(Array.isArray(result.issues), true, 'issues is array');
});

test('analyzeReadability flags long sentences', () => {
  const longSentence = 'The quick brown fox jumped over the lazy dog and then ran across the field and through the forest and over the hill and past the river and into the town where it finally rested.';
  const result = analyzeReadability(longSentence);
  assertEqual(result.issues.length > 0, true, 'should have issues');
});

test('analyzeReadability handles empty text', () => {
  const result = analyzeReadability('');
  assertRange(result.score, 0, 100, 'score range');
});

// === Test structure.mjs ===
console.log('\n--- structure.mjs ---');
const { analyzeStructure } = await import('../src/structure.mjs');

test('analyzeStructure exports a function', () => {
  assertEqual(typeof analyzeStructure, 'function', 'type check');
});

test('analyzeStructure detects heading skip', () => {
  const text = '# Title\n\n### Skipped h2\n\nSome content here.';
  const result = analyzeStructure(text);
  const hierarchyIssue = result.issues.find(i => i.message.includes('Heading level skipped'));
  assertEqual(hierarchyIssue !== undefined, true, 'should detect heading skip');
});

test('analyzeStructure detects missing code lang', () => {
  const text = '# Title\n\n```\nsome code\n```\n';
  const result = analyzeStructure(text);
  const codeIssue = result.issues.find(i => i.message.includes('language tag'));
  assertEqual(codeIssue !== undefined, true, 'should detect missing lang');
});

test('analyzeStructure detects missing alt text', () => {
  const text = '# Title\n\n![](image.png)\n';
  const result = analyzeStructure(text);
  const altIssue = result.issues.find(i => i.message.includes('alt text'));
  assertEqual(altIssue !== undefined, true, 'should detect missing alt text');
});

// === Test clarity.mjs ===
console.log('\n--- clarity.mjs ---');
const { analyzeClarity } = await import('../src/clarity.mjs');

test('analyzeClarity exports a function', () => {
  assertEqual(typeof analyzeClarity, 'function', 'type check');
});

test('analyzeClarity detects passive voice', () => {
  const text = 'The ball was thrown by the player.';
  const result = analyzeClarity(text);
  const passiveIssue = result.issues.find(i => i.message.includes('Passive voice'));
  assertEqual(passiveIssue !== undefined, true, 'should detect passive voice');
});

test('analyzeClarity detects filler words', () => {
  const text = 'This is basically a very simple thing that just works.';
  const result = analyzeClarity(text);
  const fillerIssue = result.issues.find(i => i.message.includes('Filler word'));
  assertEqual(fillerIssue !== undefined, true, 'should detect filler words');
});

test('analyzeClarity detects wordy phrases', () => {
  const text = 'In order to use this feature, you need to configure it first.';
  const result = analyzeClarity(text);
  const wordyIssue = result.issues.find(i => i.message.includes('wordy'));
  assertEqual(wordyIssue !== undefined, true, 'should detect wordy phrases');
});

test('analyzeClarity detects jargon', () => {
  const text = 'We need to utilize this framework to leverage the synergy.';
  const result = analyzeClarity(text);
  const jargonIssue = result.issues.find(i => i.message.includes('jargon'));
  assertEqual(jargonIssue !== undefined, true, 'should detect jargon');
});

// === Test inclusivity.mjs ===
console.log('\n--- inclusivity.mjs ---');
const { analyzeInclusivity } = await import('../src/inclusivity.mjs');

test('analyzeInclusivity exports a function', () => {
  assertEqual(typeof analyzeInclusivity, 'function', 'type check');
});

test('analyzeInclusivity detects gendered language', () => {
  const text = 'The chairman will discuss the manpower needed.';
  const result = analyzeInclusivity(text);
  const genderIssue = result.issues.find(i => i.message.includes('gender-neutral'));
  assertEqual(genderIssue !== undefined, true, 'should detect gendered language');
});

test('analyzeInclusivity detects ableist language', () => {
  const text = 'Do a sanity check before deploying this crazy feature.';
  const result = analyzeInclusivity(text);
  const ableistIssue = result.issues.find(i => i.message.includes('ableist'));
  assertEqual(ableistIssue !== undefined, true, 'should detect ableist language');
});

// === Test l1-patterns.mjs ===
console.log('\n--- l1-patterns.mjs ---');
const { analyzeL1Patterns } = await import('../src/l1-patterns.mjs');

test('analyzeL1Patterns exports a function', () => {
  assertEqual(typeof analyzeL1Patterns, 'function', 'type check');
});

test('analyzeL1Patterns detects preposition errors', () => {
  const text = 'We need to discuss about the new features.';
  const result = analyzeL1Patterns(text);
  const prepIssue = result.issues.find(i => i.message.includes('discuss'));
  assertEqual(prepIssue !== undefined, true, 'should detect preposition error');
});

test('analyzeL1Patterns detects uncountable plurals', () => {
  const text = 'We received many feedbacks and informations from users.';
  const result = analyzeL1Patterns(text);
  const pluralIssue = result.issues.find(i => i.message.includes('uncountable'));
  assertEqual(pluralIssue !== undefined, true, 'should detect uncountable plural');
});

test('analyzeL1Patterns includes L1 group attribution', () => {
  const text = 'Please explain me the process.';
  const result = analyzeL1Patterns(text);
  const l1Issue = result.issues.find(i => i.message.includes('L1'));
  assertEqual(l1Issue !== undefined, true, 'should include L1 attribution');
});

// === Test scorer.mjs ===
console.log('\n--- scorer.mjs ---');
const { buildReview } = await import('../src/scorer.mjs');

test('buildReview exports a function', () => {
  assertEqual(typeof buildReview, 'function', 'type check');
});

test('buildReview returns correct structure', () => {
  const mockResults = {
    readability: { score: 85, issues: [] },
    structure: { score: 90, issues: [] },
    clarity: { score: 75, issues: [] },
    inclusivity: { score: 80, issues: [] },
    l1Awareness: { score: 95, issues: [] }
  };
  const review = buildReview(mockResults);
  assertEqual(typeof review.overall, 'number', 'overall type');
  assertRange(review.overall, 0, 100, 'overall range');
  assertEqual(typeof review.body, 'string', 'body type');
  assertEqual(review.body.includes('Score Card'), true, 'body has score card');
});

test('buildReview weighted average is correct', () => {
  const mockResults = {
    readability: { score: 100, issues: [] },
    structure: { score: 100, issues: [] },
    clarity: { score: 100, issues: [] },
    inclusivity: { score: 100, issues: [] },
    l1Awareness: { score: 100, issues: [] }
  };
  const review = buildReview(mockResults);
  assertEqual(review.overall, 100, 'perfect score should be 100');
});

// === Test github-api.mjs ===
console.log('\n--- github-api.mjs ---');
const { filterFilesByPatterns } = await import('../src/github-api.mjs');

test('filterFilesByPatterns exports a function', () => {
  assertEqual(typeof filterFilesByPatterns, 'function', 'type check');
});

test('filterFilesByPatterns filters by extension', () => {
  const files = [
    { filename: 'README.md' },
    { filename: 'src/index.js' },
    { filename: 'docs/guide.mdx' },
    { filename: 'notes.txt' },
    { filename: 'image.png' }
  ];
  const result = filterFilesByPatterns(files, '**/*.md,**/*.mdx,**/*.txt');
  assertEqual(result.length, 3, 'should match 3 files');
});

// === Summary ===
console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
