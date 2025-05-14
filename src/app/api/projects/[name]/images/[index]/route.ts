import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Project {
  name: string;
  imageCount: number;
  images: string[];
}

export const dynamic = 'force-dynamic';

// Add a GET method to test if the route is working
export async function GET(
  request: Request,
  { params }: { params: { name: string; index: string } }
) {
  return new NextResponse(
    JSON.stringify({ message: 'Route is working', params }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: { name: string; index: string } }
) {
  try {
    const { name, index } = params;
    const decodedName = decodeURIComponent(name);
    const imageIndex = parseInt(index);

    console.log('DELETE request received:', { name, decodedName, index, imageIndex });

    // Read the projects data
    const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
    if (!fs.existsSync(projectsPath)) {
      console.error('Projects file not found at:', projectsPath);
      return new NextResponse(
        JSON.stringify({ error: 'Projects data not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf-8')) as Project[];
    console.log('Projects data:', projectsData);

    // Find the project
    const projectIndex = projectsData.findIndex((p) => p.name === decodedName);
    console.log('Project search:', { decodedName, projectIndex });
    
    if (projectIndex === -1) {
      console.error('Project not found:', decodedName);
      return new NextResponse(
        JSON.stringify({ error: 'Project not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const project = projectsData[projectIndex];
    if (!project.images || imageIndex >= project.images.length) {
      console.error('Image index out of bounds:', { imageIndex, imageCount: project.images?.length });
      return new NextResponse(
        JSON.stringify({ error: 'Image not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the image path
    const imagePath = project.images[imageIndex];
    const fullImagePath = path.join(process.cwd(), 'public', imagePath);
    console.log('Image paths:', { imagePath, fullImagePath });

    // Remove the image file
    if (fs.existsSync(fullImagePath)) {
      try {
        fs.unlinkSync(fullImagePath);
        console.log('Successfully deleted image file:', fullImagePath);
      } catch (error) {
        console.error('Error deleting image file:', error);
        return new NextResponse(
          JSON.stringify({ error: 'Failed to delete image file' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } else {
      console.warn('Image file not found at:', fullImagePath);
    }

    // Remove the image from the project's images array
    project.images.splice(imageIndex, 1);
    project.imageCount = project.images.length;

    // Save the updated projects data
    try {
      fs.writeFileSync(projectsPath, JSON.stringify(projectsData, null, 2));
      console.log('Successfully updated projects data');
    } catch (error) {
      console.error('Error saving projects data:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to save project data' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new NextResponse(
      JSON.stringify(project),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE handler:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to remove image', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 