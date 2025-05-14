import { loadProjects } from '../../lib/projectLoader';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import ProjectPage from '@/components/ProjectPage';

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
  const { id } = params;
  const projects = await loadProjects();
  const project = projects.find(p => p.id === id);

  if (!project) {
    notFound();
  }

  const validatedProject = projectSchema.parse(project);

  return (
    <ProjectPage 
      project={validatedProject}
      backHref="/#projects"
      backText="חזרה לדף הבית"
    />
  );
} 