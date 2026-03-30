'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';

// ─── 메뉴 구조 정의 ─────────────────────────────────────
interface SubItem {
  href:  string;
  labelKey: string;
}

interface NavItem {
  labelKey: string;
  href?:    string;       // 단일 링크
  children?: SubItem[];  // 펼침 메뉴
  icon:     React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href:  '/dashboard',
    labelKey: 'dashboard',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href:  '/members',
    labelKey: 'members',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    labelKey: 'offerings',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    children: [
      { href: '/offerings',       labelKey: 'offeringStatus' },
      { href: '/offerings/new',   labelKey: 'offeringInput' },
      { href: '/offerings/stats', labelKey: 'offeringStats' },
      { href: '/payments',        labelKey: 'onlineOffering' },
    ],
  },
  {
    labelKey: 'finance',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    children: [
      { href: '/finance',              labelKey: 'financeOverview' },
      { href: '/finance/transactions', labelKey: 'transactions' },
      { href: '/finance/budgets',      labelKey: 'budgets' },
      { href: '/finance/reports',      labelKey: 'financeReports' },
    ],
  },
  {
    labelKey: 'community',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    children: [
      { href: '/groups',           labelKey: 'groups' },
      { href: '/attendance',       labelKey: 'attendance' },
      { href: '/attendance/stats', labelKey: 'attendanceStats' },
      { href: '/newcomers',        labelKey: 'newcomers' },
      { href: '/pledges',          labelKey: 'pledges' },
    ],
  },
  {
    labelKey: 'pastoral',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
      </svg>
    ),
    children: [
      { href: '/pastoral',    labelKey: 'pastoralStatus' },
      { href: '/birthdays',   labelKey: 'birthdays' },
      { href: '/messages',    labelKey: 'messages' },
      { href: '/facilities',          labelKey: 'facilityStatus' },
      { href: '/facilities/bookings', labelKey: 'facilityBookings' },
    ],
  },
  {
    href:  '/settings',
    labelKey: 'settings',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

// helper: resolve nav label from key
function getNavLabel(key: string, nav: Record<string, string>): string {
  return (nav as Record<string, string>)[key] ?? key;
}

// ─── 서브 아이템 아이콘 ──────────────────────────────────
const SUB_ICONS: Record<string, React.ReactNode> = {
  '/offerings':             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  '/offerings/new':         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  '/offerings/stats':       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  '/finance':               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  '/finance/transactions':  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  '/finance/budgets':       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  '/finance/reports':       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  '/groups':                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  '/attendance':            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  '/attendance/stats':      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  '/newcomers':             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  '/pledges':               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  '/pastoral':              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
  '/birthdays':             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  '/messages':              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  '/facilities':            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  '/payments':              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
};

// ─── 메인 레이아웃 ──────────────────────────────────────
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { t, lang, changeLang } = useTranslation();

  // 현재 경로에 해당하는 그룹 자동 펼침
  const getInitialOpen = () => {
    const opens: Record<string, boolean> = {};
    NAV_ITEMS.forEach(item => {
      if (item.children) {
        const isGroupActive = item.children.some(c => pathname.startsWith(c.href));
        if (isGroupActive) opens[item.labelKey] = true;
      }
    });
    return opens;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialOpen);
  const [verseIdx, setVerseIdx] = useState(() => Math.floor(Math.random() * t.bible.verses.length));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 경로 바뀌면 성경 구절 랜덤 교체
  useEffect(() => {
    setVerseIdx(Math.floor(Math.random() * t.bible.verses.length));
  }, [pathname, t.bible.verses.length]);

  const verse = t.bible.verses[verseIdx];

  // 경로 바뀌면 모바일 사이드바 닫기
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // 경로 바뀌면 해당 그룹 자동 펼침
  useEffect(() => {
    setOpenGroups(prev => {
      const next = { ...prev };
      NAV_ITEMS.forEach(item => {
        if (item.children) {
          if (item.children.some(c => pathname.startsWith(c.href))) {
            next[item.labelKey] = true;
          }
        }
      });
      return next;
    });
  }, [pathname]);

  // 토큰 없으면 로그인 페이지로
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) router.replace('/login');
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.replace('/login');
  };

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
        .nav-link { display:flex;align-items:center;gap:11px;padding:9px 13px;border-radius:10px;text-decoration:none;font-size:14px;color:#f0e8c0 !important;transition:all 0.15s;cursor:pointer;border:none;background:transparent;width:100%;font-family:inherit;text-align:left; }
        .nav-link:hover { background:var(--sidebar-hover);color:#ffffff !important; }
        .nav-link.active { background:var(--grad-primary);color:#1a1208 !important;font-weight:700;box-shadow:0 4px 16px rgba(201,168,76,0.4); }
        .nav-link.group-active { color:#ffffff !important;font-weight:600; }
        .sub-link { display:flex;align-items:center;gap:9px;padding:7px 12px;border-radius:8px;text-decoration:none;font-size:13px;color:#f0e8c0 !important;transition:all 0.15s; }
        .sub-link:hover { background:rgba(201,168,76,0.1);color:#fff !important; }
        .sub-link.active { background:rgba(201,168,76,0.18);color:#fff !important;font-weight:600;box-shadow:inset 0 0 0 1px rgba(201,168,76,0.35); }
        .chevron { transition:transform 0.2s ease;flex-shrink:0; }
        .chevron.open { transform:rotate(90deg); }
        .sub-list { animation:slideDown 0.18s ease; }
      `}</style>

      {/* ═══ 모바일 상단 헤더 ═══ */}
      <header className="mobile-header">
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          aria-label="메뉴 열기"
          style={{
            width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center',
            borderRadius:'10px', border:'none', background:'rgba(201,168,76,0.15)',
            color:'#f0e8c0', cursor:'pointer', fontSize:'18px', flexShrink:0,
          }}
        >
          {sidebarOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/>
            </svg>
          )}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'28px',height:'28px',borderRadius:'8px',background:'var(--grad-primary)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="10" y="2" width="4" height="20" rx="1" fill="#1a1208"/>
              <rect x="4" y="7" width="16" height="4" rx="1" fill="#1a1208"/>
            </svg>
          </div>
          <span style={{ color:'#ffffff', fontWeight:800, fontSize:'15px', letterSpacing:'-0.02em' }}>J-SheepFold</span>
        </div>
        <div style={{ width:'40px', flexShrink:0 }} />
      </header>

      <div style={{
        display:'flex', minHeight:'100vh', position:'relative',
        backgroundImage: "url('/images/shepherd-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}>

        {/* 오버레이 (모바일 사이드바 열릴 때) */}
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ═══ 사이드바 ═══ */}
        <aside
          className={`app-sidebar${sidebarOpen ? ' open' : ''}`}
          style={{
            width:'240px', minHeight:'100vh',
            background:'var(--surface-3)',
            borderRight:'1px solid rgba(201,168,76,0.12)',
            display:'flex', flexDirection:'column',
            position:'fixed', top:0, left:0, bottom:0, zIndex:50,
            boxShadow:'4px 0 24px rgba(0,0,0,0.3)',
          }}
        >
          {/* 로고 */}
          <div style={{ padding:'26px 22px 18px', borderBottom:'1px solid rgba(201,168,76,0.12)', position:'relative', overflow:'hidden' }}>
            {/* 배경 글로우 */}
            <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'80px', height:'80px', borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.2) 0%, transparent 70%)', pointerEvents:'none' }} />
            <div style={{ display:'flex', alignItems:'center', gap:'10px', position:'relative' }}>
              <div style={{ width:'36px',height:'36px',borderRadius:'11px',background:'var(--grad-primary)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 4px 16px rgba(201,168,76,0.4)' }}>
                {/* 십자가 아이콘 */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="10" y="2" width="4" height="20" rx="1" fill="#1a1208"/>
                  <rect x="4" y="7" width="16" height="4" rx="1" fill="#1a1208"/>
                </svg>
              </div>
              <div>
                <p style={{ color:'#ffffff',fontWeight:800,fontSize:'17px',margin:0,letterSpacing:'-0.02em' }}>J-SheepFold</p>
                <p style={{ background:'var(--grad-primary)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontSize:'10px',margin:0,letterSpacing:'0.08em',fontWeight:700 }}>{t.nav.systemName}</p>
              </div>
            </div>
          </div>

          {/* 메뉴 */}
          <nav style={{ flex:1, padding:'14px 10px', display:'flex', flexDirection:'column', gap:'2px', overflowY:'auto' }}>
            {NAV_ITEMS.map(item => {
              const navLabel = getNavLabel(item.labelKey, t.nav as unknown as Record<string, string>);
              // ── 단일 링크 ──
              if (!item.children) {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href!));
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={`nav-link${isActive ? ' active' : ''}`}
                    style={{ color: '#f0e8c0' }}
                  >
                    <span style={{ color: 'inherit', display:'flex', flexShrink:0 }}>{item.icon}</span>
                    <span style={{ flex:1, color: 'inherit' }}>{navLabel}</span>
                  </Link>
                );
              }

              // ── 펼침 메뉴 ──
              const isGroupActive = item.children.some(c => pathname.startsWith(c.href));
              const isOpen        = !!openGroups[item.labelKey];

              return (
                <div key={item.labelKey}>
                  {/* 그룹 헤더 버튼 */}
                  <button
                    className={`nav-link${isGroupActive ? ' group-active' : ''}`}
                    onClick={() => toggleGroup(item.labelKey)}
                    style={{ color: '#f0e8c0' }}
                  >
                    <span style={{ color: 'inherit', display:'flex', flexShrink:0 }}>{item.icon}</span>
                    <span style={{ flex:1, color: 'inherit' }}>{navLabel}</span>
                    {/* 배지 점 */}
                    {isGroupActive && !isOpen && (
                      <span style={{ width:'6px',height:'6px',borderRadius:'50%',background:'#c9a84c',flexShrink:0,boxShadow:'0 0 6px #c9a84c' }} />
                    )}
                    {/* 화살표 */}
                    <span className={`chevron${isOpen ? ' open' : ''}`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </button>

                  {/* 서브 메뉴 */}
                  {isOpen && (
                    <div className="sub-list" style={{ paddingLeft:'14px', marginTop:'2px', display:'flex', flexDirection:'column', gap:'1px' }}>
                      {/* 세로 선 + 서브 아이템 */}
                      <div style={{ borderLeft:'1.5px solid rgba(201,168,76,0.25)', paddingLeft:'10px', display:'flex', flexDirection:'column', gap:'1px' }}>
                        {item.children.map(sub => {
                          const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                          const subLabel = getNavLabel(sub.labelKey, t.nav as unknown as Record<string, string>);
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`sub-link${isSubActive ? ' active' : ''}`}
                              style={{ color: '#f0e8c0' }}
                            >
                              <span style={{ color: isSubActive ? '#ffffff' : '#f0e8c0', flexShrink:0 }}>
                                {SUB_ICONS[sub.href]}
                              </span>
                              <span style={{ color: 'inherit' }}>{subLabel}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* 하단: 언어 전환 + 성경구절 + 로그아웃 */}
          <div style={{ padding:'14px 16px', borderTop:'1px solid rgba(201,168,76,0.12)' }}>
            {/* 언어 전환 버튼 */}
            <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
              <button
                onClick={() => changeLang('ko')}
                style={{
                  flex:1, padding:'7px 0', borderRadius:'8px', border:'none', cursor:'pointer',
                  fontSize:'13px', fontWeight: lang === 'ko' ? 700 : 500, fontFamily:'inherit',
                  background: lang === 'ko' ? 'rgba(201,168,76,0.2)' : 'transparent',
                  color: lang === 'ko' ? '#f0d88a' : '#8a7e60',
                  transition:'all 0.15s',
                }}
              >
                🇰🇷 한국어
              </button>
              <button
                onClick={() => changeLang('en')}
                style={{
                  flex:1, padding:'7px 0', borderRadius:'8px', border:'none', cursor:'pointer',
                  fontSize:'13px', fontWeight: lang === 'en' ? 700 : 500, fontFamily:'inherit',
                  background: lang === 'en' ? 'rgba(201,168,76,0.2)' : 'transparent',
                  color: lang === 'en' ? '#f0d88a' : '#8a7e60',
                  transition:'all 0.15s',
                }}
              >
                🇺🇸 English
              </button>
            </div>

            {/* 성경 구절 */}
            <div style={{ padding:'12px 14px', marginBottom:'10px', borderRadius:'10px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.1)' }}>
              <p style={{ fontSize:'14px', color:'#c9a84c', margin:0, lineHeight:'1.6', fontStyle:'italic' }}>
                &ldquo;{verse.text}&rdquo;
              </p>
              <p style={{ fontSize:'12px', color:'#8a7e60', margin:'6px 0 0', textAlign:'right' }}>
                {verse.ref}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="nav-link"
              style={{ color:'#c8a86a' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(239,68,68,0.18)'; (e.currentTarget as HTMLButtonElement).style.color='#fca5a5'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='transparent'; (e.currentTarget as HTMLButtonElement).style.color='#c8a86a'; }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>{t.nav.logout}</span>
            </button>
          </div>
        </aside>

        {/* ═══ 콘텐츠 영역 ═══ */}
        <main className="app-main" style={{ flex:1, marginLeft:'240px', minHeight:'100vh', position:'relative', zIndex:1 }}>
          {children}
        </main>
      </div>
    </>
  );
}
