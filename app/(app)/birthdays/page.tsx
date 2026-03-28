'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

// ─── 타입 ──────────────────────────────────────────────────
interface BirthdayMember {
  id:          number;
  name:        string;
  birth_date:  string; // YYYY-MM-DD
  days_until:  number; // 0 = 오늘
  age?:        number;
  phone?:      string;
}

interface BirthdaySettings {
  alert_days_before: number;
  is_active:         boolean;
  notify_via:        'sms' | 'email' | 'both' | 'app';
}

function extractList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && 'items' in res && Array.isArray((res as any).items))
    return (res as any).items as T[];
  return [];
}

// ─── 유틸 ──────────────────────────────────────────────────
const KO_MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const KO_DAYS   = ['일','월','화','수','목','금','토'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ─── 메인 페이지 ────────────────────────────────────────────
export default function BirthdaysPage() {
  const router = useRouter();
  const now      = new Date();
  const [tab,         setTab]         = useState<'this' | 'next'>('this');
  const [upcoming,    setUpcoming]    = useState<BirthdayMember[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [settings,    setSettings]    = useState<BirthdaySettings>({ alert_days_before: 7, is_active: true, notify_via: 'app' });
  const [settSaving,  setSettSaving]  = useState(false);
  const [settAlert,   setSettAlert]   = useState<'ok' | 'err' | null>(null);

  // 캘린더 탐색
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [upRes, setRes] = await Promise.allSettled([
        apiClient<unknown>('/api/v1/birthdays/upcoming?days=60'),
        apiClient<BirthdaySettings>('/api/v1/birthdays/settings'),
      ]);
      if (upRes.status === 'fulfilled') setUpcoming(extractList<BirthdayMember>(upRes.value));
      if (setRes.status === 'fulfilled' && setRes.value) setSettings(setRes.value);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // 탭 필터
  const thisMonthNum = now.getMonth() + 1;
  const nextMonthNum = thisMonthNum === 12 ? 1 : thisMonthNum + 1;
  const displayed = upcoming.filter(m => {
    const mm = parseInt(m.birth_date.slice(5, 7), 10);
    return tab === 'this' ? mm === thisMonthNum : mm === nextMonthNum;
  }).sort((a, b) => a.days_until - b.days_until);

  // 캘린더 데이터
  const daysInCal   = getDaysInMonth(calYear, calMonth);
  const firstDay    = getFirstDayOfMonth(calYear, calMonth);
  const calBirthdays = upcoming.reduce((acc, m) => {
    const mm = parseInt(m.birth_date.slice(5, 7), 10) - 1;
    const dd = parseInt(m.birth_date.slice(8, 10), 10);
    if (mm === calMonth) {
      if (!acc[dd]) acc[dd] = [];
      acc[dd].push(m.name);
    }
    return acc;
  }, {} as Record<number, string[]>);

  // 설정 저장
  const saveSettings = async () => {
    setSettSaving(true); setSettAlert(null);
    try {
      await apiClient('/api/v1/birthdays/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSettAlert('ok');
    } catch { setSettAlert('err'); }
    finally {
      setSettSaving(false);
      setTimeout(() => setSettAlert(null), 2500);
    }
  };

  const ALERT_DAYS_OPTIONS = [1, 3, 7, 14];

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes pop { 0%{transform:scale(0.95)} 60%{transform:scale(1.04)} 100%{transform:scale(1)} }
        .bday-card:hover { box-shadow:0 6px 20px rgba(201,168,76,0.13) !important; border-color:#f0d88a !important; transform:translateY(-2px); }
        .cal-day:hover { background:#fdf8e8 !important; }
      `}</style>

      <div style={{ padding: '36px 40px', maxWidth: '900px' }}>

        {/* ── 헤더 ── */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#111827', letterSpacing: '-0.04em' }}>생일 알림</h1>
          <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#9ca3af' }}>교인 생일을 확인하고 알림을 설정합니다</p>
        </div>

        {/* ════════ 1. 다가오는 생일 ════════ */}
        <section style={{ background: '#fff', borderRadius: '18px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ width: '4px', height: '18px', background: 'linear-gradient(#f59e0b,#fcd34d)', borderRadius: '99px' }} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>다가오는 생일</span>
          </div>

          {/* 탭 */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: '#f1f5f9', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
            {[
              { key: 'this', label: `${KO_MONTHS[thisMonthNum - 1]} (이번 달)` },
              { key: 'next', label: `${KO_MONTHS[nextMonthNum - 1]} (다음 달)` },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as 'this' | 'next')}
                style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', fontFamily: 'inherit', fontSize: '13px', fontWeight: tab === t.key ? 700 : 500, cursor: 'pointer', background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#f59e0b' : '#6b7280', boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '13px' }}>불러오는 중...</div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', background: '#f9fafb', borderRadius: '12px', border: '1.5px dashed #e5e7eb' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎂</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>생일자가 없습니다</div>
              <div style={{ fontSize: '13px', color: '#9ca3af' }}>교인 생년월일이 등록된 경우 표시됩니다</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px', animation: 'fadeIn 0.2s' }}>
              {displayed.map(m => {
                const isToday   = m.days_until === 0;
                const isSoon    = m.days_until <= 3 && !isToday;
                const mm = m.birth_date.slice(5, 7);
                const dd = m.birth_date.slice(8, 10);
                return (
                  <div key={m.id} className="bday-card"
                    onClick={() => router.push(`/members/${m.id}`)}
                    style={{
                      background: isToday ? 'linear-gradient(135deg,#fffbeb,#fef9c3)' : '#fff',
                      borderRadius: '14px', padding: '16px', cursor: 'pointer', transition: 'all 0.18s',
                      border: isToday ? '2px solid #fcd34d' : isSoon ? '1.5px solid #fed7aa' : '1.5px solid #f1f5f9',
                      boxShadow: isToday ? '0 4px 16px rgba(245,158,11,0.2)' : '0 1px 4px rgba(0,0,0,0.04)',
                      animation: isToday ? 'pop 0.4s ease' : 'none',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isToday ? 'linear-gradient(135deg,#fef9c3,#fcd34d)' : 'linear-gradient(135deg,#fdf8e8,#f0d88a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isToday ? '18px' : '14px', fontWeight: 800, color: isToday ? '#92400e' : '#c9a84c' }}>
                          {isToday ? '🎂' : m.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{m.name}</div>
                          {m.age && <div style={{ fontSize: '11px', color: '#9ca3af' }}>만 {m.age}세</div>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>🗓 {mm}월 {dd}일</span>
                      <span style={{
                        padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                        background: isToday ? '#fef9c3' : isSoon ? '#fff7ed' : '#f3f4f6',
                        color: isToday ? '#92400e' : isSoon ? '#c2410c' : '#6b7280',
                        border: isToday ? '1px solid #fcd34d' : isSoon ? '1px solid #fed7aa' : '1px solid #e5e7eb',
                      }}>
                        {isToday ? '🎉 오늘!' : `D-${m.days_until}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ════════ 2. 캘린더 ════════ */}
        <section style={{ background: '#fff', borderRadius: '18px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '18px', background: 'linear-gradient(#c9a84c,#c9a84c)', borderRadius: '99px' }} />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>생일 캘린더</span>
            </div>
            {/* 월 이동 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); }}
                style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827', minWidth: '80px', textAlign: 'center' }}>
                {calYear}년 {KO_MONTHS[calMonth]}
              </span>
              <button onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); }}
                style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '4px' }}>
            {KO_DAYS.map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: i === 0 ? '#ef4444' : i === 6 ? '#2563eb' : '#9ca3af', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
            {/* 빈 칸 */}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {/* 날짜 */}
            {Array.from({ length: daysInCal }).map((_, i) => {
              const day     = i + 1;
              const isToday = calYear === now.getFullYear() && calMonth === now.getMonth() && day === now.getDate();
              const bdays   = calBirthdays[day] ?? [];
              const hasBday = bdays.length > 0;
              return (
                <div key={day} className={hasBday ? 'cal-day' : ''}
                  style={{ minHeight: '52px', borderRadius: '8px', padding: '4px 5px', background: isToday ? '#fdf8e8' : hasBday ? '#fffbeb' : 'transparent', border: isToday ? '1.5px solid #f0d88a' : hasBday ? '1px solid #fcd34d' : '1px solid transparent', transition: 'background 0.12s', cursor: hasBday ? 'default' : 'default' }}>
                  <div style={{ fontSize: '12px', fontWeight: isToday ? 800 : 500, color: isToday ? '#c9a84c' : (i % 7 === 0 || (firstDay + i) % 7 === 0) ? '#ef4444' : ((firstDay + i) % 7 === 6) ? '#2563eb' : '#374151', marginBottom: '2px' }}>{day}</div>
                  {bdays.slice(0, 2).map((name, ni) => (
                    <div key={ni} style={{ fontSize: '10px', fontWeight: 600, color: '#92400e', background: '#fef9c3', borderRadius: '3px', padding: '1px 3px', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      🎂 {name}
                    </div>
                  ))}
                  {bdays.length > 2 && <div style={{ fontSize: '9px', color: '#9ca3af' }}>+{bdays.length - 2}명</div>}
                </div>
              );
            })}
          </div>
        </section>

        {/* ════════ 3. 알림 설정 ════════ */}
        <section style={{ background: '#fff', borderRadius: '18px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '18px', background: 'linear-gradient(#16a34a,#86efac)', borderRadius: '99px' }} />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>알림 설정</span>
            </div>
            {settAlert && (
              <div style={{ padding: '6px 14px', borderRadius: '8px', background: settAlert === 'ok' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${settAlert === 'ok' ? '#86efac' : '#fca5a5'}`, color: settAlert === 'ok' ? '#16a34a' : '#dc2626', fontSize: '12px', fontWeight: 700 }}>
                {settAlert === 'ok' ? '✓ 저장되었습니다' : '✕ 저장 실패'}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* 알림 활성/비활성 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '12px', background: '#f9fafb', border: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>생일 알림 활성화</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>생일이 다가오면 앱에서 알림을 표시합니다</div>
              </div>
              <div onClick={() => setSettings(p => ({ ...p, is_active: !p.is_active }))}
                style={{ width: '44px', height: '24px', borderRadius: '12px', background: settings.is_active ? '#c9a84c' : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '3px', left: settings.is_active ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.25s' }} />
              </div>
            </div>

            {/* 며칠 전 알림 */}
            <div style={{ padding: '14px 18px', borderRadius: '12px', background: '#f9fafb', border: '1px solid #f1f5f9', opacity: settings.is_active ? 1 : 0.4, pointerEvents: settings.is_active ? 'auto' : 'none' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
                며칠 전에 알릴까요?
                <span style={{ fontSize: '13px', fontWeight: 400, color: '#9ca3af', marginLeft: '8px' }}>현재: {settings.alert_days_before}일 전</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ALERT_DAYS_OPTIONS.map(d => {
                  const sel = settings.alert_days_before === d;
                  return (
                    <button key={d} onClick={() => setSettings(p => ({ ...p, alert_days_before: d }))}
                      style={{ padding: '9px 20px', borderRadius: '20px', border: `1.5px solid ${sel ? '#c9a84c' : '#e5e7eb'}`, background: sel ? '#c9a84c' : '#fff', color: sel ? '#fff' : '#6b7280', fontSize: '13px', fontWeight: sel ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: sel ? '0 2px 8px rgba(201,168,76,0.25)' : 'none' }}>
                      {d}일 전
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 알림 방법 — 앱 알림만 */}
            <div style={{ padding: '14px 18px', borderRadius: '12px', background: '#f9fafb', border: '1px solid #f1f5f9', opacity: settings.is_active ? 1 : 0.4 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>알림 방법</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '9px', background: '#fdf8e8', border: '1.5px solid #f0d88a' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#c9a84c' }}>앱 알림</div>
                  <div style={{ fontSize: '11px', color: '#d4b85c', marginTop: '1px' }}>문자/이메일 알림은 추후 지원 예정입니다</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 'auto' }}><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={saveSettings} disabled={settSaving}
                style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: settSaving ? '#f0d88a' : 'linear-gradient(135deg,#c9a84c,#c9a84c)', color: settSaving ? '#d4b85c' : '#fff', fontSize: '14px', fontWeight: 700, cursor: settSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: settSaving ? 'none' : '0 4px 12px rgba(201,168,76,0.3)', transition: 'all 0.2s' }}>
                {settSaving ? '저장 중...' : '설정 저장'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
