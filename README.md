# nova-ui — Веб-интерфейс для SS14

**nova-ui** — это фреймворк модульных веб-интерфейсов для Space Station 14, построенный на Svelte 5, TypeScript и Vite 7. Проект предоставляет систему HTML/CSS/JS-оверлеев, работающих поверх игрового клиента через встроенный браузер (CEF/WebView).

## Документация

Полная документация находится в директории [`/docs`](./docs/):

| Раздел | Описание |
|--------|----------|
| [Обзор](./docs/01-overview.md) | Архитектура, стек, ключевые возможности |
| [Структура проекта](./docs/02-structure.md) | Описание всех файлов и директорий |
| [Система модулей](./docs/03-interfaces.md) | Как создавать и регистрировать интерфейсы |
| [NovaBridge](./docs/04-nova-bridge.md) | Протокол связи с нативным хостом SS14 |
| [Сборка и разработка](./docs/05-build-and-dev.md) | Запуск, сборка, конфигурация Vite |
| [Конфигурация](./docs/06-configuration.md) | Стили, Tailwind, TypeScript |

## Быстрый старт

```bash
npm install
npm run dev      # http://localhost:5173/
npm run build    # Production в ../Resources/dist
```

## Лицензия

Проприетарная. SS14 (Space Station 14).
