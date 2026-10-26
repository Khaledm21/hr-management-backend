import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env first if exists, else load .env.production
if (fs.existsSync(path.resolve(process.cwd(), '.env'))) {
  dotenv.config();
} else if (fs.existsSync(path.resolve(process.cwd(), '.env.production'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
}

const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_9lV3qhXWxiUN@ep-fragrant-voice-b4odem4r-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'production',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173,https://hr-management-frontend-lyart.vercel.app',
  databaseUrl: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'enterprise_super_secret_jwt_key_2026_@apex_hr',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
