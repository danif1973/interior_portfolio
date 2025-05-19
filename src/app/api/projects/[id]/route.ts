import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/mongoDB';
import { Project } from '@/lib/models/Project';

interface ProjectImage {
  url: string;
  alt: string;
  description: string;
  data?: Buffer;
  contentType?: string;
}

// GET /api/projects/[id] - Get project details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const project = await Project.findOne({ id: params.id });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
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
    await connectDB();
    console.log('Starting PUT request for project:', params.id);
    
    // Check content type
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    let title: string;
    let summary: string | null;
    let description: string | null;
    let mainImageIndex: number;
    let images: ProjectImage[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      console.log('FormData keys:', Array.from(formData.keys()));
      
      title = formData.get('title') as string;
      summary = formData.get('summary') as string | null;
      description = formData.get('description') as string | null;
      mainImageIndex = parseInt(formData.get('mainImageIndex') as string);
      console.log('Received data:', { title, summary, description, mainImageIndex });

      // Process all images in order
      let index = 0;
      const processedImages: ProjectImage[] = [];

      // First, collect all existing images
      const existingImages = new Map<number, ProjectImage>();
      while (formData.has(`existing-image-${index}`)) {
        const existingImageStr = formData.get(`existing-image-${index}`) as string;
        console.log(`Processing existing-image-${index}`);
        
        try {
          const existingImage = JSON.parse(existingImageStr);
          existingImages.set(index, {
            url: existingImage.url,
            alt: existingImage.alt || `${title} - Image ${index}`,
            description: existingImage.description || '',
            contentType: existingImage.contentType || 'image/jpeg'
          });
        } catch (e) {
          console.error('Error parsing existing image:', e);
        }
        index++;
      }

      // Then process all images in order (both existing and new)
      index = 0;
      while (formData.has(`image-${index}`) || existingImages.has(index)) {
        if (formData.has(`image-${index}`)) {
          // Handle new image
          const imageFile = formData.get(`image-${index}`) as File;
          const imageDataStr = formData.get(`image-data-${index}`) as string;
          
          console.log(`Processing new image-${index}:`, imageFile.name, imageFile.type);

          // Parse image metadata
          let imageData = {
            alt: `${title} - ${imageFile.name}`,
            description: '',
            contentType: imageFile.type
          };
          
          try {
            if (imageDataStr) {
              const parsedData = JSON.parse(imageDataStr);
              imageData = {
                ...imageData,
                ...parsedData
              };
            }
          } catch (e) {
            console.error('Error parsing image data:', e);
          }

          // Convert image to buffer
          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          processedImages.push({
            url: `data:${imageFile.type};base64,${buffer.toString('base64')}`,
            alt: imageData.alt,
            description: imageData.description,
            data: buffer,
            contentType: imageFile.type
          });
        } else if (existingImages.has(index)) {
          // Handle existing image
          processedImages.push(existingImages.get(index)!);
        }
        index++;
      }

      images = processedImages;
    } else {
      // Handle JSON data
      const data = await request.json();
      title = data.title;
      summary = data.summary;
      description = data.description;
      mainImageIndex = data.mainImageIndex;
      images = data.images;
    }

    console.log('Final images array length:', images.length);
    console.log('Main image index:', mainImageIndex);

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      );
    }

    // Update project with new images array
    const updateData = {
      title,
      summary: summary || '',
      description: description || '',
      mainImage: images[mainImageIndex],
      images,
      updatedAt: new Date()
    };

    console.log('Updating project with data:', {
      ...updateData,
      images: updateData.images.length,
      mainImage: updateData.mainImage ? 'present' : 'missing'
    });

    const project = await Project.findOneAndUpdate(
      { id: params.id },
      updateData,
      { new: true }
    );

    if (!project) {
      console.error('Project not found:', params.id);
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    console.log('Project updated successfully:', {
      id: project.id,
      title: project.title,
      imagesCount: project.images.length
    });
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
    await connectDB();
    const project = await Project.findOneAndDelete({ id: params.id });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

// Required for Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 