import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectName = formData.get('projectName') as string;

    if (!file || !projectName) {
      return new NextResponse(
        JSON.stringify({ error: 'File and project name are required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create a unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const filename = `${timestamp}${extension}`;

    // Ensure the project directory exists
    const projectDir = path.join(process.cwd(), 'public', 'Images', 'Projects', projectName);
    const filePath = path.join(projectDir, filename);

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write the file
    await writeFile(filePath, buffer);

    // Return the URL path to the uploaded file
    const url = `/Images/Projects/${projectName}/${filename}`;

    return new NextResponse(
      JSON.stringify({ url }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to upload file',
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