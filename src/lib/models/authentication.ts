import { Schema, Document, model } from 'mongoose';
import mongoose from 'mongoose';
import { logger } from '@/lib/logger';

export interface IAuthentication extends Document {
  key: string; // e.g., 'admin_password'
  value: string; // bcrypt hash
  sessions?: { 
    token: string; 
    createdAt: Date;
    expiresAt: Date;  // Add expiration field
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AuthenticationSchema = new Schema<IAuthentication>({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  value: {
    type: String,
    required: true,
  },
  sessions: [
    {
      token: { type: String, required: true },
      createdAt: { type: Date, required: true },
      expiresAt: { type: Date, required: true }  // Add expiration field
    }
  ]
}, {
  timestamps: true,
  collection: 'authentication',
  strict: false  // Allow schema updates
});

// Add TTL index for automatic cleanup
AuthenticationSchema.index({ 'sessions.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Force schema updates
AuthenticationSchema.pre('save', function(next) {
  if (this.isModified('sessions')) {
    // Ensure each session has expiresAt
    if (Array.isArray(this.sessions)) {
      this.sessions = this.sessions.map(session => ({
        ...session,
        expiresAt: session.expiresAt || new Date(session.createdAt.getTime() + 24 * 60 * 60 * 1000)
      }));
    }
  }
  next();
});

// Export the model
const Authentication = mongoose.models.Authentication || model<IAuthentication>('Authentication', AuthenticationSchema);
export default Authentication;

// Function to ensure the authentication collection exists and has proper indexes
export async function ensureAuthenticationCollectionExists() {
  try {
    logger.info('Ensuring authentication collection exists', {
      action: 'init'
    });

    // Check if the collection exists
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collections = await db.listCollections({ name: 'authentications' }).toArray();
    const collectionExists = collections.length > 0;

    if (!collectionExists) {
      logger.info('Creating authentication collection', {
        action: 'create'
      });
      await Authentication.createCollection();
      logger.info('Authentication collection created', {
        action: 'complete'
      });
    }

    // Update existing sessions to include expiresAt if they don't have it
    const result = await Authentication.updateMany(
      { expiresAt: { $exists: false } },
      { $set: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } }
    );

    if (result.modifiedCount > 0) {
      logger.info('Updated existing sessions with expiresAt', {
        modifiedCount: result.modifiedCount,
        action: 'update'
      });
    }

    // Drop existing TTL index if it exists
    try {
      await Authentication.collection.dropIndex('expiresAt_1');
      logger.info('Dropped existing TTL index', {
        action: 'drop'
      });
    } catch (dropError) {
      if (dropError instanceof Error && dropError.message.includes('index not found')) {
        logger.debug('No existing TTL index to drop', {
          error: dropError.message,
          action: 'skip'
        });
      } else {
        logger.warn('Error dropping TTL index', {
          error: dropError instanceof Error ? dropError.message : 'Unknown error',
          stack: dropError instanceof Error ? dropError.stack : undefined,
          action: 'drop'
        });
      }
    }

    // Create new TTL index
    await Authentication.collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );
    logger.info('Created TTL index on sessions.expiresAt', {
      action: 'create'
    });

    return true;
  } catch (error) {
    logger.error('Failed to ensure authentication collection exists', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'init'
    });
    throw error;
  }
}

// Function to drop the authentication collection
export async function dropAuthenticationCollection() {
  try {
    logger.info('Dropping authentication collection', {
      action: 'drop'
    });

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collections = await db.listCollections({ name: 'authentications' }).toArray();
    if (collections.length === 0) {
      logger.info('No existing authentication collection to drop', {
        action: 'skip'
      });
      return;
    }

    await Authentication.collection.drop();
    logger.info('Authentication collection dropped successfully', {
      action: 'complete'
    });
  } catch (error) {
    logger.error('Failed to drop authentication collection', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'drop'
    });
    throw error;
  }
}

// Function to create a fresh authentication collection
export async function createAuthenticationCollection() {
  try {
    logger.info('Creating fresh authentication collection', {
      action: 'create'
    });

    await dropAuthenticationCollection();
    await ensureAuthenticationCollectionExists();
    
    logger.info('Created fresh authentication collection', {
      action: 'complete'
    });
  } catch (error) {
    logger.error('Failed to create fresh authentication collection', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'create'
    });
    throw error;
  }
} 