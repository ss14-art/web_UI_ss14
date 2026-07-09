# Структура проекта

```
nova-ui/
├── index.html                       # Главная страница (терминал загрузки)
├── package.json                     # Зависимости и скрипты
├── vite.config.ts                   # Конфигурация сборщика Vite
├── svelte.config.js                 # Конфигурация Svelte (vitePreprocess)
├── tailwind.config.js               # Конфигурация Tailwind CSS
├── postcss.config.js                # Конфигурация PostCSS
├── tsconfig.json                    # Корневая конфигурация TS
├── tsconfig.app.json                # Конфигурация для приложения
├── tsconfig.node.json               # Конфигурация для Node.js (vite.config, scripts)
├── env.d.ts                         # Типы ImportMeta для Vite
├── .gitignore
│
├── scripts/                         # Скрипты сборки
│   ├── interface-types.ts           # Типы данных для модулей
│   └── scan-interfaces.ts           # Сканер директории интерфейсов
│
├── src/
│   ├── vite-env.d.ts                # Типы Svelte + Vite
│   ├── global.d.ts                  # Глобальный тип Window.fs
│   ├── app.css                      # Точка входа CSS (импортирует всё)
│   │
│   ├── lib/
│   │   └── novaBridge.ts            # Мост связи с хостом SS14
│   │
│   ├── styles/
│   │   ├── variables.css            # CSS-кастомные свойства
│   │   ├── base.css                 # Базовый сброс и стили
│   │   ├── animations.css           # Ключевые кадры анимаций
│   │   ├── utilities.css            # Вспомогательные классы
│   │   └── components/
│   │       ├── index-terminal.css   # Стили главного экрана
│   │       └── status-indicator.css # Стили индикаторов статуса
│   │
│   └── interfaces/                  # Директория модулей интерфейсов
│       └── <module-name>/           # Каждый модуль — отдельная папка
│           ├── index.html           # Точка входа модуля
│           ├── package.json         # Метаданные модуля
│           ├── main.ts              # Логика модуля
│           └── ...                  # Другие файлы модуля
│
└── docs/                            # Документация
    ├── 01-overview.md
    ├── 02-structure.md
    ├── 03-interfaces.md
    ├── 04-nova-bridge.md
    ├── 05-build-and-dev.md
    └── 06-configuration.md
```

## Директория `src/interfaces/`

Каждая поддиректория в `src/interfaces/` — это независимый модуль интерфейса. Минимальный набор файлов:

- **`index.html`** — HTML-страница модуля (обязательно)
- **`package.json`** — метаданные модуля (опционально):

```json
{
    "displayName": "Карта станции",
    "description": "Интерактивная карта станции",
    "icon": "🗺️",
    "status": "active"
}
```

Поля `status`:
- `active` — модуль активен и доступен
- `development` — в разработке (жёлтый индикатор)
- `deprecated` — устарел (красный, отключён)

## Главная страница `index.html`

При запуске приложения главная страница:
1. Отображает терминал загрузки с анимированной полосой прогресса
2. Выполняет запрос к `/api/interfaces` для получения списка модулей
3. Отображает найденные модули в виде сетки с индикаторами статуса
4. Каждый модуль — ссылка на свою страницу (кроме `deprecated`)
5. Внизу показывает статистику: всего/активных/в разработке
