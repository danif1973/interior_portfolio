'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Copyright from '@/components/Copyright';
import { useEffect, useState } from 'react';

export default function AboutPage() {
  const [story, setStory] = useState('');

  useEffect(() => {
    fetch('/user_files/my_story.txt')
      .then((res) => res.text())
      .then(setStory)
      .catch(() => setStory('לא ניתן לטעון את הסיפור כרגע.'));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative flex-1 min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/about.jpg"
            alt="אודות"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-6 tracking-wide"
          >
            הסיפור שלי
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-200 max-w-2xl mx-auto"
          >
            {story || '...טוען'}
          </motion.p>
          <div
            className="mt-8 text-5xl text-white"
            style={{ fontFamily: "'Dana Yad Alef Alef Alef Normal', cursive" }}
          >
            נטלי אנגלר
          </div>
        </div>
      </section>

      {/* Copyright Section */}
      <Copyright />
    </div>
  );
} 