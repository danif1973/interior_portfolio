import { NextRequest, NextResponse } from 'next/server';
import { Project } from '@/lib/models/Project';
import { logger } from '@/lib/logger';
import connectDB from '@/lib/mongodb/mongoDB';
import { validateProject } from '@/lib/validators/project';

// GET /api/projects
export async function GET() {
  try {
    logger.info('[ProjectsAPI] Fetching all projects', {
      action: 'get_all'
    });

    await connectDB();
    const projects = await Project.find().sort({ createdAt: -1 });
    
    // Map _id to id for frontend compatibility
    const projectsResponse = projects.map(project => ({
      ...project.toObject(),
      id: project._id.toString(),
      _id: undefined
    }));
    
    logger.info('[ProjectsAPI] Successfully fetched projects', {
      count: projects.length,
      action: 'get_all'
    });

    return NextResponse.json(projectsResponse);
  } catch (error) {
    logger.error('[ProjectsAPI] Error fetching projects', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'get_all'
    });
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects
export async function POST(request: NextRequest) {
  try {
    logger.info('[ProjectsAPI] Creating new project', {
      action: 'create'
    });

    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      logger.warn('[ProjectsAPI] Invalid content type for project creation', {
        contentType,
        action: 'create'
      });
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    logger.debug('[ProjectsAPI] Processing form data', {
      keys: Array.from(formData.keys()),
      action: 'create'
    });

    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;
    const description = formData.get('description') as string;
    const mainImageFile = formData.get('mainImage') as File;
    const newImages = formData.getAll('newImages') as File[];

    if (!title || !summary || !description || !mainImageFile) {
      logger.warn('[ProjectsAPI] Missing required fields', {
        hasTitle: !!title,
        hasSummary: !!summary,
        hasDescription: !!description,
        hasMainImage: !!mainImageFile,
        action: 'create'
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process main image
    let mainImage;
    try {
      const mainImageData = await mainImageFile.arrayBuffer();
      mainImage = {
        url: `/images/${mainImageFile.name}`,
        alt: title,
        description: summary,
        data: Buffer.from(mainImageData),
        contentType: mainImageFile.type
      };
      logger.debug('[ProjectsAPI] Processed main image', {
        name: mainImageFile.name,
        type: mainImageFile.type,
        size: mainImageData.byteLength,
        action: 'create'
      });
    } catch (e) {
      logger.error('[ProjectsAPI] Error parsing main image data', {
        error: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined,
        fileName: mainImageFile.name,
        fileType: mainImageFile.type,
        action: 'create'
      });
      return NextResponse.json(
        { error: 'Failed to process main image' },
        { status: 400 }
      );
    }

    // Process additional images
    const images = [];
    for (const imageFile of newImages) {
      try {
        const imageData = await imageFile.arrayBuffer();
        images.push({
          url: `/images/${imageFile.name}`,
          alt: title,
          description: summary,
          data: Buffer.from(imageData),
          contentType: imageFile.type
        });
        logger.debug('[ProjectsAPI] Processed additional image', {
          name: imageFile.name,
          type: imageFile.type,
          size: imageData.byteLength,
          action: 'create'
        });
      } catch (e) {
        logger.error('[ProjectsAPI] Error parsing image data', {
          error: e instanceof Error ? e.message : 'Unknown error',
          stack: e instanceof Error ? e.stack : undefined,
          fileName: imageFile.name,
          fileType: imageFile.type,
          action: 'create'
        });
        return NextResponse.json(
          { error: 'Failed to process image' },
          { status: 400 }
        );
      }
    }

    // Create project object
    const projectData = {
      title,
      summary,
      description,
      mainImage,
      images
    };

    // Validate project data
    try {
      await validateProject(projectData);
      logger.debug('[ProjectsAPI] Project data validated successfully', {
        action: 'create'
      });
    } catch (validationError) {
      logger.warn('[ProjectsAPI] Project validation failed', {
        error: validationError instanceof Error ? validationError.message : 'Unknown error',
        action: 'create'
      });
      return NextResponse.json(
        { error: validationError instanceof Error ? validationError.message : 'Invalid project data' },
        { status: 400 }
      );
    }

    // Save project to database
    await connectDB();
    const project = await Project.create(projectData);
    
    // Map _id to id for frontend compatibility
    const projectResponse = {
      ...project.toObject(),
      id: project._id.toString(),
      _id: undefined
    };
    
    logger.info('[ProjectsAPI] Project created successfully', {
      projectId: project._id,
      title: project.title,
      imageCount: project.images.length + 1, // +1 for main image
      action: 'create'
    });

    return NextResponse.json(projectResponse);
  } catch (error) {
    logger.error('[ProjectsAPI] Error creating project', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'create'
    });
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// Required for Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 