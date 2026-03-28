'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  loading?: boolean;
  subtitle?: string;
  accentColor?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  loading = false,
  subtitle,
  accentColor = '#8b5cf6',
}: StatCardProps) {
  if (loading) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ height: '16px', width: '80px' }} />
          <div className="skeleton" style={{ height: '40px', width: '40px', borderRadius: '10px' }} />
        </div>
        <div className="skeleton" style={{ height: '30px', width: '120px' }} />
        <div className="skeleton" style={{ height: '14px', width: '60px' }} />
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}40`;
        (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}40`;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* 상단: 제목 + 아이콘 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--muted)',
            margin: 0,
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </p>
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}35`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accentColor,
            flexShrink: 0,
            boxShadow: `0 0 16px ${accentColor}30`,
          }}
        >
          {icon}
        </div>
      </div>

      {/* 중간: 숫자 값 */}
      <p
        style={{
          fontSize: '2.25rem',
          fontWeight: 800,
          color: 'var(--foreground)',
          margin: 0,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>

      {/* 하단: 서브타이틀 */}
      {subtitle && (
        <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
