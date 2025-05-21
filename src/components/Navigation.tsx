'use client';

import Link from 'next/link';

export default function Navigation() {
  return (
    <>
      {/* Main Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-medium mb-4">עקבו אחרי</h4>
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/natalie.engler.39" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* WhatsApp */}
                <a href="https://wa.me/972544806139" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.52 3.48A11.77 11.77 0 0012 0C5.37 0 0 5.37 0 12a11.93 11.93 0 001.64 6.06L0 24l6.18-1.62A11.93 11.93 0 0012 24c6.63 0 12-5.37 12-12a11.77 11.77 0 00-3.48-8.52zM12 22a9.93 9.93 0 01-5.09-1.39l-.36-.21-3.67.96.98-3.58-.23-.37A9.93 9.93 0 012 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.6c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.62-.47-.16-.01-.36-.01-.56-.01-.19 0-.5.07-.76.34-.26.27-1 1-.97 2.43.03 1.43 1.04 2.81 1.19 3 .15.19 2.05 3.13 5.01 4.27.7.3 1.25.48 1.68.61.71.23 1.36.2 1.87.12.57-.09 1.65-.67 1.89-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.19-.53-.33z"/>
                  </svg>
                </a>
                {/* LinkedIn */}
                <a href="https://www.linkedin.com/in/natalie-engler-7589912" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 11.28h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-10h2.89v1.36h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v5.59z"/>
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
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors duration-200 font-heebo">
                     דף הבית
                  </Link>
                </li>
              </ul>
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-light mb-0">
                <span className="text-4xl" style={{ fontFamily: 'var(--font-great-vibes)' }}>Natalie Engler</span>
              </h3>
              <p className="text-gray-400 [direction:ltr]">
                Creating spaces that inspire.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
} 