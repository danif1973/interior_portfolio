import { NextRequest, NextResponse } from 'next/server';
import { Project } from '@/lib/models/Project';
import { logger } from '@/lib/logger';
import connectDB from '@/lib/mongodb/mongoDB';

// GET /api/projects/[id] - Get project details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('[ProjectAPI] Fetching project', {
      action: 'get',
      projectId: params.id
    });

    await connectDB();
    const project = await Project.findById(params.id);

    if (!project) {
      logger.warn('[ProjectAPI] Project not found', {
        action: 'get',
        projectId: params.id
      });
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Map _id to id for frontend compatibility
    const projectResponse = {
      ...project.toObject(),
      id: project._id.toString(),
      _id: undefined
    };

    logger.info('[ProjectAPI] Project fetched successfully', {
      action: 'get',
      projectId: params.id,
      title: project.title
    });

    return NextResponse.json(projectResponse);
  } catch (error) {
    logger.error('[ProjectAPI] Error fetching project', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'get',
      projectId: params.id
    });
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('[ProjectAPI] Starting project update', {
      action: 'update',
      projectId: params.id
    });

    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      logger.warn('[ProjectAPI] Invalid content type for project update', {
        contentType,
        action: 'update',
        projectId: params.id
      });
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    logger.debug('[ProjectAPI] Processing form data', {
      keys: Array.from(formData.keys()),
      action: 'update',
      projectId: params.id
    });

    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;
    const description = formData.get('description') as string;
    const mainImageIndex = parseInt(formData.get('mainImageIndex') as string) || 0;

    logger.debug('[ProjectAPI] Received update data', {
      hasTitle: !!title,
      hasSummary: !!summary,
      hasDescription: !!description,
      mainImageIndex,
      action: 'update',
      projectId: params.id
    });

    // Process existing images
    const images = [];
    let index = 0;
    while (formData.has(`existing-image-${index}`)) {
      try {
        const imageData = formData.get(`existing-image-${index}`) as string;
        const image = JSON.parse(imageData);
        images.push(image);
        logger.debug('[ProjectAPI] Processed existing image', {
          index,
          imageUrl: image.url,
          action: 'update',
          projectId: params.id
        });
      } catch (e) {
        logger.error('[ProjectAPI] Error parsing existing image', {
          error: e instanceof Error ? e.message : 'Unknown error',
          stack: e instanceof Error ? e.stack : undefined,
          index,
          action: 'update',
          projectId: params.id
        });
        return NextResponse.json(
          { error: 'Failed to process existing image' },
          { status: 400 }
        );
      }
      index++;
    }

    // Process new images
    index = 0;
    let imageFile: File | null = null;
    while (formData.has(`new-image-${index}`)) {
      try {
        imageFile = formData.get(`new-image-${index}`) as File;
        logger.debug('[ProjectAPI] Processing new image', {
          index,
          fileName: imageFile.name,
          fileType: imageFile.type,
          action: 'update',
          projectId: params.id
        });

        const imageData = await imageFile.arrayBuffer();
        images.push({
          url: `/images/${imageFile.name}`,
          alt: title,
          description: summary,
          data: Buffer.from(imageData),
          contentType: imageFile.type
        });
      } catch (e) {
        logger.error('[ProjectAPI] Error parsing image data', {
          error: e instanceof Error ? e.message : 'Unknown error',
          stack: e instanceof Error ? e.stack : undefined,
          index,
          fileName: imageFile?.name || 'unknown',
          fileType: imageFile?.type || 'unknown',
          action: 'update',
          projectId: params.id
        });
        return NextResponse.json(
          { error: 'Failed to process new image' },
          { status: 400 }
        );
      }
      index++;
    }

    logger.debug('[ProjectAPI] Image processing complete', {
      totalImages: images.length,
      mainImageIndex,
      action: 'update',
      projectId: params.id
    });

    // Update project
    const updateData = {
      ...(title && { title }),
      ...(summary && { summary }),
      ...(description && { description }),
      ...(images.length > 0 && { images }),
      mainImageIndex
    };

    logger.debug('[ProjectAPI] Updating project with data', {
      updateFields: Object.keys(updateData),
      action: 'update',
      projectId: params.id
    });

    await connectDB();
    const updatedProject = await Project.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedProject) {
      logger.warn('[ProjectAPI] Project not found for update', {
        action: 'update',
        projectId: params.id
      });
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Map _id to id for frontend compatibility
    const projectResponse = {
      ...updatedProject.toObject(),
      id: updatedProject._id.toString(),
      _id: undefined
    };

    logger.info('[ProjectAPI] Project updated successfully', {
      action: 'update',
      projectId: params.id,
      title: updatedProject.title,
      imageCount: updatedProject.images.length
    });

    return NextResponse.json(projectResponse);
  } catch (error) {
    logger.error('[ProjectAPI] Error updating project', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'update',
      projectId: params.id
    });
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('[ProjectAPI] Starting project deletion', {
      action: 'delete',
      projectId: params.id
    });

    await connectDB();
    const deletedProject = await Project.findByIdAndDelete(params.id);

    if (!deletedProject) {
      logger.warn('[ProjectAPI] Project not found for deletion', {
        action: 'delete',
        projectId: params.id
      });
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Map _id to id for frontend compatibility
    const projectResponse = {
      ...deletedProject.toObject(),
      id: deletedProject._id.toString(),
      _id: undefined
    };

    logger.info('[ProjectAPI] Project deleted successfully', {
      action: 'delete',
      projectId: params.id,
      title: deletedProject.title
    });

    return NextResponse.json({ message: 'Project deleted successfully', project: projectResponse });
  } catch (error) {
    logger.error('[ProjectAPI] Error deleting project', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'delete',
      projectId: params.id
    });
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

// Required for Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 