'use client';

import { useEffect } from 'react';

export function MobileScrollHandler() {
  useEffect(() => {
    // Check if we're on mobile
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // Scroll to hero section on mount
      const heroSection = document.getElementById('hero');
      if (heroSection) {
        window.scrollTo({
          top: heroSection.offsetTop,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  return null;
} 