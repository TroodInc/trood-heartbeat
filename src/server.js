const express = require('express');
const path = require('path');
const db = require('./db/postgres');
const github = require('./github');
const discourse = require('./discourse');
const { buildDigest, hasActivity } = require('./digest');
const scheduler = require('./scheduler');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/ui', express.static(path.join(__dirname, 'ui')));

const getSince = (project) => project.last_post_at || project.schedule_days;

// API: list projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await db.getProjects();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: get project
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    const notes = await db.getRoadmapNotes(project.id);
    res.json({ ...project, roadmap_notes: notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: create project
app.post('/api/projects', async (req, res) => {
  try {
    const { name, github_repo, discourse_category, discourse_topic, schedule_days } = req.body;
    const project = await db.createProject(name, github_repo, discourse_category, discourse_topic, schedule_days);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const project = await db.updateProject(req.params.id, req.body);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await db.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: add roadmap note
app.post('/api/projects/:id/notes', async (req, res) => {
  try {
    const note = await db.addRoadmapNote(req.params.id, req.body.content);
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: delete roadmap note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    await db.deleteRoadmapNote(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: preview heartbeat
app.get('/api/projects/:id/preview', async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    const activity = await github.fetchActivity(project.github_repo, getSince(project));
    const notes = await db.getRoadmapNotes(project.id);
    const digest = buildDigest(activity, notes);
    res.json({ digest, has_activity: hasActivity(activity) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: publish heartbeat manually
app.post('/api/projects/:id/publish', async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    const activity = await github.fetchActivity(project.github_repo, getSince(project));
    const notes = await db.getRoadmapNotes(project.id);
    if (!hasActivity(activity)) {
      return res.json({ success: true, skipped: true, reason: 'No GitHub activity to publish' });
    }
    const digest = req.body.markdown?.trim() || buildDigest(activity, notes);
    const title = `${project.name} Heartbeat - ${new Date().toISOString().slice(0, 10)}`;
    await discourse.publish({
      category: project.discourse_category,
      topic: project.discourse_topic,
      title,
      markdown: digest,
    });
    await db.markPosted(project.id);
    res.json({ success: true, digest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Redirect root to admin UI
app.get('/', (req, res) => res.redirect('/ui/index.html'));

const PORT = process.env.PORT || 3000;

const start = async () => {
  await db.init();
  scheduler.start();
  app.listen(PORT, () => console.log(`[server] Listening on port ${PORT}`));
};

start().catch(err => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
