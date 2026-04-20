---
name: review
description: 현재 브랜치의 변경 사항을 harness 가드레일(ARCHITECTURE / ADR / UI_GUIDE / CLAUDE.md)에 비추어 점검하고 위반 사항을 보고한다.
---

# /review

브랜치의 pending 변경을 리뷰한다. 변경을 **수정하지 않는다** — 오직
진단과 권고만 수행한다.

## 수행 절차

1. `git status`, `git diff origin/main...HEAD`, `git log main..HEAD`
   를 확인하여 변경 범위를 파악한다.
2. 다음 문서를 읽고 체크리스트로 만든다.
   - `CLAUDE.md`
   - `docs/ARCHITECTURE.md`
   - `docs/ADR.md`
   - `docs/UI_GUIDE.md`
3. 각 변경 파일을 순서대로 훑으며 위반/의심 사항을 수집한다.

## 체크리스트 (필수)

### 멀티테넌시 / DB
- [ ] 새로 추가된 SELECT/UPDATE/DELETE 에 `church_id` 조건이 있는가?
- [ ] `%s` 파라미터 바인딩을 사용하고 문자열 포매팅이 없는가?
- [ ] `shalenu_` 테이블 접두사가 유지되는가?
- [ ] SQLAlchemy 같은 ORM 이 새로 도입되지 않았는가?

### 프론트엔드 / UI
- [ ] 페이지 경로가 `[lang]` 세그먼트 아래 있는가?
- [ ] 하드코딩 문자열 대신 i18n 번들을 사용했는가?
- [ ] glass morphism / gradient-text 가 추가되지 않았는가?
- [ ] 보라/인디고 브랜드 색이 들어오지 않았는가?
- [ ] `style.css` 의 `.reveal` 섹션을 수정하지 않았는가?

### 인증 / 보안
- [ ] 토큰 저장/삭제가 `localStorage.access_token` 규약을 따르는가?
- [ ] 401 응답 시 리다이렉트 로직이 있는가?
- [ ] 비밀값이 코드에 하드코딩되지 않았는가?

### 일반
- [ ] 계획 외 대규모 리팩토링이 섞여 있지 않은가?
- [ ] 테스트 또는 수동 검증 흔적이 있는가?
- [ ] `phases/<slug>/` 산출물이 존재하는가? (harness 로 만든 변경일 때)

## 출력 형식

```
# Review — <브랜치명>

## 요약
- 변경 파일 수: N
- 심각도별: 🔴 X / 🟡 Y / 🟢 Z

## 발견 사항
### 🔴 차단 (머지 금지)
- <파일:line> — <문제> (근거: ADR-003 등)

### 🟡 주의 (수정 권장)
- ...

### 🟢 정보
- ...

## 권고
- <다음 단계 제안 1~3개>
```

발견 사항이 없으면 "가드레일 위반 없음" 으로 명시하고 초록 체크만
남긴다.
