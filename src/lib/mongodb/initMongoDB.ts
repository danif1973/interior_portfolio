import mongoose from 'mongoose';
import { Project } from '@/lib/models/Project';
import { ensureAuthenticationCollectionExists } from '@/lib/models/authentication';

async function createDatabase(dbName: string) {
  try {
    console.log(`\nCreating database: ${dbName}`);
    // Create a temporary connection to create the database
    const tempConnection = await mongoose.createConnection(process.env.MONGODB_URI!, {
      dbName,
      bufferCommands: false
    });
    
    if (!tempConnection.db) {
      throw new Error('Failed to establish database connection');
    }
    
    // Create the database by creating a collection
    await tempConnection.db.createCollection('projects');
    console.log('✓ Database created successfully');
    
    // Close the temporary connection
    await tempConnection.close();
    return true;
  } catch (error) {
    console.error('Failed to create database:', error);
    return false;
  }
}

async function databaseExists(dbName: string): Promise<boolean> {
  try {
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    // List all databases
    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();
    
    // Check if our database exists
    const exists = databases.some(db => db.name === dbName);
    console.log(`Database ${dbName} exists:`, exists);
    return exists;
  } catch (error) {
    console.error('Failed to check database existence:', error);
    return false;
  }
}

export async function initDatabase() {
  try {
    console.log('\n=== DATABASE INITIALIZATION STARTED ===');
    console.log('Step 1: Connecting to MongoDB...');
    
    // Extract database name from URI
    const uri = process.env.MONGODB_URI!;
    const dbName = uri.split('/').pop()?.split('?')[0];
    if (!dbName) {
      throw new Error('Could not extract database name from URI');
    }
    console.log(`Database name: ${dbName}`);
    
    // Connect to MongoDB
    await mongoose.connect(uri, {
      dbName,
      bufferCommands: false
    });
    console.log('✓ Connected to MongoDB successfully');

    // Check if database exists
    const exists = await databaseExists(dbName);
    if (!exists) {
      console.log(`Database ${dbName} does not exist, creating...`);
      await createDatabase(dbName);
    } else {
      console.log(`Database ${dbName} already exists`);
    }

    // Create indexes
    console.log('\nStep 2: Creating database indexes...');
    console.log('Project schema:', Project.schema.obj);
    await Project.createIndexes();
    console.log('✓ Database indexes created successfully');

    // Verify connection and collections
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nStep 3: Checking collections...');
    console.log('Current collections:', collections.map(c => c.name));

    // Check if Project collection exists
    const projectCollectionExists = collections.some(c => c.name === 'projects');
    console.log('Project collection exists:', projectCollectionExists);

    // Check if authentication collection exists
    const authenticationCollectionExists = collections.some(c => c.name === 'authentication');
    console.log('Authentication collection exists:', authenticationCollectionExists);
    if (!authenticationCollectionExists) {
      console.log('Creating authentication collection...');
      await ensureAuthenticationCollectionExists();
      console.log('✓ Authentication collection created successfully');
    }

    if (!projectCollectionExists) {
      console.log('\nStep 4: Creating Project collection...');
      // Force collection creation by inserting and removing a document
      const tempProject = new Project({
        id: 'temp-' + Date.now(),
        title: 'Temporary Project',
        mainImage: { url: '/temp.jpg' },
        images: []
      });
      console.log('Creating temporary project:', tempProject);
      await tempProject.save();
      console.log('✓ Temporary project saved');
      await Project.deleteOne({ id: tempProject.id });
      console.log('✓ Temporary project removed');
      console.log('✓ Project collection created successfully');
    }

    // Verify the collection was created
    const updatedCollections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nFinal collections:', updatedCollections.map(c => c.name));

    console.log('\n=== DATABASE INITIALIZATION COMPLETED ===\n');
    return true;
  } catch (error) {
    console.error('\n❌ DATABASE INITIALIZATION FAILED:', error);
    throw error;
  }
}

// Export a function to check if the database is initialized
export async function isDatabaseInitialized() {
  try {
    console.log('\n=== CHECKING DATABASE STATUS ===');
    // Check if we can connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB...');
      
      // Extract database name from URI
      const uri = process.env.MONGODB_URI!;
      const dbName = uri.split('/').pop()?.split('?')[0];
      if (!dbName) {
        throw new Error('Could not extract database name from URI');
      }
      console.log(`Database name: ${dbName}`);
      
      await mongoose.connect(uri, {
        dbName,
        bufferCommands: false
      });
      console.log('✓ Connected to MongoDB successfully');
    }

    // Ensure we have a connection
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }

    // Check if the Project collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const projectCollectionExists = collections.some(c => c.name === 'projects');
    console.log('Project collection exists:', projectCollectionExists);
    console.log('Current collections:', collections.map(c => c.name));
    console.log('=== DATABASE STATUS CHECK COMPLETED ===\n');

    return projectCollectionExists;
  } catch (error) {
    console.error('❌ DATABASE CHECK FAILED:', error);
    return false;
  }
} 