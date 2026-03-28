'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatCard from '@/components/ui/StatCard';
import { apiClient, formatKRW, formatDateKR } from '@/lib/api';

// ─── 타입 정의 ──────────────────────────────────────────────────────────────

interface MembersResponse {
  total: number;
}

interface MonthlyStats {
  month: number;
  total: number;
}

interface OfferingsStatsResponse {
  monthly?: MonthlyStats[];
  // 백엔드 구조에 맞게 조정 가능
  [key: string]: unknown;
}

interface FinanceSummaryResponse {
  expense?: number;
  current_balance?: number;
  [key: string]: unknown;
}

interface Offering {
  id: string | number;
  date: string;
  offering_type?: string;
  type?: string;
  amount: number;
}

interface OfferingsListResponse {
  items?: Offering[];
  data?: Offering[];
  results?: Offering[];
}

// ─── 날짜 헬퍼 ──────────────────────────────────────────────────────────────

function getTodayKR(): string {
  const now = new Date('2026-03-13T11:39:32-04:00');
  return `${now.getFullYear()}년 ${String(now.getMonth() + 1).padStart(2, '0')}월 ${String(now.getDate()).padStart(2, '0')}일`;
}

const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 3; // 3월

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [monthlyOffering, setMonthlyOffering] = useState<number | null>(null);
  const [monthlyExpense, setMonthlyExpense] = useState<number | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [recentOfferings, setRecentOfferings] = useState<Offering[]>([]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [membersRes, offeringStatsRes, financeRes, recentOfferingsRes] =
          await Promise.allSettled([
            apiClient<MembersResponse>('/api/v1/members?size=1'),
            apiClient<OfferingsStatsResponse>(`/api/v1/offerings/stats?year=${CURRENT_YEAR}`),
            apiClient<FinanceSummaryResponse>(`/api/v1/finance/reports/summary?year=${CURRENT_YEAR}`),
            apiClient<OfferingsListResponse | Offering[]>('/api/v1/offerings?size=5'),
          ]);

        // 전체 교인 수
        if (membersRes.status === 'fulfilled') {
          setTotalMembers(membersRes.value.total ?? 0);
        }

        // 이번 달 헌금
        if (offeringStatsRes.status === 'fulfilled') {
          const stats = offeringStatsRes.value;
          const monthlyArr = stats.monthly ?? [];
          const thisMonth = monthlyArr.find((m: MonthlyStats) => m.month === CURRENT_MONTH);
          setMonthlyOffering(thisMonth?.total ?? 0);
        }

        // 재정 (지출 + 잔액)
        if (financeRes.status === 'fulfilled') {
          const fin = financeRes.value;
          setMonthlyExpense(typeof fin.expense === 'number' ? fin.expense : 0);
          setCurrentBalance(typeof fin.current_balance === 'number' ? fin.current_balance : 0);
        }

        // 최근 헌금
        if (recentOfferingsRes.status === 'fulfilled') {
          const raw = recentOfferingsRes.value;
          const list: Offering[] = Array.isArray(raw)
            ? raw
            : (raw as OfferingsListResponse).items
            ?? (raw as OfferingsListResponse).data
            ?? (raw as OfferingsListResponse).results
            ?? [];
          setRecentOfferings(list.slice(0, 5));
        }
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  // ─── STAT CARDS ────────────────────────────────────────────────────────────
  const statCards = [
    {
      title: '전체 교인 수',
      value: totalMembers !== null ? `${totalMembers.toLocaleString()}명` : '--',
      subtitle: '등록 교인 기준',
      accentColor: '#6366f1',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: '이번 달 헌금',
      value: monthlyOffering !== null ? formatKRW(monthlyOffering) : '--',
      subtitle: `${CURRENT_YEAR}년 ${CURRENT_MONTH}월`,
      accentColor: '#06b6d4',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      title: '이번 달 지출',
      value: monthlyExpense !== null ? formatKRW(monthlyExpense) : '--',
      subtitle: `${CURRENT_YEAR}년 ${CURRENT_MONTH}월`,
      accentColor: '#f59e0b',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
    },
    {
      title: '현재 잔액',
      value: currentBalance !== null ? formatKRW(currentBalance) : '--',
      subtitle: '재정 누계 기준',
      accentColor: '#10b981',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
  ];

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '36px 40px', maxWidth: '1100px' }}>

      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 6px', fontWeight: 500 }}>
          {getTodayKR()}
        </p>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.03em' }}>
          현황판
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '15px', margin: '6px 0 0' }}>
          교회 주요 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* 요약 카드 4개 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          marginBottom: '36px',
        }}
      >
        {statCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            loading={loading}
            subtitle={card.subtitle}
            accentColor={card.accentColor}
          />
        ))}
      </div>

      {/* 하단 2열 레이아웃 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'start' }}>

        {/* 최근 헌금 목록 */}
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
              최근 헌금 내역
            </h2>
            <Link
              href="/offerings"
              style={{ fontSize: '13px', color: 'var(--primary-400)', textDecoration: 'none', fontWeight: 600 }}
            >
              전체 보기 →
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton" style={{ height: '14px', width: '90px' }} />
                    <div className="skeleton" style={{ height: '12px', width: '60px' }} />
                  </div>
                  <div className="skeleton" style={{ height: '18px', width: '80px' }} />
                </div>
              ))}
            </div>
          ) : recentOfferings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: '14px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 12px' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              헌금 내역이 없습니다
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {recentOfferings.map((item, idx) => (
                <div
                  key={item.id ?? idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: idx < recentOfferings.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                      {item.offering_type ?? item.type ?? '일반 헌금'}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                      {formatDateKR(item.date)}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--primary-400)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {formatKRW(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 빠른 실행 버튼 */}
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border)',
            minWidth: '200px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            빠른 실행
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              href="/offerings/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
                transition: 'opacity 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.9')}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '1')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              헌금 입력
            </Link>
            <Link
              href="/members/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'rgba(5,150,105,0.12)',
                color: '#34d399',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                border: '1px solid rgba(52,211,153,0.25)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(5,150,105,0.2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(5,150,105,0.12)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              교인 등록
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
