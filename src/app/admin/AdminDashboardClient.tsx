'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ConfirmationModal from '@/components/ConfirmationModal';

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
}

export default function AdminDashboardClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const router = useRouter();

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleLogout = async () => {
    try {
      const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      await fetch('/api/admin-auth/logout', {
        method: 'POST',
        headers: metaToken ? { 'X-CSRF-Token': metaToken } : {},
        credentials: 'include'
      });
    } catch {
      // Ignore errors, just proceed to redirect
    }
    router.push('/admin/login');
  };

  const handleEdit = (projectId: string) => {
    router.push(`/admin/edit/${projectId}`);
  };

  const handlePreview = (projectId: string) => {
    router.push(`/admin/preview/${projectId}`);
  };

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (!metaToken) {
        throw new Error('CSRF token not found in meta tag. Please refresh the page and try again.');
      }
      const url = `${window.location.origin}/api/projects/${encodeURIComponent(projectToDelete)}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': metaToken,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (response.ok) {
        setDeleteModalOpen(false);
        setProjectToDelete(null);
        await fetchProjects();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to delete project:', {
          status: response.status,
          error: errorData
        });
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="flex space-x-4">
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
            </div>
          </div>
        </header>
        {/* Main Content Skeleton */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="mt-1 h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            </div>
            <div className="divide-y divide-gray-200">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0 w-32 h-32 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4 animate-pulse" />
                      <div className="flex space-x-4">
                        <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
                        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
                        <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-light text-gray-900">לוח בקרה</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/add')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                הוסף פרויקט
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                התנתק
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">פרויקטים</h2>
            <p className="mt-1 text-sm text-gray-500">נהל את פרויקטי העיצוב הפנימי שלך</p>
          </div>
          <div className="divide-y divide-gray-200">
            {projects.map((project) => (
              <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start space-x-6">
                  {/* Project Image */}
                  <div className="flex-shrink-0 w-32 h-32 relative rounded-lg overflow-hidden bg-gray-100">
                    {project.mainImage?.url ? (
                      <Image
                        src={project.mainImage.url}
                        alt={project.mainImage.alt || project.title}
                        fill
                        className="object-cover"
                        onError={() => {
                          console.error('Image failed to load:', project.mainImage.url);
                        }}
                        unoptimized
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Project Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{project.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{project.summary}</p>
                    <div className="flex items-center space-x-4">
                      <button 
                        key={`edit-${project.id}`}
                        onClick={() => handleEdit(project.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                      >
                        עריכה
                        <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        key={`preview-${project.id}`}
                        onClick={() => handlePreview(project.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                      >
                        תצוגה מקדימה
                        <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button 
                        key={`delete-${project.id}`}
                        onClick={() => handleDeleteClick(project.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                      >
                        מחק
                        <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* Project Stats */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{project.images?.length || 0} תמונות</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="מחק פרויקט"
        message="האם אתה בטוח שברצונך למחוק פרויקט זה? פעולה זו אינה ניתנת לביטול וכל התמונות הקשורות יימחקו לצמיתות."
        confirmText="מחק פרויקט"
        cancelText="ביטול"
      />
    </div>
  );
} 