export default function Copyright() {
  return (
    <div className="bg-gray-950 py-4 w-full">
      <div className="container mx-auto px-4">
        <div className="border-t border-gray-800 pt-4">
          <p className="text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} <span className="text-xl" style={{ fontFamily: 'var(--font-great-vibes)' }}>Natalie Engler</span>. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
} 