import { Hono } from 'hono';
import 'dotenv/config';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import fs from 'fs';
import path from 'path';
import { projectsApi } from './routes/projects';
import { remarksApi } from './routes/remarks';
import { settingsApi } from './routes/settings';

const port = Number(process.env.STAND_PORT ?? 8013);

const app = new Hono();

app.route('/api/projects', projectsApi);
app.route('/api/remarks', remarksApi);
app.route('/api/settings', settingsApi);

app.get('/api/health', (c) => c.json({ status: 'ok', app: 'x5-vibe-stand' }));

if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(process.cwd(), 'dist');
  app.use('/*', serveStatic({ root: distDir }));
  app.get('*', (c) => {
    const htmlFile = path.join(distDir, 'index.html');
    if (!fs.existsSync(htmlFile)) return c.text('Build not found. Run npm run build', 500);
    return c.html(fs.readFileSync(htmlFile, 'utf-8'));
  });
}

console.log(`[x5-vibe-stand] http://localhost:${port}`);
serve({ fetch: app.fetch, port });
