// Translations 타입: string 기반으로 선언해 다국어 지원
export interface Translations {
  dashboard: {
    title: string;
    subtitle: string;
    totalMembers: string;
    totalMembersSubtitle: string;
    monthlyOffering: string;
    monthlyExpense: string;
    currentBalance: string;
    currentBalanceSubtitle: string;
    recentOfferings: string;
    viewAll: string;
    noOfferings: string;
    defaultOfferingType: string;
    quickActions: string;
    enterOffering: string;
    registerMember: string;
  };
}

const ko: Translations = {
  dashboard: {
    title: '현황판',
    subtitle: '교회 주요 현황을 한눈에 확인하세요.',
    totalMembers: '전체 교인 수',
    totalMembersSubtitle: '등록 교인 기준',
    monthlyOffering: '이번 달 헌금',
    monthlyExpense: '이번 달 지출',
    currentBalance: '현재 잔액',
    currentBalanceSubtitle: '재정 누계 기준',
    recentOfferings: '최근 헌금 내역',
    viewAll: '전체 보기 →',
    noOfferings: '헌금 내역이 없습니다',
    defaultOfferingType: '일반 헌금',
    quickActions: '빠른 실행',
    enterOffering: '헌금 입력',
    registerMember: '교인 등록',
  },
};

export default ko;
