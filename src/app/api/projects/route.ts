import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/projects';
import { logger } from '@/lib/logger';

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const projects = await getProjects();
    logger.debug('Projects fetched successfully', {
      count: projects.length
    }, request);
    return NextResponse.json(projects);
  } catch (error) {
    logger.error('Failed to fetch projects', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, request);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Log the project creation attempt
    logger.info('Project creation attempt', {
      title: data.title,
      category: data.category
    }, request);

    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'images'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      logger.warn('Project creation validation failed', {
        missingFields
      }, request);
      return NextResponse.json(
        { error: 'Missing required fields', fields: missingFields },
        { status: 400 }
      );
    }

    const project = await createProject(data);
    logger.info('Project created successfully', {
      id: project.id,
      title: project.title
    }, request);

    return NextResponse.json(project);
  } catch (error) {
    logger.error('Failed to create project', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, request);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// Required for Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 