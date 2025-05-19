'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PROJECT_VALIDATION, projectSchema, type ProjectFormData } from '@/lib/validation';
import ConfirmationModal from '@/components/ConfirmationModal';
import ImageUploader, { type ImageUploaderImage } from '@/components/ImageUploader';
import { fetchWithCSRF } from '@/lib/csrf-client';

interface Project extends ProjectFormData {
  id: string;
  images: ImageUploaderImage[];
  mainImage: ImageUploaderImage;
}

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [originalProject, setOriginalProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [showMainImageWarning, setShowMainImageWarning] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(params.id)}`);
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
  }, [params.id]);

  // Add debug logging for CSRF token
  useEffect(() => {
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    console.log('Meta CSRF Token:', metaToken);
    
    // Log all cookies for debugging
    console.log('All Cookies:', document.cookie);
  }, []);

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

  const validateField = (name: keyof ProjectFormData, value: string) => {
    const trimmedValue = value.trim();
    
    // Handle title validation (required field)
    if (name === 'title') {
      if (!trimmedValue) {
        setFieldErrors((prev) => ({ ...prev, [name]: PROJECT_VALIDATION.ERROR_MESSAGES.title.required }));
        return;
      }
      if (trimmedValue.length > PROJECT_VALIDATION.MAX_LENGTHS.title) {
        setFieldErrors((prev) => ({ ...prev, [name]: PROJECT_VALIDATION.ERROR_MESSAGES.title.maxLength }));
        return;
      }
      if (!PROJECT_VALIDATION.PATTERN.test(trimmedValue)) {
        setFieldErrors((prev) => ({ ...prev, [name]: PROJECT_VALIDATION.ERROR_MESSAGES.title.pattern }));
        return;
      }
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
      return;
    }

    // Handle summary validation (optional field)
    if (name === 'summary') {
      if (!trimmedValue) {
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
        return;
      }
      // Only validate if there's a value
      if (trimmedValue.length > PROJECT_VALIDATION.MAX_LENGTHS.summary) {
        setFieldErrors((prev) => ({ ...prev, [name]: PROJECT_VALIDATION.ERROR_MESSAGES.summary.maxLength }));
        return;
      }
      if (!PROJECT_VALIDATION.PATTERN.test(trimmedValue)) {
        setFieldErrors((prev) => ({ ...prev, [name]: PROJECT_VALIDATION.ERROR_MESSAGES.summary.pattern }));
        return;
      }
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
      return;
    }

    // Handle description validation (optional field)
    if (name === 'description') {
      if (!trimmedValue) {
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
        return;
      }
      // Only validate if there's a value
      if (trimmedValue.length > PROJECT_VALIDATION.MAX_LENGTHS.description) {
        setFieldErrors((prev) => ({ ...prev, [name]: PROJECT_VALIDATION.ERROR_MESSAGES.description.maxLength }));
        return;
      }
      if (!PROJECT_VALIDATION.PATTERN.test(trimmedValue)) {
        setFieldErrors((prev) => ({ ...prev, [name]: PROJECT_VALIDATION.ERROR_MESSAGES.description.pattern }));
        return;
      }
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
      return;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!project) return;
    const { name, value } = e.target;
    setProject(prev => prev ? { ...prev, [name]: value } : null);
    validateField(name as keyof ProjectFormData, value);
  };

  const handleSave = async () => {
    if (!project) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Validate all fields
      const result = projectSchema.safeParse({
        title: project.title,
        summary: project.summary,
        description: project.description,
      });

      if (!result.success) {
        const errors: Partial<Record<keyof ProjectFormData, string>> = {};
        result.error.errors.forEach(err => {
          const path = err.path[0] as keyof ProjectFormData;
          errors[path] = err.message;
        });
        setFieldErrors(errors);
        throw new Error('יש לתקן את השגיאות בטופס');
      }

      if (project.images.length === 0) {
        throw new Error('נדרשת לפחות תמונה אחת');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', project.title.trim());
      formData.append('summary', project.summary?.trim() || '');
      formData.append('description', project.description?.trim() || '');
      
      // Find the index of the main image in the updated images array
      const mainImageIndex = project.images.findIndex(img => img.url === project.mainImage.url);
      formData.append('mainImageIndex', mainImageIndex.toString());

      // Append all images in their current order
      project.images.forEach((image, index) => {
        if (image.file) {
          // For new images, append both the file and its metadata
          formData.append(`image-${index}`, image.file);
          formData.append(`image-data-${index}`, JSON.stringify({
            alt: image.alt,
            description: image.description,
            contentType: image.contentType
          }));
        } else {
          // For existing images, just append the metadata with their current index
          formData.append(`existing-image-${index}`, JSON.stringify({
            url: image.url,
            alt: image.alt,
            description: image.description,
            contentType: image.contentType
          }));
        }
      });

      const response = await fetchWithCSRF(`/api/projects/${encodeURIComponent(project.id)}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to update project');
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      setOriginalProject(updatedProject);
      router.push('/admin');
      router.refresh();
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating the project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageDelete = (index: number) => {
    if (!project) return;

    // Don't allow deleting the main image
    if (project.images[index].url === project.mainImage.url) {
      setShowMainImageWarning(true);
      return;
    }

    const newImages = [...project.images];
    newImages.splice(index, 1);
    setProject({
      ...project,
      images: newImages
    });
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

            {/* Images Skeleton */}
            <div className="mb-6">
              <div className="h-4 bg-gray-200 rounded w-1/6 mb-2 animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Project not found</h2>
          <p className="mt-2 text-gray-600">The project you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <button
            onClick={() => router.push('/admin')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-light text-gray-900">ערוך פרויקט</h1>
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              <span>חזרה ללוח הבקרה</span>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  כותרת *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={project.title}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm text-right ${
                    fieldErrors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                  dir="rtl"
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
                )}
              </div>

              {/* Summary */}
              <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                  סיכום
                </label>
                <textarea
                  id="summary"
                  name="summary"
                  value={project.summary || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm text-right ${
                    fieldErrors.summary ? 'border-red-300' : 'border-gray-300'
                  }`}
                  dir="rtl"
                />
                {fieldErrors.summary && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.summary}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  תיאור
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={project.description || ''}
                  onChange={handleInputChange}
                  rows={6}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm text-right ${
                    fieldErrors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  dir="rtl"
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                )}
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  תמונות הפרויקט
                </label>
                <ImageUploader
                  images={project.images}
                  onImagesChange={(newImages) => setProject({ ...project, images: newImages })}
                  mainImageIndex={project.images.findIndex(img => img.url === project.mainImage.url)}
                  onMainImageChange={(index) => setProject({ ...project, mainImage: project.images[index] })}
                  onImageDelete={handleImageDelete}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                <span>ביטול</span>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>שומר שינויים...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>שמור שינויים</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Unsaved Changes Modal */}
      <ConfirmationModal
        isOpen={showUnsavedChangesModal}
        onClose={() => setShowUnsavedChangesModal(false)}
        onConfirm={handleConfirmCancel}
        title="שינויים שלא נשמרו"
        message="יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?"
        confirmText="צא"
        cancelText="השאר"
      />

      {/* Main Image Warning Modal */}
      <ConfirmationModal
        isOpen={showMainImageWarning}
        onClose={() => setShowMainImageWarning(false)}
        onConfirm={() => setShowMainImageWarning(false)}
        title="אזהרת תמונה ראשית"
        message="זוהי התמונה הראשית. אנא בחר תמונה אחרת כתמונה ראשית לפני מחיקת תמונה זו."
        confirmText="אישור"
        cancelText="ביטול"
      />
    </div>
  );
} 