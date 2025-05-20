import { NextResponse } from 'next/server';

// Use dynamic import for MongoDB connection
const getMongoDB = async () => {
  try {
    const { default: connectDB } = await import('@/lib/mongodb/mongoDB');
    return connectDB;
  } catch (error) {
    console.error('Failed to import MongoDB connection:', error);
    return null;
  }
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Check if we're in a build environment
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ 
      status: 'info', 
      message: 'Database test endpoint is available at runtime' 
    });
  }

  try {
    const connectDB = await getMongoDB();
    if (!connectDB) {
      throw new Error('Failed to initialize database connection');
    }

    console.log('\n=== TESTING DATABASE CONNECTION ===');
    await connectDB();
    return NextResponse.json({ status: 'success', message: 'Database connection successful' });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Database connection failed', error: String(error) },
      { status: 500 }
    );
  }
} 