'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/logout', { method: 'POST' }).then(() => {
      router.push('/admin/login');
      router.refresh();
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col justify-center items-center px-4">
      <div className="text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-white border border-black/5 shadow-sm mb-4">
          <LogOut className="h-5 w-5 text-gray-400 animate-pulse" />
        </div>
        <h1 className="text-xl font-headline font-bold text-gray-900 tracking-tight">
          Signing Out
        </h1>
        <p className="mt-1 text-sm text-gray-400 font-light">
          Clearing session and redirecting to login...
        </p>
      </div>
    </div>
  );
}
