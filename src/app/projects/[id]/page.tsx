import { loadProject } from '@/lib/mongodb/projectLoader';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import ProjectPage from '@/components/ProjectPage';
import { Project } from '@/types/project';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface PageProps {
  params: {
    id: string;
  };
}

const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  mainImage: z.object({
    url: z.string(),
    alt: z.string(),
    description: z.string()
  }),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string(),
    description: z.string()
  }))
});

export default async function ProjectPageRoute({ params }: PageProps) {
  console.log('=== Starting Project Detail Page Load ===');
  console.log('Project ID from params:', params.id);
  
  const project = await loadProject(params.id);
  console.log('🔍 Looking for project with ID:', params.id);
  
  if (!project) {
    console.error('❌ Project not found:', params.id);
    notFound();
  }
  
  console.log('✅ Project found:', {
    id: project.id,
    title: project.title,
    imageCount: project.images.length,
    mainImageUrl: project.mainImage.url
  });

  try {
    // Transform the project data to only include display fields
    const displayProject = {
      id: project.id,
      title: project.title,
      summary: project.summary,
      description: project.description,
      mainImage: {
        url: project.mainImage.url,
        alt: project.mainImage.alt,
        description: project.mainImage.description
      },
      images: project.images.map(image => ({
        url: image.url,
        alt: image.alt,
        description: image.description
      }))
    };

    const validatedProject = projectSchema.parse(displayProject) as Project;
    console.log('✅ Project validation successful');
    console.log('Project details:', {
      id: validatedProject.id,
      title: validatedProject.title,
      summary: validatedProject.summary,
      imageCount: validatedProject.images.length
    });

    return (
      <ErrorBoundary>
        <ProjectPage 
          project={validatedProject}
          backHref="/#projects"
          backText="חזרה לדף הבית"
        />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('❌ Project validation failed:', error);
    throw error;
  }
} 