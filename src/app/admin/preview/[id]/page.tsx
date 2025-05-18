'use client';

import { useState, useEffect } from 'react';
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

export default function PreviewProjectPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(id)}`);
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
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Title and Summary Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
          </div>

          {/* Main Image Skeleton */}
          <div className="mb-8">
            <div className="aspect-[16/9] bg-gray-200 rounded-lg animate-pulse" />
          </div>

          {/* Description Skeleton */}
          <div className="mb-8">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
            </div>
          </div>

          {/* Gallery Skeleton */}
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="aspect-square bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </main>
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