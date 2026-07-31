'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/logout', { method: 'POST' }).then(() => {
      router.push('/admin/login');
      router.refresh();
    });
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <p className="text-gray-500">Signing out...</p>
    </div>
  );
}
