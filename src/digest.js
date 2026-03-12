const hasActivity = (activity) => (
  activity.newIssues.length > 0 ||
  activity.closedIssues.length > 0 ||
  activity.mergedPRs.length > 0 ||
  activity.newContributors.length > 0 ||
  activity.goodFirstIssues.length > 0
);

const buildDigest = (activity, roadmapNotes = []) => {
  const lines = ['# Project Heartbeat\n'];

  const section = (title, items, formatter) => {
    if (items.length === 0) return;
    lines.push(`## ${title}\n`);
    items.forEach(item => lines.push(`- ${formatter(item)}`));
    lines.push('');
  };

  section('New Issues', activity.newIssues, i => `[${i.title}](${i.url})`);
  section('Closed Issues', activity.closedIssues, i => `[${i.title}](${i.url})`);
  section('Merged PRs', activity.mergedPRs, p => `[${p.title}](${p.url}) by @${p.author}`);
  section('New Contributors', activity.newContributors, c => `@${c}`);
  section('Good First Issues', activity.goodFirstIssues, i => `[${i.title}](${i.url})`);

  if (roadmapNotes.length > 0) {
    lines.push('## Roadmap\n');
    roadmapNotes.forEach(n => lines.push(`${n.content}\n`));
  }

  return lines.join('\n').trim();
};

module.exports = { buildDigest, hasActivity };
