/**
 * BeLikeNative Writing Assistant — GitHub Action Orchestrator.
 * Fetches PR files, runs analysis pipeline, posts review with score card.
 * NASA P10: <60 lines, 2+ assertions, bounded loops, const/let only.
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import { analyzeReadability } from './readability.mjs';
import { analyzeStructure } from './structure.mjs';
import { analyzeClarity } from './clarity.mjs';
import { analyzeInclusivity } from './inclusivity.mjs';
import { analyzeL1Patterns } from './l1-patterns.mjs';
import { buildReview } from './scorer.mjs';
import { fetchPRFiles, fetchFileContent, postComment, filterFilesByPatterns } from './github-api.mjs';

/**
 * Analyze a single file through all 5 categories.
 * @param {string} content - File text content
 * @returns {{ readability: object, structure: object, clarity: object, inclusivity: object, l1Awareness: object }}
 */
function analyzeFile(content) {
  console.assert(typeof content === 'string', 'analyzeFile: content must be string');
  console.assert(content.length >= 0, 'analyzeFile: content length must be non-negative');

  return {
    readability: analyzeReadability(content),
    structure: analyzeStructure(content),
    clarity: analyzeClarity(content),
    inclusivity: analyzeInclusivity(content),
    l1Awareness: analyzeL1Patterns(content)
  };
}

/** Main entry point. */
async function run() {
  const token = core.getInput('github-token', { required: true });
  const filePatterns = core.getInput('file-patterns') || '**/*.md,**/*.mdx,**/*.txt';
  const minScore = parseInt(core.getInput('min-score') || '70', 10);

  console.assert(typeof token === 'string' && token.length > 0, 'run: token must be non-empty');
  console.assert(minScore >= 0 && minScore <= 100, 'run: minScore must be 0-100');

  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  const prNumber = github.context.payload.pull_request?.number;

  if (!prNumber) {
    core.warning('No pull request found. Skipping analysis.');
    return;
  }

  const allFiles = await fetchPRFiles(octokit, owner, repo, prNumber);
  const matched = filterFilesByPatterns(allFiles, filePatterns);
  core.info(`Found ${matched.length} file(s) matching patterns: ${filePatterns}`);

  if (matched.length === 0) {
    core.info('No matching files to analyze.');
    return;
  }

  const ref = github.context.payload.pull_request.head.sha;
  const fileReviews = [];
  const limit = Math.min(matched.length, 50);

  for (let i = 0; i < limit; i++) {
    const file = matched[i];
    core.info(`Analyzing: ${file.filename}`);
    const content = await fetchFileContent(octokit, owner, repo, file.filename, ref);
    const results = analyzeFile(content);
    const review = buildReview(results);
    fileReviews.push({ filename: file.filename, ...review });
  }

  const body = buildCommentBody(fileReviews, minScore);
  await postComment(octokit, owner, repo, prNumber, body);

  const worstScore = Math.min(...fileReviews.map(r => r.overall));
  core.setOutput('overall-score', String(worstScore));

  if (worstScore < minScore) {
    core.setFailed(`Writing quality score ${worstScore} is below minimum ${minScore}`);
  } else {
    core.info(`All files pass minimum score of ${minScore}. Worst: ${worstScore}`);
  }
}

/**
 * Build the full PR comment body from all file reviews.
 * @param {Array<{filename: string, overall: number, body: string}>} fileReviews
 * @param {number} minScore
 * @returns {string}
 */
function buildCommentBody(fileReviews, minScore) {
  console.assert(Array.isArray(fileReviews), 'buildCommentBody: fileReviews must be array');
  console.assert(typeof minScore === 'number', 'buildCommentBody: minScore must be number');

  const sections = [`# BeLikeNative Writing Assistant Report`, ''];

  for (let i = 0; i < fileReviews.length; i++) {
    const r = fileReviews[i];
    const status = r.overall >= minScore ? 'PASS' : 'FAIL';
    sections.push(`### \`${r.filename}\` — ${r.overall}/100 (${status})`);
    sections.push('');
    sections.push(r.body);
    sections.push('');
  }

  return sections.join('\n');
}

run().catch(err => {
  core.setFailed(`Writing Assistant failed: ${err.message}`);
});
