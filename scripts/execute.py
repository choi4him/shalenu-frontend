#!/usr/bin/env python3
"""HarnessExecutor — J-SheepFold harness 워크플로우 실행기.

사용 예::

    python scripts/execute.py "헌금 영수증 PDF 다운로드 추가"

동작 단계:
    1. 태스크 슬러그 생성
    2. feat/<slug> 브랜치 준비
    3. phases/<slug>/ 산출물 디렉토리 준비
    4. 가드레일 문서 로드 (CLAUDE.md + docs/*.md) → 01_plan.md 에 주입
    5. 검증 명령(run_verify) 실행, 실패 시 최대 3회 자가 교정 루프
    6. 2단계 커밋 (feat: + chore(harness): …) 후 푸시

이 파일은 Harness 를 스크립트로도 돌릴 수 있도록 해주는 참조 구현
이다. Claude Code 에이전트가 `/harness` 커맨드로 같은 흐름을 수동
수행할 수 있지만, CI 나 비대화형 재현에는 이 executor 를 쓴다.
"""
from __future__ import annotations

import argparse
import dataclasses
import datetime as dt
import re
import shlex
import subprocess
import sys
import unicodedata
from pathlib import Path
from typing import Callable, Iterable

ROOT = Path(__file__).resolve().parent.parent
GUARDRAIL_DOCS = [
    ROOT / "CLAUDE.md",
    ROOT / "docs" / "PRD.md",
    ROOT / "docs" / "ARCHITECTURE.md",
    ROOT / "docs" / "ADR.md",
    ROOT / "docs" / "UI_GUIDE.md",
]
MAX_RETRIES = 3


# ---------------------------------------------------------------------------
# 유틸리티
# ---------------------------------------------------------------------------


def slugify(text: str, max_words: int = 10) -> str:
    """한글·영문 혼합 설명을 kebab-case 슬러그로 바꾼다."""
    text = unicodedata.normalize("NFKC", text).strip().lower()
    text = re.sub(r"[^0-9a-z가-힣\s-]+", " ", text)
    words = [w for w in re.split(r"\s+", text) if w]
    words = words[:max_words]
    slug = "-".join(words).strip("-")
    return slug or "task"


def run(
    cmd: str | list[str],
    *,
    check: bool = True,
    capture: bool = False,
) -> subprocess.CompletedProcess[str]:
    if isinstance(cmd, str):
        args = shlex.split(cmd)
    else:
        args = list(cmd)
    return subprocess.run(
        args,
        cwd=ROOT,
        check=check,
        text=True,
        capture_output=capture,
    )


def branch_exists(name: str) -> bool:
    result = run(
        ["git", "rev-parse", "--verify", name],
        check=False,
        capture=True,
    )
    return result.returncode == 0


# ---------------------------------------------------------------------------
# 실행기
# ---------------------------------------------------------------------------


@dataclasses.dataclass
class HarnessExecutor:
    task: str
    verify_cmds: tuple[str, ...] = ("npm run build", "npx tsc --noEmit")
    push: bool = True

    def __post_init__(self) -> None:
        self.slug = slugify(self.task)
        self.branch = f"feat/{self.slug}"
        self.phase_dir = ROOT / "phases" / self.slug
        self.plan_path = self.phase_dir / "01_plan.md"
        self.diff_path = self.phase_dir / "02_diff.patch"
        self.log_path = self.phase_dir / "03_verify.log"

    # -- 단계 B --------------------------------------------------------------

    def prepare_branch(self) -> None:
        if branch_exists(self.branch):
            run(["git", "checkout", self.branch])
        else:
            run(["git", "checkout", "-b", self.branch])

    def prepare_phase_dir(self) -> None:
        self.phase_dir.mkdir(parents=True, exist_ok=True)

    def inject_guardrails(self) -> None:
        """가드레일 문서를 모아 01_plan.md 의 상단에 기록."""
        now = dt.datetime.now().isoformat(timespec="seconds")
        sections: list[str] = [
            f"# Plan — {self.task}",
            "",
            f"- slug: `{self.slug}`",
            f"- branch: `{self.branch}`",
            f"- generated: {now}",
            "",
            "## Guardrails",
            "",
        ]
        for doc in GUARDRAIL_DOCS:
            rel = doc.relative_to(ROOT)
            if doc.exists():
                sections.append(f"<details><summary>{rel}</summary>\n")
                sections.append("```markdown")
                sections.append(doc.read_text(encoding="utf-8").rstrip())
                sections.append("```")
                sections.append("</details>")
                sections.append("")
            else:
                sections.append(f"- ⚠️ missing: `{rel}`")
        sections.append("")
        sections.append("## 작업 메모")
        sections.append("")
        sections.append("- (여기에 단계 A 계획을 채운다)")
        self.plan_path.write_text("\n".join(sections), encoding="utf-8")

    # -- 단계 D --------------------------------------------------------------

    def run_verify(
        self,
        *,
        on_failure: Callable[[int, str], None] | None = None,
    ) -> bool:
        """검증 명령을 순서대로 실행, 실패 시 최대 3회 재시도 루프."""
        attempt_logs: list[str] = []
        for attempt in range(1, MAX_RETRIES + 1):
            failure_output: list[str] = []
            ok = True
            for cmd in self.verify_cmds:
                header = f"\n$ {cmd}  (attempt {attempt})"
                result = run(cmd, check=False, capture=True)
                failure_output.append(header)
                failure_output.append(result.stdout or "")
                failure_output.append(result.stderr or "")
                if result.returncode != 0:
                    ok = False
                    break
            attempt_logs.append("\n".join(failure_output))
            if ok:
                self._append_log(attempt_logs)
                return True
            if on_failure is not None:
                on_failure(attempt, attempt_logs[-1])
        self._append_log(attempt_logs)
        return False

    def _append_log(self, chunks: Iterable[str]) -> None:
        with self.log_path.open("a", encoding="utf-8") as fp:
            for chunk in chunks:
                fp.write(chunk.rstrip() + "\n")

    # -- 단계 C 보조 ----------------------------------------------------------

    def capture_diff(self) -> None:
        result = run(
            ["git", "diff", "HEAD"],
            check=False,
            capture=True,
        )
        self.diff_path.write_text(result.stdout or "", encoding="utf-8")

    # -- 단계 E --------------------------------------------------------------

    def commit_and_push(self, summary: str) -> tuple[str, str]:
        """2단계 커밋: feat(기능) + chore(harness 산출물)."""
        # 1) 기능 변경 스테이징 — phases/ 제외.
        run(["git", "add", "--all", ":(exclude)phases"])
        feat_sha = self._commit(f"feat: {self.slug} — {summary}")

        # 2) harness 산출물만 스테이징.
        run(["git", "add", "phases"])
        chore_sha = self._commit(
            f"chore(harness): phases/{self.slug} artifacts"
        )

        if self.push:
            run(["git", "push", "-u", "origin", self.branch])
        return feat_sha, chore_sha

    def _commit(self, message: str) -> str:
        staged = run(
            ["git", "diff", "--cached", "--name-only"],
            check=False,
            capture=True,
        ).stdout.strip()
        if not staged:
            return ""
        run(["git", "commit", "-m", message])
        sha = run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture=True,
        ).stdout.strip()
        return sha

    # -- 오케스트레이션 -------------------------------------------------------

    def run_all(self, summary: str) -> int:
        self.prepare_branch()
        self.prepare_phase_dir()
        self.inject_guardrails()

        # 이 스크립트는 실제 코드 변경 자체는 수행하지 않는다.
        # Claude Code 에이전트가 단계 C 를 수행한 뒤 본 executor 를
        # 불러 단계 D~E 만 돌리는 것을 권장한다.
        self.capture_diff()

        verified = self.run_verify()
        if not verified:
            sys.stderr.write(
                "❌ 자가 교정 3회 모두 실패 — 커밋/푸시를 중단합니다.\n"
                f"   로그: {self.log_path}\n"
            )
            return 1

        feat_sha, chore_sha = self.commit_and_push(summary)
        sys.stdout.write(
            "\n".join(
                [
                    "",
                    "✅ 완료",
                    f"  브랜치 : {self.branch}",
                    f"  커밋   : feat {feat_sha or '(skipped)'}"
                    f" / chore {chore_sha or '(skipped)'}",
                    f"  산출물 : {self.phase_dir.relative_to(ROOT)}",
                    "",
                ]
            )
        )
        return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="J-SheepFold harness executor")
    parser.add_argument("task", help="한 줄 작업 설명")
    parser.add_argument(
        "--summary",
        default="",
        help="feat 커밋 메시지에 들어갈 한 줄 요약 (기본: task)",
    )
    parser.add_argument(
        "--no-push",
        action="store_true",
        help="원격 푸시를 건너뛴다 (로컬 검증용)",
    )
    parser.add_argument(
        "--verify",
        action="append",
        default=None,
        help="검증 명령 덮어쓰기. 여러 번 지정 가능.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_arg_parser().parse_args(argv)
    verify = tuple(args.verify) if args.verify else (
        "npm run build",
        "npx tsc --noEmit",
    )
    executor = HarnessExecutor(
        task=args.task,
        verify_cmds=verify,
        push=not args.no_push,
    )
    summary = args.summary or args.task
    return executor.run_all(summary)


if __name__ == "__main__":
    raise SystemExit(main())
