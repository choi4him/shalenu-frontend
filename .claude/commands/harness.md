---
name: harness
description: J-SheepFold harness 워크플로우 — 계획 수립부터 자가 교정, 2단계 커밋, GitHub 푸시까지 일관된 흐름으로 작업을 진행한다.
---

# /harness

사용자의 한 문장짜리 지시를 안전하게 실행 가능한 변경 세트로 바꿔주는
워크플로우다. 아래 A~E 단계를 **순서대로** 따른다. 어떤 단계도
건너뛰지 않는다.

## 입력
`$ARGUMENTS` — 사용자가 준 작업 설명 (예: "헌금 영수증 PDF 다운로드 추가").

---

## 단계 A — 계획 (Plan)

1. `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/ADR.md`,
   `docs/UI_GUIDE.md`, `CLAUDE.md` 를 모두 읽는다.
2. 작업 설명을 기반으로 **태스크 슬러그** 를 만든다.
   - 형식: 영어 kebab-case, 10단어 이내
   - 예: `헌금 영수증 PDF 다운로드 추가` → `offering-receipt-pdf`
3. 현재 저장소 상태를 확인한다 (`git status`, `git log -5`).
4. 변경 대상 파일과 예상 리스크를 2~5 bullet 로 정리하여 사용자에게
   보고한다. 불확실한 점이 있으면 한 번만 질문.

## 단계 B — 환경 세팅

1. 브랜치를 만든다: `git checkout -b feat/<slug>` (이미 있으면 재사용).
2. `scripts/execute.py` 의 `HarnessExecutor` 가 관리하는
   `phases/<slug>/` 디렉토리를 생성하고 단계별 산출물을 기록한다.
   - `phases/<slug>/01_plan.md`
   - `phases/<slug>/02_diff.patch`
   - `phases/<slug>/03_verify.log`
3. 가드레일 주입: 구현 단계 전에 다음 문서를 컨텍스트에 다시 로드.
   - `CLAUDE.md`
   - `docs/PRD.md`, `docs/ARCHITECTURE.md`,
     `docs/ADR.md`, `docs/UI_GUIDE.md`

## 단계 C — 구현 (Implement)

1. 계획에 있는 파일만 건드린다. 계획 외 변경이 필요해지면 단계 A 로
   돌아가 계획을 갱신한 뒤 진행.
2. 코드 작성 시 다음 규칙을 지킨다.
   - 모든 DB 쿼리는 `church_id` 조건과 `%s` 파라미터 바인딩.
   - `shalenu_` 테이블 접두사 유지.
   - UI 는 `docs/UI_GUIDE.md` 의 허용/금지 규칙을 따름.
   - 하드코딩 문자열 대신 i18n 번들 사용 (ko/en/es).
3. 변경 diff 를 `phases/<slug>/02_diff.patch` 에 저장.

## 단계 D — 검증 + 자가 교정

1. 프론트엔드 작업이면:
   ```
   npm run build
   npx tsc --noEmit
   ```
   둘 다 성공해야 한다.
2. 백엔드 작업이면:
   ```
   python -m pyflakes .
   python -m pytest -q (테스트가 있다면)
   ```
3. 실패 시 **최대 3회** 자동 재시도. 매 시도마다 원인·수정 내용을
   `phases/<slug>/03_verify.log` 에 append.
4. 3회 후에도 실패하면 진행 중단 → 사용자에게 구체적 에러와 함께
   보고.

## 단계 E — 커밋 & 배포 보고

1. **2단계 커밋** 으로 나눠서 생성한다.
   - 1차 `feat: <slug> — <한 줄 요약>`
     실제 기능/버그 변경만 포함.
   - 2차 `chore(harness): phases/<slug> artifacts`
     `phases/` 하위 산출물·가드레일 업데이트만 포함.
2. 원격 푸시: `git push -u origin feat/<slug>`.
3. Vercel(FE) / Railway(BE) 자동 배포 트리거를 30초 기다린 뒤
   health check.
4. 다음 형식으로 보고:

   ```
   | 파일 | 변경 내용 |
   |---|---|
   | ... | ... |

   커밋: feat `<sha1>` / chore `<sha2>`
   브랜치: feat/<slug>
   배포: ✅ 완료 / ⚠️ 주의 / ❌ 오류
   비고: ...
   ```

## 중단 규칙
- 사용자가 명시적으로 허가하지 않은 `rm -rf`, 강제 푸시,
  `git reset --hard`, `DROP TABLE`, `TRUNCATE` 등은 절대 실행하지
  않는다. PreToolUse 훅이 1차 방어선이지만, 본 워크플로우에서도
  요청되면 거절하고 대안을 제시.
