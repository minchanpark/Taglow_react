# Taglow Skills Agent Guide

이 디렉토리는 프로젝트 전용 Codex skills를 보관한다.

## Responsibilities

- 각 skill은 독립적인 `SKILL.md`와 `agents/openai.yaml`을 가진다.
- skill 본문은 PRD/TDD/AGENTS 원문을 복사하지 않고, 필요한 파일과 섹션을 읽도록 안내한다.
- 새 작업 유형이 반복되면 `taglow-*` 이름으로 skill을 추가한다.

## Guardrails

- skill frontmatter에는 `name`과 `description`만 둔다.
- skill 이름은 lowercase hyphen-case를 사용한다.
- 큰 reference를 만들기보다 우선 `dev/Taglow_React_PRD.md`, `dev/Taglow_React_TDD.md`, `AGENTS.md`를 참조한다.
- skill 수정 후 `quick_validate.py`로 검증한다.
