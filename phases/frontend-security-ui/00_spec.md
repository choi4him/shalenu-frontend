# Phase — frontend-security-ui

백엔드 Phase 1~3 (critical-auth-fix · backup-security · auth-hardening) 이
제공하는 새 응답·엔드포인트에 프론트 UX 를 맞춘다.

- 브랜치: `feat/frontend-security-ui`
- 선행 의존: 백엔드 3개 phase 가 Railway 에 배포되어 있어야 실사용 검증 가능
- 영향 범위: login, onboarding, settings (data/users 탭), lib/api, i18n

---

## step1 — 백업 암호 1회 모달

### API
`POST /api/v1/backup/send-now` 응답에 `{status, to, password, password_id}`.

### UX
- 성공 시 `BackupPasswordModal` 오버레이 표시
- 제목: **"백업 암호 — 지금 기록하세요"**
- 경고: "이 암호는 이번 한 번만 표시되며 다시 확인할 수 없습니다"
- 암호 값: monospace, 24px 이상, 복사 버튼 포함
- 체크박스 "복사했습니다" 가 켜져야 **닫기** 버튼 활성화
- 닫으면 상태에서 password 를 즉시 제거 (메모리 잔류 방지)

### 파일
- `app/[lang]/(app)/settings/page.tsx` `DataTab` — `handleSendNow` 응답 처리
- 신규: 인라인 컴포넌트 `BackupPasswordModal` (동일 파일 내 private)

---

## step2 — 백업 메타데이터 표시

### API
`GET /api/v1/backup/passwords/latest` → `{exists, sent_to, created_at, revealed_at}` 또는 `{exists:false}`.

### UX
- 자동 백업 카드 하단에 "최근 백업 암호" 섹션:
  - "마지막 발송: 2026-04-19 15:30"
  - "수신: admin@test.com"
  - "암호는 이메일 발송 시 1회만 노출됩니다"
  - `revealed_at` 이 `null` 이면 "아직 미확인" 뱃지, 아니면 "확인됨"
- DataTab 첫 로드 시 병행 fetch, 실패해도 기존 설정 표시에 영향 없어야 함.

### 파일
- `app/[lang]/(app)/settings/page.tsx` `DataTab`

---

## step3 — 계정 잠금 UX + 비번 정책 안내

### 3-a. Login 423 처리
- 현재 `app/[lang]/login/page.tsx` 는 raw fetch 사용. 423 응답일 때:
  - `Retry-After` 헤더 초 단위 → 분 단위로 변환
  - 에러 영역에 **"계정이 잠겼습니다 — 약 NN분 NN초 후 재시도"** 카운트다운
  - 카운트다운은 `setInterval` 로 1초마다 감소, 0 이 되면 사라짐
  - 카운트다운 동안 버튼 disabled

### 3-b. 비번 정책 안내 (회원가입 / onboarding)
- `app/[lang]/onboarding/page.tsx` 비번 필드 아래:
  - "10자 이상, 숫자 + 특수문자 포함" 문구
  - 기존 strength bar 는 그대로 유지하되, 최소 기준을 통과했는지 여부로 버튼
    활성/비활성 보강 (422 사전 차단)
- 이미 존재하는 client 측 8자 검증을 10자 + 정규식으로 상향.

### 파일
- `app/[lang]/login/page.tsx`
- `app/[lang]/onboarding/page.tsx`
- `lib/i18n/ko.ts`, `lib/i18n/en.ts` — 신규 키 추가

---

## step4 — 관리자 잠금 해제

### API
`POST /api/v1/users/{id}/unlock` → `{unlocked:true, user_id}`.

### 데이터
GET /api/v1/users 응답에 `locked_until` / `failed_login_count` 포함 여부
확인 필요. 현재 `UserItem` 타입에 없다면 임의 필드로 optional 추가 후
프론트 표시만 처리 (백엔드에서 응답 확장은 후속 티켓).

### UX
- UsersTab 행에:
  - `locked_until > now` 이면 🔒 + "잠금됨" 뱃지
  - admin 역할인 현재 사용자에게만 "잠금 해제" 버튼 표시
  - 클릭 시 `POST /users/{id}/unlock` 호출 → 성공 토스트 + 목록 재조회
- 일반 사용자(현재 로그인) 역할 판정은 `/api/v1/auth/me` 의 role 값.
  이미 layout 에서 조회해 두지 않았다면 UsersTab 에서 1회 호출.

### 파일
- `app/[lang]/(app)/settings/page.tsx` `UsersTab`
- `lib/i18n/*` 문자열

---

## 공통 확장

### lib/api.ts
- 현재 `apiClient<T>` 는 `res.json()` 만 반환 → 헤더 접근 불가.
  423 분기 / Retry-After 를 위해 다음 중 택 1:
  1. `apiClient` 내부에 **423** 분기를 추가하고, `Error` 서브클래스로
     `retryAfterSeconds` 필드를 실어 throw.
  2. 별도 `apiRequest` (raw Response) helper 를 추가.
- 본 phase 에서는 **옵션 1** 채택. 새 에러 클래스 `AccountLockedError`.
- 또한 login 페이지는 raw `fetch` 를 쓰므로 그쪽도 423 분기 직접 처리.

### 검증 명령
```bash
npm run build
npx tsc --noEmit
```

두 단계 모두 통과해야 execute.py 의 verify loop 을 넘어간다.

### 배포 후 확인
1. `git push` → Vercel 자동 배포 대기 (~60초)
2. 프론트 `/{lang}/login` 열어 콘솔 에러 없는지
3. 잘못된 비번 6회 반복 → 423 안내 표시되는지
4. `/settings?tab=backup` 에서 [지금 발송] → 암호 모달 표시
