# Система модулей интерфейсов

## Как работает обнаружение модулей

При старте dev-сервера или сборке Vite запускается скрипт `scripts/scan-interfaces.ts`, который сканирует директорию `src/interfaces/`.

### Алгоритм сканирования

1. Читает содержимое `src/interfaces/`
2. Фильтрует только директории (файлы игнорируются)
3. Для каждой директории проверяет наличие `index.html`
4. Если `index.html` отсутствует — директория пропускается с предупреждением
5. Если присутствует `package.json` — парсит метаданные (`displayName`, `description`, `icon`, `status`)
6. Парсит HTML в поисках тега `<title>` (как fallback для отображаемого имени)

### Типы данных

```typescript
// scripts/interface-types.ts

interface InterfaceMetadata {
    displayName?: string;     // Отображаемое имя (из package.json)
    description?: string;     // Описание модуля
    icon?: string;            // Иконка (эмодзи)
    status?: 'active' | 'development' | 'deprecated';
}

interface ScannedInterface {
    name: string;             // Имя директории
    title: string;            // Заголовок (displayName > <title> > name)
    description: string;      // Описание
    url: string;              // URL модуля (/src/interfaces/<name>/)
    path: string;             // Абсолютный путь на диске
    icon: string;             // Иконка
    status: string;           // Статус модуля
}
```

## Интеграция с Vite

В `vite.config.ts` результаты сканирования используются для:

### 1. Мульти-входная сборка

```typescript
const buildInputs: Record<string, string> = {
    main: resolve(process.cwd(), 'index.html'),
};

interfaces.forEach((iface) => {
    buildInputs[iface.name] = resolve(process.cwd(), `src/interfaces/${iface.name}/index.html`);
});
```

Каждый модуль получает собственную точку входа и собирается в отдельный JS-файл.

### 2. API endpoint `/api/interfaces`

Сервер Vite middleware обрабатывает GET `/api/interfaces` и возвращает JSON со всеми найденными модулями:

```json
{
    "interfaces": [
        {
            "name": "map",
            "title": "Карта станции",
            "description": "Интерактивная карта станции",
            "url": "/src/interfaces/map/",
            "path": "/abs/path/src/interfaces/map",
            "icon": "🗺️",
            "status": "active"
        }
    ]
}
```

### 3. Вывод в консоль

При запуске dev-сервера выводится список доступных модулей:

```
[NOVA SYSTEMS] INTERFACE MODULES:
[OK] Карта станции: http://localhost:5173/src/interfaces/map/
[DEV] Навигатор: http://localhost:5173/src/interfaces/navigator/
```

## Добавление нового модуля

1. Создайте директорию: `src/interfaces/my-module/`
2. Создайте `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Мой модуль</title>
    <link rel="stylesheet" href="/src/styles/variables.css">
    <link rel="stylesheet" href="/src/styles/base.css">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/src/interfaces/my-module/main.ts"></script>
</body>
</html>
```
3. Создайте `package.json` с метаданными
4. Перезапустите dev-сервер — модуль появится автоматически

## Ограничения директории модулей

- Вложенные директории любой глубины поддерживаются (но только первый уровень сканируется как модуль)
- Файлы в `src/interfaces/` игнорируются (только папки)
- require `index.html` обязателен, без него модуль не регистрируется
- Для Svelte-компонентов модуля нужно настроить импорты через алиас `$lib` или `@/`
