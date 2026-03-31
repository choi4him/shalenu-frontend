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
  pastoral: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allTab: string;
    noNotes: string;
    noNotesHint: string;
    categoryLabels: Record<string, string>;
    privateLabel: string;
    privateContent: string;
    authorLabel: string;
  };
  attendanceStats: {
    title: string;
    subtitle: string;
    goToInput: string;
    thisMonth: string;
    monthlyTrend: string;
    ratioTitle: string;
    memberStats: string;
    searchPlaceholder: string;
    loading: string;
    colName: string;
    colPresent: string;
    colAbsent: string;
    colLate: string;
    colOnline: string;
    colRate: string;
    chartLabels: Record<string, string>;
  };
  transactions: {
    title: string;
    enterTransaction: string;
    totalCount: string;
    incomeTotal: string;
    expenseTotal: string;
    netProfit: string;
    dateFrom: string;
    dateTo: string;
    accountFilter: string;
    typeFilter: string;
    allTypes: string;
    income: string;
    expense: string;
    headers: string[];
    noTransactions: string;
    changeFilter: string;
    tryEntering: string;
    categoryLabels: Record<string, string>;
  };
  payments: {
    title: string;
    subtitle: string;
    createLink: string;
    linksTab: string;
    historyTab: string;
    activeLinksCount: string;
    completedCount: string;
    totalAmount: string;
    noLinks: string;
    noLinksHint: string;
    noPayments: string;
    noPaymentsHint: string;
    active: string;
    inactive: string;
    activate: string;
    deactivate: string;
    copyLink: string;
    copied: string;
    preview: string;
    freeAmount: string;
    anonymous: string;
    stripeSetupTitle: string;
    stripeSetupHint: string;
    historyHeaders: string[];
    statusChanged: string;
    statusChangeFailed: string;
    statusLabels: Record<string, string>;
    modalTitle: string;
    stripeSubtitle: string;
    portoneSubtitle: string;
    currencyLabel: string;
    nameLabel: string;
    namePlaceholder: string;
    descLabel: string;
    descPlaceholder: string;
    amountTypeLabel: string;
    fixedAmount: string;
    customAmountLabel: string;
    amountKrw: string;
    amountUsd: string;
    customAmountNotice: string;
    creating: string;
    createBtn: string;
    errName: string;
    errAmount: string;
    errCreate: string;
  };
  messages: {
    title: string;
    subtitle: string;
    composeTab: string;
    historyTab: string;
    notice: string;
    noticeStrong: string;
    msgTypeLabel: string;
    smsLabel: string;
    emailLabel: string;
    recipientLabel: string;
    allMembers: string;
    byGroup: string;
    individual: string;
    memberSearchPlaceholder: string;
    alreadyAdded: string;
    noGroups: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    contentLabel: string;
    smsPlaceholder: string;
    emailContentPlaceholder: string;
    smsLimitWarning: string;
    smsCharUnit: string;
    saveDraft: string;
    sendBtn: string;
    processing: string;
    errContent: string;
    errRecipient: string;
    draftSaved: string;
    scheduledSaved: string;
    historyHeaders: string[];
    noHistory: string;
    noHistoryHint: string;
    statusLabels: Record<string, string>;
  };
  birthdays: {
    title: string;
    subtitle: string;
    upcomingSection: string;
    calendarSection: string;
    settingsSection: string;
    thisMonth: string;
    nextMonth: string;
    noBirthdays: string;
    noBirthdaysHint: string;
    ageLabel: string;
    todayLabel: string;
    enableAlerts: string;
    enableAlertsDesc: string;
    alertDaysLabel: string;
    currentSetting: string;
    daysBefore: string;
    alertMethod: string;
    appNotification: string;
    appNotificationDesc: string;
    saveSettings: string;
    saving: string;
    savedOk: string;
    saveFailed: string;
    days: string[];
    months: string[];
  };
  pledges: {
    title: string;
    subtitle: string;
    registerPledge: string;
    searchPlaceholder: string;
    headers: string[];
    noPledges: string;
    noPledgesHint: string;
    totalPledge: string;
    totalPaid: string;
    totalRate: string;
    payBtn: string;
    statusLabels: Record<string, string>;
    statusTabs: string[];
    payCycles: string[];
    payModalTitle: string;
    pledgedLabel: string;
    paidLabel: string;
    remainingLabel: string;
    payAmountLabel: string;
    fullAmount: string;
    processing: string;
    processPayment: string;
    errPayAmount: string;
    errMaxAmount: string;
    errProcessFailed: string;
    paymentProcessed: string;
    createModalTitle: string;
    createModalSubtitle: string;
    memberLabel: string;
    memberSearchPlaceholder: string;
    selectedMember: string;
    pledgeNameLabel: string;
    pledgeNamePlaceholder: string;
    pledgeAmountLabel: string;
    startDateLabel: string;
    endDateLabel: string;
    payCycleLabel: string;
    registering: string;
    registerBtn: string;
    errMember: string;
    errPledgeName: string;
    errPledgeAmount: string;
    errRegister: string;
    registered: string;
  };
  facilities: {
    title: string;
    subtitle: string;
    addFacility: string;
    calendarTitle: string;
    facilityList: string;
    todayBookings: string;
    noBookingsToday: string;
    bookFacility: string;
    noFacilities: string;
    noFacilitiesHint: string;
    capacity: string;
    moreBookings: string;
    noBookingsOnDay: string;
    statusLabels: Record<string, string>;
    days: string[];
    months: string[];
    bookingModalTitle: string;
    facilityLabel: string;
    selectFacilityPlaceholder: string;
    bookingTitleLabel: string;
    bookingTitlePlaceholder: string;
    dateLabel: string;
    startTimeLabel: string;
    endTimeLabel: string;
    noteLabel: string;
    notePlaceholder: string;
    approvalNotice: string;
    submitting: string;
    submitBooking: string;
    errFacility: string;
    errBookingTitle: string;
    errTimeOrder: string;
    errSubmit: string;
    facilityModalTitle: string;
    facilityNameLabel: string;
    facilityNamePlaceholder: string;
    capacityLabel: string;
    capacityPlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    registerFacility: string;
    errFacilityName: string;
    registerFailed: string;
  };
  facilityBookings: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    statusLabels: Record<string, string>;
    headers: string[];
    noBookings: string;
    noBookingsHint: string;
    approveBtn: string;
    cancelBtn: string;
    approvedMsg: string;
    cancelledMsg: string;
    errProcess: string;
    facilityLabel: string;
    dateLabel: string;
    requesterLabel: string;
    requestDateLabel: string;
    noteLabel: string;
    processing: string;
    approveAction: string;
    cancelBooking: string;
  };
  settingsBackup: {
    exportTitle: string;
    exportDesc: string;
    exportBtn: string;
    exporting: string;
    lastExport: string;
    importTitle: string;
    dropzone: string;
    previewLabel: string;
    importMethod: string;
    mergeLabel: string;
    mergeDesc: string;
    replaceLabel: string;
    replaceDesc: string;
    replaceWarning: string;
    importWarning: string;
    importBtn: string;
    importingBtn: string;
    replaceBtn: string;
    importDone: string;
    imported: string;
    skipped: string;
    errCount: string;
    autoBackupTitle: string;
    autoBackupDesc: string;
    enabledLabel: string;
    disabledLabel: string;
    emailLabel: string;
    cycleLabel: string;
    weekly: string;
    monthly: string;
    lastBackup: string;
    nextBackup: string;
    saveSettings: string;
    savingSettings: string;
    settingsSaved: string;
    sendNow: string;
    sending: string;
    confirmReplace: string;
    jsonOnly: string;
    errExport: string;
    errImport: string;
    tableLabels: Record<string, string>;
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
  pastoral: {
    title: '목양 현황',
    subtitle: '최근 30일간의 심방·상담·기도 기록',
    searchPlaceholder: '교인명 또는 내용 검색',
    allTab: '전체',
    noNotes: '최근 30일 기록이 없습니다',
    noNotesHint: '교인 상세 페이지에서 목양 노트를 작성해보세요',
    categoryLabels: { visit: '심방', counsel: '상담', prayer: '기도', general: '일반' },
    privateLabel: '비공개',
    privateContent: '🔒 비공개 노트입니다',
    authorLabel: '작성:',
  },
  attendanceStats: {
    title: '출석 통계',
    subtitle: '월별 출석 현황과 교인별 출석률을 확인합니다',
    goToInput: '출석 입력으로',
    thisMonth: '이번 달',
    monthlyTrend: '월별 출석 추이',
    ratioTitle: '출석 비율',
    memberStats: '교인별 출석 현황',
    searchPlaceholder: '이름 검색...',
    loading: '통계 불러오는 중...',
    colName: '이름',
    colPresent: '출석',
    colAbsent: '결석',
    colLate: '지각',
    colOnline: '온라인',
    colRate: '출석률',
    chartLabels: { present: '출석', absent: '결석', late: '지각', online: '온라인' },
  },
  transactions: {
    title: '거래 내역',
    enterTransaction: '거래 입력',
    totalCount: '전체 {count}건',
    incomeTotal: '조회 수입 합계',
    expenseTotal: '조회 지출 합계',
    netProfit: '순수익',
    dateFrom: '시작일',
    dateTo: '종료일',
    accountFilter: '계좌',
    typeFilter: '거래 유형',
    allTypes: '전체',
    income: '수입',
    expense: '지출',
    headers: ['날짜', '적요', '분류', '계좌', '수입', '지출'],
    noTransactions: '거래 내역이 없습니다',
    changeFilter: '필터 조건을 변경해보세요.',
    tryEntering: '거래를 입력해보세요!',
    categoryLabels: { worship: '예배', mission: '선교', education: '교육', admin: '행정', facility: '시설', etc: '기타' },
  },
  payments: {
    title: '온라인 헌금',
    subtitle: 'Stripe(USD) · 포트원(KRW) 결제 링크로 온라인 헌금을 받으세요',
    createLink: '결제 링크 생성',
    linksTab: '결제 링크',
    historyTab: '헌금 내역',
    activeLinksCount: '{n}개 활성',
    completedCount: '완료된 헌금',
    totalAmount: '총 헌금액',
    noLinks: '결제 링크가 없습니다',
    noLinksHint: '우측 상단 "결제 링크 생성" 버튼을 눌러 첫 번째 헌금 링크를 만드세요',
    noPayments: '헌금 내역이 없습니다',
    noPaymentsHint: '결제 링크를 공유하면 헌금자가 결제한 내역이 여기에 표시됩니다',
    active: '활성',
    inactive: '비활성',
    activate: '활성화',
    deactivate: '비활성화',
    copyLink: '링크 복사',
    copied: '복사됨',
    preview: '미리보기',
    freeAmount: '자유 금액',
    anonymous: '익명',
    stripeSetupTitle: 'Stripe 설정이 필요합니다',
    stripeSetupHint: '백엔드 .env 파일에 아래 항목을 추가해주세요:',
    historyHeaders: ['날짜', '헌금자', '헌금 항목', '금액', '상태'],
    statusChanged: '상태가 변경되었습니다.',
    statusChangeFailed: '상태 변경에 실패했습니다.',
    statusLabels: { completed: '완료', pending: '대기', failed: '실패', refunded: '환불' },
    modalTitle: '결제 링크 생성',
    stripeSubtitle: 'Stripe를 통한 온라인 헌금 링크를 만듭니다',
    portoneSubtitle: '포트원(PortOne) 한국 결제 링크를 만듭니다',
    currencyLabel: '결제 통화 / 방법',
    nameLabel: '헌금 항목명 *',
    namePlaceholder: '예: 주일헌금, 선교헌금, 건축헌금',
    descLabel: '설명 (선택)',
    descPlaceholder: '헌금에 대한 간단한 설명',
    amountTypeLabel: '금액 방식',
    fixedAmount: '금액 고정',
    customAmountLabel: '자유 금액',
    amountKrw: '금액 (원)',
    amountUsd: '금액 (달러)',
    customAmountNotice: 'ℹ️ 헌금자가 직접 금액을 입력하여 결제합니다',
    creating: '생성 중...',
    createBtn: '링크 생성',
    errName: '헌금 항목명을 입력해주세요.',
    errAmount: '금액을 입력해주세요.',
    errCreate: '결제 링크 생성에 실패했습니다.',
  },
  messages: {
    title: '메시지 발송',
    subtitle: '교인에게 문자 및 이메일을 발송합니다',
    composeTab: '✉️ 새 메시지',
    historyTab: '📋 발송 이력',
    notice: '실제 문자/이메일 발송은 추후 지원 예정입니다. 현재는',
    noticeStrong: '발송 예정',
    msgTypeLabel: '메시지 유형',
    smsLabel: '📱 문자 (SMS)',
    emailLabel: '📧 이메일',
    recipientLabel: '수신자',
    allMembers: '전체 교인',
    byGroup: '소그룹별',
    individual: '개별 검색',
    memberSearchPlaceholder: '교인 이름 검색...',
    alreadyAdded: '(이미 추가됨)',
    noGroups: '소그룹이 없습니다',
    subjectLabel: '제목',
    subjectPlaceholder: '이메일 제목을 입력하세요',
    contentLabel: '내용',
    smsPlaceholder: '문자 내용을 입력하세요 (한글 90자 기준)',
    emailContentPlaceholder: '이메일 내용을 입력하세요',
    smsLimitWarning: '⚠️ 90자를 초과하면 장문(LMS)으로 발송될 수 있습니다',
    smsCharUnit: '/ 90자',
    saveDraft: '💾 임시저장',
    sendBtn: '📤 발송 등록',
    processing: '처리 중...',
    errContent: '내용을 입력해주세요.',
    errRecipient: '수신자를 선택해주세요.',
    draftSaved: '임시저장되었습니다.',
    scheduledSaved: '발송 예정으로 등록되었습니다.',
    historyHeaders: ['날짜', '유형', '내용', '수신자', '상태'],
    noHistory: '발송 이력이 없습니다',
    noHistoryHint: '새 메시지 탭에서 메시지를 작성해보세요',
    statusLabels: { draft: '임시저장', sent: '발송완료', failed: '발송실패', scheduled: '발송예정' },
  },
  birthdays: {
    title: '생일 알림',
    subtitle: '교인 생일을 확인하고 알림을 설정합니다',
    upcomingSection: '다가오는 생일',
    calendarSection: '생일 캘린더',
    settingsSection: '알림 설정',
    thisMonth: '(이번 달)',
    nextMonth: '(다음 달)',
    noBirthdays: '생일자가 없습니다',
    noBirthdaysHint: '교인 생년월일이 등록된 경우 표시됩니다',
    ageLabel: '만 {n}세',
    todayLabel: '🎉 오늘!',
    enableAlerts: '생일 알림 활성화',
    enableAlertsDesc: '생일이 다가오면 앱에서 알림을 표시합니다',
    alertDaysLabel: '며칠 전에 알릴까요?',
    currentSetting: '현재: {n}일 전',
    daysBefore: '{n}일 전',
    alertMethod: '알림 방법',
    appNotification: '앱 알림',
    appNotificationDesc: '문자/이메일 알림은 추후 지원 예정입니다',
    saveSettings: '설정 저장',
    saving: '저장 중...',
    savedOk: '✓ 저장되었습니다',
    saveFailed: '✕ 저장 실패',
    days: ['일', '월', '화', '수', '목', '금', '토'],
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  },
  pledges: {
    title: '작정헌금 관리',
    subtitle: '교인별 작정헌금 현황을 관리합니다',
    registerPledge: '작정헌금 등록',
    searchPlaceholder: '교인명 또는 헌금명 검색',
    headers: ['교인명', '작정헌금명', '작정금액', '납입금액', '진행률', '상태', ''],
    noPledges: '등록된 작정헌금이 없습니다',
    noPledgesHint: '상단 버튼으로 작정헌금을 등록하세요',
    totalPledge: '총 작정금액',
    totalPaid: '총 납입금액',
    totalRate: '전체 달성률',
    payBtn: '납입',
    statusLabels: { active: '진행중', completed: '완료', cancelled: '중단' },
    statusTabs: ['전체', '진행중', '완료', '중단'],
    payCycles: ['일시납', '월납', '주납', '분기납'],
    payModalTitle: '납입 처리',
    pledgedLabel: '작정 금액',
    paidLabel: '납입 완료',
    remainingLabel: '잔여 금액',
    payAmountLabel: '납입 금액',
    fullAmount: '전액',
    processing: '처리 중...',
    processPayment: '납입 확인',
    errPayAmount: '납입금액을 입력해주세요.',
    errMaxAmount: '납입 가능 금액은 최대 {amount}입니다.',
    errProcessFailed: '납입 처리에 실패했습니다.',
    paymentProcessed: '납입 처리되었습니다.',
    createModalTitle: '작정헌금 등록',
    createModalSubtitle: '새 작정헌금을 등록합니다',
    memberLabel: '교인',
    memberSearchPlaceholder: '교인 이름 검색...',
    selectedMember: '✓ 선택됨',
    pledgeNameLabel: '작정헌금명',
    pledgeNamePlaceholder: '예) 2026년 건축헌금 작정',
    pledgeAmountLabel: '작정 금액',
    startDateLabel: '시작일',
    endDateLabel: '종료일',
    payCycleLabel: '납입 주기',
    registering: '등록 중...',
    registerBtn: '등록하기',
    errMember: '교인을 선택해주세요.',
    errPledgeName: '작정헌금명을 입력해주세요.',
    errPledgeAmount: '작정 금액을 입력해주세요.',
    errRegister: '등록에 실패했습니다.',
    registered: '등록되었습니다.',
  },
  facilities: {
    title: '예약 현황',
    subtitle: '시설을 선택하고 예약을 신청하세요',
    addFacility: '시설 등록',
    calendarTitle: '월별 예약 캘린더',
    facilityList: '시설 목록',
    todayBookings: '오늘 예약',
    noBookingsToday: '예약 없음',
    bookFacility: '예약하기',
    noFacilities: '등록된 시설이 없습니다',
    noFacilitiesHint: '우측 상단 "시설 등록" 버튼을 눌러 시설을 추가하세요',
    capacity: '수용 {n}명',
    moreBookings: '+{n}건 더',
    noBookingsOnDay: '이 날 예약이 없습니다',
    statusLabels: { pending: '승인대기', approved: '승인', cancelled: '취소' },
    days: ['일', '월', '화', '수', '목', '금', '토'],
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    bookingModalTitle: '시설 예약 신청',
    facilityLabel: '시설',
    selectFacilityPlaceholder: '시설을 선택하세요',
    bookingTitleLabel: '예약 제목',
    bookingTitlePlaceholder: '예: 청년부 예배, 소그룹 모임',
    dateLabel: '날짜',
    startTimeLabel: '시작 시간',
    endTimeLabel: '종료 시간',
    noteLabel: '사용 목적 / 메모',
    notePlaceholder: '사용 목적이나 추가 요청사항을 입력하세요',
    approvalNotice: 'ℹ️ 신청 후 관리자 승인이 필요합니다',
    submitting: '신청 중...',
    submitBooking: '예약 신청',
    errFacility: '시설을 선택해주세요.',
    errBookingTitle: '예약 제목을 입력해주세요.',
    errTimeOrder: '종료 시간은 시작 시간 이후여야 합니다.',
    errSubmit: '예약 신청에 실패했습니다.',
    facilityModalTitle: '시설 등록',
    facilityNameLabel: '시설명 *',
    facilityNamePlaceholder: '예: 본당, 세미나실',
    capacityLabel: '수용인원',
    capacityPlaceholder: '인원 수',
    descriptionLabel: '설명',
    descriptionPlaceholder: '시설 설명',
    registerFacility: '등록',
    errFacilityName: '시설명을 입력해주세요.',
    registerFailed: '등록 실패',
  },
  facilityBookings: {
    title: '예약 관리',
    subtitle: '시설 예약을 승인하거나 취소합니다',
    searchPlaceholder: '제목/시설/신청자 검색',
    statusLabels: { pending: '승인대기', approved: '승인', cancelled: '취소' },
    headers: ['날짜', '시간', '예약 제목 / 시설', '신청자', '상태', '관리'],
    noBookings: '예약이 없습니다',
    noBookingsHint: '예약 현황 페이지에서 예약을 신청해보세요',
    approveBtn: '승인',
    cancelBtn: '취소',
    approvedMsg: '승인되었습니다.',
    cancelledMsg: '취소되었습니다.',
    errProcess: '처리 중 오류가 발생했습니다.',
    facilityLabel: '시설',
    dateLabel: '날짜',
    requesterLabel: '신청자',
    requestDateLabel: '신청일',
    noteLabel: '메모',
    processing: '처리 중...',
    approveAction: '✓ 승인',
    cancelBooking: '예약 취소',
  },
  settingsBackup: {
    exportTitle: '데이터 내보내기',
    exportDesc: '정기적으로 백업하여 데이터를 안전하게 보관하세요.',
    exportBtn: '⬇️ 전체 데이터 내보내기',
    exporting: '⏳ 내보내는 중...',
    lastExport: '마지막 내보내기:',
    importTitle: '데이터 가져오기',
    dropzone: 'JSON 파일을 드래그하거나 클릭하여 선택',
    previewLabel: '📋 포함 데이터:',
    importMethod: '가져오기 방식',
    mergeLabel: '병합',
    mergeDesc: '— 기존 데이터를 유지하고 새 데이터만 추가 (중복 UUID 스킵)',
    replaceLabel: '전체 교체',
    replaceDesc: '— 기존 데이터를 모두 삭제하고 백업 데이터로 교체',
    replaceWarning: '⚠️ 전체 교체 시 기존 데이터는 복구할 수 없습니다. 반드시 현재 데이터를 먼저 내보내기하세요.',
    importWarning: 'ℹ️ 가져오기 전 반드시 현재 데이터를 백업하세요. 전체 교체 시 기존 데이터는 복구할 수 없습니다.',
    importBtn: '📥 병합으로 가져오기',
    importingBtn: '⏳ 가져오는 중...',
    replaceBtn: '🔄 전체 교체로 가져오기',
    importDone: '✅ 가져오기 완료',
    imported: '가져옴:',
    skipped: '스킵:',
    errCount: '오류',
    autoBackupTitle: '자동 백업 이메일',
    autoBackupDesc: '정기적으로 지정된 이메일로 백업 파일을 자동 발송합니다.',
    enabledLabel: '자동 백업 활성화됨',
    disabledLabel: '자동 백업 비활성화',
    emailLabel: '수신 이메일',
    cycleLabel: '백업 주기',
    weekly: '매주',
    monthly: '매월',
    lastBackup: '마지막 백업:',
    nextBackup: '다음 백업:',
    saveSettings: '설정 저장',
    savingSettings: '저장 중...',
    settingsSaved: '자동 백업 설정이 저장되었습니다.',
    sendNow: '지금 발송',
    sending: '발송 중...',
    confirmReplace: '⚠️ 기존 데이터가 모두 삭제됩니다. 계속하시겠습니까?',
    jsonOnly: 'JSON 파일만 업로드 가능합니다.',
    errExport: '내보내기 실패:',
    errImport: '가져오기 실패:',
    tableLabels: {
      shalenu_members: '교인', shalenu_offerings: '헌금', shalenu_transactions: '거래',
      shalenu_budgets: '예산', shalenu_budget_items: '예산항목', shalenu_small_groups: '소그룹',
      shalenu_attendance_logs: '출석', shalenu_newcomers: '새가족', shalenu_pastoral_notes: '목양노트',
      shalenu_offering_pledges: '작정헌금', shalenu_offering_items: '헌금항목',
      shalenu_small_group_members: '소그룹멤버', shalenu_finance_accounts: '재정계정',
      shalenu_lookup_codes: '코드',
    },
  },
};

export default ko;
