'use client';

import React, { useEffect } from 'react';
import { AnimatedSection } from '@/components/AnimatedSection';
import ProjectGallery from '@/components/ProjectGallery';
import Link from 'next/link';
import { Project } from '@/types/project';

interface ProjectPageProps {
  project: Project;
  backHref: string;
  backText: string;
}

export default function ProjectPage({ project, backHref, backText }: ProjectPageProps) {
  useEffect(() => {
    console.log('=== Project Page Component Mounted ===');
    console.log('Project details:', {
      id: project.id,
      title: project.title,
      summary: project.summary,
      imageCount: project.images.length,
      mainImageUrl: project.mainImage.url
    });
  }, [project]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50" dir="rtl">
      {/* Header Section with 3D Effect */}
      <section className="relative pt-12 pb-4 md:pt-16 md:pb-6 border-b border-gray-100 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button with Hover Effect */}
          <Link 
            href={backHref} 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-all duration-300 mb-8 group"
            onClick={() => console.log('🔙 Back button clicked')}
          >
            <svg className="w-5 h-5 ml-2 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="group-hover:underline">{backText}</span>
          </Link>

          {/* Project Title and Description with 3D Effect */}
          <AnimatedSection>
            <div className="relative bg-white rounded-2xl p-8 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] hover:-translate-y-1">
              <div className="text-right space-y-6">
                <h4 className="text-3xl md:text-[3.5rem] font-extralight text-gray-900 tracking-tight leading-none">
                  {project.title}
                </h4>
                <p className="text-xl md:text-3xl text-gray-600 leading-relaxed font-light">
                  {project.summary}
                </p>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <p className="text-base md:text-lg text-gray-500 leading-relaxed font-light">
                  {project.description}
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="pt-4 md:pt-6 pb-12 md:pb-16 bg-gradient-to-br from-gray-200 to-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection delay={0.2}>
            <ProjectGallery project={project} />
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
} 