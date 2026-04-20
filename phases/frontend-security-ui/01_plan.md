# Plan — frontend-security-ui

- slug: `frontend-security-ui`
- branch: `feat/frontend-security-ui`
- generated: 2026-04-19T20:55:49

## Guardrails

<details><summary>CLAUDE.md</summary>

```markdown
# CRITICAL — 절대 어기면 안 되는 규칙

아래 항목은 Harness 워크플로우(`/harness`, `/review`) 와 PreToolUse
훅이 함께 지키는 상위 규칙이다. 어떤 리팩토링 / 속도 개선 / 스타일
변경도 이 규칙을 깨는 대가로는 허용되지 않는다.

- **모든 DB 쿼리(SELECT/UPDATE/DELETE)에 `church_id` 조건 필수.**
  멀티테넌트 데이터 누수를 막는 1차 방어선이다. 예외는 슈퍼관리자
  전용 라우터(`routers/admin/...`) 에서 권한 검사를 거친 경우뿐.
- **`shalenu_` 테이블 접두사 변경 금지.** 브랜드/네이밍 아이디어가
  생겨도 접두사는 건드리지 않는다. 실제 운영 데이터와의 호환을
  깨뜨린다. (ADR-004)
- **`style.css` 의 `.reveal` 섹션 수정 금지.** 설교/슬라이드 뷰어가
  의존한다. 새 스타일은 별도 클래스로 추가.
- **psycopg2 는 `%s` 파라미터 바인딩 사용.** 문자열 포매팅(f-string
  / `%` / `.format()`) 으로 값을 SQL 에 조립하면 즉시 수정한다.
  SQL 인젝션 예방. (ADR-003)

# 작업 방식 규칙

## 승인 없이 자동 진행
- 모든 코드 수정/생성/삭제는 승인 없이 바로 진행
- 중간에 "계속할까요?" "진행할까요?" 질문 금지
- 여러 파일 수정이 필요해도 한 번에 진행

## 배포 전 자동 점검
1. npm run build — 빌드 에러 확인
2. npx tsc --noEmit — TypeScript 에러 확인
3. 에러 있으면 자동 수정 후 재확인
4. git add . → git commit → git push

## 완료 보고 형식
배포 직전에 수정한 내용 정리:
| 파일 | 변경 내용 |
|---|---|
| ... | ... |

커밋: `abc1234`
✅완료/⚠️주의/❌오류

## 자체 점검 규칙
- 작업 완료 후 변경된 기능 직접 테스트
- 로컬 서버에서 확인 후 push
- Railway/Vercel 배포 후 health check

---

# Claude Code 자체 점검 규칙
모든 작업 완료 후 반드시 아래 절차를 따를 것:

## 프론트엔드 작업 후 점검
1. 변경된 파일 목록 확인
2. GitHub 푸시 완료 여부 확인
   (git status로 untracked/modified 파일 없는지)
3. Vercel 자동 배포 트리거 확인
   (push 후 30초 대기)
4. 변경사항이 실제로 반영됐는지 확인:
   - CSS/스타일 변경: 해당 컴포넌트 코드 재확인
   - 새 파일 추가: import 경로 확인
   - 환경변수 사용: .env.local 에 있는지 확인
5. 결과 보고 형식:
   ✅ 완료 — 정상 반영
   ⚠️ 주의 — 확인 필요 사항
   ❌ 오류 — 발견된 문제

## 백엔드 작업 후 점검
1. GitHub 푸시 완료 확인
2. Railway 자동 배포 대기 (30초)
3. curl https://shalenu-backend-production.up.railway.app/health 확인
4. 변경된 엔드포인트 직접 호출 테스트
5. Railway 로그 ERROR 없는지 확인
6. 동일한 형식으로 보고

이 규칙은 매 작업마다 자동 적용됨.
별도 지시 없어도 항상 실행할 것.
```
</details>

<details><summary>docs/PRD.md</summary>

```markdown
# PRD — J-SheepFold

## 제품 개요
J-SheepFold 는 교회의 교인·헌금·재정·공동체·목양을 하나의 웹 플랫폼에서
운영할 수 있게 해주는 교회 통합 관리 SaaS 이다. 관리자와 목회자가
반복되는 행정 업무를 줄이고, 성도의 영적 여정과 재정 흐름을 한 곳에서
파악하도록 돕는 것이 목표다.

## 타겟 사용자
- 한국 국내 중·소형 교회 (교인 50~2000명 규모)
- 북미·남미 한인 교회
- 스페인어권 (히스패닉) 교회
- 실사용 주체: 담임목사, 사무간사, 재정부장, 순장/구역장

## 핵심 기능 (MVP 스코프)
1. **교인 관리**: 가족/세대 기반 교적부, 새가족 등록, 이명/제적
2. **헌금 관리**: 십일조·감사·건축 등 항목별 집계, 영수증 발행
3. **재정 관리**: 월·연간 결산, 예산 대비 집행, 지출 승인 흐름
4. **공동체 관리**: 구역·부서·소그룹 편성, 출석 체크
5. **목양 관리**: 심방 기록, 영적 여정 노트, 알림 스케줄
6. **AI 도우미**: 설교 요약, 교인 메모 기반 질의응답,
   주보/공지 초안 생성

## 다국어 정책
- 지원 언어: 한국어(ko), 영어(en), 스페인어(es)
- URL 세그먼트 기반 분기 (`/ko/...`, `/en/...`, `/es/...`)
- 사용자 선택은 쿠키에 기록하지만 라우팅의 단일 진실 소스는 URL
- 모든 UI 문자열은 i18n 번들을 통해 노출, 하드코딩 금지

## MVP 에서 제외한 항목
- **네이티브 모바일 앱** (iOS/Android): 반응형 웹으로 대체
- 오프라인 동기화, 푸시 알림 전용 앱 기능
- 회계 ERP 수준의 결산 (외부 회계 프로그램과의 연동만 고려)
- 교단별 복잡한 권한 트리 — 2단계(관리자/일반) 로 단순화

## 성공 지표 (초기)
- 첫 교회 1곳이 2주 내 데이터 이관까지 마치고 실사용에 진입
- 주간 활성 관리자(WAU) / 등록 관리자 ≥ 60%
- 헌금 입력 평균 소요시간 < 15초/건
```
</details>

<details><summary>docs/ARCHITECTURE.md</summary>

```markdown
# ARCHITECTURE — J-SheepFold

## 스택 요약
| 레이어 | 기술 |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python) + psycopg2 |
| Database | Railway PostgreSQL |
| 인증 | JWT (클라이언트에서 `localStorage.access_token` 보관) |
| 배포 | Vercel (FE) / Railway (BE) |

## 디렉토리 규약 (프론트엔드)
```
app/
  [lang]/                 # ko | en | es
    (app)/                # 인증 필요 영역
      dashboard/
      members/
      finance/
      ...
    (public)/             # 로그인·랜딩 등 비인증 영역
components/
lib/
  api/                    # fetch 래퍼 (토큰 자동 주입)
  i18n/
middleware.ts             # 언어·인증 분기
```

- **모든 페이지 경로는 `[lang]` 세그먼트로 감싼다.** 루트 접근 시
  `middleware.ts` 에서 기본 언어로 리다이렉트.
- 인증이 필요한 영역은 `(app)` 그룹 아래에 두고, 레이아웃에서
  토큰 유효성 확인.

## 인증
- 로그인 시 백엔드가 JWT 를 반환, 클라이언트는
  `localStorage.setItem('access_token', ...)` 로 저장.
- 모든 API 호출은 `lib/api` 래퍼를 통해 이루어지며, 래퍼가
  `Authorization: Bearer <token>` 헤더를 자동 주입한다.
- 401 응답 시 토큰을 제거하고 `/{lang}/login` 으로 리다이렉트.

## 백엔드 · DB 규약
- FastAPI 라우터는 `routers/<도메인>.py` 로 분리.
- DB 접근은 `psycopg2` 커넥션을 직접 사용하며, **SQLAlchemy 는
  도입하지 않는다**. 쿼리는 파라미터 바인딩(`%s`) 을 반드시 사용.
- 테이블명은 `shalenu_` 접두사를 유지 (예: `shalenu_members`,
  `shalenu_offerings`). 기존 데이터와의 호환을 위해 변경 금지.

## 멀티테넌시
- 모든 도메인 테이블은 `church_id` 컬럼을 가진다.
- **모든 SELECT / UPDATE / DELETE 쿼리에 `WHERE church_id = %s`
  조건이 반드시 포함되어야 한다.** 인증 미들웨어가 JWT 에서
  `church_id` 를 추출하여 의존성 주입으로 전달한다.
- 관리자 전용 크로스-테넌트 조회 (슈퍼 관리자) 는 별도 라우터
  (`routers/admin/`) 에만 존재하며, 권한 검사를 거친다.

## 데이터 흐름 (헌금 입력 예)
1. FE: `lib/api/offerings.create(payload)` 호출
2. 미들웨어/의존성: JWT 검증 → `church_id`, `user_id` 추출
3. 라우터: `psycopg2` 커넥션에서 `INSERT INTO shalenu_offerings
   (church_id, ...) VALUES (%s, ...)` 실행
4. 응답을 FE 에서 React Query 로 캐시 무효화 → UI 즉시 갱신
```
</details>

<details><summary>docs/ADR.md</summary>

```markdown
# ADR — J-SheepFold

의사결정 기록. 새 결정이 추가되면 ADR-### 로 번호를 부여한다.

---

## ADR-001: Supabase 에서 Railway PostgreSQL 로 이전
- **상태**: 채택
- **배경**: 초기에 Supabase 무료 티어를 사용했으나 프로젝트 슬롯이
  다른 사이드 프로젝트로 이미 소진된 상태. 새 프로젝트를 띄우려면
  유료 플랜이 필요했다.
- **결정**: DB 를 Railway PostgreSQL 로 이전한다. 백엔드도 동일
  Railway 프로젝트에 배포하여 프라이빗 네트워크로 연결.
- **영향**: Supabase Auth / Storage / Realtime 기능은 사용하지 않게
  되며, 인증은 자체 JWT 로, 스토리지는 추후 별도 선택.

## ADR-002: 언어 설정을 localStorage 토글에서 URL 기반으로 변경
- **상태**: 채택
- **배경**: 기존에는 `localStorage.lang` 을 읽어 클라이언트 측에서
  문자열을 스왑했는데, SEO / SSR / 공유 링크에서 언어가 보존되지
  않는 문제가 발생.
- **결정**: URL 세그먼트 `/ko/`, `/en/`, `/es/` 를 단일 진실 소스로
  삼는다. `middleware.ts` 가 쿠키 또는 `Accept-Language` 로부터
  기본 언어를 결정해 리다이렉트.
- **영향**: 모든 내부 링크는 `lang` prefix 를 포함해야 하며,
  `useLang()` 훅으로 현재 언어를 읽어 쓴다.

## ADR-003: ORM 없이 psycopg2 직접 사용
- **상태**: 채택
- **배경**: 팀 규모가 작고, SQL 을 직접 다루는 것이 가장 빠르다.
  SQLAlchemy 의 러닝 코스트와 마이그레이션 툴링 부담을 피하고 싶다.
- **결정**: 백엔드 DB 액세스는 `psycopg2` 커넥션으로 통일한다.
  스키마 변경은 `schema.sql` 및 `schema_phase*.sql` 파일에 기록.
- **영향**: 모든 쿼리는 파라미터 바인딩 `%s` 를 사용해야 한다.
  문자열 포매팅으로 값을 조립하는 코드는 리뷰에서 차단.

## ADR-004: DB 테이블명 `shalenu_` 접두사 유지
- **상태**: 채택
- **배경**: 초기 데이터가 `shalenu_` 접두사 테이블에 저장되어
  있으며, 운영 중인 교회 데이터가 존재. 접두사를 바꾸면 대규모
  마이그레이션이 필요.
- **결정**: 모든 도메인 테이블은 `shalenu_` 접두사를 유지한다.
  새 테이블도 같은 규칙을 따른다.
- **영향**: 코드/문서/SQL 어디에서도 접두사 변경은 금지.
  "브랜드명이 바뀌어도 테이블명은 바뀌지 않는다" 를 원칙으로 한다.
```
</details>

<details><summary>docs/UI_GUIDE.md</summary>

```markdown
# UI GUIDE — J-SheepFold

## 톤 & 무드
- 라이트 모드 기반의 기독교 감성.
- 포인트 컬러는 **금색 `#c9a84c`** — 버튼, 강조 아이콘, 구분선에 사용.
- 본문 텍스트는 `#1a1a1a`, 보조 텍스트는 `#555555`.
- 카드 배경은 `rgba(255, 255, 255, 0.90)` 로 살짝 반투명.
- 배경 이미지 `public/shepherd-bg.png` 를 허용한다. (양·목자 일러스트)

## 허용
- 금색 + 오프화이트 기반 배색
- 얇은 금색 구분선 (1px, `#c9a84c` 40% 투명도)
- 본문 serif 조합 (예: Noto Serif KR) + 버튼은 sans-serif

## 금지
- **Glass morphism** (backdrop-filter blur, 반투명 유리 효과) — 과거
  시안에서 가독성 이슈로 제거되었다.
- **Gradient text** (페이지 제목에 그라디언트 적용) — 특히 보라/인디고
  계열 그라디언트는 전부 제거됨.
- **보라 / 인디고 브랜드 컬러** (`#6366f1`, `#8b5cf6` 등) — 초기 버전의
  잔재이며 더 이상 쓰지 않는다. 기존 파일에서 발견되면 금색 또는
  중립 그레이로 대체.
- 페이지 내 강한 네온/형광 색상.

## 컬러 레퍼런스
| 역할 | HEX |
|---|---|
| Primary (금색) | `#c9a84c` |
| Text | `#1a1a1a` |
| Text Muted | `#555555` |
| Card BG | `rgba(255,255,255,0.90)` |
| Page BG | `#fafaf7` (또는 `shepherd-bg.png`) |
| Divider | `rgba(201,168,76,0.4)` |

## 컴포넌트 원칙
- 버튼: 기본은 금색 배경 + 흰 글씨, 보조는 금색 테두리 + 금색 글씨.
- 카드: 라운드 `rounded-2xl`, 섀도우는 `shadow-sm` 수준까지만.
- 폼 입력: 테두리 `#d5cdbb`, 포커스 시 금색 링.
- 모달: 흰 카드 + 딤 처리된 검정 백드롭 (블러 없음).

## style.css 주의
- `style.css` 내 `.reveal` 관련 섹션은 프레젠테이션 (설교/주보 리뷰용)
  슬라이드 스타일이다. **수정 금지.** 이 섹션을 고치면 설교 뷰어가
  깨진다. 새 스타일은 반드시 다른 클래스 이름을 사용할 것.
```
</details>


## 작업 메모

- (여기에 단계 A 계획을 채운다)