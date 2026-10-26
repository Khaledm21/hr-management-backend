const { execSync } = require('child_process');

const fallbackUrl = 'postgresql://neondb_owner:npg_9lV3qhXWxiUN@ep-fragrant-voice-b4odem4r-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = fallbackUrl;
}

try {
  console.log('Running prisma generate with database URL configured...');
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('Prisma generate completed successfully.');
} catch (err) {
  console.error('Prisma generate failed:', err.message);
  process.exit(1);
}
