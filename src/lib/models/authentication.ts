import { Schema, Document, model } from 'mongoose';
import mongoose from 'mongoose';

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

// Add function to ensure TTL index exists and update schema
export async function ensureTTLIndex() {
  if (!mongoose.connection?.db) throw new Error('MongoDB connection is not established.');
  
  try {
    // Update all existing documents to include expiresAt
    const result = await Authentication.updateMany(
      { 'sessions.expiresAt': { $exists: false } },
      [
        {
          $set: {
            'sessions': {
              $map: {
                input: '$sessions',
                as: 'session',
                in: {
                  $mergeObjects: [
                    '$$session',
                    {
                      expiresAt: {
                        $add: ['$$session.createdAt', 24 * 60 * 60 * 1000] // 24 hours from createdAt
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      ]
    );
    console.log('Updated existing sessions with expiresAt:', result);

    // Drop existing TTL index if it exists
    try {
      await Authentication.collection.dropIndex('sessions.expiresAt_1');
      console.log('Dropped existing TTL index');
    } catch (dropError) {
      // Ignore error if index doesn't exist
      console.log('No existing TTL index to drop:', dropError instanceof Error ? dropError.message : 'Unknown error');
    }

    // Create the TTL index
    await Authentication.collection.createIndex(
      { 'sessions.expiresAt': 1 },
      { expireAfterSeconds: 0 }
    );
    console.log('Created TTL index on sessions.expiresAt');

    // Verify the index exists
    const indexes = await Authentication.collection.indexes();
    const hasTTLIndex = indexes.some(index => 
      index.key['sessions.expiresAt'] === 1 && 
      index.expireAfterSeconds === 0
    );
    
    if (!hasTTLIndex) {
      throw new Error('Failed to create TTL index');
    }
  } catch (error) {
    console.error('Error ensuring TTL index:', error);
    throw error;
  }
}

export async function ensureAuthenticationCollectionExists() {
  if (!mongoose.connection?.db) throw new Error('MongoDB connection is not established.');
  
  try {
    // Drop and recreate the collection to ensure schema is updated
    await mongoose.connection.db.dropCollection('authentication').catch(() => {
      console.log('No existing authentication collection to drop');
    });
    
    await mongoose.connection.createCollection('authentication');
    console.log('Created fresh authentication collection');
    
    // Ensure TTL index exists
    await ensureTTLIndex();
  } catch (error) {
    console.error('Error recreating authentication collection:', error);
    throw error;
  }
} 