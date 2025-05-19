import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, updateProject, deleteProject } from '@/lib/projects';
import { logger } from '@/lib/logger';

// GET /api/projects/[id] - Get project details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await getProjectById(params.id);
    logger.debug('Project fetched successfully', {
      id: project.id,
      title: project.title
    }, request);
    return NextResponse.json(project);
  } catch (error) {
    logger.error('Failed to fetch project', {
      id: params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, request);
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
    const data = await request.json();
    
    // Log the project update attempt
    logger.info('Project update attempt', {
      id: params.id,
      updatedFields: Object.keys(data)
    }, request);

    const project = await updateProject(params.id, data);
    logger.info('Project updated successfully', {
      id: project.id,
      title: project.title,
      updatedFields: Object.keys(data)
    }, request);

    return NextResponse.json(project);
  } catch (error) {
    logger.error('Failed to update project', {
      id: params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, request);
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
    const project = await deleteProject(params.id);
    logger.info('Project deleted successfully', {
      id: project.id,
      title: project.title
    }, request);
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete project', {
      id: params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, request);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

// Required for Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 