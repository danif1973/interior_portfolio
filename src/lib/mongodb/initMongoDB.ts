import mongoose from 'mongoose';
import { MongoClient, Db } from 'mongodb';
import { Project } from '@/lib/models/Project';
import { ensureAuthenticationCollectionExists } from '@/lib/models/authentication';
import { logger } from '@/lib/logger';

const dbName = process.env.MONGODB_DB_NAME || 'interior-portfolio';

async function ensureDbConnection(): Promise<Db> {
  // Ensure we're connected to MongoDB
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }

  // Wait for connection to be ready
  if (mongoose.connection.readyState !== 1) {
    await new Promise<void>((resolve, reject) => {
      mongoose.connection.once('connected', () => resolve());
      mongoose.connection.once('error', (err) => reject(err));
    });
  }

  // At this point, we know the connection is established
  // and mongoose.connection.db is defined
  return mongoose.connection.db as Db;
}

export async function createDatabase() {
  let client: MongoClient | null = null;
  try {
    logger.info('Creating database', { 
      dbName,
      action: 'create'
    });

    // Connect to MongoDB without specifying a database
    client = await MongoClient.connect(process.env.MONGODB_URI as string);
    const adminDb = client.db('admin');
    
    // Create the database by creating a collection in it
    await adminDb.command({ createCollection: dbName });
    await client.close();
    client = null;
    
    logger.info('Database created successfully', {
      dbName,
      action: 'complete'
    });

    return await ensureDbConnection();
  } catch (error) {
    if (client) {
      await client.close();
    }
    logger.error('Failed to create database', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      dbName,
      action: 'create'
    });
    throw error;
  }
}

export async function checkDatabaseExists() {
  let client: MongoClient | null = null;
  try {
    logger.info('Checking database existence', {
      dbName,
      action: 'check'
    });

    client = await MongoClient.connect(process.env.MONGODB_URI as string);
    const adminDb = client.db('admin');
    const result = await adminDb.command({ listDatabases: 1 });
    await client.close();
    client = null;

    const exists = result.databases.some((d: { name: string }) => d.name === dbName);
    
    logger.info('Database existence check complete', {
      dbName,
      exists,
      action: 'complete'
    });

    return exists;
  } catch (error) {
    if (client) {
      await client.close();
    }
    logger.error('Failed to check database existence', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      dbName,
      action: 'check'
    });
    throw error;
  }
}

export async function initDatabase() {
  try {
    logger.info('Starting database initialization', {
      dbName,
      action: 'init'
    });

    // Step 1: Connect to MongoDB
    logger.info('Connecting to MongoDB', {
      step: 1,
      action: 'connect'
    });

    await mongoose.connect(process.env.MONGODB_URI as string);
    
    logger.info('Connected to MongoDB', {
      dbName,
      step: 1,
      action: 'complete'
    });

    // Check if database exists
    const exists = await checkDatabaseExists();
    if (!exists) {
      logger.info('Database does not exist, creating', {
        dbName,
        step: 1,
        action: 'create'
      });
      await createDatabase();
    } else {
      logger.info('Database already exists', {
        dbName,
        step: 1,
        action: 'skip'
      });
    }

    // Step 2: Create database indexes
    logger.info('Creating database indexes', {
      step: 2,
      action: 'create'
    });

    await Project.createIndexes();
    
    logger.info('Database indexes created successfully', {
      step: 2,
      action: 'complete'
    });

    // Step 3: Check collections
    logger.info('Checking collections', {
      step: 3,
      action: 'check'
    });

    const db = await ensureDbConnection();
    const collections = await db.listCollections().toArray();
    logger.debug('Current collections', {
      collections: collections.map(c => c.name),
      step: 3
    });

    const projectCollectionExists = collections.some(c => c.name === 'projects');
    const authenticationCollectionExists = collections.some(c => c.name === 'authentications');

    logger.info('Collection status check complete', {
      projectCollectionExists,
      authenticationCollectionExists,
      step: 3,
      action: 'complete'
    });

    // Create authentication collection if it doesn't exist
    if (!authenticationCollectionExists) {
      logger.info('Creating authentication collection', {
        step: 3,
        action: 'create'
      });
      await ensureAuthenticationCollectionExists();
      logger.info('Authentication collection created successfully', {
        step: 3,
        action: 'complete'
      });
    }

    // Step 4: Create Project collection if it doesn't exist
    if (!projectCollectionExists) {
      logger.info('Creating Project collection', {
        step: 4,
        action: 'create'
      });

      // Create a temporary project to ensure the collection is created
      const tempProject = {
        title: 'Temporary Project',
        summary: 'This is a temporary project to create the collection',
        description: 'This project will be removed immediately',
        mainImage: {
          url: '/images/placeholder.jpg',
          alt: 'Placeholder',
          description: 'Placeholder image',
          data: Buffer.from(''),
          contentType: 'image/jpeg'
        },
        images: []
      };

      logger.debug('Creating temporary project', {
        project: tempProject,
        step: 4
      });

      await Project.create(tempProject);
      logger.info('Temporary project saved', { step: 4 });

      // Remove the temporary project
      await Project.deleteOne({ title: 'Temporary Project' });
      logger.info('Temporary project removed', { step: 4 });

      logger.info('Project collection created successfully', {
        step: 4,
        action: 'complete'
      });
    }

    // Log final collections
    const updatedCollections = await db.listCollections().toArray();
    logger.info('Database initialization completed', {
      collections: updatedCollections.map(c => c.name),
      action: 'complete'
    });

  } catch (error) {
    logger.error('Database initialization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'init'
    });
    throw error;
  }
}

export async function isDatabaseInitialized() {
  try {
    logger.info('Checking database status', {
      dbName,
      action: 'check'
    });

    // Connect to MongoDB and ensure connection
    logger.info('Connecting to MongoDB', {
      action: 'connect'
    });

    const db = await ensureDbConnection();
    
    logger.info('Connected to MongoDB', {
      dbName,
      action: 'complete'
    });

    // Check collections
    const collections = await db.listCollections().toArray();
    const projectCollectionExists = collections.some(c => c.name === 'projects');
    
    logger.info('Database status check completed', {
      projectCollectionExists,
      collections: collections.map(c => c.name),
      action: 'complete'
    });

    return projectCollectionExists;
  } catch (error) {
    logger.error('Database status check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'check'
    });
    throw error;
  }
} 