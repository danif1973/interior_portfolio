import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    const projectsDir = path.join(process.cwd(), 'public', 'images', 'projects');

    // First, get all project directories
    const projectDirs = fs.readdirSync(projectsDir);
    console.log('Available project directories:', projectDirs);

    // Load all projects to find the one with matching ID
    const projects = await Promise.all(
      projectDirs.map(async (dir) => {
        const projectJsonPath = path.join(projectsDir, dir, 'project.json');
        if (fs.existsSync(projectJsonPath)) {
          const projectData = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
          return {
            id: dir.toLowerCase().replace(/\s+/g, '-'),
            title: projectData.title || projectData.name,
            summary: projectData.summary,
            description: projectData.description,
            mainImage: projectData.mainImage || projectData.images[0] || {
              url: '',
              alt: '',
              description: ''
            },
            images: projectData.images || [],
            directory: dir
          };
        }
        return null;
      })
    );

    // Find the project with matching ID
    const project = projects.find(p => p && p.id === decodedName.toLowerCase());

    if (!project) {
      console.error('Project not found for ID:', decodedName);
      return new NextResponse(
        JSON.stringify({ error: 'Project not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Found project:', project);
    console.log('Main image:', project.mainImage);

    return new NextResponse(
      JSON.stringify(project),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching project:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch project',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    const projectsDir = path.join(process.cwd(), 'public', 'images', 'projects');

    // First, get all project directories
    const projectDirs = fs.readdirSync(projectsDir);

    // Load all projects to find the one with matching ID
    const projects = await Promise.all(
      projectDirs.map(async (dir) => {
        const projectJsonPath = path.join(projectsDir, dir, 'project.json');
        if (fs.existsSync(projectJsonPath)) {
          const projectData = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
          return {
            id: dir.toLowerCase().replace(/\s+/g, '-'),
            title: projectData.title || projectData.name,
            summary: projectData.summary,
            description: projectData.description,
            mainImage: projectData.images?.[0] || {
              url: '',
              alt: '',
              description: ''
            },
            images: projectData.images || [],
            directory: dir
          };
        }
        return null;
      })
    );

    // Find the project with matching ID
    const project = projects.find(p => p && p.id === decodedName.toLowerCase());

    if (!project) {
      console.error('Project not found for ID:', decodedName);
      return new NextResponse(
        JSON.stringify({ error: 'Project not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const projectJsonPath = path.join(projectsDir, project.directory, 'project.json');
    
    // Read the current project data
    const currentProjectData = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
    
    // Get the updated data from the request
    const updatedData = await request.json();
    
    // Update the project data while preserving the original structure
    const newProjectData = {
      ...currentProjectData,
      title: updatedData.title,
      summary: updatedData.summary,
      description: updatedData.description,
      images: updatedData.images,
      mainImage: updatedData.mainImage // Ensure mainImage is updated
    };

    // Write the updated data back to the file
    fs.writeFileSync(projectJsonPath, JSON.stringify(newProjectData, null, 2));

    return new NextResponse(
      JSON.stringify(newProjectData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error updating project:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to update project',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    const projectsDir = path.join(process.cwd(), 'public', 'images', 'projects');
    const projectDir = path.join(projectsDir, decodedName);

    console.log('DELETE request received for project:', decodedName);
    console.log('Project directory:', projectDir);

    // Check if project directory exists
    if (!fs.existsSync(projectDir)) {
      console.error('Project directory not found:', projectDir);
      return new NextResponse(
        JSON.stringify({ error: 'Project not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Delete all files in the project directory
    const files = fs.readdirSync(projectDir);
    for (const file of files) {
      const filePath = path.join(projectDir, file);
      fs.unlinkSync(filePath);
      console.log('Deleted file:', filePath);
    }

    // Delete the project directory
    fs.rmdirSync(projectDir);
    console.log('Deleted project directory:', projectDir);

    return new NextResponse(
      JSON.stringify({ message: 'Project deleted successfully' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to delete project',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Add OPTIONS method to handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET, DELETE, OPTIONS',
      'Content-Type': 'application/json',
    },
  });
} 