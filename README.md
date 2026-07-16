# Coding agent harness bench

Личный воспроизводимый тест стоимости кодинг-агентов на четырёх задачах из Python и
TypeScript. Это не универсальный бенчмарк и не рейтинг продуктов: стенд отвечает на вопрос,
как семь конкретных связок `harness × model × effort` отработали на моём стеке 16 июля
2026 года.

## Результат

56 headless-прогонов: 7 связок × 4 задачи × 2 реплики. Все завершились `PASS` на видимых
и скрытых тестах.

Главный контролируемый срез использует одну модель и effort:

| harness | model | effort | оценка за 8 прогонов | wall time |
|---|---|---|---:|---:|
| Codex | `gpt-5.6-sol` | `medium` | $3,77 | 19,1 мин |
| opencode | `gpt-5.6-sol` | `medium` | $5,28 | 26,8 мин |
| omp | `gpt-5.6-sol` | `medium` | $23,06 | 84,5 мин |

Зафиксированный датасет даёт разброс 6,11× между omp и Codex. Известный недосчёт
cache-write в дешёвых колонках снижает отношение до 5,38× в консервативном худшем
случае. Точный пересчёт невозможен: первичные cache-write tokens не сохранились. Поэтому
6,1× следует читать как верхнюю оценку, 5,4× как нижнюю границу. Разрыв остаётся кратным.

Полный интерактивный отчёт: [report.html](report.html). Единственный актуальный датасет:
[report-data/metrics-710.json](report-data/metrics-710.json).

## Что лежит в репозитории

```text
tasks/t7..t10/
  PROMPT.md       задание агенту
  fixture/        стартовый рабочий каталог
  heldout/        скрытые тесты для локального grader
  grade.sh        проверка результата
report-data/
  metrics-710.json
report.html
ENVIRONMENT.md
```

Эталонные решения и каталоги 56 прогонов намеренно не публикуются. Они не нужны, чтобы
посмотреть дизайн задач или повторить эксперимент, и только превращали бы репозиторий в
архив готовых ответов. Первичные usage-события тоже не сохранились, поэтому долларовые
оценки можно проверить внутри готового датасета, но нельзя независимо пересчитать с нуля.

## Задачи

| ID | Стек | Что строит агент | Видимых + скрытых тестов |
|---|---|---|---:|
| `t7-ts-formula` | TypeScript | движок формул: токенайзер, парсер, функции, ошибки | 61 + 45 |
| `t8-py-query` | Python | filter → sort → distinct → paginate → project | 29 + 22 |
| `t9-ts-vm` | TypeScript | интерпретатор стековой VM | 30 + 33 |
| `t10-py-cron` | Python | вычислитель cron-расписаний | 19 + 22 |

`heldout/` открыт в GitHub только для воспроизводимости grader. Не запускайте агента из
корня репозитория: скопируйте `fixture/` в отдельный каталог, чтобы скрытые тесты не попали
в его контекст.

## Как повторить один прогон

```bash
TASK=tasks/t7-ts-formula
WD="$(mktemp -d)"
cp -R "$TASK/fixture/." "$WD/"

git -C "$WD" init -q
git -C "$WD" add .
git -C "$WD" \
  -c user.name=bench \
  -c user.email=bench@example.invalid \
  commit -qm baseline

PROMPT="$(cat "$TASK/PROMPT.md")"
```

Запустите один из harness в `$WD`:

```bash
# Codex
CLEAN_CODEX_HOME="${TMPDIR:-/tmp}/codex-bench-home"
mkdir -p "$CLEAN_CODEX_HOME"
ln -sf "$HOME/.codex/auth.json" "$CLEAN_CODEX_HOME/auth.json"

# В новом CODEX_HOME нет глобальных MCP. Проверка должна вывести пустой список.
CODEX_HOME="$CLEAN_CODEX_HOME" codex mcp list

CODEX_HOME="$CLEAN_CODEX_HOME" codex exec \
  --sandbox workspace-write \
  -c approval_policy="never" \
  -m gpt-5.6-sol \
  -c model_reasoning_effort=medium \
  -C "$WD" "$PROMPT" < /dev/null

# opencode
opencode run --pure --auto \
  -m openai/gpt-5.6-sol \
  --variant medium \
  --format json \
  --dir "$WD" "$PROMPT"

# omp
omp -p \
  --model openai-codex/gpt-5.6-sol \
  --thinking medium \
  --mode json \
  --no-lsp --no-session \
  --cwd "$WD" "$PROMPT"
```

Затем запустите grader из корня репозитория:

```bash
bash "$TASK/grade.sh" "$WD"
```

Для TypeScript нужны `node` и `tsc`; для Python достаточно `python3`. Точные версии
исходного эксперимента перечислены в [ENVIRONMENT.md](ENVIRONMENT.md).

## Как считалась стоимость

Все harness работали по подпискам. Доллары в датасете — нормализованная оценка того,
сколько те же токены стоили бы в API, а не реальный платёж.

Для `codex*` и `oc*` использовалась формула:

```text
cost = ((input - cached_input) * 5
        + cached_input * 0.5
        + output * 30) / 1e6
```

Формула считала весь некэшированный вход по $5/M. [OpenAI тарифицирует cache writes по
1,25× от обычного input](https://developers.openai.com/api/docs/models/gpt-5.6-sol), то
есть по $6,25/M. Cache-write tokens не сохранились.

Погрешность касается только `codex*` и `oc*`. Для omp использован `usage.cost.total`
с дедупликацией по `responseId`, для Claude Code — `total_cost_usd`. В худшем мыслимом
случае весь некэшированный вход записывался в кэш:

| Связка | Датасет | Консервативный максимум |
|---|---:|---:|
| `codex56` | $3,77 | $4,29 |
| `oc56` | $5,28 | $6,27 |
| `omp56 / codex56` | 6,11× | 5,38× |

Реальное значение лежит между границами: часть входа была обычной, часть читалась из кэша
по $0,50/M.

`ccusage-codex` также вернул для `t9/r1/codex56` fallback $0,125. Это значение физически
невозможно: 5320 output tokens сами стоят $0,1596 до добавления входа. Независимый пересчёт
дал $0,4479, это значение записано в `metrics-710.json`.

## Ограничения

- Четыре авторские задачи и две реплики дают индикативный срез, а не оценку надёжности.
- Effort между всеми семью колонками не выровнен. Главный срез `codex56 / oc56 / omp56`
  сопоставим: модель и effort там одинаковые.
- Прогоны шли параллельно (`-P4`/`-P6`), поэтому wall time содержит шум конкуренции.
- Восемь Codex-ячеек t7/t8 используют `wall_src: proxy`, нижнюю оценку по таймстемпам.
- Первичных input/cache/cache-write tokens, usage-событий и каталогов прогонов в публичном
  репозитории нет.
- Данные привязаны к версиям на 2026-07-16 и быстро протухают.

## License

[MIT](LICENSE)
