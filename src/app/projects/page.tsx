import { loadProjects } from '../lib/projectLoader';
import AnimatedProjectCard from '@/components/AnimatedProjectCard';

export default async function ProjectsPage() {
  const projects = await loadProjects();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Projects</h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto">
              Explore our portfolio of stunning interior design projects that showcase our expertise and creativity.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <AnimatedProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
} 