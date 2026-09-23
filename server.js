import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chatHandler from './api/chat.js';
import healthHandler from './api/health.js';

const directory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(directory, '.env') });
const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '32kb' }));
app.all('/api/chat', chatHandler);
app.all('/api/health', healthHandler);
app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'The request is too large.' });
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Send a valid JSON request.' });
  next(error);
});

app.listen(port, () => console.log(`API server running on http://localhost:${port}`));
