const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_VERSION = process.env.APP_VERSION || 'v1';

app.use(cors());
app.use(express.json());

// ─── Database Pool ────────────────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || 'postgres-service',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'appdb',
  user:     process.env.DB_USER     || 'appuser',
  password: process.env.DB_PASSWORD || 'apppass',
  connectionTimeoutMillis: 5000,
});

// ─── DB Initialisation ────────────────────────────────────────────────────────
async function initDB() {
  const retries = 5;
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS items (
          id         SERIAL PRIMARY KEY,
          name       VARCHAR(100) NOT NULL,
          status     VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP   DEFAULT NOW()
        );
      `);
      // Seed only if empty
      const { rows } = await pool.query('SELECT COUNT(*) FROM items');
      if (parseInt(rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO items (name, status) VALUES
            ('Alpha Service',  'active'),
            ('Beta Service',   'active'),
            ('Gamma Service',  'active'),
            ('Delta Service',  'active');
        `);
        console.log('[DB] Seeded initial records');
      }
      console.log('[DB] Ready');
      return;
    } catch (err) {
      console.error(`[DB] Attempt ${i + 1}/${retries} failed:`, err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.error('[DB] Could not connect after retries — continuing without DB');
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (_) {}

  res.json({
    status:    'healthy',
    version:   APP_VERSION,
    db:        dbStatus,
    uptime:    process.uptime().toFixed(1) + 's',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/version', (req, res) => {
  res.json({ version: APP_VERSION, timestamp: new Date().toISOString() });
});

app.get('/api/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY id');
    res.json({
      version: APP_VERSION,
      count:   result.rows.length,
      items:   result.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM items
      GROUP BY status
    `);
    res.json({ version: APP_VERSION, stats: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[Backend ${APP_VERSION}] Listening on port ${PORT}`);
  await initDB();
});
