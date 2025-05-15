import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '@/types/project';

export async function POST(request: NextRequest) {
  try {
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

    // Generate a unique project ID
    const projectId = `project-${uuidv4()}`;
    const projectDir = join(process.cwd(), 'public', 'images', 'projects', projectId);

    console.log('Creating project directory:', projectDir);
    // Create project directory
    await mkdir(projectDir, { recursive: true });

    // Process and save images
    const images = [];
    let index = 0;
    while (formData.has(`image-${index}`)) {
      const imageFile = formData.get(`image-${index}`) as File | null;
      if (!imageFile) break;

      // Extract just the filename from the path
      const fileName = imageFile.name.split('/').pop() || imageFile.name;
      const filePath = join(projectDir, fileName);
      
      // Save the file
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Create URL for the image
      const imageUrl = `/images/projects/${projectId}/${fileName}`;
      
      images.push({
        url: imageUrl,
        alt: `${title} - ${fileName}`,
        description: ''
      });
      index++;
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      );
    }

    // Create project.json
    const projectData = {
      id: projectId,
      title,
      summary: summary,
      description: description,
      mainImage: images[mainImageIndex],
      images,
      directory: projectId
    };

    const projectJsonPath = join(projectDir, 'project.json');
    console.log('Saving project.json to:', projectJsonPath);
    await writeFile(projectJsonPath, JSON.stringify(projectData, null, 2));

    return NextResponse.json(projectData);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create project',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// This is required for Next.js to handle the route properly
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects: Project[] = [];
    const projectsDir = join(process.cwd(), 'public', 'images', 'projects');

    console.log('Loading projects from directory:', projectsDir);

    // Check if the projects directory exists
    if (!existsSync(projectsDir)) {
      console.log('Projects directory not found');
      return new NextResponse(JSON.stringify(projects), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all project directories
    const projectDirs = readdirSync(projectsDir);
    console.log('Found project directories:', projectDirs);

    // Load each project's data
    for (const projectDir of projectDirs) {
      const projectJsonPath = join(projectsDir, projectDir, 'project.json');
      console.log('Checking project.json at:', projectJsonPath);
      
      if (existsSync(projectJsonPath)) {
        try {
          const projectData = JSON.parse(readFileSync(projectJsonPath, 'utf-8'));
          console.log('Loaded project data:', projectData);
          
          // Use the data directly from the JSON file
          const project: Project = {
            id: projectData.id,
            title: projectData.title,
            summary: projectData.summary,
            description: projectData.description,
            mainImage: projectData.mainImage,
            images: projectData.images,
            directory: projectDir
          };
          
          projects.push(project);
        } catch (error) {
          console.error(`Error loading project ${projectDir}:`, error);
        }
      } else {
        console.log('project.json not found at:', projectJsonPath);
      }
    }

    console.log('Returning projects:', projects);
    return new NextResponse(JSON.stringify(projects), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error loading projects:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to load projects',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 