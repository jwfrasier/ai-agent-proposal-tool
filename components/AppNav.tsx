import Link from 'next/link';

export function AppNav() {
  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-semibold">GovContracts</Link>
        <div className="flex gap-4 text-sm">
          <Link href="/">Dashboard</Link>
          <Link href="/opps">All opportunities</Link>
          <Link href="/profile">Profile</Link>
        </div>
      </div>
    </nav>
  );
}
