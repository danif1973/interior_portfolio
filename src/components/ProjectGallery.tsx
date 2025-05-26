'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '@/types/project';
import { ErrorBoundary } from './ErrorBoundary';

interface ProjectGalleryProps {
  project: Project;
}

function ProjectGalleryContent({ project }: ProjectGalleryProps) {
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
    <div className="space-y-8">
      {/* Main Image Row with Extra Section */}
      <div className="max-w-[84rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* Main Image and Description */}
          <div className="relative group flex-1">
            {/* 3D Border Effect Container */}
            <div className="relative aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-2 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-300 group-hover:shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] group-hover:-translate-y-1 cursor-zoom-in"
              onClick={() => setIsZoomed(true)}
            >
              {/* Inner Container with Image */}
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full h-full"
                  >
                    <Image
                      src={project.images[selectedImageIndex].url}
                      alt={project.images[selectedImageIndex].alt || project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      priority
                      onError={(e) => console.error(`❌ Error loading main image: ${project.images[selectedImageIndex].url}`, e)}
                    />
                  </motion.div>
                </AnimatePresence>
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            {/* Image Description */}
            {project.images[selectedImageIndex].description && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 text-right"
              >
                <p className="text-xl text-gray-700 font-light leading-relaxed mr-8">
                  {project.images[selectedImageIndex].description}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail Grid */}
      <div className="max-w-[84rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {project.images.map((image, index) => (
            <motion.div
              key={index}
              className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden ${
                selectedImageIndex === index 
                  ? 'ring-2 ring-indigo-600 ring-offset-2' 
                  : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-2'
              } transition-all duration-200`}
              onClick={() => setSelectedImageIndex(index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Image
                src={image.url}
                alt={image.alt || project.title}
                fill
                className="object-cover"
              />
              {/* Thumbnail overlay */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200" />
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
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50"
            onClick={() => {
              console.log('🔍 Zoom view closed (background click)');
              setIsZoomed(false);
            }}
          >
            <div 
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative w-full h-full max-w-[90vw] max-h-[90vh]"
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm transition-colors z-10"
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm transition-colors z-10"
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
                  className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
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
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-full backdrop-blur-sm">
                  {selectedImageIndex + 1} / {project.images.length}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProjectGallery(props: ProjectGalleryProps) {
  return (
    <ErrorBoundary>
      <ProjectGalleryContent {...props} />
    </ErrorBoundary>
  );
} 