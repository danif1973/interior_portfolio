import { Project } from './models/Project';
import connectDB from './mongodb/mongoDB';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

// Define the project type based on the schema
type ProjectType = {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  mainImage: {
    url: string;
    alt: string;
    description?: string;
    data: Buffer;
    contentType: string;
  };
  images: Array<{
    url: string;
    alt: string;
    description?: string;
    data: Buffer;
    contentType: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

export async function getProjects() {
  await connectDB();
  return Project.find({})
    .sort({ createdAt: -1 }) // Sort by newest first
    .select('id title summary mainImage images'); // Include images array
}

export async function getProjectById(id: string) {
  await connectDB();
  const project = await Project.findOne({ id });
  if (!project) {
    throw new Error(`Project not found: ${id}`);
  }
  return project;
}

export async function createProject(data: {
  title: string;
  description: string;
  category: string;
  images: Array<{
    url: string;
    alt: string;
    description?: string;
    data: Buffer;
    contentType: string;
  }>;
  summary?: string;
  mainImageIndex?: number;
}) {
  await connectDB();

  const { title, description, category, images, summary, mainImageIndex = 0 } = data;

  if (images.length === 0) {
    throw new Error('At least one image is required');
  }

  const project = await Project.create({
    id: `project-${uuidv4()}`,
    title,
    summary: summary || '',
    description,
    category,
    mainImage: images[mainImageIndex],
    images
  });

  logger.info('Project created in database', {
    id: project.id,
    title: project.title,
    category: project.category
  });

  return project;
}

export async function updateProject(id: string, data: Partial<ProjectType>) {
  await connectDB();
  
  const project = await Project.findOneAndUpdate(
    { id },
    { $set: data },
    { new: true }
  );

  if (!project) {
    throw new Error(`Project not found: ${id}`);
  }

  logger.info('Project updated in database', {
    id: project.id,
    title: project.title,
    updatedFields: Object.keys(data)
  });

  return project;
}

export async function deleteProject(id: string) {
  await connectDB();
  
  const project = await Project.findOneAndDelete({ id });
  
  if (!project) {
    throw new Error(`Project not found: ${id}`);
  }

  logger.info('Project deleted from database', {
    id: project.id,
    title: project.title
  });

  return project;
} 