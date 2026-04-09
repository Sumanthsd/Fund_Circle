import './config/loadEnv.js';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import apiRouter from './routes/index.js';
import { initDb } from './config/schemaInit.js';
import { dbPath } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 4000;

const missingEnv = [];
if (!process.env.CLERK_SECRET_KEY) missingEnv.push('CLERK_SECRET_KEY');
if (!process.env.CLERK_PUBLISHABLE_KEY) missingEnv.push('CLERK_PUBLISHABLE_KEY');

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (missingEnv.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnv.join(', ')}. Update backend/.env before starting the API.`
  );
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS'));
    },
  })
);
app.use(express.json());
app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    authorizedParties: allowedOrigins,
  })
);

try {
  await initDb();
} catch (error) {
  console.error('Failed to initialize the chit fund database.');
  console.error(`Tried SQLite database file at ${dbPath}.`);
  console.error('Check backend/.env SQLITE_DB_PATH and confirm the backend can write to that location.');
  process.exit(1);
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', apiRouter);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Chit Fund backend running on port ${PORT}`);
  console.log(`Using SQLite database at ${dbPath}`);
});
