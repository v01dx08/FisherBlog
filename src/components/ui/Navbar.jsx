import Link from 'next/link';
import { Anchor } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="clay-card rounded-none rounded-b-3xl px-8 py-4 mb-8 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
        <Anchor className="w-8 h-8" />
        FishViet
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/admin" className="font-medium hover:text-blue-500 transition-colors">Admin</Link>
        <Link href="/login" className="font-medium hover:text-blue-500 transition-colors">Login</Link>
        <Link href="/legal" className="font-medium hover:text-blue-500 transition-colors">Legal</Link>
      </div>
    </nav>
  );
}
