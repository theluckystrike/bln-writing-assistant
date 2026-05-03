/**
 * GitHub API interactions — Fetch PR files, post review, update check status.
 * NASA P10: All functions <60 lines, 2+ assertions, bounded loops, const/let only.
 */

const MAX_FILES = 500;

/**
 * Fetch files changed in a pull request.
 * @param {object} octokit - GitHub API client from @actions/github
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pullNumber - PR number
 * @returns {Promise<Array<{filename: string, status: string, patch: string}>>}
 */
export async function fetchPRFiles(octokit, owner, repo, pullNumber) {
  console.assert(typeof octokit === 'object' && octokit !== null, 'fetchPRFiles: octokit must be object');
  console.assert(typeof owner === 'string' && owner.length > 0, 'fetchPRFiles: owner must be non-empty string');

  const response = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
    per_page: MAX_FILES
  });

  console.assert(Array.isArray(response.data), 'fetchPRFiles: response.data must be array');

  return response.data.map(file => ({
    filename: file.filename,
    status: file.status,
    patch: file.patch || ''
  }));
}

/**
 * Fetch file content from the repository at a specific ref.
 * @param {object} octokit - GitHub API client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path in repo
 * @param {string} ref - Git ref (branch/sha)
 * @returns {Promise<string>} File content as UTF-8 string
 */
export async function fetchFileContent(octokit, owner, repo, path, ref) {
  console.assert(typeof octokit === 'object' && octokit !== null, 'fetchFileContent: octokit must be object');
  console.assert(typeof path === 'string' && path.length > 0, 'fetchFileContent: path must be non-empty string');

  const response = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref
  });

  console.assert(response.data !== null, 'fetchFileContent: response.data must not be null');

  const content = response.data.content || '';
  const decoded = Buffer.from(content, 'base64').toString('utf-8');
  return decoded;
}

/**
 * Post a review comment on a pull request.
 * @param {object} octokit - GitHub API client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pullNumber - PR number
 * @param {string} body - Review body in markdown
 * @param {'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT'} event - Review event type
 * @returns {Promise<number>} Review ID
 */
export async function postReview(octokit, owner, repo, pullNumber, body, event) {
  console.assert(typeof body === 'string' && body.length > 0, 'postReview: body must be non-empty string');
  console.assert(['APPROVE', 'REQUEST_CHANGES', 'COMMENT'].includes(event), 'postReview: event must be valid');

  const response = await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    body,
    event
  });

  console.assert(typeof response.data.id === 'number', 'postReview: response must have numeric id');

  return response.data.id;
}

/**
 * Post a comment on a pull request (simpler than a full review).
 * @param {object} octokit - GitHub API client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - PR/Issue number
 * @param {string} body - Comment body in markdown
 * @returns {Promise<number>} Comment ID
 */
export async function postComment(octokit, owner, repo, issueNumber, body) {
  console.assert(typeof octokit === 'object' && octokit !== null, 'postComment: octokit must be object');
  console.assert(typeof body === 'string' && body.length > 0, 'postComment: body must be non-empty string');

  const response = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body
  });

  console.assert(typeof response.data.id === 'number', 'postComment: response must have numeric id');

  return response.data.id;
}

/**
 * Filter files by glob-like patterns (simplified pattern matching).
 * Supports: *.ext, **\/*.ext patterns.
 * @param {Array<{filename: string}>} files - List of file objects
 * @param {string} patterns - Comma-separated glob patterns
 * @returns {Array<{filename: string}>} Matching files
 */
export function filterFilesByPatterns(files, patterns) {
  console.assert(Array.isArray(files), 'filterFilesByPatterns: files must be array');
  console.assert(typeof patterns === 'string', 'filterFilesByPatterns: patterns must be string');

  const patternList = patterns.split(',').map(p => p.trim());
  const extensions = [];

  for (let i = 0; i < patternList.length; i++) {
    // Extract extension from patterns like **/*.md, *.md, etc.
    const extMatch = patternList[i].match(/\*\.(\w+)$/);
    if (extMatch) {
      extensions.push(`.${extMatch[1]}`);
    }
  }

  console.assert(extensions.length > 0, 'filterFilesByPatterns: must have at least one valid pattern');

  const result = [];
  const limit = Math.min(files.length, MAX_FILES);
  for (let i = 0; i < limit; i++) {
    const file = files[i];
    for (let e = 0; e < extensions.length; e++) {
      if (file.filename.endsWith(extensions[e])) {
        result.push(file);
        break;
      }
    }
  }

  return result;
}
