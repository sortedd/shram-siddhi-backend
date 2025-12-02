const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const { dbOperations, initializeDatabase, supabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

if (!JWT_SECRET) {
    console.error('⚠️  WARNING: JWT_SECRET not set in .env file!');
}

// Update CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://shram-siddhi-frontend.vercel.app',
    'https://www.shramsiddhi.com',
    'https://shramsiddhi.com',
    FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list OR is a Vercel preview URL
        const isAllowed = allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// Trust proxy (required for Vercel/behind reverse proxy)
app.set('trust proxy', 1);

// Rate limiting with proxy support
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    // Use forwarded headers from Vercel
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    // Use forwarded headers from Vercel
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    }
});
app.use('/api/auth/login', authLimiter);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Root route
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>🚀 Shram Siddhi API is Running</h1>
            <p>This is the backend server. It provides data to the frontend application.</p>
            <p>To view the application, visit: <a href="${FRONTEND_URL}">${FRONTEND_URL}</a></p>
            <p>Health Check: <a href="/api/health">/api/health</a></p>
        </div>
    `);
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Shram Siddhi API is running' });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await dbOperations.users.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Worker routes
app.get('/api/workers', authenticateToken, async (req, res) => {
    try {
        const workers = await dbOperations.workers.getAll();
        res.json(workers);
    } catch (error) {
        console.error('Get workers error:', error);
        res.status(500).json({ error: 'Failed to fetch workers' });
    }
});

app.get('/api/workers/:id', authenticateToken, async (req, res) => {
    try {
        const worker = await dbOperations.workers.getById(req.params.id);
        if (!worker) {
            return res.status(404).json({ error: 'Worker not found' });
        }
        res.json(worker);
    } catch (error) {
        console.error('Get worker error:', error);
        res.status(500).json({ error: 'Failed to fetch worker' });
    }
});

app.post('/api/workers', async (req, res) => {
    try {
        const result = await dbOperations.workers.create(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Create worker error:', error);
        if (error.code === '23505') {
            res.status(400).json({ error: 'Aadhaar number already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create worker' });
        }
    }
});

app.put('/api/workers/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const result = await dbOperations.workers.updateStatus(req.params.id, status);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        res.json({ message: 'Worker status updated successfully' });
    } catch (error) {
        console.error('Update worker status error:', error);
        res.status(500).json({ error: 'Failed to update worker status' });
    }
});

app.put('/api/workers/:id/verification', authenticateToken, async (req, res) => {
    try {
        const { verified } = req.body;
        const result = await dbOperations.workers.updateVerification(req.params.id, verified);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        res.json({ message: 'Worker verification updated successfully' });
    } catch (error) {
        console.error('Update worker verification error:', error);
        res.status(500).json({ error: 'Failed to update worker verification' });
    }
});

// Statistics routes
app.get('/api/statistics', authenticateToken, async (req, res) => {
    try {
        const stats = await dbOperations.workers.getStatistics();
        res.json(stats);
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

app.get('/api/analytics/:period', authenticateToken, async (req, res) => {
    try {
        const { period } = req.params;
        const analytics = await dbOperations.workers.getAnalytics(period);
        res.json(analytics);
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Client request routes
app.get('/api/client-requests', authenticateToken, async (req, res) => {
    try {
        const requests = await dbOperations.clientRequests.getAll();
        res.json(requests);
    } catch (error) {
        console.error('Get client requests error:', error);
        res.status(500).json({ error: 'Failed to fetch client requests' });
    }
});

app.post('/api/client-requests', async (req, res) => {
    try {
        const result = await dbOperations.clientRequests.create(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Create client request error:', error);
        res.status(500).json({ error: 'Failed to create client request' });
    }
});

app.put('/api/client-requests/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const result = await dbOperations.clientRequests.updateStatus(req.params.id, status);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({ message: 'Request status updated successfully' });
    } catch (error) {
        console.error('Update client request status error:', error);
        res.status(500).json({ error: 'Failed to update request status' });
    }
});

// Contact Us route
app.post('/api/contact', async (req, res) => {
    try {
        const result = await dbOperations.contactRequests.create(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Create contact request error:', error);
        res.status(500).json({ error: 'Failed to submit contact request' });
    }
});

// Franchise Application route
app.post('/api/franchise', async (req, res) => {
    try {
        const result = await dbOperations.franchiseApplications.create(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Create franchise application error:', error);
        res.status(500).json({ error: 'Failed to submit franchise application' });
    }
});

// Admin Routes (Database Viewer)
app.get('/api/admin/tables', authenticateToken, async (req, res) => {
    try {
        const tables = await dbOperations.admin.getTables();
        res.json(tables);
    } catch (error) {
        console.error('Get tables error:', error);
        res.status(500).json({ error: 'Failed to fetch tables' });
    }
});

app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await dbOperations.admin.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

app.get('/api/admin/table/:tableName', authenticateToken, async (req, res) => {
    try {
        const { tableName } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const result = await dbOperations.admin.getTableData(tableName, parseInt(limit), parseInt(offset));
        res.json(result);
    } catch (error) {
        console.error('Get table data error:', error);
        res.status(500).json({ error: 'Failed to fetch table data' });
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeDatabase();
});