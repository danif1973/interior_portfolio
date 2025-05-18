import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/mongoDB';

export async function GET() {
  try {
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