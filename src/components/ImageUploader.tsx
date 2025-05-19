'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface ImageUploaderImage {
  file?: File;
  url: string;
  alt: string;
  description: string;
  preview?: string;
  contentType?: string;
}

// Image validation constants
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface ImageUploaderProps {
  images: ImageUploaderImage[];
  onImagesChange: (images: ImageUploaderImage[]) => void;
  mainImageIndex: number;
  onMainImageChange: (index: number) => void;
  onImageDelete?: (index: number) => void;
}

export default function ImageUploader({
  images,
  onImagesChange,
  mainImageIndex,
  onMainImageChange,
  onImageDelete
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  // Helper function to validate image
  const validateImage = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `סוג קובץ לא נתמך. אנא העלה תמונות בפורמט JPEG, PNG או WebP`;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return `הקובץ גדול מדי. גודל מקסימלי: ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`;
    }
    return null;
  };

  // Helper function to check for duplicates
  const isDuplicateImage = (file: File, existingImages: ImageUploaderImage[]): boolean => {
    // Check by filename
    const existingNames = new Set(existingImages.map(img => img.file?.name || img.url.split('/').pop()));
    if (existingNames.has(file.name)) return true;

    // Additional check by file size and type
    const existingFiles = existingImages.filter(img => img.file);
    return existingFiles.some(img => 
      img.file && 
      img.file.size === file.size && 
      img.file.type === file.type
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDuplicateError(null);

    const items = e.dataTransfer.items;
    if (!items) return;

    const imageFiles: ImageUploaderImage[] = [];
    const duplicates: string[] = [];
    const processedFiles = new Set<string>(); // Track all files processed in this drop

    const processEntry = async (entry: FileSystemEntry, path: string = '') => {
      const fullPath = path ? `${path}/${entry.name}` : entry.name;

      if (entry.isFile) {
        const file = await new Promise<File>((resolve) => {
          (entry as FileSystemFileEntry).file(resolve);
        });

        // Skip if we've already processed this file
        if (processedFiles.has(fullPath)) {
          return;
        }
        processedFiles.add(fullPath);

        if (file.type.startsWith('image/')) {
          // Validate image type and size
          const validationError = validateImage(file);
          if (validationError) {
            duplicates.push(`${fullPath} (${validationError})`);
            return;
          }

          if (isDuplicateImage(file, [...images, ...imageFiles])) {
            duplicates.push(fullPath);
          } else {
            const preview = URL.createObjectURL(file);
            imageFiles.push({
              file,
              url: preview,
              alt: file.name,
              description: '',
              preview,
              contentType: file.type
            });
          }
        }
      } else if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
          reader.readEntries(resolve);
        });
        for (const entry of entries) {
          await processEntry(entry, fullPath);
        }
      }
    };

    // Process all items in parallel
    const processPromises = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          processPromises.push(processEntry(entry));
        }
      }
    }

    // Wait for all items to be processed
    await Promise.all(processPromises);

    if (duplicates.length > 0) {
      setDuplicateError(`התמונות הבאות כבר קיימות: ${duplicates.join(', ')}`);
    }

    if (imageFiles.length > 0) {
      onImagesChange([...images, ...imageFiles]);
      if (images.length === 0) {
        onMainImageChange(0);
      }
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setDuplicateError(null);

    const imageFiles: ImageUploaderImage[] = [];
    const duplicates: string[] = [];
    const processedFiles = new Set<string>();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fullPath = file.webkitRelativePath || file.name;

      // Skip if we've already processed this file
      if (processedFiles.has(fullPath)) {
        continue;
      }
      processedFiles.add(fullPath);

      if (file.type.startsWith('image/')) {
        // Validate image type and size
        const validationError = validateImage(file);
        if (validationError) {
          duplicates.push(`${fullPath} (${validationError})`);
          continue;
        }

        if (isDuplicateImage(file, [...images, ...imageFiles])) {
          duplicates.push(fullPath);
        } else {
          const preview = URL.createObjectURL(file);
          imageFiles.push({
            file,
            url: preview,
            alt: file.name,
            description: '',
            preview,
            contentType: file.type
          });
        }
      }
    }

    if (duplicates.length > 0) {
      setDuplicateError(`התמונות הבאות כבר קיימות: ${duplicates.join(', ')}`);
    }

    if (imageFiles.length > 0) {
      onImagesChange([...images, ...imageFiles]);
      if (images.length === 0) {
        onMainImageChange(0);
      }
    }
  };

  const handleImageDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    // Only allow dragging the image container, not the image itself
    if (e.target instanceof HTMLImageElement) {
      e.preventDefault();
      return;
    }
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Add a custom data attribute to identify this as a reorder operation
    e.dataTransfer.setData('text/plain', 'reorder');
  };

  const handleImageDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only handle reorder drag operations
    if (e.dataTransfer.types.includes('text/plain') && 
        e.dataTransfer.getData('text/plain') === 'reorder' && 
        draggedImageIndex !== null) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Only handle reorder operations
    if (e.dataTransfer.types.includes('text/plain') && 
        e.dataTransfer.getData('text/plain') === 'reorder' && 
        draggedImageIndex !== null) {
      
      // Reorder the images array
      const newImages = [...images];
      const [draggedImage] = newImages.splice(draggedImageIndex, 1);
      newImages.splice(dropIndex, 0, draggedImage);

      // Update the main image index if needed
      let newMainImageIndex = mainImageIndex;
      if (mainImageIndex === draggedImageIndex) {
        newMainImageIndex = dropIndex;
      } else if (
        (draggedImageIndex < mainImageIndex && dropIndex >= mainImageIndex) ||
        (draggedImageIndex > mainImageIndex && dropIndex <= mainImageIndex)
      ) {
        newMainImageIndex = mainImageIndex + (draggedImageIndex < dropIndex ? -1 : 1);
      }

      onImagesChange(newImages);
      if (newMainImageIndex !== mainImageIndex) {
        onMainImageChange(newMainImageIndex);
      }
    }
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
  };

  // Create event handler factories to handle the index parameter
  const createDragStartHandler = (index: number) => (e: React.DragEvent<HTMLDivElement>) => handleImageDragStart(e, index);
  const createDragOverHandler = () => (e: React.DragEvent<HTMLDivElement>) => handleImageDragOver(e);
  const createDropHandler = (index: number) => (e: React.DragEvent<HTMLDivElement>) => handleImageDrop(e, index);

  return (
    <div 
      className="space-y-4"
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => e.preventDefault()}
      onDragLeave={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <div 
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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
          {duplicateError && (
            <p className="text-sm text-red-600 mt-2">{duplicateError}</p>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          onDragLeave={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        >
          <label className="block text-sm font-medium text-gray-700 mb-4">
            בחר תמונה ראשית
          </label>
          <div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.preventDefault()}
            onDragLeave={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
          >
            {images.map((image, index) => (
              <div 
                key={image.url} 
                className="space-y-2"
                draggable
                onDragStart={createDragStartHandler(index)}
                onDragOver={createDragOverHandler()}
                onDrop={createDropHandler(index)}
                onDragEnd={handleImageDragEnd}
                style={{ 
                  cursor: 'move',
                  opacity: draggedImageIndex === index ? 0.5 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                <div
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                    mainImageIndex === index ? 'border-indigo-500' : 'border-transparent'
                  } ${draggedImageIndex === index ? 'ring-2 ring-indigo-500' : ''}`}
                  onClick={() => onMainImageChange(index)}
                >
                  <Image
                    src={image.preview || image.url}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    unoptimized
                    draggable="false"
                    onDragStart={(e) => e.preventDefault()}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                    {onImageDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageDelete(index);
                        }}
                        className="text-white bg-red-600 hover:bg-red-700 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
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
                <textarea
                  dir="rtl"
                  value={image.description}
                  onChange={(e) => {
                    const newImages = [...images];
                    newImages[index] = {
                      ...newImages[index],
                      description: e.target.value
                    };
                    onImagesChange(newImages);
                  }}
                  placeholder="תיאור התמונה..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 