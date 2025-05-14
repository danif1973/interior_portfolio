'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import ConfirmationModal from '@/components/ConfirmationModal';

// Schema for project validation
const projectSchema = z.object({
  title: z.string()
    .min(1, 'כותרת היא שדה חובה')
    .max(100, 'הכותרת חייבת להיות קצרה מ-100 תווים')
    .regex(/^[\p{L}\p{N}\s\-_.,!?()]+$/u, 'הכותרת יכולה להכיל רק אותיות, מספרים, רווחים והסימנים הבאים: -_.,!?()')
    .transform(str => str.trim()),
  summary: z.string()
    .max(200, 'הסיכום חייב להיות קצר מ-200 תווים')
    .regex(/^[\p{L}\p{N}\p{P}\s]*$/u, 'הסיכום יכול להכיל רק אותיות, מספרים, סימני פיסוק ורווחים')
    .transform(str => str.trim())
    .optional(),
  description: z.string()
    .max(1000, 'התיאור חייב להיות קצר מ-1000 תווים')
    .regex(/^[\p{L}\p{N}\p{P}\s]*$/u, 'התיאור יכול להכיל רק אותיות, מספרים, סימני פיסוק ורווחים')
    .transform(str => str.trim())
    .optional(),
});

// Sanitize input to prevent XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

type ProjectFormData = z.infer<typeof projectSchema>;

interface ImageFile {
  file: File;
  preview: string;
}

export default function AddProject() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    summary: '',
    description: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({});
  const [images, setImages] = useState<ImageFile[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  const validateField = (name: keyof ProjectFormData, value: string) => {
    try {
      // Sanitize input before validation
      const sanitizedValue = sanitizeInput(value);
      projectSchema.shape[name].parse(sanitizedValue);
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (err) {
      if (err instanceof z.ZodError) {
        setFieldErrors(prev => ({ ...prev, [name]: err.errors[0].message }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Sanitize input before setting state
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    validateField(name as keyof ProjectFormData, sanitizedValue);
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles: ImageFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        imageFiles.push({ file, preview });
      }
    }

    setImages(prevImages => [...prevImages, ...imageFiles]);
    if (images.length === 0) {
      setMainImageIndex(0); // Only reset main image if there were no images before
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const items = e.dataTransfer.items;
    if (!items) return;

    const imageFiles: ImageFile[] = [];
    const processEntry = async (entry: FileSystemEntry) => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve) => {
          (entry as FileSystemFileEntry).file(resolve);
        });
        if (file.type.startsWith('image/')) {
          const preview = URL.createObjectURL(file);
          imageFiles.push({ file, preview });
        }
      } else if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
          reader.readEntries(resolve);
        });
        for (const entry of entries) {
          await processEntry(entry);
        }
      }
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await processEntry(entry);
        }
      }
    }

    setImages(prevImages => [...prevImages, ...imageFiles]);
    if (images.length === 0) {
      setMainImageIndex(0); // Only reset main image if there were no images before
    }
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
      formDataToSend.append('title', formData.title);
      formDataToSend.append('summary', formData.summary || '');
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('mainImageIndex', mainImageIndex.toString());

      // Append all images
      images.forEach((image, index) => {
        formDataToSend.append(`image-${index}`, image.file);
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
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while creating the project');
      }
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
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 ${
                    fieldErrors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                  סיכום
                </label>
                <input
                  type="text"
                  id="summary"
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 ${
                    fieldErrors.summary ? 'border-red-300' : 'border-gray-300'
                  }`}
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
                  rows={4}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 ${
                    fieldErrors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  תמונות הפרויקט
                </label>
                <div 
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="folder-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>העלה תיקייה</span>
                        <input
                          id="folder-upload"
                          name="folder-upload"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFolderSelect}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">או גרור ושחרר</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF עד 10MB</p>
                  </div>
                </div>
              </div>

              {images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    בחר תמונה ראשית
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                          mainImageIndex === index ? 'border-indigo-500' : 'border-transparent'
                        }`}
                        onClick={() => setMainImageIndex(index)}
                      >
                        <Image
                          src={image.preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newImages = [...images];
                              newImages.splice(index, 1);
                              setImages(newImages);
                              if (mainImageIndex >= newImages.length) {
                                setMainImageIndex(Math.max(0, newImages.length - 1));
                              }
                            }}
                            className="text-white bg-red-600 hover:bg-red-700 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {mainImageIndex === index && (
                          <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                            <svg
                              className="h-8 w-8 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
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
        confirmText="עזוב"
        cancelText="השאר"
      />
    </div>
  );
} 