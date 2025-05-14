'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import ProjectPage from '@/components/ProjectPage';

interface Project {
  id: string;
  title: string;
  summary: string;
  description: string;
  mainImage: {
    url: string;
    alt: string;
    description: string;
  };
  images: Array<{
    url: string;
    alt: string;
    description: string;
  }>;
  directory: string;
}

export default function PreviewProject({ params }: { params: Promise<{ name: string }> }) {
  const resolvedParams = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(resolvedParams.name)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        const data = await response.json();
        setProject(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [resolvedParams.name]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Project not found</div>
      </div>
    );
  }

  return (
    <ProjectPage 
      project={project}
      backHref="/admin"
      backText="חזרה לפרויקטים"
    />
  );
} 