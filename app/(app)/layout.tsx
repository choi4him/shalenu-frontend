'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

// ─── 성경 구절 목록 ─────────────────────────────────────
const BIBLE_VERSES = [
  { text: '여호와는 나의 목자시니 내게 부족함이 없으리로다', ref: '시편 23:1' },
  { text: '내가 세상 끝날까지 너희와 항상 함께 있으리라', ref: '마태복음 28:20' },
  { text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니', ref: '요한복음 3:16' },
  { text: '너희 안에서 착한 일을 시작하신 이가 이루실 줄을 확신하노라', ref: '빌립보서 1:6' },
  { text: '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라', ref: '빌립보서 4:13' },
  { text: '여호와를 앙망하는 자는 새 힘을 얻으리니', ref: '이사야 40:31' },
  { text: '항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라', ref: '데살로니가전서 5:16-18' },
  { text: '너는 마음을 다하여 여호와를 신뢰하고', ref: '잠언 3:5' },
  { text: '오직 성령의 열매는 사랑과 희락과 화평이요', ref: '갈라디아서 5:22' },
  { text: '내 양은 내 음성을 들으며 나는 그들을 알며 그들은 나를 따르느니라', ref: '요한복음 10:27' },
];

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
  const [verseIdx, setVerseIdx] = useState(() => Math.floor(Math.random() * BIBLE_VERSES.length));

  // 경로 바뀌면 성경 구절 랜덤 교체
  useEffect(() => {
    setVerseIdx(Math.floor(Math.random() * BIBLE_VERSES.length));
  }, [pathname]);

  const verse = BIBLE_VERSES[verseIdx];

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
        .nav-link { display:flex;align-items:center;gap:11px;padding:9px 13px;border-radius:10px;text-decoration:none;font-size:14px;color:#d4c9a8 !important;transition:all 0.15s;cursor:pointer;border:none;background:transparent;width:100%;font-family:inherit;text-align:left; }
        .nav-link:hover { background:var(--sidebar-hover);color:#f5edd6 !important; }
        .nav-link.active { background:var(--grad-primary);color:#1a1208 !important;font-weight:700;box-shadow:0 4px 16px rgba(201,168,76,0.4); }
        .nav-link.group-active { color:#f5edd6 !important;font-weight:600; }
        .sub-link { display:flex;align-items:center;gap:9px;padding:7px 12px;border-radius:8px;text-decoration:none;font-size:13px;color:#d4c9a8 !important;transition:all 0.15s; }
        .sub-link:hover { background:rgba(201,168,76,0.08);color:#e8d48b !important; }
        .sub-link.active { background:rgba(201,168,76,0.15);color:#e8d48b !important;font-weight:600;box-shadow:inset 0 0 0 1px rgba(201,168,76,0.3); }
        .chevron { transition:transform 0.2s ease;flex-shrink:0; }
        .chevron.open { transform:rotate(90deg); }
        .sub-list { animation:slideDown 0.18s ease; }
      `}</style>

      <div style={{ display:'flex', minHeight:'100vh', background:'var(--background)', position:'relative' }}>

        {/* ═══ 배경 SVG: 양떼와 목자 실루엣 ═══ */}
        <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', opacity:0.15, overflow:'hidden' }}>
          <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" fill="#f0d080" xmlns="http://www.w3.org/2000/svg">

            {/* ── 왼쪽 상단: 빛줄기 (방사형) ── */}
            <g opacity="0.6">
              <line x1="0" y1="0" x2="400" y2="300" stroke="#f0d080" strokeWidth="1.5" opacity="0.5"/>
              <line x1="0" y1="0" x2="500" y2="200" stroke="#f0d080" strokeWidth="1" opacity="0.4"/>
              <line x1="0" y1="0" x2="350" y2="400" stroke="#f0d080" strokeWidth="1.2" opacity="0.35"/>
              <line x1="0" y1="0" x2="550" y2="350" stroke="#f0d080" strokeWidth="0.8" opacity="0.3"/>
              <line x1="0" y1="0" x2="250" y2="450" stroke="#f0d080" strokeWidth="1" opacity="0.25"/>
              <line x1="0" y1="0" x2="600" y2="150" stroke="#f0d080" strokeWidth="0.8" opacity="0.3"/>
              <line x1="0" y1="0" x2="450" y2="100" stroke="#f0d080" strokeWidth="1" opacity="0.35"/>
              <line x1="0" y1="0" x2="150" y2="350" stroke="#f0d080" strokeWidth="0.8" opacity="0.2"/>
            </g>

            {/* ── 오른쪽 하단: 언덕 곡선 ── */}
            <path d="M1920 1080 L1920 850 Q1750 780 1550 830 Q1350 880 1150 820 Q950 760 750 840 Q600 900 500 880 L500 1080 Z" opacity="0.4"/>
            <path d="M1920 1080 L1920 900 Q1800 860 1650 890 Q1500 920 1350 880 Q1200 840 1050 900 Q900 960 800 940 L800 1080 Z" opacity="0.6"/>
            <path d="M1920 1080 L1920 940 Q1850 920 1750 945 Q1600 970 1450 940 Q1300 910 1150 950 Q1050 980 1000 970 L1000 1080 Z" opacity="0.8"/>

            {/* ── 나무 실루엣 (멀리 2그루) ── */}
            {/* 나무 1 */}
            <g transform="translate(1050, 770)">
              <rect x="-4" y="0" width="8" height="50" rx="2"/>
              <ellipse cx="0" cy="-10" rx="25" ry="35"/>
            </g>
            {/* 나무 2 */}
            <g transform="translate(1150, 790)">
              <rect x="-3" y="0" width="6" height="40" rx="2"/>
              <ellipse cx="0" cy="-8" rx="20" ry="28"/>
            </g>

            {/* ── 목자 실루엣 (지팡이 들고 서있는 모습) ── */}
            <g transform="translate(1300, 760)">
              {/* 머리 */}
              <circle cx="0" cy="0" r="12"/>
              {/* 몸통 */}
              <path d="M-8 12 L-12 70 L12 70 L8 12 Z" rx="3"/>
              {/* 왼쪽 다리 */}
              <path d="M-8 70 L-12 110 L-6 110 L-2 70 Z"/>
              {/* 오른쪽 다리 */}
              <path d="M2 70 L6 110 L12 110 L8 70 Z"/>
              {/* 지팡이 */}
              <rect x="18" y="-30" width="3" height="140" rx="1.5"/>
              <path d="M21 -30 Q21 -45 12 -45" fill="none" stroke="#f0d080" strokeWidth="3" strokeLinecap="round"/>
            </g>

            {/* ── 양 실루엣 7마리 ── */}
            {/* 양 1 */}
            <g transform="translate(1400, 850)">
              <ellipse cx="0" cy="0" rx="22" ry="16"/>
              <circle cx="-18" cy="-10" r="8"/>
              <rect x="-12" y="14" width="4" height="14" rx="1"/>
              <rect x="-4" y="14" width="4" height="14" rx="1"/>
              <rect x="4" y="14" width="4" height="14" rx="1"/>
              <rect x="12" y="14" width="4" height="14" rx="1"/>
            </g>
            {/* 양 2 */}
            <g transform="translate(1500, 870)">
              <ellipse cx="0" cy="0" rx="20" ry="14"/>
              <circle cx="16" cy="-8" r="7"/>
              <rect x="-10" y="12" width="4" height="12" rx="1"/>
              <rect x="-2" y="12" width="4" height="12" rx="1"/>
              <rect x="6" y="12" width="4" height="12" rx="1"/>
              <rect x="14" y="12" width="4" height="12" rx="1"/>
            </g>
            {/* 양 3 (작은 양) */}
            <g transform="translate(1580, 860)">
              <ellipse cx="0" cy="0" rx="16" ry="11"/>
              <circle cx="-12" cy="-7" r="6"/>
              <rect x="-8" y="9" width="3" height="10" rx="1"/>
              <rect x="-2" y="9" width="3" height="10" rx="1"/>
              <rect x="4" y="9" width="3" height="10" rx="1"/>
              <rect x="10" y="9" width="3" height="10" rx="1"/>
            </g>
            {/* 양 4 */}
            <g transform="translate(1680, 890)">
              <ellipse cx="0" cy="0" rx="22" ry="16"/>
              <circle cx="18" cy="-10" r="8"/>
              <rect x="-12" y="14" width="4" height="14" rx="1"/>
              <rect x="-4" y="14" width="4" height="14" rx="1"/>
              <rect x="4" y="14" width="4" height="14" rx="1"/>
              <rect x="12" y="14" width="4" height="14" rx="1"/>
            </g>
            {/* 양 5 */}
            <g transform="translate(1780, 870)">
              <ellipse cx="0" cy="0" rx="18" ry="13"/>
              <circle cx="-14" cy="-8" r="7"/>
              <rect x="-10" y="11" width="3.5" height="12" rx="1"/>
              <rect x="-3" y="11" width="3.5" height="12" rx="1"/>
              <rect x="4" y="11" width="3.5" height="12" rx="1"/>
              <rect x="11" y="11" width="3.5" height="12" rx="1"/>
            </g>
            {/* 양 6 (앉아있는 양) */}
            <g transform="translate(1450, 900)">
              <ellipse cx="0" cy="0" rx="20" ry="12"/>
              <circle cx="16" cy="-7" r="7"/>
              <rect x="-8" y="10" width="4" height="6" rx="1"/>
              <rect x="8" y="10" width="4" height="6" rx="1"/>
            </g>
            {/* 양 7 (멀리 작은 양) */}
            <g transform="translate(1250, 830)">
              <ellipse cx="0" cy="0" rx="14" ry="10"/>
              <circle cx="-10" cy="-6" r="5"/>
              <rect x="-6" y="8" width="3" height="9" rx="1"/>
              <rect x="0" y="8" width="3" height="9" rx="1"/>
              <rect x="6" y="8" width="3" height="9" rx="1"/>
            </g>
          </svg>
        </div>

        {/* ═══ 사이드바 ═══ */}
        <aside style={{
          width:'240px', minHeight:'100vh',
          background:'var(--surface-3)',
          borderRight:'1px solid rgba(201,168,76,0.12)',
          display:'flex', flexDirection:'column',
          position:'fixed', top:0, left:0, bottom:0, zIndex:50,
          boxShadow:'4px 0 24px rgba(0,0,0,0.3)',
        }}>
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
                <p style={{ color:'#f5edd6',fontWeight:800,fontSize:'17px',margin:0,letterSpacing:'-0.02em' }}>J-SheepFold</p>
                <p style={{ background:'var(--grad-primary)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontSize:'10px',margin:0,letterSpacing:'0.08em',fontWeight:700 }}>교회 통합 관리 시스템</p>
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
                    style={{ color: '#d4c9a8' }}
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
                    style={{ color: '#d4c9a8' }}
                  >
                    <span style={{ color: 'inherit', display:'flex', flexShrink:0 }}>{item.icon}</span>
                    <span style={{ flex:1, color: 'inherit' }}>{item.label}</span>
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
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`sub-link${isSubActive ? ' active' : ''}`}
                              style={{ color: '#d4c9a8' }}
                            >
                              <span style={{ color: isSubActive ? '#e8d48b' : '#d4c9a8', flexShrink:0 }}>
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

          {/* 하단: 성경구절 + 로그아웃 */}
          <div style={{ padding:'14px 16px', borderTop:'1px solid rgba(201,168,76,0.12)' }}>
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
        <main style={{ flex:1, marginLeft:'240px', minHeight:'100vh', position:'relative', zIndex:1 }}>
          {children}
        </main>
      </div>
    </>
  );
}
