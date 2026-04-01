'use client';

import { useCallback, useMemo } from 'react';
import {
  useParams,
  usePathname,
  useRouter as useNextRouter,
} from 'next/navigation';
import ko, { type Translations } from './ko';
import en from './en';

const locales: Record<string, Translations> = { ko, en };

/**
 * URL 기반 다국어 훅
 * [lang] 경로 파라미터에서 언어를 읽고, changeLang으로 URL 전환
 */
export function useTranslation() {
  const params = useParams();
  const pathname = usePathname();
  const router = useNextRouter();

  const lang = (params?.lang as string) || 'ko';
  const t: Translations = locales[lang] || ko;

  const changeLang = useCallback(
    (newLang: string) => {
      const rest = pathname.replace(/^\/(ko|en)/, '') || '/dashboard';
      router.push(`/${newLang}${rest}`);
    },
    [pathname, router],
  );

  return { t, lang, changeLang };
}

/**
 * useRouter wrapper — 경로에 /{lang} 자동 접두사
 * Usage: const router = useLangRouter();
 *        router.push('/dashboard'); // → /ko/dashboard
 */
export function useLangRouter() {
  const nativeRouter = useNextRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'ko';

  return useMemo(
    () => ({
      push: (path: string) => nativeRouter.push(`/${lang}${path}`),
      replace: (path: string) => nativeRouter.replace(`/${lang}${path}`),
      back: () => nativeRouter.back(),
      forward: () => nativeRouter.forward(),
      refresh: () => nativeRouter.refresh(),
      prefetch: (path: string) => nativeRouter.prefetch(`/${lang}${path}`),
    }),
    [nativeRouter, lang],
  );
}
