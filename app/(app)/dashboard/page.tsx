'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatCard from '@/components/ui/StatCard';
import { apiClient, formatKRW, formatDateKR } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation();
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
      title: t.dashboard.totalMembers,
      value: totalMembers !== null ? `${totalMembers.toLocaleString()}${t.common.people}` : '--',
      subtitle: t.dashboard.totalMembersSubtitle,
      accentColor: '#c9a84c',
      icon: (
        /* 양 아이콘 */
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="5"/>
          <circle cx="7" cy="7" r="2.5"/>
          <circle cx="17" cy="7" r="2.5"/>
          <path d="M8 18v3M16 18v3"/>
          <ellipse cx="12" cy="15" rx="6" ry="4"/>
        </svg>
      ),
    },
    {
      title: t.dashboard.monthlyOffering,
      value: monthlyOffering !== null ? formatKRW(monthlyOffering) : '--',
      subtitle: `${CURRENT_YEAR}${t.common.year} ${CURRENT_MONTH}${t.common.month}`,
      accentColor: '#e8d48b',
      icon: (
        /* 십자가+하트 아이콘 */
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="10" y="2" width="4" height="14" rx="1"/>
          <rect x="5" y="6" width="14" height="4" rx="1"/>
          <path d="M12 17c-2 2-5 3-5 1s3-4 5-2c2-2 5-1 5 2s-3 1-5-1z"/>
        </svg>
      ),
    },
    {
      title: t.dashboard.monthlyExpense,
      value: monthlyExpense !== null ? formatKRW(monthlyExpense) : '--',
      subtitle: `${CURRENT_YEAR}${t.common.year} ${CURRENT_MONTH}${t.common.month}`,
      accentColor: '#b5923a',
      icon: (
        /* 저울 아이콘 */
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="3" x2="12" y2="21"/>
          <line x1="4" y1="7" x2="20" y2="7"/>
          <path d="M4 7l-1 8h6L8 7"/>
          <path d="M20 7l1 8h-6l1-8"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
        </svg>
      ),
    },
    {
      title: t.dashboard.currentBalance,
      value: currentBalance !== null ? formatKRW(currentBalance) : '--',
      subtitle: t.dashboard.currentBalanceSubtitle,
      accentColor: '#4a7c59',
      icon: (
        /* 교회 건물 아이콘 */
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L12 6"/>
          <path d="M9 6h6"/>
          <path d="M12 6L5 12v9h14v-9L12 6z"/>
          <rect x="10" y="15" width="4" height="6"/>
        </svg>
      ),
    },
  ];

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="page-content">

      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 6px', fontWeight: 500 }}>
          {getTodayKR()}
        </p>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.03em' }}>
          {t.dashboard.title}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '15px', margin: '6px 0 0' }}>
          {t.dashboard.subtitle}
        </p>
      </div>

      {/* 요약 카드 4개 */}
      <div className="dashboard-stats-grid">
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
      <div className="dashboard-bottom-grid">

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
              {t.dashboard.recentOfferings}
            </h2>
            <Link
              href="/offerings"
              style={{ fontSize: '13px', color: 'var(--primary-400)', textDecoration: 'none', fontWeight: 600 }}
            >
              {t.dashboard.viewAll}
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
              {t.dashboard.noOfferings}
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
                      {item.offering_type ?? item.type ?? t.dashboard.defaultOfferingType}
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
          className="dashboard-quick-actions"
          style={{
            background: 'var(--surface)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            {t.dashboard.quickActions}
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
                background: 'linear-gradient(135deg, #c9a84c, #e8d48b)',
                color: '#1a1208',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(201,168,76,0.35)',
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
              {t.dashboard.enterOffering}
            </Link>
            <Link
              href="/members/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'rgba(74,124,89,0.12)',
                color: '#6b9e78',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                border: '1px solid rgba(74,124,89,0.25)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(74,124,89,0.2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(74,124,89,0.12)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              {t.dashboard.registerMember}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
