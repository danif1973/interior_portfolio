'use client';

import React from 'react';
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
  return (
    <main className="min-h-screen bg-white" dir="rtl">
      <section className="relative py-0.5 md:py-1 border-b border-gray-100">
        <div className="px-1">
          <Link 
            href={backHref} 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-0.5 md:mb-1"
          >
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {backText}
          </Link>
          <AnimatedSection>
            <div className="max-w-7xl mx-auto">
              <div className="text-right">
                <h4 className="text-2xl md:text-[3rem] font-extralight text-gray-900 mb-0.5 md:mb-1 tracking-tight leading-none">
                  {project.title}
                </h4>
                <p className="text-xl md:text-3xl text-gray-600 leading-relaxed mb-0.5 md:mb-1">
                  {project.summary}
                </p>
                <p className="text-base md:text-lg text-gray-500 leading-relaxed">
                  {project.description}
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-4">
        <div className="px-0">
          <AnimatedSection>
            <ProjectGallery project={project} />
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
} 