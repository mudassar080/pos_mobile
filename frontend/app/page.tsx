'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Smartphone } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gap-4 overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-3xl" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 text-white">
        <Smartphone className="h-8 w-8" />
      </div>
      <Loader2 className="relative h-8 w-8 animate-spin text-white/90" />
      <p className="relative text-sm font-medium text-indigo-100">Loading POS...</p>
    </div>
  );
}
