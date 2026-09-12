import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './server/routes/apiRoutes.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const HOST = '0.0.0.0';

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Mount API routes first
  app.use('/api', apiRoutes);

  // OAuth Popup Callback Handler (as per OAuth Integration Skill)
  app.get(['/auth/google/callback', '/auth/callback', '/auth/google/callback/', '/auth/callback/'], (req, res) => {
    const code = req.query.code || 'authorized';
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Authentication Successful</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; }
            .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px; }
            .badge { display: inline-flex; padding: 0.25rem 0.75rem; background: #ecfdf5; color: #059669; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Google Verified</div>
            <h2 style="margin: 0 0 0.5rem 0;">Authentication Complete</h2>
            <p style="color: #64748b; font-size: 0.875rem;">Your Dedicated Researcher ID has been linked. You can close this window.</p>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', code: ${JSON.stringify(code)} }, '*');
                  setTimeout(() => window.close(), 700);
                } else {
                  window.location.href = '/';
                }
              } catch (e) {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `);
  });

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      platform: 'Bhu-Drishti Land Intelligence Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Bhu-Drishti] Server running on http://${HOST}:${PORT}`);
    console.log(`[Bhu-Drishti] API available at http://${HOST}:${PORT}/api`);
  });
}

startServer();
