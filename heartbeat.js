#!/usr/bin/env node
const github = require('./src/github');
const { buildDigest } = require('./src/digest');

const usage = () => {
  console.log(`
Usage: node heartbeat.js --project <owner/repo> [--days <n>]

Options:
  --project   GitHub repository (e.g., trood/trood-heartbeat)
  --days      Number of days to look back (default: 7)

Example:
  node heartbeat.js --project octocat/Hello-World --days 14
`);
  process.exit(1);
};

const parseArgs = (args) => {
  const opts = { days: 7 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project' && args[i + 1]) {
      opts.project = args[++i];
    } else if (args[i] === '--days' && args[i + 1]) {
      opts.days = parseInt(args[++i], 10);
    } else if (args[i] === '--help' || args[i] === '-h') {
      usage();
    }
  }
  return opts;
};

const main = async () => {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.project) {
    console.error('Error: --project is required\n');
    usage();
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    console.log(`Fetching activity for ${opts.project} (last ${opts.days} days)...\n`);
    const activity = await github.fetchActivity(opts.project, opts.days);
    const digest = buildDigest(activity);
    console.log(digest);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

main();
