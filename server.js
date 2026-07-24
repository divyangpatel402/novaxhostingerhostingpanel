import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const JWT_SECRET = 'super-secret-nova-key'; 

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { email: user.email } });
    });
});

app.get('/api/servers', (req, res) => {
    // Dummy servers for UI demo
    res.json([
        { id: 'srv_1', name: 'Survival SMP', type: 'Minecraft Java (Paper)', ram: '4GB', status: 'running', port: 25565 },
        { id: 'srv_2', name: 'Lobby', type: 'Minecraft Java (Spigot)', ram: '2GB', status: 'offline', port: 25566 },
        { id: 'srv_3', name: 'Discord Bot', type: 'Node.js', ram: '512MB', status: 'running', port: null }
    ]);
});

// Frontend Routes
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/billing', (req, res) => res.sendFile(path.join(__dirname, 'public', 'billing.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Nova Panel Backend running on http://localhost:${PORT}`);
});
