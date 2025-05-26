import mongoose from 'mongoose';
import { logger } from '@/lib/logger';

const MONGODB_URI = process.env.MONGODB_URI;

// Add debug logging
logger.info('Database connection check', {
  environment: {
    hasMongoUri: !!MONGODB_URI,
    nodeEnv: process.env.NODE_ENV
  }
});

if (!MONGODB_URI) {
  logger.error('MongoDB URI missing', {
    error: 'MONGODB_URI is missing from environment variables'
  });
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    logger.info('Using existing database connection', { status: 'connected' });
    return;
  }

  try {
    logger.info('Connecting to MongoDB', { action: 'connect' });
    await mongoose.connect(MONGODB_URI as string);
    isConnected = true;
    logger.info('Connected to MongoDB successfully', { status: 'connected' });
  } catch (error) {
    logger.error('Error connecting to MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function disconnectDB() {
  if (!isConnected) {
    logger.info('No active database connection to disconnect', { status: 'disconnected' });
    return;
  }

  try {
    logger.info('Disconnecting from MongoDB', { action: 'disconnect' });
    await mongoose.disconnect();
    isConnected = false;
    logger.info('Disconnected from MongoDB successfully', { status: 'disconnected' });
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Export mongoose connection for direct access if needed
export const connection = mongoose.connection;

// Add connection event listeners
connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB', { status: 'connected' });
});

connection.on('error', (err) => {
  logger.error('Mongoose connection error', {
    error: err instanceof Error ? err.message : 'Unknown error',
    stack: err instanceof Error ? err.stack : undefined
  });
});

connection.on('disconnected', () => {
  logger.info('Mongoose disconnected from MongoDB', { status: 'disconnected' });
  isConnected = false;
});

// Handle process termination
process.on('SIGINT', async () => {
  try {
    logger.info('SIGINT received, closing MongoDB connection', { action: 'terminate' });
    await disconnectDB();
    logger.info('MongoDB connection closed due to application termination', { status: 'terminated' });
    process.exit(0);
  } catch (error) {
    logger.error('Error during application termination', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
});

export default connectDB; 