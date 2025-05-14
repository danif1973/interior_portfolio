'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-heebo">
                דף הבית
              </Link>              
              <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-heebo">
                אודות
              </Link>
              {/* <Link href="/projects" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-heebo">
                פרוייקטים
              </Link> */}
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-heebo">
                צור קשר
              </Link>
             
            </div>

            <Link href="/" className="text-4xl font-light text-gray-800 tracking-wide">
              <span className="font-['Great_Vibes'] text-5xl">Natalie&apos;s Imagination</span>
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden"
              >
                <div className="px-2 pt-2 pb-3 space-y-1">
                  <Link
                    href="/contact"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-heebo text-right"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    צור קשר
                  </Link>
                  <Link
                    href="/about"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-heebo text-right"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    אודות
                  </Link>
                  {/* <Link
                    href="/projects"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-heebo text-right"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    פרוייקטים
                  </Link> */}
                  <Link
                    href="/"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-heebo text-right"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    דף הבית
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-medium mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/natalie.engler.39" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4 text-right font-heebo">צור קשר</h4>
              <ul className="space-y-2 text-gray-400 text-right font-heebo">
                <li>הצנחנים 20</li>
                <li>הוד השרון</li>
                <li>054-4806139</li>
                <li>natalie.engler@gmail.com</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4 text-right font-heebo">קישורים</h4>
              <ul className="space-y-2 text-right">
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white transition-colors duration-200 font-heebo">
                    צור קשר
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-200 font-heebo">
                    אודות
                  </Link>
                </li>
                {/* <li>
                  <Link href="/projects" className="text-gray-400 hover:text-white transition-colors duration-200 font-heebo">
                    פרוייקטים
                  </Link>
                </li> */}
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors duration-200 font-heebo">
                     דף הבית
                  </Link>
                </li>
              </ul>
            </div>
            <div className="text-left">
              <h3 className="text-3xl font-light mb-4">
                <span className="font-['Great_Vibes'] text-4xl">Natalie&apos;s Imagination</span>
              </h3>
              <p className="text-gray-400 [direction:ltr]">
                Creating beautiful spaces that inspire.
              </p>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} <span className="font-['Great_Vibes'] text-2xl">Natalie&apos;s Imagination</span>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
} 