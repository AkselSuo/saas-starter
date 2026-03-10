import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: 'Next.js SaaS Starter',
  description: 'Get started quickly with Next.js, Postgres, and Stripe.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

// When POSTGRES_URL is not set (demo mode), avoid calling DB so the app can load (e.g. Alignment Checker canvas).
const hasDb = Boolean(process.env.POSTGRES_URL);

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <SWRConfig
          value={{
            fallback: {
              // We do NOT await here. Only components that read this data will suspend.
              // In demo mode (no DB), pass null so no DB is invoked.
              '/api/user': hasDb ? getUser() : Promise.resolve(null),
              '/api/team': hasDb ? getTeamForUser() : Promise.resolve(null)
            }
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
