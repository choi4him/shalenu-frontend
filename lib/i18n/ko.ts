// ─── Translations 타입 정의 ───────────────────────────────
export interface Translations {
  common: {
    loading: string;
    saving: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    confirm: string;
    retry: string;
    close: string;
    all: string;
    search: string;
    reset: string;
    noData: string;
    error: string;
    fetchError: string;
    saveError: string;
    saved: string;
    today: string;
    active: string;
    inactive: string;
    items: string;
    won: string;
    people: string;
    cases: string;
    backToList: string;
    selectNone: string;
    deleteConfirm: string;
    year: string;
    month: string;
  };
  nav: {
    systemName: string;
    dashboard: string;
    members: string;
    offerings: string;
    offeringStatus: string;
    offeringInput: string;
    offeringStats: string;
    onlineOffering: string;
    finance: string;
    financeOverview: string;
    transactions: string;
    budgets: string;
    financeReports: string;
    community: string;
    groups: string;
    attendance: string;
    attendanceStats: string;
    newcomers: string;
    pledges: string;
    pastoral: string;
    pastoralStatus: string;
    birthdays: string;
    messages: string;
    facilityStatus: string;
    facilityBookings: string;
    settings: string;
    logout: string;
  };
  bible: {
    verses: { text: string; ref: string }[];
  };
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
  members: {
    title: string;
    totalCount: string;
    register: string;
    searchPlaceholder: string;
    headers: string[];
    statusLabels: Record<string, string>;
    genderLabels: Record<string, string>;
    noMembers: string;
    noSearchResults: string;
    registerPrompt: string;
    // members/new
    newTitle: string;
    newSubtitle: string;
    sectionBasic: string;
    sectionContact: string;
    sectionChurch: string;
    name: string;
    gender: string;
    male: string;
    female: string;
    notSpecified: string;
    birthDate: string;
    phone: string;
    email: string;
    zipcode: string;
    address: string;
    addressSearch: string;
    addressPlaceholder: string;
    detailAddress: string;
    registeredDate: string;
    baptismDate: string;
    status: string;
    nameRequired: string;
    emailInvalid: string;
  };
  offerings: {
    title: string;
    totalCount: string;
    enterOffering: string;
    monthlyTotal: string;
    totalCases: string;
    totalOfferingCount: string;
    allPeriod: string;
    dateFrom: string;
    dateTo: string;
    offeringType: string;
    headers: string[];
    confirmed: string;
    draft: string;
    noOfferings: string;
    changeFilter: string;
    tryEntering: string;
    // offerings/new
    newTitle: string;
    newSubtitle: string;
    offeringDate: string;
    worshipType: string;
    noItems: string;
    offeringItems: string;
    total: string;
    donor: string;
    memberLinked: string;
    directInput: string;
    searchMember: string;
    manualPlaceholder: string;
    searchPlaceholder: string;
    searching: string;
    noSearchResults: string;
    amount: string;
    paymentMethod: string;
    paymentCash: string;
    paymentTransfer: string;
    paymentCard: string;
    select: string;
    notes: string;
    notesPlaceholder: string;
    addItem: string;
    saveDraft: string;
    confirmOffering: string;
    minOneItem: string;
    selectOfferingType: string;
  };
  finance: {
    title: string;
    subtitle: string;
    enterTransaction: string;
    totalIncome: string;
    totalExpense: string;
    netProfit: string;
    currentBalance: string;
    monthlyChart: string;
    yearStats: string;
    viewTransactions: string;
    accountStatus: string;
    registeredAccounts: string;
    addAccount: string;
    noAccounts: string;
    income: string;
    expense: string;
    accountTypes: Record<string, string>;
    months: string[];
  };
  settings: {
    title: string;
    subtitle: string;
    tabs: { church: string; codes: string; users: string; plan: string; backup: string };
    // ChurchTab
    churchBasicInfo: string;
    churchName: string;
    addressSearch: string;
    phone: string;
    foundedDate: string;
    denomination: string;
    denominationSelect: string;
    denominations: string[];
    // CodeTab
    codeCategories: { type: string; label: string }[];
    addItem: string;
    newItemPlaceholder: string;
    noRegisteredItems: string;
    // UsersTab
    userList: string;
    inviteUser: string;
    inviteEmailPlaceholder: string;
    sendInvite: string;
    inviteSentMsg: string;
    roleChangeFailed: string;
    inviteFailed: string;
    noUsers: string;
    roleLabels: Record<string, string>;
    headers: string[];
    // PlanTab
    currentPlan: string;
    memberStatus: string;
    planNames: Record<string, string>;
    features: string[];
    featureLabel: string;
    planComparison: string;
    current: string;
    mostPopular: string;
    contact: string;
    unlimited: string;
    needMore: string;
    upgradeContact: string;
    dataRetention: string;
    apiAccess: string;
    dedicatedSupport: string;
  };
  groups: {
    title: string;
    subtitle: string;
    register: string;
    all: string;
    types: string[];
    days: string[];
    leader: string;
    unassigned: string;
    groupMembers: string;
    noGroups: string;
    noGroupsHint: string;
    registerGroup: string;
    // CreateModal
    createTitle: string;
    createSubtitle: string;
    groupName: string;
    type: string;
    addType: string;
    meetingDay: string;
    selectDay: string;
    meetingTime: string;
    nameRequired: string;
    registering: string;
    registerSubmit: string;
    // AddTypeModal
    addTypeTitle: string;
    addTypePlaceholder: string;
    typeNameRequired: string;
    registerFailed: string;
    addSubmit: string;
  };
  attendance: {
    title: string;
    subtitle: string;
    viewStats: string;
    worshipTab: string;
    groupTab: string;
    statusLabels: Record<string, string>;
    selectWorship: string;
    searchMember: string;
    batchApply: string;
    noMembers: string;
    savedMsg: string;
    batchSave: string;
    selectWorshipError: string;
    selectGroup: string;
    selectGroupHint: string;
    noGroupMembers: string;
    selectGroupError: string;
  };
  login: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    loginBtn: string;
    loggingIn: string;
    copyright: string;
    errors: {
      wrongCredentials: string;
      forbidden: string;
      tooMany: string;
      serverError: string;
      genericError: string;
      networkError: string;
      tokenError: string;
    };
  };
}

// ─── 한국어 번역 ─────────────────────────────────────────────
const ko: Translations = {
  common: {
    loading: '불러오는 중...',
    saving: '저장 중...',
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    edit: '수정',
    add: '추가',
    confirm: '확인',
    retry: '다시 시도',
    close: '닫기',
    all: '전체',
    search: '검색',
    reset: '초기화',
    noData: '데이터가 없습니다',
    error: '오류',
    fetchError: '데이터를 불러오지 못했습니다.',
    saveError: '저장에 실패했습니다.',
    saved: '저장되었습니다.',
    today: '오늘',
    active: '활성',
    inactive: '비활성',
    items: '개',
    won: '원',
    people: '명',
    cases: '건',
    backToList: '목록으로',
    selectNone: '선택 안 함',
    deleteConfirm: '삭제하시겠습니까?',
    year: '년',
    month: '월',
  },
  nav: {
    systemName: '교회 통합 관리 시스템',
    dashboard: '현황판',
    members: '교인 관리',
    offerings: '헌금 관리',
    offeringStatus: '헌금 현황',
    offeringInput: '헌금 입력',
    offeringStats: '헌금 통계',
    onlineOffering: '온라인 헌금',
    finance: '재정 관리',
    financeOverview: '재정 개요',
    transactions: '거래 내역',
    budgets: '예산 편성',
    financeReports: '재정 보고서',
    community: '공동체 관리',
    groups: '소그룹 관리',
    attendance: '출석 입력',
    attendanceStats: '출석 통계',
    newcomers: '새가족 관리',
    pledges: '작정헌금 관리',
    pastoral: '목양 관리',
    pastoralStatus: '목양 현황',
    birthdays: '생일 알림',
    messages: '메시지 발송',
    facilityStatus: '예약 현황',
    facilityBookings: '예약 관리',
    settings: '설정',
    logout: '로그아웃',
  },
  bible: {
    verses: [
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
    ],
  },
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
  members: {
    title: '교인 관리',
    totalCount: '전체 교인 {count}명',
    register: '교인 등록',
    searchPlaceholder: '이름, 전화번호, 이메일 검색...',
    headers: ['이름', '성별', '전화번호', '이메일', '등록일', '상태'],
    statusLabels: { active: '활동중', inactive: '휴면', completed: '수료', withdrawn: '탈퇴' },
    genderLabels: { M: '남', F: '여' },
    noMembers: '교인이 없습니다',
    noSearchResults: '"{query}" 검색 결과가 없어요.',
    registerPrompt: '교인을 등록해보세요!',
    newTitle: '교인 등록',
    newSubtitle: '새 교인 정보를 입력해주세요',
    sectionBasic: '기본 정보',
    sectionContact: '연락처',
    sectionChurch: '교회 정보',
    name: '이름',
    gender: '성별',
    male: '남자',
    female: '여자',
    notSpecified: '미입력',
    birthDate: '생년월일',
    phone: '전화번호',
    email: '이메일',
    zipcode: '우편번호',
    address: '주소',
    addressSearch: '주소 검색',
    addressPlaceholder: '주소 검색 버튼을 눌러주세요',
    detailAddress: '동/호수, 건물명 등 상세주소 입력',
    registeredDate: '등록일',
    baptismDate: '세례일',
    status: '상태',
    nameRequired: '이름은 필수 항목입니다.',
    emailInvalid: '유효한 이메일 주소를 입력해주세요.',
  },
  offerings: {
    title: '헌금 관리',
    totalCount: '전체 {count}건',
    enterOffering: '헌금 입력',
    monthlyTotal: '{label} 헌금 합계',
    totalCases: '총 {count}건',
    totalOfferingCount: '전체 헌금 건수',
    allPeriod: '전체 기간',
    dateFrom: '시작일',
    dateTo: '종료일',
    offeringType: '헌금 종류',
    headers: ['날짜', '헌금 종류', '예배 종류', '합계 금액', '건수', '상태'],
    confirmed: '확정',
    draft: '임시저장',
    noOfferings: '헌금 내역이 없습니다',
    changeFilter: '필터 조건을 변경해보세요.',
    tryEntering: '헌금을 입력해보세요!',
    newTitle: '헌금 입력',
    newSubtitle: '헌금 항목을 추가하고 저장하세요',
    offeringDate: '헌금 날짜',
    worshipType: '예배 종류',
    noItems: '항목 없음',
    offeringItems: '헌금 항목',
    total: '합계',
    donor: '헌금자',
    memberLinked: '✓ 교인 연결됨',
    directInput: '직접 입력',
    searchMember: '교인 검색으로',
    manualPlaceholder: '이름 직접 입력 (비등록 헌금자)',
    searchPlaceholder: '이름으로 교인 검색...',
    searching: '검색 중...',
    noSearchResults: '검색 결과 없음',
    amount: '금액',
    paymentMethod: '납부 방법',
    paymentCash: '현금',
    paymentTransfer: '계좌이체',
    paymentCard: '카드',
    select: '선택',
    notes: '비고',
    notesPlaceholder: '특이사항 입력 (선택)',
    addItem: '헌금 항목 추가',
    saveDraft: '임시저장',
    confirmOffering: '헌금 확정',
    minOneItem: '최소 하나의 헌금 항목을 완성해주세요 (이름 + 금액).',
    selectOfferingType: '헌금 종류를 선택해주세요.',
  },
  finance: {
    title: '재정 관리',
    subtitle: '교회 전체 재정 현황',
    enterTransaction: '거래 입력',
    totalIncome: '총 수입',
    totalExpense: '총 지출',
    netProfit: '순이익',
    currentBalance: '현재 잔액',
    monthlyChart: '월별 수입 / 지출',
    yearStats: '{year}년 통계',
    viewTransactions: '거래 내역 →',
    accountStatus: '계좌 현황',
    registeredAccounts: '등록된 교회 계좌',
    addAccount: '계좌 추가',
    noAccounts: '등록된 계좌가 없습니다',
    income: '수입',
    expense: '지출',
    accountTypes: { checking: '당좌', savings: '보통', cash: '현금' },
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  },
  settings: {
    title: '설정',
    subtitle: '교회 정보 및 시스템 설정을 관리합니다',
    tabs: { church: '교회 정보', codes: '코드 관리', users: '사용자 관리', plan: '요금제', backup: '데이터 관리' },
    churchBasicInfo: '기본 정보',
    churchName: '교회 이름',
    addressSearch: '주소 검색',
    phone: '전화번호',
    foundedDate: '설립일',
    denomination: '교단',
    denominationSelect: '교단 선택',
    denominations: ['예장합동', '예장통합', '기감', '기장', '기성', '순복음', '침례교', '루터교', '성공회', '기타'],
    codeCategories: [
      { type: 'offering_type', label: '헌금 종류' },
      { type: 'worship_type', label: '예배 종류' },
      { type: 'transaction_category', label: '거래 분류' },
      { type: 'budget_category', label: '예산 분류' },
    ],
    addItem: '항목 추가',
    newItemPlaceholder: '새 항목 이름 입력 후 Enter',
    noRegisteredItems: '등록된 항목이 없습니다',
    userList: '사용자 목록',
    inviteUser: '사용자 초대',
    inviteEmailPlaceholder: '초대할 이메일 주소',
    sendInvite: '초대 발송',
    inviteSentMsg: '{email} 으로 초대 메일을 발송했습니다.',
    roleChangeFailed: '역할 변경에 실패했습니다.',
    inviteFailed: '초대에 실패했습니다.',
    noUsers: '등록된 사용자가 없습니다',
    roleLabels: {
      senior_pastor: '담임목사',
      associate_pastor: '부목사',
      admin_staff: '사무 담당자',
      admin: '관리자',
      staff: '직원',
      viewer: '열람자',
    },
    headers: ['이름', '이메일', '역할', '상태', ''],
    currentPlan: '현재 요금제',
    memberStatus: '교인 현황',
    planNames: { free: '무료', growth: '성장', community: '공동체', enterprise: '대형' },
    features: [
      '교인 관리', '헌금 관리', '재정 관리', '공동체 관리', '목양 관리',
      'AI 목회 도우미', '교인 한도', '사용자 수', '전담 고객 지원',
    ],
    featureLabel: '기능',
    planComparison: '요금제 비교',
    current: '현재',
    mostPopular: '가장 인기',
    contact: '문의',
    unlimited: '무제한',
    needMore: '더 많은 기능이 필요하신가요?',
    upgradeContact: '업그레이드 문의',
    dataRetention: '데이터 보관',
    apiAccess: 'API 접근',
    dedicatedSupport: '전담 고객 지원',
  },
  groups: {
    title: '소그룹 관리',
    subtitle: '교회 소그룹을 관리합니다',
    register: '소그룹 등록',
    all: '전체',
    types: ['구역', '목장', '셀', '부서', '순', '팀'],
    days: ['월', '화', '수', '목', '금', '토', '일'],
    leader: '리더',
    unassigned: '미지정',
    groupMembers: '소그룹원',
    noGroups: '등록된 소그룹이 없습니다',
    noGroupsHint: '상단 버튼으로 첫 소그룹을 등록해보세요',
    registerGroup: '+ 소그룹 등록',
    createTitle: '소그룹 등록',
    createSubtitle: '새 소그룹을 등록합니다',
    groupName: '소그룹명',
    type: '유형',
    addType: '추가',
    meetingDay: '모임 요일',
    selectDay: '요일 선택',
    meetingTime: '모임 시간',
    nameRequired: '소그룹명을 입력해주세요.',
    registering: '등록 중...',
    registerSubmit: '등록하기',
    addTypeTitle: '새 유형 추가',
    addTypePlaceholder: '예) 속회, 청년부, 성가대',
    typeNameRequired: '유형 이름을 입력해주세요.',
    registerFailed: '등록에 실패했습니다.',
    addSubmit: '추가하기',
  },
  attendance: {
    title: '출석 관리',
    subtitle: '예배 및 구역별 출석을 기록합니다',
    viewStats: '출석 통계 보기',
    worshipTab: '⛪ 예배 출석',
    groupTab: '🏘️ 구역 출석',
    statusLabels: { present: '출석', absent: '결석', late: '지각', online: '온라인' },
    selectWorship: '예배 선택',
    searchMember: '교인 이름 검색...',
    batchApply: '일괄:',
    noMembers: '교인이 없습니다',
    savedMsg: '✓ 저장되었습니다',
    batchSave: '일괄 저장',
    selectWorshipError: '예배를 선택해주세요.',
    selectGroup: '구역 선택',
    selectGroupHint: '구역을 선택하면 구역원 목록이 표시됩니다',
    noGroupMembers: '구역원이 없습니다',
    selectGroupError: '구역을 선택해주세요.',
  },
  login: {
    title: 'J-SheepFold',
    subtitle: '교회 통합 관리 시스템',
    email: '이메일',
    password: '비밀번호',
    emailPlaceholder: 'admin@church.com',
    passwordPlaceholder: '비밀번호를 입력하세요',
    loginBtn: '로그인',
    loggingIn: '로그인 중...',
    copyright: 'J-SheepFold. All rights reserved.',
    errors: {
      wrongCredentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
      forbidden: '접근 권한이 없습니다. 관리자에게 문의하세요.',
      tooMany: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
      serverError: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      genericError: '로그인 처리 중 오류가 발생했습니다.',
      networkError: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
      tokenError: '로그인 처리 중 오류가 발생했습니다.',
    },
  },
};

export default ko;
