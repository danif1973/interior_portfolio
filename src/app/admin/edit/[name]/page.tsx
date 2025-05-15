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
  directory: string;
}

export default function EditProject({ params }: { params: { name: string } }) {
  const { name } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [originalProject, setOriginalProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [showMainImageWarning, setShowMainImageWarning] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(name)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        const data = await response.json();
        setProject(data);
        setOriginalProject(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [name]);

  const hasUnsavedChanges = () => {
    if (!project || !originalProject) return false;
    return JSON.stringify(project) !== JSON.stringify(originalProject);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);
    } else {
      router.push('/admin');
    }
  };

  const handleConfirmCancel = () => {
    router.push('/admin');
  };

  const handleImageClick = (index: number) => {
    if (!project) return;
    const newImages = [...project.images];
    const selectedImage = newImages[index];
    
    // Update mainImage with the selected image
    setProject({
      ...project,
      mainImage: selectedImage
    });
  };

  const handleSave = async () => {
    if (!project) return;

    try {
      // Ensure mainImage is included in the save data
      const projectData = {
        ...project,
        mainImage: project.mainImage
      };

      const response = await fetch(`/api/projects/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error('Failed to save project');
      }

      router.push('/admin');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !project) return;

    setIsUploading(true);
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectName', project.directory);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      
      // Add the new image to the project
      const newImage = {
        url: data.url,
        alt: '',
        description: ''
      };

      setProject({
        ...project,
        images: [...project.images, newImage]
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">שגיאה: {error}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">הפרויקט לא נמצא</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-light text-gray-900">עריכת פרויקט</h1>
            <div className="flex space-x-4">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                ביטול
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                שמירת שינויים
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">פרטי הפרויקט</h2>
            <p className="mt-1 text-sm text-gray-500">עריכת פרטי הפרויקט</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                כותרת
              </label>
              <input
                type="text"
                id="title"
                value={project.title}
                onChange={(e) => setProject({ ...project, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-right"
                dir="rtl"
              />
            </div>

            {/* Summary */}
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                תקציר
              </label>
              <textarea
                id="summary"
                rows={3}
                value={project.summary}
                onChange={(e) => setProject({ ...project, summary: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-right"
                dir="rtl"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                תיאור
              </label>
              <textarea
                id="description"
                rows={6}
                value={project.description}
                onChange={(e) => setProject({ ...project, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-right"
                dir="rtl"
              />
            </div>

            {/* Images */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">תמונות</h3>
                <div className="relative">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 cursor-pointer ${
                      isUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {project.images && project.images.map((image, index) => (
                  <div key={index} className="space-y-2">
                    <div 
                      className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer ${
                        image.url === project.mainImage.url ? 'ring-4 ring-indigo-500' : ''
                      }`}
                      onClick={() => handleImageClick(index)}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || project.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (project && image.url === project.mainImage.url) {
                              setShowMainImageWarning(true);
                            }
                            setImageToDelete(index);
                          }}
                          className="text-white bg-red-600 hover:bg-red-700 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <textarea
                      dir="rtl"
                      value={image.description || ''}
                      onChange={(e) => {
                        const newImages = [...project.images];
                        newImages[index] = {
                          ...newImages[index],
                          description: e.target.value
                        };
                        setProject({ ...project, images: newImages });
                      }}
                      placeholder="תיאור התמונה..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Image Confirmation Modal */}
      <ConfirmationModal
        isOpen={imageToDelete !== null && !showMainImageWarning}
        onClose={() => setImageToDelete(null)}
        onConfirm={() => {
          if (project && imageToDelete !== null) {
            const newImages = [...project.images];
            newImages.splice(imageToDelete, 1);
            setProject({ ...project, images: newImages });
            setImageToDelete(null);
          }
        }}
        title="מחק תמונה"
        message="האם אתה בטוח שברצונך למחוק תמונה זו? פעולה זו אינה ניתנת לביטול."
        confirmText="מחק תמונה"
        cancelText="ביטול"
      />

      {/* Main Image Warning Modal */}
      <ConfirmationModal
        isOpen={showMainImageWarning}
        onClose={() => {
          setShowMainImageWarning(false);
          setImageToDelete(null);
        }}
        onConfirm={() => {
          setShowMainImageWarning(false);
          setImageToDelete(null);
        }}
        title="אזהרת תמונה ראשית"
        message="זוהי התמונה הראשית. אנא בחר תמונה אחרת כתמונה ראשית לפני מחיקת תמונה זו."
        confirmText="אישור"
        cancelText="ביטול"
      />

      {/* Unsaved Changes Modal */}
      <ConfirmationModal
        isOpen={showUnsavedChangesModal}
        onClose={() => setShowUnsavedChangesModal(false)}
        onConfirm={handleConfirmCancel}
        title="שינויים שלא נשמרו"
        message="יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?"
        confirmText="צא"
        cancelText="ביטול"
      />
    </div>
  );
} 