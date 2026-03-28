'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ─── 메뉴 구조 정의 ─────────────────────────────────────
interface SubItem {
  href:  string;
  label: string;
}

interface NavItem {
  label:    string;
  href?:    string;       // 단일 링크
  children?: SubItem[];  // 펼침 메뉴
  icon:     React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href:  '/dashboard',
    label: '현황판',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href:  '/members',
    label: '교인 관리',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: '헌금 관리',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    children: [
      { href: '/offerings',       label: '헌금 현황' },
      { href: '/offerings/new',   label: '헌금 입력' },
      { href: '/offerings/stats', label: '헌금 통계' },
      { href: '/payments',        label: '온라인 헌금' },
    ],
  },
  {
    label: '재정 관리',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    children: [
      { href: '/finance',              label: '재정 개요'   },
      { href: '/finance/transactions', label: '거래 내역'   },
      { href: '/finance/budgets',      label: '예산 편성'   },
      { href: '/finance/reports',      label: '재정 보고서' },
    ],
  },
  {
    label: '공동체 관리',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    children: [
      { href: '/groups',           label: '소그룹 관리'         },
      { href: '/attendance',       label: '출석 입력'          },
      { href: '/attendance/stats', label: '출석 통계'          },
      { href: '/newcomers',        label: '새가족 관리'        },
      { href: '/pledges',          label: '작정헌금 관리'      },
    ],
  },
  {
    label: '목양 관리',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
      </svg>
    ),
    children: [
      { href: '/pastoral',    label: '목양 현황'           },
      { href: '/birthdays',   label: '생일 알림'             },
      { href: '/messages',    label: '메시지 발송'           },
      { href: '/facilities',          label: '예약 현황'   },
      { href: '/facilities/bookings', label: '예약 관리'   },
    ],
  },
  {
    href:  '/settings',
    label: '설정',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

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

  // 현재 경로에 해당하는 그룹 자동 펼침
  const getInitialOpen = () => {
    const opens: Record<string, boolean> = {};
    NAV_ITEMS.forEach(item => {
      if (item.children) {
        const isGroupActive = item.children.some(c => pathname.startsWith(c.href));
        if (isGroupActive) opens[item.label] = true;
      }
    });
    return opens;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialOpen);

  // 경로 바뀌면 해당 그룹 자동 펼침
  useEffect(() => {
    setOpenGroups(prev => {
      const next = { ...prev };
      NAV_ITEMS.forEach(item => {
        if (item.children) {
          if (item.children.some(c => pathname.startsWith(c.href))) {
            next[item.label] = true;
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

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
        .nav-link { display:flex;align-items:center;gap:11px;padding:9px 13px;border-radius:10px;text-decoration:none;font-size:14px;color:#e2e8f0 !important;transition:all 0.15s;cursor:pointer;border:none;background:transparent;width:100%;font-family:inherit;text-align:left; }
        .nav-link:hover { background:var(--sidebar-hover);color:#ffffff !important; }
        .nav-link.active { background:var(--grad-primary);color:#ffffff !important;font-weight:700;box-shadow:0 4px 16px rgba(139,92,246,0.45); }
        .nav-link.group-active { color:#ffffff !important;font-weight:600; }
        .sub-link { display:flex;align-items:center;gap:9px;padding:7px 12px;border-radius:8px;text-decoration:none;font-size:13px;color:#e2e8f0 !important;transition:all 0.15s; }
        .sub-link:hover { background:rgba(255,255,255,0.05);color:#c4b5fd !important; }
        .sub-link.active { background:rgba(139,92,246,0.2);color:#c4b5fd !important;font-weight:600;box-shadow:inset 0 0 0 1px rgba(139,92,246,0.3); }
        .chevron { transition:transform 0.2s ease;flex-shrink:0; }
        .chevron.open { transform:rotate(90deg); }
        .sub-list { animation:slideDown 0.18s ease; }
      `}</style>

      <div style={{ display:'flex', minHeight:'100vh', background:'var(--background)' }}>

        {/* ═══ 사이드바 ═══ */}
        <aside style={{
          width:'240px', minHeight:'100vh',
          background:'var(--surface-3)',
          borderRight:'1px solid rgba(139,92,246,0.15)',
          display:'flex', flexDirection:'column',
          position:'fixed', top:0, left:0, bottom:0, zIndex:50,
          boxShadow:'4px 0 24px rgba(0,0,0,0.3)',
        }}>
          {/* 로고 */}
          <div style={{ padding:'26px 22px 18px', borderBottom:'1px solid rgba(139,92,246,0.15)', position:'relative', overflow:'hidden' }}>
            {/* 배경 글로우 */}
            <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'80px', height:'80px', borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)', pointerEvents:'none' }} />
            <div style={{ display:'flex', alignItems:'center', gap:'10px', position:'relative' }}>
              <div style={{ width:'36px',height:'36px',borderRadius:'11px',background:'var(--grad-primary)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 4px 16px rgba(139,92,246,0.5)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <p style={{ color:'#fff',fontWeight:800,fontSize:'17px',margin:0,letterSpacing:'-0.02em' }}>J-SheepFold</p>
                <p style={{ background:'var(--grad-primary)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontSize:'10px',margin:0,letterSpacing:'0.08em',fontWeight:700 }}>J-SHEEPFOLD</p>
              </div>
            </div>
          </div>

          {/* 메뉴 */}
          <nav style={{ flex:1, padding:'14px 10px', display:'flex', flexDirection:'column', gap:'2px', overflowY:'auto' }}>
            {NAV_ITEMS.map(item => {
              // ── 단일 링크 ──
              if (!item.children) {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href!));
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={`nav-link${isActive ? ' active' : ''}`}
                    style={{ color: '#e2e8f0' }}
                  >
                    <span style={{ color: 'inherit', display:'flex', flexShrink:0 }}>{item.icon}</span>
                    <span style={{ flex:1, color: 'inherit' }}>{item.label}</span>
                  </Link>
                );
              }

              // ── 펼침 메뉴 ──
              const isGroupActive = item.children.some(c => pathname.startsWith(c.href));
              const isOpen        = !!openGroups[item.label];

              return (
                <div key={item.label}>
                  {/* 그룹 헤더 버튼 */}
                  <button
                    className={`nav-link${isGroupActive ? ' group-active' : ''}`}
                    onClick={() => toggleGroup(item.label)}
                    style={{ color: '#e2e8f0' }}
                  >
                    <span style={{ color: 'inherit', display:'flex', flexShrink:0 }}>{item.icon}</span>
                    <span style={{ flex:1, color: 'inherit' }}>{item.label}</span>
                    {/* 배지 점 */}
                    {isGroupActive && !isOpen && (
                      <span style={{ width:'6px',height:'6px',borderRadius:'50%',background:'var(--primary-400)',flexShrink:0,boxShadow:'0 0 6px var(--primary-400)' }} />
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
                      <div style={{ borderLeft:'1.5px solid rgba(99,102,241,0.3)', paddingLeft:'10px', display:'flex', flexDirection:'column', gap:'1px' }}>
                        {item.children.map(sub => {
                          const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`sub-link${isSubActive ? ' active' : ''}`}
                              style={{ color: '#e2e8f0' }}
                            >
                              <span style={{ color: isSubActive ? '#a5b4fc' : '#e2e8f0', flexShrink:0 }}>
                                {SUB_ICONS[sub.href]}
                              </span>
                              <span style={{ color: 'inherit' }}>{sub.label}</span>
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

          {/* 하단 로그아웃 */}
          <div style={{ padding:'14px 10px', borderTop:'1px solid rgba(139,92,246,0.15)' }}>
            <button
              onClick={handleLogout}
              className="nav-link"
              style={{ color:'var(--muted)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(239,68,68,0.12)'; (e.currentTarget as HTMLButtonElement).style.color='#fca5a5'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='transparent'; (e.currentTarget as HTMLButtonElement).style.color='var(--muted)'; }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>로그아웃</span>
            </button>
          </div>
        </aside>

        {/* ═══ 콘텐츠 영역 ═══ */}
        <main style={{ flex:1, marginLeft:'240px', minHeight:'100vh' }}>
          {children}
        </main>
      </div>
    </>
  );
}
