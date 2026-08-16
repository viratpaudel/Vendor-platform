import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bodyParser from 'body-parser';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    type TEXT,
    location TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Vendor profiles
  db.run(`CREATE TABLE vendor_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    services TEXT,
    experience TEXT,
    portfolio TEXT,
    pricing TEXT,
    availability TEXT,
    verified BOOLEAN,
    rating REAL,
    review_count INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Projects
  db.run(`CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    contractor_id TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    budget TEXT,
    location TEXT,
    deadline TEXT,
    required_skills TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(contractor_id) REFERENCES users(id)
  )`);

  // Quotations
  db.run(`CREATE TABLE quotations (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    vendor_id TEXT,
    amount TEXT,
    description TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(vendor_id) REFERENCES users(id)
  )`);

  // Messages
  db.run(`CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT,
    recipient_id TEXT,
    project_id TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(recipient_id) REFERENCES users(id),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  )`);

  // Reviews
  db.run(`CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    from_user_id TEXT,
    to_user_id TEXT,
    project_id TEXT,
    rating REAL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(from_user_id) REFERENCES users(id),
    FOREIGN KEY(to_user_id) REFERENCES users(id),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  )`);
});

// Auth Routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, type, location, phone } = req.body;
  const id = uuidv4();

  db.run(
    'INSERT INTO users (id, email, password, name, type, location, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, email, password, name, type, location, phone],
    (err) => {
      if (err) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.json({ id, email, name, type });
    }
  );
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, row) => {
      if (err || !row) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.json(row);
    }
  );
});

// Vendor Profile Routes
app.post('/api/vendor/profile', (req, res) => {
  const { user_id, services, experience, portfolio, pricing, availability } = req.body;
  const id = uuidv4();

  db.run(
    'INSERT INTO vendor_profiles (id, user_id, services, experience, portfolio, pricing, availability, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, user_id, services, experience, portfolio, pricing, availability, false],
    (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ id, user_id });
    }
  );
});

app.get('/api/vendor/profile/:user_id', (req, res) => {
  db.get(
    'SELECT * FROM vendor_profiles WHERE user_id = ?',
    [req.params.user_id],
    (err, row) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json(row || {});
    }
  );
});

// Project Routes
app.post('/api/projects', (req, res) => {
  const { contractor_id, title, description, category, budget, location, deadline, required_skills } = req.body;
  const id = uuidv4();

  db.run(
    'INSERT INTO projects (id, contractor_id, title, description, category, budget, location, deadline, required_skills, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, contractor_id, title, description, category, budget, location, deadline, required_skills, 'open'],
    (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ id });
    }
  );
});

app.get('/api/projects', (req, res) => {
  db.all(
    'SELECT p.*, u.name as contractor_name FROM projects p JOIN users u ON p.contractor_id = u.id ORDER BY p.created_at DESC',
    (err, rows) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
});

app.get('/api/projects/:id', (req, res) => {
  db.get(
    'SELECT p.*, u.name as contractor_name FROM projects p JOIN users u ON p.contractor_id = u.id WHERE p.id = ?',
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json(row || {});
    }
  );
});

// Quotation Routes
app.post('/api/quotations', (req, res) => {
  const { project_id, vendor_id, amount, description } = req.body;
  const id = uuidv4();

  db.run(
    'INSERT INTO quotations (id, project_id, vendor_id, amount, description, status) VALUES (?, ?, ?, ?, ?, ?)',
    [id, project_id, vendor_id, amount, description, 'pending'],
    (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ id });
    }
  );
});

app.get('/api/quotations/:project_id', (req, res) => {
  db.all(
    'SELECT q.*, u.name as vendor_name, vp.rating FROM quotations q JOIN users u ON q.vendor_id = u.id LEFT JOIN vendor_profiles vp ON u.id = vp.user_id WHERE q.project_id = ?',
    [req.params.project_id],
    (err, rows) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
});

app.put('/api/quotations/:id', (req, res) => {
  const { status } = req.body;

  db.run(
    'UPDATE quotations SET status = ? WHERE id = ?',
    [status, req.params.id],
    (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// Message Routes
app.post('/api/messages', (req, res) => {
  const { sender_id, recipient_id, project_id, message } = req.body;
  const id = uuidv4();

  db.run(
    'INSERT INTO messages (id, sender_id, recipient_id, project_id, message) VALUES (?, ?, ?, ?, ?)',
    [id, sender_id, recipient_id, project_id, message],
    (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ id });
    }
  );
});

app.get('/api/messages/:project_id/:user_id', (req, res) => {
  db.all(
    'SELECT * FROM messages WHERE project_id = ? AND (sender_id = ? OR recipient_id = ?) ORDER BY created_at ASC',
    [req.params.project_id, req.params.user_id, req.params.user_id],
    (err, rows) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
});

// Review Routes
app.post('/api/reviews', (req, res) => {
  const { from_user_id, to_user_id, project_id, rating, comment } = req.body;
  const id = uuidv4();

  db.run(
    'INSERT INTO reviews (id, from_user_id, to_user_id, project_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
    [id, from_user_id, to_user_id, project_id, rating, comment],
    (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      // Update vendor rating
      db.run('SELECT AVG(rating) as avg_rating FROM reviews WHERE to_user_id = ?', [to_user_id], (err, result) => {
        if (!err && result) {
          db.run('UPDATE vendor_profiles SET rating = ? WHERE user_id = ?', [result.avg_rating, to_user_id], () => {});
        }
      });
      res.json({ id });
    }
  );
});

app.get('/api/reviews/:user_id', (req, res) => {
  db.all(
    'SELECT r.*, u.name as from_user_name FROM reviews r JOIN users u ON r.from_user_id = u.id WHERE r.to_user_id = ? ORDER BY r.created_at DESC',
    [req.params.user_id],
    (err, rows) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
});

// Search vendors
app.get('/api/vendors/search', (req, res) => {
  const { category, location } = req.query;

  let query = 'SELECT u.*, vp.* FROM users u JOIN vendor_profiles vp ON u.id = vp.user_id WHERE u.type = "vendor" AND vp.verified = 1';
  const params = [];

  if (category) {
    query += ' AND vp.services LIKE ?';
    params.push(`%${category}%`);
  }

  if (location) {
    query += ' AND u.location LIKE ?';
    params.push(`%${location}%`);
  }

  query += ' ORDER BY vp.rating DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// Add after the existing reviews table:

// Projects extended table
db.run(`CREATE TABLE IF NOT EXISTS project_details (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  experience_level TEXT,
  skills_required TEXT,
  attachments TEXT,
  project_scope TEXT,
  payment_method TEXT,
  contract_type TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(id)
)`);

// Vendor portfolios
db.run(`CREATE TABLE IF NOT EXISTS vendor_portfolio (
  id TEXT PRIMARY KEY,
  vendor_id TEXT,
  title TEXT,
  description TEXT,
  image_url TEXT,
  project_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vendor_id) REFERENCES users(id)
)`);

// Vendor certifications
db.run(`CREATE TABLE IF NOT EXISTS vendor_certifications (
  id TEXT PRIMARY KEY,
  vendor_id TEXT,
  certification_name TEXT,
  issuer TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  credential_url TEXT,
  FOREIGN KEY(vendor_id) REFERENCES users(id)
)`);

// Vendor testimonials
db.run(`CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  vendor_id TEXT,
  client_name TEXT,
  company TEXT,
  testimonial_text TEXT,
  rating REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vendor_id) REFERENCES users(id)
)`);

// Project milestones
db.run(`CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  title TEXT,
  description TEXT,
  due_date TEXT,
  status TEXT,
  payment_percentage REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id)
)`);

// Contracts
db.run(`CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  vendor_id TEXT,
  contractor_id TEXT,
  contract_text TEXT,
  status TEXT,
  signed_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(vendor_id) REFERENCES users(id),
  FOREIGN KEY(contractor_id) REFERENCES users(id)
)`);

// Payments
db.run(`CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  vendor_id TEXT,
  amount REAL,
  status TEXT,
  payment_method TEXT,
  milestone_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(vendor_id) REFERENCES users(id),
  FOREIGN KEY(milestone_id) REFERENCES milestones(id)
)`);
