import connectDB from './mongoDB';
import { Project } from '@/lib/models/Project';

interface ProjectImage {
  url: string;
  alt: string;
  description: string;
  data: Buffer;
  contentType: string;
}

interface ProjectData {
  id: string;
  title: string;
  summary: string;
  description: string;
  mainImage: ProjectImage;
  images: ProjectImage[];
}

interface ProjectDocument {
  id: string;
  title: string;
  summary: string;
  description: string;
  mainImage: ProjectImage;
  images: ProjectImage[];
  createdAt: Date;
  updatedAt: Date;
}

export async function loadProjects(): Promise<ProjectData[]> {
  try {
    await connectDB();
    console.log('Loading projects from MongoDB...');
    
    const projects = await Project.find({})
      .sort({ createdAt: -1 })
      .lean() as unknown as ProjectDocument[];
    
    console.log(`Found ${projects.length} projects`);
    
    // Transform the data to match the expected format
    return projects.map((project) => ({
      id: project.id,
      title: project.title,
      summary: project.summary,
      description: project.description,
      mainImage: {
        url: project.mainImage.url,
        alt: project.mainImage.alt,
        description: project.mainImage.description,
        data: project.mainImage.data,
        contentType: project.mainImage.contentType
      },
      images: project.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        description: image.description,
        data: image.data,
        contentType: image.contentType
      }))
    }));
  } catch (error) {
    console.error('Error loading projects:', error);
    throw new Error('Failed to load projects');
  }
}

export async function loadProject(id: string): Promise<ProjectData | null> {
  try {
    await connectDB();
    console.log('Loading project from MongoDB:', id);
    
    const project = await Project.findOne({ id }).lean() as unknown as ProjectDocument | null;
    
    if (!project) {
      console.log('Project not found:', id);
      return null;
    }
    
    console.log('Project found:', {
      id: project.id,
      title: project.title,
      imageCount: project.images.length
    });
    
    // Transform the data to match the expected format
    return {
      id: project.id,
      title: project.title,
      summary: project.summary,
      description: project.description,
      mainImage: {
        url: project.mainImage.url,
        alt: project.mainImage.alt,
        description: project.mainImage.description,
        data: project.mainImage.data,
        contentType: project.mainImage.contentType
      },
      images: project.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        description: image.description,
        data: image.data,
        contentType: image.contentType
      }))
    };
  } catch (error) {
    console.error('Error loading project:', error);
    throw new Error('Failed to load project');
  }
} 