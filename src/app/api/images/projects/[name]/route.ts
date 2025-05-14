import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Project {
  name: string;
  imageCount: number;
  images: string[];
}

interface ImageMetadata {
  description: string;
  filename: string;
  projectName: string;
  uploadDate: string;
}

// This is required for Next.js to handle the route properly
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ensure the uploads directory exists
const ensureUploadsDir = (projectName: string) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'Images', 'Projects');
    const projectDir = path.join(uploadsDir, projectName);
    
    console.log('Ensuring directories exist:', { uploadsDir, projectDir });
    
    // Create Images directory if it doesn't exist
    if (!fs.existsSync(path.join(process.cwd(), 'public', 'Images'))) {
      console.log('Creating Images directory');
      fs.mkdirSync(path.join(process.cwd(), 'public', 'Images'), { recursive: true });
    }
    
    // Create Projects directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      console.log('Creating Projects directory:', uploadsDir);
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create project directory if it doesn't exist
    if (!fs.existsSync(projectDir)) {
      console.log('Creating project directory:', projectDir);
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    // Verify directories exist
    if (!fs.existsSync(uploadsDir) || !fs.existsSync(projectDir)) {
      throw new Error('Failed to create required directories');
    }
    
    console.log('Directory verification successful');
    return projectDir;
  } catch (error) {
    console.error('Error in ensureUploadsDir:', error);
    throw error;
  }
};

// Save image metadata
const saveImageMetadata = (metadata: ImageMetadata, projectDir: string) => {
  const metadataPath = path.join(projectDir, `${metadata.filename}.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log('Saved metadata to:', metadataPath);
};

// Save project data
const saveProjectData = (project: Project, projectDir: string) => {
  const projectDataPath = path.join(projectDir, 'project.json');
  const projectData = {
    name: project.name,
    imageCount: project.imageCount,
    images: project.images.map(imagePath => {
      const filename = imagePath.split('/').pop()?.split('.')[0];
      const metadataPath = path.join(projectDir, `${filename}.json`);
      let description = '';
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          description = metadata.description;
        } catch (error) {
          console.error('Error reading metadata:', error);
        }
      }
      return {
        url: imagePath,
        alt: filename || '',
        description
      };
    })
  };
  fs.writeFileSync(projectDataPath, JSON.stringify(projectData, null, 2));
  console.log('Saved project data to:', projectDataPath);
};

export async function POST(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;
    const decodedName = decodeURIComponent(name);
    
    console.log('POST request received for project:', decodedName);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));

    // Read the projects data
    const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
    console.log('Projects path:', projectsPath);
    
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
    console.log('Current projects data:', projectsData);
    
    const projectIndex = projectsData.findIndex((p) => p.name === decodedName);
    console.log('Project index:', projectIndex);
    
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

    const project = { ...projectsData[projectIndex] }; // Create a copy of the project
    console.log('Found project:', project);
    
    const formData = await request.formData();
    const files = formData.getAll('images');
    const descriptions = formData.getAll('descriptions');
    console.log('Received files:', files.length);

    if (!files || files.length === 0) {
      console.log('No files provided');
      return new NextResponse(
        JSON.stringify({ error: 'No images provided' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Ensure uploads directory exists
    const projectDir = ensureUploadsDir(decodedName);
    console.log('Project directory:', projectDir);

    // Initialize images array if it doesn't exist
    if (!project.images) {
      console.log('Initializing images array');
      project.images = [];
    }

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const description = descriptions[i] || '';

      if (file instanceof File) {
        try {
          console.log('Processing file:', file.name);
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          // Generate unique filename
          const timestamp = Date.now();
          const filename = `${timestamp}-${file.name}`;
          const filepath = path.join(projectDir, filename);
          
          console.log('Saving file to:', filepath);
          
          // Verify directory exists before writing
          if (!fs.existsSync(projectDir)) {
            throw new Error(`Project directory does not exist: ${projectDir}`);
          }
          
          // Save the file using writeFileSync
          try {
            fs.writeFileSync(filepath, buffer);
            console.log('File written successfully');
          } catch (writeError) {
            console.error('Error writing file:', writeError);
            throw new Error(`Failed to write file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`);
          }
          
          // Save metadata
          const metadata: ImageMetadata = {
            description: description.toString(),
            filename: filename,
            projectName: decodedName,
            uploadDate: new Date().toISOString()
          };
          saveImageMetadata(metadata, projectDir);
          
          // Verify file was written
          if (!fs.existsSync(filepath)) {
            throw new Error(`Failed to write file: ${filepath}`);
          }
          
          console.log('File saved successfully');
          
          // Add the image path to the project
          const relativePath = `/Images/Projects/${decodedName}/${filename}`;
          project.images.push(relativePath);
          console.log('Added image path:', relativePath);
        } catch (error) {
          console.error('Error processing file:', error);
          throw error;
        }
      }
    }

    // Update image count
    project.imageCount = project.images.length;
    console.log('Updated image count:', project.imageCount);

    // Update the project in the array
    projectsData[projectIndex] = project;
    console.log('Updated project in array');

    // Save the updated projects data
    fs.writeFileSync(projectsPath, JSON.stringify(projectsData, null, 2));
    console.log('Saved projects data');

    // Save project data in project folder
    saveProjectData(project, projectDir);

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