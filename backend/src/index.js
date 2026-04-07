import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { prisma } from './lib/prisma.js';
import { env } from './lib/env.js';
import { redis } from './lib/redis.js';
import { authRouter } from './routes/auth.js';
import { coursesRouter } from './routes/courses.js';
import { enrollmentsRouter } from './routes/enrollments.js';
import { instructorRouter } from './routes/instructor.js';
import { certificatesRouter } from './routes/certificates.js';
import { upload } from './middleware/upload.js';
import { swaggerSpec } from './swagger.js';
import { mountApollo } from './graphql/apollo.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', async (req, res) => {
  const [db] = await prisma.$queryRaw`SELECT 1 as ok`;
  const redisEnabled = Boolean(env.REDIS_URL);
  const redisOk = redisEnabled ? await redis.ping().then(() => true).catch(() => false) : false;
  res.json({ ok: true, dbOk: Boolean(db?.ok), redisOk, redisEnabled });
});

app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/enrollments', enrollmentsRouter);
app.use('/api/instructor', instructorRouter);
app.use('/api/certificates', certificatesRouter);

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

await mountApollo(app);

app.use((err, req, res, next) => {
  void next;
  return res.status(500).json({ message: 'Server error' });
});

app.listen(env.PORT, () => {
  // Intentionally quiet
});
