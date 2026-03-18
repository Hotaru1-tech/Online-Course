import 'dotenv/config';
import { spawn } from 'node:child_process';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runWithRetry(label, fn, { attempts = 20, baseDelayMs = 500 } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      await fn();
      return;
    } catch (e) {
      lastErr = e;
      const delay = Math.min(15000, baseDelayMs * Math.pow(1.4, i - 1));
      console.error(`[start-migrate] ${label} failed (attempt ${i}/${attempts}). Retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

await runWithRetry('prisma db push', () => run('npx', ['prisma', 'db', 'push']), {
  attempts: Number(process.env.DB_RETRY_ATTEMPTS || 25),
  baseDelayMs: Number(process.env.DB_RETRY_DELAY_MS || 500)
});

if (process.env.SEED === 'true') {
  await runWithRetry('seed', () => run('node', ['prisma/seed.js']), {
    attempts: 5,
    baseDelayMs: 1000
  });
}

await run('node', ['dist/index.js']);
