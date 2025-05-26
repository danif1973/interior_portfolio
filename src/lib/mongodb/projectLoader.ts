import connectDB from './mongoDB';
import { Project } from '@/lib/models/Project';
import { logger } from '@/lib/logger';

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
    logger.info('Loading projects from MongoDB', { action: 'load' });
    
    const projects = await Project.find({})
      .sort({ createdAt: -1 })
      .lean() as unknown as ProjectDocument[];
    
    logger.info('Projects loaded successfully', { 
      count: projects.length,
      action: 'complete'
    });
    
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
    logger.error('Error loading projects', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'load'
    });
    throw new Error('Failed to load projects');
  }
}

export async function loadProject(id: string): Promise<ProjectData | null> {
  try {
    await connectDB();
    logger.info('Loading project from MongoDB', { 
      id,
      action: 'load'
    });
    
    const project = await Project.findOne({ id }).lean() as unknown as ProjectDocument | null;
    
    if (!project) {
      logger.info('Project not found', { 
        id,
        action: 'not_found'
      });
      return null;
    }
    
    logger.info('Project loaded successfully', { 
      id,
      title: project.title,
      imageCount: project.images.length,
      action: 'complete'
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
    logger.error('Error loading project', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      id,
      action: 'load'
    });
    throw new Error('Failed to load project');
  }
} 