import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

interface Project {
  name: string;
  imageCount: number;
  images: string[];
}

export const dynamic = 'force-dynamic';

// Ensure the uploads directory exists
const ensureUploadsDir = (projectName: string) => {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const projectDir = path.join(uploadsDir, projectName);
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }
  
  return projectDir;
};

export async function POST(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;
    const decodedName = decodeURIComponent(name);
    
    console.log('POST request received for project:', decodedName);

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
    const projectIndex = projectsData.findIndex((p) => p.name === decodedName);
    
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
    const formData = await request.formData();
    const files = formData.getAll('images');

    if (!files || files.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No images provided' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = ensureUploadsDir(decodedName);
    console.log('Uploads directory:', uploadsDir);

    // Process each file
    for (const file of files) {
      if (file instanceof File) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name}`;
        const filepath = path.join(uploadsDir, filename);
        
        // Save the file
        await writeFile(filepath, buffer);
        console.log('Saved file:', filepath);
        
        // Add the image path to the project
        const relativePath = `/uploads/${decodedName}/${filename}`;
        project.images.push(relativePath);
      }
    }

    // Update image count
    project.imageCount = project.images.length;

    // Save the updated projects data
    fs.writeFileSync(projectsPath, JSON.stringify(projectsData, null, 2));
    console.log('Updated projects data');

    return new NextResponse(
      JSON.stringify(project),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error uploading images:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to upload images', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;
    const decodedName = decodeURIComponent(name);
    
    console.log('DELETE request received:', { name, decodedName });

    return new NextResponse(
      JSON.stringify({ message: 'Route is working', name: decodedName }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE handler:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to process request', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 