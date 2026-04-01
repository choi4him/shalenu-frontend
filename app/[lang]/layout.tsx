'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LangLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const lang = (params?.lang as string) || 'ko';

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <>{children}</>;
}
