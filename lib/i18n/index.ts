import { useSyncExternalStore, useCallback } from 'react';
import ko, { type Translations } from './ko';
import en from './en';

const locales: Record<string, Translations> = { ko, en };

function getStoreLang(): string {
  if (typeof window === 'undefined') return 'ko';
  return localStorage.getItem('lang') || 'ko';
}

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setLang(lang: string) {
  localStorage.setItem('lang', lang);
  listeners.forEach((cb) => cb());
}

export function useTranslation() {
  const lang = useSyncExternalStore(subscribe, getStoreLang, () => 'ko');
  const t: Translations = locales[lang] || ko;
  const changeLang = useCallback((l: string) => setLang(l), []);
  return { t, lang, changeLang };
}
