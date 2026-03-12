const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      github_repo VARCHAR(255) NOT NULL,
      discourse_category VARCHAR(255),
      discourse_topic VARCHAR(255),
      schedule_days INTEGER DEFAULT 7,
      last_post_at TIMESTAMP,
      enabled BOOLEAN DEFAULT true
    );
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS discourse_topic VARCHAR(255);
    CREATE TABLE IF NOT EXISTS roadmap_notes (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
};

const getProjects = async () => {
  const { rows } = await pool.query('SELECT * FROM projects ORDER BY id');
  return rows;
};

const getProject = async (id) => {
  const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
  return rows[0];
};

const createProject = async (name, github_repo, discourse_category, discourse_topic, schedule_days) => {
  const { rows } = await pool.query(
    `INSERT INTO projects (name, github_repo, discourse_category, discourse_topic, schedule_days)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, github_repo, discourse_category, discourse_topic, schedule_days || 7]
  );
  return rows[0];
};

const updateProject = async (id, fields) => {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const { rows } = await pool.query(
    `UPDATE projects SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return rows[0];
};

const deleteProject = async (id) => {
  await pool.query('DELETE FROM projects WHERE id = $1', [id]);
};

const getProjectsDue = async () => {
  const { rows } = await pool.query(`
    SELECT * FROM projects
    WHERE enabled = true
      AND (last_post_at IS NULL OR last_post_at + (schedule_days || ' days')::interval < NOW())
  `);
  return rows;
};

const markPosted = async (id) => {
  await pool.query('UPDATE projects SET last_post_at = NOW() WHERE id = $1', [id]);
};

const getRoadmapNotes = async (projectId) => {
  const { rows } = await pool.query(
    'SELECT * FROM roadmap_notes WHERE project_id = $1 ORDER BY created_at DESC',
    [projectId]
  );
  return rows;
};

const addRoadmapNote = async (projectId, content) => {
  const { rows } = await pool.query(
    'INSERT INTO roadmap_notes (project_id, content) VALUES ($1, $2) RETURNING *',
    [projectId, content]
  );
  return rows[0];
};

const deleteRoadmapNote = async (id) => {
  await pool.query('DELETE FROM roadmap_notes WHERE id = $1', [id]);
};

module.exports = {
  pool,
  init,
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectsDue,
  markPosted,
  getRoadmapNotes,
  addRoadmapNote,
  deleteRoadmapNote,
};
