const path = require('path');
const fs = require('fs');
const express = require('express');

const heroesRouter = require('./routes/heroes');
const mapsRouter = require('./routes/maps');
const statsRouter = require('./routes/stats');

const app = express();
const port = Number(process.env.PORT) || 3000;
const distDir = path.join(__dirname, '..', 'dist');
const indexFile = path.join(distDir, 'index.html');

app.disable('x-powered-by');
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/api/heroes', heroesRouter);
app.use('/api/maps', mapsRouter);
app.use('/api/stats', statsRouter);
app.get('/api/health', (_req, res) => res.json({ ok: true }));

if (fs.existsSync(indexFile)) {
  app.use(express.static(distDir));
  app.get('*splat', (_req, res) => res.sendFile(indexFile));
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: '데이터를 불러오는 중 문제가 발생했습니다.' });
});

app.listen(port, () => {
  console.log(`[OWGG] http://localhost:${port}`);
});
