import Image from 'next/image';
import Link from 'next/link';
import { AnimatedSection } from '@/components/AnimatedSection';
import { loadProjects } from './lib/projectLoader';
import ScrollLink from '@/components/ScrollLink';

export default async function Home() {
  const projects = await loadProjects();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative h-screen">
        <div className="absolute inset-0">
          <Image
            src="/images/splash.jpg"
            alt="Interior Design"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <AnimatedSection className="text-center text-white max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">דמיינו את הבית שלכם</h1>
            <p className="text-xl md:text-2xl mb-8 font-light leading-relaxed">
              מגשימים לכם את החלום.
            </p>
            <ScrollLink
              href="#projects"
              className="inline-block bg-white text-gray-900 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium text-lg"
            >
              הפרוייקטים שלי
            </ScrollLink>
          </AnimatedSection>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="projects" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-4">הפרוייקטים שלי</h2>
           
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Link 
                key={project.id}
                href={`/projects/${project.id}`}
                className="block group"
              >
                <AnimatedSection
                  className="relative bg-white rounded-2xl shadow-sm overflow-hidden h-full"
                >
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
                </AnimatedSection>
              </Link>
            ))}
          </div>

          {/* <AnimatedSection className="text-center mt-12">
            <ScrollLink
              href="#projects"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              צפו בכל הפרוייקטים
              <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </ScrollLink>
          </AnimatedSection> */}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive interior design solutions tailored to your unique vision
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Residential Design',
                description: 'Transform your home into a personalized sanctuary that reflects your lifestyle and aspirations.',
                icon: (
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
              },
              {
                title: 'Commercial Spaces',
                description: 'Create inspiring work environments that enhance productivity and leave a lasting impression.',
                icon: (
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
              },
              {
                title: 'Project Management',
                description: 'End-to-end project coordination ensring seamless execution and timely delivery.',
                icon: (
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
              },
            ].map((service) => (
              <AnimatedSection
                key={service.title}
                className="p-8 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="mb-6">{service.icon}</div>
                <h3 className="text-xl font-medium text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-gray-900 to-yellow-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-light text-white mb-8">מוכנים להגשים את החלום?</h2>
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-base font-medium rounded-lg text-white hover:bg-white hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
            >
              צרו קשר
              <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
