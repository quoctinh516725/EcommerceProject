import app from './app';
import { env } from './config/env';
import prisma from './config/database';
import redis from './config/redis';

const PORT = env.PORT;

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  
  // Close Prisma connection
  await prisma.$disconnect();
  console.log('Prisma disconnected');
  
  // Close Redis connection
  redis.disconnect();
  console.log('Redis disconnected');
  
  process.exit(0);
};

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => {
    gracefulShutdown();
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown();
});

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

