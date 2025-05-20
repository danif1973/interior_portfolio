import type { Metadata } from "next";
import { Lato, Heebo, Great_Vibes } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { cookies } from 'next/headers';

const lato = Lato({ 
  weight: ['100', '300', '400', '700', '900'],
  subsets: ["latin"],
  display: "swap",
});

const heebo = Heebo({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['hebrew'],
  display: 'swap',
  variable: '--font-heebo',
});

const greatVibes = Great_Vibes({ 
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-great-vibes',
});

export const metadata: Metadata = {
  title: "Natalie Engler | Interior Design",
  description: "A showcase of interior design projects and transformations",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get token from cookies - middleware will ensure it exists
  const cookieStore = cookies();
  const csrfToken = cookieStore.get('csrf_token')?.value || '';
c
  return (
    <html lang="he" dir="rtl" className={`${lato.className} ${heebo.variable} ${greatVibes.variable} min-h-screen bg-white`}>
      <head>
        <meta name="csrf-token" content={csrfToken} />
      </head>
      <body className="antialiased font-heebo flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-grow pt-20">
          {children}
        </div>
      </body>
    </html>
  );
}
