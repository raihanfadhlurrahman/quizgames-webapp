import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Islamic Millionaire - Belajar Islam Sambil Bermain',
  description: 'Mini web game edukasi berbasis Next.js untuk media sosialisasi interaktif KKN Wedomartani.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased bg-[#0F172A] text-slate-100">
        {children}
      </body>
    </html>
  );
}
