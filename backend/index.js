// backend/index.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET = 'change_this_to_a_secure_secret!';
const dbFile = path.join(__dirname, 'db.sqlite');
const db = new Database(dbFile);

// Initialize tables
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    customer TEXT,
    phone TEXT,
    items INTEGER,
    status TEXT,
    estReady TEXT,
    notes TEXT
  )
`).run();

// Seed admin user if not exists
const existing = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!existing) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(
    'admin', 'admin', 'Master Admin'
  );
}

// JWT helpers
function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}

// Authentication endpoints
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?')
    .get(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signToken({ id: user.id, username: user.username, role: user.role });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

app.post('/api/signup', (req, res) => {
  const { username, password, role = 'Customer' } = req.body;
  try {
    const info = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run(username, password, role);
    const token = signToken({ id: info.lastInsertRowid, username, role });
    res.json({ token, user: { id: info.lastInsertRowid, username, role } });
  } catch (err) {
    return res.status(400).json({ error: 'Username already exists' });
  }
});

// Middleware to protect routes
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  const token = auth.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  req.user = payload;
  next();
}

// Order routes
app.get('/api/orders', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/orders', requireAuth, (req, res) => {
  const { customer, phone, items, status = 'Collected', estReady = '', notes = '' } = req.body;
  const result = db.prepare(`
    INSERT INTO orders (customer, phone, items, status, estReady, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(customer, phone, items, status, estReady, notes);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  res.json(order);
});

app.put('/api/orders/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const { customer, phone, items, status, estReady, notes } = req.body;
  db.prepare(`
    UPDATE orders
    SET customer = ?, phone = ?, items = ?, status = ?, estReady = ?, notes = ?
    WHERE id = ?
  `).run(customer, phone, items, status, estReady, notes, id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json(order);
});

app.delete('/api/orders/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  res.json({ ok: true });
});

// Export orders as CSV
app.get('/api/orders-export', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  const header = 'ID,Customer,Phone,Items,Status,EstReady\n';
  const body = rows.map(r => {
    // wrap text fields in quotes
    return `${r.id},"${r.customer}","${r.phone}",${r.items},"${r.status}","${r.estReady}"`;
  }).join('\n');
  const csv = header + body;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
  res.send(csv);
});

// Invoice PDF endpoint
app.get('/api/orders/:id/invoice', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).send('Order not found');

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice_${id}.pdf`);

  doc.fontSize(20).text('Invoice', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Order ID: ${order.id}`);
  doc.text(`Customer: ${order.customer}`);
  doc.text(`Phone: ${order.phone}`);
  doc.text(`Items: ${order.items}`);
  doc.text(`Status: ${order.status}`);
  doc.text(`Estimated Ready: ${order.estReady}`);
  doc.end();

  doc.pipe(res);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend API is running on http://localhost:${PORT}`);
});
