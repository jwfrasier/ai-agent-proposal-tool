import './globals.css';
import { AppNav } from '@/components/AppNav';

export const metadata = {
  title: 'GovContracts',
  description: 'SAT-range federal contract opportunity tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AppNav />
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
