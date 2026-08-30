import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    'https://aegis-pregnancy-companion.blocpodcreative.chatgpt.site',
  ),
  title: 'Aegis — Your pregnancy care companion',
  description:
    'A calm, private workspace for pregnancy and postpartum appointments, notes, tracking, and care preparation.',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'Aegis — Your pregnancy care companion',
    description:
      'A calm, local workspace for appointments, notes, tracking, and care preparation.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aegis — Your pregnancy care companion',
    description:
      'A calm, local workspace for appointments, notes, tracking, and care preparation.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
