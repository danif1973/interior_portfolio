import mongoose from 'mongoose';
import { initDatabase, isDatabaseInitialized } from './initMongoDB';

const MONGODB_URI = process.env.MONGODB_URI!;

// Add debug logging
console.log('\n=== DATABASE CONNECTION CHECK ===');
console.log('Environment variables loaded:', {
  MONGODB_URI: MONGODB_URI ? 'Present (hidden for security)' : 'Missing',
  NODE_ENV: process.env.NODE_ENV
});

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is missing from environment variables');
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    console.log('✓ Using existing database connection');
    return cached.conn;
  }

  if (!cached.promise) {
    // Extract database name from URI
    const dbName = MONGODB_URI.split('/').pop()?.split('?')[0];
    if (!dbName) {
      throw new Error('Could not extract database name from URI');
    }

    const opts = {
      bufferCommands: false,
      dbName // Add the database name to connection options
    };

    console.log('\n=== INITIALIZING DATABASE CONNECTION ===');
    console.log('Attempting to connect to database:', dbName);
    console.log('Connection string:', MONGODB_URI.split('@')[0] + '@***');

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      console.log('✓ Initial database connection established');
      
      // Initialize database if needed
      const isInitialized = await isDatabaseInitialized();
      console.log('Database initialized:', isInitialized);
      
      if (!isInitialized) {
        console.log('Initializing database...');
        await initDatabase();
        console.log('✓ Database initialization complete');
      }
      
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ Database connection failed:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB; 