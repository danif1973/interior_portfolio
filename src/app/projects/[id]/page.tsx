import { loadProjects } from '../../lib/projectLoader';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import ProjectPage from '@/components/ProjectPage';
import { Project } from '@/types/project';

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
  })),
  directory: z.string()
});

export default async function ProjectPageRoute({ params }: PageProps) {
  console.log('=== Starting Project Detail Page Load ===');
  console.log('Project ID from params:', params.id);
  
  const projects = await loadProjects();
  console.log('📊 Total projects loaded:', projects.length);
  
  const project = projects.find(p => p.id === params.id);
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
    const validatedProject = projectSchema.parse(project) as Project;
    console.log('✅ Project validation successful');
    console.log('Project details:', {
      id: validatedProject.id,
      title: validatedProject.title,
      summary: validatedProject.summary,
      imageCount: validatedProject.images.length,
      directory: validatedProject.directory
    });

    return (
      <ProjectPage 
        project={validatedProject}
        backHref="/#projects"
        backText="חזרה לדף הבית"
      />
    );
  } catch (error) {
    console.error('❌ Project validation failed:', error);
    throw error;
  }
} 