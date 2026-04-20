export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/**
 * 요금제 제한으로 인한 403 오류를 구분하기 위한 커스텀 에러 클래스
 */
export class PlanLimitError extends Error {
  constructor() {
    super('현재 요금제에서 사용할 수 없는 기능입니다.\n설정 > 요금제에서 업그레이드하세요.');
    this.name = 'PlanLimitError';
  }
}

/**
 * 백엔드 423 (계정 잠금) 응답을 호출측에서 구분할 수 있게 해주는 에러.
 * Retry-After 헤더(초 단위)를 `retryAfterSeconds` 로 실어 넘긴다.
 */
export class AccountLockedError extends Error {
  retryAfterSeconds: number | null;
  constructor(retryAfterSeconds: number | null, detail?: string) {
    super(detail ?? 'Account is locked');
    this.name = 'AccountLockedError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function parseRetryAfter(res: Response): number | null {
  const raw = res.headers.get('Retry-After');
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/**
 * Authorization 헤더 자동 삽입 fetch 래퍼
 * - 401 응답 시 /login 으로 리디렉트
 */
export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      const lang = window.location.pathname.split('/')[1] || 'ko';
      window.location.href = `/${lang}/login`;
    }
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  if (res.status === 403) {
    // 전역 배너 표시를 위해 CustomEvent 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('plan-limit-error'));
    }
    throw new PlanLimitError();
  }

  if (res.status === 423) {
    // 계정 잠금 — 호출측이 Retry-After 를 UX 에 반영할 수 있도록 전용 에러
    const retry = parseRetryAfter(res);
    let detail: string | undefined;
    try {
      const body = (await res.json()) as { detail?: string };
      detail = body?.detail;
    } catch {
      /* ignore */
    }
    throw new AccountLockedError(retry, detail);
  }

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API 오류 ${res.status}: ${errorBody}`);
  }

  return res.json() as Promise<T>;
}

/**
 * 금액을 교회 통화 설정에 따라 포매팅
 * KRW: 1234000 → "₩1,234,000"
 * USD: 1234.56 → "$1,234.56"
 */
export function formatCurrency(amount: number): string {
  const currency = typeof window !== 'undefined' ? (localStorage.getItem('currency') ?? 'KRW') : 'KRW';
  const v = amount ?? 0;

  const CURRENCY_CONFIG: Record<string, { symbol: string; decimals: number }> = {
    KRW: { symbol: '₩', decimals: 0 },
    USD: { symbol: '$', decimals: 2 },
    JPY: { symbol: '¥', decimals: 0 },
    CNY: { symbol: '¥', decimals: 2 },
    EUR: { symbol: '€', decimals: 2 },
    GBP: { symbol: '£', decimals: 2 },
    CAD: { symbol: '$', decimals: 2 },
    AUD: { symbol: '$', decimals: 2 },
    SGD: { symbol: '$', decimals: 2 },
    PHP: { symbol: '₱', decimals: 2 },
    VND: { symbol: '₫', decimals: 0 },
    THB: { symbol: '฿', decimals: 2 },
  };

  const cfg = CURRENCY_CONFIG[currency] ?? { symbol: currency, decimals: 2 };
  return `${cfg.symbol}${v.toLocaleString('en-US', { minimumFractionDigits: cfg.decimals, maximumFractionDigits: cfg.decimals })}`;
}

/** @deprecated formatCurrency 사용 */
export const formatKRW = formatCurrency;

/**
 * 날짜를 한국식으로 포매팅
 * ex) "2024-03-15" → "2024년 03월 15일"
 */
export function formatDateKR(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}년 ${m}월 ${day}일`;
}
