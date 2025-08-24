import { getServerClient } from '@/lib/supabaseServer';
import type { Metadata } from 'next';
import { DM_Sans, Space_Grotesk } from 'next/font/google';
import type React from 'react';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'SocialConnect - Connect, Share, Discover',
  description: 'Join the next generation of social networking with SocialConnect. Connect with friends, share moments, and discover new communities.',
};

export const dynamic = 'force-dynamic';
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    isAdmin = !!profile?.is_admin;
  }
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
        {/* Main content only (footer removed per request) */}
        <main className="flex-1 w-full">{children}</main>
      </body>
    </html>
  );
}
