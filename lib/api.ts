const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

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
      window.location.href = '/login';
    }
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API 오류 ${res.status}: ${errorBody}`);
  }

  return res.json() as Promise<T>;
}

/**
 * 금액을 한국식 원화로 포매팅
 * ex) 1234000 → "1,234,000원"
 */
export function formatKRW(amount: number): string {
  return `${(amount ?? 0).toLocaleString('ko-KR')}원`;
}

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
