import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/mongoDB';
import { Project } from '@/lib/models/Project';
import { v4 as uuidv4 } from 'uuid';

// GET /api/projects - List all projects
export async function GET() {
  try {
    await connectDB();
    const projects = await Project.find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .select('id title summary mainImage images'); // Include images array

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string | null;
    const description = formData.get('description') as string | null;
    const mainImageIndex = parseInt(formData.get('mainImageIndex') as string);

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Process and prepare images
    const images = [];
    let index = 0;
    while (formData.has(`image-${index}`)) {
      const imageFile = formData.get(`image-${index}`) as File | null;
      if (!imageFile) break;

      // Convert image to buffer
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      images.push({
        url: `data:${imageFile.type};base64,${buffer.toString('base64')}`,
        alt: `${title} - ${imageFile.name}`,
        description: '',
        data: buffer,
        contentType: imageFile.type
      });
      index++;
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      );
    }

    // Create project in MongoDB
    const project = await Project.create({
      id: `project-${uuidv4()}`,
      title,
      summary: summary || '',
      description: description || '',
      mainImage: images[mainImageIndex],
      images
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Required for Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 