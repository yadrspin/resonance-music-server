import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initDirectories, MUSIC_DIR, DATA_DIR } from './server/config.js';
import { seedSampleLibraryIfNeeded } from './server/audioGen.js';
import { playlistStore } from './server/playlists.js';
import { apiRouter } from './server/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Ensure directories exist safely
  initDirectories();

  // Populate sample music archive only if default internal library is used
  seedSampleLibraryIfNeeded();

  // Seed default playlist if none exists
  await playlistStore.seedDefaultPlaylistIfNeeded();

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API router
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      musicDir: MUSIC_DIR,
      dataDir: DATA_DIR,
      timestamp: new Date().toISOString()
    });
  });

  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath);

  if (hasDist) {
    // Production mode: Serve built static files
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`[Resonance Server] 🚀 Serving built interface from: ${distPath}`);
  } else {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log(`[Resonance Server] 🛠️ Dev server attached with Vite middlewares`);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================================`);
    console.log(`  🎵 Resonance Music Server is LIVE!`);
    console.log(`  Local address:   http://localhost:${PORT}`);
    console.log(`  Local IP:        http://127.0.0.1:${PORT}`);
    console.log(`  📁 Music folder: ${MUSIC_DIR}`);
    console.log(`========================================================\n`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[ОШИБКА] Порт ${PORT} уже занят другим приложением!`);
      console.error(`Запустите с другим портом: set PORT=3001 && start-windows.bat\n`);
    } else {
      console.error('Server listen error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
