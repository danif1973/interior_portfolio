'use client';

import Image from 'next/image';

interface ProjectImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function ProjectImage({ src, alt, className, priority }: ProjectImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      priority={priority}
      onError={(e) => console.error(`❌ Error loading image: ${src}`, e)}
    />
  );
} 