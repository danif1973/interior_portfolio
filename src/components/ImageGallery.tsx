'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface Image {
  url: string;
  alt: string;
  description: string;
}

interface ImageGalleryProps {
  images: Image[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') setIsFullscreen(false);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative">
      {/* Main Image */}
      <div 
        className="relative aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer"
        onClick={() => setIsFullscreen(true)}
      >
        <Image
          src={images[currentIndex].url}
          alt={images[currentIndex].alt}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white text-lg">Click to view fullscreen</span>
        </div>
      </div>

      {/* Image Description */}
      <p className="mt-4 text-gray-600">{images[currentIndex].description}</p>

      {/* Navigation Buttons */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4">
        <button
          onClick={prevImage}
          className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-lg transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextImage}
          className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-lg transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Thumbnails */}
      <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={image.url}
            onClick={() => setCurrentIndex(index)}
            className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden ${
              index === currentIndex ? 'ring-2 ring-indigo-500' : ''
            }`}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Fullscreen View */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={images[currentIndex].url}
                alt={images[currentIndex].alt}
                fill
                className="object-contain"
                priority
              />
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 