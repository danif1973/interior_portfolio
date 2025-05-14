'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Project } from '@/data/projects';

interface AnimatedProjectCardProps {
  project: Project;
}

export default function AnimatedProjectCard({ project }: AnimatedProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative bg-white rounded-2xl shadow-sm overflow-hidden"
    >
      <Link href={`/projects/${project.id}`}>
        <div className="relative aspect-[4/3]">
          <Image
            src={project.mainImage.url}
            alt={project.mainImage.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <div className="p-6 text-right">
          <h3 className="text-xl font-medium text-gray-900 mb-2">{project.title}</h3>
          <p className="text-gray-600">{project.summary}</p>
        </div>
      </Link>
    </motion.div>
  );
} 