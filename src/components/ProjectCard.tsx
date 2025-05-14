import Image from 'next/image';
import Link from 'next/link';

interface ProjectCardProps {
  id: string;
  title: string;
  summary: string;
  mainImage: {
    url: string;
    alt: string;
  };
}

export default function ProjectCard({ id, title, summary, mainImage }: ProjectCardProps) {
  return (
    <Link href={`/projects/${id}`} className="group">
      <div className="relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-[1.02]">
        <div className="aspect-[4/3] relative">
          <Image
            src={mainImage.url}
            alt={mainImage.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {summary}
          </p>
        </div>
      </div>
    </Link>
  );
} 