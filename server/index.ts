import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes/apiRoutes.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0
    ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      }
    : true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root welcome & API status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Bhu-Drishti Land Intelligence Platform (India)',
    version: '1.0.0',
    health: '/health',
    endpoints: {
      states: '/api/states',
      districts: '/api/districts',
      records: '/api/land-use/records',
      trends: '/api/land-use/trends',
      aiQuery: '/api/ai/query',
      health: '/health'
    }
  });
});

// API routing
app.use('/api', apiRoutes);

// Health check for Render / Cloud monitors
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Bhu-Drishti Land Intelligence Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, HOST, () => {
  console.log(`[LandIntel Server] Running on http://${HOST}:${PORT}`);
  console.log(`[LandIntel Server] API available at http://${HOST}:${PORT}/api`);
});
