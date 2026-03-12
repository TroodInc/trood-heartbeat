const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const parseRepo = (value) => {
  if (!value) {
    throw new Error('GitHub repository is required');
  }

  const repoValue = value.trim().replace(/\.git$/, '').replace(/\/+$/, '');
  const urlMatch = repoValue.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)$/i);

  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }

  const parts = repoValue.split('/').filter(Boolean);
  if (parts.length === 2) {
    return { owner: parts[0], repo: parts[1] };
  }

  throw new Error('GitHub repository must be in the format owner/repo or https://github.com/owner/repo');
};

const fetchActivity = async (repoFullName, sinceInput = 7) => {
  const { owner, repo } = parseRepo(repoFullName);
  const since = typeof sinceInput === 'number'
    ? new Date(Date.now() - sinceInput * 24 * 60 * 60 * 1000).toISOString()
    : new Date(sinceInput).toISOString();

  const [openedIssues, closedIssues, mergedPRs, goodFirstIssues] = await Promise.all([
    octokit.issues.listForRepo({ owner, repo, state: 'open', since, per_page: 50 })
      .then(r => r.data.filter(i => !i.pull_request && new Date(i.created_at) >= new Date(since))),
    octokit.issues.listForRepo({ owner, repo, state: 'closed', since, per_page: 50 })
      .then(r => r.data.filter(i => !i.pull_request && new Date(i.closed_at) >= new Date(since))),
    octokit.pulls.list({ owner, repo, state: 'closed', sort: 'updated', direction: 'desc', per_page: 50 })
      .then(r => r.data.filter(p => p.merged_at && new Date(p.merged_at) >= new Date(since))),
    octokit.issues.listForRepo({ owner, repo, state: 'open', labels: 'good first issue', per_page: 20 })
      .then(r => r.data.filter(i => !i.pull_request && new Date(i.created_at) >= new Date(since))),
  ]);

  const contributorSet = new Set();
  mergedPRs.forEach(pr => {
    if (pr.user?.login) contributorSet.add(pr.user.login);
  });

  return {
    newIssues: openedIssues.map(i => ({ title: i.title, url: i.html_url })),
    closedIssues: closedIssues.map(i => ({ title: i.title, url: i.html_url })),
    mergedPRs: mergedPRs.map(p => ({ title: p.title, url: p.html_url, author: p.user?.login })),
    newContributors: Array.from(contributorSet),
    goodFirstIssues: goodFirstIssues.map(i => ({ title: i.title, url: i.html_url })),
  };
};

module.exports = { fetchActivity };
