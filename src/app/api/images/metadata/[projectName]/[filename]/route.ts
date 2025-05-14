import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ProjectImage {
  url: string;
  alt: string;
  description: string;
}

interface ProjectData {
  name: string;
  imageCount: number;
  images: ProjectImage[];
}

// This is required for Next.js to handle the route properly
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { projectName: string; filename: string } }
) {
  try {
    const { projectName, filename } = params;
    const decodedProjectName = decodeURIComponent(projectName);
    const decodedFilename = decodeURIComponent(filename);

    const metadataPath = path.join(
      process.cwd(),
      'public',
      'Images',
      'Projects',
      decodedProjectName,
      `${decodedFilename}.json`
    );

    if (!fs.existsSync(metadataPath)) {
      return new NextResponse(
        JSON.stringify({ error: 'Metadata not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    return new NextResponse(
      JSON.stringify(metadata),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch metadata',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Update project.json with new description
const updateProjectJson = (projectName: string, filename: string, description: string) => {
  const projectDir = path.join(
    process.cwd(),
    'public',
    'Images',
    'Projects',
    projectName
  );
  const projectJsonPath = path.join(projectDir, 'project.json');

  if (fs.existsSync(projectJsonPath)) {
    try {
      const projectData = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8')) as ProjectData;
      const imageIndex = projectData.images.findIndex((img) => img.url.includes(filename));
      if (imageIndex !== -1) {
        projectData.images[imageIndex].description = description;
        fs.writeFileSync(projectJsonPath, JSON.stringify(projectData, null, 2));
        console.log('Updated project.json with new description');
      }
    } catch (error) {
      console.error('Error updating project.json:', error);
    }
  }
};

export async function PUT(
  request: Request,
  { params }: { params: { projectName: string; filename: string } }
) {
  try {
    const { projectName, filename } = params;
    const decodedProjectName = decodeURIComponent(projectName);
    const decodedFilename = decodeURIComponent(filename);

    const metadataPath = path.join(
      process.cwd(),
      'public',
      'Images',
      'Projects',
      decodedProjectName,
      `${decodedFilename}.json`
    );

    if (!fs.existsSync(metadataPath)) {
      return new NextResponse(
        JSON.stringify({ error: 'Metadata not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { description } = body;

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    metadata.description = description;

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // Update project.json with the new description
    updateProjectJson(decodedProjectName, decodedFilename, description);

    return new NextResponse(
      JSON.stringify(metadata),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error updating metadata:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to update metadata',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 