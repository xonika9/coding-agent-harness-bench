---
type: Playbook
title: Личный тест-стенд харнессов кодинг-агентов (7 связок × 4 тяжёлые задачи)
description: Как устроен стенд, где лежат актуальные данные (metrics-710.json), какими headless-командами гонялись 56 прогонов и что из старого дизайна выкинуто
tags: [coding-agents, benchmark, codex, opencode, oh-my-pi, personal-eval]
timestamp: 2026-07-16
---

# Личный тест-стенд харнессов

Не бенчмарк. Личная история: «что лучше именно мне на моём стеке». Итог и все графики —
[report.html](report.html) (v4.1). Durable-выводы вынесены в досье
`~/Documents/projects/agent-for-common-questions/docs/research/2026-07-09-coding-agent-workflow/harness-cost-benchmark.md`.

**Главный вывод:** корректность не разделяет вообще (56/56 PASS), а цену задаёт **обвязка,
а не модель** — одна и та же `gpt-5.6-sol medium` стоит $3,77 в Codex, $5,28 в opencode и
$23,06 в omp за 8 прогонов (6,1×). Время — та же ось, что цена (ранги совпали, r = 0,986).

## Актуальный дизайн (v4.1, 2026-07-16)

**7 связок × 4 задачи × 2 прогона = 56 headless-прогонов.**

| ключ | харнесс | модель | effort |
|---|---|---|---|
| `codex56` | Codex CLI | gpt-5.6-sol | medium |
| `codex55` | Codex CLI | gpt-5.5 | high |
| `oc56` | opencode 1.17.17 | gpt-5.6-sol | medium |
| `oc55` | opencode 1.17.17 | gpt-5.5 | high |
| `omp56` | omp (oh-my-pi) 16.5.2 | gpt-5.6-sol | medium |
| `omp55` | omp (oh-my-pi) 16.5.2 | gpt-5.5 | high |
| `ccopus` | нативный Claude Code | opus-4.8 | xhigh |

Ключевой срез — **одна модель, разные харнессы** (`codex56 ↔ oc56 ↔ omp56`): всё, что
остаётся в разнице, — эффект обвязки. **Эффорты не выровнены** намеренно: это «мои реальные
конфиги», а не «модели при равном усилии».

Четыре авторские тяжёлые creation-задачи со строгим **скрытым** оракулом:

| | стек | что строим | тестов (видимых + скрытых) |
|---|---|---|---|
| `t7-ts-formula` | TS | движок формул таблицы: токенайзер, парсер приоритетов, функции, таксономия ошибок | 61 + 44 |
| `t8-py-query` | Python | движок запросов: filter→sort→distinct→paginate→project, строгая семантика типов | 29 + 22 |
| `t9-ts-vm` | TS | интерпретатор стековой VM: метки, переходы, переменные, лимит шагов | 33 + 35 |
| `t10-py-cron` | Python | вычислитель cron-расписаний: поля, шаги, имена, правило DOM/DOW | 20 + 22 |

Дисциплина оракула: эталон (`solution/`) обязан проходить и видимый, и скрытый слой;
«ленивая» реализация обязана падать на скрытом. Агенту `solution/` и `heldout/` не даются.

## Где брать данные

- **`report-data/metrics-710.json` — единственный актуальный датасет.** 56 ячеек
  `<task>|<r1|r2>|<col>` с полями `grade`, `cost` ($ API-эквивалент), `out_tok`,
  `wall_sec`, `wall_src`; плюс `totals` по связкам и `_wall_note` про ограничения замера.
- **`report.html`** — отчёт v4.1 поверх этого датасета.
- **`runs/<task>/<r1|r2>/<col>/`** — рабочие каталоги прогонов: то, что агенты реально
  написали, с `baseline`-коммитом в каждом (`git diff baseline` = чистый дифф решения).

**Не использовать (устарело, конфликтует):**

- `report-data/hard-metrics.json` — помечен `_SUPERSEDED_BY`: цифры codex загрязнены MCP.
- `report-data/metrics.json`, `aggregates.json`, `chartdata.json`, `blind-*.{json,md}`,
  `scorecard.md`, `results/` — эпоха 6 лёгких задач и колонки `ccx`. Лёгкие задачи выкинуты
  (у всех 100%, разделения нет), `ccx` выкинут (дорого, вывод уже получен).
- [RUNBOOK.md](RUNBOOK.md) — инструкция для ручных прогонов старого дизайна, историческая.
- `scripts/` — раннеры старого дизайна (4 колонки с `ccx`, 6 задач). Для t7–t10 не
  использовались; грейдеры задач (`tasks/*/grade.sh`) актуальны.

## Как гонялось (headless, без единого вопроса к человеку)

Батч-раннеры t7–t10 жили в scratchpad сессии и вычистились из `/private/tmp`. Сами вызовы —
вот они; это всё, что нужно для воспроизведения:

```bash
# Codex — ОБЯЗАТЕЛЬНО через чистый CODEX_HOME (см. «Грабли» ниже)
CODEX_HOME="$CLEAN" codex exec --sandbox workspace-write -c approval_policy="never" \
  -m <model> -c model_reasoning_effort=<effort> -C "$WD" "$PROMPT" < /dev/null

# нативный Claude Code
claude -p "$PROMPT" --model claude-opus-4-8 --effort xhigh \
  --allowedTools "Bash,Edit,Write,Read,Glob,Grep" --output-format json

# opencode: --pure = без плагинов/MCP, --auto = автоапрув, --variant = эфорт
opencode run --pure --auto -m openai/<model> --variant <effort> --format json --dir "$WD" "$PROMPT"

# omp (oh-my-pi): провайдер openai-codex — тот, что ходит по oauth и отдаёт цену
omp -p --model openai-codex/<model> --thinking <effort> --mode json \
  --no-lsp --no-session --cwd "$WD" "$PROMPT"
```

Грейдинг zero-install: TS — `node --test 'test/**/*.test.ts'` + `tsc --noEmit`;
Python — `python3 -m unittest discover -s test -t .`. Скрытые тесты подкладываются только
на грейдинге; правки тестов запрещены и ловятся `git diff baseline -- test/`.

## Как считается цена

Все связки на подписках, реального пофичного счёта нет — это «сколько стоило бы на API»
по единому тарифу. GPT-5.5/5.6-sol: input $5/M, cache-read $0,5/M, cache-write $5/M,
output $30/M. Opus: $5/$25 (+кэш).

```
cost = ((input − cached_input)*5 + cached_input*0.5 + output*30) / 1e6
```

Источники счётчиков: Codex — `ccusage-codex session --json` (матчить по пути рабочего
каталога в `$CODEX_HOME/sessions`), **цену пересчитывать из токенов самому**; ccopus —
`total_cost_usd` из `claude --output-format json`; opencode — сумма `step_finish.tokens`
(его собственная `cost` под oauth = 0); omp — сумма `usage.cost.total` **с дедупом по
`responseId`**.

## Грабли (проверено на своей шкуре)

- **`-c mcp_servers='{}'` НЕ отключает MCP** из глобального `~/.codex/config.toml`. Flaky
  `exa` MCP висел и раздувал codex-сессии в 2–6× — это дало ложный вывод «codex56 дико
  прыгает по цене». Единственный рабочий фикс: отдельный `CODEX_HOME` (симлинк `auth.json`
  + минимальный `config.toml` без `mcp_servers`), проверить по строке
  «No MCP servers configured yet».
- **`ccusage-codex` иногда отдаёт fallback-цену** (одна и та же сессия: $0,4479 и $0,125).
  Ловится независимым пересчётом из токенов.
- **omp тройной счёт цены**: usage повторяется в `message_end` / `turn_end` / `agent_end`.
  Без дедупа по `responseId` получается $8,84 вместо $2,95.
- **Node strip-only TS** (грейдер гоняет `.ts` нативно): нельзя `enum`, parameter properties
  (`constructor(private x)`), `namespace`. Строгий `assert.deepEqual` отличает `-0` от `+0`.

## Честные ограничения

Выборка 4×2 на связку — **индикативно, не доказательно**: доверять кратным разрывам, не
микро-дельтам. Прогоны шли параллельно (−P4/−P6), поэтому абсолютные секунды несут шум
конкуренции; ранги устойчивы. 8 codex-ячеек по t7/t8 имеют `wall_src: proxy` —
восстановленная нижняя оценка (занижает на 30–60 с). Эфорты не выровнены.

## Раскладка

```
tasks/t7..t10/  fixture/ (старт, со spec.md) · solution/ (эталон, агенту не даётся)
                heldout/ (скрытые тесты) · PROMPT.md · grade.sh
report-data/    metrics-710.json (АКТУАЛЬНО) · остальное — история
runs/           рабочие каталоги прогонов, в каждом baseline-коммит
report.html     отчёт v4.1
```
