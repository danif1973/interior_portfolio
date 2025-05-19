'use client';

import { useEffect } from 'react';

export default function MobileScroll() {
  useEffect(() => {
    // Check if it's a mobile device
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // Scroll to hero section
      const heroSection = document.querySelector('section');
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return null; // This component doesn't render anything
} 