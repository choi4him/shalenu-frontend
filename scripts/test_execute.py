#!/usr/bin/env python3
"""scripts/execute.py 의 순수 함수 / 클래스 단위 테스트.

네트워크나 git 상태를 건드리지 않도록, subprocess.run 을 가짜로
대체한 뒤 HarnessExecutor 의 로직 흐름만 검증한다. 표준
라이브러리 unittest 로 돌며 별도 의존성이 없다::

    python scripts/test_execute.py
"""
from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import execute  # noqa: E402  (경로 조정 후 임포트)


class SlugifyTests(unittest.TestCase):
    def test_korean_to_kebab(self) -> None:
        slug = execute.slugify("헌금 영수증 PDF 다운로드 추가")
        self.assertEqual(slug, "헌금-영수증-pdf-다운로드-추가")

    def test_english(self) -> None:
        slug = execute.slugify("Add Offering Receipt PDF download")
        self.assertEqual(slug, "add-offering-receipt-pdf-download")

    def test_max_words(self) -> None:
        slug = execute.slugify("a b c d e f g h i j k l", max_words=3)
        self.assertEqual(slug, "a-b-c")

    def test_empty_falls_back(self) -> None:
        self.assertEqual(execute.slugify("   !!!   "), "task")


class ExecutorFieldsTests(unittest.TestCase):
    def test_paths_derived_from_slug(self) -> None:
        e = execute.HarnessExecutor("헌금 영수증 PDF 다운로드 추가")
        self.assertEqual(e.slug, "헌금-영수증-pdf-다운로드-추가")
        self.assertEqual(e.branch, "feat/헌금-영수증-pdf-다운로드-추가")
        self.assertTrue(
            str(e.phase_dir).endswith(
                os.path.join("phases", "헌금-영수증-pdf-다운로드-추가")
            )
        )

    def test_phase_dir_created(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            with mock.patch.object(execute, "ROOT", tmp_path):
                e = execute.HarnessExecutor("demo task")
                # __post_init__ 는 ROOT 스냅샷을 쓰므로 경로를 재세팅
                e.phase_dir = tmp_path / "phases" / e.slug
                e.plan_path = e.phase_dir / "01_plan.md"
                e.prepare_phase_dir()
                self.assertTrue(e.phase_dir.is_dir())


class InjectGuardrailsTests(unittest.TestCase):
    def test_missing_docs_are_flagged(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            claude_md = tmp_path / "CLAUDE.md"
            claude_md.write_text("# CLAUDE\n- rule", encoding="utf-8")
            with mock.patch.object(execute, "ROOT", tmp_path), \
                 mock.patch.object(
                     execute,
                     "GUARDRAIL_DOCS",
                     [claude_md, tmp_path / "docs" / "PRD.md"],
                 ):
                e = execute.HarnessExecutor("demo")
                e.phase_dir = tmp_path / "phases" / e.slug
                e.plan_path = e.phase_dir / "01_plan.md"
                e.prepare_phase_dir()
                e.inject_guardrails()
                content = e.plan_path.read_text(encoding="utf-8")
                self.assertIn("CLAUDE.md", content)
                self.assertIn("⚠️ missing", content)
                self.assertIn("docs/PRD.md", content)


class VerifyLoopTests(unittest.TestCase):
    def test_succeeds_on_first_attempt(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            with mock.patch.object(execute, "ROOT", tmp_path):
                e = execute.HarnessExecutor(
                    "demo task",
                    verify_cmds=("echo ok",),
                )
                e.phase_dir = tmp_path / "phases" / e.slug
                e.log_path = e.phase_dir / "03_verify.log"
                e.prepare_phase_dir()
                fake = SimpleNamespace(returncode=0, stdout="ok\n", stderr="")
                with mock.patch.object(execute, "run", return_value=fake) as r:
                    self.assertTrue(e.run_verify())
                self.assertEqual(r.call_count, 1)

    def test_retries_then_gives_up(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            with mock.patch.object(execute, "ROOT", tmp_path):
                e = execute.HarnessExecutor(
                    "demo task",
                    verify_cmds=("echo fail",),
                )
                e.phase_dir = tmp_path / "phases" / e.slug
                e.log_path = e.phase_dir / "03_verify.log"
                e.prepare_phase_dir()
                fake = SimpleNamespace(returncode=1, stdout="", stderr="boom")
                attempts: list[int] = []

                def on_fail(i: int, _log: str) -> None:
                    attempts.append(i)

                with mock.patch.object(execute, "run", return_value=fake):
                    self.assertFalse(e.run_verify(on_failure=on_fail))

                self.assertEqual(attempts, [1, 2, 3])
                # 로그 파일이 기록되어야 한다.
                self.assertTrue(e.log_path.exists())
                self.assertIn("boom", e.log_path.read_text(encoding="utf-8"))


class BranchHelpersTests(unittest.TestCase):
    def test_branch_exists_delegates_to_run(self) -> None:
        ok = subprocess.CompletedProcess(args=[], returncode=0)
        miss = subprocess.CompletedProcess(args=[], returncode=128)
        with mock.patch.object(execute, "run", return_value=ok):
            self.assertTrue(execute.branch_exists("feat/foo"))
        with mock.patch.object(execute, "run", return_value=miss):
            self.assertFalse(execute.branch_exists("feat/foo"))


if __name__ == "__main__":
    unittest.main()
