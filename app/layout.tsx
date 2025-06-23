'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from './components/Header';
import { Toaster } from "react-hot-toast";
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideHeader = pathname?.startsWith('/chat');

  return (
    <ClerkProvider>
      <html lang="en" className="bg-gray-900 text-white">
        <body className={`${inter.className}`}>
          {!hideHeader && <Header />}
          <Toaster position='top-right' />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}