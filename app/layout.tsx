import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/components/auth-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'Lakbai - AI-powered travel planning and navigation',
  description: 'AI-powered travel planning and navigation'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} light min-h-screen antialiased`}>
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
