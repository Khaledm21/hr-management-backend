import { app } from './app';
import { config } from './config/env';
import { prisma } from './db/prisma';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Enterprise HR Management System Backend Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
  console.log(`🌐 CORS Enabled For: ${config.corsOrigin}`);
  console.log(`📁 Environment: ${config.nodeEnv}`);
  console.log(`=======================================================`);
});

// Graceful Shutdown
async function shutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('🚪 HTTP server closed.');
    await prisma.$disconnect();
    console.log('🗄️ Database connection closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️ Forcefully terminating after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
