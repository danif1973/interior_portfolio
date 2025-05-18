import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/mongoDB';
import { Project } from '@/lib/models/Project';

export async function GET() {
  try {
    // Test database connection
    await connectDB();
    console.log('✅ MongoDB connection successful');

    // Test creating a sample project
    const testProject = await Project.create({
      id: 'test-project',
      title: 'Test Project',
      summary: 'This is a test project',
      description: 'Testing MongoDB connection',
      mainImage: {
        url: '/test-image.jpg',
        alt: 'Test Image',
        description: 'Test image description'
      },
      images: [{
        url: '/test-image.jpg',
        alt: 'Test Image',
        description: 'Test image description'
      }]
    });
    console.log('✅ Test project created:', testProject);

    // Test reading the project
    const foundProject = await Project.findOne({ id: 'test-project' });
    console.log('✅ Test project retrieved:', foundProject);

    // Clean up - delete test project
    await Project.deleteOne({ id: 'test-project' });
    console.log('✅ Test project deleted');

    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB connection test successful',
      details: {
        connection: 'Connected',
        create: 'Success',
        read: 'Success',
        delete: 'Success'
      }
    });
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 