'use client';

import React from 'react';

export default function ProjectGallerySkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {/* Main Image Skeleton */}
      <div className="max-w-[84rem] mx-auto">
        <div className="relative aspect-[16/9] bg-gray-200 rounded-lg">
          {/* Image Description Skeleton */}
          <div className="mt-4 h-6 bg-gray-200 rounded w-3/4 mx-auto" />
        </div>
      </div>

      {/* Thumbnail Grid Skeleton */}
      <div className="max-w-[84rem] mx-auto mt-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="relative aspect-square bg-gray-200 rounded"
            />
          ))}
        </div>
      </div>
    </div>
  );
} 