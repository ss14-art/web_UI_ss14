# Конфигурация проекта

## Стилизация

### Tailwind CSS (tailwind.config.js)

Тёмная терминальная тема с кастомными цветами:

```javascript
colors: {
    background: '#000000',
    surface: '#0a0a0a',
    'surface-hover': '#141414',
    border: '#2a2a2a',
    'border-light': '#3a3a3a',
    'border-heavy': '#4a4a4a',
    'text-primary': '#b8b8b8',
    'text-secondary': '#686868',
    'text-dim': '#484848',
    accent: '#4a9d4a',         // Зелёный (основной акцент)
    'accent-dim': '#2a6d2a',
    warning: '#9d7a4a',        // Жёлтый/оранжевый
    danger: '#9d4a4a',         // Красный
    info: '#4a7a9d'            // Синий
}
```

Шрифты, размеры и анимации также настроены под терминальный стиль.

### CSS-переменные (variables.css)

Полный набор кастомных свойств для консистентной стилизации:

- **Цвета**: фоны, поверхности, границы, текст, акценты, статусы
- **Типографика**: моноширинный шрифт, размеры от 10px до 16px
- **Отступы**: от 2px до 26px
- **Z-index**: от 1 до 9999 (base, dropdown, overlay, modal, tooltip, notification)
- **Переходы**: none, 150ms ease, 300ms ease

### Анимации (animations.css)

```css
@keyframes pulse {
    /* Пульсация (opacity 1 → 0.6 → 1) */
}

@keyframes loadProgress {
    /* Полоса загрузки (движение слева направо) */
}
```

### Сброс и база (base.css)

- `box-sizing: border-box` для всех элементов
- `image-rendering: pixelated` для пиксельной графики
- `text-transform: uppercase` — весь текст в верхнем регистре
- Кастомные скроллбары в стиле терминала
- Сброс стилей для a, button, input, textarea, select

### Компонентные стили

**index-terminal.css** — главный экран-терминал:
- `.terminal-container` — контейнер (max-width 900px, центрирование)
- `.boot-sequence` — блок с информацией о системе
- `.module-item` — карточка модуля с ховер-эффектом (стрелка `>`)
- `.loading-bar` — анимированная полоса загрузки
- `.system-stats` — блок статистики (total/active/dev)

**status-indicator.css** — индикаторы статуса:
- `.status-badge` — пульсирующий бейдж состояния
- `.status-badge.active` — зелёный (`color-success`)
- `.status-badge.warning` — жёлтый (`color-warning`)
- `.status-badge.error` — красный (`color-danger`)
- `.status-badge.inactive` — серый (`color-border`)

## Типы Svelte (vite-env.d.ts)

```typescript
/// <reference types="svelte" />
/// <reference types="vite/client" />
```

Добавляет поддержку типов Svelte и ImportMeta для Vite.

## Vite Config (vite.config.ts)

### Плагины

1. **`@sveltejs/vite-plugin-svelte`** — компиляция Svelte-компонентов
2. **show-routes** (кастомный) — middleware `/api/interfaces` + вывод маршрутов

### Dev-сервер

- Порт: `5173` (strict — не использует fallback)
- `fs.strict: true` — защита файловой системы

### Resolve

- Алиасы: `@` → `./src`, `$lib` → `./src/lib`
- Дедупликация Svelte (предотвращает дубли в node_modules)

### OptimizeDeps

- Исключает Svelte из pre-bundling
- Включает clsx для предварительной оптимизации

### ESBuild

- MinifyIdentifiers, syntax, whitespace включены
- LegalComments: none (удаляет комментарии лицензий)
