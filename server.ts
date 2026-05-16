import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // In-memory store for temporary ICS files
  const calendarStore = new Map<string, { content: string; expiry: number }>();

  // Cleanup old entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [id, data] of calendarStore.entries()) {
      if (now > data.expiry) {
        calendarStore.delete(id);
      }
    }
  }, 60000);

  // API: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      uptime: process.uptime(),
      storeSize: calendarStore.size
    });
  });

  // API: Prepare Calendar
  app.post('/api/calendar/prepare', (req, res) => {
    const { icsContent } = req.body;
    console.log('--- Calendar Prepare Request ---');
    
    if (!icsContent) {
      console.error('Failure: Missing icsContent in request body');
      return res.status(400).json({ error: 'Missing content' });
    }

    const id = Math.random().toString(36).substring(2, 15);
    calendarStore.set(id, {
      content: icsContent,
      expiry: Date.now() + 300000 // 5 minutes
    });

    console.log(`Success: Stored calendar data with ID: ${id}. Content size: ${icsContent.length} bytes`);
    res.json({ id });
  });

  // API: Download Calendar
  app.get('/api/calendar/download/:id', (req, res) => {
    const { id } = req.params;
    console.log(`--- Calendar Download Request: ${id} ---`);
    
    // Support both ID and ID.ics formats just in case
    const cleanId = id.replace('.ics', '');
    const data = calendarStore.get(cleanId);

    if (!data) {
      console.error(`Failure: Calendar ID ${cleanId} not found or expired`);
      return res.status(404).json({ error: '日历链接已过期，请重试。' });
    }

    console.log(`Success: Serving file for ID: ${cleanId}`);
    res.setHeader('Content-Type', 'text/calendar;charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="david_tung_matrix.ics"');
    res.send(data.content);
  });

  console.log('Setting up middleware...');
  
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    console.log('Serving from static dist folder (Production Optimized)...');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      // Allow API routes to pass through
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('Using Vite middleware for development (Dist folder not found)...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    // Explicitly serve index.html for non-API routes when using Vite middleware mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api/')) return next();
      
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        console.error('Vite transform error:', e);
        res.status(500).end(e instanceof Error ? e.stack : String(e));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
