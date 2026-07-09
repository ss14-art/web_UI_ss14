# Сборка и разработка

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Production-сборка
npm run build
```

## Режим разработки (`npm run dev`)

Запускает Vite dev-сервер на `http://localhost:5173/`:

- HMR (Hot Module Replacement) для Svelte-компонентов
- API `/api/interfaces` со списком всех модулей
- Автоматическое определение порта (строго 5173)
- Вывод в консоль списка зарегистрированных модулей

```bash
$ npm run dev

[NOVA SYSTEMS] INTERFACE MODULES:
[*] MAIN: http://localhost:5173/
[OK] Карта станции: http://localhost:5173/src/interfaces/map/
[DEV] Навигатор: http://localhost:5173/src/interfaces/navigator/
```

### Проверка главной страницы

Откройте `http://localhost:5173/` — вы увидите терминал загрузки. Если модули найдены, они отобразятся в виде кликабельных карточек.

## Production-сборка (`npm run build`)

### Конфигурация сборки

| Параметр | Значение | Описание |
|----------|----------|----------|
| outDir | `../Resources/dist` | Директория для SS14 |
| target | `chrome89` | Целевой браузер (CEF) |
| minify | `terser` | Минификатор |
| sourcemap | `false` | Без карт исходников |
| cssCodeSplit | `false` | CSS в один файл |
| compact | `true` | Компактный вывод |

### Опции Terser (минификация)

```javascript
terserOptions: {
    compress: {
        drop_console: true,    // Удаляет console.log
        drop_debugger: true,   // Удаляет debugger
        passes: 2,             // Двойной проход
        dead_code: true,       // Удаляет мёртвый код
        conditionals: true,    // Оптимизирует условия
        evaluate: true,        // Вычисляет константы
        booleans: true,        // Оптимизирует булевы выражения
        loops: true,           // Оптимизирует циклы
        unused: true,          // Удаляет неиспользуемые переменные
        hoist_funs: true,      // Поднимает функции
        keep_fargs: false,     // Удаляет лишние аргументы
        inline: true,          // Инлайнит функции
        join_vars: true,       // Объединяет переменные
        reduce_vars: true,     // Сокращает переменные
        side_effects: true     // Удаляет код без побочных эффектов
    },
    mangle: { properties: false },  // Не минифицирует имена свойств
    format: { comments: false, ascii_only: true }
}
```

### Tree-shaking

```javascript
treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    annotations: true
}
```

### Вывод сборки

```
../Resources/dist/
├── index.html
├── assets/
│   ├── main-<hash>.js        # Главная страница
│   └── main-<hash>.css       # Все стили
└── src/
    └── interfaces/
        ├── <module>/
        │   ├── <module>-<hash>.js
        │   └── <module>.css
        └── ...
```

## ESLint и форматирование

Проект использует TypeScript со строгими настройками:

```json
// tsconfig.node.json (для скриптов и vite.config)
{
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
}
```

## Алиасы путей

| Алиас | Реальный путь |
|-------|---------------|
| `@/` | `./src/` |
| `$lib` | `./src/lib` |
| `$lib/*` | `./src/lib/*` |

```typescript
import { novaBridge } from '$lib/novaBridge';  // OK
import { novaBridge } from '@/lib/novaBridge';  // Тоже OK
```
