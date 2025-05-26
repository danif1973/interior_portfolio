import { Document } from 'mongoose';

interface ProjectImage {
  url: string;
  alt: string;
  description?: string;
  contentType?: string;
  data?: Buffer;
}

export interface ProjectDocument extends Document {
  id: string;
  title: string;
  summary: string;
  description: string;
  mainImage: ProjectImage;
  images: ProjectImage[];
  mainImageIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateProject(project: Partial<ProjectDocument>): ProjectValidationResult {
  const errors: string[] = [];

  // Validate title
  if (!project.title) {
    errors.push('Title is required');
  } else if (typeof project.title !== 'string') {
    errors.push('Title must be a string');
  } else if (project.title.trim().length === 0) {
    errors.push('Title cannot be empty');
  }

  // Validate summary
  if (!project.summary) {
    errors.push('Summary is required');
  } else if (typeof project.summary !== 'string') {
    errors.push('Summary must be a string');
  } else if (project.summary.trim().length === 0) {
    errors.push('Summary cannot be empty');
  }

  // Validate description
  if (!project.description) {
    errors.push('Description is required');
  } else if (typeof project.description !== 'string') {
    errors.push('Description must be a string');
  } else if (project.description.trim().length === 0) {
    errors.push('Description cannot be empty');
  }

  // Validate images
  if (!project.images || !Array.isArray(project.images)) {
    errors.push('Images must be an array');
  } else if (project.images.length === 0) {
    errors.push('At least one image is required');
  } else {
    project.images.forEach((image: ProjectImage, index: number) => {
      if (!image.url) {
        errors.push(`Image ${index + 1} must have a URL`);
      }
      if (!image.alt) {
        errors.push(`Image ${index + 1} must have an alt text`);
      }
    });
  }

  // Validate mainImageIndex
  if (typeof project.mainImageIndex !== 'number') {
    errors.push('Main image index must be a number');
  } else if (project.mainImageIndex < 0 || project.mainImageIndex >= (project.images?.length || 0)) {
    errors.push('Main image index is out of range');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 