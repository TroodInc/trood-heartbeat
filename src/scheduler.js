const db = require('./db/postgres');
const github = require('./github');
const discourse = require('./discourse');
const { buildDigest, hasActivity } = require('./digest');

const INTERVAL_MS = 60 * 60 * 1000; // check every hour

const getSince = (project) => project.last_post_at || project.schedule_days;

const runOnce = async () => {
  const projects = await db.getProjectsDue();
  for (const project of projects) {
    try {
      console.log(`[scheduler] Processing: ${project.name}`);
      const activity = await github.fetchActivity(project.github_repo, getSince(project));
      if (!hasActivity(activity)) {
        console.log(`[scheduler] Skipped: ${project.name} (no GitHub activity)`);
        continue;
      }
      const notes = await db.getRoadmapNotes(project.id);
      const digest = buildDigest(activity, notes);
      const title = `${project.name} Heartbeat - ${new Date().toISOString().slice(0, 10)}`;
      await discourse.publish({
        category: project.discourse_category,
        topic: project.discourse_topic,
        title,
        markdown: digest,
      });
      await db.markPosted(project.id);
      console.log(`[scheduler] Published: ${project.name}`);
    } catch (err) {
      console.error(`[scheduler] Error for ${project.name}:`, err.message);
    }
  }
};

const start = () => {
  console.log('[scheduler] Started');
  runOnce();
  setInterval(runOnce, INTERVAL_MS);
};

module.exports = { start, runOnce };
