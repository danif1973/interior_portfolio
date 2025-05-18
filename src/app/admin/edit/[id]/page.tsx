'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ConfirmationModal from '@/components/ConfirmationModal';

interface ProjectImage {
  url: string;
  alt: string;
  description: string;
  data?: Buffer;
  contentType?: string;
}

interface Project {
  id: string;
  title: string;
  summary: string;
  description: string;
  mainImage: ProjectImage;
  images: ProjectImage[];
  directory: string;
}

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const { id } = params;
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
        const response = await fetch(`/api/projects/${encodeURIComponent(id)}`);
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
  }, [id]);

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
      console.log('Starting save process for project:', project.id);
      
      // Create a FormData object for the update
      const formData = new FormData();
      formData.append('title', project.title);
      formData.append('summary', project.summary);
      formData.append('description', project.description);
      
      // Find the index of the main image in the updated images array
      const mainImageIndex = project.images.findIndex(img => img.url === project.mainImage.url);
      console.log('Main image index:', mainImageIndex);
      formData.append('mainImageIndex', mainImageIndex.toString());

      // Add all current images to the form data
      console.log('Processing images for save:', project.images.length);
      project.images.forEach((image, index) => {
        console.log(`Processing image ${index}:`, {
          url: image.url,
          hasData: !!image.data,
          contentType: image.contentType
        });
        
        // For all images, send the complete image data
        const imageData = {
          url: image.url,
          alt: image.alt || `${project.title} - Image ${index}`,
          description: image.description || '',
          data: image.data,
          contentType: image.contentType || 'image/jpeg'
        };
        
        formData.append(`existing-image-${index}`, JSON.stringify(imageData));
      });

      console.log('FormData keys:', Array.from(formData.keys()));

      const response = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Save failed:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to save project');
      }

      const savedProject = await response.json();
      console.log('Project saved successfully:', savedProject);

      // Update original project state
      setOriginalProject(savedProject);
      router.push('/admin');
    } catch (error) {
      console.error('Error saving project:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !project) return;

    setIsUploading(true);
    const file = event.target.files[0];
    console.log('Uploading file:', file.name, file.type);

    try {
      // Convert the file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      // Create a FormData object for the update
      const formData = new FormData();
      formData.append('title', project.title);
      formData.append('summary', project.summary);
      formData.append('description', project.description);
      
      // Find the index of the main image in the updated images array
      const mainImageIndex = project.images.findIndex(img => img.url === project.mainImage.url);
      formData.append('mainImageIndex', mainImageIndex.toString());

      // Add all existing images
      project.images.forEach((image, idx) => {
        const imageData = {
          url: image.url,
          alt: image.alt || `${project.title} - Image ${idx}`,
          description: image.description || '',
          data: image.data,
          contentType: image.contentType || 'image/jpeg'
        };
        formData.append(`existing-image-${idx}`, JSON.stringify(imageData));
      });

      // Add the new image
      const newImageData = {
        url: base64Data,
        alt: `${project.title} - ${file.name}`,
        description: '',
        data: base64Data.split(',')[1], // Remove the data URL prefix
        contentType: file.type
      };
      formData.append(`existing-image-${project.images.length}`, JSON.stringify(newImageData));

      console.log('Sending form data with keys:', Array.from(formData.keys()));

      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to save project with new image');
      }

      const updatedProject = await response.json();
      console.log('Project updated successfully:', updatedProject);
      
      // Update project state with the response data
      setProject(updatedProject);
      setOriginalProject(updatedProject);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async (index: number) => {
    if (!project) return;

    // Don't allow deleting the main image
    if (project.images[index].url === project.mainImage.url) {
      setShowMainImageWarning(true);
      return;
    }

    // Set the image to delete and show confirmation modal
    setImageToDelete(index);
  };

  const handleConfirmImageDelete = async () => {
    if (!project || imageToDelete === null) return;

    // Create a new array without the deleted image
    const newImages = project.images.filter((_, i) => i !== imageToDelete);
    
    // Update the project state
    setProject({
      ...project,
      images: newImages
    });

    // Save the changes immediately
    try {
      const formData = new FormData();
      formData.append('title', project.title);
      formData.append('summary', project.summary);
      formData.append('description', project.description);
      
      // Find the index of the main image in the updated images array
      const mainImageIndex = newImages.findIndex(img => img.url === project.mainImage.url);
      formData.append('mainImageIndex', mainImageIndex.toString());

      // Add all remaining images to the form data
      newImages.forEach((image, idx) => {
        if (image.data) {
          formData.append(`image-${idx}`, new Blob([image.data], { type: image.contentType }));
        } else {
          formData.append(`existing-image-${idx}`, JSON.stringify(image));
        }
      });

      const response = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to delete image');
      }

      // Update original project state to match new state
      setOriginalProject({
        ...project,
        images: newImages
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete image');
      // Revert the change if the save failed
      setProject(project);
    } finally {
      setImageToDelete(null);
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
                <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-6">
            {/* Title Input Skeleton */}
            <div className="mb-6">
              <div className="h-4 bg-gray-200 rounded w-1/6 mb-2 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
            </div>

            {/* Summary Input Skeleton */}
            <div className="mb-6">
              <div className="h-4 bg-gray-200 rounded w-1/6 mb-2 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
            </div>

            {/* Description Input Skeleton */}
            <div className="mb-6">
              <div className="h-4 bg-gray-200 rounded w-1/6 mb-2 animate-pulse" />
              <div className="h-32 bg-gray-200 rounded w-full animate-pulse" />
            </div>

            {/* Main Image Upload Skeleton */}
            <div className="mb-6">
              <div className="h-4 bg-gray-200 rounded w-1/6 mb-2 animate-pulse" />
              <div className="h-40 bg-gray-200 rounded w-full animate-pulse" />
            </div>

            {/* Additional Images Upload Skeleton */}
            <div className="mb-6">
              <div className="h-4 bg-gray-200 rounded w-1/6 mb-2 animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>

            {/* Buttons Skeleton */}
            <div className="flex justify-end space-x-4">
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
          </div>
        </main>
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
                            handleImageDelete(index);
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
        onConfirm={handleConfirmImageDelete}
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