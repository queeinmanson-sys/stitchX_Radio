// --- DELETE /api/inspections/:id (admin only) ---
app.delete('/api/inspections/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Missing inspection id'
    });
  }
  try {
    const result = await pool.query(
      `DELETE FROM inspections WHERE id = $1`,
      [id]
    );
    res.json({
      success: true,
      deleted: result.rowCount > 0
    });
  } catch (err) {
    console.error('DELETE /api/inspections error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete inspection'
    });
  }
});
// --- Admin: Get all synced inspections ---
app.get('/api/inspections', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT *
       FROM inspections
       ORDER BY timestamp DESC NULLS LAST`
    );

    res.json({
      success: true,
      inspections: rows
    });
  } catch (err) {
    console.error('GET /api/inspections error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inspections'
    });
  }
});
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const JWT_SECRET = process.env.JWT_SECRET;
// --- Global error handlers for backend stability ---
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
const WebSocket = require('ws');
// --- AUTH: Login endpoint (JWT, DB-backed) ---
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      success: true,
      token,
      user: {
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});
// --- DB: Create users table and seed default users ---
async function seedUsers() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const users = [
    { email: 'admin@stitchx.com', password: 'admin123', role: 'admin' },
    { email: 'official@stitchx.com', password: 'official123', role: 'official' }
  ];
  for (const u of users) {
    // Check if user exists
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [u.email]);
    if (!exists.rows.length) {
      const hash = await bcrypt.hash(u.password, 10);
      await pool.query(
        `INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4)`,
        [
          `user_${Date.now()}_${Math.random()}`,
          u.email,
          hash,
          u.role
        ]
      );
    }
  }
}

seedUsers();
function connectRaceFeed() {
  const ws = new WebSocket('wss://example-race-feed.com');

  ws.on('open', () => {
    console.log('Connected to race feed');
  });

  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      await processRaceData(data); // reuse your existing mapper
    } catch (err) {
      console.error('WS parse error:', err);
    }
  });

  ws.on('close', () => {
    console.log('Feed disconnected — reconnecting...');
    setTimeout(connectRaceFeed, 5000);
  });

  ws.on('error', (err) => {
    console.error('Feed error:', err);
  });
}
const crypto = require('crypto');
function verifyWebhookSignature(req) {
  const signature = req.headers['x-race-signature'];
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', process.env.RACE_WEBHOOK_SECRET || '')
    .update(JSON.stringify(req.body))
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');

  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}
// --- Webhook endpoint for external race data ---
app.post('/api/webhooks/race-feed', async (req, res) => {
  if (!verifyWebhookSignature(req)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid webhook signature'
    });
  }

  const { race_id, updates = [], leaderboard = [] } = req.body;

  if (!race_id) {
    return res.status(400).json({
      success: false,
      error: 'race_id is required'
    });
  }

  try {
    for (const u of updates) {
      const update = {
        id: u.id || generateId('ru'),
        race_id,
        type: u.type || 'external',
        title: u.title || 'Race update',
        message: u.message || '',
        rider_name: u.rider_name || '',
        team: u.team || '',
        km_to_go: u.km_to_go ?? null,
        timestamp: u.timestamp || new Date().toISOString(),
        is_published: true
      };

      await pool.query(
        `INSERT INTO race_updates (
          id, race_id, type, title, message, rider_name, team, km_to_go, "timestamp", is_published
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO NOTHING`,
        [
          update.id,
          update.race_id,
          update.type,
          update.title,
          update.message,
          update.rider_name,
          update.team,
          update.km_to_go,
          update.timestamp,
          update.is_published
        ]
      );

      io.to(`race:${race_id}`).emit('liverace:update', update);
    }

    if (Array.isArray(leaderboard) && leaderboard.length) {
      await pool.query(`DELETE FROM leaderboard WHERE race_id = $1`, [race_id]);

      for (const r of leaderboard) {
        await pool.query(
          `INSERT INTO leaderboard (id, race_id, rider_name, team, position, time)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            generateId('lb'),
            race_id,
            r.rider_name,
            r.team || '',
            r.position,
            r.time || ''
          ]
        );
      }

      io.to(`race:${race_id}`).emit('leaderboard:update');
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('POST /api/webhooks/race-feed error:', err);
    return res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});
// --- Real Sports Data Integration (Polling Ingest) ---
function startRaceDataIngest() {
  setInterval(async () => {
    try {
      // 🔹 Replace this with real API later
      const externalData = await fetchExternalRaceData();

      if (!externalData) return;

      await processRaceData(externalData);

    } catch (err) {
      console.error('Ingest error:', err);
    }
  }, 5000); // every 5 seconds
}

// Mock external fetch (replace with real API)
async function fetchExternalRaceData() {
  // Placeholder — simulate real feed
  return {
    race_id: 'race_2026_stage_1',
    updates: [
      {
        title: 'Attack by Pogacar',
        message: 'Strong acceleration on climb',
        rider_name: 'Pogacar',
        team: 'UAE',
        km_to_go: 32
      }
    ],
    leaderboard: [
      { position: 1, rider_name: 'Pogacar', team: 'UAE', time: '0:00' },
      { position: 2, rider_name: 'Vingegaard', team: 'Jumbo', time: '+0:12' }
    ]
  };
}

// Process and map data
async function processRaceData(data) {
  const { race_id, updates, leaderboard } = data;

  // 🔹 Insert race updates
  for (const u of updates) {
    const update = {
      id: generateId('ru'),
      race_id,
      type: 'external',
      title: u.title,
      message: u.message,
      rider_name: u.rider_name || '',
      team: u.team || '',
      km_to_go: u.km_to_go || null,
      timestamp: new Date().toISOString(),
      is_published: true
    };

    await pool.query(
      `INSERT INTO race_updates (
        id, race_id, type, title, message, rider_name, team, km_to_go, "timestamp", is_published
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        update.id,
        update.race_id,
        update.type,
        update.title,
        update.message,
        update.rider_name,
        update.team,
        update.km_to_go,
        update.timestamp,
        update.is_published
      ]
    );

    io.to(`race:${race_id}`).emit('liverace:update', update);
  }

  // 🔹 Replace leaderboard
  await pool.query(`DELETE FROM leaderboard WHERE race_id = $1`, [race_id]);

  for (const r of leaderboard) {
    await pool.query(
      `INSERT INTO leaderboard (id, race_id, rider_name, team, position, time)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        generateId('lb'),
        race_id,
        r.rider_name,
        r.team,
        r.position,
        r.time
      ]
    );
  }

  io.to(`race:${race_id}`).emit('leaderboard:update');
}
const rateLimit = require('express-rate-limit');
// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300, // max requests per IP
  standardHeaders: true,
  legacyHeaders: false
});

// Fan Zone spam limiter
const postLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10, // max posts per minute
  message: {
    success: false,
    error: 'Too many posts, slow down'
  }
});
app.use('/api', apiLimiter);
const racePresence = {}; // { "race:race_id": Set(socketIds) }
const { v2: cloudinary } = require('cloudinary');
const PROVIDER_API_KEY = process.env.PROVIDER_API_KEY || '';
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'stitchx',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});

const upload = multer({ storage });
// No local uploads needed; files go to Cloudinary
// --- PUT /api/races/:id (admin only) ---
app.put('/api/races/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, stage } = req.body;

  try {
    const result = await pool.query(
      `UPDATE races
       SET name = $1, stage = $2
       WHERE id = $3
       RETURNING *`,
      [name, stage || '', id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        error: 'Race not found'
      });
    }

    res.json({
      success: true,
      race: result.rows[0]
    });
  } catch (err) {
    console.error('PUT /api/races error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update race'
    });
  }
});

// --- DELETE /api/races/:id (admin only) ---
app.delete('/api/races/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `DELETE FROM races WHERE id = $1`,
      [id]
    );

    res.json({
      success: true
    });
  } catch (err) {
    console.error('DELETE /api/races error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete race'
    });
  }
});
// --- POST /api/races (admin only) ---
function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: 'No token' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

app.post('/api/races', requireAuth, requireAdmin, async (req, res) => {
  const { name, stage } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'name is required'
    });
  }

  try {
    const race = {
      id: generateId('race'),
      name,
      stage: stage || ''
    };

    await pool.query(
      `INSERT INTO races (id, name, stage)
       VALUES ($1, $2, $3)`,
      [race.id, race.name, race.stage]
    );

    res.json({
      success: true,
      race
    });
  } catch (err) {
    console.error('POST /api/races error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create race'
    });
  }
});

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('Socket.IO client connected:', socket.id);
  socket.on('join:race', (raceId) => {
    if (!raceId) return;
    const room = `race:${raceId}`;
    socket.join(room);
    if (!racePresence[room]) {
      racePresence[room] = new Set();
    }
    racePresence[room].add(socket.id);
    io.to(room).emit('presence:update', {
      race_id: raceId,
      count: racePresence[room].size
    });
  });

  socket.on('leave:race', (raceId) => {
    if (!raceId) return;
    const room = `race:${raceId}`;
    socket.leave(room);
    if (racePresence[room]) {
      racePresence[room].delete(socket.id);
      io.to(room).emit('presence:update', {
        race_id: raceId,
        count: racePresence[room].size
      });
    }
  });

  socket.on('disconnect', () => {
    for (const room in racePresence) {
      if (racePresence[room].has(socket.id)) {
        racePresence[room].delete(socket.id);
        io.to(room).emit('presence:update', {
          race_id: room.replace('race:', ''),
          count: racePresence[room].size
        });
      }
    }
  });
});

console.log('TESTSERVER WITH POST ROUTES IS RUNNING');


const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initDb() {
  // --- MIGRATION: Add external_id columns and unique indexes if not present ---

  await pool.query(`
    CREATE TABLE IF NOT EXISTS races (
      id TEXT PRIMARY KEY,
      external_id TEXT UNIQUE,
      name TEXT NOT NULL,
      stage TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'upcoming',
      stage_order INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_races_external_id
    ON races (external_id)
  `);

  await pool.query(`
    ALTER TABLE race_updates
    ADD COLUMN IF NOT EXISTS external_id TEXT
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_race_updates_external_id
    ON race_updates (external_id)
  `);
// --- Provider ingest helpers ---
async function upsertRaceFromProvider(race) {
  const existing = await pool.query(
    `SELECT id FROM races WHERE external_id = $1`,
    [race.external_id]
  );
  if (existing.rows.length) {
    const result = await pool.query(
      `UPDATE races
       SET name = $1,
           stage = $2,
           status = $3
       WHERE external_id = $4
       RETURNING *`,
      [
        race.name,
        race.stage || '',
        race.status || 'live',
        race.external_id
      ]
    );
    return result.rows[0];
  }
  const newRace = {
    id: generateId('race'),
    external_id: race.external_id,
    name: race.name,
    stage: race.stage || '',
    status: race.status || 'live'
  };
  const result = await pool.query(
    `INSERT INTO races (id, external_id, name, stage, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      newRace.id,
      newRace.external_id,
      newRace.name,
      newRace.stage,
      newRace.status
    ]
  );
  return result.rows[0];
}

async function insertRaceUpdateIfNew(raceId, update) {
  const row = {
    id: generateId('ru'),
    external_id: update.external_id || null,
    race_id: raceId,
    type: update.type || 'external',
    title: update.title || 'Race update',
    message: update.message || '',
    rider_name: update.rider_name || '',
    team: update.team || '',
    km_to_go: update.km_to_go ?? null,
    timestamp: update.timestamp || new Date().toISOString(),
    is_published: true
  };
  const result = await pool.query(
    `INSERT INTO race_updates (
      id, external_id, race_id, type, title, message,
      rider_name, team, km_to_go, "timestamp", is_published
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (external_id) DO NOTHING`,
    [
      row.id,
      row.external_id,
      row.race_id,
      row.type,
      row.title,
      row.message,
      row.rider_name,
      row.team,
      row.km_to_go,
      row.timestamp,
      row.is_published
    ]
  );
  return result.rowCount > 0 ? row : null;
}

async function replaceLeaderboard(raceId, riders) {
  await pool.query(`DELETE FROM leaderboard WHERE race_id = $1`, [raceId]);
  for (const rider of riders) {
    await pool.query(
      `INSERT INTO leaderboard (id, race_id, rider_name, team, position, time)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        generateId('lb'),
        raceId,
        rider.rider_name,
        rider.team || '',
        rider.position,
        rider.time || ''
      ]
    );
  }
}

async function processProviderPayload(payload) {
  if (!payload?.race?.external_id) {
    throw new Error('Missing race.external_id');
  }
  const race = await upsertRaceFromProvider(payload.race);
  const raceId = race.id;
  for (const update of payload.updates || []) {
    const inserted = await insertRaceUpdateIfNew(raceId, update);
    if (inserted) {
      io.to(`race:${raceId}`).emit('liverace:update', inserted);
    }
  }
  if (Array.isArray(payload.leaderboard) && payload.leaderboard.length) {
    await replaceLeaderboard(raceId, payload.leaderboard);
    io.to(`race:${raceId}`).emit('leaderboard:update');
  }
}

function mapExampleProviderPayload(raw) {
  return {
    provider: 'example-feed',
    race: {
      external_id: raw.race.id,
      name: raw.race.name,
      stage: raw.race.stage_name,
      status: raw.race.status
    },
    updates: (raw.events || []).map((evt) => ({
      external_id: evt.id,
      type: evt.kind,
      title: evt.headline,
      message: evt.description,
      rider_name: evt.rider?.name || '',
      team: evt.rider?.team || '',
      km_to_go: evt.km_remaining ?? null,
      timestamp: evt.occurred_at
    })),
    leaderboard: (raw.gc || []).map((row) => ({
      position: row.rank,
      rider_name: row.rider_name,
      team: row.team_name || '',
      time: row.gap || '0:00'
    }))
  };
}

async function fetchExampleProviderData() {
  const res = await fetch('https://provider.example.com/race-feed', {
    headers: {
      Authorization: `Bearer ${PROVIDER_API_KEY}`
    }
  });
  if (!res.ok) {
    throw new Error(`Provider fetch failed: ${res.status}`);
  }
  return res.json();
}

function startProviderPolling() {
  setInterval(async () => {
    try {
      const raw = await fetchExampleProviderData();
      const normalized = mapExampleProviderPayload(raw);
      await processProviderPayload(normalized);
    } catch (err) {
      console.error('Provider poll error:', err);
    }
  }, 5000);
}
// --- Provider webhook route ---
app.post('/api/webhooks/provider-example', async (req, res) => {
  try {
    const normalized = mapExampleProviderPayload(req.body);
    await processProviderPayload(normalized);
    res.json({ success: true });
  } catch (err) {
    console.error('Provider webhook error:', err);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS race_updates (
      id TEXT PRIMARY KEY,
      external_id TEXT,
      race_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'general',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      rider_name TEXT DEFAULT '',
      team TEXT DEFAULT '',
      km_to_go INTEGER,
      "timestamp" TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      is_published BOOLEAN NOT NULL DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fan_zone_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      media_url TEXT DEFAULT '',
      author_name TEXT DEFAULT '',
      race_id TEXT DEFAULT '',
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      is_published BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id TEXT PRIMARY KEY,
      race_id TEXT NOT NULL,
      rider_name TEXT NOT NULL,
      team TEXT DEFAULT '',
      position INTEGER NOT NULL,
      time TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
// --- Provider-agnostic ingest helpers ---
async function upsertRaceFromProvider(race) {
  const existing = await pool.query(
    `SELECT id FROM races WHERE external_id = $1`,
    [race.external_id]
  );

  if (existing.rows.length) {
    const result = await pool.query(
      `UPDATE races
       SET name = $1,
           stage = $2,
           status = $3
       WHERE external_id = $4
       RETURNING *`,
      [
        race.name,
        race.stage || '',
        race.status || 'live',
        race.external_id
      ]
    );
    return result.rows[0];
  }

  const newRace = {
    id: generateId('race'),
    external_id: race.external_id,
    name: race.name,
    stage: race.stage || '',
    status: race.status || 'live'
  };

  const result = await pool.query(
    `INSERT INTO races (id, external_id, name, stage, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      newRace.id,
      newRace.external_id,
      newRace.name,
      newRace.stage,
      newRace.status
    ]
  );
  return result.rows[0];
}

async function insertRaceUpdateIfNew(raceId, update) {
  const row = {
    id: generateId('ru'),
    external_id: update.external_id || null,
    race_id: raceId,
    type: update.type || 'external',
    title: update.title || 'Race update',
    message: update.message || '',
    rider_name: update.rider_name || '',
    team: update.team || '',
    km_to_go: update.km_to_go ?? null,
    timestamp: update.timestamp || new Date().toISOString(),
    is_published: true
  };

  const result = await pool.query(
    `INSERT INTO race_updates (
      id, external_id, race_id, type, title, message,
      rider_name, team, km_to_go, "timestamp", is_published
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (external_id) DO NOTHING`,
    [
      row.id,
      row.external_id,
      row.race_id,
      row.type,
      row.title,
      row.message,
      row.rider_name,
      row.team,
      row.km_to_go,
      row.timestamp,
      row.is_published
    ]
  );
  return result.rowCount > 0 ? row : null;
}

async function replaceLeaderboard(raceId, riders) {
  await pool.query(`DELETE FROM leaderboard WHERE race_id = $1`, [raceId]);
  for (const rider of riders) {
    await pool.query(
      `INSERT INTO leaderboard (id, race_id, rider_name, team, position, time)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        generateId('lb'),
        raceId,
        rider.rider_name,
        rider.team || '',
        rider.position,
        rider.time || ''
      ]
    );
  }
}

// --- Provider-agnostic ingest processor ---
async function processProviderPayload(payload) {
  if (!payload?.race?.external_id) {
    throw new Error('Missing race.external_id');
  }
  const race = await upsertRaceFromProvider(payload.race);
  const raceId = race.id;
  for (const update of payload.updates || []) {
    const inserted = await insertRaceUpdateIfNew(raceId, update);
    if (inserted) {
      io.to(`race:${raceId}`).emit('liverace:update', inserted);
    }
  }
  if (Array.isArray(payload.leaderboard) && payload.leaderboard.length) {
    await replaceLeaderboard(raceId, payload.leaderboard);
    io.to(`race:${raceId}`).emit('leaderboard:update');
  }
}

// --- Example provider adapter ---
function mapExampleProviderPayload(raw) {
  return {
    provider: 'example-feed',
    race: {
      external_id: raw.race.id,
      name: raw.race.name,
      stage: raw.race.stage_name,
      status: raw.race.status
    },
    updates: (raw.events || []).map((evt) => ({
      external_id: evt.id,
      type: evt.kind,
      title: evt.headline,
      message: evt.description,
      rider_name: evt.rider?.name || '',
      team: evt.rider?.team || '',
      km_to_go: evt.km_remaining ?? null,
      timestamp: evt.occurred_at
    })),
    leaderboard: (raw.gc || []).map((row) => ({
      position: row.rank,
      rider_name: row.rider_name,
      team: row.team_name || '',
      time: row.gap || '0:00'
    }))
  };
}

// --- Example webhook endpoint for provider ---
app.post('/api/webhooks/provider-example', async (req, res) => {
  try {
    const normalized = mapExampleProviderPayload(req.body);
    await processProviderPayload(normalized);
    res.json({ success: true });
  } catch (err) {
    console.error('Provider webhook error:', err);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

// --- Example polling ingest for provider ---
async function fetchExampleProviderData() {
  // Replace with real provider fetch
  return {
    race: { id: 'ext_race_123', name: 'Volta Catalunya', stage_name: 'Stage 3', status: 'live' },
    events: [
      {
        id: 'evt_1001', kind: 'attack', headline: 'Attack by Pogacar', description: 'Strong acceleration on the climb.',
        rider: { name: 'T. Pogacar', team: 'UAE' }, km_remaining: 32, occurred_at: '2026-04-19T18:30:00Z'
      }
    ],
    gc: [
      { rank: 1, rider_name: 'T. Pogacar', team_name: 'UAE', gap: '0:00' },
      { rank: 2, rider_name: 'J. Vingegaard', team_name: 'Visma', gap: '+0:12' }
    ]
  };
}

function startExampleProviderPolling() {
  setInterval(async () => {
    try {
      const raw = await fetchExampleProviderData();
      const normalized = mapExampleProviderPayload(raw);
      await processProviderPayload(normalized);
    } catch (err) {
      console.error('Provider poll error:', err);
    }
  }, 5000);
}
// --- GET /api/leaderboard ---
app.get('/api/leaderboard', async (req, res) => {
  const { race_id } = req.query;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM leaderboard
       WHERE race_id = $1
       ORDER BY position ASC`,
      [race_id]
    );

    res.json({ success: true, riders: rows });
  } catch (err) {
    console.error('GET leaderboard error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// --- POST /api/leaderboard (admin only) ---
app.post('/api/leaderboard', postLimiter, requireAuth, requireAdmin, async (req, res) => {
  const { race_id, riders } = req.body;

  if (!race_id || !Array.isArray(riders)) {
    return res.status(400).json({
      success: false,
      error: 'race_id and riders[] required'
    });
  }

  try {
    // clear old standings
    await pool.query(`DELETE FROM leaderboard WHERE race_id = $1`, [race_id]);

    for (const r of riders) {
      await pool.query(
        `INSERT INTO leaderboard (id, race_id, rider_name, team, position, time)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          generateId('lb'),
          race_id,
          r.rider_name,
          r.team || '',
          r.position,
          r.time || ''
        ]
      );
    }

    io.to(`race:${race_id}`).emit('leaderboard:update');

    res.json({ success: true });

  } catch (err) {
    console.error('POST leaderboard error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update leaderboard'
    });
  }
});

  // Seed a default race if none exist
  const existing = await pool.query(`SELECT id FROM races LIMIT 1`);
  if (!existing.rows.length) {
    await pool.query(
      `INSERT INTO races (id, name, stage)
       VALUES ($1, $2, $3)`,
      ['race_2026_stage_1', 'Stage 1', 'Stage 1']
    );
  }
}
// --- GET /api/races ---
app.get('/api/races', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM races ORDER BY created_at DESC`
    );
    res.json({
      success: true,
      races: rows
    });
  } catch (err) {
    console.error('GET /api/races error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch races'
    });
  }
});

function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}


app.get('/', (req, res) => {
  res.send('ok');
});

// --- Health check route for diagnostics panel ---
app.get('/health', (req, res) => {
  db.get('SELECT 1 as ok', [], (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        status: 'degraded',
        database: 'down',
        socket: 'running',
        error: 'Database check failed'
      });
    }

    res.json({
      success: true,
      status: 'ok',
      database: 'up',
      socket: 'running',
      timestamp: new Date().toISOString()
    });
  });
});

app.get('/api/race-updates', async (req, res) => {
  const { race_id } = req.query;
  let sql = `SELECT * FROM race_updates WHERE is_published = TRUE`;
  const params = [];
  if (race_id) {
    sql += ` AND race_id = $1`;
    params.push(race_id);
  }
  sql += ` ORDER BY "timestamp" DESC, created_at DESC`;
  try {
    const { rows } = await pool.query(sql, params);
    res.json({ success: true, updates: rows });
  } catch (err) {
    console.error('GET /api/race-updates error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch race updates' });
  }
});

app.post('/api/race-updates', async (req, res) => {
  const {
    race_id,
    type,
    title,
    message,
    rider_name,
    team,
    km_to_go,
    timestamp,
    is_published
  } = req.body;

  if (!race_id || !title || !message) {
    return res.status(400).json({
      success: false,
      error: 'race_id, title, and message are required'
    });
  }

  const update = {
    id: generateId('ru'),
    race_id,
    type: type || 'general',
    title,
    message,
    rider_name: rider_name || '',
    team: team || '',
    km_to_go: km_to_go ?? null,
    timestamp: timestamp || new Date().toISOString(),
    is_published: is_published === false ? 0 : 1
  };

  try {
    await pool.query(
      `INSERT INTO race_updates (
        id, race_id, type, title, message, rider_name, team, km_to_go, "timestamp", is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        update.id,
        update.race_id,
        update.type,
        update.title,
        update.message,
        update.rider_name,
        update.team,
     io.to(`race:${update.race_id}`).emit('liverace:update', update);
        update.timestamp,
        update.is_published
      ]
    );
    io.emit('liverace:update', update);
    res.json({ success: true, update });
  } catch (err) {
    console.error('POST /api/race-updates error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create race update' });
  }
});

app.get('/api/fan-zone', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM fan_zone_posts
       WHERE is_published = TRUE
       ORDER BY is_featured DESC, created_at DESC`
    );
    res.json({ success: true, posts: rows });
  } catch (err) {
    console.error('GET /api/fan-zone error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch fan zone posts' });
  }
});

app.post('/api/fan-zone', postLimiter, requireAuth, upload.single('media'), async (req, res) => {

  const {
    title,
    body,
    category,
    author_name,
    race_id,
    is_featured,
    is_published
  } = req.body;

  let mediaUrl = '';
  if (req.file) {
    mediaUrl = req.file.path;
  }

  if (!title || !body) {
    return res.status(400).json({
      success: false,
      error: 'title and body are required'
    });
  }

  const now = new Date().toISOString();

  const post = {
    id: generateId('fz'),
    title,
    body,
    category: category || 'general',
    media_url: mediaUrl || '',
    author_name: author_name || '',
    race_id: race_id || '',
    is_featured: is_featured ? 1 : 0,
    is_published: is_published === false ? 0 : 1,
    created_at: now,
    updated_at: now
  };

  try {
    await pool.query(
      `INSERT INTO fan_zone_posts (
        id, title, body, category, media_url, author_name, race_id,
        is_featured, is_published, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        post.id,
        post.title,
        post.body,
        post.category,
        post.media_url,
     io.to(`race:${post.race_id}`).emit('fanzone:update', post);
        post.race_id,
        post.is_featured,
        post.is_published,
        post.created_at,
        post.updated_at
      ]
    );
    io.emit('fanzone:update', post);
    res.json({ success: true, post });
  } catch (err) {
    console.error('POST /api/fan-zone error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create fan zone post' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (PROVIDER_API_KEY) {
    startProviderPolling();
  }
});
      connectRaceFeed();
    });
  })
  .catch((err) => {
    console.error('Database init failed:', err);
    process.exit(1);
  });
