'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROJECT_VALIDATION, projectSchema, type ProjectFormData } from '../../../lib/validation';
import ConfirmationModal from '../../../components/ConfirmationModal';
import ImageUploader, { type ImageUploaderImage } from '../../../components/ImageUploader';

export default function AddProject() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    summary: '',
    description: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({});
  const [images, setImages] = useState<ImageUploaderImage[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name as keyof ProjectFormData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate all fields
      const result = projectSchema.safeParse(formData);
      if (!result.success) {
        const errors: Partial<Record<keyof ProjectFormData, string>> = {};
        result.error.errors.forEach(err => {
          const path = err.path[0] as keyof ProjectFormData;
          errors[path] = err.message;
        });
        setFieldErrors(errors);
        throw new Error('יש לתקן את השגיאות בטופס');
      }

      if (images.length === 0) {
        throw new Error('נדרשת לפחות תמונה אחת');
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('summary', formData.summary?.trim() || '');
      formDataToSend.append('description', formData.description?.trim() || '');
      formDataToSend.append('mainImageIndex', mainImageIndex.toString());

      // Append all images with their descriptions
      images.forEach((image, index) => {
        if (image.file) {
          // Append the image file
          formDataToSend.append(`image-${index}`, image.file);
          // Append the image data as JSON
          formDataToSend.append(`image-data-${index}`, JSON.stringify({
            alt: image.alt,
            description: image.description,
            contentType: image.contentType
          }));
        }
      });

      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to create project');
      }

      // Clear form data
      setFormData({
        title: '',
        summary: '',
        description: '',
      });
      setImages([]);
      setMainImageIndex(0);
      setFieldErrors({});

      // Redirect to admin dashboard
      router.push('/admin');
      router.refresh(); // Force a refresh of the current route
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasUnsavedChanges = () => {
    return formData.title !== '' || formData.summary !== '' || formData.description !== '' || images.length > 0;
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-light text-gray-900">הוסף פרויקט חדש</h1>
            <button
              onClick={() => router.push('/admin')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              חזרה ללוח הבקרה
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  כותרת *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
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

              <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                  סיכום
                </label>
                <textarea
                  id="summary"
                  name="summary"
                  value={formData.summary}
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

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  תיאור
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  תמונות הפרויקט
                </label>
                <ImageUploader
                  images={images}
                  onImagesChange={setImages}
                  mainImageIndex={mainImageIndex}
                  onMainImageChange={setMainImageIndex}
                  onImageDelete={(index) => {
                    const newImages = [...images];
                    newImages.splice(index, 1);
                    setImages(newImages);
                    if (mainImageIndex >= newImages.length) {
                      setMainImageIndex(Math.max(0, newImages.length - 1));
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    יוצר פרויקט...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    צור פרויקט
                  </>
                )}
              </button>
            </div>
          </form>
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
    </div>
  );
} 