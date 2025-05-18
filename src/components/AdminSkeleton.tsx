'use client';

import React from 'react';

export default function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="animate-pulse mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>

        {/* Form Skeleton */}
        <div className="bg-white shadow rounded-lg p-6 animate-pulse">
          {/* Title Input Skeleton */}
          <div className="mb-6">
            <div className="h-4 bg-gray-200 rounded w-1/6 mb-2" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>

          {/* Summary Input Skeleton */}
          <div className="mb-6">
            <div className="h-4 bg-gray-200 rounded w-1/6 mb-2" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>

          {/* Description Input Skeleton */}
          <div className="mb-6">
            <div className="h-4 bg-gray-200 rounded w-1/6 mb-2" />
            <div className="h-32 bg-gray-200 rounded w-full" />
          </div>

          {/* Main Image Upload Skeleton */}
          <div className="mb-6">
            <div className="h-4 bg-gray-200 rounded w-1/6 mb-2" />
            <div className="h-40 bg-gray-200 rounded w-full" />
          </div>

          {/* Additional Images Upload Skeleton */}
          <div className="mb-6">
            <div className="h-4 bg-gray-200 rounded w-1/6 mb-2" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="aspect-square bg-gray-200 rounded" />
              ))}
            </div>
          </div>

          {/* Buttons Skeleton */}
          <div className="flex justify-end space-x-4">
            <div className="h-10 bg-gray-200 rounded w-24" />
            <div className="h-10 bg-gray-200 rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  );
} 