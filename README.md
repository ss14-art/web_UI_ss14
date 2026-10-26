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
| [Дизайн-система](./docs/design.md) | GlassUI, компоненты, доступность и спецификация Escape Menu |

## Быстрый старт

```bash
npm ci
npm run dev      # http://localhost:5173/
npm run build    # Production в ../Resources/dist
```

## Интеграция с игровым клиентом

Production-сборка обязательна перед запуском клиента: игра не подключается к Vite dev-серверу, а открывает собранные страницы из `Resources/dist` через внутренний `http://webui.local/` origin.

Например, Escape Menu загружается по адресу:

```text
http://webui.local/dist/src/interfaces/escape-menu/index.html
```

Перехватчик запросов на стороне C# (`NovaWebViewBridge`) перехватывает любой `http://webui.local/...` и раздаёт соответствующие файлы из `Resources/dist`. Мост NovaBridge использует `http://webui.local/__bridge__/...` для отправки событий в нативный хост.

После изменения файлов в `src/interfaces/` повторно запустите `npm run build`. Каталог `Resources/dist` является генерируемым результатом и не хранится в этом сабмодуле.

## Локальная разработка с игровым клиентом

Перед запуском `runclient*.bat` / `runclient*.sh` обязательно:

1. Собрать production bundle WebUI. По умолчанию MSBuild делает это автоматически при сборке `Content.Client` через цель `BuildWebUI`, если в `WebUI/package.json` есть зависимости. Если npm недоступен или нужно отключить авто-сборку, передайте `/p:BuildWebUI=false`:
   ```bash
   dotnet build Content.Client/Content.Client.csproj --configuration Tools
   # или с отключенным авто-сборщиком
   dotnet build Content.Client/Content.Client.csproj --configuration Tools /p:BuildWebUI=false
   ```
   При ручной сборке:
   ```bash
   cd WebUI
   npm ci
   npm run build
   ```
2. Пересобрать клиент, чтобы MSBuild скопировал `cef_resources` и `Robust.Client.WebView.exe` рядом с `Robust.Client.WebView.dll` в `bin/Content.Client/`.

После этого CEF сможет найти `cef_resources` и запустить браузерный subprocess.

### Частые ошибки

- **`Unable to locate cef_resources directory!`** — CEF-ресурсы не найдены рядом с `Robust.Client.WebView.dll`. Пересоберите клиент; убедитесь, что в `bin/Content.Client/cef_resources/` есть каталог `locales`.
- **Escape menu не открывается / белый экран** — проверьте, что `Resources/dist/src/interfaces/escape-menu/index.html` существует после `npm run build`.
- **`Network service crashed, restarting service.` на некоторых GPU/Windows** — в текущей версии CEF (131) встречается краш сетевого сервиса при мультипроцессном режиме. Временное обходное решение — запускать клиент с флагом `--single-process`:
  ```bash
  dotnet run --project Content.Client -- --single-process
  # или
  bin/Content.Client/Content.Client.exe --single-process
  ```

## Лицензия

Проприетарная. SS14 (Space Station 14).
