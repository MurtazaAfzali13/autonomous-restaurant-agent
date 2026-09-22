'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AdminDeleteByIdPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const id = Number(params?.id);
      if (!id || Number.isNaN(id)) {
        router.replace('/admin');
        return;
      }

      // API expects DELETE with JSON body: { id }
      await fetch('/api/meals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      router.replace('/admin');
    };
    run();
  }, [params, router]);

  return (
    <div className="p-6">
      <p>Deleting meal...</p>
    </div>
  );
}


