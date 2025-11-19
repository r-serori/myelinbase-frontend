'use client';
import { getCurrentUser } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
          setOk(true);
          return;
        }
        await getCurrentUser();
        setOk(true);
      } catch {
        router.replace('/login');
      }
    })();
  }, [router]);
  return ok ? <>{children}</> : null;
}


