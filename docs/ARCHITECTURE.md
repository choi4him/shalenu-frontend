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
