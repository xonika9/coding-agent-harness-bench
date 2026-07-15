Отрефактори сигнатуру функции логирования в этом TypeScript-проекте.

Сейчас `logEvent` принимает три позиционных аргумента:
`logEvent(name: string, level: Level, userId: string)`.

Нужно перевести её на единственный аргумент-объект, типизированный новым интерфейсом
с точным именем `LogEventInput`:

    export interface LogEventInput { name: string; level: Level; userId: string; }

    export function logEvent(event: LogEventInput): LogRecord

Обнови ВСЕ места вызова во всём проекте под новую сигнатуру. Поведение не меняй.

Правила:
- Правь только код в `src/`. Файлы в `test/` менять НЕЛЬЗЯ.
- Проверка типов: `tsc --noEmit -p tsconfig.json` (должно быть чисто).
- Тесты: `node --test 'test/**/*.test.ts'` (должны быть зелёные).
- Готово, когда типы чистые, тесты зелёные, а старая позиционная сигнатура нигде не осталась.
