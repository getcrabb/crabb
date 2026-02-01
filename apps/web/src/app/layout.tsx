import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CRABB - Security Scanner for OpenClaw AI Agents',
  description: 'Scan your OpenClaw AI agent for security vulnerabilities. Get a score from 0-100 with prioritized findings. Quick, easy, no security expertise needed.',
  openGraph: {
    title: 'CRABB - Security Scanner for OpenClaw AI Agents',
    description: 'Is your AI agent leaking your secrets? Find out in seconds.',
    url: 'https://crabb.ai',
    siteName: 'CRABB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CRABB - Security Scanner for OpenClaw AI Agents',
    description: 'Is your AI agent leaking your secrets? Find out in seconds.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="wave-pattern">
          {children}
        </div>
      </body>
    </html>
  );
}
