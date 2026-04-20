#!/usr/bin/env python3
"""PreToolUse guard — harness Bash 명령 차단기.

Claude Code 가 Bash 도구를 호출하기 직전에 hook 으로 실행되며,
위험 명령이 섞여 있으면 exit code 2 로 차단한다. stdin 으로
tool_input JSON 이 들어온다.
"""
from __future__ import annotations

import json
import re
import sys

BLOCKED_PATTERNS: list[tuple[str, str]] = [
    (r"rm\s+-rf\b", "rm -rf 사용 금지"),
    (r"git\s+push\s+(?:-{1,2}\S+\s+)*--force\b", "git push --force 금지"),
    (r"git\s+push\s+(?:-{1,2}\S+\s+)*-f\b", "git push -f 금지"),
    (r"git\s+reset\s+--hard\b", "git reset --hard 금지"),
    (r"\bDROP\s+TABLE\b", "DROP TABLE 금지"),
    (r"\bTRUNCATE\b", "TRUNCATE 금지"),
]


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    command = (payload.get("tool_input") or {}).get("command") or ""
    for pattern, reason in BLOCKED_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            sys.stderr.write(
                f"Blocked by harness PreToolUse: {reason}\n"
                f"Command: {command}\n"
            )
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
