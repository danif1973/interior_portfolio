'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '@/types/project';

interface ProjectGalleryProps {
  project: Project;
}

export default function ProjectGallery({ project }: ProjectGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Find the index of the main image
  useEffect(() => {
    console.log('=== Project Gallery Component Mounted ===');
    console.log('Gallery details:', {
      projectId: project.id,
      totalImages: project.images.length,
      mainImageUrl: project.mainImage.url
    });

    const mainImageIndex = project.images.findIndex(img => img.url === project.mainImage.url);
    console.log('🔍 Main image index:', mainImageIndex);
    setSelectedImageIndex(mainImageIndex >= 0 ? mainImageIndex : 0);
  }, [project]);

  const handleImageClick = (index: number) => {
    console.log('🖼️ Image clicked:', {
      index,
      imageUrl: project.images[index].url
    });
    setSelectedImageIndex(index);
    setIsZoomed(false);
  };

  const handleNext = useCallback(() => {
    const nextIndex = (selectedImageIndex + 1) % project.images.length;
    console.log('➡️ Next image:', {
      fromIndex: selectedImageIndex,
      toIndex: nextIndex,
      imageUrl: project.images[nextIndex].url
    });
    setSelectedImageIndex(nextIndex);
  }, [project.images.length, selectedImageIndex]);

  const handlePrevious = useCallback(() => {
    const prevIndex = (selectedImageIndex - 1 + project.images.length) % project.images.length;
    console.log('⬅️ Previous image:', {
      fromIndex: selectedImageIndex,
      toIndex: prevIndex,
      imageUrl: project.images[prevIndex].url
    });
    setSelectedImageIndex(prevIndex);
  }, [project.images.length, selectedImageIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    console.log('⌨️ Key pressed:', e.key);
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'Escape') {
      console.log('🔍 Zoom view closed (Escape key)');
      setIsZoomed(false);
    }
  }, [handleNext, handlePrevious]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="space-y-2">
      {/* Main Image */}
      <div className="max-w-[84rem] mx-auto">
        <div className="relative aspect-[16/9]">
          <Image
            src={project.images[selectedImageIndex].url}
            alt={project.images[selectedImageIndex].alt || project.title}
            fill
            className="object-cover cursor-zoom-in"
            priority
            onClick={() => {
              console.log('🔍 Zoom view opened');
              setIsZoomed(true);
            }}
            onError={(e) => console.error(`❌ Error loading main image: ${project.images[selectedImageIndex].url}`, e)}
          />
        </div>

        {/* Image Description */}
        {project.images[selectedImageIndex].description && (
          <div className="mt-4 text-right">
            <p className="text-xl text-gray-600">{project.images[selectedImageIndex].description}</p>
          </div>
        )}
      </div>

      {/* Thumbnail Grid */}
      <div className="max-w-[84rem] mx-auto mt-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1">
          {project.images.map((image, index) => (
            <motion.div
              key={index}
              className={`relative aspect-square cursor-pointer transition-opacity ${
                selectedImageIndex === index ? 'ring-2 ring-indigo-600' : 'hover:opacity-80'
              }`}
              onClick={() => handleImageClick(index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Image
                src={image.url}
                alt={image.alt || project.title}
                fill
                className="object-cover"
                onError={(e) => console.error(`❌ Error loading thumbnail: ${image.url}`, e)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Zoom View */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={() => {
              console.log('🔍 Zoom view closed (background click)');
              setIsZoomed(false);
            }}
          >
            <div 
              className="relative w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={project.images[selectedImageIndex].url}
                alt={project.images[selectedImageIndex].alt || project.title}
                fill
                className="object-contain"
                priority
                onError={(e) => console.error(`❌ Error loading zoomed image: ${project.images[selectedImageIndex].url}`, e)}
              />

              {/* Navigation Arrows */}
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Close Button */}
              <button
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🔍 Zoom view closed (close button)');
                  setIsZoomed(false);
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                {selectedImageIndex + 1} / {project.images.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 